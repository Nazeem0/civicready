from extensions import db
from datetime import date


class Deadline(db.Document):
    title = db.StringField(required=True, max_length=255)
    description = db.StringField(null=True)
    deadline_date = db.DateField(required=True)
    type = db.StringField(required=True)   # registration | mail | election | early
    state = db.StringField(null=True)
    is_active = db.BooleanField(default=True)

    meta = {
        'collection': 'deadlines',
        'indexes': ['is_active', 'deadline_date'],
    }

    @property
    def days_remaining(self):
        return (self.deadline_date - date.today()).days

    def to_dict(self):
        return {
            'id': str(self.id),
            'title': self.title,
            'description': self.description,
            'deadline_date': self.deadline_date.isoformat(),
            'days_remaining': self.days_remaining,
            'type': self.type,
            'state': self.state,
            'is_active': self.is_active,
        }
