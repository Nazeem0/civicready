import os
import firebase_admin
from google.cloud import storage, translate_v2 as translate, language_v1
import google.generativeai as genai
from flask import Flask
from config import config
from extensions import db, jwt, bcrypt, cors, limiter
from models.token_blocklist import TokenBlocklist
try:
    from flask_compress import Compress
    compress = Compress()
except ImportError:
    compress = None


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config.get(config_name, config['default']))
    
    from mongoengine import connect
    connect(host=app.config['MONGODB_SETTINGS']['host'])

    # Initialise extensions

    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r'/api/*': {'origins': app.config['CORS_ORIGINS']}})
    limiter.init_app(app)

    # ── JWT callbacks ──────────────────────────────────────────────────────────
    @jwt.token_in_blocklist_loader
    def check_if_revoked(jwt_header, jwt_payload):
        jti = jwt_payload['jti']
        return TokenBlocklist.objects(jti=jti).first() is not None

    @jwt.expired_token_loader
    def expired_token_cb(jwt_header, jwt_payload):
        from utils.responses import error_response
        return error_response('Token has expired', 401)

    @jwt.invalid_token_loader
    def invalid_token_cb(error):
        from utils.responses import error_response
        return error_response('Invalid token', 401)

    @jwt.unauthorized_loader
    def missing_token_cb(error):
        from utils.responses import error_response
        return error_response('Authorization token required', 401)

    @jwt.revoked_token_loader
    def revoked_token_cb(jwt_header, jwt_payload):
        from utils.responses import error_response
        return error_response('Token has been revoked', 401)

    # ── Compression (Efficiency) ────────────────────────────────────────────────
    if compress:
        compress.init_app(app)

    # ── Security headers (Talisman) ────────────────────────────────────────────
    if app.config.get('FLASK_ENV') == 'production':
        try:
            from flask_talisman import Talisman
            Talisman(
                app,
                force_https=True,
                strict_transport_security=True,
                session_cookie_secure=True,
                content_security_policy=False,  # Allow frontend assets
                referrer_policy='strict-origin-when-cross-origin'
            )
        except ImportError:
            pass

    # ── Blueprints ─────────────────────────────────────────────────────────────
    from routes.auth import auth_bp
    from routes.voter import voter_bp
    from routes.dashboard import dashboard_bp
    from routes.labs import labs_bp
    from routes.public import public_bp
    from routes.notifications import notifications_bp
    from routes.simulation import simulation_bp
    from routes.civicai import civicai_bp
    from routes.translate import translate_bp

    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(voter_bp,     url_prefix='/api/voter')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(labs_bp,      url_prefix='/api/labs')
    app.register_blueprint(public_bp,    url_prefix='/api')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(simulation_bp, url_prefix='/api/simulation')
    app.register_blueprint(civicai_bp,   url_prefix='/api/civicai')
    app.register_blueprint(translate_bp, url_prefix='/api/translate')

    # ── Global error handlers ──────────────────────────────────────────────────
    from utils.responses import error_response

    @app.errorhandler(404)
    def not_found(e):
        return error_response('Resource not found', 404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response('Method not allowed', 405)

    @app.errorhandler(422)
    def unprocessable(e):
        return error_response('Unprocessable entity', 422)

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return error_response('Too many requests. Please try again later.', 429)

    @app.errorhandler(500)
    def internal_error(e):
        return error_response('Internal server error', 500)

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000, use_reloader=False)
