from datetime import datetime
from utils.constants import POLLING_LOCATIONS, MASTERY_LEVELS, MODULE_METADATA


def time_ago(dt):
    if not dt:
        return 'unknown'
    now = datetime.utcnow()
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return 'just now'
    elif seconds < 3600:
        return f'{int(seconds / 60)}m ago'
    elif seconds < 86400:
        return f'{int(seconds / 3600)}h ago'
    elif seconds < 604800:
        return f'{int(seconds / 86400)}d ago'
    return dt.strftime('%b %d, %Y')


def get_polling_location(zip_code, state=None):
    if zip_code and str(zip_code) in POLLING_LOCATIONS:
        return POLLING_LOCATIONS[str(zip_code)]
    return POLLING_LOCATIONS['default']


def compute_mastery_level(percent):
    level = 'Newcomer'
    for threshold, label in MASTERY_LEVELS:
        if percent >= threshold:
            level = label
    return level


def compute_sim_progress_percent(sim_progress_list):
    total = len(MODULE_METADATA)
    if total == 0:
        return 0
    completed = sum(1 for s in sim_progress_list if s.completed)
    return int((completed / total) * 100)


def compute_impact_label(percent):
    if percent >= 75:
        return 'High'
    elif percent >= 40:
        return 'Medium'
    return 'Low'


def log_activity(user_id, action_text, icon='info', color='blue'):
    """Create and immediately save an ActivityLog document (MongoDB, no session needed)."""
    from models.activity_log import ActivityLog
    ActivityLog(user_id=str(user_id), action_text=action_text, icon=icon, color=color).save()


def check_eligibility_issues(parsed):
    issues = []
    from datetime import date
    dob = parsed.get('dob')
    if dob:
        age = (date.today() - dob).days // 365
        if age < 18:
            issues.append('Must be 18 years or older to vote')
    else:
        issues.append('Date of birth is required')
    if not parsed.get('state'):
        issues.append('State is required')
    if not parsed.get('zip_code'):
        issues.append('ZIP code is required')
    return issues


def build_next_steps(profile):
    from utils.constants import DEFAULT_NEXT_STEPS
    steps = []
    for step in DEFAULT_NEXT_STEPS:
        sid = step['id']
        if sid == 'verify_id' and profile and profile.id_verified:
            continue
        if sid == 'complete_address' and profile and profile.street_address:
            continue
        if sid == 'request_mail_ballot' and profile and profile.mail_ballot_requested:
            continue
        steps.append(step)
    return steps
