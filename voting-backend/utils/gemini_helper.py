"""
AI helper utility for CivicReady.

Uses Google Gemini 1.5 Flash as the primary AI engine via the
Google Generative Language REST API. Falls back to xAI Grok if
the Gemini API key is not configured.

Google Services used:
    - Google Generative Language API (Gemini 1.5 Flash)
    - API endpoint: generativelanguage.googleapis.com
"""

import os
import json
import urllib.request
import urllib.error
from typing import Optional

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
GROK_API_BASE = "https://api.x.ai/v1/chat/completions"

CIVIC_SYSTEM_PROMPT = (
    "You are CivicAI, a helpful and non-partisan civic information assistant "
    "for the CivicReady voter platform. Help users understand voter registration, "
    "election processes, voting systems, civic rights, and democratic participation. "
    "Keep answers concise (2-4 sentences), factual, and non-partisan. "
    "Do not express political opinions. "
    "If asked something unrelated to civics, politely redirect to civic topics."
)

# Built-in civic knowledge base — always available as fallback
CIVIC_KNOWLEDGE = {
    'register': (
        "To register to vote, you typically need to be a citizen, meet the age requirement (18 in most places), "
        "and submit a registration form before your jurisdiction's deadline. Many countries offer online registration "
        "through official government websites. Check your local election authority's website for specific requirements, "
        "deadlines, and ID documents needed."
    ),
    'ranked choice': (
        "Ranked Choice Voting (RCV) allows voters to rank candidates in order of preference (1st, 2nd, 3rd…). "
        "If no candidate wins a majority in the first round, the last-place candidate is eliminated and their votes "
        "are redistributed to the voters' next choice. This continues until one candidate reaches a majority."
    ),
    'gerrymandering': (
        "Gerrymandering is the practice of drawing electoral district boundaries to give one political party an "
        "unfair advantage. Common tactics include 'packing' (concentrating opposition voters in one district) and "
        "'cracking' (splitting opposition voters across multiple districts). Many countries have independent "
        "redistricting commissions to prevent this."
    ),
    'electoral college': (
        "The Electoral College is the US system for electing the President. Each state gets a number of electors "
        "equal to its congressional representation. Voters in each state choose electors who then formally cast "
        "votes for President. A candidate needs 270 of 538 electoral votes to win."
    ),
    'primary': (
        "A primary election is held within a political party to select its candidate for a general election. "
        "In a general election, candidates from different parties compete for the final office. Primaries can be "
        "'open' (any registered voter can participate) or 'closed' (only registered party members can vote)."
    ),
    'proportional': (
        "Proportional representation (PR) is an electoral system where parties receive seats in proportion to "
        "their share of the total vote. For example, a party with 30% of votes gets roughly 30% of seats. "
        "This contrasts with First-Past-The-Post where the winner takes all seats in a district."
    ),
    'bill': (
        "A bill becomes law through several steps: it's introduced in the legislature, reviewed by committees, "
        "debated and voted on in both chambers (in bicameral systems), then sent to the executive (President/Governor) "
        "to sign into law or veto. A vetoed bill can sometimes be overridden by a supermajority vote."
    ),
    'voter id': (
        "Voter ID laws require voters to present identification before casting a ballot. Requirements vary widely — "
        "some jurisdictions accept a broad range of IDs including utility bills, while others require government-issued "
        "photo ID. Proponents argue these laws prevent fraud; critics argue they disproportionately affect minority "
        "and low-income voters."
    ),
    'early voting': (
        "Early voting allows eligible voters to cast their ballot before Election Day, reducing long lines and "
        "making voting more accessible. Many jurisdictions offer in-person early voting at designated polling "
        "locations for a period ranging from a few days to several weeks before the election."
    ),
    'absentee': (
        "Absentee (or mail-in) voting allows voters to cast their ballot by mail instead of going to a polling "
        "place. Some states require a valid reason (illness, travel), while others allow 'no-excuse' mail voting. "
        "Ballots must typically be requested by a deadline and returned by Election Day."
    ),
}


def _get_knowledge_fallback(message: str) -> str:
    """Return a relevant civic answer from the built-in knowledge base."""
    msg_lower = message.lower()
    for keyword, answer in CIVIC_KNOWLEDGE.items():
        if keyword in msg_lower:
            return answer
    return (
        "I'm CivicAI, your civic education assistant! I can help with topics like voter registration, "
        "ranked choice voting, gerrymandering, the Electoral College, primary vs general elections, "
        "proportional representation, how bills become law, voter ID laws, and early voting. "
        "What would you like to know?"
    )



def _call_gemini(message: str, api_key: str) -> Optional[str]:
    """
    Call the Google Gemini 1.5 Flash API directly via REST.

    Args:
        message: The user's question.
        api_key: Google Gemini API key.

    Returns:
        Generated text response, or None on failure.
    """
    full_message = f"{CIVIC_SYSTEM_PROMPT}\n\nUser question: {message}"
    payload = json.dumps({
        "contents": [
            {"role": "user", "parts": [{"text": full_message}]}
        ],
        "generationConfig": {
            "maxOutputTokens": 400,
            "temperature": 0.3
        }
    }).encode("utf-8")

    url = f"{GEMINI_API_BASE}?key={api_key}"
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["candidates"][0]["content"]["parts"][0]["text"].strip()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else str(e)
        print(f"[Gemini] HTTP {e.code}: {body[:200]}")
        return None
    except Exception as e:
        print(f"[Gemini] Error: {e}")
        return None


def _call_grok(message: str, api_key: str) -> Optional[str]:
    """
    Call the xAI Grok API as a fallback via OpenAI-compatible endpoint.

    Args:
        message: The user's question.
        api_key: xAI Grok API key.

    Returns:
        Generated text response, or None on failure.
    """
    payload = json.dumps({
        "model": "grok-3-mini",
        "messages": [
            {"role": "system", "content": CIVIC_SYSTEM_PROMPT},
            {"role": "user", "content": message}
        ],
        "max_tokens": 400,
        "temperature": 0.3
    }).encode("utf-8")

    req = urllib.request.Request(
        GROK_API_BASE,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[Grok] Error: {e}")
        return None


def get_gemini_response(user_message: str, context: str = "") -> Optional[str]:
    """
    Get an AI response to a civic question.

    Priority order:
      1. Google Gemini 1.5 Flash (preferred — Google service)
      2. xAI Grok fallback
      3. Built-in civic knowledge base (always available)

    Args:
        user_message: The user's question.
        context: Optional additional context.

    Returns:
        The AI-generated response string (never None).
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        result = _call_gemini(user_message, gemini_key)
        if result:
            return result

    # Fallback to Grok
    grok_key = os.environ.get("GROK_API_KEY")
    if grok_key:
        result = _call_grok(user_message, grok_key)
        if result:
            return result

    # Final fallback — built-in civic knowledge base
    return _get_knowledge_fallback(user_message)


def get_civic_summary(topic: str) -> Optional[str]:
    """
    Generate a brief educational summary about a civic topic.

    Args:
        topic: The civic topic to summarize (e.g., 'ranked choice voting').

    Returns:
        A concise educational summary, or None if unavailable.
    """
    prompt = (
        f"Give a brief, factual, non-partisan explanation of '{topic}' "
        f"in 2-3 sentences for a voter education platform."
    )
    return get_gemini_response(prompt)
