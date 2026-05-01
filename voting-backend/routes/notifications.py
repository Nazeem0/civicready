from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.notification import Notification
from models.notification_preference import NotificationPreference
from utils.responses import success_response, error_response

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    status = request.args.get('status')
    
    query = Notification.objects(user_id=user_id)
    if status:
        query = query.filter(status=status)
        
    notifications = query.order_by('-created_at').limit(50)
    return success_response(data=[n.to_dict() for n in notifications])


@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    user_id = get_jwt_identity()
    notification = Notification.objects(id=notification_id, user_id=user_id).first()
    
    if not notification:
        return error_response('Notification not found', 404)
        
    notification.mark_read()
    notification.save()
    return success_response('Notification marked as read', data=notification.to_dict())


@notifications_bp.route('/preferences', methods=['GET', 'PUT'])
@jwt_required()
def manage_preferences():
    user_id = get_jwt_identity()
    pref = NotificationPreference.objects(user_id=user_id).first()
    
    if not pref:
        pref = NotificationPreference(user_id=user_id)
        pref.save()

    if request.method == 'GET':
        return success_response(data=pref.to_dict())
        
    if request.method == 'PUT':
        data = request.get_json() or {}
        pref.email_enabled = data.get('email_enabled', pref.email_enabled)
        pref.in_app_enabled = data.get('in_app_enabled', pref.in_app_enabled)
        pref.receive_deadlines = data.get('receive_deadlines', pref.receive_deadlines)
        pref.receive_alerts = data.get('receive_alerts', pref.receive_alerts)
        pref.save()
        return success_response('Preferences updated', data=pref.to_dict())
