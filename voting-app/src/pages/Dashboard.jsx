import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import './Dashboard.css';

const nextSteps = [
  { icon: 'edit_location', title: 'Complete Address Update', desc: 'Required for polling location assignment', status: 'required', color: 'red' },
  { icon: 'location_on', title: 'Polling Intel', desc: 'Live: Central Library — 0.4 mi away', status: 'live', color: 'green' },
  { icon: 'smart_toy', title: 'Voter Rights Chatbot', desc: 'Ask about ID laws & accessibility', status: 'available', color: 'blue' },
];

const alerts = [
  { icon: 'warning', title: 'Registration Deadline', desc: '5 Days Remaining — Oct 15, 2024', color: 'red' },
  { icon: 'mail', title: 'Mail-In Ballot Request', desc: '12 Days Remaining — Oct 22, 2024', color: 'amber' },
];



const activities = [
  { icon: 'check_circle', text: 'Viewed polling location', time: '2h ago', color: 'green' },
  { icon: 'info', text: 'Viewed mail-in ballot guide', time: '1d ago', color: 'blue' },
  { icon: 'school', text: 'Completed "Democracy 101" module', time: '3d ago', color: 'purple' },
  { icon: 'how_to_vote', text: 'Registration lookup initiated', time: '5d ago', color: 'amber' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await apiFetch('/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserData(data.data);
        }
      } catch (err) {
        console.error('Failed to load user', err);
      }
    }
    loadUser();
  }, []);

  const firstName = userData?.full_name ? userData.full_name.split(' ')[0] : 'Citizen';

  return (
    <div className="dashboard-page">
      <div className="dash-hero">
        <div className="dash-hero-glow" />
        <div className="container">
          <div className="dash-hero-header">
            <div>
              {userData?.profile?.registration_status === 'active' ? (
                <div className="badge badge-green" style={{ marginBottom: 12 }}>
                  <span className="material-icons-round" style={{ fontSize: 12 }}>check_circle</span>
                  Voter Status: Complete
                </div>
              ) : (
                <div className="badge badge-red" style={{ marginBottom: 12 }}>
                  <span className="material-icons-round" style={{ fontSize: 12 }}>warning</span>
                  Voter Status: Incomplete
                </div>
              )}
              <h1>Welcome back, <span className="gradient-text">{firstName}.</span></h1>
              <p>
                {userData?.profile?.registration_status === 'active' 
                  ? 'Your voter registration is fully complete and active.' 
                  : 'Your registration needs attention before the upcoming general election.'}
              </p>
            </div>
            <div className="voter-status-card card">
              <div className="vs-label">Completion</div>
              <div className="vs-value">65%</div>
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div className="progress-fill" style={{ width: '65%' }} />
              </div>
              <div className="vs-hint">3 items need attention</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="dash-tabs">
            {['overview', 'deadlines', 'activity'].map(tab => (
              <button
                key={tab}
                className={`dash-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container dash-body">
        {activeTab === 'overview' && (
          <div className="dash-grid animate-fade-up">
            {/* Main Column */}
            <div className="dash-main">
              {/* Alerts */}
              <div className="dash-section-title">
                <span className="material-icons-round">notifications_active</span>
                Deadline Alerts
              </div>
              <div className="alerts-list">
                {alerts.map(a => (
                  <div key={a.title} className={`alert-item card alert-${a.color}`}>
                    <span className={`material-icons-round alert-icon-${a.color}`}>{a.icon}</span>
                    <div>
                      <div className="alert-title">{a.title}</div>
                      <div className="alert-desc">{a.desc}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      Take Action
                    </button>
                  </div>
                ))}
              </div>

              {/* Next Steps */}
              <div className="dash-section-title" style={{ marginTop: 28 }}>
                <span className="material-icons-round">task_alt</span>
                Recommended Next Steps
              </div>
              <div className="steps-list">
                {nextSteps.map(s => (
                  <div key={s.title} className="step-row card">
                    <div className={`step-row-icon step-row-icon-${s.color}`}>
                      <span className="material-icons-round">{s.icon}</span>
                    </div>
                    <div className="step-row-info">
                      <div className="step-row-title">{s.title}</div>
                      <div className="step-row-desc">{s.desc}</div>
                    </div>
                    <span className={`badge badge-${s.color}`}>{s.status}</span>
                  </div>
                ))}
              </div>


            </div>

            {/* Sidebar */}
            <div className="dash-sidebar">
              <div className="card dash-profile-card">
                <div className="profile-avatar">
                  <span className="material-icons-round">person</span>
                </div>
                <div className="profile-name">{userData?.full_name || 'Loading...'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  {userData?.email || userData?.phone_number || ''}
                </div>
                <div className="profile-status">
                  {userData?.profile?.registration_status === 'active' ? (
                    <span className="badge badge-green" style={{ textTransform: 'uppercase' }}>Registration Complete</span>
                  ) : (
                    <span className="badge badge-amber" style={{ textTransform: 'uppercase' }}>Registration Incomplete</span>
                  )}
                </div>
                <div className="profile-stats">
                  <div className="profile-stat">
                    <div className="profile-stat-value">3</div>
                    <div className="profile-stat-label">Elections Voted</div>
                  </div>
                  <div className="profile-stat-divider" />
                  <div className="profile-stat">
                    <div className="profile-stat-value">7</div>
                    <div className="profile-stat-label">Modules Done</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="dash-section-title" style={{ marginBottom: 14 }}>
                  <span className="material-icons-round">history</span>
                  Recent Activity
                </div>
                <div className="activity-list">
                  {activities.map((a, i) => (
                    <div key={i} className="activity-item">
                      <span className={`material-icons-round activity-icon-${a.color}`} style={{ fontSize: 16 }}>{a.icon}</span>
                      <div className="activity-info">
                        <div className="activity-text">{a.text}</div>
                        <div className="activity-time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deadlines' && (
          <div className="animate-fade-up">
            <h3 style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>All Upcoming Deadlines</h3>
            <div className="alerts-list">
              {[...alerts,
                { icon: 'how_to_vote', title: 'Early Voting Opens', desc: 'October 18, 2024 — Find your location', color: 'green' },
                { icon: 'event', title: 'General Election Day', desc: 'November 5, 2024 — Mark your calendar', color: 'blue' },
              ].map(a => (
                <div key={a.title} className={`alert-item card alert-${a.color}`}>
                  <span className={`material-icons-round alert-icon-${a.color}`}>{a.icon}</span>
                  <div>
                    <div className="alert-title">{a.title}</div>
                    <div className="alert-desc">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="animate-fade-up card" style={{ maxWidth: 600 }}>
            <h3 style={{ marginBottom: 20 }}>Full Activity Log</h3>
            <div className="activity-list">
              {activities.map((a, i) => (
                <div key={i} className="activity-item" style={{ padding: '14px 0' }}>
                  <span className={`material-icons-round activity-icon-${a.color}`}>{a.icon}</span>
                  <div className="activity-info">
                    <div className="activity-text">{a.text}</div>
                    <div className="activity-time">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
