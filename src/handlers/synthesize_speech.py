"""POST /tts

Synchronous Polly synthesis for short-to-medium text (<=3000 characters,
Polly's own sync limit). Returns a playable presigned URL in the same
response - no polling needed for this path.

Longer documents need Polly's asynchronous StartSpeechSynthesisTask API
instead; that's flagged as a known limitation in the README rather than
built here, to keep the v1 scope tight.
"""
import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import boto3
from botocore.config import Config

_REGION = os.environ.get("AWS_REGION_NAME", "eu-west-2")
polly = boto3.client("polly")
s3 = boto3.client(
    "s3",
    region_name=_REGION,
    config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
)
dynamodb = boto3.resource("dynamodb")

BUCKET = os.environ["S3_BUCKET_NAME"]
TABLE = dynamodb.Table(os.environ["DYNAMODB_TABLE"])
JOB_TTL_DAYS = int(os.environ.get("JOB_TTL_DAYS", "90"))

MAX_CHARS = 3000
DEFAULT_VOICE = "Joanna"
ALLOWED_ENGINES = {"standard", "neural"}


def _response(status, body):
    return {"statusCode": status, "body": json.dumps(body)}


def _user_id(event):
    return event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]


def handler(event, context):
    try:
        user_id = _user_id(event)
        body = json.loads(event.get("body") or "{}")

        text = (body.get("text") or "").strip()
        voice_id = body.get("voiceId", DEFAULT_VOICE)
        engine = body.get("engine", "neural")
        text_type = "ssml" if body.get("isSsml") else "text"

        if not text:
            return _response(400, {"message": "'text' is required."})
        if len(text) > MAX_CHARS:
            return _response(400, {
                "message": f"Text is {len(text)} characters; the synchronous /tts "
                           f"endpoint supports up to {MAX_CHARS}. Split longer text "
                           f"into multiple requests."
            })
        if engine not in ALLOWED_ENGINES:
            return _response(400, {"message": f"engine must be one of {sorted(ALLOWED_ENGINES)}"})

        polly_response = polly.synthesize_speech(
            Text=text,
            TextType=text_type,
            OutputFormat="mp3",
            VoiceId=voice_id,
            Engine=engine,
        )

        job_id = str(uuid.uuid4())
        key = f"outputs/{user_id}/{job_id}.mp3"
        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=polly_response["AudioStream"].read(),
            ContentType="audio/mpeg",
        )
        audio_url = s3.generate_presigned_url(
            "get_object", Params={"Bucket": BUCKET, "Key": key}, ExpiresIn=3600
        )

        now = datetime.now(timezone.utc)
        TABLE.put_item(Item={
            "userId": user_id,
            "jobId": job_id,
            "type": "tts",
            "status": "completed",
            "inputTextPreview": text[:200],
            "voiceId": voice_id,
            "engine": engine,
            "audioKey": key,
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
            "expiresAt": int((now + timedelta(days=JOB_TTL_DAYS)).timestamp()),
        })

        return _response(200, {"jobId": job_id, "audioUrl": audio_url})

    except polly.exceptions.InvalidSsmlException:
        return _response(400, {"message": "Invalid SSML."})
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR synthesize_speech: {exc}")
        return _response(500, {"message": "Internal error synthesizing speech."})
