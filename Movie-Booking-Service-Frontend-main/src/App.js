import './App.css';
import React, { useState, useEffect } from 'react';
import {Routes,Route, Navigate, useLocation} from 'react-router-dom'
import Home from './components/Home';
import Matches from './components/Matches';
import Match from './components/Match';
import Bookings from './components/Bookings';
import Login from './components/Login';
import Signup from './components/Signup';
import Payment from './components/Payment';
import SeatLayout from './components/SeatLayout';
import MyBookings from './components/MyBookings';
import { getToken } from './components/auth';

function RequireAuth({ children }) {
  const token = getToken();
  if (!token) 
    return <Navigate to="/users/login" replace />
  return children
}

function App() {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    setRouteLoading(true);
    const t = setTimeout(() => setRouteLoading(false), 250);
    return () => clearTimeout(t);
  }, [location]);

  return <>
    {routeLoading && (
      <div style={{
        position:'fixed',
        inset:0,
        background:'rgba(15,6,23,0.9)',
        zIndex:1300,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        backdropFilter:'blur(4px)',
      }}>
        <div style={{textAlign:'center'}}>
          <div style={{
            width:48,
            height:48,
            borderRadius:'50%',
            border:'4px solid #1f80e0',
            borderTopColor:'transparent',
            animation:'spin 0.8s linear infinite',
            margin:'0 auto',
          }}></div>
          <p style={{color:'#888',marginTop:14,fontSize:13,fontWeight:600,letterSpacing:'1px'}}>LOADING</p>
        </div>
      </div>
    )}
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/users/signup' element={<Signup/>}/>
      <Route path='/users/login' element={<Login/>}/>
      <Route path='/bookmyshow/matches' element={<Matches/>}/>
      <Route path='/bookmyshow/matches/:id' element={<RequireAuth><Match/></RequireAuth>}/>
      <Route path='/bookmyshow/seat-layout/:showId' element={<RequireAuth><SeatLayout/></RequireAuth>}/>
      <Route path='/bookmyshow/payment/:theaterId/:showId/:selected/:total' element={<RequireAuth><Payment/></RequireAuth>}/>
      <Route path='/users/bookings' element={<RequireAuth><MyBookings/></RequireAuth>}/>
    </Routes>
  </>
}

export default App;
