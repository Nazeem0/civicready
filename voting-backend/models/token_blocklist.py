from extensions import db
from datetime import datetime


class TokenBlocklist(db.Document):
    jti = db.StringField(required=True, unique=True)
    token_type = db.StringField(required=True)
    created_at = db.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'token_blocklist',
        'indexes': ['jti'],
    }
