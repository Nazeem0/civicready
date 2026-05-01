from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import random
from datetime import datetime

from utils.responses import success_response, error_response
from models.simulation_config import SimulationConfig
from models.electoral_sim_config import ElectoralSimConfig

simulation_bp = Blueprint('simulation', __name__)

def calculate_results(config_data):
    # Base logic simulation
    districts = config_data.get('districts', 24)
    participation = config_data.get('participation_rate', 72)
    voting_method = config_data.get('voting_method', 'First-Past-The-Post')
    bias = config_data.get('district_bias', False)
    
    total_seats = districts * config_data.get('candidates', 4)
    if total_seats < 10:
        total_seats = 450 # fallback
        
    # Introduce some variation
    fairness = 8.4
    winner = "Progressive Alliance"
    
    prog_pct = 0.36
    cons_pct = 0.32
    lib_pct = 0.18
    oth_pct = 0.14
    
    if voting_method == "Ranked Choice Voting":
        fairness = 9.1
        lib_pct += 0.05
        prog_pct -= 0.02
        cons_pct -= 0.03
    elif voting_method == "Proportional Representation":
        fairness = 9.6
        oth_pct += 0.08
        cons_pct -= 0.04
        prog_pct -= 0.04
        winner = "Coalition Required"
        
    if bias:
        fairness -= 2.5
        cons_pct += 0.10
        prog_pct -= 0.05
        lib_pct -= 0.05
        winner = "Conservative Front"
        
    if participation < 50:
        fairness -= 1.0
        
    return {
        "projected_winner": winner,
        "turnout": participation,
        "fairness_score": round(fairness, 1),
        "seat_delta": f"+{random.randint(2, 15)}% Accuracy",
        "prog_seats": int(total_seats * prog_pct),
        "cons_seats": int(total_seats * cons_pct),
        "lib_seats": int(total_seats * lib_pct),
        "oth_seats": int(total_seats * oth_pct),
        "total_seats": total_seats
    }

def calculate_electoral_results(config_data):
    import random
    population = config_data.get('voter_population', 100000)
    polarization = config_data.get('polarization_index', 0.5)
    demographic = config_data.get('demographic_shift', 'Neutral')

    # Completely randomize which candidate gets the highest base support so any can win
    bases = [40, 35, 15, 10]
    random.shuffle(bases)

    base_a = max(2, bases[0] + random.uniform(-8, 8))
    base_b = max(2, bases[1] + random.uniform(-8, 8))
    base_c = max(2, bases[2] + random.uniform(-8, 8))
    base_d = max(2, bases[3] + random.uniform(-8, 8))

    if demographic == 'Youth Surge':
        base_a += 8; base_b -= 5; base_c += 2; base_d -= 5
    elif demographic == 'Aging Population':
        base_b += 10; base_a -= 5; base_c -= 3; base_d -= 2

    if polarization > 0.7:
        base_a += 5; base_b += 5; base_c -= 5; base_d -= 5

    total = base_a + base_b + base_c + base_d
    pct_a = base_a / total
    pct_b = base_b / total
    pct_c = base_c / total
    pct_d = base_d / total

    # 1. FPTP
    fptp_scores = {"A": pct_a, "B": pct_b, "C": pct_c, "D": pct_d}
    sorted_fptp = sorted(fptp_scores.items(), key=lambda item: item[1], reverse=True)
    winner_fptp = f"Candidate {sorted_fptp[0][0]}"
    margin_fptp = round((sorted_fptp[0][1] - sorted_fptp[1][1]) * 100, 1)
    wasted = int((1.0 - sorted_fptp[0][1]) * population)

    # 2. RCV - Simple simulation: eliminate bottom two, reallocate their votes
    # In a real system this is iterative, but for the simulation we approximate:
    rcv_a = pct_a + (pct_d * random.uniform(0.1, 0.4)) + (pct_c * random.uniform(0.3, 0.7))
    rcv_b = pct_b + (pct_d * random.uniform(0.1, 0.4)) + (pct_c * random.uniform(0.3, 0.7))
    rcv_c = pct_c + (pct_d * random.uniform(0.1, 0.4)) + (pct_a * random.uniform(0.1, 0.3))
    rcv_d = pct_d + (pct_c * random.uniform(0.1, 0.4)) + (pct_b * random.uniform(0.1, 0.3))
    rcv_scores = {"A": rcv_a, "B": rcv_b, "C": rcv_c, "D": rcv_d}
    
    # Get top 2 for final round
    sorted_rcv = sorted(rcv_scores.items(), key=lambda item: item[1], reverse=True)
    top1, top2 = sorted_rcv[0], sorted_rcv[1]
    
    rcv_tot = top1[1] + top2[1]
    final_rcv_1 = int((top1[1] / rcv_tot) * 100)
    final_rcv_2 = 100 - final_rcv_1
    winner_rcv = f"Candidate {top1[0]}"

    # 3. Approval Voting - voters approve candidates within spread of their top choice
    approval_spread = max(0.05, 0.25 - polarization * 0.15)
    appr_a = int((pct_a + pct_c * approval_spread * 2) * 100)
    appr_b = int((pct_b + pct_d * approval_spread * 2) * 100)
    appr_c = int((pct_c + (pct_a + pct_b) * approval_spread) * 100)
    appr_d = int((pct_d + (pct_a + pct_b) * approval_spread) * 100)
    appr_scores = {"A": appr_a, "B": appr_b, "C": appr_c, "D": appr_d}
    winner_appr_key = max(appr_scores, key=appr_scores.get)
    minor_boost = ((appr_c - int(pct_c*100)) + (appr_d - int(pct_d*100))) // 2

    # 4. Proportional Representation - seats proportional to vote share
    seats_a = int(pct_a * 100)
    seats_b = int(pct_b * 100)
    seats_c = int(pct_c * 100)
    seats_d = 100 - seats_a - seats_b - seats_c
    coalition_needed = max(seats_a, seats_b, seats_c, seats_d) <= 50
    majority_holder = None
    for cand, seats in [("A", seats_a), ("B", seats_b), ("C", seats_c), ("D", seats_d)]:
        if seats > 50:
            majority_holder = f"Candidate {cand}"

    return {
        "fptp_results": {
            "winner": winner_fptp,
            "margin": f"{margin_fptp}%",
            "wasted_votes": wasted,
            "party_breakdown": {"A": int(pct_a*100), "B": int(pct_b*100), "C": int(pct_c*100), "D": int(pct_d*100)}
        },
        "rcv_results": {
            "winner": winner_rcv,
            "rounds": 3 if (pct_c > 0.05 or pct_d > 0.05) else 2,
            "consensus_score": 100 - int(abs(final_rcv_1 - final_rcv_2)),
            "party_breakdown": {top1[0]: final_rcv_1, top2[0]: final_rcv_2}
        },
        "approval_results": {
            "winner": f"Candidate {winner_appr_key}",
            "approval_scores": appr_scores,
            "minor_party_boost": f"+{minor_boost}% vs FPTP",
            "note": "Voters may approve multiple candidates; scores reflect total approvals"
        },
        "pr_results": {
            "winner": majority_holder or "Coalition Required",
            "coalition_needed": coalition_needed,
            "seats": {"A": seats_a, "B": seats_b, "C": seats_c, "D": seats_d},
            "total_seats": 100,
            "note": "No single party holds majority — coalition government needed" if coalition_needed else f"{majority_holder} holds outright majority"
        }
    }
