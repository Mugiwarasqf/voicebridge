output "bucket_name" {
  value = aws_s3_bucket.audio.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.audio.arn
}
