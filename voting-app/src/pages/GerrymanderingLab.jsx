import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GerrymanderingLab.css';

// 6x6 grid = 36 precincts
// Let's create a map with 16 Blue and 20 Red precincts. (44% Blue, 56% Red)
// We need 4 districts, so ideal population per district is 9.

const INITIAL_GRID = [
  'R', 'R', 'R', 'R', 'R', 'B',
  'R', 'R', 'B', 'B', 'R', 'B',
  'R', 'B', 'B', 'B', 'B', 'R',
  'R', 'B', 'B', 'B', 'R', 'R',
  'B', 'B', 'R', 'R', 'R', 'R',
  'B', 'R', 'R', 'R', 'R', 'R',
];

// 4 community cells in the middle: indices 14, 15, 20, 21
const COMMUNITY_INDICES = [14, 15, 20, 21];

const DISTRICT_COLORS = {
  1: { id: 1, color: '#fde047', name: 'Yellow' },
  2: { id: 2, color: '#a855f7', name: 'Purple' },
  3: { id: 3, color: '#10b981', name: 'Emerald' },
  4: { id: 4, color: '#f97316', name: 'Orange' },
};

// Initial fair-ish layout (4 districts of 9 contiguous cells)
const INITIAL_DISTRICTS = [
  1, 1, 1, 1, 2, 2,
  1, 1, 1, 1, 2, 2,
  1, 3, 3, 2, 2, 2,
  3, 3, 3, 2, 2, 4,
  3, 3, 4, 4, 4, 4,
  3, 3, 4, 4, 4, 4,
];

// Pack Blue into 1 district (Yellow) and let Red win the rest 3.
const PACK_DISTRICTS = [
  1, 1, 4, 4, 4, 4,
  1, 1, 1, 1, 4, 4,
  2, 1, 1, 1, 4, 4,
  2, 1, 1, 1, 3, 3,
  2, 2, 3, 3, 3, 3,
  2, 2, 2, 2, 3, 3,
];

// Crack Blue to let Red win all 4.
const CRACK_DISTRICTS = [
  1, 1, 1, 1, 1, 1,
  1, 1, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 1,
  3, 3, 3, 3, 4, 4,
  3, 3, 3, 4, 4, 4,
  3, 3, 4, 4, 4, 4,
];

