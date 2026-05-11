import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import { getToken } from './auth';

const HERO_IMAGES = [
  'https://img1.hscicdn.com/image/upload/f_auto,t_ds_wide_w_1200,q_60/lsci/db/PICTURES/CMS/370900/370956.6.jpg',
  'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop',
];

const CATEGORIES = [
  { key: 'all', label: '🔥 All', active: true },
  { key: 'cricket', label: '🏏 Cricket', active: true },
  { key: 'football', label: '⚽ Football', active: false },
  { key: 'kabaddi', label: '🤼 Kabaddi', active: false },
  { key: 'tennis', label: '🎾 Tennis', active: false },
  { key: 'f1', label: '🏎️ F1', active: false },
];

function Home() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [activeCat, setActiveCat] = useState('all');
  const railRef = useRef(null);

  useEffect(() => {
    const API = process.env.REACT_APP_API_URL || "";
    fetch(`${API}/matches`)
      .then(res => res.json())
      .then(data => { setMatches(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const trendingMatches = matches.filter(m => m.active).slice(0, 8);
  const upcomingMatches = matches.filter(m => !m.active).slice(0, 8);
  const allDisplay = matches.slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0617' }}>
      <NavBar />

      {/* ── Hero Carousel ── */}
      <div style={{ position: 'relative', height: 520, overflow: 'hidden' }}>
        {HERO_IMAGES.map((img, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: heroIdx === i ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
            animation: heroIdx === i ? 'kenBurns 12s ease-in-out infinite' : 'none',
          }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,6,23,0.2) 0%, rgba(15,6,23,0.6) 60%, #0f0617 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(15,6,23,0.85) 0%, transparent 55%)' }} />

        <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, maxWidth: 1400, margin: '0 auto', padding: '0 48px' }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 6, background: 'linear-gradient(90deg, #1f80e0, #00e5ff)', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>
            ⚡ Live & Upcoming
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', margin: '0 0 10px 0', lineHeight: 1.05, maxWidth: 600, textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
            Book Cricket Tickets
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: '0 0 28px 0', maxWidth: 480, lineHeight: 1.6 }}>
            Experience the thrill of live cricket. Book your stadium seats for the biggest matches.
          </p>
          <button onClick={() => navigate('/bookmyshow/matches')} style={{
            background: 'linear-gradient(135deg, #1f80e0, #0066cc)', border: 'none', color: '#fff',
            padding: '14px 40px', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(31,128,224,0.4)', transition: 'all 300ms ease', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 12px 40px rgba(31,128,224,0.5)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 30px rgba(31,128,224,0.4)'; }}
          >
            Browse Matches →
          </button>

          <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
            {HERO_IMAGES.map((_, i) => (
              <div key={i} onClick={() => setHeroIdx(i)} style={{
                width: heroIdx === i ? 28 : 8, height: 8, borderRadius: 4,
                background: heroIdx === i ? '#1f80e0' : 'rgba(255,255,255,0.3)',
                cursor: 'pointer', transition: 'all 400ms ease',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Rail ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 48px' }}>
        <div className="hotstar-rail" style={{ marginBottom: 36, paddingTop: 8 }}>
          {CATEGORIES.map(c => (
            <button key={c.key}
              className={`category-tab${activeCat === c.key ? ' active' : ''}`}
              onClick={() => c.active && setActiveCat(c.key)}
              style={!c.active ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >{c.label}</button>
          ))}
        </div>
      </div>

      {/* ── Trending Now Rail ── */}
      {trendingMatches.length > 0 && (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 48px', marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🔴</span> Live & Trending
            </h2>
            <button onClick={() => navigate('/bookmyshow/matches')} style={{ background: 'none', border: 'none', color: '#1f80e0', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>View All →</button>
          </div>
          <div className="hotstar-rail" ref={railRef}>
            {trendingMatches.map(m => (
              <RailCard key={m.id} match={m} onClick={() => {
                const token = getToken();
                if (!token) return navigate('/users/login');
                navigate(`/bookmyshow/matches/${m.id}`);
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Popular Matches Grid ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>🏏 Popular Matches</h2>
          <button onClick={() => navigate('/bookmyshow/matches')} style={{ background: 'none', border: 'none', color: '#1f80e0', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>View All →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 56 }}>
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 340, borderRadius: 12, background: 'linear-gradient(90deg, #1a1028, #2d1f4e, #1a1028)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ))}
          {!loading && allDisplay.map(m => (
            <MatchCard key={m.id} match={m} onClick={() => {
              const token = getToken();
              if (!token) return navigate('/users/login');
              navigate(`/bookmyshow/matches/${m.id}`);
            }} />
          ))}
          {!loading && matches.length === 0 && <EmptyState />}
        </div>

        {/* ── Upcoming Rail ── */}
        {upcomingMatches.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 18px 0' }}>📅 Coming Soon</h2>
            <div className="hotstar-rail">
              {upcomingMatches.map(m => <RailCard key={m.id} match={m} dimmed />)}
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 56, padding: '40px 0' }}>
          {[
            { icon: '🎫', number: '10K+', label: 'Tickets Booked' },
            { icon: '🏟️', number: '50+', label: 'Stadiums' },
            { icon: '⭐', number: '4.9', label: 'User Rating' },
            { icon: '🔒', number: '100%', label: 'Secure Payments' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 300ms', animation: `fadeInUp ${400 + i * 100}ms ease both` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{s.number}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Why Choose Us ── */}
        <div style={{ padding: '40px 32px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(31,128,224,0.08), rgba(224,64,251,0.08))', border: '1px solid rgba(31,128,224,0.15)', marginBottom: 60, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          {[
            { icon: '✅', title: 'Official Tickets', desc: 'Authorized & verified tickets only' },
            { icon: '💰', title: 'Best Prices', desc: 'Competitive pricing guaranteed' },
            { icon: '↩️', title: 'Easy Refunds', desc: 'Hassle-free cancellation policy' },
            { icon: '🛡️', title: '24/7 Support', desc: 'Round-the-clock customer help' },
          ].map((f, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 48px', textAlign: 'center', color: '#555', fontSize: 13 }}>
        © 2026 StadiumPass. All rights reserved. | Built with ❤️ for Cricket Fans
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px', animation: 'fadeInUp 600ms ease both' }}>
      <div style={{ fontSize: 80, marginBottom: 20, animation: 'float 3s ease-in-out infinite' }}>🏟️</div>
      <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 10px 0' }}>No Matches Available</h3>
      <p style={{ fontSize: 15, color: '#888', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
        There are no matches scheduled right now. Check back soon for upcoming cricket action!
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(31,128,224,0.08)', color: '#1f80e0', fontSize: 12, fontWeight: 600, border: '1px solid rgba(31,128,224,0.15)' }}>IPL 2026</span>
        <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(224,64,251,0.08)', color: '#e040fb', fontSize: 12, fontWeight: 600, border: '1px solid rgba(224,64,251,0.15)' }}>World Cup</span>
        <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(0,200,83,0.08)', color: '#00c853', fontSize: 12, fontWeight: 600, border: '1px solid rgba(0,200,83,0.15)' }}>T20 Blast</span>
      </div>
    </div>
  );
}

/* ── Horizontal Rail Card ── */
function RailCard({ match, onClick, dimmed }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 260, borderRadius: 12, overflow: 'hidden', background: '#1a1028',
        cursor: dimmed ? 'default' : 'pointer', transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
        transform: h && !dimmed ? 'translateY(-6px) scale(1.03)' : 'none',
        boxShadow: h && !dimmed ? '0 16px 50px rgba(31,128,224,0.2)' : '0 4px 20px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)', opacity: dimmed ? 0.6 : 1,
      }}>
      <div style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
        <img src={match.posterUrl || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400'} alt={match.teams}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms', transform: h ? 'scale(1.1)' : 'scale(1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(15,6,23,0.9) 100%)' }} />
        {match.active && (
          <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 4, background: 'rgba(0,200,83,0.9)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />LIVE
          </span>
        )}
        <div style={{ position: 'absolute', bottom: 8, left: 10, right: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{match.teams}</div>
        </div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 11, color: '#1f80e0', fontWeight: 600, marginBottom: 4 }}>{match.tournament}</div>
        <div style={{ fontSize: 11, color: '#666' }}>{match.stadiumName} • {match.matchDate ? new Date(match.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</div>
      </div>
    </div>
  );
}

/* ── Grid Match Card ── */
function MatchCard({ match, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        borderRadius: 12, overflow: 'hidden', background: '#1a1028', cursor: 'pointer',
        transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
        transform: h ? 'translateY(-8px) scale(1.02)' : 'none',
        boxShadow: h ? '0 20px 60px rgba(31,128,224,0.2)' : '0 4px 20px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)', animation: 'fadeInUp 400ms ease both',
      }}>
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        <img src={match.posterUrl || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400'} alt={match.teams}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 500ms ease', transform: h ? 'scale(1.1)' : 'scale(1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(15,6,23,0.95) 100%)' }} />
        {match.format && <span style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 4, background: 'rgba(31,128,224,0.9)', color: '#fff', fontSize: 11, fontWeight: 700 }}>{match.format}</span>}
        {match.active && (
          <span style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 4, background: 'rgba(0,200,83,0.9)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulseGlow 2s infinite' }} />Live
          </span>
        )}
        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{match.teams}</div>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, color: '#1f80e0', fontWeight: 600, marginBottom: 6 }}>{match.tournament}</div>
        <div style={{ fontSize: 12, color: '#888' }}>{match.stadiumName} • {match.matchDate ? new Date(match.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}</div>
      </div>
    </div>
  );
}

export default Home;
