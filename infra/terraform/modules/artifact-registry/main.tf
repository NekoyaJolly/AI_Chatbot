# infra/terraform/modules/artifact-registry/main.tf

variable "project_id" { type = string }
variable "region" { type = string }

resource "google_artifact_registry_repository" "docker" {
  project       = var.project_id
  location      = var.region
  repository_id = "ai-chatbot"
  description   = "AI Chatbot SaaS Docker images"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-minimum-versions"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  cleanup_policies {
    id     = "delete-old-untagged"
    action = "DELETE"
    condition {
      tag_state    = "UNTAGGED"
      older_than   = "604800s" # 7 days
    }
  }
}

output "repository_name" {
  value = google_artifact_registry_repository.docker.repository_id
}

output "repository_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}
