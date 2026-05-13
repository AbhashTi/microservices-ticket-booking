import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import { getToken } from './auth';

function Match() {
  const { id } = useParams();
  const [match, setMatch] = useState({});
  const [shows, setShows] = useState([]);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [loadingShows, setLoadingShows] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || "";
    const token = getToken();
    setLoadingMatch(true);
    fetch(`${API}/matches/${id}`, { headers: { "Authorization": token, "Content-Type": "application/json" } })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setMatch(data || {}))
      .catch(() => setMatch({}))
      .finally(() => setLoadingMatch(false));

    setLoadingShows(true);
    fetch(`${API}/matches/${id}/sessions`, { headers: { "Authorization": token, "Content-Type": "application/json" } })
      .then(res => res.ok ? res.json() : [])
      .then(list => setShows(Array.isArray(list) ? list : []))
      .catch(() => setShows([]))
      .finally(() => setLoadingShows(false));
  }, [id]);

  const formatShowTime = (iso) => {
    if (!iso) return 'TBA';
    const d = new Date(iso);
    try {
      return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
        + ' • ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } catch { return d.toString(); }
  };

  const teams = (match.teams || 'Team A vs Team B').split(/\s+vs\.?\s+/i);
  const team1 = teams[0] || 'Team A';
  const team2 = teams[1] || 'Team B';

  return (
    <div style={{ minHeight: '100vh', background: '#0f0617' }}>
      <NavBar />
      <div style={{ position: 'relative', minHeight: 560, overflow: 'hidden' }}>
        {!loadingMatch && match.posterUrl && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${match.posterUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) brightness(0.25)', transform: 'scale(1.2)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,6,23,0.4) 0%, #0f0617 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '48px 48px 60px', display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto', width: 280 }}>
            {loadingMatch ? (
              <div style={{ width: 280, height: 400, borderRadius: 16, background: '#1a1028' }} />
            ) : (
              <img src={match.posterUrl || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400'} alt={match.teams}
                style={{ width: 280, height: 400, objectFit: 'cover', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.08)' }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 300, paddingTop: 12 }}>
            {!loadingMatch && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1f80e0, #0066cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 10px' }}>{team1.charAt(0)}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{team1}</div>
                  </div>
                  <div style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(224,64,251,0.15)', border: '1px solid rgba(224,64,251,0.2)' }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#e040fb' }}>VS</span>
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #e040fb, #9c27b0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 10px' }}>{team2.charAt(0)}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{team2}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {match.format && <span style={{ padding: '6px 14px', borderRadius: 6, background: '#1f80e0', color: '#fff', fontSize: 13, fontWeight: 700 }}>{match.format}</span>}
                  <span style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', color: '#e8e8e8', fontSize: 13, fontWeight: 600 }}>🏟️ {match.stadiumName}</span>
                  <span style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(255,213,74,0.12)', color: '#ffd54a', fontSize: 13, fontWeight: 600 }}>🏆 {match.tournament}</span>
                  {match.matchDate && <span style={{ padding: '6px 14px', borderRadius: 6, background: 'rgba(0,200,83,0.1)', color: '#00c853', fontSize: 13, fontWeight: 600 }}>📅 {new Date(match.matchDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
                </div>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, margin: '0 0 28px 0', maxWidth: 600 }}>{match.description || 'Join us for an exciting cricket match!'}</p>
              </>
            )}
            <div style={{ padding: 24, borderRadius: 16, background: 'rgba(26,16,40,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 16px 0' }}>🎫 Available Sessions</h3>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
              {loadingShows ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #1f80e0', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                </div>
              ) : shows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
                  <p style={{ color: '#888', fontSize: 14 }}>No sessions available yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {shows.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #00c853' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{formatShowTime(s.startTime || match.matchDate)}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{s.stadium || match.stadiumName}{s.priceRegular ? ` • From ₹${s.priceRegular}` : ''}</div>
                      </div>
                      {/* FIX: passes matchId (id) AND sessionId (s.id) in URL */}
                      <button onClick={() => navigate(`/bookmyshow/seat-layout/${id}/${s.id}`)}
                        style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f80e0, #0066cc)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Select Seats →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Match;
