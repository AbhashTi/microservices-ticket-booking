import React, { useContext, useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { MyContext } from "../components/Context";
import { clearToken, getToken } from './auth';

function NavBar() {
  const { user } = useContext(MyContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const token = getToken();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const logOut = () => {
    clearToken();
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("role");
    navigate('/users/login');
  };

  const getUserInitials = () => {
    const name = user?.fullname || user?.fullName || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  const navLinks = [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'Matches', path: '/bookmyshow/matches', icon: '🏏' },
  ];

  if (token) {
    navLinks.push({ label: 'My Bookings', path: '/users/bookings', icon: '🎟️' });
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'linear-gradient(180deg, rgba(15,6,23,0.98) 0%, rgba(15,6,23,0.85) 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1f80e0, #00e5ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            boxShadow: '0 4px 15px rgba(31,128,224,0.4)',
          }}>
            🏏
          </div>
          <span style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.5px',
          }}>
            StadiumPass
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }} className="desktop-nav">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                background: isActive(link.path) ? 'rgba(31,128,224,0.15)' : 'transparent',
                border: 'none',
                color: isActive(link.path) ? '#1f80e0' : '#a0a0a0',
                padding: '8px 18px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={e => {
                if (!isActive(link.path)) {
                  e.target.style.color = '#fff';
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive(link.path)) {
                  e.target.style.color = '#a0a0a0';
                  e.target.style.background = 'transparent';
                }
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!token ? (
            <>
              <button
                onClick={() => navigate('/users/login')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  e.target.style.borderColor = '#1f80e0';
                  e.target.style.color = '#1f80e0';
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.target.style.color = '#fff';
                }}
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/users/signup')}
                style={{
                  background: 'linear-gradient(135deg, #1f80e0, #0066cc)',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 15px rgba(31,128,224,0.3)',
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 14px 6px 6px',
                borderRadius: 24,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1f80e0, #e040fb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                }}>
                  {getUserInitials()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8e8' }}>
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <button
                onClick={logOut}
                style={{
                  background: 'rgba(255,68,68,0.1)',
                  border: '1px solid rgba(255,68,68,0.2)',
                  color: '#ff6b6b',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  fontFamily: 'inherit',
                }}
              >
                Logout
              </button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              padding: 4,
            }}
            className="mobile-menu-btn"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          background: '#0f0617',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 24px',
          animation: 'slideDown 200ms ease',
        }}>
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => { navigate(link.path); setMobileOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: isActive(link.path) ? 'rgba(31,128,224,0.1)' : 'transparent',
                border: 'none',
                color: isActive(link.path) ? '#1f80e0' : '#a0a0a0',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginBottom: 4,
              }}
            >
              {link.icon} {link.label}
            </button>
          ))}
          {token && (
            <button
              onClick={() => { logOut(); setMobileOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'rgba(255,68,68,0.08)',
                border: 'none',
                color: '#ff6b6b',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginTop: 8,
              }}
            >
              🚪 Logout
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

export default NavBar;