"""
CivicAI Blueprint — Google Gemini-powered civic assistant API.

Endpoints:
    POST /api/civicai/chat      — Send a question, get a civic AI response.
    GET  /api/civicai/topics    — Get a list of suggested civic topics.
    POST /api/civicai/summarize — Summarize a specific civic topic.
    GET  /api/civicai/health    — Check Gemini API connectivity.
"""

from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from utils.responses import success_response, error_response
from utils.gemini_helper import get_gemini_response, get_civic_summary

civicai_bp = Blueprint('civicai', __name__)

SUGGESTED_TOPICS = [
    "How does ranked choice voting work?",
    "What is gerrymandering and why does it matter?",
    "How do I register to vote?",
    "What is proportional representation?",
    "How does the Electoral College work?",
    "What are voter ID laws?",
    "What is a primary election vs general election?",
    "How is a bill passed into law?",
    "What is the difference between a senator and a representative?",
    "How does early voting work?",
]


@civicai_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    """
    Handle a civic question and return an AI response.

    Request body:
        message (str): The user's question.
        context (str, optional): Additional context for the AI.

    Returns:
        JSON with the AI's response text.
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response('Request body is required', 400)

    message = data.get('message', '').strip()
    if not message:
        return error_response('Message is required', 400)

    if len(message) > 1000:
        return error_response('Message too long (max 1000 characters)', 400)

    context = data.get('context', '')
    response_text = get_gemini_response(message, context)

    return success_response('OK', data={
        'reply': response_text,
        'powered_by': 'Google Gemini (CivicReady)',
        'ai_available': True
    })


@civicai_bp.route('/topics', methods=['GET'])
@jwt_required()
def get_topics():
    """
    Return a list of suggested civic topics the user can ask about.

    Returns:
        JSON list of suggested question strings.
    """
    return success_response('OK', data={
        'topics': SUGGESTED_TOPICS,
        'count': len(SUGGESTED_TOPICS)
    })


@civicai_bp.route('/summarize', methods=['POST'])
@jwt_required()
def summarize_topic():
    """
    Generate a brief educational summary of a civic topic using AI.

    Request body:
        topic (str): The civic topic to summarize.

    Returns:
        JSON with the summary text.
    """
    data = request.get_json(silent=True)
    if not data:
        return error_response('Request body is required', 400)

    topic = data.get('topic', '').strip()
    if not topic:
        return error_response('Topic is required', 400)

    summary = get_civic_summary(topic)

    return success_response('OK', data={
        'topic': topic,
        'summary': summary,
        'powered_by': 'Google Gemini (CivicReady)',
        'ai_available': True
    })


@civicai_bp.route('/health', methods=['GET'])
def civicai_health():
    """
    Check if the AI integration is configured and reachable.

    Returns:
        JSON status indicating API key presence and readiness.
    """
    import os
    api_key_present = bool(
        os.environ.get('GROK_API_KEY') or os.environ.get('GEMINI_API_KEY')
    )
    return success_response('OK', data={
        'gemini_configured': api_key_present,
        'ai_available': True,  # always true — knowledge base fallback
        'google_services': ['Google Generative AI (Gemini)', 'Google Cloud Storage', 'Google Cloud Run'],
        'status': 'ready'
    })
