# infra/terraform/variables.tf

variable "project_id" {
  description = "GCP プロジェクト ID"
  type        = string
  default     = "ai-chatbot-487823"
}

variable "region" {
  description = "GCP リージョン"
  type        = string
  default     = "asia-northeast1"  # 東京
}

variable "frontend_url" {
  description = "フロントエンド URL (Vercel)"
  type        = string
  default     = "https://ai-chatbot.vercel.app"
}

variable "default_tenant_id" {
  description = "LINE Bot デフォルトテナントID"
  type        = string
  default     = ""
}

variable "service_account_ids" {
  description = "サービスアカウント識別子"
  type = object({
    api      = string
    deployer = string
  })
  default = {
    api      = "ai-chatbot-api"
    deployer = "ai-chatbot-deployer"
  }
}

variable "secrets" {
  description = "Secret Manager に登録するシークレット名一覧"
  type        = list(string)
  default = [
    "DATABASE_URL",
    "GEMINI_API_KEY",
    "JWT_SECRET",
    "NEXTAUTH_SECRET",
    "LINE_CHANNEL_SECRET",
    "LINE_CHANNEL_ACCESS_TOKEN",
    "INTERNAL_API_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ]
}
