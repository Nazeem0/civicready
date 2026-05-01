from extensions import db
from datetime import datetime


class SimProgress(db.Document):
    user_id = db.StringField(required=True)
    module_id = db.StringField(required=True)
    completed = db.BooleanField(default=False)
    score = db.IntField(null=True)
    attempts = db.IntField(default=0)
    unlocked_badges = db.ListField(db.StringField(), default=list)
    last_played_at = db.DateTimeField(null=True)

    meta = {
        'collection': 'sim_progress',
        'indexes': [
            {'fields': ['user_id', 'module_id'], 'unique': True},
        ],
    }

    def to_dict(self):
        return {
            'module_id': self.module_id,
            'completed': self.completed,
            'score': self.score,
            'attempts': self.attempts,
            'unlocked_badges': self.unlocked_badges,
            'last_played_at': self.last_played_at.isoformat() if self.last_played_at else None,
        }
