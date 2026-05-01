from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.voter_profile import VoterProfile
from models.deadline import Deadline
from models.activity_log import ActivityLog
from models.sim_progress import SimProgress
from schemas.dashboard_schema import ActivityCreateSchema
from utils.responses import success_response, error_response
from utils.helpers import log_activity, build_next_steps, compute_sim_progress_percent
from utils.validators import validate_request

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    user_id = get_jwt_identity()
    user = User.objects(id=user_id).first()
    if not user:
        return error_response('User not found', 404)

    profile = VoterProfile.objects(user_id=user_id).first()
    deadlines = list(Deadline.objects(is_active=True).order_by('deadline_date').limit(3))
    recent_activity = list(ActivityLog.objects(user_id=user_id).order_by('-created_at').limit(5))
    sim_records = list(SimProgress.objects(user_id=user_id))
    modules_completed = sum(1 for s in sim_records if s.completed)

    return success_response(data={
        'voter_status': profile.registration_status if profile else 'incomplete',
        'completion_percent': profile.compute_completion_percent() if profile else 0,
        'pending_issues': profile.count_pending_issues() if profile else 4,
        'deadlines': [d.to_dict() for d in deadlines],
        'next_steps': build_next_steps(profile),
        'recent_activity': [a.to_dict() for a in recent_activity],
        'profile': {
            'full_name': user.full_name,
            'elections_voted': profile.elections_voted if profile else 0,
            'modules_completed': modules_completed,
        },
    })


@dashboard_bp.route('/deadlines', methods=['GET'])
@jwt_required()
def get_deadlines():
    deadlines = Deadline.objects(is_active=True).order_by('deadline_date')
    return success_response(data={'deadlines': [d.to_dict() for d in deadlines]})


@dashboard_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_activity():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    skip = (page - 1) * per_page

    total = ActivityLog.objects(user_id=user_id).count()
    items = list(ActivityLog.objects(user_id=user_id).order_by('-created_at').skip(skip).limit(per_page))
    import math

    return success_response(data={
        'items': [a.to_dict() for a in items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': math.ceil(total / per_page) if per_page else 1,
        },
    })


@dashboard_bp.route('/activity', methods=['POST'])
@jwt_required()
def create_activity():
    user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)
    parsed, errors = validate_request(ActivityCreateSchema, data)
    if errors:
        return error_response('Validation failed', 400, errors)
    log_activity(user_id, parsed['action_text'], parsed.get('icon', 'info'), parsed.get('color', 'blue'))
    return success_response('Activity logged', status_code=201)


@dashboard_bp.route('/next-steps', methods=['GET'])
@jwt_required()
def next_steps():
    profile = VoterProfile.objects(user_id=get_jwt_identity()).first()
    return success_response(data={'next_steps': build_next_steps(profile)})


@dashboard_bp.route('/step/<step_id>', methods=['PATCH'])
@jwt_required()
def complete_step(step_id):
    user_id = get_jwt_identity()
    profile = VoterProfile.objects(user_id=user_id).first()

    if step_id == 'verify_id' and profile:
        profile.id_verified = True
        profile.save()
        log_activity(user_id, 'ID verified via dashboard', 'badge', 'green')
    elif step_id == 'request_mail_ballot' and profile:
        profile.mail_ballot_requested = True
        profile.save()
        log_activity(user_id, 'Mail ballot requested', 'mail', 'blue')
    else:
        log_activity(user_id, f'Step "{step_id}" marked complete', 'check_circle', 'green')

    return success_response(f'Step {step_id} marked complete')
