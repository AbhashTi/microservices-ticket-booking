import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from "formik";
import * as yup from "yup"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NavBar from './NavBar';

const formValidationSchema = yup.object({
  fullname: yup.string().required('Name is required'),
  email: yup.string().required('Email is required'),
  password: yup.string().required('Password is required').min(5, 'Min 5 characters'),
})

function Signup() {
  let navigate = useNavigate()
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { handleSubmit, values, handleChange, handleBlur, touched, errors } = useFormik({
    initialValues: { fullname: '', email: '', password: '' },
    validationSchema: formValidationSchema,
    onSubmit: (newList) => addUser(newList)
  })

  let addUser = (newList) => {
    setLoading(true);
    const slowTimer = setTimeout(() => toast.info('Creating your account…'), 1200);
    const API = process.env.REACT_APP_API_URL || "";
    fetch(`${API}/auth/signup`, {
      method: "POST",
      body: JSON.stringify({ fullname: newList.fullname, email: newList.email, password: newList.password }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? res.json() : res.json().then((d) => Promise.reject(d))))
      .then(() => {
        toast.success('Account Created! Redirecting...', { autoClose: 1500, theme: 'dark' });
        setTimeout(() => navigate('/users/login'), 800);
      })
      .catch((err) => toast.error(err?.message || 'Signup failed'))
      .finally(() => { clearTimeout(slowTimer); setLoading(false); })
  }

  const inputStyle = (field) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: touched[field] && errors[field] ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 200ms',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#0f0617' }}>
      <NavBar />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)', padding: '40px 20px',
      }}>
        <div style={{
          width: '100%', maxWidth: 420, padding: '40px 36px', borderRadius: 16,
          background: '#1a1028', border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'linear-gradient(135deg, #e040fb, #1f80e0)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, marginBottom: 16,
              boxShadow: '0 8px 30px rgba(224,64,251,0.3)',
            }}>🎟️</div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: 24, fontWeight: 800, color: '#fff' }}>Create Account</h2>
            <p style={{ margin: 0, fontSize: 14, color: '#888' }}>Join StadiumPass and book faster</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a0a0a0', marginBottom: 8 }}>Full Name</label>
                <input name="fullname" type="text" value={values.fullname} onChange={handleChange} onBlur={handleBlur}
                  placeholder="John Doe" required style={inputStyle('fullname')}
                  onFocus={e => e.target.style.borderColor = '#1f80e0'}
                  onBlurCapture={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                {touched.fullname && errors.fullname && <div style={{ color: '#ff4444', fontSize: 12, marginTop: 4 }}>{errors.fullname}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a0a0a0', marginBottom: 8 }}>Email Address</label>
                <input name="email" type="email" value={values.email} onChange={handleChange} onBlur={handleBlur}
                  placeholder="you@example.com" required style={inputStyle('email')}
                  onFocus={e => e.target.style.borderColor = '#1f80e0'}
                  onBlurCapture={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                {touched.email && errors.email && <div style={{ color: '#ff4444', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a0a0a0', marginBottom: 8 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input name="password" type={showPassword ? 'text' : 'password'} value={values.password}
                    onChange={handleChange} onBlur={handleBlur} placeholder="Min 5 characters" required
                    style={{ ...inputStyle('password'), paddingRight: 48 }}
                    onFocus={e => e.target.style.borderColor = '#1f80e0'}
                    onBlurCapture={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  <button type="button" onClick={() => setShowPassword(s => !s)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16,
                  }}>{showPassword ? '🙈' : '👁️'}</button>
                </div>
                {touched.password && errors.password && <div style={{ color: '#ff4444', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: loading ? '#2d1f4e' : 'linear-gradient(135deg, #1f80e0, #0066cc)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
                boxShadow: loading ? 'none' : '0 8px 30px rgba(31,128,224,0.3)',
                transition: 'all 300ms ease', marginTop: 4,
              }}>
                {loading ? '⏳ Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
              Already have an account?{' '}
              <span onClick={() => navigate('/users/login')} style={{ color: '#1f80e0', fontWeight: 600, cursor: 'pointer' }}>Sign In</span>
            </p>
          </div>
          <ToastContainer theme="dark" />
        </div>
      </div>
    </div>
  )
}

export default Signup