# infra/terraform/modules/iam/main.tf

variable "project_id" { type = string }
variable "service_account_ids" {
  type = object({
    api      = string
    deployer = string
  })
}

# API ランタイム用サービスアカウント
resource "google_service_account" "api" {
  project      = var.project_id
  account_id   = var.service_account_ids.api
  display_name = "AI Chatbot API Runtime"
  description  = "Service account for Cloud Run API runtime"
}

# CI/CD デプロイ用サービスアカウント
resource "google_service_account" "deployer" {
  project      = var.project_id
  account_id   = var.service_account_ids.deployer
  display_name = "AI Chatbot CI/CD Deployer"
  description  = "Service account for GitHub Actions deployment"
}

# API SA に Secret Manager アクセス権限
resource "google_project_iam_member" "api_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Deployer SA に Cloud Run デプロイ権限
resource "google_project_iam_member" "deployer_run" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# Deployer SA に Artifact Registry 書き込み権限
resource "google_project_iam_member" "deployer_artifact" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# Deployer SA が API SA として Cloud Run サービスをデプロイできるよう設定
resource "google_service_account_iam_member" "deployer_act_as_api" {
  service_account_id = google_service_account.api.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}

output "api_service_account_email" {
  value = google_service_account.api.email
}

output "deployer_service_account_email" {
  value = google_service_account.deployer.email
}
