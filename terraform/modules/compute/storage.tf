# Single bucket, three logical prefixes:
#   uploads/{userId}/{jobId}.<ext>      raw audio uploaded by the client for STT
#   outputs/{userId}/{jobId}.mp3        synthesized speech from Polly (TTS)
#   transcripts/{userId}/{jobId}.json   raw Transcribe job output (written by Transcribe itself)
#
# The uploads/ -> Lambda trigger is wired up in lambda.tf (not here): it
# needs the start_transcription Lambda's ARN, which now lives in the same
# module, so there's no cross-module cycle concern here anymore.

resource "random_id" "audio_bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "audio" {
  bucket = "${var.name_prefix}-audio-${random_id.audio_bucket_suffix.hex}"

  tags = {
    Name = "${var.name_prefix}-audio"
  }
}

resource "aws_s3_bucket_public_access_block" "audio" {
  bucket                  = aws_s3_bucket.audio.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audio" {
  bucket = aws_s3_bucket.audio.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "audio" {
  bucket = aws_s3_bucket.audio.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "audio" {
  bucket = aws_s3_bucket.audio.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET"]
    allowed_origins = [var.cors_allowed_origin]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "audio" {
  bucket = aws_s3_bucket.audio.id

  rule {
    id     = "expire-audio"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = var.audio_retention_days
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = var.audio_expiry_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}
