from flask import Blueprint, request
from models.deadline import Deadline
from utils.responses import success_response

public_bp = Blueprint('public', __name__)


@public_bp.route('/health', methods=['GET'])
def health():
    return success_response('OK', {'status': 'ok'})


@public_bp.route('/stats', methods=['GET'])
def stats():
    return success_response(data={
        'voters_reached': 2400000,
        'languages_supported': 12,
        'states_covered': 50,
        'uptime_percent': 98,
    })


@public_bp.route('/deadlines/public', methods=['GET'])
def public_deadlines():
    state = request.args.get('state')
    if state:
        deadlines = Deadline.objects(is_active=True, __raw__={
            '$or': [{'state': state}, {'state': None}]
        }).order_by('deadline_date')
    else:
        deadlines = Deadline.objects(is_active=True).order_by('deadline_date')
    return success_response(data={'deadlines': [d.to_dict() for d in deadlines]})
