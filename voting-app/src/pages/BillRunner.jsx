import { useState, useEffect, useRef } from 'react';
import './BillRunner.css';

const ARCHETYPES = [
  { id: 'idealist', name: 'Idealist', desc: 'Prioritizes moral integrity over political games.', bonus: { integrity: 20, capital: -10 } },
  { id: 'pragmatist', name: 'Pragmatist', desc: 'Masters the art of the deal and compromise.', bonus: { capital: 20, approval: 10 } },
  { id: 'outsider', name: 'Outsider', desc: 'Rallies the public to pressure the establishment.', bonus: { approval: 20, capital: -20 } },
];

const TOPICS = [
  { id: 'climate', name: 'Green Future Act', icon: 'eco' },
  { id: 'health', name: 'Universal Care Bill', icon: 'medical_services' },
  { id: 'privacy', name: 'Digital Rights Charter', icon: 'security' },
];

const CHAPTERS = [
  {
    title: 'Chapter 1: The Drafting',
    desc: 'Your bill is in its infancy. How aggressive should the initial draft be?',
    choices: [
      { 
        text: 'Bold & Comprehensive', 
        meta: '+20 Integrity, -10 Capital',
        effect: { integrity: 20, capital: -10, votes: 5 },
        news: 'Lawmaker introduces "ambitious" new legislation.'
      },
      { 
        text: 'Moderate & Bipartisan', 
        meta: '+15 Capital, -5 Integrity',
        effect: { capital: 15, integrity: -5, votes: 15 },
        news: 'Middle-ground approach praised by party leadership.'
      }
    ]
  },
  {
    title: 'Chapter 2: Committee Review',
    desc: 'The Committee Chair is skeptical. They want a "favor" to let the bill pass to the floor.',
    choices: [
      { 
        text: 'Agree to their amendment', 
        meta: '+20 Votes, -15 Integrity',
        effect: { votes: 20, integrity: -15, approval: -5 },
        news: 'Controversial amendments added in closed-door session.'
      },
      { 
        text: 'Appeal to the public', 
        meta: '+25 Approval, -20 Capital',
        effect: { approval: 25, capital: -20, votes: 5 },
        news: 'Public pressure mounts on Committee leadership.'
      }
    ]
  },
  {
    title: 'Chapter 3: The Media Crisis',
    desc: 'A leaked memo suggests the bill will cost more than projected. The media is swarming.',
    choices: [
      { 
        text: 'Defend the vision', 
        meta: '+15 Integrity, -15 Approval',
        effect: { integrity: 15, approval: -15, votes: -5 },
        news: 'Lawmaker doubles down despite fiscal concerns.'
      },
      { 
        text: 'Pivot to budget cuts', 
        meta: '+15 Capital, +10 Votes',
        effect: { capital: 15, votes: 10, integrity: -10 },
        news: 'Revised fiscal plan wins over fiscal conservatives.'
      }
    ]
  },
  {
    title: 'Chapter 4: The Floor Vote',
    desc: 'It is time. You are 5 votes short of a majority. One final deal must be made.',
    choices: [
      { 
        text: 'Expend all remaining capital', 
        meta: 'Uses 40 Capital, +15 Votes',
        effect: { capital: -40, votes: 15 },
        news: 'Late-night wheeling and dealing secures the floor.'
      },
      { 
        text: 'Stay the course', 
        meta: '+10 Integrity, +0 Votes',
        effect: { integrity: 10, votes: 0 },
        news: 'The chamber holds its breath as the clock ticks.'
      }
    ]
  }
];

