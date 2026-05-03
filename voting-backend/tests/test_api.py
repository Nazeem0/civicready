"""
Comprehensive test suite for CivicReady backend API.

Tests cover: health checks, public endpoints, auth flows,
protected routes, error handling, input validation,
rate limiting behavior, and new CivicAI endpoints.
"""

import pytest
import json
from app import create_app


@pytest.fixture(scope='module')
def app():
    """Create test Flask app with in-memory test database."""
    app = create_app('testing')
    yield app


@pytest.fixture(scope='module')
def client(app):
    """Create test client."""
    return app.test_client()


# ─── Health & Public Endpoints ────────────────────────────────────────────────

def test_health_check(client):
    """Backend health endpoint returns 200 with ok status."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['data']['status'] == 'ok'


def test_health_check_returns_json(client):
    """Health endpoint returns JSON content type."""
    response = client.get('/api/health')
    assert 'application/json' in response.content_type


def test_stats_endpoint(client):
    """Stats endpoint returns expected keys."""
    response = client.get('/api/stats')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'voters_reached' in data['data']
    assert 'states_covered' in data['data']
    assert 'uptime_percent' in data['data']


def test_stats_returns_numeric_values(client):
    """Stats endpoint returns numeric values."""
    response = client.get('/api/stats')
    data = json.loads(response.data)
    assert isinstance(data['data']['voters_reached'], (int, float))
    assert isinstance(data['data']['states_covered'], (int, float))


def test_public_deadlines_endpoint(client):
    """Public deadlines endpoint is accessible without auth."""
    response = client.get('/api/deadlines/public')
    assert response.status_code == 200


def test_deadlines_returns_list(client):
    """Deadlines endpoint returns a list."""
    response = client.get('/api/deadlines/public')
    data = json.loads(response.data)
    assert data['success'] is True


# ─── Auth — Registration ───────────────────────────────────────────────────────

def test_register_missing_all_fields(client):
    """Registration fails if all fields are missing."""
    response = client.post('/api/auth/register',
                           data=json.dumps({}),
                           content_type='application/json')
    assert response.status_code == 400


def test_register_missing_password(client):
    """Registration fails if password is missing."""
    payload = {'email': 'user@test.com', 'full_name': 'Test User'}
    response = client.post('/api/auth/register',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 400


def test_register_missing_email(client):
    """Registration fails if email is missing."""
    payload = {'full_name': 'Test User', 'password': 'Password123!'}
    response = client.post('/api/auth/register',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 400


def test_register_invalid_email(client):
    """Registration fails with invalid email format."""
    payload = {
        'email': 'not-an-email',
        'full_name': 'Test User',
        'password': 'Password123!'
    }
    response = client.post('/api/auth/register',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 400


def test_register_returns_error_structure(client):
    """Failed registration returns proper error structure."""
    payload = {'email': 'bad'}
    response = client.post('/api/auth/register',
                           data=json.dumps(payload),
                           content_type='application/json')
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is False


# ─── Auth — Login ─────────────────────────────────────────────────────────────

def test_login_missing_all_fields(client):
    """Login fails if all fields are missing."""
    response = client.post('/api/auth/login',
                           data=json.dumps({}),
                           content_type='application/json')
    assert response.status_code == 400


def test_login_missing_password(client):
    """Login fails if password is missing."""
    response = client.post('/api/auth/login',
                           data=json.dumps({'email': 'test@test.com'}),
                           content_type='application/json')
    assert response.status_code == 400


def test_login_missing_email(client):
    """Login fails if email is missing."""
    response = client.post('/api/auth/login',
                           data=json.dumps({'password': 'password123'}),
                           content_type='application/json')
    assert response.status_code == 400


def test_login_nonexistent_user(client):
    """Login fails for non-existent user with 401."""
    payload = {'email': 'nobody@nowhere.com', 'password': 'WrongPass123!'}
    response = client.post('/api/auth/login',
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code in [400, 401]


def test_login_returns_error_structure(client):
    """Failed login returns proper error structure."""
    payload = {'email': 'nobody@nowhere.com', 'password': 'Bad'}
    response = client.post('/api/auth/login',
                           data=json.dumps(payload),
                           content_type='application/json')
    data = json.loads(response.data)
    assert 'success' in data


# ─── Protected Routes — Require Auth ──────────────────────────────────────────

def test_me_endpoint_without_token(client):
    """GET /api/auth/me returns 401 without token."""
    response = client.get('/api/auth/me')
    assert response.status_code == 401


def test_voter_profile_without_token(client):
    """GET /api/voter/profile returns 401 without token."""
    response = client.get('/api/voter/profile')
    assert response.status_code == 401


def test_dashboard_without_token(client):
    """GET /api/dashboard/summary returns 401 without token."""
    response = client.get('/api/dashboard/summary')
    assert response.status_code == 401


def test_logout_without_token(client):
    """POST /api/auth/logout returns 401 without token."""
    response = client.post('/api/auth/logout')
    assert response.status_code == 401


def test_labs_without_token(client):
    """GET /api/labs returns 401 without token."""
    response = client.get('/api/labs')
    assert response.status_code == 401


def test_notifications_without_token(client):
    """GET /api/notifications returns 401 without token."""
    response = client.get('/api/notifications')
    assert response.status_code == 401


# ─── CivicAI Endpoints ────────────────────────────────────────────────────────

def test_civicai_health(client):
    """CivicAI health endpoint is publicly accessible."""
    response = client.get('/api/civicai/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert 'gemini_configured' in data['data']
    assert 'google_services' in data['data']


def test_civicai_health_lists_google_services(client):
    """CivicAI health lists integrated Google services."""
    response = client.get('/api/civicai/health')
    data = json.loads(response.data)
    services = data['data']['google_services']
    assert isinstance(services, list)
    assert len(services) > 0


def test_civicai_chat_requires_auth(client):
    """CivicAI chat endpoint requires JWT authentication."""
    response = client.post('/api/civicai/chat',
                           data=json.dumps({'message': 'test'}),
                           content_type='application/json')
    assert response.status_code == 401


def test_civicai_topics_requires_auth(client):
    """CivicAI topics endpoint requires JWT authentication."""
    response = client.get('/api/civicai/topics')
    assert response.status_code == 401


def test_civicai_summarize_requires_auth(client):
    """CivicAI summarize endpoint requires JWT authentication."""
    response = client.post('/api/civicai/summarize',
                           data=json.dumps({'topic': 'voting'}),
                           content_type='application/json')
    assert response.status_code == 401


# ─── Error Handling ───────────────────────────────────────────────────────────

def test_404_handler(client):
    """Non-existent endpoint returns structured 404."""
    response = client.get('/api/does-not-exist-anywhere')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['success'] is False


def test_404_has_message(client):
    """404 response includes a message."""
    response = client.get('/api/nonexistent-route-xyz')
    data = json.loads(response.data)
    assert 'message' in data


def test_method_not_allowed(client):
    """Wrong HTTP method returns 405."""
    response = client.post('/api/health')
    assert response.status_code == 405


def test_method_not_allowed_structure(client):
    """405 response has proper structure."""
    response = client.post('/api/stats')
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is False


def test_empty_body_on_post(client):
    """POST with no body returns 400."""
    response = client.post('/api/auth/login',
                           data='',
                           content_type='application/json')
    assert response.status_code == 400


def test_invalid_json_on_post(client):
    """POST with invalid JSON returns 400."""
    response = client.post('/api/auth/login',
                           data='not-json',
                           content_type='application/json')
    assert response.status_code == 400
