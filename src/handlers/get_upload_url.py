"""POST /stt/uploads

Issues a presigned S3 PUT URL so the browser uploads audio directly to S3,
bypassing API Gateway's 10MB payload limit entirely. Also creates the
DynamoDB job record the client will poll (GET /jobs/{jobId}) until
process_transcription_result.py marks it complete.
"""
import json
import os
import time
import uuid
from datetime import datetime, timedelta, timezone

import boto3
from botocore.config import Config

_REGION = os.environ.get("AWS_REGION_NAME", "eu-west-2")
s3 = boto3.client(
    "s3",
    region_name=_REGION,
    config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
)
dynamodb = boto3.resource("dynamodb")

BUCKET = os.environ["S3_BUCKET_NAME"]
TABLE = dynamodb.Table(os.environ["DYNAMODB_TABLE"])
JOB_TTL_DAYS = int(os.environ.get("JOB_TTL_DAYS", "90"))

# Extension -> (Transcribe MediaFormat, S3 Content-Type)
SUPPORTED_FORMATS = {
    "mp3": ("mp3", "audio/mpeg"),
    "mp4": ("mp4", "audio/mp4"),
    "m4a": ("mp4", "audio/mp4"),
    "wav": ("wav", "audio/wav"),
    "flac": ("flac", "audio/flac"),
    "ogg": ("ogg", "audio/ogg"),
    "webm": ("webm", "audio/webm"),
    "amr": ("amr", "audio/amr"),
}


def _response(status, body):
    return {"statusCode": status, "body": json.dumps(body)}


def _user_id(event):
    return event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]


def handler(event, context):
    try:
        user_id = _user_id(event)
        body = json.loads(event.get("body") or "{}")

        filename = body.get("filename", "")
        language_code = body.get("languageCode")  # None -> auto-detect
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext not in SUPPORTED_FORMATS:
            return _response(400, {
                "message": f"Unsupported audio format '.{ext}'. "
                           f"Supported: {', '.join(sorted(SUPPORTED_FORMATS))}"
            })

        media_format, content_type = SUPPORTED_FORMATS[ext]
        job_id = str(uuid.uuid4())
        key = f"uploads/{user_id}/{job_id}.{ext}"

        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": BUCKET, "Key": key},
            ExpiresIn=300,
        )

        now = datetime.now(timezone.utc)
        TABLE.put_item(Item={
            "userId": user_id,
            "jobId": job_id,
            "type": "stt",
            "status": "awaiting_upload",
            "mediaFormat": media_format,
            "languageCode": language_code or "auto",
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
            "expiresAt": int((now + timedelta(days=JOB_TTL_DAYS)).timestamp()),
        })

        return _response(201, {
            "jobId": job_id,
            "uploadUrl": upload_url,
            "audioKey": key,
            "message": "PUT your audio file to uploadUrl, then poll GET /jobs/{jobId}.",
        })

    except Exception as exc:  # noqa: BLE001
        print(f"ERROR get_upload_url: {exc}")
        return _response(500, {"message": "Internal error creating upload URL."})
