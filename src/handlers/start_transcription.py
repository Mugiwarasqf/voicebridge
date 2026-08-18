"""S3 trigger on uploads/* (any ObjectCreated event).

Reads the job's language preference off DynamoDB, then kicks off an
asynchronous Amazon Transcribe job. Transcribe writes its result JSON
straight to our own bucket (transcripts/{userId}/{jobId}.json), and emits a
"Transcribe Job State Change" event on completion which EventBridge routes
to process_transcription_result.py.
"""
import os
import urllib.parse
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

transcribe = boto3.client("transcribe")
dynamodb = boto3.resource("dynamodb")

BUCKET = os.environ["S3_BUCKET_NAME"]
TABLE = dynamodb.Table(os.environ["DYNAMODB_TABLE"])
ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")

VALID_MEDIA_FORMATS = {"mp3", "mp4", "wav", "flac", "ogg", "amr", "webm"}


def _parse_upload_key(key):
    # uploads/{userId}/{jobId}.{ext}
    _, user_id, filename = key.split("/", 2)
    job_id, ext = filename.rsplit(".", 1)
    return user_id, job_id, ext


def handler(event, context):
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

        if bucket != BUCKET:
            print(f"WARN skipping event for unexpected bucket: {bucket}")
            continue

        try:
            user_id, job_id, ext = _parse_upload_key(key)
        except ValueError:
            print(f"WARN skipping unrecognised key: {key}")
            continue

        item = TABLE.get_item(Key={"userId": user_id, "jobId": job_id}).get("Item")
        language_code = (item or {}).get("languageCode", "auto")
        media_format = (item or {}).get("mediaFormat", ext).lower()

        job_name = f"voicebridge-{ENVIRONMENT}-{job_id}"
        transcript_key = f"transcripts/{user_id}/{job_id}.json"

        if media_format not in VALID_MEDIA_FORMATS:
            print(f"ERROR unsupported media format '{media_format}' for {job_id}")
            TABLE.update_item(
                Key={"userId": user_id, "jobId": job_id},
                UpdateExpression="SET #s = :status, updatedAt = :now, errorMessage = :err",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":status": "failed",
                    ":now": datetime.now(timezone.utc).isoformat(),
                    ":err": f"Unsupported media format: {media_format}",
                },
            )
            continue

        kwargs = {
            "TranscriptionJobName": job_name,
            "Media": {"MediaFileUri": f"s3://{bucket}/{key}"},
            "MediaFormat": media_format,
            "OutputBucketName": bucket,
            "OutputKey": transcript_key,
        }
        if language_code and language_code != "auto":
            kwargs["LanguageCode"] = language_code
        else:
            kwargs["IdentifyLanguage"] = True

        try:
            transcribe.start_transcription_job(**kwargs)
            TABLE.update_item(
                Key={"userId": user_id, "jobId": job_id},
                UpdateExpression="SET #s = :status, updatedAt = :now, transcribeJobName = :jobName",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":status": "processing",
                    ":now": datetime.now(timezone.utc).isoformat(),
                    ":jobName": job_name,
                },
            )
        except Exception as exc:  # noqa: BLE001
            if isinstance(exc, ClientError) and exc.response.get("Error", {}).get("Code") == "ConflictException":
                print(f"WARN transcription job {job_name} already exists, skipping")
                continue
            print(f"ERROR starting transcription for {job_id}: {exc}")
            TABLE.update_item(
                Key={"userId": user_id, "jobId": job_id},
                UpdateExpression="SET #s = :status, updatedAt = :now, errorMessage = :err",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":status": "failed",
                    ":now": datetime.now(timezone.utc).isoformat(),
                    ":err": str(exc),
                },
            )
