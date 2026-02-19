# infra/terraform/modules/cloud-run/main.tf
# Cloud Run サービス モジュール

variable "project_id" { type = string }
variable "region" { type = string }
variable "service_name" { type = string }
variable "image" { type = string }
variable "port" { type = number; default = 8080 }
variable "min_instances" { type = number; default = 0 }
variable "max_instances" { type = number; default = 10 }
variable "memory" { type = string; default = "512Mi" }
variable "cpu" { type = string; default = "1" }
variable "service_account" { type = string }
variable "environment_vars" { type = map(string); default = {} }

resource "google_cloud_run_v2_service" "service" {
  name     = var.service_name
  location = var.region
  project  = var.project_id

  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = var.service_account

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image

      ports {
        container_port = var.port
      }

      resources {
        limits = {
          memory = var.memory
          cpu    = var.cpu
        }
        cpu_idle          = true   # コールドスタート許容 (コスト削減)
        startup_cpu_boost = true
      }

      dynamic "env" {
        for_each = var.environment_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = var.port
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 10
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = var.port
        }
        period_seconds = 30
      }
    }
  }
}

# パブリックアクセス許可 (LINE webhook は公開エンドポイントが必要)
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "service_url" {
  value = google_cloud_run_v2_service.service.uri
}
