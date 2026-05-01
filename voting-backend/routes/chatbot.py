from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import random
from utils.responses import success_response, error_response
from utils.helpers import log_activity
from models.voter_profile import VoterProfile
from extensions import limiter

chatbot_bp = Blueprint('chatbot', __name__)

# ── Smart keyword-based dummy response engine ──────────────────────────────────

RESPONSES = {
    "voter id": [
        "A valid voter ID is required to cast your ballot in most states. Accepted forms typically include: a government-issued photo ID, driver's license, passport, or state ID card. Student IDs may or may not be accepted depending on your state.",
        "Voter ID laws vary by state. In strict photo ID states, you must show a photo ID. Other states accept non-photo ID like utility bills or bank statements. Check with your local election office to confirm what's accepted in your area."
    ],
    "registration": [
        "Voter registration deadlines vary by state, typically ranging from 7 to 30 days before Election Day. Some states offer same-day registration. Visit your state's Secretary of State website to register online.",
        "To register to vote you generally need: proof of citizenship, your full legal name, date of birth, current address, and a government ID number. You can usually register online, by mail, or in person at your local election office."
    ],
    "deadline": [
        "Registration deadlines differ by state. Most states require registration 15–30 days before Election Day. Alaska, California, and several others allow same-day registration at the polls.",
        "The voter registration deadline is typically around 30 days before an election. However, some states like North Dakota have no registration requirement at all. Always double-check your specific state's deadline."
    ],
    "mail": [
        "Mail-in (absentee) voting is available in all 50 states. Some states automatically send mail ballots to all registered voters. Request your mail ballot at least 2 weeks before the election to ensure you receive it in time.",
        "To vote by mail: request an absentee ballot from your local election office, complete it following the instructions carefully, and return it by the deadline — either by mail or by dropping it at an official drop box."
    ],
    "polling": [
        "Your polling location is assigned based on your registered home address. You can find your polling place by visiting your state's voter lookup portal or by checking the card mailed to you when you registered.",
        "Polling locations are typically schools, community centers, or government buildings in your neighborhood. If your polling location has changed, you should have received a notice in the mail. Always confirm before Election Day."
    ],
    "eligibility": [
        "To be eligible to vote in the United States you must be: a U.S. citizen, at least 18 years old on or before Election Day, a resident of the state where you're registering, and not currently serving a felony sentence (rules vary by state).",
        "Most U.S. citizens 18 and older are eligible to vote. Some states also allow 17-year-olds to vote in primaries if they will be 18 by the general election. Check your state's specific eligibility requirements."
    ],
    "absentee": [
        "An absentee ballot allows you to vote without going to a polling place. You can request one if you'll be away on Election Day, have a disability, or simply prefer to vote from home. Request it early to avoid delays.",
        "Absentee voting is a great option if you cannot make it to the polls. Most states require a valid reason, while others have 'no-excuse' absentee voting. Fill out your ballot carefully and return it before the deadline."
    ],
    "rights": [
        "As a registered voter, you have the right to: vote privately without interference, receive assistance if you have a disability or language barrier, cast a provisional ballot if your eligibility is questioned, and report any voting problems without fear of retaliation.",
        "Your voting rights are protected by federal law. You cannot be denied the right to vote based on race, color, sex, or age (if 18+). If you face discrimination at the polls, contact the Election Protection Hotline: 1-866-OUR-VOTE."
    ],
    "help": [
        "I can help you with: voter registration, ID requirements, polling locations, mail-in ballots, eligibility rules, voting rights, and election deadlines. What would you like to know more about?",
        "Sure! Ask me anything about voter registration, ID laws, absentee ballots, polling locations, or your general voting rights. I'm here to help!"
    ],
    "hi": [
        "Hello! I'm the CivicReady Voter Rights AI. I can answer questions about voter registration, ID requirements, polling locations, mail-in ballots, and your voting rights. How can I help you today?",
        "Hi there! Welcome to CivicReady. Ask me anything about the voting process — I'm here to make civic participation easy for everyone!"
    ],
    "hello": [
        "Hello! How can I assist you with your voting questions today?",
        "Hi! I'm your CivicReady Voter Rights assistant. Feel free to ask about registration, ID rules, or how to cast your ballot."
    ],
    "aadhar": [
        "In India, the Aadhar card serves as a primary proof of identity for voter registration. It helps election authorities verify your identity and address. Make sure your Aadhar details match your voter registration application exactly.",
        "Your Aadhar card can be used as a valid ID document for voter registration in India. The Election Commission cross-references Aadhar data with voter rolls to eliminate duplicate entries and ensure accurate voter lists."
    ],
    "election": [
        "Elections in India are conducted by the Election Commission of India (ECI). The ECI is an autonomous constitutional authority responsible for administering Union and State election processes.",
        "The electoral process involves multiple stages: voter registration, campaign period, voting day, counting of votes, and declaration of results. Each stage is monitored by election officials and independent observers."
    ],
    "default": [
        "That's a great question! For the most accurate and up-to-date information about voting in your specific area, I recommend contacting your local election office or visiting vote.gov. Is there anything else I can help you with?",
        "I want to make sure you get the right answer. For jurisdiction-specific questions, please visit your state's official election website or call your local county clerk's office. They can provide the most accurate guidance.",
        "Great question! Voting rules can vary significantly by state and locality. I'd recommend checking vote.gov or contacting the Election Protection Hotline at 1-866-OUR-VOTE for personalized assistance."
    ]
}

def get_smart_response(user_message: str) -> str:
    msg = user_message.lower()
    for keyword, replies in RESPONSES.items():
        if keyword in msg:
            return random.choice(replies)
    return random.choice(RESPONSES["default"])


@chatbot_bp.route('/ask', methods=['POST'])
@jwt_required()
@limiter.limit('50 per day')
def ask_chatbot():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'messages' not in data:
        return error_response("Please provide an array of 'messages'", 400)

    messages = data['messages']

    # Get the last user message
    last_user_msg = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            last_user_msg = msg.get("content", "")
            break

    if not last_user_msg:
        return error_response("No user message found", 400)

    reply = get_smart_response(last_user_msg)

    log_activity(user_id, "Asked a question to the Voter Rights Chatbot", "smart_toy", "purple")

    return success_response(data={"reply": reply})