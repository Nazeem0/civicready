import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const C = {
  A: { bg: '#3b82f6', label: 'Candidate A — Progressive' },
  B: { bg: '#10b981', label: 'Candidate B — Conservative' },
  C: { bg: '#f59e0b', label: 'Candidate C — Liberal' },
  D: { bg: '#8b5cf6', label: 'Candidate D — Independent' },
};

const s = {
  page: { minHeight:'100vh', background:'linear-gradient(135deg,#060e20 0%,#0b1326 60%,#0f1a30 100%)', color:'#dae2fd', fontFamily:"'Manrope',sans-serif", paddingTop:64 },
  sidebar: { position:'fixed', left:0, top:64, height:'calc(100vh - 64px)', width:220, background:'rgba(6,14,32,0.97)', borderRight:'1px solid rgba(255,255,255,0.07)', padding:'20px 0', zIndex:40 },
  glass: { background:'rgba(23,31,51,0.75)', backdropFilter:'blur(18px)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:14, padding:24 },
  label: { fontFamily:"'Lexend',sans-serif", fontSize:12, fontWeight:600, color:'#8c90a0', textTransform:'uppercase', letterSpacing:1, marginBottom:8, display:'block' },
  value: { fontFamily:"'Space Grotesk',sans-serif", fontSize:28, fontWeight:700, margin:0 },
  tag: (color) => ({ background:`${color}22`, border:`1px solid ${color}55`, color, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, fontFamily:"'Lexend',sans-serif" }),
  bar: (pct, color) => ({ height:10, width:`${pct}%`, background:color, borderRadius:6, transition:'width 0.7s ease' }),
  barBg: { height:10, background:'rgba(255,255,255,0.06)', borderRadius:6, overflow:'hidden', marginTop:6 },
  btn: (primary) => ({
    padding: primary ? '13px 28px' : '10px 20px',
    background: primary ? 'linear-gradient(135deg,#528dff,#0059c7)' : 'transparent',
    border: primary ? 'none' : '1px solid #424754',
    borderRadius:10, color: primary ? '#fff' : '#8c90a0',
    cursor:'pointer', fontSize:13, fontWeight:700,
    fontFamily:"'Lexend',sans-serif",
    display:'flex', alignItems:'center', gap:8,
    boxShadow: primary ? '0 0 24px rgba(82,141,255,0.3)' : 'none',
    transition:'all 0.2s',
  }),
  input: { width:'100%', background:'#0d1628', border:'1px solid #2a3246', borderRadius:8, padding:'10px 14px', color:'#dae2fd', fontSize:14, outline:'none', fontFamily:"'Manrope',sans-serif", boxSizing:'border-box' },
  infoBox: (color) => ({ background:`${color}11`, border:`1px solid ${color}33`, borderRadius:10, padding:'12px 16px', fontSize:13, color:'#c2c6d7', lineHeight:1.6, marginTop:12 }),
};

const Tip = ({ icon, title, body, color='#528dff' }) => (
  <div style={{ ...s.glass, marginBottom:16, borderLeft:`3px solid ${color}` }}>
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
      <span className="material-icons-round" style={{ color, fontSize:18 }}>{icon}</span>
      <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14, color:'#dae2fd' }}>{title}</span>
    </div>
    <p style={{ margin:0, fontSize:13, color:'#8c90a0', lineHeight:1.7 }}>{body}</p>
  </div>
);

