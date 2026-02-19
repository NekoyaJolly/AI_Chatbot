# infra/terraform/modules/secret-manager/main.tf

variable "project_id" { type = string }
variable "secrets" { type = list(string) }

# Secret Manager API 有効化
resource "google_project_service" "secretmanager" {
  project = var.project_id
  service = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# 各シークレット作成 (値は CI/CD から gcloud secrets versions add で設定)
resource "google_secret_manager_secret" "secrets" {
  for_each  = toset(var.secrets)
  project   = var.project_id
  secret_id = each.value

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

# プレースホルダー値 (初回 terraform apply 用)
resource "google_secret_manager_secret_version" "placeholder" {
  for_each    = toset(var.secrets)
  secret      = google_secret_manager_secret.secrets[each.value].id
  secret_data = "REPLACE_ME"

  lifecycle {
    ignore_changes = [secret_data]  # Terraform 外の変更を保護
  }
}

# シークレットの最新バージョンの resource name を output
output "secret_versions" {
  value = {
    for k in var.secrets :
    k => "projects/${var.project_id}/secrets/${k}/versions/latest"
  }
  sensitive = true
}
