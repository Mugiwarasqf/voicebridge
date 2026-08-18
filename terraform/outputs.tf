output "cloudfront_url" {
  description = "Public URL of the VoiceBridge web app."
  value       = module.frontend.cloudfront_url
}

output "cloudfront_distribution_id" {
  description = "Used by CI to invalidate the CDN cache after a deploy."
  value       = module.frontend.cloudfront_distribution_id
}

output "api_base_url" {
  description = "Base URL of the HTTP API."
  value       = module.api_gateway.api_endpoint
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  value = module.cognito.user_pool_client_id
}

output "audio_bucket_name" {
  value = module.s3.bucket_name
}

output "jobs_table_name" {
  value = module.dynamodb.table_name
}
