# infra/terraform/outputs.tf

output "api_url" {
  description = "API Cloud Run URL"
  value       = module.cloud_run_api.service_url
}

output "line_bot_url" {
  description = "LINE Bot Cloud Run URL"
  value       = module.cloud_run_line_bot.service_url
}

output "artifact_registry_url" {
  description = "Artifact Registry URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${module.artifact_registry.repository_name}"
}

output "api_service_account_email" {
  description = "API サービスアカウントメール"
  value       = module.iam.api_service_account_email
}

output "deployer_service_account_email" {
  description = "CI/CD デプロイ用サービスアカウントメール"
  value       = module.iam.deployer_service_account_email
}
