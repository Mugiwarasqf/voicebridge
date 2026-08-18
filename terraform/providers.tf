terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state is deliberately NOT wired up by default so this repo works
  # out of the box with `terraform init` on a fresh clone. Once you're past
  # solo prototyping, create the bucket + lock table once (see README →
  # "One-time setup") and uncomment this block.
  #
  # backend "s3" {
  #   bucket         = "voicebridge-tfstate"
  #   key            = "voicebridge/terraform.tfstate"
  #   region         = "eu-west-2"
  #   dynamodb_table = "voicebridge-tf-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
