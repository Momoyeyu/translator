from conf.config import settings


def get_storage_config() -> dict:
    if settings.storage_backend == "s3":
        return {
            "backend": "s3",
            "bucket": settings.storage_s3_bucket,
            "endpoint": settings.storage_s3_endpoint,
            "access_key": settings.storage_s3_access_key,
            "secret_key": settings.storage_s3_secret_key,
            "region": settings.storage_s3_region,
        }
    return {
        "backend": "local",
        "local_path": settings.storage_local_path,
    }
