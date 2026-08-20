# HTTP API (v2), not REST API (v1): ~3.5x cheaper per million requests, and it
# supports a native Cognito JWT authorizer + built-in CORS handling, so there's
# no REST-API-style OPTIONS/MOCK boilerplate needed here. Trade-off: no request
# validation or per-method throttling like REST API offers - fine for this
# workload since Lambda does its own input validation.

resource "aws_apigatewayv2_api" "main" {
  name          = "${var.name_prefix}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [var.cors_allowed_origin]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.name_prefix}-cognito-jwt"

  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = var.cognito_issuer_url
  }
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
    })
  }

  default_route_settings {
    throttling_burst_limit = 20
    throttling_rate_limit  = 10
  }
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.name_prefix}"
  retention_in_days = 14
}

locals {
  routes = {
    "POST /tts" = {
      lambda_invoke_arn = aws_lambda_function.synthesize_speech.invoke_arn
      lambda_name       = aws_lambda_function.synthesize_speech.function_name
    }
    "POST /stt/uploads" = {
      lambda_invoke_arn = aws_lambda_function.get_upload_url.invoke_arn
      lambda_name       = aws_lambda_function.get_upload_url.function_name
    }
    "GET /jobs" = {
      lambda_invoke_arn = aws_lambda_function.get_jobs.invoke_arn
      lambda_name       = aws_lambda_function.get_jobs.function_name
    }
    "GET /jobs/{jobId}" = {
      lambda_invoke_arn = aws_lambda_function.get_jobs.invoke_arn
      lambda_name       = aws_lambda_function.get_jobs.function_name
    }
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  for_each = local.routes

  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST" # Required for Lambda proxy integrations regardless of the route's own HTTP method
  integration_uri        = each.value.lambda_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "route" {
  for_each = local.routes

  api_id             = aws_apigatewayv2_api.main.id
  route_key          = each.key
  target             = "integrations/${aws_apigatewayv2_integration.lambda[each.key].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_lambda_permission" "apigw_invoke" {
  for_each = local.routes

  statement_id  = "AllowAPIGatewayInvoke-${replace(replace(replace(replace(each.key, " ", "-"), "/", "_"), "{", ""), "}", "")}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.lambda_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
