"""
Translation Blueprint — Google Cloud Translation API endpoints.

Endpoints:
    POST /api/translate/text       — Translate a text string.
    GET  /api/translate/languages  — List supported languages.
    POST /api/translate/detect     — Detect the language of a text.
    GET  /api/translate/health     — Check Google Translate API connectivity.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from utils.responses import success_response, error_response
from utils.translate_helper import (
    translate_text,
    detect_language,
    get_supported_languages,
    SUPPORTED_LANGUAGES
)

translate_bp = Blueprint('translate', __name__)


@translate_bp.route('/text', methods=['POST'])
@jwt_required()
def translate():
    """
    Translate text to a target language using Google Cloud Translation API.

    Request body:
        text (str): The text to translate.
        target_language (str): BCP-47 language code (e.g., 'es', 'fr', 'hi').
        source_language (str, optional): Source language code (default: 'en').

    Returns:
        JSON with translated text and language metadata.
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response('Request body is required', 400)

    text = data.get('text', '').strip()
    target_language = data.get('target_language', '').strip().lower()
    source_language = data.get('source_language', 'en').strip().lower()

    if not text:
        return error_response('Text is required', 400)

    if not target_language:
        return error_response('target_language is required (e.g. "es", "fr", "hi")', 400)

    if len(text) > 5000:
        return error_response('Text too long (max 5000 characters)', 400)

    if target_language not in SUPPORTED_LANGUAGES:
        return error_response(
            f'Language "{target_language}" not supported. '
            f'Supported: {", ".join(SUPPORTED_LANGUAGES.keys())}',
            400
        )

    translated = translate_text(text, target_language, source_language)

    # Return original text as fallback if translation fails
    return success_response('OK', data={
        'original': text,
        'translated': translated if translated else text,
        'target_language': target_language,
        'target_language_name': SUPPORTED_LANGUAGES.get(target_language, target_language),
        'source_language': source_language,
        'powered_by': 'Google Cloud Translation API v2' if translated else 'Fallback',
        'api_available': translated is not None
    })


@translate_bp.route('/languages', methods=['GET'])
def languages():
    """
    Return all supported languages for translation.

    Returns:
        JSON list of language codes and their names.
    """
    langs = [
        {'code': code, 'name': name}
        for code, name in get_supported_languages().items()
    ]
    return success_response('OK', data={
        'languages': langs,
        'count': len(langs),
        'powered_by': 'Google Cloud Translation API v2'
    })


@translate_bp.route('/detect', methods=['POST'])
@jwt_required()
def detect():
    """
    Detect the language of the provided text.

    Request body:
        text (str): The text whose language to detect.

    Returns:
        JSON with detected language code and name.
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response('Request body is required', 400)

    text = data.get('text', '').strip()
    if not text:
        return error_response('Text is required', 400)

    detected = detect_language(text)

    return success_response('OK', data={
        'detected_language': detected or 'en',
        'detected_language_name': SUPPORTED_LANGUAGES.get(detected or 'en', 'English'),
        'powered_by': 'Google Cloud Translation API v2',
        'api_available': detected is not None
    })


@translate_bp.route('/health', methods=['GET'])
def translate_health():
    """
    Check if the Google Translate API is configured.

    Returns:
        JSON status showing API key presence and supported language count.
    """
    import os
    api_key_present = bool(os.environ.get('GOOGLE_TRANSLATE_API_KEY'))
    return success_response('OK', data={
        'google_translate_configured': api_key_present,
        'supported_languages': len(SUPPORTED_LANGUAGES),
        'powered_by': 'Google Cloud Translation API v2',
        'status': 'ready' if api_key_present else 'no_api_key'
    })
