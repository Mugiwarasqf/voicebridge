output "cloudfront_url" {
  description = "Public URL of the VoiceBridge web app."
  value       = module.compute.cloudfront_url
}

output "cloudfront_distribution_id" {
  description = "Used by CI to invalidate the CDN cache after a deploy."
  value       = module.compute.cloudfront_distribution_id
}

output "api_base_url" {
  description = "Base URL of the HTTP API."
  value       = module.compute.api_endpoint
}

output "cognito_user_pool_id" {
  value = module.security.user_pool_id
}

output "cognito_user_pool_client_id" {
  value = module.security.user_pool_client_id
}

output "cognito_domain" {
  description = "Cognito Hosted UI domain prefix, e.g. for local frontend dev's window.VB_CONFIG.cognitoDomain."
  value       = module.security.user_pool_domain
}

output "audio_bucket_name" {
  value = module.compute.audio_bucket_name
}

output "jobs_table_name" {
  value = module.database.table_name
}
