import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from './auth';
import NavBar from './NavBar';
import { MyContext } from './Context';

function Matches() {
  const { moviesCache, setMoviesCache } = useContext(MyContext);
  const [matches, setMatches] = useState(moviesCache.data || []);
  const [loading, setLoading] = useState(matches.length === 0);
  const [filter, setFilter] = useState('all');
  const CACHE_TTL_MS = 5 * 60 * 1000;
  const navigate = useNavigate();

  useEffect(() => {
    if (moviesCache.data.length > 0 && Date.now() - moviesCache.fetchedAt < CACHE_TTL_MS) {
      setMatches(moviesCache.data); setLoading(false); return;
    }
    const API = process.env.REACT_APP_API_URL || "";
    const token = getToken();
    setLoading(true);
    fetch(`${API}/matches`, {
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      }
    })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => { setMatches(data); setMoviesCache({ data, fetchedAt: Date.now() }); })
      .catch(err => console.error("Error fetching matches:", err))
      .finally(() => setLoading(false));
  }, []);

  const nowShowing = matches.filter(m => m.active);
  const comingSoon = matches.filter(m => !m.active);
  const displayed = filter === 'live' ? nowShowing : filter === 'upcoming' ? comingSoon : matches;

  return (
    <div style={{ minHeight: '100vh', background: '#0f0617' }}>
      <NavBar />
      <div style={{ position: 'relative', overflow: 'hidden', padding: '48px 48px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 8px 0' }}>
          Cricket Matches
        </h1>
        <p style={{ fontSize: 15, color: '#888', margin: '0 0 28px 0' }}>
          Book tickets for the best stadium experience
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'all', label: `All (${matches.length})` },
            { key: 'live', label: `Live & Active (${nowShowing.length})` },
            { key: 'upcoming', label: `Upcoming (${comingSoon.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              style={{ padding: '8px 16px', borderRadius: 6, border: 'none',
                background: filter === tab.key ? '#1f80e0' : 'rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 48px 60px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>🏟️</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 10px 0' }}>No Matches Available</h3>
            <p style={{ fontSize: 15, color: '#888', maxWidth: 400, margin: '0 auto' }}>Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {displayed.map(match => <MatchCard key={match.id} match={match} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }) {
  const [h, setH] = useState(false);
  const navigate = useNavigate();
  const handleClick = () => {
    if (!match.active) return;
    const token = getToken();
    if (!token) return navigate('/users/login');
    navigate(`/bookmyshow/matches/${match.id}`);
  };
  return (
    <div onClick={handleClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ borderRadius: 12, overflow: 'hidden', background: '#1a1028',
        cursor: match.active ? 'pointer' : 'default', transition: 'all 300ms',
        transform: h && match.active ? 'translateY(-6px)' : 'none',
        boxShadow: h ? '0 20px 50px rgba(31,128,224,0.15)' : '0 4px 20px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        <img src={match.posterUrl || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400'}
          alt={match.teams} style={{ width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 500ms', transform: h ? 'scale(1.08)' : 'scale(1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(15,6,23,0.95) 100%)' }} />
        {match.format && <span style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px',
          borderRadius: 4, background: 'rgba(31,128,224,0.9)', color: '#fff', fontSize: 11, fontWeight: 700 }}>{match.format}</span>}
        {match.active && <span style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px',
          borderRadius: 4, background: 'rgba(0,200,83,0.9)', color: '#fff', fontSize: 11, fontWeight: 700 }}>● Open</span>}
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{match.teams}</div>
          <div style={{ fontSize: 13, color: '#1f80e0', fontWeight: 600 }}>{match.tournament}</div>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
          🏟️ {match.stadiumName || 'TBD'} &nbsp;•&nbsp;
          📅 {match.matchDate ? new Date(match.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
        </div>
        {match.active ? (
          <button onClick={e => { e.stopPropagation(); handleClick(); }}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #1f80e0, #0066cc)', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Book Now →
          </button>
        ) : (
          <button style={{ width: '100%', padding: '10px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
            color: '#888', fontSize: 14, cursor: 'default', fontFamily: 'inherit' }}>Coming Soon</button>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: '#1a1028', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ height: 220, background: '#2d1f4e' }} />
      <div style={{ padding: 16 }}>
        <div style={{ height: 14, width: '70%', background: '#2d1f4e', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 40, background: '#2d1f4e', borderRadius: 8 }} />
      </div>
    </div>
  );
}

export default Matches;
