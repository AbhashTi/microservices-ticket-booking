import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NavBar from './NavBar';
import { getToken } from './auth';

const PAYMENT_METHODS = [
  { key: 'upi', icon: '📱', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
  { key: 'card', icon: '💳', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
  { key: 'netbanking', icon: '🏦', label: 'Net Banking', desc: 'All major banks' },
  { key: 'wallet', icon: '👛', label: 'Wallet', desc: 'Paytm, Amazon Pay' },
];

const PROCESSING_STEPS = [
  'Verifying payment details...',
  'Processing payment...',
  'Confirming seat reservation...',
  'Generating your ticket...',
];

function Payment() {
  let navigate = useNavigate()
  const { theaterId, showId, selected, total } = useParams()
  const location = useLocation()
  const [match, setMovie] = useState(null)
  const [show, setShow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [processingStep, setProcessingStep] = useState(-1)
  const [promoCode, setPromoCode] = useState('')

  // bookingId MUST come from route state set by SeatLayout after /bookings/create
  const bookingIdFromState = location?.state?.bookingId || location?.state?.booking?.id || null
  const amountFromState = location?.state?.booking?.totalAmount != null
    ? Number(location.state.booking.totalAmount)
    : Number(total)

  useEffect(() => {
    if (!showId) return
    let mounted = true
    const load = async () => {
      try {
        const API = process.env.REACT_APP_API_URL || "";
        const token = getToken();
        // Try to fetch session info for display
        const res = await fetch(`${API}/sessions/${showId}`, {
          headers: { "Authorization": token, "Content-Type": "application/json" }
        });
        if (!res.ok) return;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return;
        const s = await res.json();
        if (!mounted) return;
        setShow(s);
        // Fetch match info for display
        const movieId = s.matchId ?? s.movieId ?? s.movie_id ?? s.match
        if (movieId) {
          const mres = await fetch(`${API}/matches/${movieId}`, {
            headers: { "Authorization": token, "Content-Type": "application/json" }
          });
          if (mres && mres.ok) {
            const mct = mres.headers.get('content-type') || ''
            if (mct.includes('application/json')) {
              const m = await mres.json()
              if (!mounted) return
              setMovie(m)
            }
          }
        }
      } catch (err) { console.warn('Error loading show/match for payment', err) }
    }
    load()
    return () => (mounted = false)
  }, [showId])

  const movieTicket = async () => {
    // Guard: must have a bookingId from the previous /bookings/create call
    if (!bookingIdFromState) {
      toast.error('Missing booking information. Please go back and select seats again.');
      return;
    }
    try {
      setLoading(true)
      setProcessingStep(0)

      // Animate through processing steps
      for (let i = 1; i < PROCESSING_STEPS.length; i++) {
        await new Promise(r => setTimeout(r, 800));
        setProcessingStep(i);
      }

      const API = process.env.REACT_APP_API_URL || "";
      const token = getToken();

      // Step 1: Call payment service — it publishes PaymentSuccessEvent via RabbitMQ
      // BookingService.handlePaymentEvent() consumes that event and calls confirmPayment()
      // which moves seats from Redis lock → booked_seats DB table permanently
      const payload = { bookingId: bookingIdFromState, amount: amountFromState }
      const res = await fetch(`${API}/payment/pay`, {
        method: 'POST',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        toast.error('Payment failed. Please try again.');
        setLoading(false);
        setProcessingStep(-1);
        return;
      }

      // Payment service responds immediately with "Payment started" while RabbitMQ
      // event fires async to confirm the booking. Give it a moment then navigate.
      await new Promise(r => setTimeout(r, 1500));

      toast.success('🎉 Payment successful! Your ticket is confirmed.')
      setLoading(false)
      setProcessingStep(-1)
      setTimeout(() => navigate('/users/bookings'), 1500)
    } catch (err) {
      console.error(err);
      setLoading(false);
      setProcessingStep(-1);
      toast.error('Payment error. Please try again.')
    }
  }

  const displaySeatLabels = (() => {
    const sFromState = location?.state?.labels
    if (sFromState && Array.isArray(sFromState) && sFromState.length) return sFromState
    const seatsRaw = decodeURIComponent(selected || '')
    return seatsRaw ? seatsRaw.split(',').map(s => s.trim()).filter(Boolean) : []
  })()

  const formatShowTime = (start) => {
    try {
      const d = new Date(start)
      return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
        + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true }).replace(':00', '')
    } catch { return start }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0617' }}>
      <NavBar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>

        {/* Processing Overlay */}
        {loading && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,6,23,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid #1f80e0', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 28px' }} />
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 24px 0' }}>Processing Payment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
                {PROCESSING_STEPS.map((step, i) => (
                  <div key={i} className={`processing-step ${i < processingStep ? 'done' : i === processingStep ? 'active' : ''}`}>
                    <span style={{ width: 20, textAlign: 'center' }}>
                      {i < processingStep ? '✅' : i === processingStep ? (
                        <span style={{ display: 'inline-flex', gap: 3 }}>
                          {[0,1,2].map(d => <span key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: '#1f80e0', display: 'inline-block', animation: `dotBounce 1.4s ${d * 0.16}s infinite ease-in-out both` }} />)}
                        </span>
                      ) : '○'}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#555', marginTop: 24 }}>🔒 Secured with 256-bit encryption</p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Left: Payment Methods */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', background: '#1a1028', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1f80e0, #0052a3)' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>💳 Payment Gateway</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Choose your payment method</p>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {PAYMENT_METHODS.map(m => (
                    <div key={m.key}
                      className={`payment-method-card ${paymentMethod === m.key ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(m.key)}>
                      <div style={{ fontSize: 24 }}>{m.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{m.label}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{m.desc}</div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentMethod === m.key ? '#1f80e0' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {paymentMethod === m.key && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1f80e0' }} />}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Enter promo code"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  <button style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid rgba(31,128,224,0.3)', background: 'rgba(31,128,224,0.08)', color: '#1f80e0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Apply</button>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { icon: '🔒', label: '100% Secure' },
                    { icon: '⚡', label: 'Instant Confirm' },
                    { icon: '🛡️', label: 'SSL Encrypted' },
                  ].map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'rgba(0,200,83,0.06)', fontSize: 11, color: '#00c853', fontWeight: 600, border: '1px solid rgba(0,200,83,0.12)' }}>
                      {b.icon} {b.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div style={{ width: 300 }}>
            <div style={{ borderRadius: 16, background: '#1a1028', border: '1px solid rgba(255,255,255,0.08)', padding: 20, position: 'sticky', top: 80 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 16px 0' }}>🧾 Order Summary</h3>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <img src={match?.posterUrl || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200'} alt="poster"
                  style={{ width: 60, height: 85, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{match?.teams || 'Match'}</div>
                  {show?.startTime && <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>🕐 {formatShowTime(show.startTime)}</div>}
                  <div style={{ fontSize: 12, color: '#888' }}>🏟️ {show?.stadium || theaterId || 'Stadium'}</div>
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Seats ({displaySeatLabels.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {displaySeatLabels.map((s, i) => (
                    <span key={i} style={{ padding: '3px 8px', borderRadius: 5, background: 'rgba(31,128,224,0.12)', color: '#1f80e0', fontSize: 11, fontWeight: 600, border: '1px solid rgba(31,128,224,0.2)' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>
                <span>Subtotal</span><span>₹{amountFromState}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#a0a0a0' }}>
                <span>Convenience Fee</span><span style={{ color: '#00c853' }}>FREE</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#1f80e0' }}>₹{amountFromState}</span>
              </div>

              {!bookingIdFromState && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6b6b', fontSize: 12, marginBottom: 12 }}>
                  ⚠️ Booking session missing. Please go back and select seats again.
                </div>
              )}

              <button onClick={movieTicket} disabled={loading || !bookingIdFromState}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                  background: (loading || !bookingIdFromState) ? '#2d1f4e' : 'linear-gradient(135deg, #1f80e0, #0066cc)',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: (loading || !bookingIdFromState) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', boxShadow: (!loading && bookingIdFromState) ? '0 8px 30px rgba(31,128,224,0.3)' : 'none',
                  transition: 'all 300ms', marginBottom: 10,
                }}>
                {loading ? '⏳ Processing...' : `💳 Pay ₹${amountFromState}`}
              </button>
              <button onClick={() => navigate(-1)} disabled={loading}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#a0a0a0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer theme="dark" />
    </div>
  )
}

export default Payment
