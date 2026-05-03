import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getAuthToken, removeAuthToken, apiFetch } from '../api';
import './Navbar.css';

const links = [
  { to: '/', icon: 'dashboard', label: 'Home' },
  { to: '/vote', icon: 'how_to_vote', label: 'VoteReady' },
  { to: '/dashboard', icon: 'bar_chart', label: 'Dashboard' },
  { to: '/labs', icon: 'science', label: 'Democracy Lab' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
];

// Global language stored in localStorage so all pages can read it
export const getGlobalLang = () => localStorage.getItem('civic_lang') || 'en';
export const setGlobalLang = (code) => {
  localStorage.setItem('civic_lang', code);
  window.dispatchEvent(new CustomEvent('civic_lang_change', { detail: { code } }));
};

export default function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!getAuthToken();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState(getGlobalLang());
  const langRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Listen for language changes from other components
  useEffect(() => {
    const handler = (e) => setCurrentLang(e.detail.code);
    window.addEventListener('civic_lang_change', handler);
    return () => window.removeEventListener('civic_lang_change', handler);
  }, []);

  const handleLangSelect = (code) => {
    setCurrentLang(code);
    setGlobalLang(code);
    setShowLangMenu(false);

    if (code === 'en') {
      // Reset Google Translate to original language
      var frame = document.querySelector('.goog-te-banner-frame');
      if (frame) {
        var restore = frame.contentDocument?.querySelector('.goog-close-link');
        if (restore) restore.click();
      }
      // Fallback: reload if no banner found
      var cookie = document.cookie.match(/googtrans=([^;]+)/);
      if (cookie) {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + location.hostname;
        window.location.reload();
      }
    } else {
      // Trigger Google Website Translator for the whole page
      if (window.triggerGoogleTranslate) {
        window.triggerGoogleTranslate(code);
      }
    }
  };

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

  const lang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

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

        <div className="nav-actions" style={{ gap: 10 }}>
          {/* Language Selector */}
          <div ref={langRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              aria-label="Select language"
              aria-expanded={showLangMenu}
              title="Translate"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px',
                background: showLangMenu ? 'rgba(82,141,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, cursor: 'pointer',
                color: 'var(--text-secondary, #8c90a0)',
                fontSize: 12, fontFamily: "'Lexend',sans-serif", fontWeight: 600,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(82,141,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(82,141,255,0.3)'; }}
              onMouseLeave={e => {
                if (!showLangMenu) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }
              }}
            >
              <span className="material-icons-round" style={{ fontSize: 15, color: '#528dff' }}>translate</span>
              <span style={{ fontSize: 14 }}>{lang.flag}</span>
              <span>{lang.name}</span>
              <span className="material-icons-round" style={{ fontSize: 14 }}>
                {showLangMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showLangMenu && (
              <div
                role="listbox"
                aria-label="Language options"
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'rgba(10,18,35,0.98)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, padding: 8, zIndex: 1000,
                  minWidth: 170, backdropFilter: 'blur(24px)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ padding: '4px 10px 8px', fontSize: 10, color: '#424754', fontFamily: "'Lexend',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 }}>
                  🌐 Google Translate
                </div>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    role="option"
                    aria-selected={currentLang === l.code}
                    onClick={() => handleLangSelect(l.code)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 10px',
                      background: currentLang === l.code ? 'rgba(82,141,255,0.15)' : 'transparent',
                      border: 'none', borderRadius: 7,
                      color: currentLang === l.code ? '#afc6ff' : '#8c90a0',
                      cursor: 'pointer', fontSize: 13,
                      fontFamily: "'Manrope',sans-serif", textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{l.flag}</span>
                    {l.name}
                    {currentLang === l.code && (
                      <span className="material-icons-round" style={{ fontSize: 13, marginLeft: 'auto', color: '#528dff' }}>check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
