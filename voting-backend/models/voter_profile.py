from extensions import db
from datetime import datetime, date


class VoterProfile(db.Document):
    """
    Stored as a separate collection, linked to User via user_id (string of ObjectId).
    One-to-one: one profile per user.
    """
    user_id = db.StringField(required=True, unique=True)
    dob = db.DateField(null=True)
    zip_code = db.StringField(null=True)
    state = db.StringField(null=True, max_length=100)
    street_address = db.StringField(null=True, max_length=255)
    city = db.StringField(null=True, max_length=100)
    unit = db.StringField(null=True, max_length=50)
    age = db.IntField(null=True)
    email = db.EmailField(null=True)
    phone_number = db.StringField(null=True)
    father_name = db.StringField(null=True, max_length=255)
    mother_name = db.StringField(null=True, max_length=255)
    gender = db.StringField(null=True, choices=['Male', 'Female', 'Other', 'Prefer not to say'])
    occupation = db.StringField(null=True, max_length=100)
    registration_status = db.StringField(default='incomplete')
    id_verified = db.BooleanField(default=False)
    id_document_path = db.StringField(null=True)
    mail_ballot_requested = db.BooleanField(default=False)
    polling_location = db.StringField(null=True)
    elections_voted = db.IntField(default=0)
    created_at = db.DateTimeField(default=datetime.utcnow)
    updated_at = db.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'voter_profiles',
        'indexes': ['user_id'],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)

    def compute_completion_percent(self):
        fields = [
            self.dob, self.zip_code, self.state, self.street_address, self.city,
            self.age, self.email, self.phone_number, self.father_name, self.mother_name,
            self.gender, self.occupation
        ]
        filled = sum(1 for f in fields if f is not None)
        base = int((filled / len(fields)) * 75)
        bonus = 0
        if self.id_verified:
            bonus += 15
        if self.registration_status == 'active':
            bonus += 10
        return min(base + bonus, 100)

    def count_pending_issues(self):
        issues = 0
        if not self.dob:
            issues += 1
        if not self.street_address:
            issues += 1
        if not self.id_verified:
            issues += 1
        if not self.mail_ballot_requested:
            issues += 1
        return issues

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': self.user_id,
            'dob': self.dob.isoformat() if self.dob else None,
            'zip_code': self.zip_code,
            'state': self.state,
            'street_address': self.street_address,
            'city': self.city,
            'unit': self.unit,
            'age': self.age,
            'email': self.email,
            'phone_number': self.phone_number,
            'father_name': self.father_name,
            'mother_name': self.mother_name,
            'gender': self.gender,
            'occupation': self.occupation,
            'registration_status': self.registration_status,
            'id_verified': self.id_verified,
            'id_document_path': self.id_document_path,
            'mail_ballot_requested': self.mail_ballot_requested,
            'polling_location': self.polling_location,
            'elections_voted': self.elections_voted,
            'completion_percent': self.compute_completion_percent(),
            'pending_issues': self.count_pending_issues(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
