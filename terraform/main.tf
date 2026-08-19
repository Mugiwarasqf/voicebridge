locals {
  name_prefix = "${var.project}-${var.environment}"
}

# ── Lambda source packaging ─────────────────────────────────────────────────
data "archive_file" "get_upload_url" {
  type        = "zip"
  source_file = "${path.module}/../src/handlers/get_upload_url.py"
  output_path = "${path.module}/.builds/get_upload_url.zip"
}

data "archive_file" "start_transcription" {
  type        = "zip"
  source_file = "${path.module}/../src/handlers/start_transcription.py"
  output_path = "${path.module}/.builds/start_transcription.zip"
}

data "archive_file" "process_transcription_result" {
  type        = "zip"
  source_file = "${path.module}/../src/handlers/process_transcription_result.py"
  output_path = "${path.module}/.builds/process_transcription_result.zip"
}

data "archive_file" "synthesize_speech" {
  type        = "zip"
  source_file = "${path.module}/../src/handlers/synthesize_speech.py"
  output_path = "${path.module}/.builds/synthesize_speech.zip"
}

data "archive_file" "get_jobs" {
  type        = "zip"
  source_file = "${path.module}/../src/handlers/get_jobs.py"
  output_path = "${path.module}/.builds/get_jobs.zip"
}

# ── Modules ──────────────────────────────────────────────────────────────────
# network/database/security are leaves; compute depends on security (Cognito
# + the Lambda exec role) and database (table ARN/name). This keeps the graph
# one-directional -- see modules/security/main.tf and modules/compute/lambda.tf
# for why the Lambda IAM role and its policy are deliberately split across
# that boundary instead of both living in security.

module "network" {
  source = "./modules/network"

  name_prefix = local.name_prefix
}

module "database" {
  source = "./modules/database"

  name_prefix = local.name_prefix
}

module "security" {
  source = "./modules/security"

  name_prefix           = local.name_prefix
  cognito_domain_prefix = var.cognito_domain_prefix
  oauth_callback_urls   = var.oauth_callback_urls
}

module "compute" {
  source = "./modules/compute"

  name_prefix          = local.name_prefix
  environment          = var.environment
  aws_region           = var.aws_region
  cors_allowed_origin  = var.cors_allowed_origin
  audio_retention_days = var.audio_retention_days
  audio_expiry_days    = var.audio_expiry_days
  log_retention_days   = var.log_retention_days
  job_ttl_days         = var.job_ttl_days
  alert_email          = var.alert_email

  lambda_exec_role_arn  = module.security.lambda_exec_role_arn
  lambda_exec_role_name = module.security.lambda_exec_role_name
  dynamodb_table_arn    = module.database.table_arn
  dynamodb_table_name   = module.database.table_name

  cognito_user_pool_id        = module.security.user_pool_id
  cognito_user_pool_client_id = module.security.user_pool_client_id
  cognito_issuer_url          = module.security.issuer_url
  cognito_domain              = module.security.user_pool_domain

  get_upload_url_zip                    = data.archive_file.get_upload_url.output_path
  get_upload_url_zip_hash               = data.archive_file.get_upload_url.output_base64sha256
  start_transcription_zip               = data.archive_file.start_transcription.output_path
  start_transcription_zip_hash          = data.archive_file.start_transcription.output_base64sha256
  process_transcription_result_zip      = data.archive_file.process_transcription_result.output_path
  process_transcription_result_zip_hash = data.archive_file.process_transcription_result.output_base64sha256
  synthesize_speech_zip                 = data.archive_file.synthesize_speech.output_path
  synthesize_speech_zip_hash            = data.archive_file.synthesize_speech.output_base64sha256
  get_jobs_zip                          = data.archive_file.get_jobs.output_path
  get_jobs_zip_hash                     = data.archive_file.get_jobs.output_base64sha256
}
