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
    fetch(`${API}/matches`, { headers: { "Authorization": token, "Content-Type": "application/json" } })
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

      {/* Stadium-themed Header */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '48px 48px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <div className="stadium-bg-glow" />
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 8px 0', position: 'relative' }}>
          🏏 Cricket Matches
        </h1>
        <p style={{ fontSize: 15, color: '#888', margin: '0 0 28px 0', position: 'relative' }}>
          Book tickets for the best stadium experience
        </p>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
          {[
            { key: 'all', label: `All (${matches.length})` },
            { key: 'live', label: `🔴 Live & Active (${nowShowing.length})` },
            { key: 'upcoming', label: `📅 Upcoming (${comingSoon.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`category-tab${filter === tab.key ? ' active' : ''}`}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 48px 60px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <StadiumEmptyState />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {displayed.map(match => <MatchCard key={match.id} match={match} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stadium Empty State ── */
function StadiumEmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px 80px', animation: 'fadeInUp 600ms ease both' }}>
      {/* Animated Stadium SVG */}
      <div style={{ margin: '0 auto 32px', maxWidth: 320 }}>
        <svg viewBox="0 0 400 250" style={{ width: '100%' }}>
          {/* Stadium base */}
          <ellipse cx="200" cy="200" rx="180" ry="40" fill="none" stroke="rgba(31,128,224,0.2)" strokeWidth="2" strokeDasharray="8,4" />
          <ellipse cx="200" cy="185" rx="160" ry="35" fill="none" stroke="rgba(31,128,224,0.15)" strokeWidth="1.5" />
          <ellipse cx="200" cy="170" rx="140" ry="30" fill="none" stroke="rgba(31,128,224,0.1)" strokeWidth="1" />
          {/* Pitch */}
          <ellipse cx="200" cy="160" rx="50" ry="20" fill="rgba(0,200,83,0.08)" stroke="rgba(0,200,83,0.2)" strokeWidth="1" />
          <text x="200" y="165" textAnchor="middle" fill="rgba(0,200,83,0.3)" fontSize="10" fontWeight="700">PITCH</text>
          {/* Floodlights */}
          {[80, 320].map(x => (
            <g key={x}>
              <line x1={x} y1="60" x2={x} y2="140" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <rect x={x-8} y="50" width="16" height="14" rx="3" fill="rgba(255,213,74,0.15)" stroke="rgba(255,213,74,0.3)" strokeWidth="1" style={{ animation: 'pulse 2s infinite' }} />
            </g>
          ))}
          {/* Empty seats indicators */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const x = 200 + 130 * Math.cos(a);
            const y = 175 + 28 * Math.sin(a);
            return <circle key={i} cx={x} cy={y} r="5" fill="rgba(31,128,224,0.08)" stroke="rgba(31,128,224,0.15)" strokeWidth="1" style={{ animation: `pulse ${1.5 + i * 0.1}s infinite` }} />;
          })}
          {/* "No matches" text */}
          <text x="200" y="230" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11" fontWeight="600" letterSpacing="2">NO MATCHES SCHEDULED</text>
        </svg>
      </div>
      <h3 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 12px 0' }}>No Matches Available</h3>
      <p style={{ fontSize: 15, color: '#888', maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.7 }}>
        The stadium is waiting for the next big match! Check back soon for upcoming cricket action and tournaments.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
        {['IPL 2026', 'World Cup', 'T20 Blast', 'Asia Cup'].map((t, i) => (
          <span key={i} style={{
            padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: `rgba(31,128,224,${0.06 + i * 0.02})`,
            color: '#1f80e0', border: '1px solid rgba(31,128,224,0.15)',
          }}>{t}</span>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#555' }}>🔔 Stay tuned for match announcements</p>
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
      style={{
        borderRadius: 12, overflow: 'hidden', background: '#1a1028',
        cursor: match.active ? 'pointer' : 'default',
        transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
        transform: h && match.active ? 'translateY(-6px)' : 'none',
        boxShadow: h && match.active ? '0 20px 50px rgba(31,128,224,0.15)' : '0 4px 20px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.06)', animation: 'fadeInUp 400ms ease both',
      }}>
      <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
        <img src={match.posterUrl || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400'} alt={match.teams}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 500ms ease', transform: h ? 'scale(1.08)' : 'scale(1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(15,6,23,0.95) 100%)' }} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
          {match.format && <span style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(31,128,224,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)' }}>{match.format}</span>}
        </div>
        {match.active && (
          <span style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 4, background: 'rgba(0,200,83,0.9)', color: '#fff', fontSize: 11, fontWeight: 700 }}>● Booking Open</span>
        )}
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{match.teams}</div>
          <div style={{ fontSize: 13, color: '#1f80e0', fontWeight: 600 }}>{match.tournament}</div>
        </div>
      </div>
      <div style={{ padding: '16px 16px 20px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', fontSize: 12, color: '#a0a0a0', fontWeight: 500 }}>🏟️ {match.stadiumName || 'TBD'}</span>
          <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', fontSize: 12, color: '#a0a0a0', fontWeight: 500 }}>📅 {match.matchDate ? new Date(match.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</span>
        </div>
        <p style={{ fontSize: 13, color: '#777', lineHeight: 1.5, margin: '0 0 16px 0', minHeight: 40 }}>
          {match.description ? (match.description.length > 90 ? match.description.slice(0, 90) + '...' : match.description) : 'Catch the live action at the stadium!'}
        </p>
        {match.active ? (
          <button onClick={e => { e.stopPropagation(); const token = getToken(); if (!token) return navigate('/users/login'); navigate(`/bookmyshow/matches/${match.id}`); }}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f80e0, #0066cc)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(31,128,224,0.3)', transition: 'all 200ms' }}>
            Book Now →
          </button>
        ) : (
          <button style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#888', fontSize: 14, fontWeight: 600, cursor: 'default', fontFamily: 'inherit' }}>Coming Soon</button>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: '#1a1028', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ height: 320, background: 'linear-gradient(90deg, #1a1028, #2d1f4e, #1a1028)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ padding: 16 }}>
        <div style={{ height: 14, width: '70%', background: '#2d1f4e', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 12, width: '50%', background: '#2d1f4e', borderRadius: 4, marginBottom: 16 }} />
        <div style={{ height: 40, background: '#2d1f4e', borderRadius: 8 }} />
      </div>
    </div>
  );
}

export default Matches;