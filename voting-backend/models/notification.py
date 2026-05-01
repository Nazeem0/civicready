from extensions import db
from datetime import datetime


class Notification(db.Document):
    user_id = db.StringField(required=True)
    type = db.StringField(required=True)  # e.g., 'deadline_reminder', 'system_alert'
    title = db.StringField(required=True, max_length=255)
    message = db.StringField(required=True)
    channel = db.StringField(default='in_app', choices=['in_app', 'email'])
    status = db.StringField(default='unread', choices=['unread', 'read', 'sent', 'failed'])
    created_at = db.DateTimeField(default=datetime.utcnow)
    read_at = db.DateTimeField(null=True)

    meta = {
        'collection': 'notifications',
        'indexes': [
            {'fields': ['user_id', 'status']}  # Optimize unread queries
        ]
    }

    def mark_read(self):
        self.status = 'read'
        self.read_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'channel': self.channel,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
        }
