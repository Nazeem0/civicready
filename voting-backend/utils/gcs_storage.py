"""
Google Cloud Storage integration for CivicReady.

Provides secure document upload capabilities using GCS,
replacing ephemeral local storage for ID document handling.

Google Services used:
    - Google Cloud Storage (document upload, signed URLs)
    - Service account authentication via GOOGLE_APPLICATION_CREDENTIALS
"""

import os
import uuid
from typing import Optional


def upload_id_document(
    file_data: bytes,
    filename: str,
    content_type: str = 'application/octet-stream'
) -> Optional[str]:
    """
    Upload an ID document to Google Cloud Storage.

    Uses the GCS_BUCKET_NAME environment variable to determine
    which bucket to store documents in. Files are stored with
    UUID-prefixed names to prevent collisions.

    Args:
        file_data: Raw bytes of the file to upload.
        filename: Original filename (extension is preserved).
        content_type: MIME type of the file (e.g., 'image/jpeg').

    Returns:
        The GCS public URL or signed URL string if successful,
        or None if upload failed or GCS is not configured.

    Example:
        url = upload_id_document(file.read(), file.filename, file.content_type)
        if url:
            voter.id_document_url = url
    """
    try:
        from google.cloud import storage

        bucket_name = os.environ.get('GCS_BUCKET_NAME', 'civicready-id-docs')

        client = storage.Client()
        bucket = client.bucket(bucket_name)

        # Generate a unique, collision-resistant filename
        ext = os.path.splitext(filename)[1] if '.' in filename else '.bin'
        unique_name = f"id-docs/{uuid.uuid4().hex}{ext}"

        blob = bucket.blob(unique_name)
        blob.upload_from_string(file_data, content_type=content_type)

        return blob.public_url

    except ImportError:
        # google-cloud-storage not installed
        return None
    except Exception as e:
        print(f"[GCS] Upload failed: {e}")
        return None


def get_signed_url(blob_name: str, expiration_minutes: int = 15) -> Optional[str]:
    """
    Generate a time-limited signed URL for secure document access.

    Signed URLs grant temporary read access to a private GCS object
    without requiring the user to have Google Cloud credentials.

    Args:
        blob_name: The GCS object name (path within the bucket).
        expiration_minutes: How long the URL should remain valid (default 15).

    Returns:
        A signed URL string, or None if generation failed.
    """
    try:
        from google.cloud import storage
        from datetime import timedelta

        bucket_name = os.environ.get('GCS_BUCKET_NAME', 'civicready-id-docs')

        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_name)

        url = blob.generate_signed_url(
            expiration=timedelta(minutes=expiration_minutes),
            method='GET'
        )
        return url

    except ImportError:
        return None
    except Exception as e:
        print(f"[GCS] Signed URL generation failed: {e}")
        return None


def delete_document(blob_name: str) -> bool:
    """
    Delete a document from Google Cloud Storage.

    Args:
        blob_name: The GCS object name to delete.

    Returns:
        True if deletion succeeded, False otherwise.
    """
    try:
        from google.cloud import storage

        bucket_name = os.environ.get('GCS_BUCKET_NAME', 'civicready-id-docs')
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.delete()
        return True

    except ImportError:
        return False
    except Exception as e:
        print(f"[GCS] Deletion failed: {e}")
        return False
