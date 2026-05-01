import { Link } from 'react-router-dom';
import './Home.css';

const features = [
  {
    icon: 'how_to_vote',
    color: 'blue',
    title: 'VoteReady',
    desc: 'Check your eligibility, register, and prep for election day in minutes.',
    link: '/vote',
  },
  {
    icon: 'bar_chart',
    color: 'purple',
    title: 'Dashboard',
    desc: 'Track your voter status, deadlines, and personalized civic action plan.',
    link: '/dashboard',
  },
  {
    icon: 'science',
    color: 'teal',
    title: 'Democracy Lab',
    desc: 'Interactive simulations — gerrymander maps, pass bills, run elections.',
    link: '/labs',
  },
];

const ambassadors = [
  { name: 'Maria R.', role: 'Election Volunteer', quote: '"Why voting is my community duty."', initials: 'MR' },
  { name: 'David K.', role: 'First-time Voter', quote: '"The process was easier than I thought."', initials: 'DK' },
  { name: 'Susan L.', role: 'Civic Educator', quote: '"Teaching the next generation."', initials: 'SL' },
];

const stats = [
  { value: '2.4M', label: 'Voters Reached', icon: 'people' },
  { value: 'Simulations', label: 'Types', icon: 'science' },
  { value: '98%', label: 'Uptime', icon: 'verified' },
  { value: '50+', label: 'States Supported', icon: 'map' },
];

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-glow" />
        <div className="container hero-content animate-fade-up">
          <div className="badge badge-blue hero-badge">
            <span className="material-icons-round" style={{ fontSize: 12 }}>verified</span>
            Non-partisan · Secure · Trusted
          </div>
          <h1 className="hero-title">
            Democracy,<br />
            <span className="gradient-text">simplified.</span>
          </h1>
          <p className="hero-subtitle">
            Secure, non-partisan, and designed for every citizen. Navigate your civic duties
            with institutional clarity and confidence.
          </p>
          <div className="hero-cta">
            <Link to="/vote" className="btn btn-primary">
              <span className="material-icons-round">how_to_vote</span>
              Get VoteReady
            </Link>
            <Link to="/labs" className="btn btn-outline">
              <span className="material-icons-round">science</span>
              Explore Democracy Lab
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="container stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-item">
              <span className="material-icons-round stat-icon">{s.icon}</span>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why CivicReady?</h2>
            <p>Everything you need to participate fully in democracy — in one place.</p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <Link key={f.title} to={f.link} className={`feature-card card feature-${f.color}`}>
                <div className={`feature-icon-wrap feature-icon-${f.color}`}>
                  <span className="material-icons-round">{f.icon}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <div className="feature-arrow">
                  <span className="material-icons-round">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="section pillars-section">
        <div className="container pillars-layout">
          <div className="pillars-text">
            <div className="badge badge-purple" style={{ marginBottom: 16 }}>Our Principles</div>
            <h2>Built on trust.<br />Designed for all.</h2>
            <p>
              CivicReady was built from the ground up to ensure every citizen has equal
              access to the democratic process, regardless of background or ability.
            </p>
          </div>
          <div className="pillars-cards">
            <div className="pillar-card card">
              <div className="pillar-icon blue">
                <span className="material-icons-round">security</span>
              </div>
              <h4>Institutional Trust</h4>
              <p>Built on secure government standards ensuring your data and vote remain private and protected.</p>
            </div>
            <div className="pillar-card card">
              <div className="pillar-icon teal">
                <span className="material-icons-round">accessibility_new</span>
              </div>
              <h4>Universal Access</h4>
              <p>Available in 12 languages with full screen-reader support and simplified civic terminology.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ambassadors */}
      <section className="section ambassadors-section">
        <div className="container">
          <div className="section-header">
            <h2>Ambassador Stories</h2>
            <p>Hear from citizens making a difference in their communities.</p>
          </div>
          <div className="ambassadors-grid">
            {ambassadors.map((a) => (
              <div key={a.name} className="ambassador-card card">
                <div className="quote-mark">"</div>
                <p className="quote-text">{a.quote.replace(/"/g, '')}</p>
                <div className="ambassador-info">
                  <div className="ambassador-avatar">{a.initials}</div>
                  <div>
                    <div className="ambassador-name">{a.name}</div>
                    <div className="ambassador-role">{a.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span className="material-icons-round" style={{ color: 'var(--civic-blue-light)' }}>how_to_vote</span>
            <span>© 2024 CivicReady Foundation. Non-partisan organization.</span>
          </div>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Accessibility</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
