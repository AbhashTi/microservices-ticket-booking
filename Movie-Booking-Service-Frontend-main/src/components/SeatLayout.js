import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import { getToken } from './auth';

/* ── Stadium geometry ────────────────────────────── */
const CX = 400, CY = 300;
const PITCH_RX = 80, PITCH_RY = 45;
const TIERS = [
  { label: 'Pavilion',  rx: 150, ry: 100, count: 20, type: 'PREMIUM' },
  { label: 'Club',      rx: 190, ry: 130, count: 26, type: 'PREMIUM' },
  { label: 'Upper',     rx: 230, ry: 160, count: 32, type: 'REGULAR' },
  { label: 'Gallery',   rx: 265, ry: 188, count: 38, type: 'REGULAR' },
  { label: 'Terrace',   rx: 300, ry: 215, count: 44, type: 'REGULAR' },
];
const COLORS = { PREMIUM: '#e040fb', REGULAR: '#1f80e0' };

function buildSeats() {
  const seats = []; let id = 1;
  TIERS.forEach((t, ti) => {
    for (let i = 0; i < t.count; i++) {
      const a = (i / t.count) * 2 * Math.PI - Math.PI / 2;
      seats.push({ id: id++, tier: ti, tierLabel: t.label, type: t.type,
        x: CX + t.rx * Math.cos(a), y: CY + t.ry * Math.sin(a),
        label: `${t.label[0]}${i + 1}` });
    }
  });
  return seats;
}
const ALL_SEATS = buildSeats();

