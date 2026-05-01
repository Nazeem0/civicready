from extensions import db, bcrypt
from datetime import datetime


class User(db.Document):
    email = db.EmailField(required=True, unique=True)
    phone_number = db.StringField(null=True, unique=True, sparse=True)
    password_hash = db.StringField(required=True)
    full_name = db.StringField(required=True, max_length=255)
    role = db.StringField(default='voter')
    created_at = db.DateTimeField(default=datetime.utcnow)
    last_login = db.DateTimeField(null=True)

    meta = {
        'collection': 'users',
        'indexes': ['email'],
    }

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': str(self.id),
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
