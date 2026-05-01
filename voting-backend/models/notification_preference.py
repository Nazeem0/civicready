from extensions import db


class NotificationPreference(db.Document):
    user_id = db.StringField(required=True, unique=True)
    email_enabled = db.BooleanField(default=True)
    in_app_enabled = db.BooleanField(default=True)
    receive_deadlines = db.BooleanField(default=True)
    receive_alerts = db.BooleanField(default=True)

    meta = {
        'collection': 'notification_preferences',
        'indexes': ['user_id'],
    }

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'email_enabled': self.email_enabled,
            'in_app_enabled': self.in_app_enabled,
            'receive_deadlines': self.receive_deadlines,
            'receive_alerts': self.receive_alerts,
        }
