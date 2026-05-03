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
    """Backend health endpoint returns OK."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['data']['status'] == 'ok'


def test_stats_endpoint(client):
    """Stats endpoint returns expected keys."""
    response = client.get('/api/stats')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'voters_reached' in data['data']
    assert 'states_covered' in data['data']
    assert 'uptime_percent' in data['data']


def test_public_deadlines_endpoint(client):
    """Public deadlines endpoint is accessible without auth."""
    response = client.get('/api/deadlines/public')
    assert response.status_code == 200


# ─── Auth Endpoints ───────────────────────────────────────────────────────────

def test_register_missing_fields(client):
    """Registration fails if required fields are missing."""
    response = client.post('/api/auth/register',
                           data=json.dumps({'email': 'bad@test.com'}),
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


def test_login_missing_fields(client):
    """Login fails if password is missing."""
    response = client.post('/api/auth/login',
                           data=json.dumps({'email': 'test@test.com'}),
                           content_type='application/json')
    assert response.status_code == 400


def test_protected_route_without_token(client):
    """Protected /me endpoint returns 401 without a token."""
    response = client.get('/api/auth/me')
    assert response.status_code == 401


def test_protected_voter_route_without_token(client):
    """Protected voter profile endpoint returns 401 without a token."""
    response = client.get('/api/voter/profile')
    assert response.status_code == 401


def test_protected_dashboard_route_without_token(client):
    """Protected dashboard endpoint returns 401 without a token."""
    response = client.get('/api/dashboard/summary')
    assert response.status_code == 401


# ─── Error Handling ───────────────────────────────────────────────────────────

def test_404_handler(client):
    """Non-existent endpoint returns 404."""
    response = client.get('/api/does-not-exist')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['success'] is False


def test_method_not_allowed(client):
    """Wrong HTTP method returns 405."""
    response = client.post('/api/health')
    assert response.status_code == 405
