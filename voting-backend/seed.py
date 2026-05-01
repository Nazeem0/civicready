"""
seed.py — Populate the database with default data.
Run: python seed.py
"""
from app import create_app
from extensions import db
from models.user import User
from models.voter_profile import VoterProfile
from models.deadline import Deadline
from models.activity_log import ActivityLog
from datetime import date

app = create_app()

DEADLINES = [
    {
        'title': 'Voter Registration Deadline',
        'description': 'Last day to register to vote in the general election.',
        'deadline_date': date(2026, 10, 15),
        'type': 'registration',
        'state': None,
    },
    {
        'title': 'Mail-In Ballot Request Deadline',
        'description': 'Last day to request a mail-in ballot.',
        'deadline_date': date(2026, 10, 22),
        'type': 'mail',
        'state': None,
    },
    {
        'title': 'Early Voting Opens',
        'description': 'First day of early in-person voting.',
        'deadline_date': date(2026, 10, 18),
        'type': 'early',
        'state': None,
    },
    {
        'title': 'General Election Day',
        'description': 'Cast your ballot on election day.',
        'deadline_date': date(2026, 11, 3),
        'type': 'election',
        'state': None,
    },
    {
        'title': 'California Registration Deadline',
        'description': 'California-specific same-day registration ends.',
        'deadline_date': date(2026, 10, 17),
        'type': 'registration',
        'state': 'California',
    },
]


def seed_deadlines():
    for d in DEADLINES:
        exists = Deadline.objects(title=d['title']).first()
        if not exists:
            Deadline(**d, is_active=True).save()
    print(f'[OK] Seeded {len(DEADLINES)} deadlines.')


def seed_demo_user():
    email = 'demo@civicready.org'
    if User.objects(email=email).first():
        print('[INFO] Demo user already exists - skipping.')
        return

    user = User(email=email, full_name='Demo Citizen', role='voter')
    user.set_password('DemoPass123!')
    user.save()

    profile = VoterProfile(
        user_id=str(user.id),
        zip_code='90210',
        state='California',
        street_address='123 Democracy Drive',
        city='Beverly Hills',
        registration_status='incomplete',
        elections_voted=3,
    )
    profile.save()

    activities = [
        ('Account created',                  'person_add',    'green'),
        ('Viewed polling location',           'location_on',   'blue'),
        ('Viewed mail-in ballot guide',       'info',          'blue'),
        ('Completed "Democracy 101" module',  'school',        'purple'),
        ('Registration lookup initiated',     'how_to_vote',   'amber'),
    ]
    for text, icon, color in activities:
        ActivityLog(user_id=str(user.id), action_text=text, icon=icon, color=color).save()

    print('[OK] Demo user created -> demo@civicready.org / DemoPass123!')


if __name__ == '__main__':
    with app.app_context():
        # MongoEngine does not need db.create_all()
        seed_deadlines()
        seed_demo_user()
        print('[DONE] Seeding complete.')
