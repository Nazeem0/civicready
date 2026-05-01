from extensions import db
from datetime import datetime


class ActivityLog(db.Document):
    user_id = db.StringField(required=True)
    action_text = db.StringField(required=True, max_length=255)
    icon = db.StringField(default='info')
    color = db.StringField(default='blue')
    created_at = db.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'activity_logs',
        'indexes': ['user_id', '-created_at'],
    }

    def to_dict(self):
        from utils.helpers import time_ago
        return {
            'id': str(self.id),
            'action_text': self.action_text,
            'icon': self.icon,
            'color': self.color,
            'created_at': self.created_at.isoformat(),
            'time_ago': time_ago(self.created_at),
        }
