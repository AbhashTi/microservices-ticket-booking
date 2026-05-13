import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { getToken } from "./auth";

const LOCK_TTL_SECONDS = 600;

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [createdMap, setCreatedMap] = useState({});
  const [showInfoMap, setShowInfoMap] = useState({});
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [ticketModal, setTicketModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("bms_bookingCreatedAtMap");
      if (raw) setCreatedMap(JSON.parse(raw));
    } catch {}
  }, []);

  const persistCreatedMap = (map) => {
    try { sessionStorage.setItem("bms_bookingCreatedAtMap", JSON.stringify(map)); } catch {}
  };

  const loadBookings = useCallback(async () => {
    try {
      setError(null);
      const API = process.env.REACT_APP_API_URL || "";
      const token = getToken();
      // FIXED: use Bearer prefix
      const res = await fetch(`${API}/bookings/my`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": token }
      });
      if (!res.ok) { setError("Failed to load bookings"); setLoading(false); return; }
      const data = await res.json();
      const updatedMap = { ...createdMap };
      const nowMs = Date.now();
      data.forEach(b => { if (b.status === "PENDING_PAYMENT" && !updatedMap[b.id]) updatedMap[b.id] = nowMs; });
      setCreatedMap(updatedMap);
      persistCreatedMap(updatedMap);
      const sorted = Array.isArray(data) ? [...data].sort((a, b) => (Date.parse(b?.createdAt) || 0) - (Date.parse(a?.createdAt) || 0)) : [];
      setBookings(sorted);
      setLoading(false);
      setLastRefreshedAt(Date.now());
    } catch (err) { console.error("ERROR FETCHING BOOKINGS", err); setError("Something went wrong."); setLoading(false); }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    // Use sessionId (what booking-service stores) rather than showId
    const uniqueSessionIds = Array.from(new Set(bookings.map(b => b.sessionId))).filter(id => id != null);
    uniqueSessionIds.forEach(sessionId => {
      if (showInfoMap[sessionId]) return;
      (async () => {
        try {
          const API = process.env.REACT_APP_API_URL || "";
          const token = getToken();
          // FIXED: use Bearer prefix, fetch from /sessions/:id
          const res = await fetch(`${API}/sessions/${sessionId}`, {
            headers: { "Authorization": token }
          });
          if (!res.ok) return;
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) return;
          const session = await res.json();
          setShowInfoMap(prev => ({ ...prev, [sessionId]: session }));
        } catch {}
      })();
    });
  }, [bookings, showInfoMap]);

  const formatDateTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        + " • " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
    } catch { return ts; }
  };

  const statusConfig = {
    CONFIRMED: { color: '#00c853', bg: 'rgba(0,200,83,0.08)', border: 'rgba(0,200,83,0.2)', label: '✅ Confirmed', accent: '#00c853' },
    PENDING_PAYMENT: { color: '#ffd54a', bg: 'rgba(255,213,74,0.08)', border: 'rgba(255,213,74,0.2)', label: '⏳ Pending Payment', accent: '#ffd54a' },
    CANCELLED: { color: '#888', bg: 'rgba(136,136,136,0.08)', border: 'rgba(136,136,136,0.2)', label: '❌ Cancelled', accent: '#888' },
    EXPIRED: { color: '#ff4444', bg: 'rgba(255,68,68,0.08)', border: 'rgba(255,68,68,0.2)', label: '⏰ Expired', accent: '#ff4444' },
  };

  const secondsLeft = (bookingId) => {
    const createdAt = createdMap[bookingId];
    if (!createdAt) return null;
    const remaining = LOCK_TTL_SECONDS - Math.floor((now - createdAt) / 1000);
    return remaining > 0 ? remaining : 0;
  };

  const formatCountdown = (bookingId) => {
    const sec = secondsLeft(bookingId);
    if (sec == null) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const API = process.env.REACT_APP_API_URL || "";
      const token = getToken();
      // FIXED: Bearer prefix
      const res = await fetch(`${API}/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": token }
      });
      if (!res.ok) { alert("Failed to cancel."); return; }
      await loadBookings();
    } catch { alert("Error cancelling."); }
  };

  const goToPayment = (b) => {
    const sessionInfo = showInfoMap[b.sessionId] || {};
    const stadium = sessionInfo.stadium || sessionInfo.stadiumName || '';
    const labels = Array.isArray(b.seats) ? b.seats.map(s => buildSeatLabel(s)) : [];
    navigate(
      `/bookmyshow/payment/${encodeURIComponent(stadium)}/${encodeURIComponent(b.sessionId)}/${encodeURIComponent(labels.join(','))}/${encodeURIComponent(b.totalAmount ?? 0)}`,
      { state: { labels, bookingId: b.id, booking: b } }
    );
  };

  const buildSeatLabel = (seat) => {
    if (!seat) return "Seat";
    if (seat.label) return seat.label;
    if (seat.seatLabel) return seat.seatLabel;
    if (seat.rowLabel && seat.seatNumber != null) return `${seat.rowLabel}${seat.seatNumber}`;
    if (seat.seatNumber != null) return `Seat ${seat.seatNumber}`;
    return "Seat";
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0617' }}>
      <NavBar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>My Bookings</h1>
            {lastRefreshedAt && <p style={{ fontSize: 12, color: '#555', margin: 0 }}>Updated: {new Date(lastRefreshedAt).toLocaleTimeString()}</p>}
          </div>
          <button onClick={loadBookings} disabled={loading}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(31,128,224,0.3)', background: 'rgba(31,128,224,0.08)', color: '#1f80e0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', border: '4px solid #1f80e0', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#888' }}>Loading your bookings...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#ff4444' }}>{error}</div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
            <p style={{ color: '#888', marginBottom: 20 }}>No bookings yet</p>
            <button onClick={() => navigate('/bookmyshow/matches')}
              style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1f80e0, #0066cc)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(31,128,224,0.3)' }}>
              Browse Matches
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bookings.map(b => {
              const countdown = b.status === "PENDING_PAYMENT" ? formatCountdown(b.id) : null;
              const sessionInfo = showInfoMap[b.sessionId] || {};
              const movieTitle = sessionInfo.movieTitle || b.sessionId ? `Session #${b.sessionId}` : "Match";
              const showTime = formatDateTime(sessionInfo.startTime);
              const stadium = sessionInfo.stadium || sessionInfo.stadiumName;
              const sc = statusConfig[b.status] || statusConfig.CANCELLED;

              return (
                <div key={b.id} style={{
                  padding: 20, borderRadius: 12, background: '#1a1028',
                  border: '1px solid rgba(255,255,255,0.06)', borderLeft: `4px solid ${sc.accent}`,
                  transition: 'all 200ms',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 11, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Booking #{b.id}</div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 800, color: '#fff' }}>{movieTitle}</h3>
                      {showTime && <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>🕐 {showTime}</div>}
                      {stadium && <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>🏟️ {stadium}</div>}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{sc.label}</span>
                        {b.paymentId && <span style={{ fontSize: 11, color: '#666' }}>Payment: {b.paymentId}</span>}
                      </div>

                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1f80e0' }}>₹{b.totalAmount}</div>
                      {countdown && <div style={{ fontSize: 13, color: '#ffd54a', fontWeight: 600, marginTop: 6 }}>⏱️ Seats held for: {countdown}</div>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Seats</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {b.seats?.length ? b.seats.map((s, idx) => (
                          <span key={idx} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(31,128,224,0.08)', color: '#1f80e0', border: '1px solid rgba(31,128,224,0.15)' }}>{buildSeatLabel(s)} • ₹{s.price}</span>
                        )) : <span style={{ fontSize: 12, color: '#555' }}>No seat details</span>}
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                        {b.status === "CONFIRMED" && (
                          <button onClick={() => setTicketModal(b)}
                            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #00c853, #009624)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(0,200,83,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            🎫 View Ticket
                          </button>
                        )}
                        {b.status === "PENDING_PAYMENT" && secondsLeft(b.id) > 0 && (
                          <button onClick={() => goToPayment(b)}
                            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f80e0, #0066cc)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(31,128,224,0.3)' }}>
                            💳 Pay Now
                          </button>
                        )}
                        <button onClick={() => navigate('/bookmyshow/matches')}
                          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#a0a0a0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Book Again
                        </button>
                        {(b.status === "CONFIRMED" || b.status === "PENDING_PAYMENT") && (
                          <button onClick={() => handleCancel(b.id)}
                            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,68,68,0.2)', background: 'rgba(255,68,68,0.1)', color: '#ff6b6b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ticketModal && (
        <TicketModal
          booking={ticketModal}
          showInfo={showInfoMap[ticketModal.sessionId] || {}}
          buildSeatLabel={buildSeatLabel}
          onClose={() => setTicketModal(null)}
        />
      )}
    </div>
  );
}

/* ── Ticket Modal with QR Code ── */
function TicketModal({ booking, showInfo, buildSeatLabel, onClose }) {
  const ticketRef = useRef(null);
  const b = booking;
  const movieTitle = showInfo.movieTitle || showInfo.title || `Match (Session #${b.sessionId})`;
  const stadium = showInfo.stadium || showInfo.stadiumName || "Stadium";
  const showTime = showInfo.startTime
    ? new Date(showInfo.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';

  const qrData = `STADIUMPASS-TICKET|ID:${b.id}|SESSION:${b.sessionId}|AMT:${b.totalAmount}|SEATS:${b.seats?.length || 0}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=1a1028`;

  const downloadTicket = () => {
    const ticketText = [
      '═══════════════════════════════════',
      '       🏏 STADIUMPASS E-TICKET       ',
      '═══════════════════════════════════',
      '',
      `Match: ${movieTitle}`,
      `Venue: ${stadium}`,
      `Date:  ${showTime}`,
      `Booking ID: #${b.id}`,
      `Session ID: #${b.sessionId}`,
      '',
      `Seats: ${b.seats?.map(s => buildSeatLabel(s)).join(', ') || 'N/A'}`,
      `Total: ₹${b.totalAmount}`,
      `Status: ${b.status}`,
      '',
      '═══════════════════════════════════',
      '  Present this ticket at the gate   ',
      '═══════════════════════════════════',
    ].join('\n');

    const blob = new Blob([ticketText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StadiumPass_Ticket_${b.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} ref={ticketRef}
        className="ticket-pass" style={{ width: '100%', maxWidth: 420, borderRadius: 16, overflow: 'hidden', background: '#1a1028', border: '1px solid rgba(255,255,255,0.08)' }}>

        <div style={{ padding: '24px 28px 16px', background: 'linear-gradient(135deg, #1f80e0, #0052a3)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏏</div>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>StadiumPass</span>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(0,200,83,0.2)', color: '#69f0ae', fontSize: 11, fontWeight: 700, border: '1px solid rgba(0,200,83,0.3)' }}>
              ✅ CONFIRMED
            </span>
          </div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: 22, fontWeight: 900, color: '#fff' }}>{movieTitle}</h2>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>E-Ticket • Booking #{b.id}</div>
        </div>

        <div style={{ padding: '20px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Venue</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>🏟️ {stadium}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Date & Time</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{showTime || 'TBA'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Seats</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {b.seats?.map((s, i) => (
                  <span key={i} style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(31,128,224,0.12)', color: '#1f80e0', fontSize: 12, fontWeight: 700 }}>
                    {buildSeatLabel(s)}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Amount Paid</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#1f80e0' }}>₹{b.totalAmount}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 16, textAlign: 'center' }}>
            <img src={qrUrl} alt="QR Code" style={{ width: 160, height: 160 }}
              onError={e => { e.target.style.display = 'none'; }} />
            <p style={{ fontSize: 11, color: '#666', marginTop: 12 }}>Scan this QR code at the stadium entrance</p>
            <p style={{ fontSize: 10, color: '#444', marginTop: 4 }}>Booking #{b.id} • {b.seats?.length || 0} seat(s)</p>
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={downloadTicket}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1f80e0, #0066cc)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(31,128,224,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            📥 Download Ticket
          </button>
          <button onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#a0a0a0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
