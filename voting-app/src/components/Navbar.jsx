import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getAuthToken, removeAuthToken, apiFetch } from '../api';
import './Navbar.css';

const links = [
  { to: '/', icon: 'dashboard', label: 'Home' },
  { to: '/vote', icon: 'how_to_vote', label: 'VoteReady' },
  { to: '/dashboard', icon: 'bar_chart', label: 'Dashboard' },
  { to: '/labs', icon: 'science', label: 'Democracy Lab' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!getAuthToken();

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      removeAuthToken();
      navigate('/');
    }
  };

  return (
    <header className="navbar glass">
      <div className="navbar-inner container">
        <NavLink to="/" className="nav-logo">
          <div className="nav-logo-icon">
            <span className="material-icons-round">how_to_vote</span>
          </div>
          <span className="nav-logo-text">CivicReady</span>
        </NavLink>

        <nav className="nav-links">
          {links.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-icons-round">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          {isLoggedIn ? (
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              <span className="material-icons-round" style={{ fontSize: 16 }}>logout</span>
              Logout
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
              <span className="material-icons-round" style={{ fontSize: 16 }}>person</span>
              Login / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
