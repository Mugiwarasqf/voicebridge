resource "random_id" "frontend_bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "site" {
  bucket = "${var.name_prefix}-site-${random_id.frontend_bucket_suffix.hex}"
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.name_prefix}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # North America + Europe

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # SPA-style fallback: unknown paths still resolve to index.html
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

resource "aws_s3_bucket_policy" "cloudfront_read" {
  bucket = aws_s3_bucket.site.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontServicePrincipal"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.site.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.site.arn
        }
      }
    }]
  })
}

# index.html is templated with the API/Cognito config so the SPA needs zero
# build step - just deploy static files with real values baked in.
resource "aws_s3_object" "index" {
  bucket = aws_s3_bucket.site.id
  key    = "index.html"
  content = templatefile("${path.module}/../../../frontend/index.html.tpl", {
    api_base_url         = aws_apigatewayv2_stage.main.invoke_url
    cognito_user_pool_id = var.cognito_user_pool_id
    cognito_client_id    = var.cognito_user_pool_client_id
    cognito_domain       = var.cognito_domain
    aws_region           = var.aws_region
  })
  content_type = "text/html"
  etag = md5(templatefile("${path.module}/../../../frontend/index.html.tpl", {
    api_base_url         = aws_apigatewayv2_stage.main.invoke_url
    cognito_user_pool_id = var.cognito_user_pool_id
    cognito_client_id    = var.cognito_user_pool_client_id
    cognito_domain       = var.cognito_domain
    aws_region           = var.aws_region
  }))
}

resource "aws_s3_object" "app_js" {
  bucket       = aws_s3_bucket.site.id
  key          = "app.js"
  source       = "${path.module}/../../../frontend/app.js"
  content_type = "application/javascript"
  etag         = filemd5("${path.module}/../../../frontend/app.js")
}

resource "aws_s3_object" "styles_css" {
  bucket       = aws_s3_bucket.site.id
  key          = "styles.css"
  source       = "${path.module}/../../../frontend/styles.css"
  content_type = "text/css"
  etag         = filemd5("${path.module}/../../../frontend/styles.css")
}