@simulation_bp.route('/config', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_config():
    if request.method == 'OPTIONS':
        return success_response()
        
    user_id = get_jwt_identity()
    config = SimulationConfig.objects(user_id=user_id).first()
    
    if not config:
        config = SimulationConfig(user_id=user_id)
        config.save()
        
    return success_response(data=config.to_dict())


@simulation_bp.route('/save', methods=['POST', 'OPTIONS'])
@jwt_required()
def save_config():
    if request.method == 'OPTIONS':
        return success_response()
        
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return error_response("Invalid data", 400)
        
    config = SimulationConfig.objects(user_id=user_id).first()
    if not config:
        config = SimulationConfig(user_id=user_id)
        
    config.voting_method = data.get('voting_method', config.voting_method)
    config.districts = int(data.get('districts', config.districts))
    config.candidates = int(data.get('candidates', config.candidates))
    config.voter_age = data.get('voter_age', config.voter_age)
    config.term_limits = data.get('term_limits', config.term_limits)
    config.district_bias = bool(data.get('district_bias', config.district_bias))
    config.participation_rate = int(data.get('participation_rate', config.participation_rate))
    
    # Calculate results
    new_results = calculate_results(data)
    config.results = new_results
    config.updated_at = datetime.utcnow()
    config.save()
    
    return success_response(data=config.to_dict())

@simulation_bp.route('/electoral/config', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_electoral_config():
    if request.method == 'OPTIONS':
        return success_response()
        
    user_id = get_jwt_identity()
    config = ElectoralSimConfig.objects(user_id=user_id).first()
    
    if not config:
        config = ElectoralSimConfig(user_id=user_id)
        config.save()
        
    return success_response(data=config.to_dict())


@simulation_bp.route('/electoral/save', methods=['POST', 'OPTIONS'])
@jwt_required()
def save_electoral_config():
    if request.method == 'OPTIONS':
        return success_response()
        
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return error_response("Invalid data", 400)
        
    config = ElectoralSimConfig.objects(user_id=user_id).first()
    if not config:
        config = ElectoralSimConfig(user_id=user_id)
        
    config.voter_population = int(data.get('voter_population', config.voter_population))
    config.polarization_index = float(data.get('polarization_index', config.polarization_index))
    config.demographic_shift = data.get('demographic_shift', config.demographic_shift)
    
    # Calculate results
    new_results = calculate_electoral_results(data)
    config.fptp_results = new_results['fptp_results']
    config.rcv_results = new_results['rcv_results']
    config.approval_results = new_results['approval_results']
    config.pr_results = new_results['pr_results']
    config.updated_at = datetime.utcnow()
    config.save()

    return success_response(data=config.to_dict())


@simulation_bp.route('/electoral', methods=['POST', 'OPTIONS'])
def run_electoral_simulation():
    if request.method == 'OPTIONS':
        return success_response()

    data = request.get_json() or {}

    try:
        results = calculate_electoral_results(data)
    except Exception as e:
        return error_response(f"Simulation error: {str(e)}", 500)

    return success_response(data=results)


@simulation_bp.route('/test', methods=['GET', 'OPTIONS'])
def test_endpoint():
    return success_response(data={'message': 'Simulation endpoint is working'})

