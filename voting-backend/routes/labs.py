from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.sim_progress import SimProgress
from schemas.labs_schema import CompleteModuleSchema
from utils.responses import success_response, error_response
from utils.helpers import log_activity, compute_sim_progress_percent, compute_mastery_level, compute_impact_label
from utils.validators import validate_request
from utils.constants import MODULE_METADATA, ALL_BADGES, EDUCATOR_RESOURCES
from datetime import datetime

labs_bp = Blueprint('labs', __name__)


def _get_or_create_progress(user_id, module_id):
    prog = SimProgress.objects(user_id=user_id, module_id=module_id).first()
    if not prog:
        prog = SimProgress(user_id=user_id, module_id=module_id)
        prog.save()
    return prog


@labs_bp.route('/modules', methods=['GET'])
@jwt_required()
def list_modules():
    user_id = get_jwt_identity()
    sim_records = list(SimProgress.objects(user_id=user_id))
    progress_map = {s.module_id: s for s in sim_records}

    modules = []
    for mod_id, meta in MODULE_METADATA.items():
        prog = progress_map.get(mod_id)
        modules.append({
            **meta,
            'completed': prog.completed if prog else False,
            'score': prog.score if prog else None,
            'attempts': prog.attempts if prog else 0,
            'last_played_at': prog.last_played_at.isoformat() if prog and prog.last_played_at else None,
        })

    percent = compute_sim_progress_percent(sim_records)
    return success_response(data={
        'modules': modules,
        'mastery_level': compute_mastery_level(percent),
        'sim_progress_percent': percent,
        'impact': compute_impact_label(percent),
    })


@labs_bp.route('/modules/<module_id>', methods=['GET'])
@jwt_required()
def get_module(module_id):
    if module_id not in MODULE_METADATA:
        return error_response('Module not found', 404)
    user_id = get_jwt_identity()
    meta = MODULE_METADATA[module_id]
    prog = SimProgress.objects(user_id=user_id, module_id=module_id).first()
    return success_response(data={
        **meta,
        'completed': prog.completed if prog else False,
        'score': prog.score if prog else None,
        'attempts': prog.attempts if prog else 0,
    })


@labs_bp.route('/modules/<module_id>/launch', methods=['POST'])
@jwt_required()
def launch_module(module_id):
    if module_id not in MODULE_METADATA:
        return error_response('Module not found', 404)
    user_id = get_jwt_identity()
    prog = _get_or_create_progress(user_id, module_id)
    prog.attempts += 1
    prog.last_played_at = datetime.utcnow()
    prog.save()
    log_activity(user_id, f'Launched {MODULE_METADATA[module_id]["title"]}', 'science', 'purple')
    return success_response('Module launched', prog.to_dict())


@labs_bp.route('/modules/<module_id>/complete', methods=['POST'])
@jwt_required()
def complete_module(module_id):
    if module_id not in MODULE_METADATA:
        return error_response('Module not found', 404)
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)
    parsed, errors = validate_request(CompleteModuleSchema, data)
    if errors:
        return error_response('Validation failed', 400, errors)

    user_id = get_jwt_identity()
    meta = MODULE_METADATA[module_id]
    prog = _get_or_create_progress(user_id, module_id)
    prog.score = parsed['score']
    prog.completed = True
    prog.last_played_at = datetime.utcnow()

    newly_unlocked = []
    if parsed['score'] >= meta['score_threshold']:
        reward = meta['badge_reward']
        if reward not in prog.unlocked_badges:
            prog.unlocked_badges.append(reward)
            newly_unlocked.append(reward)

    prog.save()
    log_activity(user_id, f'Completed {meta["title"]}', 'emoji_events', 'green')
    return success_response('Module completed', {
        'score': prog.score,
        'badges_unlocked': newly_unlocked,
        'module': prog.to_dict(),
    })


@labs_bp.route('/unlocks', methods=['GET'])
@jwt_required()
def unlocks():
    user_id = get_jwt_identity()
    sim_records = SimProgress.objects(user_id=user_id)
    earned = set()
    for s in sim_records:
        earned.update(s.unlocked_badges)
    return success_response(data={
        'earned': list(earned),
        'locked': [b for b in ALL_BADGES if b not in earned],
        'all': ALL_BADGES,
    })


@labs_bp.route('/stats', methods=['GET'])
@jwt_required()
def stats():
    return success_response(data={'active_sims': 12847, 'educators': 3200, 'countries': 47})


@labs_bp.route('/resources', methods=['GET'])
@jwt_required()
def resources():
    return success_response(data={'resources': EDUCATOR_RESOURCES})
