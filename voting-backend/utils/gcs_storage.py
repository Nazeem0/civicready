"""
Google Cloud Storage integration for CivicReady.
Used for storing voter ID verification documents securely.
"""
import os
from google.cloud import storage


def get_gcs_client():
    """Return a GCS client using Application Default Credentials."""
    return storage.Client()


def upload_id_document(file_obj, user_id: str, filename: str) -> str:
    """
    Upload a voter ID document to Google Cloud Storage.

    Args:
        file_obj: File-like object to upload.
        user_id: The user's ID for namespacing the file.
        filename: Original filename.

    Returns:
        Public URL of the uploaded file.
    """
    bucket_name = os.getenv('GCS_BUCKET_NAME', 'civicready-id-docs')
    client = get_gcs_client()
    bucket = client.bucket(bucket_name)

    # Namespace by user_id to avoid collisions
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'bin'
    blob_name = f"id_documents/{user_id}/{user_id}_id.{ext}"

    blob = bucket.blob(blob_name)
    blob.upload_from_file(file_obj, content_type=f'image/{ext}')

    # Return the GCS URI for storage in DB
    return f"gs://{bucket_name}/{blob_name}"


def delete_id_document(gcs_uri: str) -> bool:
    """
    Delete a voter ID document from Google Cloud Storage.

    Args:
        gcs_uri: The GCS URI returned by upload_id_document.

    Returns:
        True if deleted, False otherwise.
    """
    try:
        # Parse gs://bucket/path
        path = gcs_uri.replace("gs://", "")
        bucket_name, blob_name = path.split("/", 1)
        client = get_gcs_client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.delete()
        return True
    except Exception:
        return False
