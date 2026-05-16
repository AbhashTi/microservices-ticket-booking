import requests
import time
from datetime import datetime, timedelta

API_BASE = "http://localhost:8085"

def wait_for_service(timeout=120):
    print("Waiting for match-service to be ready via api-gateway...")
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(f"{API_BASE}/matches", timeout=5)
            if r.status_code < 500:
                print("Service is up!")
                return True
        except Exception:
            pass
        print("  ...not ready yet, retrying in 5s")
        time.sleep(5)
    print(f"Service not ready after {timeout}s")
    return False

wait_for_service(timeout=120)

def get_token():
    try:
        r = requests.post(f"{API_BASE}/auth/signup", json={
            "fullName": "Admin User",
            "email": "admin@stadiumpass.com",
            "password": "password123",
            "role": "ADMIN"
        }, timeout=10)
        if r.status_code in [200, 201]:
            return r.json().get("token")
    except Exception:
        pass
    try:
        r = requests.post(f"{API_BASE}/auth/signin", json={
            "email": "admin@stadiumpass.com",
            "password": "password123"
        }, timeout=10)
        if r.status_code == 200:
            return r.json().get("token")
        print(f"Auth failed: {r.status_code} {r.text}")
    except Exception as e:
        print(f"Auth error: {e}")
    return None

TOKEN = get_token()
if not TOKEN:
    print("Could not get auth token. Exiting.")
    exit(1)

HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def create_match(teams, tournament, fmt, stadium, description, poster_url):
    r = requests.post(f"{API_BASE}/matches", headers=HEADERS, json={
        "teams": teams, "tournament": tournament, "format": fmt,
        "stadiumName": stadium, "description": description,
        "posterUrl": poster_url,
        "matchDate": datetime.now().strftime("%Y-%m-%d"),
        "active": True
    }, timeout=10)
    if r.status_code in [200, 201]:
        mid = r.json().get("id")
        print(f"Created match: {teams} -> id={mid}")
        return mid
    print(f"Failed match {teams}: {r.status_code} {r.text}")
    return None

def create_session(match_id, stadium, start_time):
    r = requests.post(f"{API_BASE}/sessions", headers=HEADERS, json={
        "matchId": match_id, "stadium": stadium,
        "startTime": start_time,
        "endTime": (datetime.fromisoformat(start_time.replace('Z','')) + timedelta(hours=4)).isoformat() + 'Z',
        "totalSeats": 100, "priceRegular": 500.0, "pricePremium": 1500.0
    }, timeout=10)
    if r.status_code in [200, 201]:
        print(f"  Session created for match {match_id}")
    else:
        print(f"  Session failed: {r.text}")

matches = [
    ("India vs Australia", "ICC World Cup 2024", "ODI", "Narendra Modi Stadium",
     "The ultimate clash between two cricket giants.",
     "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1200,q_60/lsci/db/PICTURES/CMS/370900/370956.6.jpg"),
    ("England vs Sri Lanka", "England Tour of SL", "T20", "Lord's Cricket Ground",
     "Engaging T20 series at the home of cricket.",
     "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1200,q_60/lsci/db/PICTURES/CMS/364200/364223.6.jpg"),
    ("MI vs CSK", "IPL 2026", "T20", "Wankhede Stadium",
     "The El Clasico of IPL. Mumbai Indians vs Chennai Super Kings.",
     "https://images.indianexpress.com/2024/04/MI-vs-CSK-LIVE.jpg"),
    ("RCB vs KKR", "IPL 2026", "T20", "M. Chinnaswamy Stadium",
     "High voltage match between RCB and KKR.",
     "https://static.independent.co.uk/2024/03/29/14/RCB-vs-KKR.jpg"),
    ("India vs Pakistan", "Asia Cup 2026", "T20", "Narendra Modi Stadium",
     "The biggest rivalry in cricket.",
     "https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1200,q_60/lsci/db/PICTURES/CMS/370900/370956.6.jpg"),
]

for m in matches:
    mid = create_match(*m)
    if mid:
        now = datetime.now()
        create_session(mid, m[3], (now + timedelta(days=2, hours=10)).isoformat() + 'Z')
        create_session(mid, m[3], (now + timedelta(days=3, hours=14)).isoformat() + 'Z')

print("Seeding complete. Hard refresh the browser (Cmd+Shift+R).")