const HeatMap = ({ title, subtitle, icon, iconColor, segments }) => {
  const squares = [];
  let filled = 0;
  for (const seg of segments) {
    const count = Math.round(seg.pct);
    for (let i = 0; i < count && filled < 100; i++, filled++) {
      squares.push({ color: seg.color, label: seg.label });
    }
  }
  while (squares.length < 100) squares.push({ color: 'rgba(255,255,255,0.04)', label: '' });
  return (
    <div style={{ background:'rgba(13,22,40,0.7)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'16px 18px', marginTop:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <span className="material-icons-round" style={{ color: iconColor||'#528dff', fontSize:16 }}>{icon||'grid_view'}</span>
        <span style={{ fontFamily:"'Lexend',sans-serif", fontSize:12, fontWeight:700, color:'#8c90a0', textTransform:'uppercase', letterSpacing:1 }}>{title}</span>
      </div>
      <p style={{ margin:'0 0 12px', fontSize:12, color:'#424754' }}>{subtitle}</p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
        {squares.map((sq, i) => (
          <div key={i} title={sq.label} style={{ width:18, height:18, borderRadius:4, background:sq.color, transition:'background 0.5s', flexShrink:0 }} />
        ))}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:10 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#8c90a0' }}>
            <div style={{ width:10, height:10, borderRadius:3, background:seg.color, flexShrink:0 }} />
            <span>{seg.label} ({Math.round(seg.pct)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ElectoralSimulator() {
  const [tab, setTab] = useState('builder');
  const [cfg, setCfg] = useState({ voter_population:100000, polarization_index:0.5, demographic_shift:'Neutral' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    api.get('/simulation/electoral/config').then(r => {
      // api.get returns json directly: {status, data: {...}}
      const d = r?.data;
      if (d) {
        setCfg({ voter_population: d.voter_population||100000, polarization_index: d.polarization_index||0.5, demographic_shift: d.demographic_shift||'Neutral' });
        const hasFptp = d.fptp_results?.winner;
        const hasApproval = d.approval_results?.winner;
        const hasPr = d.pr_results?.seats && Object.keys(d.pr_results.seats).length > 0;
        if (hasFptp) {
          setResults({
            fptp_results: d.fptp_results,
            rcv_results: d.rcv_results,
            approval_results: hasApproval ? d.approval_results : null,
            pr_results: hasPr ? d.pr_results : null,
          });
        }
      }
    }).catch(() => {});
  }, []);

  const run = async () => {
    setLoading(true);
    try {
      const r = await api.post('/simulation/electoral/save', cfg);
      // api.post returns json: {status, data: {...}}
      const d = r?.data;
      console.log('Simulation response data:', d);
      if (!d) throw new Error('No data returned from server');
      setResults({
        fptp_results: d.fptp_results,
        rcv_results: d.rcv_results,
        approval_results: d.approval_results,
        pr_results: d.pr_results,
      });
      setSaved(new Date().toLocaleTimeString());
      setTab('results');
    } catch(e) {
      console.error('Simulation error:', e);
      alert('Simulation failed: ' + (e.message || 'Unknown error'));
    } finally { setLoading(false); }
  };

  const polLabel = cfg.polarization_index < 0.3 ? 'Low — voters open to compromise' : cfg.polarization_index < 0.7 ? 'Moderate — clear party lines' : 'High — deeply divided electorate';
  const polColor = cfg.polarization_index < 0.3 ? '#4edea3' : cfg.polarization_index < 0.7 ? '#f59e0b' : '#ef4444';

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={{ padding:'0 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:8 }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#528dff', letterSpacing:2, fontFamily:"'Lexend',sans-serif" }}>ELECTORAL MODULE</span>
        </div>
        {[['builder','settings_input_component','Sim Builder'],['results','analytics','Results Lab']].map(([id,icon,lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'13px 18px', border:'none', cursor:'pointer', background: tab===id ? 'rgba(82,141,255,0.1)' : 'transparent', color: tab===id ? '#528dff' : '#8c90a0', borderLeft: tab===id ? '3px solid #528dff' : '3px solid transparent', fontSize:13, fontFamily:"'Lexend',sans-serif", fontWeight:500, transition:'all 0.2s' }}>
            <span className="material-icons-round" style={{ fontSize:17 }}>{icon}</span>{lbl}
          </button>
        ))}
        <Link to="/labs" style={{ display:'flex', alignItems:'center', gap:8, color:'#424754', textDecoration:'none', fontSize:12, fontFamily:"'Lexend',sans-serif", padding:'13px 18px', position:'absolute', bottom:20 }}>
          <span className="material-icons-round" style={{ fontSize:15 }}>arrow_back</span>Back to Labs
        </Link>
      </aside>

      <main style={{ marginLeft:220, padding:'32px 32px 60px' }}>
        {/* Back Button */}
        <Link to="/labs" style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#8c90a0', textDecoration:'none', fontSize:13, fontFamily:"'Lexend',sans-serif", fontWeight:600, marginBottom:20, padding:'8px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color='#528dff'; e.currentTarget.style.borderColor='#528dff44'; e.currentTarget.style.background='rgba(82,141,255,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.color='#8c90a0'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
        >
          <span className="material-icons-round" style={{ fontSize:18 }}>arrow_back</span>
          Back to Democracy Lab
        </Link>

        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <span className="material-icons-round" style={{ color:'#528dff', fontSize:30 }}>query_stats</span>
            <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:30, fontWeight:700, margin:0, textShadow:'0 0 20px rgba(82,141,255,0.35)' }}>Electoral Simulator</h1>
            <span style={s.tag('#528dff')}>POPULAR</span>
          </div>
          <p style={{ color:'#8c90a0', margin:0, fontSize:14 }}>Compare all 4 major voting systems — FPTP, RCV, Approval Voting, and Proportional Representation — across synthetic voter populations.</p>
          {saved && <p style={{ color:'#4edea3', fontSize:12, marginTop:6 }}>✓ Auto-saved to your profile at {saved}</p>}
        </div>

        {/* Builder Tab */}
        {tab === 'builder' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }}>
            {/* Left: Controls */}
            <div style={s.glass}>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, fontWeight:600, marginTop:0, marginBottom:24, color:'#dae2fd' }}>Configure Your Election</h2>

              {/* Voter Population */}
              <div style={{ marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <label style={s.label}>Voter Population</label>
                  <span style={{ color:'#528dff', fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700 }}>{cfg.voter_population.toLocaleString()}</span>
                </div>
                <input type="range" min={10000} max={1000000} step={10000} value={cfg.voter_population}
                  onChange={e => setCfg({...cfg, voter_population: +e.target.value})}
                  style={{ width:'100%', accentColor:'#528dff' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#424754', marginTop:4 }}><span>10K</span><span>1M</span></div>
                <div style={s.infoBox('#528dff')}>The total number of synthetic voters in this simulation. A larger population reduces the impact of random variation in results.</div>
              </div>

              {/* Polarization */}
              <div style={{ marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <label style={s.label}>Polarization Index</label>
                  <span style={{ color:polColor, fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700 }}>{cfg.polarization_index.toFixed(2)}</span>
                </div>
                <input type="range" min={0} max={1} step={0.01} value={cfg.polarization_index}
                  onChange={e => setCfg({...cfg, polarization_index: +e.target.value})}
                  style={{ width:'100%', accentColor: polColor }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#424754', marginTop:4 }}><span>Low (Unity)</span><span>High (Divided)</span></div>
                <div style={{ ...s.infoBox(polColor), display:'flex', alignItems:'center', gap:8 }}>
                  <span className="material-icons-round" style={{ color:polColor, fontSize:16 }}>{cfg.polarization_index < 0.3 ? 'sentiment_satisfied' : cfg.polarization_index < 0.7 ? 'sentiment_neutral' : 'warning'}</span>
                  <span><strong>{polLabel}.</strong> High polarization squeezes minor parties (C & D) out of the race, making FPTP and RCV results converge on the same winner.</span>
                </div>
              </div>

              {/* Demographic Shift */}
              <div style={{ marginBottom:28 }}>
                <label style={s.label}>Demographic Shift</label>
                <div style={{ display:'flex', gap:8 }}>
                  {['Neutral','Youth Surge','Aging Population'].map(d => (
                    <button key={d} onClick={() => setCfg({...cfg, demographic_shift:d})} style={{ flex:1, padding:'9px 6px', borderRadius:8, border:'1px solid', cursor:'pointer', fontSize:11, fontFamily:"'Lexend',sans-serif", fontWeight:600, background: cfg.demographic_shift===d ? 'rgba(82,141,255,0.2)' : 'transparent', borderColor: cfg.demographic_shift===d ? '#528dff' : '#2a3246', color: cfg.demographic_shift===d ? '#afc6ff' : '#8c90a0', transition:'all 0.2s' }}>
                      {d}
                    </button>
                  ))}
                </div>
                <div style={s.infoBox('#8b5cf6')}>
                  {cfg.demographic_shift === 'Neutral' && 'Standard voter distribution — no particular age group dominates.'}
                  {cfg.demographic_shift === 'Youth Surge' && 'Younger voters turn out in higher numbers, boosting progressive Candidate A by ~8 points.'}
                  {cfg.demographic_shift === 'Aging Population' && 'Older voter turnout rises, shifting the electorate toward conservative Candidate B by ~10 points.'}
                </div>
              </div>

              <button onClick={run} disabled={loading} style={{ ...s.btn(true), width:'100%', justifyContent:'center', opacity: loading ? 0.7 : 1 }}>
                <span className="material-icons-round" style={{ fontSize:18 }}>{loading ? 'hourglass_top' : 'play_arrow'}</span>
                {loading ? 'Running...' : 'Run Simulation & Save'}
              </button>
            </div>

            {/* Right: Explainer */}
            <div>
              <Tip icon="help_outline" color="#528dff" title="What is this simulator?"
                body="This tool lets you build a synthetic election with up to 1 million voters and see how the choice of voting system changes the outcome. Adjust the sliders and pick a demographic scenario, then hit Run." />
              <Tip icon="how_to_vote" color="#3b82f6" title="First-Past-The-Post (FPTP)"
                body="The candidate with the most votes wins — even with less than 50% of the vote. Simple but can lead to 'wasted votes' where minority party voters have no impact on the outcome." />
              <Tip icon="ballot" color="#10b981" title="Ranked Choice Voting (RCV)"
                body="Voters rank candidates in order. If no one gets 50%, the lowest-ranked candidate is eliminated and their votes are redistributed. This continues until a majority winner emerges — typically more representative." />
              <Tip icon="done_all" color="#f59e0b" title="Approval Voting"
                body="Voters approve as many candidates as they like. The candidate approved by the most voters wins. Minor parties gain because supporters of C or D can also approve A or B without 'wasting' their vote." />
              <Tip icon="pie_chart" color="#8b5cf6" title="Proportional Representation (PR)"
                body="Seats in parliament are distributed proportional to each party's vote share. Smaller parties get real representation. Rarely produces a single-party majority — coalition governments are common." />
              <div style={{ ...s.glass, marginTop:0 }}>
                <p style={s.label}>Candidates in this election</p>
                {Object.entries(C).map(([k,v]) => (
                  <div key={k} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:v.bg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:13, flexShrink:0 }}>{k}</div>
                    <span style={{ fontSize:13, color:'#c2c6d7' }}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {tab === 'results' && results && (
          <div>
            {/* 4-System Winner Summary Banner */}
            <div style={{ ...s.glass, marginBottom:24, background:'rgba(13,22,40,0.9)' }}>
              <p style={{ ...s.label, marginBottom:16 }}>Winner Comparison — All 4 Systems</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[
                  { label:'FPTP', color:'#3b82f6', winner: results.fptp_results?.winner, icon:'how_to_vote' },
                  { label:'RCV', color:'#10b981', winner: results.rcv_results?.winner, icon:'ballot' },
                  { label:'Approval', color:'#f59e0b', winner: results.approval_results?.winner, icon:'done_all' },
                  { label:'PR', color:'#8b5cf6', winner: results.pr_results?.winner, icon:'pie_chart' },
                ].map(sys => (
                  <div key={sys.label} style={{ background:`${sys.color}12`, border:`1px solid ${sys.color}33`, borderRadius:10, padding:'14px 12px', textAlign:'center' }}>
                    <span className="material-icons-round" style={{ color:sys.color, fontSize:20, display:'block', marginBottom:6 }}>{sys.icon}</span>
                    <div style={{ fontSize:10, fontWeight:700, color:sys.color, fontFamily:"'Lexend',sans-serif", letterSpacing:1, marginBottom:6 }}>{sys.label}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#dae2fd', fontFamily:"'Space Grotesk',sans-serif" }}>{sys.winner || '—'}</div>
                  </div>
                ))}
              </div>
              {/* Check if any system disagrees */}
              {(() => {
                const winners = [results.fptp_results?.winner, results.rcv_results?.winner, results.approval_results?.winner, results.pr_results?.winner].filter(Boolean);
                const unique = [...new Set(winners)];
                return unique.length > 1 ? (
                  <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, fontSize:13, color:'#fca5a5' }}>
                    ⚡ <strong>Different systems elected different winners!</strong> The voting method changed the outcome — showing how the same population of voters can produce different governments.
                  </div>
                ) : (
                  <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(78,222,163,0.08)', border:'1px solid rgba(78,222,163,0.2)', borderRadius:8, fontSize:13, color:'#4edea3' }}>
                    ✓ <strong>All systems agree:</strong> {unique[0]} wins regardless of voting method used. This typically happens with highly polarized electorates or a dominant candidate.
                  </div>
                );
              })()}
            </div>

            {/* FPTP vs RCV cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
              {/* FPTP */}
              <div style={{ ...s.glass, borderTop:'3px solid #3b82f6' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <span style={s.tag('#3b82f6')}>FIRST-PAST-THE-POST</span>
                </div>
                <p style={{ ...s.value, color:'#3b82f6', marginBottom:4 }}>🏆 {results.fptp_results.winner}</p>
                <p style={{ color:'#8c90a0', fontSize:13, marginBottom:20 }}>Wins by plurality of first-choice votes</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                  {[['Win Margin', results.fptp_results.margin,'#dae2fd'],['Wasted Votes', (results.fptp_results.wasted_votes||0).toLocaleString(),'#ef4444']].map(([lbl,val,col]) => (
                    <div key={lbl} style={{ background:'rgba(13,22,40,0.8)', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:11, color:'#8c90a0', marginBottom:4 }}>{lbl}</div>
                      <div style={{ fontSize:18, fontWeight:700, color:col, fontFamily:"'Space Grotesk',sans-serif" }}>{val}</div>
                    </div>
                  ))}
                </div>
                {Object.entries(results.fptp_results.party_breakdown||{}).map(([k,pct]) => (
                  <div key={k} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:2 }}>
                      <span style={{ color:'#c2c6d7' }}>Candidate {k}</span>
                      <span style={{ color: C[k]?.bg||'#fff', fontWeight:700 }}>{pct}%</span>
                    </div>
                    <div style={s.barBg}><div style={s.bar(pct, C[k]?.bg||'#528dff')} /></div>
                  </div>
                ))}
                <div style={s.infoBox('#ef4444')}>
                  <strong>Wasted votes</strong> = votes cast for losing candidates that had no effect on the outcome. Under FPTP this can be very high.
                </div>
                <HeatMap
                  title="Vote Distribution Heatmap"
                  subtitle="Each square = ~1% of voters. Colors show who each voter supported."
                  icon="grid_view" iconColor="#ef4444"
                  segments={Object.entries(results.fptp_results.party_breakdown||{}).map(([k,pct]) => ({ color: C[k]?.bg||'#528dff', pct, label:`Candidate ${k}` }))}
                />
              </div>

              {/* RCV */}
              <div style={{ ...s.glass, borderTop:'3px solid #10b981' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <span style={s.tag('#10b981')}>RANKED CHOICE VOTING</span>
                </div>
                <p style={{ ...s.value, color:'#10b981', marginBottom:4 }}>🏆 {results.rcv_results.winner}</p>
                <p style={{ color:'#8c90a0', fontSize:13, marginBottom:20 }}>Wins by majority after {results.rcv_results.rounds} elimination rounds</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                  {[['Rounds Needed', results.rcv_results.rounds,'#dae2fd'],['Consensus Score', `${results.rcv_results.consensus_score}%`,'#4edea3']].map(([lbl,val,col]) => (
                    <div key={lbl} style={{ background:'rgba(13,22,40,0.8)', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:11, color:'#8c90a0', marginBottom:4 }}>{lbl}</div>
                      <div style={{ fontSize:18, fontWeight:700, color:col, fontFamily:"'Space Grotesk',sans-serif" }}>{val}</div>
                    </div>
                  ))}
                </div>
                {Object.entries(results.rcv_results.party_breakdown||{}).map(([k,pct]) => (
                  <div key={k} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:2 }}>
                      <span style={{ color:'#c2c6d7' }}>Candidate {k} (final)</span>
                      <span style={{ color:'#10b981', fontWeight:700 }}>{pct}%</span>
                    </div>
                    <div style={s.barBg}><div style={s.bar(pct,'#10b981')} /></div>
                  </div>
                ))}
              <div style={s.infoBox('#4edea3')}>
                  <strong>Consensus score</strong> = how close to 50/50 the final round is. Higher = the winner is broadly acceptable to more voters.
                </div>
                <HeatMap
                  title="Final Round Heatmap"
                  subtitle="Each square = ~1% of voters after redistribution. Shows who won each transferred vote."
                  icon="grid_view" iconColor="#10b981"
                  segments={Object.entries(results.rcv_results.party_breakdown||{}).map(([k,pct]) => ({ color: C[k]?.bg||'#10b981', pct, label:`Candidate ${k} (final)` }))}
                />
              </div>
            </div>

            {/* Approval Voting + PR cards — always visible */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>

              {/* Approval Voting */}
              <div style={{ ...s.glass, borderTop:'3px solid #f59e0b' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <span style={s.tag('#f59e0b')}>APPROVAL VOTING</span>
                </div>
                {results.approval_results?.winner ? (
                  <>
                    <p style={{ ...s.value, color:'#f59e0b', marginBottom:4 }}>🏆 {results.approval_results.winner}</p>
                    <p style={{ color:'#8c90a0', fontSize:13, marginBottom:20 }}>Winner by total approval count across all voters</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                      <div style={{ background:'rgba(13,22,40,0.8)', borderRadius:10, padding:'12px 14px' }}>
                        <div style={{ fontSize:11, color:'#8c90a0', marginBottom:4 }}>Minor Party Boost</div>
                        <div style={{ fontSize:18, fontWeight:700, color:'#4edea3', fontFamily:"'Space Grotesk',sans-serif" }}>{results.approval_results.minor_party_boost}</div>
                      </div>
                      <div style={{ background:'rgba(13,22,40,0.8)', borderRadius:10, padding:'12px 14px' }}>
                        <div style={{ fontSize:11, color:'#8c90a0', marginBottom:4 }}>Voting Method</div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#dae2fd', fontFamily:"'Space Grotesk',sans-serif" }}>Multi-approve</div>
                      </div>
                    </div>
                    {Object.entries(results.approval_results.approval_scores||{}).map(([k,score]) => (
                      <div key={k} style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:2 }}>
                          <span style={{ color:'#c2c6d7' }}>Candidate {k}</span>
                          <span style={{ color: C[k]?.bg||'#f59e0b', fontWeight:700 }}>{score}% approvals</span>
                        </div>
                        <div style={s.barBg}><div style={s.bar(Math.min(score,100), C[k]?.bg||'#f59e0b')} /></div>
                      </div>
                    ))}
                    <div style={s.infoBox('#f59e0b')}>
                      <strong>Approval Voting</strong>: Voters tick every candidate they find acceptable. Winner = most approvals. Minor parties gain because C/D supporters can also approve A or B without "wasting" their vote.
                    </div>
                    <HeatMap
                      title="Approval Score Heatmap"
                      subtitle="Each square = ~1% of voters. Shows total approval support per candidate."
                      icon="done_all" iconColor="#f59e0b"
                      segments={Object.entries(results.approval_results.approval_scores||{}).map(([k,score]) => {
                        const total = Object.values(results.approval_results.approval_scores).reduce((a,b)=>a+b,0);
                        return { color: C[k]?.bg||'#f59e0b', pct: Math.round((score/total)*100), label:`Candidate ${k}` };
                      })}
                    />
                  </>
                ) : (
                  <div style={{ textAlign:'center', padding:'30px 0', color:'#424754' }}>
                    <span className="material-icons-round" style={{ fontSize:36, display:'block', marginBottom:8 }}>done_all</span>
                    <p style={{ margin:0, fontSize:13 }}>Run a simulation to see Approval Voting results</p>
                  </div>
                )}
              </div>

              {/* Proportional Representation */}
              <div style={{ ...s.glass, borderTop:'3px solid #8b5cf6' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                  <span style={s.tag('#8b5cf6')}>PROPORTIONAL REPRESENTATION</span>
                </div>
                {results.pr_results?.seats ? (
                  <>
                    <p style={{ ...s.value, color: results.pr_results.coalition_needed ? '#f59e0b' : '#8b5cf6', marginBottom:4 }}>
                      {results.pr_results.coalition_needed ? '🤝' : '🏆'} {results.pr_results.winner}
                    </p>
                    <p style={{ color:'#8c90a0', fontSize:13, marginBottom:20 }}>
                      {results.pr_results.coalition_needed ? 'No majority — coalition government required' : 'Outright majority — governs alone'}
                    </p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                      <div style={{ background:'rgba(13,22,40,0.8)', borderRadius:10, padding:'12px 14px' }}>
                        <div style={{ fontSize:11, color:'#8c90a0', marginBottom:4 }}>Total Seats</div>
                        <div style={{ fontSize:18, fontWeight:700, color:'#dae2fd', fontFamily:"'Space Grotesk',sans-serif" }}>{results.pr_results.total_seats}</div>
                      </div>
                      <div style={{ background:'rgba(13,22,40,0.8)', borderRadius:10, padding:'12px 14px' }}>
                        <div style={{ fontSize:11, color:'#8c90a0', marginBottom:4 }}>Coalition Needed?</div>
                        <div style={{ fontSize:18, fontWeight:700, color: results.pr_results.coalition_needed ? '#f59e0b' : '#4edea3', fontFamily:"'Space Grotesk',sans-serif" }}>
                          {results.pr_results.coalition_needed ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                    {Object.entries(results.pr_results.seats||{}).map(([k,seats]) => (
                      <div key={k} style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:2 }}>
                          <span style={{ color:'#c2c6d7' }}>Candidate {k}</span>
                          <span style={{ color: C[k]?.bg||'#8b5cf6', fontWeight:700 }}>{seats} / {results.pr_results.total_seats} seats</span>
                        </div>
                        <div style={s.barBg}><div style={s.bar(seats, C[k]?.bg||'#8b5cf6')} /></div>
                      </div>
                    ))}
                    <div style={s.infoBox(results.pr_results.coalition_needed ? '#f59e0b' : '#8b5cf6')}>
                      {results.pr_results.coalition_needed
                        ? <><strong>Coalition required.</strong> No party holds 51+ seats — parties must negotiate to form a governing majority. Common in PR systems.</>
                        : <><strong>Outright majority.</strong> {results.pr_results.winner} holds 51+ seats and can pass laws without coalition partners.</>
                      }
                    </div>
                    <HeatMap
                      title="Seat Allocation Heatmap"
                      subtitle="Each square = 1 parliamentary seat (out of 100). Colored by which party holds it."
                      icon="pie_chart" iconColor="#8b5cf6"
                      segments={Object.entries(results.pr_results.seats||{}).map(([k,seats]) => ({ color: C[k]?.bg||'#8b5cf6', pct: seats, label:`Candidate ${k}` }))}
                    />
                  </>
                ) : (
                  <div style={{ textAlign:'center', padding:'30px 0', color:'#424754' }}>
                    <span className="material-icons-round" style={{ fontSize:36, display:'block', marginBottom:8 }}>pie_chart</span>
                    <p style={{ margin:0, fontSize:13 }}>Run a simulation to see PR results</p>
                  </div>
                )}
              </div>
            </div>




            <button onClick={() => setTab('builder')} style={s.btn(false)}>
              <span className="material-icons-round" style={{ fontSize:16 }}>tune</span>
              Adjust Parameters
            </button>
          </div>
        )}

        {tab === 'results' && !results && (
          <div style={{ ...s.glass, textAlign:'center', padding:'60px 24px' }}>
            <span className="material-icons-round" style={{ fontSize:48, color:'#2a3246', display:'block', marginBottom:16 }}>analytics</span>
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", color:'#8c90a0', margin:'0 0 8px' }}>No Results Yet</h3>
            <p style={{ color:'#424754', fontSize:14, marginBottom:24 }}>Run a simulation from the Builder tab first.</p>
            <button onClick={() => setTab('builder')} style={s.btn(true)}>Go to Builder</button>
          </div>
        )}
      </main>
    </div>
  );
}