export default function BillRunner() {
  const [gameState, setGameState] = useState('setup'); // setup, playing, ended
  const [archetype, setArchetype] = useState(null);
  const [billTopic, setBillTopic] = useState(null);
  const [stats, setStats] = useState({ capital: 50, approval: 50, votes: 20, integrity: 80 });
  const [chapterIndex, setChapterIndex] = useState(0);
  const [newsFeed, setNewsFeed] = useState([]);
  const newsEndRef = useRef(null);

  useEffect(() => {
    if (newsEndRef.current) {
      newsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [newsFeed]);

  const handleStartGame = () => {
    if (!archetype || !billTopic) return;
    
    // Apply archetype bonuses
    setStats(prev => ({
      ...prev,
      capital: prev.capital + (archetype.bonus.capital || 0),
      approval: prev.approval + (archetype.bonus.approval || 0),
      integrity: prev.integrity + (archetype.bonus.integrity || 0),
    }));
    
    setNewsFeed([{ text: `Session begins: ${archetype.name} pushes ${billTopic.name}.`, time: '10:00 AM', type: 'info' }]);
    setGameState('playing');
  };

  const handleChoice = (choice) => {
    // Apply effects
    setStats(prev => {
      const next = { ...prev };
      Object.keys(choice.effect).forEach(key => {
        next[key] = Math.max(0, Math.min(100, (next[key] || 0) + (choice.effect[key] || 0)));
      });
      return next;
    });

    // Add news
    setNewsFeed(prev => [...prev, { 
      text: choice.news, 
      time: `${11 + chapterIndex}:00 AM`, 
      type: (choice.effect.integrity || 0) < 0 || (choice.effect.approval || 0) < 0 ? 'bad' : 'good' 
    }]);

    // Advance or end
    if (chapterIndex < CHAPTERS.length - 1) {
      setChapterIndex(prev => prev + 1);
    } else {
      setGameState('ended');
    }
  };

  const getEnding = () => {
    const { votes, integrity, approval } = stats;
    if (votes >= 51 && integrity >= 80) return { title: 'Historic Victory', desc: 'The bill passed with its core reforms intact. You are a legendary leader.' };
    if (votes >= 51 && integrity < 50) return { title: 'Pyrrhic Victory', desc: 'The bill passed, but your integrity is shattered. Was it worth the cost?' };
    if (votes >= 51) return { title: 'Watered-Down Win', desc: 'The bill passed, but many key goals were sacrificed along the way.' };
    if (approval >= 80) return { title: 'Heroic Failure', desc: 'The bill failed, but you earned the unwavering trust of the people.' };
    return { title: 'Stalled in Committee', desc: 'The bill died in the halls of power. Better luck next session.' };
  };

  if (gameState === 'setup') {
    return (
      <div className="br-page">
        <div className="br-header">
          <div className="container animate-fade-up">
            <div className="badge badge-amber" style={{ marginBottom: 12 }}>
              <span className="material-icons-round" style={{ fontSize: 12 }}>gavel</span> Legislative Strategy
            </div>
            <h1>Bill Runner: Setup</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Choose your political path and the mission ahead.</p>
          </div>
        </div>

        <div className="container animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="br-card" style={{ marginBottom: 24 }}>
            <div className="br-card-title">Choose Your Archetype</div>
            <div className="setup-grid">
              {ARCHETYPES.map(a => (
                <div 
                  key={a.id} 
                  className={`setup-card ${archetype?.id === a.id ? 'active' : ''}`}
                  onClick={() => setArchetype(a)}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 18 }}>{a.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.desc}</div>
                </div>
              ))}
            </div>

            <div className="br-card-title">Select Bill Topic</div>
            <div className="setup-grid">
              {TOPICS.map(t => (
                <div 
                  key={t.id} 
                  className={`setup-card ${billTopic?.id === t.id ? 'active' : ''}`}
                  onClick={() => setBillTopic(t)}
                >
                  <span className="material-icons-round" style={{ fontSize: 32, marginBottom: 8, color: 'var(--civic-blue)' }}>{t.icon}</span>
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                </div>
              ))}
            </div>

            <button 
              className="btn btn-primary full-width" 
              style={{ marginTop: 24 }}
              disabled={!archetype || !billTopic}
              onClick={handleStartGame}
            >
              Begin Legislative Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'ended') {
    const ending = getEnding();
    return (
      <div className="br-page">
        <div className="container animate-fade-up" style={{ paddingTop: 100 }}>
          <div className="br-card end-screen">
            <div className="end-title">{ending.title}</div>
            <div className="end-subtitle">{ending.desc}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 40 }}>
              <div className="br-stat">
                <div className="br-stat-header">Final Votes</div>
                <div className="br-stat-val" style={{ fontSize: 24 }}>{stats.votes}</div>
              </div>
              <div className="br-stat">
                <div className="br-stat-header">Integrity</div>
                <div className="br-stat-val" style={{ fontSize: 24 }}>{stats.integrity}%</div>
              </div>
              <div className="br-stat">
                <div className="br-stat-header">Approval</div>
                <div className="br-stat-val" style={{ fontSize: 24 }}>{stats.approval}%</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Restart Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentEvent = CHAPTERS[chapterIndex];

  return (
    <div className="br-page">
      <div className="br-header">
        <div className="container animate-fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="badge badge-purple" style={{ marginBottom: 12 }}>
                <span className="material-icons-round" style={{ fontSize: 12 }}>history_edu</span> Narrative Simulator
              </div>
              <h1>{billTopic.name}</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Archetype</div>
              <div style={{ fontWeight: 700, color: 'var(--civic-teal)' }}>{archetype.name}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container br-layout">
        
        {/* Left: News Feed */}
        <div className="br-panel animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="br-card" style={{ height: '100%' }}>
            <div className="br-card-title">
              <span className="material-icons-round">rss_feed</span> Media Timeline
            </div>
            <div className="news-feed">
              {newsFeed.map((n, i) => (
                <div key={i} className={`news-item ${n.type}`}>
                  <div className="news-time">{n.time}</div>
                  <div className="news-text">{n.text}</div>
                </div>
              ))}
              <div ref={newsEndRef} />
            </div>
          </div>
        </div>

        {/* Center: Story */}
        <div className="br-panel animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="br-card story-area">
            <div className="story-chapter">{currentEvent.title}</div>
            <div className="story-text">{currentEvent.desc}</div>
            <div className="choices-list">
              {currentEvent.choices.map((c, i) => (
                <button key={i} className="choice-btn" onClick={() => handleChoice(c)}>
                  <div className="choice-desc">{c.text}</div>
                  <div className="choice-meta">{c.meta}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="br-panel animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <div className="br-card" style={{ background: 'var(--gradient-blue)', color: 'white', border: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, marginBottom: 8 }}>Whip Count (Floor)</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{stats.votes} / 51</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Votes Needed to Pass</div>
              </div>
              <span className="material-icons-round" style={{ fontSize: 48, opacity: 0.2 }}>ballot</span>
            </div>
            <div className="progress-bar" style={{ marginTop: 16, background: 'rgba(255,255,255,0.2)' }}>
              <div className="progress-fill" style={{ width: `${(stats.votes / 51) * 100}%`, background: '#fff' }} />
            </div>
          </div>

          <div className="br-card">
            <div className="br-card-title">System Status</div>
            
            <div className="br-stat">
              <div className="br-stat-header">
                <span>Political Capital</span>
                <span className="br-stat-val">{stats.capital}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${stats.capital}%`, background: 'var(--civic-purple-light)' }} />
              </div>
            </div>

            <div className="br-stat">
              <div className="br-stat-header">
                <span>Public Approval</span>
                <span className="br-stat-val">{stats.approval}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${stats.approval}%`, background: 'var(--civic-teal)' }} />
              </div>
            </div>

            <div className="br-stat">
              <div className="br-stat-header">
                <span>Moral Integrity</span>
                <span className="br-stat-val">{stats.integrity}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${stats.integrity}%`, background: '#10b981' }} />
              </div>
            </div>
          </div>

          <div className="br-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>SESSION CLOCK</div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace' }}>
              {12 - chapterIndex}:00 HRS REMAINING
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
