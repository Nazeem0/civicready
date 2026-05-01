MODULE_METADATA = {
    'election_builder': {
        'id': 'election_builder',
        'title': 'Build-Your-Own Election',
        'desc': 'Design constituencies, set term limits, and define voter eligibility in this sandbox simulator.',
        'badge': 'Sandbox',
        'badge_color': 'blue',
        'difficulty': 'Beginner',
        'score_threshold': 60,
        'badge_reward': 'Civic Apprentice',
        'features': [],
    },
    'electoral_sim': {
        'id': 'electoral_sim',
        'title': 'Electoral Simulator',
        'desc': 'Compare First-Past-The-Post vs. Ranked Choice Voting in real-time datasets.',
        'badge': 'Popular',
        'badge_color': 'purple',
        'difficulty': 'Intermediate',
        'score_threshold': 70,
        'badge_reward': 'Electoral Scholar',
        'features': ['Analyze Proportional Rep', 'Predict Winner Shifts', 'Suppression Heatmaps'],
    },
    'gerrymandering': {
        'id': 'gerrymandering',
        'title': 'Gerrymandering Visualizer',
        'desc': "See how 'Packing and Cracking' changes the political landscape of a state map.",
        'badge': 'Visual',
        'badge_color': 'teal',
        'difficulty': 'Intermediate',
        'score_threshold': 65,
        'badge_reward': 'Gerrymander Buster',
        'features': [],
    },
    'bill_runner': {
        'id': 'bill_runner',
        'title': 'Bill Runner',
        'desc': 'Can you pass a bill through congress? A fast-paced legislative mini-game.',
        'badge': 'Mini-Game',
        'badge_color': 'amber',
        'difficulty': 'Advanced',
        'score_threshold': 75,
        'badge_reward': 'Democracy Expert',
        'features': [],
    },
}

ALL_BADGES = ['Civic Apprentice', 'Electoral Scholar', 'Gerrymander Buster', 'Democracy Expert']

MASTERY_LEVELS = [
    (0,  'Newcomer'),
    (25, 'Civic Apprentice'),
    (50, 'Electoral Scholar'),
    (75, 'Democracy Advocate'),
    (100,'Democracy Expert'),
]

POLLING_LOCATIONS = {
    'default': 'Central Library — 0.4 mi',
    '90210':   'Beverly Hills City Hall — 0.2 mi',
    '10001':   'Manhattan Community Center — 0.6 mi',
    '60601':   'Chicago Civic Center — 0.3 mi',
    '77001':   'Houston Convention Center — 0.5 mi',
    '30301':   'Atlanta Fulton County Library — 0.4 mi',
}

DEFAULT_NEXT_STEPS = [
    {'id': 'verify_id',          'icon': 'badge',          'title': 'Verify Your ID',              'desc': 'Required for polling confirmation',   'color': 'red'},
    {'id': 'complete_address',   'icon': 'edit_location',  'title': 'Complete Address Update',      'desc': 'Required for polling assignment',      'color': 'red'},
    {'id': 'request_mail_ballot','icon': 'mail',           'title': 'Request Mail Ballot',          'desc': 'Optional but recommended',             'color': 'amber'},
    {'id': 'review_deadlines',   'icon': 'timer',          'title': 'Review Your Deadlines',        'desc': 'Know your key election dates',         'color': 'blue'},
]

EDUCATOR_RESOURCES = [
    {'title': 'Democracy 101 Lesson Plan',         'type': 'PDF', 'url': '/resources/democracy-101.pdf'},
    {'title': 'Gerrymandering Worksheet',           'type': 'PDF', 'url': '/resources/gerry-worksheet.pdf'},
    {'title': 'Voting Rights Guide',                'type': 'PDF', 'url': '/resources/voting-rights.pdf'},
    {'title': 'Electoral Systems Comparison Chart', 'type': 'PDF', 'url': '/resources/electoral-systems.pdf'},
]
