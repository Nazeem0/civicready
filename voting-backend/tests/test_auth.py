import pytest
from app import create_app
from extensions import db
from models.user import User
import json

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        # Clean up users for testing
        User.objects.delete()
        yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_health_check(client):
    """Test the public health endpoint."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['data']['status'] == 'ok'

def test_stats_endpoint(client):
    """Test the public stats endpoint."""
    response = client.get('/api/stats')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'voters_reached' in data['data']

def test_user_registration(client):
    """Test user registration flow."""
    payload = {
        'email': 'test@example.com',
        'full_name': 'Test User',
        'password': 'Password123!',
        'phone_number': '1234567890'
    }
    response = client.post('/api/auth/register', 
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['data']['email'] == 'test@example.com'

def test_duplicate_registration(client):
    """Test registering with an existing email."""
    payload = {
        'email': 'duplicate@example.com',
        'full_name': 'Duplicate User',
        'password': 'Password123!'
    }
    # Register once
    client.post('/api/auth/register', 
                data=json.dumps(payload),
                content_type='application/json')
    
    # Register again
    response = client.post('/api/auth/register', 
                           data=json.dumps(payload),
                           content_type='application/json')
    assert response.status_code == 409
