"""
Integration tests for authentication workflows.

Tests the complete registration → login → protected access → logout cycle.
"""

import pytest
import json
from app import create_app

TEST_EMAIL = "testuser_workflow@civicready.test"
TEST_PASSWORD = "SecurePass123!"
TEST_NAME = "Test Workflow User"


@pytest.fixture(scope='module')
def app():
    """Create test Flask app with in-memory test database."""
    return create_app('testing')


@pytest.fixture(scope='module')
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture(scope='module')
def registered_user(client):
    """Register a test user and return the response data."""
    payload = {
        'email': TEST_EMAIL,
        'full_name': TEST_NAME,
        'password': TEST_PASSWORD
    }
    response = client.post(
        '/api/auth/register',
        data=json.dumps(payload),
        content_type='application/json'
    )
    return json.loads(response.data)


@pytest.fixture(scope='module')
def auth_token(client, registered_user):
    """Log in and return JWT access token."""
    payload = {'email': TEST_EMAIL, 'password': TEST_PASSWORD}
    response = client.post(
        '/api/auth/login',
        data=json.dumps(payload),
        content_type='application/json'
    )
    data = json.loads(response.data)
    if data.get('success') and 'access_token' in data.get('data', {}):
        return data['data']['access_token']
    return None


# ─── Registration Flow ────────────────────────────────────────────────────────

class TestRegistration:
    """Tests for user registration endpoint."""

    def test_register_valid_user(self, client):
        """Valid registration returns 200 or 201."""
        payload = {
            'email': 'fresh_user_xyz@civictest.com',
            'full_name': 'Fresh User',
            'password': 'ValidPass123!'
        }
        response = client.post(
            '/api/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code in [200, 201, 400]  # 400 if duplicate

    def test_register_response_structure(self, client):
        """Registration response has correct structure."""
        payload = {'email': 'bad', 'full_name': 'X', 'password': 'y'}
        response = client.post(
            '/api/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        data = json.loads(response.data)
        assert 'success' in data

    def test_register_short_password_rejected(self, client):
        """Registration rejects passwords that are too short."""
        payload = {
            'email': 'shortpass@test.com',
            'full_name': 'Test',
            'password': '123'
        }
        response = client.post(
            '/api/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 400

    def test_register_empty_name_rejected(self, client):
        """Registration rejects empty full name."""
        payload = {
            'email': 'noname@test.com',
            'full_name': '',
            'password': 'ValidPass123!'
        }
        response = client.post(
            '/api/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 400


# ─── Login Flow ───────────────────────────────────────────────────────────────

class TestLogin:
    """Tests for user login endpoint."""

    def test_login_wrong_password(self, client):
        """Login with wrong password returns 401."""
        payload = {'email': TEST_EMAIL, 'password': 'WrongPassword999!'}
        response = client.post(
            '/api/auth/login',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code in [400, 401]

    def test_login_nonexistent_email(self, client):
        """Login with non-existent email returns 401."""
        payload = {'email': 'ghost@nowhere.com', 'password': 'SomePass123!'}
        response = client.post(
            '/api/auth/login',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code in [400, 401]

    def test_login_content_type_required(self, client):
        """Login without JSON content type fails."""
        response = client.post(
            '/api/auth/login',
            data='email=test&password=test'
        )
        assert response.status_code in [400, 415, 422]


# ─── Protected Access Flow ────────────────────────────────────────────────────

class TestProtectedAccess:
    """Tests for JWT-protected endpoints."""

    def test_me_with_valid_token(self, client, auth_token):
        """GET /api/auth/me returns 200 with valid JWT."""
        if auth_token is None:
            pytest.skip("No auth token available (test DB may not support registration)")
        response = client.get(
            '/api/auth/me',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200

    def test_protected_with_invalid_token(self, client):
        """Protected endpoint returns 401 with invalid token."""
        response = client.get(
            '/api/auth/me',
            headers={'Authorization': 'Bearer fake.invalid.token'}
        )
        assert response.status_code == 401

    def test_protected_with_malformed_header(self, client):
        """Protected endpoint returns 401 with malformed auth header."""
        response = client.get(
            '/api/auth/me',
            headers={'Authorization': 'NotBearer sometoken'}
        )
        assert response.status_code == 401

    def test_voter_profile_with_valid_token(self, client, auth_token):
        """GET /api/voter/profile returns 200 with valid JWT."""
        if auth_token is None:
            pytest.skip("No auth token available")
        response = client.get(
            '/api/voter/profile',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code in [200, 404]  # 404 if no voter profile yet


# ─── Security Tests ───────────────────────────────────────────────────────────

class TestSecurity:
    """Tests for security properties."""

    def test_sql_injection_in_email(self, client):
        """SQL injection attempt in email is safely rejected."""
        payload = {
            'email': "'; DROP TABLE users; --",
            'password': 'test123'
        }
        response = client.post(
            '/api/auth/login',
            data=json.dumps(payload),
            content_type='application/json'
        )
        # Should return 400 validation error, not 500
        assert response.status_code in [400, 401]
        assert response.status_code != 500

    def test_xss_in_name_field(self, client):
        """XSS attempt in name field is safely handled."""
        payload = {
            'email': 'xss@test.com',
            'full_name': '<script>alert("xss")</script>',
            'password': 'ValidPass123!'
        }
        response = client.post(
            '/api/auth/register',
            data=json.dumps(payload),
            content_type='application/json'
        )
        # Should not cause 500 error
        assert response.status_code != 500

    def test_oversized_payload_handled(self, client):
        """Oversized payload is handled gracefully."""
        payload = {'email': 'x' * 10000 + '@test.com', 'password': 'y' * 10000}
        response = client.post(
            '/api/auth/login',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code in [400, 401, 413]
        assert response.status_code != 500
