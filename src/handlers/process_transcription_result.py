"""EventBridge trigger: "Transcribe Job State Change" (COMPLETED | FAILED).

Looks the finished job back up via GetTranscriptionJob to recover which
user/job it belongs to (we encode that in the S3 media URI, not the job
name), then either reads the transcript JSON Transcribe wrote to our bucket
or records the failure reason.
"""
import json
import os
from datetime import datetime, timezone
from typing import TYPE_CHECKING

import boto3

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client
    from mypy_boto3_transcribe import TranscribeServiceClient

_session = boto3.Session()
transcribe: "TranscribeServiceClient" = _session.client("transcribe")
s3: "S3Client" = _session.client("s3")
dynamodb = _session.resource("dynamodb")

TABLE = dynamodb.Table(os.environ["DYNAMODB_TABLE"])
BUCKET = os.environ["S3_BUCKET_NAME"]


def _parse_upload_uri(uri: str) -> tuple[str, str]:
    # s3://bucket/uploads/{userId}/{jobId}.{ext}
    key = uri.split("/", 3)[-1]
    _, user_id, filename = key.split("/", 2)
    job_id = filename.rsplit(".", 1)[0]
    return user_id, job_id


def handler(event: dict, context: object) -> None:
    detail = event.get("detail", {})
    job_name = detail.get("TranscriptionJobName")
    status = detail.get("TranscriptionJobStatus")

    if not job_name or status not in ("COMPLETED", "FAILED"):
        print(f"WARN ignoring event: {json.dumps(detail)}")
        return

    job = transcribe.get_transcription_job(TranscriptionJobName=job_name)["TranscriptionJob"]
    user_id, job_id = _parse_upload_uri(job["Media"]["MediaFileUri"])
    now = datetime.now(timezone.utc).isoformat()

    if status == "FAILED":
        TABLE.update_item(
            Key={"userId": user_id, "jobId": job_id},
            UpdateExpression="SET #s = :status, updatedAt = :now, errorMessage = :err",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":status": "failed",
                ":now": now,
                ":err": job.get("FailureReason", "Transcription failed"),
            },
        )
        return

    try:
        transcript_key = f"transcripts/{user_id}/{job_id}.json"
        obj = s3.get_object(Bucket=BUCKET, Key=transcript_key)
        payload = json.loads(obj["Body"].read())
        transcript_text = payload["results"]["transcripts"][0]["transcript"]
        detected_language = payload["results"].get("language_code")

        update_expr = "SET #s = :status, updatedAt = :now, transcriptText = :text"
        values = {":status": "completed", ":now": now, ":text": transcript_text}
        if detected_language:
            update_expr += ", languageCode = :lang"
            values[":lang"] = detected_language

        TABLE.update_item(
            Key={"userId": user_id, "jobId": job_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues=values,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR processing completed transcript for {job_id}: {exc}")
        TABLE.update_item(
            Key={"userId": user_id, "jobId": job_id},
            UpdateExpression="SET #s = :status, updatedAt = :now, errorMessage = :err",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":status": "failed",
                ":now": now,
                ":err": str(exc),
            },
        )