export default function GerrymanderingLab() {
  const [precincts, setPrecincts] = useState(() => {
    return INITIAL_GRID.map((lean, i) => ({
      id: i,
      lean,
      district: INITIAL_DISTRICTS[i],
      isCommunity: COMMUNITY_INDICES.includes(i),
    }));
  });

  const [activeBrush, setActiveBrush] = useState(1);
  const [metrics, setMetrics] = useState(null);

  // Calculate Metrics on grid change
  useEffect(() => {
    calculateMetrics(precincts);
  }, [precincts]);

  const handleCellClick = (idx) => {
    setPrecincts(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], district: activeBrush };
      return next;
    });
  };

  const calculateMetrics = (grid) => {
    // 1. Population Equality
    const distCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    grid.forEach(p => distCounts[p.district]++);
    
    let maxDev = 0;
    Object.values(distCounts).forEach(count => {
      maxDev = Math.max(maxDev, Math.abs(count - 9));
    });
    let popGrade = 'A';
    if (maxDev === 1) popGrade = 'B';
    else if (maxDev === 2) popGrade = 'C';
    else if (maxDev === 3) popGrade = 'D';
    else if (maxDev > 3) popGrade = 'F';

    // 2. Partisan Outcomes & Efficiency Gap
    let blueWins = 0;
    let redWins = 0;
    let blueWasted = 0;
    let redWasted = 0;
    let competitiveCount = 0;

    Object.keys(distCounts).forEach(dId => {
      const distPrecincts = grid.filter(p => p.district === parseInt(dId));
      if (distPrecincts.length === 0) return;
      
      const blueVotes = distPrecincts.filter(p => p.lean === 'B').length;
      const redVotes = distPrecincts.filter(p => p.lean === 'R').length;
      const total = blueVotes + redVotes;

      if (blueVotes > redVotes) {
        blueWins++;
        blueWasted += (blueVotes - Math.floor(total / 2) - 1);
        redWasted += redVotes;
      } else if (redVotes > blueVotes) {
        redWins++;
        redWasted += (redVotes - Math.floor(total / 2) - 1);
        blueWasted += blueVotes;
      }

      // Competitiveness
      const margin = Math.abs(blueVotes - redVotes) / total;
      if (margin <= 0.15) competitiveCount++;
    });

    const totalVotes = 36;
    const efficiencyGap = Math.abs(blueWasted - redWasted) / totalVotes;
    
    let fairnessGrade = 'A';
    if (efficiencyGap > 0.08) fairnessGrade = 'B';
    if (efficiencyGap > 0.15) fairnessGrade = 'C';
    if (efficiencyGap > 0.22) fairnessGrade = 'D';
    if (efficiencyGap > 0.3) fairnessGrade = 'F';

    let compGrade = 'C';
    if (competitiveCount >= 2) compGrade = 'A';
    else if (competitiveCount === 1) compGrade = 'B';
    else compGrade = 'F';

    // 3. Community Preservation
    const communityDistricts = new Set();
    COMMUNITY_INDICES.forEach(i => communityDistricts.add(grid[i].district));
    const splits = communityDistricts.size;
    let commGrade = 'A';
    let impactMsg = null;
    if (splits === 2) { commGrade = 'C'; impactMsg = 'You split the Urban Center into 2 districts, diluting their voice.'; }
    else if (splits > 2) { commGrade = 'F'; impactMsg = `Warning: The core community has been fractured into ${splits} pieces!`; }
    else { impactMsg = 'Community boundaries preserved successfully.'; }

    // 4. Contiguity (Simple BFS)
    let isContiguous = true;
    Object.keys(distCounts).forEach(dId => {
      const dNum = parseInt(dId);
      const cells = grid.filter(p => p.district === dNum).map(p => p.id);
      if (cells.length === 0) return;

      const visited = new Set();
      const queue = [cells[0]];
      visited.add(cells[0]);

      while(queue.length > 0) {
        const curr = queue.shift();
        const r = Math.floor(curr / 6);
        const c = curr % 6;
        
        const neighbors = [];
        if (r > 0) neighbors.push(curr - 6); // Up
        if (r < 5) neighbors.push(curr + 6); // Down
        if (c > 0) neighbors.push(curr - 1); // Left
        if (c < 5) neighbors.push(curr + 1); // Right

        neighbors.forEach(n => {
          if (cells.includes(n) && !visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        });
      }

      if (visited.size !== cells.length) {
        isContiguous = false;
      }
    });
    const contigGrade = isContiguous ? 'A' : 'F';

    // 5. Total Ethics Score
    const gradeValues = { A: 4, B: 3, C: 2, D: 1, F: 0 };
    const totalEthics = (
      gradeValues[popGrade] + 
      gradeValues[fairnessGrade] + 
      gradeValues[compGrade] + 
      gradeValues[commGrade] + 
      gradeValues[contigGrade]
    ) / 5;

    const ethicsScore = Math.round((totalEthics / 4) * 100);

    setMetrics({
      popGrade,
      fairnessGrade,
      compGrade,
      commGrade,
      contigGrade,
      blueWins,
      redWins,
      ethicsScore,
      impactMsg,
      splits
    });
  };

  const loadPreset = (preset) => {
    setPrecincts(prev => prev.map((p, i) => ({ ...p, district: preset[i] })));
  };

  return (
    <div className="gerry-page">
      <div className="gerry-header">
        <div className="container animate-fade-up">
          <Link to="/labs" style={{ display:'inline-flex', alignItems:'center', gap:8, color:'var(--text-secondary)', textDecoration:'none', fontSize:13, fontFamily:"'Lexend',sans-serif", fontWeight:600, marginBottom:16, padding:'8px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color='var(--civic-teal)'; e.currentTarget.style.borderColor='rgba(16,185,129,0.3)'; e.currentTarget.style.background='rgba(16,185,129,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
          >
            <span className="material-icons-round" style={{ fontSize:18 }}>arrow_back</span>
            Back to Democracy Lab
          </Link>
          <div className="badge badge-teal" style={{ marginBottom: 12 }}>
            <span className="material-icons-round" style={{ fontSize: 12 }}>science</span> Ethics Simulator
          </div>
          <h1>Gerrymandering Visualizer</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 600 }}>
            Redraw district boundaries to see how packing and cracking can increase political power, 
            reduce fairness, and disrupt real communities across a map.
          </p>
        </div>
      </div>

      <div className="container gerry-layout">
        
        {/* Left Panel - Controls */}
        <div className="gerry-panel animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="gerry-card">
            <div className="gerry-card-title">
              <span className="material-icons-round">brush</span> Paint Districts
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Select a district color and click map cells to reassign them.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.values(DISTRICT_COLORS).map(d => (
                <button 
                  key={d.id} 
                  className={`tool-btn ${activeBrush === d.id ? 'active' : ''}`}
                  onClick={() => setActiveBrush(d.id)}
                >
                  <div className="color-swatch" style={{ background: d.color }} />
                  District {d.id}
                </button>
              ))}
            </div>
          </div>

          <div className="gerry-card">
            <div className="gerry-card-title">
              <span className="material-icons-round">auto_fix_high</span> Presets
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-outline full-width" onClick={() => loadPreset(INITIAL_DISTRICTS)}>
                Balance (Reset)
              </button>
              <button className="btn btn-outline full-width" onClick={() => loadPreset(PACK_DISTRICTS)}>
                Pack Blue Voters
              </button>
              <button className="btn btn-outline full-width" onClick={() => loadPreset(CRACK_DISTRICTS)}>
                Crack Blue Voters
              </button>
            </div>
          </div>
        </div>

        {/* Center - Map */}
        <div className="gerry-panel animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="gerry-map-container">
            <div className="map-grid">
              {precincts.map((p) => (
                <div 
                  key={p.id} 
                  className={`precinct lean-${p.lean === 'B' ? 'blue' : 'red'} dist-${p.district}`}
                  onClick={() => handleCellClick(p.id)}
                >
                  {p.isCommunity && <div className="community-marker" title="Urban Community Center" />}
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <div className="color-swatch" style={{ background: '#2563eb' }} /> Blue Precinct
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <div className="color-swatch" style={{ background: '#dc2626' }} /> Red Precinct
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <div className="community-marker" style={{ position: 'relative', top: 0, left: 0, transform: 'none' }} /> Urban Community
              </div>
            </div>
          </div>

          {metrics?.splits > 1 && (
            <div className="impact-banner">
              <span className="material-icons-round">warning</span>
              <div>
                <strong style={{ display: 'block', fontSize: 14, color: '#ef4444', marginBottom: 4 }}>Community Disruption</strong>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{metrics.impactMsg}</span>
              </div>
            </div>
          )}
          {metrics?.splits === 1 && (
            <div className="impact-banner info">
              <span className="material-icons-round">verified</span>
              <div>
                <strong style={{ display: 'block', fontSize: 14, color: '#3b82f6', marginBottom: 4 }}>Community Intact</strong>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{metrics.impactMsg}</span>
              </div>
            </div>
          )}

        </div>

        {/* Right Panel - Metrics */}
        <div className="gerry-panel animate-fade-up" style={{ animationDelay: '0.3s' }}>
          
          <div className="gerry-card" style={{ background: 'var(--gradient-blue)', color: 'white', border: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, marginBottom: 8 }}>Projected Election Result</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{metrics?.blueWins} - {metrics?.redWins}</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Blue Seats vs Red Seats</div>
              </div>
              <span className="material-icons-round" style={{ fontSize: 48, opacity: 0.2 }}>how_to_vote</span>
            </div>
          </div>

          <div className="gerry-card">
            <div className="gerry-card-title">
              <span className="material-icons-round">fact_check</span> Fairness Report Card
            </div>
            
            <div className="metric-row">
              <span className="metric-label">Population Equality</span>
              <div className={`grade-badge grade-${metrics?.popGrade}`}>{metrics?.popGrade}</div>
            </div>
            <div className="metric-row">
              <span className="metric-label">Contiguity</span>
              <div className={`grade-badge grade-${metrics?.contigGrade}`}>{metrics?.contigGrade}</div>
            </div>
            <div className="metric-row">
              <span className="metric-label">Partisan Fairness</span>
              <div className={`grade-badge grade-${metrics?.fairnessGrade}`}>{metrics?.fairnessGrade}</div>
            </div>
            <div className="metric-row">
              <span className="metric-label">Competitiveness</span>
              <div className={`grade-badge grade-${metrics?.compGrade}`}>{metrics?.compGrade}</div>
            </div>
            <div className="metric-row">
              <span className="metric-label">Community Preservation</span>
              <div className={`grade-badge grade-${metrics?.commGrade}`}>{metrics?.commGrade}</div>
            </div>
          </div>

          <div className="gerry-card">
            <div className="gerry-card-title">
              <span className="material-icons-round">balance</span> Total Ethics Score
            </div>
            <div className="score-display">
              <div className="score-value" style={{ color: metrics?.ethicsScore >= 80 ? '#10b981' : metrics?.ethicsScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                {metrics?.ethicsScore}
              </div>
              <div className="score-max">/ 100</div>
            </div>
            <div className="progress-bar" style={{ marginTop: 12 }}>
              <div className="progress-fill" style={{ width: `${metrics?.ethicsScore}%`, background: metrics?.ethicsScore >= 80 ? '#10b981' : metrics?.ethicsScore >= 60 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>

        </div>

      </div>

      {/* Explanation Section */}
      <div className="container" style={{ marginTop: 40, paddingBottom: 40 }}>
        <div className="gerry-card animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>How to Understand This Map</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 16, color: 'var(--civic-blue)', marginBottom: 8 }}>The Grid & The Goal</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                Imagine this grid is a state. Each square represents a neighborhood (Red or Blue voters). The colored outlines (Yellow, Purple, Emerald, Orange) are the 4 congressional districts. <strong>The goal is to see how redrawing district lines determines who wins, even if no voters change their minds.</strong>
              </p>
              <h3 style={{ fontSize: 16, color: 'var(--civic-teal)', marginBottom: 8 }}>How to Play</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Use the <strong>Paint Districts</strong> tool on the left to draw your own map. Or, click the <strong>Presets</strong> to see gerrymandering in action:
                <br/><br/>
                • <strong>Pack Blue:</strong> Crams most Blue voters into one district. Blue wins that district easily, but Red wins the other three (3-1 Red).<br/>
                • <strong>Crack Blue:</strong> Splits Blue voters across all districts so they never form a majority anywhere (4-0 Red).
              </p>
            </div>
            
            <div>
              <h3 style={{ fontSize: 16, color: 'var(--civic-purple-light)', marginBottom: 8 }}>The Ethics Metrics</h3>
              <ul style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 20 }}>
                <li style={{ marginBottom: 8 }}><strong>Projected Result:</strong> Who wins the 4 seats based on the current map boundaries.</li>
                <li style={{ marginBottom: 8 }}><strong>Population Equality:</strong> Checks if all 4 districts have exactly 9 squares. If not, the grade drops.</li>
                <li style={{ marginBottom: 8 }}><strong>Contiguity:</strong> Checks if all squares in a district are physically connected (no floating islands).</li>
                <li style={{ marginBottom: 8 }}><strong>Partisan Fairness:</strong> Uses the "Efficiency Gap" formula. A low grade means the map is biased to waste one party's votes.</li>
                <li style={{ marginBottom: 8 }}><strong>Community Preservation:</strong> The white dots represent a cohesive Urban Community. If you draw a district line right through those dots, you dilute their voice and your grade drops!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
