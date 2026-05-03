"""
Unit tests for simulation logic and CivicAI endpoints.

Tests electoral simulation data validation, CivicAI health,
and the Gemini AI integration fallback behavior.
"""

import pytest
import json
from app import create_app


@pytest.fixture(scope='module')
def app():
    """Create test Flask app."""
    return create_app('testing')


@pytest.fixture(scope='module')
def client(app):
    """Create test client."""
    return app.test_client()


# ─── Simulation Endpoints ─────────────────────────────────────────────────────

class TestSimulationEndpoints:
    """Tests for electoral simulation API."""

    def test_simulation_config_requires_auth(self, client):
        """Electoral simulation config requires authentication."""
        response = client.get('/api/simulation/electoral/config')
        assert response.status_code == 401

    def test_simulation_save_requires_auth(self, client):
        """Electoral simulation save requires authentication."""
        payload = {'voter_population': 100000, 'polarization_index': 0.5}
        response = client.post(
            '/api/simulation/electoral/save',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 401

    def test_simulation_results_require_auth(self, client):
        """Electoral simulation results require authentication."""
        response = client.get('/api/simulation/electoral/results')
        assert response.status_code == 401


# ─── CivicAI Health ───────────────────────────────────────────────────────────

class TestCivicAIIntegration:
    """Tests for CivicAI (Google Gemini) integration."""

    def test_civicai_health_endpoint_accessible(self, client):
        """CivicAI health is publicly accessible."""
        response = client.get('/api/civicai/health')
        assert response.status_code == 200

    def test_civicai_health_returns_google_services(self, client):
        """CivicAI health response includes Google services list."""
        response = client.get('/api/civicai/health')
        data = json.loads(response.data)
        assert 'google_services' in data['data']
        services = data['data']['google_services']
        assert any('Gemini' in s for s in services)

    def test_civicai_health_shows_gcs(self, client):
        """CivicAI health acknowledges Google Cloud Storage."""
        response = client.get('/api/civicai/health')
        data = json.loads(response.data)
        services = data['data']['google_services']
        assert any('Storage' in s for s in services)

    def test_civicai_health_has_status_field(self, client):
        """CivicAI health response has a status field."""
        response = client.get('/api/civicai/health')
        data = json.loads(response.data)
        assert 'status' in data['data']

    def test_civicai_chat_protected(self, client):
        """CivicAI chat is protected by JWT."""
        response = client.post(
            '/api/civicai/chat',
            data=json.dumps({'message': 'How does voting work?'}),
            content_type='application/json'
        )
        assert response.status_code == 401

    def test_civicai_topics_protected(self, client):
        """CivicAI topics listing is protected by JWT."""
        response = client.get('/api/civicai/topics')
        assert response.status_code == 401

    def test_civicai_summarize_protected(self, client):
        """CivicAI summarize is protected by JWT."""
        response = client.post(
            '/api/civicai/summarize',
            data=json.dumps({'topic': 'ranked choice voting'}),
            content_type='application/json'
        )
        assert response.status_code == 401


# ─── GCS Storage Integration ─────────────────────────────────────────────────

class TestGCSIntegration:
    """Tests for Google Cloud Storage integration module."""

    def test_gcs_module_importable(self):
        """GCS storage utility module can be imported."""
        from utils.gcs_storage import upload_id_document
        assert callable(upload_id_document)

    def test_gcs_upload_handles_missing_env(self):
        """GCS upload gracefully handles missing environment variables."""
        import os
        from utils.gcs_storage import upload_id_document

        # Should not raise an exception even without GCS credentials
        original = os.environ.get('GCS_BUCKET_NAME')
        os.environ.pop('GCS_BUCKET_NAME', None)

        result = upload_id_document(b"fake_data", "test.jpg", "image/jpeg")
        # Should return None or raise — not crash the app
        assert result is None or isinstance(result, str)

        if original:
            os.environ['GCS_BUCKET_NAME'] = original


# ─── Gemini Helper Module ─────────────────────────────────────────────────────

class TestGeminiHelper:
    """Tests for the Gemini AI helper module."""

    def test_gemini_helper_importable(self):
        """Gemini helper module can be imported."""
        from utils.gemini_helper import get_gemini_response, get_civic_summary
        assert callable(get_gemini_response)
        assert callable(get_civic_summary)

    def test_gemini_returns_none_without_key(self):
        """Gemini helper returns None gracefully when API key is missing."""
        import os
        from utils.gemini_helper import get_gemini_response

        original = os.environ.get('GEMINI_API_KEY')
        os.environ.pop('GEMINI_API_KEY', None)

        result = get_gemini_response("What is democracy?")
        assert result is None

        if original:
            os.environ['GEMINI_API_KEY'] = original

    def test_civic_summary_returns_none_without_key(self):
        """get_civic_summary returns None gracefully without API key."""
        import os
        from utils.gemini_helper import get_civic_summary

        original = os.environ.get('GEMINI_API_KEY')
        os.environ.pop('GEMINI_API_KEY', None)

        result = get_civic_summary("gerrymandering")
        assert result is None

        if original:
            os.environ['GEMINI_API_KEY'] = original
