output "cloudfront_url" {
  value = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_stage.main.invoke_url
}

output "audio_bucket_name" {
  value = aws_s3_bucket.audio.bucket
}

output "audio_bucket_arn" {
  value = aws_s3_bucket.audio.arn
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.site.bucket
}