/* ── Component ───────────────────────────────────── */
function SeatLayout() {
  const { id, showId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [session, setSession] = useState(null);
  const [priceRegular, setPriceRegular] = useState(0);
  const [pricePremium, setPricePremium] = useState(0);
  const [selected, setSelected] = useState([]);
  const [booked, setBooked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!showId) return;
    let ok = true;
    const API = process.env.REACT_APP_API_URL || '';
    const token = getToken();
    (async () => {
      try {
        // Fetch session details (prices)
        const sr = await fetch(`${API}/sessions/${showId}`, { headers: { Authorization: token } });
        if (sr.ok) {
          const s = await sr.json();
          if (!ok) return;
          setSession(s);
          setPriceRegular(s.priceRegular ?? s.price_regular ?? 500);
          setPricePremium(s.pricePremium ?? s.price_premium ?? 1500);
        }
        // Fetch match details
        const mr = await fetch(`${API}/matches/${id}`, { headers: { Authorization: token } });
        if (mr.ok) { const m = await mr.json(); if (ok) setMatch(m); }
        // Fetch booked seats
        try {
          const br = await fetch(`${API}/bookings/show/${showId}/seats/status`, { headers: { Authorization: token } });
          if (br.ok) {
            const ct = br.headers.get('content-type') || '';
            if (ct.includes('json')) {
              const d = await br.json();
              if (ok) setBooked([...(d.bookedSeatIds || []), ...(d.lockedSeatIds || [])].map(Number));
            }
          }
        } catch (_) {}
      } catch (e) { console.warn('Load error', e); }
      finally { if (ok) setLoading(false); }
    })();
    return () => { ok = false; };
  }, [showId, id]);

  const toggle = (seatId) => {
    if (booked.includes(seatId)) return;
    setSelected(p => p.includes(seatId) ? p.filter(x => x !== seatId) : [...p, seatId]);
  };

  const totalPrice = selected.reduce((sum, sid) => {
    const s = ALL_SEATS.find(x => x.id === sid);
    return sum + (s?.type === 'PREMIUM' ? pricePremium : priceRegular);
  }, 0);

  const selectedInfo = selected.map(sid => ALL_SEATS.find(x => x.id === sid)).filter(Boolean);

  const proceedToPayment = async () => {
    try {
      setBooking(true);
      const API = process.env.REACT_APP_API_URL || '';
      const token = getToken();
      const seats = selectedInfo.map(s => ({
        seatId: s.id, rowLabel: s.tierLabel, seatNumber: s.id,
        seatType: s.type, price: s.type === 'PREMIUM' ? pricePremium : priceRegular,
      }));
      const payload = { showId: Number(showId), totalAmount: totalPrice, seats };
      const res = await fetch(`${API}/bookings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('Booking error:', err);
        alert('Could not create booking. Please try again.');
        setBooking(false);
        return;
      }
      const bk = await res.json();
      setBooking(false);
      const stadium = session?.stadium || match?.stadiumName || '';
      navigate(
        `/bookmyshow/payment/${encodeURIComponent(stadium)}/${showId}/${selected.join(',')}/${totalPrice}`,
        { state: { labels: selectedInfo.map(s => s.label), bookingId: bk.id, booking: bk } }
      );
    } catch (e) { console.error(e); alert('Booking error.'); setBooking(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0617' }}>
      <NavBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', border: '4px solid #1f80e0', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#888' }}>Loading stadium...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f0617' }}>
      <NavBar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1028, #0f0617)', padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
            🏟️ {match?.teams || 'Select Your Seats'}
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: '#888' }}>
            {match?.format && <span style={{ padding: '3px 10px', borderRadius: 4, background: 'rgba(31,128,224,0.15)', color: '#1f80e0', fontWeight: 600 }}>{match.format}</span>}
            {session?.startTime && <span>🕐 {new Date(session.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}
            <span>🏟️ {session?.stadium || match?.stadiumName || 'Stadium'}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 48px', display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── Stadium SVG ── */}
        <div style={{ flex: 1, minWidth: 400 }}>
          <div style={{ background: '#0a0412', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', padding: 16, position: 'relative' }}>
            <svg viewBox="0 0 800 600" style={{ width: '100%', display: 'block' }}>
              {/* Stadium outline glow */}
              <defs>
                <radialGradient id="glow"><stop offset="0%" stopColor="#1f80e0" stopOpacity="0.05"/><stop offset="100%" stopColor="transparent"/></radialGradient>
                <filter id="blur"><feGaussianBlur stdDeviation="3"/></filter>
              </defs>
              <ellipse cx={CX} cy={CY} rx={320} ry={235} fill="url(#glow)" />
              <ellipse cx={CX} cy={CY} rx={318} ry={233} fill="none" stroke="rgba(31,128,224,0.12)" strokeWidth="1.5" strokeDasharray="4,4" />

              {/* Tier labels */}
              {TIERS.map((t, i) => (
                <text key={i} x={CX} y={CY - t.ry - 6} textAnchor="middle" fill={COLORS[t.type]} fontSize="9" fontWeight="600" opacity="0.6">{t.label}</text>
              ))}

              {/* Pitch */}
              <ellipse cx={CX} cy={CY} rx={PITCH_RX} ry={PITCH_RY} fill="#0d3d1a" stroke="#1b6e32" strokeWidth="1.5" />
              <line x1={CX} y1={CY - PITCH_RY + 8} x2={CX} y2={CY + PITCH_RY - 8} stroke="#2d8c4e" strokeWidth="1" opacity="0.5" />
              <rect x={CX - 12} y={CY - PITCH_RY + 6} width="24" height="4" rx="1" fill="#4caf50" opacity="0.4" />
              <rect x={CX - 12} y={CY + PITCH_RY - 10} width="24" height="4" rx="1" fill="#4caf50" opacity="0.4" />
              <text x={CX} y={CY + 4} textAnchor="middle" fill="#4caf50" fontSize="13" fontWeight="800" letterSpacing="2">PITCH</text>

              {/* Stand labels */}
              <text x={CX} y={45} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="11" fontWeight="700" letterSpacing="3">NORTH STAND</text>
              <text x={CX} y={575} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="11" fontWeight="700" letterSpacing="3">SOUTH STAND</text>
              <text x={50} y={CY + 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontWeight="700" transform={`rotate(-90,50,${CY})`}>EAST</text>
              <text x={750} y={CY + 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontWeight="700" transform={`rotate(90,750,${CY})`}>WEST</text>

              {/* Seats */}
              {ALL_SEATS.map(seat => {
                const sel = selected.includes(seat.id);
                const bkd = booked.includes(seat.id);
                const clr = COLORS[seat.type];
                return (
                  <g key={seat.id} onClick={() => toggle(seat.id)} style={{ cursor: bkd ? 'not-allowed' : 'pointer' }}>
                    {sel && <circle cx={seat.x} cy={seat.y} r={11} fill={clr} opacity="0.2" filter="url(#blur)" />}
                    <circle cx={seat.x} cy={seat.y} r={7}
                      fill={bkd ? '#1a1028' : sel ? clr : 'rgba(255,255,255,0.04)'}
                      stroke={bkd ? '#2d1f4e' : sel ? '#fff' : `${clr}30`}
                      strokeWidth={sel ? 2 : 0.8}
                      opacity={bkd ? 0.3 : 1}
                    />
                    {sel && <text x={seat.x} y={seat.y + 3} textAnchor="middle" fill="#fff" fontSize="6" fontWeight="700">✓</text>}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', padding: '12px 0 4px' }}>
              {[
                { label: 'Available', bg: 'rgba(31,128,224,0.08)', border: 'rgba(31,128,224,0.3)' },
                { label: 'Selected', bg: '#1f80e0', border: '#1f80e0' },
                { label: 'Premium', bg: 'rgba(224,64,251,0.15)', border: 'rgba(224,64,251,0.4)' },
                { label: 'Booked', bg: '#1a1028', border: '#2d1f4e' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: item.bg, border: `1.5px solid ${item.border}` }} />
                  <span style={{ fontSize: 11, color: '#888' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div style={{ width: 300, position: 'sticky', top: 80 }}>
          {/* Pricing */}
          <div style={{ padding: 18, borderRadius: 12, background: 'linear-gradient(135deg, #1f80e0, #0052a3)', marginBottom: 14 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 10px 0' }}>🎫 Ticket Pricing</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Regular (Upper/Gallery/Terrace)</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>₹{priceRegular}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Premium (Pavilion/Club)</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>₹{pricePremium}</span>
            </div>
          </div>

          {/* Selection */}
          <div style={{ padding: 18, borderRadius: 12, background: '#1a1028', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 14px 0' }}>Your Selection</h4>
            <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: 14, borderRadius: 10, background: 'rgba(31,128,224,0.06)', border: '1px solid rgba(31,128,224,0.1)' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#1f80e0' }}>{selected.length}</div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>Seats Selected</div>
            </div>

            {selectedInfo.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {selectedInfo.map(s => (
                  <span key={s.id} style={{
                    padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                    background: s.type === 'PREMIUM' ? 'rgba(224,64,251,0.12)' : 'rgba(31,128,224,0.12)',
                    color: COLORS[s.type],
                  }}>{s.label}</span>
                ))}
              </div>
            )}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '14px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: '#888' }}>Total Amount</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#1f80e0' }}>₹{totalPrice}</span>
            </div>

            <button disabled={selected.length === 0 || booking}
              onClick={() => setConfirmOpen(true)}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                background: selected.length === 0 ? '#2d1f4e' : 'linear-gradient(135deg, #1f80e0, #0066cc)',
                color: selected.length === 0 ? '#555' : '#fff',
                fontSize: 14, fontWeight: 700, cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', boxShadow: selected.length > 0 ? '0 8px 30px rgba(31,128,224,0.3)' : 'none',
                transition: 'all 300ms',
              }}>
              {booking ? '⏳ Creating Booking...' : 'PROCEED TO PAYMENT'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      {confirmOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: 500, borderRadius: 16, background: '#1a1028', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, #1f80e0, #0052a3)' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>Confirm Booking</h3>
            </div>
            <div style={{ padding: 24 }}>
              <h4 style={{ margin: '0 0 6px', color: '#fff' }}>{match?.teams}</h4>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>
                {session?.startTime ? new Date(session.startTime).toLocaleString() : ''} • {session?.stadium || match?.stadiumName}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                {selectedInfo.map(s => (
                  <span key={s.id} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: s.type === 'PREMIUM' ? 'rgba(224,64,251,0.12)' : 'rgba(31,128,224,0.12)', color: COLORS[s.type] }}>
                    {s.label} • ₹{s.type === 'PREMIUM' ? pricePremium : priceRegular}
                  </span>
                ))}
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: 'linear-gradient(135deg, #1f80e0, #0052a3)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
                <span style={{ fontSize: 22, fontWeight: 900 }}>₹{totalPrice}</span>
              </div>
            </div>
            <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setConfirmOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#a0a0a0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={() => { setConfirmOpen(false); proceedToPayment(); }} disabled={booking}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f80e0, #0066cc)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(31,128,224,0.3)' }}>
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeatLayout;