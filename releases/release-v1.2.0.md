# Release v1.2.0

## Automatic MinIO Bucket Creation on Deployment

### New Features

#### Auto-Provisioning MinIO Storage Bucket

Implemented automatic MinIO bucket creation during container initialization, eliminating manual setup requirements for object storage.

**Implementation:**
- Added entrypoint script `deploy/docker-entrypoint.d/app/21-ensure-minio-bucket.sh`
- Script executes after database wait but before Django migrations
- Reads bucket name from `MINIO_STORAGE_BUCKET_NAME` environment variable
- Includes MinIO readiness check with 30-second timeout and retry logic
- Idempotent operation - safely handles pre-existing buckets

**Behavior:**
- Waits for MinIO service availability using `list_buckets()` health check
- Creates bucket only if it does not exist (using `head_bucket()` check)
- Skips execution if `MINIO_SKIP=1` or MinIO configuration is absent
- Logs all actions to container output for troubleshooting

**Technical Details:**
- Uses boto3 S3 client with MinIO endpoint configuration
- Handles connection errors during MinIO startup phase
- Runs in app container before main application starts
- Executable shell script with embedded Python for boto3 operations

### Impact

- Eliminates manual bucket creation step in deployment workflow
- Reduces deployment errors from missing storage buckets
- Ensures storage infrastructure is ready before application startup
- Maintains consistency across development and production environments
