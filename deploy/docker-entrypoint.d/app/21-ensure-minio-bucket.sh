#!/bin/sh
set -e ${DEBUG:+-x}

echo >&3 "=> Checking MinIO bucket setup..."

if [ "${MINIO_SKIP:-0}" = "1" ]; then
    echo >&3 "=> MinIO is disabled (MINIO_SKIP=1), skipping bucket setup"
    exit 0
fi

if [ -z "$MINIO_STORAGE_ENDPOINT" ] || [ -z "$MINIO_STORAGE_BUCKET_NAME" ]; then
    echo >&3 "=> MinIO not configured, skipping bucket setup"
    exit 0
fi

echo >&3 "=> Waiting for MinIO to be ready..."

python3 << 'EOF'
import os
import sys
import time

try:
    import boto3
    from botocore.exceptions import ClientError, EndpointConnectionError
except ImportError as e:
    print(f"Failed to import required libraries: {e}")
    sys.exit(1)

endpoint = os.environ.get('MINIO_STORAGE_ENDPOINT')
bucket_name = os.environ.get('MINIO_STORAGE_BUCKET_NAME')
access_key = os.environ.get('MINIO_STORAGE_ACCESS_KEY')
secret_key = os.environ.get('MINIO_STORAGE_SECRET_KEY')

if not all([endpoint, bucket_name, access_key, secret_key]):
    print("Missing required MinIO configuration")
    sys.exit(1)

client = boto3.client(
    's3',
    endpoint_url=endpoint,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key
)

max_attempts = 30
attempt = 0

while attempt < max_attempts:
    try:
        attempt += 1
        client.list_buckets()
        print(f"MinIO is ready")
        break
    except (ClientError, EndpointConnectionError, Exception) as e:
        if attempt >= max_attempts:
            print(f"MinIO failed to become ready after {max_attempts} attempts")
            sys.exit(1)
        print(f"MinIO is unavailable - sleeping... (attempt {attempt}/{max_attempts})")
        time.sleep(1)

print(f"Ensuring bucket '{bucket_name}' exists...")

try:
    client.head_bucket(Bucket=bucket_name)
    print(f"Bucket '{bucket_name}' already exists")
except ClientError as e:
    error_code = e.response.get('Error', {}).get('Code', '')
    if error_code == '404':
        print(f"Creating bucket '{bucket_name}'...")
        client.create_bucket(Bucket=bucket_name)
        print(f"Bucket '{bucket_name}' created successfully")
    else:
        print(f"Error checking bucket: {e}")
        sys.exit(1)

print("MinIO bucket setup completed")
EOF

echo >&3 "=> MinIO bucket setup completed."