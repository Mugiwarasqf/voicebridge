"""GET /jobs and GET /jobs/{jobId}

Lists a user's TTS/STT job history (paginated, newest first) or fetches a
single job for status polling. Refreshes the presigned audio URL on every
read so links never go stale even though the underlying object doesn't move.
"""
import json
import os
from decimal import Decimal

import boto3
from botocore.config import Config
from boto3.dynamodb.conditions import Key, Attr

_REGION = os.environ.get("AWS_REGION_NAME", "eu-west-2")
s3 = boto3.client(
    "s3",
    region_name=_REGION,
    config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
)
dynamodb = boto3.resource("dynamodb")

BUCKET = os.environ["S3_BUCKET_NAME"]
TABLE = dynamodb.Table(os.environ["DYNAMODB_TABLE"])


def _response(status, body):
    return {"statusCode": status, "body": json.dumps(body, default=_decimal_default)}


def _decimal_default(o):
    if isinstance(o, Decimal):
        return int(o) if o % 1 == 0 else float(o)
    raise TypeError


def _user_id(event):
    return event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]


def _with_audio_url(item):
    key = item.get("audioKey")
    if key:
        item["audioUrl"] = s3.generate_presigned_url(
            "get_object", Params={"Bucket": BUCKET, "Key": key}, ExpiresIn=3600
        )
    return item


def handler(event, context):
    try:
        user_id = _user_id(event)
        path_params = event.get("pathParameters") or {}
        # amazonq-ignore-next-line
        job_id = path_params.get("jobId")

        if job_id:
            result = TABLE.get_item(Key={"userId": user_id, "jobId": job_id})
            item = result.get("Item")
            if not item:
                return _response(404, {"message": "Job not found."})
            return _response(200, _with_audio_url(item))

        qs = event.get("queryStringParameters") or {}
        limit = min(int(qs.get("limit", 20)), 100)
        job_type = qs.get("type")  # "tts" | "stt"

        query_kwargs = {
            "IndexName": "userId-createdAt-index",
            "KeyConditionExpression": Key("userId").eq(user_id),
            "ScanIndexForward": False,  # newest first
            "Limit": limit,
        }
        if qs.get("lastKey"):
            query_kwargs["ExclusiveStartKey"] = json.loads(qs["lastKey"])
        if job_type:
            query_kwargs["FilterExpression"] = Attr("type").eq(job_type)

        result = TABLE.query(**query_kwargs)
        jobs = [_with_audio_url(item) for item in result.get("Items", [])]

        next_key = result.get("LastEvaluatedKey")
        return _response(200, {
            "jobs": jobs,
            "nextKey": json.dumps(next_key) if next_key else None,
        })

    except Exception as exc:  # noqa: BLE001
        print(f"ERROR get_jobs: {exc}")
        return _response(500, {"message": "Internal error listing jobs."})
