import requests
import json
import time
from datetime import datetime, timedelta

API_BASE = "http://localhost:8085"

def wait_for_service(url, timeout=120):
    print(f"Waiting for service at {url}...")
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url, timeout=5)
            if r.status_code < 500:
                print("Service is up!")
                return True
        except Exception:
            pass
        print("  ...not ready yet, retrying in 5s")
        time.sleep(5)
    print(f"Service did not become ready in {timeout}s")
    return False

# Wait for api-gateway to be up
wait_for_service(f"{API_BASE}/matches", timeout=120)

def get_token():
    signup_url = f"{API_BASE}/auth/signup"
    user_data = {
        "fullName": "Admin User",
        "email": "admin@stadiumpass.com",
        "password": "password123",
        "role": "ADMIN"
    }
    try:
        resp = requests.post(signup_url, json=user_data, timeout=10)
        if resp.status_code in [200, 201]:
            return resp.json()["token"]
    except Exception:
        pass

    signin_url = f"{API_BASE}/auth/signin"
    login_data = {"email": "admin@stadiumpass.com", "password": "password123"}
    resp = requests.post(signin_url, json=login_data, timeout=10)
    if resp.status_code == 200:
        return resp.json()["token"]
    else:
        print(f"Auth failed: {resp.status_code}, {resp.text}")
        return None

TOKEN = get_token()
HEADERS = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}

def create_match(teams, tournament, format, stadium, description, poster_url):
    url = f"{API_BASE}/matches"
    payload = {
        "teams": teams,
        "tournament": tournament,
        "format": format,
        "stadiumName": stadium,
        "description": description,
        "posterUrl": poster_url,
        "matchDate": datetime.now().strftime("%Y-%m-%d"),
        "active": True
    }
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=10)
    if resp.status_code in [200, 201]:
        print(f"Created match: {teams}")
        return resp.json()["id"]
    else:
        print(f"Failed to create match: {teams}, Status: {resp.status_code}, Body: {resp.text}")
        return None

def create_session(match_id, stadium, start_time):
    url = f"{API_BASE}/sessions"
    payload = {
        "matchId": match_id,
        "stadium": stadium,
        "startTime": start_time,
        "endTime": (datetime.fromisoformat(start_time.replace('Z', '')) + timedelta(hours=4)).isoformat() + 'Z',
        "totalSeats": 100,
        "priceRegular": 500.0,
        "pricePremium": 1500.0
    }
    resp = requests.post(url, json=payload, headers=HEADERS, timeout=10)
    if resp.status_code in [200, 201]:
        print(f"Created session for match {match_id}")
    else:
        print(f"Failed to create session: {resp.text}")

if not TOKEN:
    print("Could not get auth token. Exiting.")
else:
    matches = [
        {
            "teams": "India vs Australia",
            "tournament": "ICC World Cup 2024",
            "format": "ODI",
            "stadium": "Narendra Modi Stadium",
            "description": "The ultimate clash between two cricket giants. Witness history in the making.",
            "posterUrl": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1200,q_60/lsci/db/PICTURES/CMS/370900/370956.6.jpg"
        },
        {
            "teams": "England vs Sri Lanka",
            "tournament": "England Tour of SL",
            "format": "T20",
            "stadium": "Lord's Cricket Ground",
            "description": "Engaging T20 series between England and Sri Lanka at the home of cricket.",
            "posterUrl": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1200,q_60/lsci/db/PICTURES/CMS/364200/364223.6.jpg"
        },
        {
            "teams": "MI vs CSK",
            "tournament": "IPL 2024",
            "format": "T20",
            "stadium": "Wankhede Stadium",
            "description": "The El Clasico of IPL. Mumbai Indians vs Chennai Super Kings.",
            "posterUrl": "https://images.indianexpress.com/2024/04/MI-vs-CSK-LIVE.jpg"
        },
        {
            "teams": "RCB vs KKR",
            "tournament": "IPL 2024",
            "format": "T20",
            "stadium": "M. Chinnaswamy Stadium",
            "description": "High voltage match between RCB and KKR. Don't miss the fireworks.",
            "posterUrl": "https://static.independent.co.uk/2024/03/29/14/RCB-vs-KKR.jpg"
        }
    ]

    for m in matches:
        mid = create_match(m["teams"], m["tournament"], m["format"], m["stadium"], m["description"], m["posterUrl"])
        if mid:
            now = datetime.now()
            create_session(mid, m["stadium"], (now + timedelta(days=2, hours=10)).isoformat() + 'Z')
            create_session(mid, m["stadium"], (now + timedelta(days=3, hours=14)).isoformat() + 'Z')

print("Seeding complete.")
