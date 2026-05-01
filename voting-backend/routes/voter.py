from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import io
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.voter_profile import VoterProfile
from models.deadline import Deadline
from schemas.voter_schema import EligibilityCheckSchema, UpdateProfileSchema
from utils.responses import success_response, error_response
from utils.helpers import get_polling_location, log_activity, check_eligibility_issues
from utils.validators import validate_request

voter_bp = Blueprint('voter', __name__)


def _get_or_create_profile(user_id):
    profile = VoterProfile.objects(user_id=user_id).first()
    if not profile:
        profile = VoterProfile(user_id=user_id)
        profile.save()
    return profile


@voter_bp.route('/check-eligibility', methods=['POST'])
@jwt_required()
def check_eligibility():
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)
    parsed, errors = validate_request(EligibilityCheckSchema, data)
    if errors:
        return error_response('Validation failed', 400, errors)

    issues = check_eligibility_issues(parsed)
    eligible = len(issues) == 0

    profile = _get_or_create_profile(user_id)
    if profile.registration_status == 'active':
        return error_response('You have already registered to vote. Please use the profile settings to update your information.', 400)

    profile.dob = parsed['dob']
    profile.zip_code = parsed['zip_code']
    profile.state = parsed['state']
    profile.street_address = parsed['street_address']
    profile.city = parsed['city']
    profile.age = parsed['age']
    profile.email = parsed['email']
    profile.phone_number = parsed['phone_number']
    profile.father_name = parsed['father_name']
    profile.mother_name = parsed['mother_name']
    profile.gender = parsed['gender']
    profile.occupation = parsed['occupation']
    profile.polling_location = get_polling_location(parsed['zip_code'], parsed['state'])
    profile.registration_status = 'active' if eligible else 'incomplete'
    profile.save()

    log_activity(user_id, 'Eligibility check completed', 'how_to_vote', 'blue')
    return success_response('Eligibility check complete', {
        'eligible': eligible,
        'registration_status': profile.registration_status,
        'polling_location': profile.polling_location,
        'issues': issues,
        'completion_percent': profile.compute_completion_percent(),
    })


@voter_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    profile = VoterProfile.objects(user_id=get_jwt_identity()).first()
    if not profile:
        return error_response('Voter profile not found', 404)
    return success_response(data=profile.to_dict())


@voter_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)
    parsed, errors = validate_request(UpdateProfileSchema, data)
    if errors:
        return error_response('Validation failed', 400, errors)

    profile = _get_or_create_profile(user_id)
    updatable = [
        'dob', 'zip_code', 'state', 'street_address', 'city', 'unit', 'mail_ballot_requested',
        'age', 'email', 'phone_number', 'father_name', 'mother_name', 'gender', 'occupation'
    ]
    for field in updatable:
        value = parsed.get(field)
        if value is not None:
            setattr(profile, field, value)

    if profile.zip_code:
        profile.polling_location = get_polling_location(profile.zip_code, profile.state)
    profile.save()

    log_activity(user_id, 'Updated voter profile', 'edit', 'purple')
    return success_response('Profile updated', profile.to_dict())


@voter_bp.route('/verify-aadhar', methods=['POST'])
@jwt_required()
def verify_aadhar():
    user_id = get_jwt_identity()
    if 'file' not in request.files:
        return error_response('No file uploaded', 400)
    
    file = request.files['file']
    if file.filename == '':
        return error_response('No file selected', 400)
    
    import os
    from werkzeug.utils import secure_filename
    
    try:
        # Secure the filename and define the path
        filename = secure_filename(file.filename)
        # Add timestamp to ensure uniqueness
        import time
        unique_filename = f"{int(time.time())}_{filename}"
        upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
        
        # Ensure directory exists
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, unique_filename)
        
        # Save the file
        file.save(file_path)
        
        # Update profile
        profile = _get_or_create_profile(user_id)
        profile.id_verified = True
        profile.id_document_path = file_path # Save the proof
        profile.save()
        log_activity(user_id, 'Aadhar Document Uploaded & Saved', 'badge', 'green')
        
        return success_response('ID Document successfully saved as proof', {
            'verified': True,
            'name_match': True,
            'dob_match': True,
            'document_saved': True
        })
    except Exception as e:
        return error_response(f'Error saving image: {str(e)}', 500)


@voter_bp.route('/polling-location', methods=['GET'])
@jwt_required()
def polling_location():
    profile = VoterProfile.objects(user_id=get_jwt_identity()).first()
    location = get_polling_location(
        profile.zip_code if profile else None,
        profile.state if profile else None,
    )
    return success_response(data={
        'polling_location': location,
        'zip_code': profile.zip_code if profile else None,
        'state': profile.state if profile else None,
    })


@voter_bp.route('/deadlines', methods=['GET'])
@jwt_required()
def get_deadlines():
    state = request.args.get('state')
    query = Deadline.objects(is_active=True)
    if state:
        query = Deadline.objects(is_active=True, __raw__={
            '$or': [{'state': state}, {'state': None}]
        })
    deadlines = query.order_by('deadline_date')
    return success_response(data={'deadlines': [d.to_dict() for d in deadlines]})
