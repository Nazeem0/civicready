from extensions import db
from datetime import datetime

class SimulationConfig(db.Document):
    user_id = db.StringField(required=True)
    voting_method = db.StringField(default="First-Past-The-Post")
    districts = db.IntField(default=24)
    candidates = db.IntField(default=4)
    voter_age = db.StringField(default="18+")
    term_limits = db.StringField(default="None")
    district_bias = db.BooleanField(default=False)
    participation_rate = db.IntField(default=72)
    
    # Results caching
    results = db.DictField(default={
        "projected_winner": "Progressive Alliance",
        "turnout": 72,
        "fairness_score": 8.4,
        "seat_delta": "+12.4% Accuracy",
        "prog_seats": 162,
        "cons_seats": 144,
        "lib_seats": 81,
        "oth_seats": 63
    })
    
    updated_at = db.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'simulation_configs',
        'indexes': [
            {'fields': ['user_id'], 'unique': True},
        ],
    }

    def to_dict(self):
        return {
            'voting_method': self.voting_method,
            'districts': self.districts,
            'candidates': self.candidates,
            'voter_age': self.voter_age,
            'term_limits': self.term_limits,
            'district_bias': self.district_bias,
            'participation_rate': self.participation_rate,
            'results': self.results
        }
