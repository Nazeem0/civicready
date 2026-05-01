from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt,
)
from extensions import limiter
from models.user import User
from models.voter_profile import VoterProfile
from models.token_blocklist import TokenBlocklist
from schemas.auth_schema import RegisterSchema, LoginSchema
from utils.responses import success_response, error_response
from utils.helpers import log_activity
from utils.validators import validate_request
from datetime import datetime

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)
    parsed, errors = validate_request(RegisterSchema, data)
    if errors:
        return error_response('Validation failed', 400, errors)

    if User.objects(email=parsed['email']).first():
        return error_response('Email already in use', 409)
    
    phone_number = parsed.get('phone_number')
    if phone_number and User.objects(phone_number=phone_number).first():
        return error_response('Phone number already in use', 409)

    user = User(email=parsed['email'], full_name=parsed['full_name'])
    if phone_number:
        user.phone_number = phone_number
        
    user.set_password(parsed['password'])
    user.save()  # generates user.id immediately in MongoDB

    # Create a blank voter profile linked by user_id
    VoterProfile(user_id=str(user.id)).save()

    log_activity(str(user.id), 'Account created', 'person_add', 'green')
    return success_response('Registration successful', user.to_dict(), 201)


@auth_bp.route('/login', methods=['POST'])
@limiter.limit('5 per minute')
def login():
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)
    parsed, errors = validate_request(LoginSchema, data)
    if errors:
        return error_response('Validation failed', 400, errors)

    email = parsed.get('email')
    phone_number = parsed.get('phone_number')
    password = parsed.get('password')

    if not email and not phone_number:
        return error_response('Please provide email or phone number', 400)

    user = None
    if email:
        user = User.objects(email=email).first()
    elif phone_number:
        user = User.objects(phone_number=phone_number).first()

    if not user or not user.check_password(password):
        return error_response('Invalid credentials', 401)

    user.last_login = datetime.utcnow()
    user.save()
    log_activity(str(user.id), 'Logged in', 'login', 'blue')

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return success_response('Login successful', {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict(),
    })


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    access_token = create_access_token(identity=get_jwt_identity())
    return success_response('Token refreshed', {'access_token': access_token})


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    payload = get_jwt()
    TokenBlocklist(jti=payload['jti'], token_type=payload['type']).save()
    return success_response('Token revoked successfully')


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user = User.objects(id=get_jwt_identity()).first()
    if not user:
        return error_response('User not found', 404)
    
    user_dict = user.to_dict()
    profile = VoterProfile.objects(user_id=str(user.id)).first()
    if profile:
        user_dict['profile'] = profile.to_dict()
        
    return success_response(data=user_dict)
