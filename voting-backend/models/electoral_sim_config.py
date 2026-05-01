from extensions import db
from datetime import datetime

class ElectoralSimConfig(db.Document):
    user_id = db.StringField(required=True)
    voter_population = db.IntField(default=100000)
    polarization_index = db.FloatField(default=0.5)
    demographic_shift = db.StringField(default="Neutral")

    fptp_results = db.DictField(default={})
    rcv_results = db.DictField(default={})
    approval_results = db.DictField(default={})
    pr_results = db.DictField(default={})

    updated_at = db.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'electoral_sim_configs',
        'indexes': [{'fields': ['user_id'], 'unique': True}],
    }

    def to_dict(self):
        return {
            'voter_population': self.voter_population,
            'polarization_index': self.polarization_index,
            'demographic_shift': self.demographic_shift,
            'fptp_results': self.fptp_results,
            'rcv_results': self.rcv_results,
            'approval_results': self.approval_results,
            'pr_results': self.pr_results,
        }
