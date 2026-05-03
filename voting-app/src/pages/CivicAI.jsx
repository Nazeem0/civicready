import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getGlobalLang, setGlobalLang } from '../components/Navbar';

const SUGGESTED = [
  "How does ranked choice voting work?",
  "What is gerrymandering?",
  "How do I register to vote?",
  "What is proportional representation?",
  "How does the Electoral College work?",
  "What is the difference between a primary and general election?",
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
];

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#060e20 0%,#0b1326 60%,#0f1a30 100%)', color: '#dae2fd', fontFamily: "'Manrope',sans-serif", paddingTop: 64 },
  glass: { background: 'rgba(23,31,51,0.75)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14 },
  msg: (isUser) => ({
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: 16,
    alignItems: 'flex-start',
  }),
  bubble: (isUser) => ({
    maxWidth: '72%',
    padding: '12px 16px',
    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: isUser ? 'linear-gradient(135deg,#528dff,#0059c7)' : 'rgba(30,40,65,0.9)',
    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.09)',
    fontSize: 14,
    lineHeight: 1.6,
    color: '#dae2fd',
    fontFamily: "'Manrope',sans-serif",
  }),
};

export default function CivicAI() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "👋 Hi! I'm **CivicAI**, your non-partisan civic assistant.\n\nI can help you understand voter registration, election processes, how different voting systems work, civic rights, and democratic participation.\n\nYou can switch the response language using the selector in the **navbar** or the one above! 🌐",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState(getGlobalLang());
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(null);
  const [translateAvailable, setTranslateAvailable] = useState(false);
  const bottomRef = useRef(null);

  // Sync with global navbar language changes
  useEffect(() => {
    const handler = (e) => setSelectedLang(e.detail.code);
    window.addEventListener('civic_lang_change', handler);
    return () => window.removeEventListener('civic_lang_change', handler);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    api.get('/civicai/health').then(r => {
      setAiAvailable(r?.data?.ai_available === true);
    }).catch(() => setAiAvailable(false));

    api.get('/translate/health').then(r => {
      setTranslateAvailable(r?.data?.google_translate_configured === true);
    }).catch(() => setTranslateAvailable(false));
  }, []);

  const translateReply = async (text, targetLang) => {
    if (targetLang === 'en') return text;
    try {
      const r = await api.post('/translate/text', {
        text,
        target_language: targetLang,
        source_language: 'en'
      });
      return r?.data?.translated || text;
    } catch {
      return text;
    }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const r = await api.post('/civicai/chat', { message: msg });
      let reply = r?.data?.reply || "I'm sorry, I couldn't process that question. Please try again.";

      // Translate if a non-English language is selected
      if (selectedLang !== 'en') {
        reply = await translateReply(reply, selectedLang);
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        text: reply,
        powered_by: r?.data?.powered_by,
        translated: selectedLang !== 'en' ? LANGUAGES.find(l => l.code === selectedLang)?.name : null
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: "I'm sorry, I couldn't process that question. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const currentLang = LANGUAGES.find(l => l.code === selectedLang);

  const formatText = (text) => {
    return text.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  return (
    <div style={s.page}>
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* Back Button */}
        <Link to="/labs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#8c90a0', textDecoration: 'none', fontSize: 13, fontFamily: "'Lexend',sans-serif", fontWeight: 600, marginBottom: 20, padding: '8px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
          aria-label="Go back to Democracy Lab">
          <span className="material-icons-round" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Democracy Lab
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span className="material-icons-round" style={{ color: '#528dff', fontSize: 32 }}>psychology</span>
              <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 700, margin: 0 }}>CivicAI Assistant</h1>
              <span style={{ background: '#528dff22', border: '1px solid #528dff55', color: '#528dff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, fontFamily: "'Lexend',sans-serif" }}>
                AI-Powered
              </span>
            </div>
            <p style={{ color: '#8c90a0', margin: 0, fontSize: 14 }}>
              Non-partisan civic answers. Powered by AI + Google Translate for 10 languages.
            </p>
          </div>

          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              aria-label="Select response language"
              aria-expanded={showLangMenu}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#dae2fd', cursor: 'pointer', fontSize: 13, fontFamily: "'Lexend',sans-serif", fontWeight: 600 }}
            >
              <span style={{ fontSize: 18 }}>{currentLang?.flag}</span>
              {currentLang?.name}
              <span className="material-icons-round" style={{ fontSize: 16, color: '#8c90a0' }}>
                {showLangMenu ? 'expand_less' : 'expand_more'}
              </span>
              {translateAvailable && (
                <span title="Google Translate Active" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
              )}
            </button>

            {showLangMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: 'rgba(13,22,40,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 8, zIndex: 100, minWidth: 180, backdropFilter: 'blur(20px)' }} role="listbox" aria-label="Language options">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={selectedLang === lang.code}
                    onClick={() => { setSelectedLang(lang.code); setShowLangMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', background: selectedLang === lang.code ? 'rgba(82,141,255,0.15)' : 'transparent', border: 'none', borderRadius: 8, color: selectedLang === lang.code ? '#afc6ff' : '#8c90a0', cursor: 'pointer', fontSize: 13, fontFamily: "'Manrope',sans-serif", textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 16 }}>{lang.flag}</span>
                    {lang.name}
                    {selectedLang === lang.code && <span className="material-icons-round" style={{ fontSize: 14, marginLeft: 'auto', color: '#528dff' }}>check</span>}
                  </button>
                ))}
                <div style={{ padding: '8px 12px 4px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: '#424754', fontFamily: "'Lexend',sans-serif", fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {translateAvailable ? '✦ Google Translate Active' : '○ Translation: Add API key'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {!aiAvailable && aiAvailable !== null && (
          <div style={{ marginBottom: 16, padding: '8px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 12, color: '#f59e0b' }}>
            ⚠️ Add <code>GEMINI_API_KEY</code> or <code>GROK_API_KEY</code> to your .env file for live AI responses.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          {/* Chat Area */}
          <div>
            <div style={{ ...s.glass, padding: 20, height: 460, overflowY: 'auto', marginBottom: 12 }} role="log" aria-label="Chat messages" aria-live="polite">
              {messages.map((msg, i) => (
                <div key={i} style={s.msg(msg.role === 'user')}>
                  {msg.role === 'ai' && (
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#528dff,#0059c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0, marginTop: 2 }}>
                      <span className="material-icons-round" style={{ fontSize: 16, color: '#fff' }}>psychology</span>
                    </div>
                  )}
                  <div>
                    <div style={s.bubble(msg.role === 'user')}>
                      {formatText(msg.text)}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, paddingLeft: 4 }}>
                      {msg.powered_by && (
                        <span style={{ fontSize: 10, color: '#424754' }}>✦ {msg.powered_by}</span>
                      )}
                      {msg.translated && (
                        <span style={{ fontSize: 10, color: '#10b981' }}>🌐 Translated to {msg.translated}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={s.msg(false)}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#528dff,#0059c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                    <span className="material-icons-round" style={{ fontSize: 16, color: '#fff' }}>psychology</span>
                  </div>
                  <div style={{ ...s.bubble(false) }}>
                    <span style={{ opacity: 0.6 }}>Thinking{selectedLang !== 'en' ? ' + translating' : ''}…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={selectedLang === 'en' ? "Ask a civic question…" : `Ask a question (reply in ${currentLang?.name})…`}
                disabled={loading}
                aria-label="Type your civic question here"
                style={{ flex: 1, background: 'rgba(13,22,40,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 16px', color: '#dae2fd', fontSize: 14, outline: 'none', fontFamily: "'Manrope',sans-serif" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                style={{ padding: '12px 20px', background: 'linear-gradient(135deg,#528dff,#0059c7)', border: 'none', borderRadius: 10, color: '#fff', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Lexend',sans-serif", fontWeight: 600, fontSize: 13 }}
              >
                <span className="material-icons-round" style={{ fontSize: 18 }}>send</span>
                Send
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ ...s.glass, padding: 16, marginBottom: 12 }}>
              <p style={{ fontFamily: "'Lexend',sans-serif", fontSize: 11, fontWeight: 700, color: '#8c90a0', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>Suggested Questions</p>
              {SUGGESTED.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} aria-label={`Ask: ${q}`}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'rgba(82,141,255,0.05)', border: '1px solid rgba(82,141,255,0.15)', borderRadius: 8, padding: '9px 12px', color: '#afc6ff', fontSize: 12, cursor: 'pointer', fontFamily: "'Manrope',sans-serif", marginBottom: 8, lineHeight: 1.4 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(82,141,255,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(82,141,255,0.05)'; }}
                >
                  {q}
                </button>
              ))}
            </div>

            <div style={{ ...s.glass, padding: 16 }}>
              <p style={{ fontFamily: "'Lexend',sans-serif", fontSize: 11, fontWeight: 700, color: '#8c90a0', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Google Services</p>
              {[
                { icon: 'psychology', color: '#528dff', label: 'Gemini AI', sub: 'Civic Q&A' },
                { icon: 'translate', color: '#10b981', label: 'Cloud Translate', sub: '10 languages', active: translateAvailable },
                { icon: 'storage', color: '#f59e0b', label: 'Cloud Storage', sub: 'Document upload' },
                { icon: 'rocket_launch', color: '#8b5cf6', label: 'Cloud Run', sub: 'Hosting' },
              ].map(svc => (
                <div key={svc.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span className="material-icons-round" style={{ color: svc.color, fontSize: 16 }}>{svc.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, color: '#c2c6d7', fontWeight: 600 }}>{svc.label}</div>
                    <div style={{ fontSize: 10, color: svc.active === false ? '#f59e0b' : '#424754' }}>{svc.active === false ? '⚠ Add API key' : svc.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
