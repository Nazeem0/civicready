"""
Google Cloud Translation utility for CivicReady.

Provides language translation for civic content using the
Google Cloud Translation API (Basic v2).

Supported Google Services:
    - Google Cloud Translation API v2

Setup:
    Set GOOGLE_TRANSLATE_API_KEY in your environment variables.
    Get a key at: https://console.cloud.google.com/apis/library/translate.googleapis.com
    Free tier: 500,000 characters/month.
"""

import os
import json
import urllib.request
import urllib.parse
import urllib.error
from typing import Optional


SUPPORTED_LANGUAGES = {
    'en': 'English',
    'hi': 'Hindi',
    'es': 'Spanish',
    'fr': 'French',
    'ar': 'Arabic',
    'zh': 'Chinese (Simplified)',
    'pt': 'Portuguese',
    'de': 'German',
    'ta': 'Tamil',
    'ur': 'Urdu',
    'te': 'Telugu',
}

GOOGLE_TRANSLATE_BASE = "https://translation.googleapis.com/language/translate/v2"


def translate_text(text: str, target_language: str, source_language: str = 'en') -> Optional[str]:
    """
    Translate text using the Google Cloud Translation API.

    Args:
        text: The text to translate.
        target_language: BCP-47 language code for the target language (e.g., 'es', 'fr').
        source_language: BCP-47 language code for the source language (default: 'en').

    Returns:
        The translated text string, or None if translation failed.

    Example:
        result = translate_text("How do I register to vote?", "es")
        # Returns: "¿Cómo me registro para votar?"
    """
    api_key = os.environ.get('GOOGLE_TRANSLATE_API_KEY')
    if not api_key:
        return None

    if target_language == source_language:
        return text

    try:
        payload = json.dumps({
            'q': text,
            'source': source_language,
            'target': target_language,
            'format': 'text'
        }).encode('utf-8')

        url = f"{GOOGLE_TRANSLATE_BASE}?key={api_key}"
        req = urllib.request.Request(
            url,
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['data']['translations'][0]['translatedText']

    except urllib.error.HTTPError as e:
        print(f"[Translate] HTTP error {e.code}: {e.reason}")
        return None
    except Exception as e:
        print(f"[Translate] Error: {e}")
        return None


def detect_language(text: str) -> Optional[str]:
    """
    Detect the language of a given text using the Google Cloud Translation API.

    Args:
        text: The text whose language to detect.

    Returns:
        A BCP-47 language code string (e.g., 'en', 'es'), or None if unavailable.
    """
    api_key = os.environ.get('GOOGLE_TRANSLATE_API_KEY')
    if not api_key:
        return None

    try:
        payload = json.dumps({'q': text}).encode('utf-8')
        url = f"{GOOGLE_TRANSLATE_BASE}/detect?key={api_key}"
        req = urllib.request.Request(
            url,
            data=payload,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['data']['detections'][0][0]['language']
    except Exception as e:
        print(f"[Translate] Detection error: {e}")
        return None


def get_supported_languages() -> dict:
    """
    Return the dictionary of supported language codes and names.

    Returns:
        Dict mapping BCP-47 codes to human-readable language names.
    """
    return SUPPORTED_LANGUAGES
