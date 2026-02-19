# infra/terraform/main.tf
# W4-deploy: GCP インフラストラクチャ定義 (Cloud Run, Artifact Registry, Secret Manager, IAM)

terraform {
  required_version = ">= 1.9.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.0"
    }
  }

  # State をGCS バケットで管理 (本番環境)
  backend "gcs" {
    bucket = "ai-chatbot-487823-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# ─── ローカルモジュール呼び出し ─────────────────────────────────────────────────

module "artifact_registry" {
  source     = "./modules/artifact-registry"
  project_id = var.project_id
  region     = var.region
}

module "secret_manager" {
  source     = "./modules/secret-manager"
  project_id = var.project_id
  secrets    = var.secrets
}

module "iam" {
  source              = "./modules/iam"
  project_id          = var.project_id
  service_account_ids = var.service_account_ids
}

module "cloud_run_api" {
  source              = "./modules/cloud-run"
  project_id          = var.project_id
  region              = var.region
  service_name        = "ai-chatbot-api"
  image               = "${var.region}-docker.pkg.dev/${var.project_id}/${module.artifact_registry.repository_name}/api:latest"
  port                = 8080
  min_instances       = 0
  max_instances       = 10
  memory              = "512Mi"
  cpu                 = "1"
  service_account     = module.iam.api_service_account_email
  environment_vars    = {
    NODE_ENV        = "production"
    PORT            = "8080"
    FRONTEND_URL    = var.frontend_url
    DATABASE_URL    = module.secret_manager.secret_versions["DATABASE_URL"]
    GEMINI_API_KEY  = module.secret_manager.secret_versions["GEMINI_API_KEY"]
    JWT_SECRET      = module.secret_manager.secret_versions["JWT_SECRET"]
    INTERNAL_API_SECRET = module.secret_manager.secret_versions["INTERNAL_API_SECRET"]
  }
  depends_on = [module.artifact_registry, module.iam, module.secret_manager]
}

module "cloud_run_line_bot" {
  source          = "./modules/cloud-run"
  project_id      = var.project_id
  region          = var.region
  service_name    = "ai-chatbot-line-bot"
  image           = "${var.region}-docker.pkg.dev/${var.project_id}/${module.artifact_registry.repository_name}/line-bot:latest"
  port            = 8080
  min_instances   = 0
  max_instances   = 5
  memory          = "256Mi"
  cpu             = "1"
  service_account = module.iam.api_service_account_email
  environment_vars = {
    NODE_ENV                  = "production"
    PORT                      = "8080"
    LINE_CHANNEL_SECRET       = module.secret_manager.secret_versions["LINE_CHANNEL_SECRET"]
    LINE_CHANNEL_ACCESS_TOKEN = module.secret_manager.secret_versions["LINE_CHANNEL_ACCESS_TOKEN"]
    API_INTERNAL_URL          = module.cloud_run_api.service_url
    DEFAULT_TENANT_ID         = var.default_tenant_id
    INTERNAL_API_SECRET       = module.secret_manager.secret_versions["INTERNAL_API_SECRET"]
  }
  depends_on = [module.cloud_run_api]
}
