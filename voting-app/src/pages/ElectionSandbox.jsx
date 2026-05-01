import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

export default function ElectionSandbox() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Simulation Builder');
  const [isLoading, setIsLoading] = useState(true);
  
  const [config, setConfig] = useState({
    votingMethod: 'First-Past-The-Post',
    districts: 24,
    candidates: 4,
    voterAge: '18+',
    termLimits: 'None',
    districtBias: false,
    participationRate: 72
  });
  
  const [results, setResults] = useState(null);

  useEffect(() => {
    // Inject Tailwind CDN and Custom Config
    const tailwindScript = document.createElement('script');
    tailwindScript.src = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
    tailwindScript.id = "tailwind-cdn";
    
    const configScript = document.createElement('script');
    configScript.id = "tailwind-config";
    configScript.innerHTML = `
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "surface-variant": "#2d3449",
              "error": "#ffb4ab",
              "on-surface-variant": "#c2c6d7",
              "primary": "#afc6ff",
              "outline-variant": "#424754",
              "inverse-surface": "#dae2fd",
              "outline": "#8c90a0",
              "surface": "#0b1326",
              "background": "#0b1326",
              "surface-bright": "#31394d",
              "on-secondary": "#003824",
              "surface-container-low": "#131b2e",
              "inverse-primary": "#0059c7",
              "inverse-on-surface": "#283044",
              "primary-container": "#528dff",
              "surface-container": "#171f33",
              "primary-fixed": "#d9e2ff",
              "tertiary": "#ffb95f",
              "on-background": "#dae2fd",
              "secondary-container": "#00a572",
              "on-surface": "#dae2fd",
              "surface-container-high": "#222a3d",
              "surface-container-highest": "#2d3449",
              "secondary-fixed-dim": "#4edea3",
              "secondary-fixed": "#6ffbbe",
              "on-primary": "#002d6d",
              "secondary": "#4edea3"
            },
            fontFamily: {
              "display-lg": ["Space Grotesk"],
              "label-md": ["Lexend"],
              "headline-lg": ["Space Grotesk"],
              "body-lg": ["Manrope"],
              "headline-md": ["Space Grotesk"],
              "label-sm": ["Lexend"],
              "body-md": ["Manrope"]
            }
          }
        }
      }
    `;

    document.head.appendChild(tailwindScript);
    document.head.appendChild(configScript);
    
    fetchConfig();

    return () => {
      // Cleanup to prevent polluting global scope (optional, but good practice)
      const cdn = document.getElementById('tailwind-cdn');
      const conf = document.getElementById('tailwind-config');
      if(cdn) cdn.remove();
      if(conf) conf.remove();
    };
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiFetch('/simulation/config');
      if (res.ok) {
        const data = await res.json();
        const serverConfig = data.data;
        setConfig({
          votingMethod: serverConfig.voting_method,
          districts: serverConfig.districts,
          candidates: serverConfig.candidates,
          voterAge: serverConfig.voter_age,
          termLimits: serverConfig.term_limits,
          districtBias: serverConfig.district_bias,
          participationRate: serverConfig.participation_rate
        });
        if (serverConfig.results) {
          setResults(serverConfig.results);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    setIsLoading(true);
    try {
      const payload = {
        voting_method: config.votingMethod,
        districts: config.districts,
        candidates: config.candidates,
        voter_age: config.voterAge,
        term_limits: config.termLimits,
        district_bias: config.districtBias,
        participation_rate: config.participationRate
      };
      
      const res = await apiFetch('/simulation/save', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        const serverConfig = data.data;
        if (serverConfig.results) {
          setResults(serverConfig.results);
        }
        setActiveTab('Results Lab');
      }
    } catch (err) {
      console.error("Error saving simulation", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setConfig({
      votingMethod: 'First-Past-The-Post',
      districts: 24,
      candidates: 4,
      voterAge: '18+',
      termLimits: 'None',
      districtBias: false,
      participationRate: 72
    });
  };

  if (isLoading && !results) {
    return <div className="flex h-screen items-center justify-center text-white" style={{background: '#0b1326'}}>Loading Simulator...</div>;
  }

  // Fallback defaults if backend results missing
  const activeResults = results || {
    projected_winner: 'Progressive Alliance',
    turnout: 72,
    fairness_score: 8.4,
    seat_delta: '+4% Lead',
    prog_seats: 162,
    cons_seats: 144,
    lib_seats: 81,
    oth_seats: 63,
    total_seats: 450
  };

  const methods = ['First-Past-The-Post', 'Ranked Choice Voting', 'Approval Voting', 'Proportional Representation'];

  return (
    <div className="dark bg-background text-on-background font-body-md min-h-screen relative" style={{ margin: 0, minHeight: 'max(884px, 100dvh)' }}>
      <style>{`
        .glass-card {
            background: rgba(45, 52, 73, 0.12);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
            border-color: rgba(175, 198, 255, 0.3);
            box-shadow: 0 0 20px rgba(175, 198, 255, 0.05);
        }
        .glow-primary {
            box-shadow: 0 0 12px rgba(82, 141, 255, 0.3);
        }
        .glow-primary:hover {
            box-shadow: 0 0 20px rgba(82, 141, 255, 0.5);
        }
        input[type="range"] {
            -webkit-appearance: none;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 999px;
            height: 6px;
        }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: #afc6ff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(175, 198, 255, 0.5);
        }
      `}</style>
      
      {/* Navigation Drawer */}
      <aside className="fixed left-0 top-0 h-screen z-40 bg-slate-950/90 backdrop-blur-2xl w-72 border-r border-white/10 hidden lg:flex flex-col">
        <div className="py-6 px-6 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/labs')}>
          <span className="material-icons-round text-blue-500">arrow_back</span>
          <span className="text-blue-400 font-bold font-display-lg font-medium text-sm">BACK TO LABS</span>
        </div>
        <div className="flex flex-col">
          <button 
            onClick={() => setActiveTab('Simulation Builder')}
            className={`flex items-center gap-4 px-6 py-4 font-display-lg font-medium text-sm hover:translate-x-1 duration-200 ${activeTab === 'Simulation Builder' ? 'bg-blue-500/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`}
          >
            <span className="material-icons-round">settings_input_component</span>
            Simulation Builder
          </button>
          <button 
            onClick={() => setActiveTab('Rules Config')}
            className={`flex items-center gap-4 px-6 py-4 font-display-lg font-medium text-sm hover:translate-x-1 duration-200 ${activeTab === 'Rules Config' ? 'bg-blue-500/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`}
          >
            <span className="material-icons-round">gavel</span>
            Rules Config
          </button>
          <button 
            onClick={() => setActiveTab('Results Lab')}
            className={`flex items-center gap-4 px-6 py-4 font-display-lg font-medium text-sm hover:translate-x-1 duration-200 ${activeTab === 'Results Lab' ? 'bg-blue-500/10 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`}
          >
            <span className="material-icons-round">analytics</span>
            Results Lab
          </button>
        </div>
      </aside>

      <main className="lg:pl-72 min-h-screen pt-8">
        <div className="max-w-7xl mx-auto p-8 space-y-6">
          {/* Hero Section */}
          <section className="relative rounded-xl overflow-hidden glass-card p-16 flex flex-col items-center text-center space-y-6 border border-white/10">
            <div className="absolute inset-0 z-0 opacity-20">
              <img className="w-full h-full object-cover" alt="Background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF1gU_Ho1xoW5pmT7D_zbxg1wpDyL216Le5veoWmK-rCEUKPkLWRo3faTQoc98ovh5WpF4-lfv5o5HE5nsSRbnfuvvq3qQ7R_ywpL5agSgsPAM5iO6jUt7N0P7jnmFq7tHsvNHZ7jkXc0Z_gR3rm99UihRUjozwzWUvMfOwGRQAbmUGHy6q67fojMSrI6tBLeCucCREwW2WehaqtW2UjwIZGOTb5GO_dm9_oXj4SJ4rygcyfnG90zyB8xVjLB-DOgRzm-wYD1uZt2m" />
            </div>
            <div className="relative z-10 max-w-3xl">
              <h1 className="font-display-lg text-4xl font-bold text-on-background mb-4">Build-Your-Own Election: Interactive Sandbox</h1>
              <p className="font-body-lg text-lg text-on-surface-variant">Build-Your-Own Election is an interactive sandbox where users create custom voting systems by setting constituencies, voter eligibility, term limits, and election rules, then run simulations to explore how those choices affect fairness, turnout, and outcomes.</p>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Configuration Panel (Only show in Builder) */}
            {activeTab === 'Simulation Builder' && (
              <div className="xl:col-span-12 space-y-6 max-w-2xl mx-auto w-full">
                <div className="glass-card rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-headline-md text-2xl font-semibold">Core Configuration</h2>
                    <span className="material-icons-round text-primary">tune</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <label className="font-label-md text-sm font-medium text-on-surface-variant">Voting Method</label>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {methods.map(method => (
                        <label key={method} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${config.votingMethod === method ? 'bg-surface-container-high border-white/10' : 'bg-surface-container border-white/5 hover:bg-surface-container-highest'}`}>
                          <input 
                            type="radio" 
                            name="voting_method" 
                            className="w-4 h-4 text-primary bg-surface-container border-outline focus:ring-primary" 
                            checked={config.votingMethod === method}
                            onChange={() => setConfig({...config, votingMethod: method})}
                          />
                          <span className="ml-3 font-label-sm text-xs font-semibold">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8 pt-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="font-label-md text-sm font-medium">Districts (1-50)</label>
                        <span className="text-primary font-label-md text-sm font-medium">{config.districts}</span>
                      </div>
                      <input 
                        className="w-full" max="50" min="1" type="range" 
                        value={config.districts} 
                        onChange={(e) => setConfig({...config, districts: parseInt(e.target.value)})}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="font-label-md text-sm font-medium block">Candidates per District</label>
                      <input 
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none" 
                        style={{ backgroundColor: '#171f33', borderColor: '#424754', color: '#dae2fd' }}
                        type="number" 
                        value={config.candidates}
                        onChange={(e) => setConfig({...config, candidates: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="font-label-md text-sm font-medium block">Voter Age</label>
                        <select 
                          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                          style={{ backgroundColor: '#171f33', borderColor: '#424754', color: '#dae2fd' }}
                          value={config.voterAge}
                          onChange={(e) => setConfig({...config, voterAge: e.target.value})}
                        >
                          <option>18+</option>
                          <option>16+</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="font-label-md text-sm font-medium block">Term Limits</label>
                        <select 
                          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                          style={{ backgroundColor: '#171f33', borderColor: '#424754', color: '#dae2fd' }}
                          value={config.termLimits}
                          onChange={(e) => setConfig({...config, termLimits: e.target.value})}
                        >
                          <option>None</option>
                          <option>2 Terms</option>
                          <option>4 Terms</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-white/5">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-xs font-semibold">District Bias Experiment</span>
                        <span className="text-[10px] text-outline">Enable district imbalance</span>
                      </div>
                      <button 
                        className={`w-10 h-5 rounded-full relative transition-colors ${config.districtBias ? 'bg-primary' : 'bg-outline-variant'}`}
                        onClick={() => setConfig({...config, districtBias: !config.districtBias})}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.districtBias ? 'left-6' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="font-label-md text-sm font-medium">Participation Rate</label>
                        <span className="text-secondary font-label-md text-sm font-medium">{config.participationRate}%</span>
                      </div>
                      <input 
                        className="w-full" max="100" min="0" type="range" 
                        value={config.participationRate}
                        onChange={(e) => setConfig({...config, participationRate: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="pt-6 grid grid-cols-1 gap-3">
                    <button onClick={handleRunSimulation} disabled={isLoading} className="font-label-md text-sm font-medium py-4 rounded-xl flex items-center justify-center gap-2 glow-primary active:scale-95 transition-all duration-150" style={{ backgroundColor: '#528dff', color: '#00275f' }}>
                      <span className="material-icons-round">play_arrow</span>
                      {isLoading ? 'Running...' : 'Run Simulation'}
                    </button>
                    <button onClick={handleReset} className="bg-white/5 text-outline hover:text-on-surface font-label-md text-sm font-medium py-3 rounded-xl border border-white/10 active:scale-95 transition-all duration-150">
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rules Config View */}
            {activeTab === 'Rules Config' && (
              <div className="xl:col-span-12 space-y-6 max-w-3xl mx-auto w-full">
                <div className="glass-card rounded-xl p-8 space-y-6">
                  <h2 className="font-headline-md text-2xl font-bold mb-6">Current Simulation Rules</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-surface-container p-4 rounded-lg border border-white/5">
                      <div className="text-xs text-outline mb-1">Voting Method</div>
                      <div className="text-lg font-semibold text-primary">{config.votingMethod}</div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg border border-white/5">
                      <div className="text-xs text-outline mb-1">Total Districts</div>
                      <div className="text-lg font-semibold text-primary">{config.districts}</div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg border border-white/5">
                      <div className="text-xs text-outline mb-1">Candidates per District</div>
                      <div className="text-lg font-semibold text-primary">{config.candidates}</div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg border border-white/5">
                      <div className="text-xs text-outline mb-1">Minimum Voter Age</div>
                      <div className="text-lg font-semibold text-primary">{config.voterAge}</div>
                    </div>
                    <div className="bg-surface-container p-4 rounded-lg border border-white/5">
                      <div className="text-xs text-outline mb-1">District Bias Experiment</div>
                      <div className="text-lg font-semibold text-primary">{config.districtBias ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  </div>
                  <div className="mt-8 p-4 bg-primary-container/20 border border-primary/30 rounded-lg">
                    <p className="text-sm text-on-surface-variant font-body-md">
                      These rules will be used to calculate the projected seat distribution and fairness metrics when you run the simulation. 
                      You can modify them at any time in the <strong>Simulation Builder</strong> tab.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Simulation Results Section */}
            {activeTab === 'Results Lab' && (
              <div className="xl:col-span-12 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card rounded-xl p-6 border-l-4 border-primary">
                    <p className="text-outline font-label-sm text-xs font-semibold uppercase tracking-wider mb-1">Projected Winner</p>
                    <h3 className="font-headline-md text-2xl font-semibold text-primary">{activeResults.projected_winner}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="material-icons-round text-sm">trending_up</span>
                      <span className="text-xs text-secondary-fixed-dim">{activeResults.seat_delta}</span>
                    </div>
                  </div>
                  <div className="glass-card rounded-xl p-6 border-l-4 border-secondary">
                    <p className="text-outline font-label-sm text-xs font-semibold uppercase tracking-wider mb-1">Simulated Turnout</p>
                    <h3 className="font-headline-md text-2xl font-semibold text-secondary">{activeResults.turnout}%</h3>
                    <div className="mt-2 h-1 w-full bg-surface-container rounded-full overflow-hidden" style={{ backgroundColor: '#171f33' }}>
                      <div className="h-full" style={{ width: `${activeResults.turnout}%`, backgroundColor: '#4edea3' }}></div>
                    </div>
                  </div>
                  <div className="glass-card rounded-xl p-6 border-l-4 border-tertiary">
                    <p className="text-outline font-label-sm text-xs font-semibold uppercase tracking-wider mb-1">Fairness Score</p>
                    <div className="flex items-end gap-2">
                      <h3 className="font-headline-md text-2xl font-semibold text-tertiary">{activeResults.fairness_score}</h3>
                      <span className="text-outline font-body-md text-base pb-1">/ 10</span>
                    </div>
                    <span className="mt-2 inline-block px-2 py-0.5 rounded bg-secondary-container/20 text-secondary text-[10px] font-bold">OPTIMAL REPRESENTATION</span>
                  </div>
                </div>

                {/* Data Viz Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-xl p-6 h-[340px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-headline-md text-lg font-semibold">Vote Share by Party</h4>
                      <span className="material-icons-round text-outline">bar_chart</span>
                    </div>
                    <div className="flex-grow flex items-end justify-around gap-2 px-4">
                      <div className="w-12 rounded-t-lg relative group" style={{ height: `${(activeResults.prog_seats / activeResults.total_seats) * 100}%`, backgroundColor: 'rgba(82, 141, 255, 0.4)' }}>
                        <div className="absolute -top-6 left-0 right-0 text-center text-xs font-label-md text-sm font-medium">{Math.round((activeResults.prog_seats / activeResults.total_seats) * 100)}%</div>
                        <div className="absolute bottom-0 w-full h-full rounded-t-lg opacity-80" style={{ backgroundColor: '#528dff' }}></div>
                      </div>
                      <div className="w-12 rounded-t-lg relative group" style={{ height: `${(activeResults.cons_seats / activeResults.total_seats) * 100}%`, backgroundColor: 'rgba(0, 165, 114, 0.4)' }}>
                        <div className="absolute -top-6 left-0 right-0 text-center text-xs font-label-md text-sm font-medium">{Math.round((activeResults.cons_seats / activeResults.total_seats) * 100)}%</div>
                        <div className="absolute bottom-0 w-full h-full rounded-t-lg opacity-80" style={{ backgroundColor: '#00a572' }}></div>
                      </div>
                      <div className="w-12 rounded-t-lg relative group" style={{ height: `${(activeResults.lib_seats / activeResults.total_seats) * 100}%`, backgroundColor: 'rgba(202, 129, 0, 0.4)' }}>
                        <div className="absolute -top-6 left-0 right-0 text-center text-xs font-label-md text-sm font-medium">{Math.round((activeResults.lib_seats / activeResults.total_seats) * 100)}%</div>
                        <div className="absolute bottom-0 w-full h-full rounded-t-lg opacity-80" style={{ backgroundColor: '#ca8100' }}></div>
                      </div>
                      <div className="w-12 rounded-t-lg relative group" style={{ height: `${(activeResults.oth_seats / activeResults.total_seats) * 100}%`, backgroundColor: '#2d3449' }}>
                        <div className="absolute -top-6 left-0 right-0 text-center text-xs font-label-md text-sm font-medium">{Math.round((activeResults.oth_seats / activeResults.total_seats) * 100)}%</div>
                      </div>
                    </div>
                    <div className="flex justify-around mt-4 text-[10px] text-outline font-label-md font-medium">
                      <span>PROG</span>
                      <span>CONS</span>
                      <span>LIB</span>
                      <span>OTH</span>
                    </div>
                  </div>
                  
                  <div className="glass-card rounded-xl p-6 h-[340px] flex flex-col items-center justify-center relative">
                    <div className="absolute top-4 left-4 w-full text-left">
                      <h4 className="font-headline-md text-lg font-semibold">Seat Distribution</h4>
                    </div>
                    <div className="w-48 h-48 rounded-full border-[16px] border-surface-container relative flex items-center justify-center" style={{ borderColor: '#171f33' }}>
                      <div className="absolute inset-0 rounded-full border-[16px] rotate-45" style={{ borderTopColor: '#afc6ff', borderRightColor: '#4edea3', borderBottomColor: '#ffb95f', borderLeftColor: '#424754' }}></div>
                      <div className="text-center">
                        <span className="block font-headline-md text-2xl font-semibold">{activeResults.total_seats}</span>
                        <span className="text-outline text-[10px]">TOTAL SEATS</span>
                      </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2 w-full px-8">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#afc6ff' }}></div>
                        <span className="text-on-surface-variant">Prog: {activeResults.prog_seats}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4edea3' }}></div>
                        <span className="text-on-surface-variant">Cons: {activeResults.cons_seats}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ffb95f' }}></div>
                        <span className="text-on-surface-variant">Lib: {activeResults.lib_seats}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#424754' }}></div>
                        <span className="text-on-surface-variant">Other: {activeResults.oth_seats}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
