resource "aws_cognito_user_pool" "main" {
  name = "${var.name_prefix}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "VoiceBridge - verify your email"
    email_message        = "Your verification code is {####}"
  }

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 5
      max_length = 254
    }
  }

  tags = {
    Name = "${var.name_prefix}-user-pool"
  }
}

resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.name_prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false # Required for a browser SPA

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
  ]

  # Hosted UI, implicit grant: the frontend has no backend to exchange an
  # auth code for tokens, so it takes the id_token straight back in the URL
  # fragment. callback_urls starts pointed at localhost - after the first
  # `terraform apply` prints the real cloudfront_url, add it to
  # oauth_callback_urls in terraform.tfvars and re-apply (see README).
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["implicit"]
  allowed_oauth_scopes                 = ["openid", "email"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = var.oauth_callback_urls
  logout_urls                          = var.oauth_callback_urls

  prevent_user_existence_errors = "ENABLED"

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}

# ── Lambda execution role -- identity only. The permissions policy lives in
# the compute module, next to the resources it grants access to (see
# aws_iam_role_policy.lambda_permissions in modules/compute/lambda.tf).
# This role needs no inputs from compute or database, so it can safely live
# here; the app-specific policy needs ARNs from both of those modules and
# would create a security -> compute -> security cycle if it lived here too
# (the same class of problem modules/compute/storage.tf's uploads-trigger
# comment documents for the S3<->Lambda wiring).
resource "aws_iam_role" "lambda_exec" {
  name = "${var.name_prefix}-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_region" "current" {}
