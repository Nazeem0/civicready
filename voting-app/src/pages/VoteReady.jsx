import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import './VoteReady.css';

const steps = [
  { id: 1, icon: 'person', title: 'Personal Info', desc: 'Name, DOB, SSN last 4' },
  { id: 2, icon: 'home', title: 'Address', desc: 'Current residence' },
  { id: 3, icon: 'badge', title: 'ID Verification', desc: 'Scan or enter manually' },
  { id: 4, icon: 'check_circle', title: 'Confirmed', desc: 'Review & submit' },
];

export default function VoteReady() {
  const [activeStep, setActiveStep] = useState(1);
  const [scanned, setScanned] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    dob: '',
    zip_code: '',
    state: '',
    street_address: '',
    city: '',
    unit: '',
    age: '',
    email: '',
    phone_number: '',
    father_name: '',
    mother_name: '',
    gender: '',
    occupation: ''
  });


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const [authRes, profileRes] = await Promise.all([
          apiFetch('/auth/me'),
          apiFetch('/voter/profile')
        ]);
        
        if (authRes.ok) {
          const data = await authRes.json();
          if (data.data) {
            setForm(prev => ({
              ...prev,
              email: data.data.email || '',
              full_name: prev.full_name || data.data.full_name || '',
              phone_number: data.data.phone_number || ''
            }));
          }
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.data && profileData.data.registration_status === 'active') {
            setAlreadyRegistered(true);
            setResults({
              eligible: true,
              registration_status: 'active',
              polling_location: profileData.data.polling_location || 'Pending Assignment',
              issues: []
            });
            setActiveStep(5);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user context", err);
      }
    };
    fetchUser();
  }, []);

  const handleNextStep1 = () => {
    setError('');
    const required = ['full_name', 'dob', 'zip_code', 'state', 'age', 'email', 'phone_number', 'father_name', 'mother_name', 'gender', 'occupation'];
    const missing = required.filter(f => !form[f]);
    if (missing.length > 0) {
      setError('Please fill out all required personal information fields.');
      return;
    }
    setActiveStep(2);
  };

  const handleNextStep2 = () => {
    setError('');
    if (!form.street_address || !form.city) {
      setError('Please provide your street address and city.');
      return;
    }
    setActiveStep(3);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setIdFile(e.target.files[0]);
      setScanned(false);
      setOcrResults(null);
    }
  };

  const handleStartScan = async () => {
    if (!idFile) {
      setError('Please select an image file to upload.');
      return;
    }
    setError('');
    setIsScanning(true);
    setScanStatus('Uploading and extracting details via ML OCR...');
    
    try {
      const formData = new FormData();
      formData.append('file', idFile);
      formData.append('full_name', form.full_name);
      formData.append('dob', form.dob);

      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:5000/api/voter/verify-aadhar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      
      if (res.ok && data.data?.verified) {
        setOcrResults(data.data);
        setScanStatus('Identity Verified');
        setScanned(true);
      } else {
        setError(data.message || 'Failed to verify Aadhar card. Please ensure the image is clear.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error during ML verification.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleNextStep3 = () => {
    if (!scanned) {
      setError('Please complete the ID verification scan.');
      return;
    }
    setActiveStep(4);
  };

  const handleSubmit = async () => {
    setError('');
    if (!scanned) {
      setError('Please complete the ID verification scan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/voter/check-eligibility', {
        method: 'POST',
        body: JSON.stringify({
          full_name: form.full_name,
          dob: form.dob,
          zip_code: form.zip_code,
          state: form.state,
          street_address: form.street_address,
          city: form.city,
          age: parseInt(form.age, 10),
          email: form.email,
          phone_number: form.phone_number,
          father_name: form.father_name,
          mother_name: form.mother_name,
          gender: form.gender,
          occupation: form.occupation
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResults(data.data);
        setActiveStep(5);
      } else {
        let errMsg = data.message || 'Failed to submit eligibility check. Please try again.';
        if (data.errors) {
          const fieldErrors = Object.entries(data.errors)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join(' | ');
          errMsg += ` (${fieldErrors})`;
        }
        setError(errMsg.toUpperCase());
      }
    } catch (err) {
      console.error(err);
      setError(`Network Error: ${err.message}. (Is your backend running?)`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="voteready-page">
      <div className="vr-hero">
        <div className="vr-hero-glow" />
        <div className="container">
          <div className="badge badge-blue" style={{ marginBottom: 16 }}>
            <span className="material-icons-round" style={{ fontSize: 12 }}>security</span>
            Secure · Encrypted · Private
          </div>
          <h1>VoteReady<span className="gradient-text"> Registration Process</span></h1>
          <p>Determine your voting status in minutes with our secure, AI-assisted tools.</p>
        </div>
      </div>

      <div className="container vr-body">
        {/* Steps */}
        <div className="steps-bar card">
          {steps.map((s, i) => (
            <button
              key={s.id}
              className={`step-item ${activeStep === s.id ? 'active' : ''} ${activeStep > s.id ? 'done' : ''}`}
              onClick={() => {
                // Prevent jumping ahead if previous steps aren't complete
                if (s.id < activeStep) setActiveStep(s.id);
              }}
            >
              <div className="step-circle">
                {activeStep > s.id
                  ? <span className="material-icons-round">check</span>
                  : <span className="material-icons-round">{s.icon}</span>
                }
              </div>
              <div className="step-info">
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
              {i < steps.length - 1 && <div className="step-connector" />}
            </button>
          ))}
        </div>

        <div className="vr-columns">
          {/* Main Form */}
          <div className="vr-main">
            {error && (
              <div className="badge badge-red" style={{ marginBottom: 16, width: '100%', justifyContent: 'center', padding: '12px' }}>
                <span className="material-icons-round" style={{ fontSize: 16 }}>error_outline</span>
                {error}
              </div>
            )}

            {alreadyRegistered && activeStep !== 5 && (
              <div className="badge badge-blue" style={{ marginBottom: 16, width: '100%', justifyContent: 'center', padding: '12px' }}>
                <span className="material-icons-round" style={{ fontSize: 16 }}>info</span>
                You are already registered to vote. You do not need to submit this form again.
              </div>
            )}

            {activeStep === 1 && !alreadyRegistered && (
              <div className="card form-card animate-fade-up">
                <h3>Personal Information</h3>
                <p className="form-subtitle">All information is encrypted end-to-end and never stored unencrypted.</p>
                <div className="form-grid">
                  <div className="form-field full-span">
                    <label>Full Legal Name</label>
                    <input placeholder="Jane Doe" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Email Address</label>
                    <input type="email" placeholder="jane@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="(555) 555-5555" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Date of Birth</label>
                    <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Age</label>
                    <input type="number" min="18" max="120" placeholder="18" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Father's Name</label>
                    <input placeholder="John Doe Sr." value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Mother's Name</label>
                    <input placeholder="Mary Doe" value={form.mother_name} onChange={e => setForm({ ...form, mother_name: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select gender…</option>
                      {['Male', 'Female', 'Other', 'Prefer not to say'].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Occupation</label>
                    <input placeholder="Software Engineer" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>ZIP Code</label>
                    <input placeholder="90210" value={form.zip_code} onChange={e => setForm({ ...form, zip_code: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>State</label>
                    <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
                      <option value="">Select state…</option>
                      {[
                        'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
                        'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand',
                        'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
                        'Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
                        'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
                        'Uttar Pradesh','Uttarakhand','West Bengal',
                        '— Union Territories —',
                        'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
                        'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry'
                      ].map(s => (
                        <option key={s} disabled={s.startsWith('—')}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary full-width" onClick={handleNextStep1}>
                  Continue <span className="material-icons-round">arrow_forward</span>
                </button>
              </div>
            )}

            {activeStep === 2 && (
              <div className="card form-card animate-fade-up">
                <h3>Residential Address</h3>
                <p className="form-subtitle">Used to assign your polling location and verify registration.</p>
                <div className="form-grid">
                  <div className="form-field full-span">
                    <label>Street Address</label>
                    <input placeholder="123 Democracy Drive" value={form.street_address} onChange={e => setForm({ ...form, street_address: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>City</label>
                    <input placeholder="Springfield" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Unit / Apt</label>
                    <input placeholder="Optional" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn btn-ghost" onClick={() => { setError(''); setActiveStep(1); }}>← Back</button>
                  <button className="btn btn-primary" onClick={handleNextStep2}>
                    Continue <span className="material-icons-round">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {activeStep === 3 && !alreadyRegistered && (
              <div className="card form-card animate-fade-up">
                <h3>Upload ID Document</h3>
                <p className="form-subtitle">Upload a copy of your Aadhar card or valid government ID as proof of identity.</p>
                <div className="scan-zone-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <input type="file" accept="image/*" id="aadhar-upload" onChange={handleFileChange} style={{ display: 'none' }} />
                  <label htmlFor="aadhar-upload" className={`scan-zone ${scanned ? 'scanned' : ''} ${isScanning ? 'scanning' : ''}`} style={{ cursor: 'pointer' }}>
                    {scanned ? (
                      <>
                        <span className="material-icons-round scan-ok">check_circle</span>
                        <p>Document Uploaded Successfully</p>
                        <span className="badge badge-green">Saved as Proof</span>
                      </>
                    ) : isScanning ? (
                      <>
                        <div className="scan-loader" style={{ marginBottom: 12 }}><span className="material-icons-round rotate-anim" style={{ color: 'var(--civic-blue)', fontSize: 32 }}>autorenew</span></div>
                        <p style={{ color: 'var(--civic-blue)' }}>Uploading Document...</p>
                      </>
                    ) : (
                      <>
                        <span className="material-icons-round scan-icon">upload_file</span>
                        <p>{idFile ? idFile.name : 'Click to select your ID image'}</p>
                        <span className="badge badge-blue">Select Image</span>
                      </>
                    )}
                  </label>
                  {!scanned && idFile && (
                    <button className="btn btn-outline" onClick={handleStartScan} disabled={isScanning} style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="material-icons-round">cloud_upload</span> Upload Document
                    </button>
                  )}
                </div>
                <div className="form-actions">
                  <button className="btn btn-ghost" onClick={() => { setError(''); setActiveStep(2); }}>← Back</button>
                  <button className="btn btn-primary" onClick={handleNextStep3} disabled={!scanned}>
                    Continue to Review <span className="material-icons-round">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {activeStep === 4 && !alreadyRegistered && (
              <div className="card form-card animate-fade-up">
                <h3>Review Application</h3>
                <p className="form-subtitle">Please double check all the details below before submitting your registration to the government.</p>
                
                <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'var(--bg-card-hover)', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                  <div><strong style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Full Name</strong> {form.full_name}</div>
                  <div><strong style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Date of Birth</strong> {form.dob} ({form.age} yrs)</div>
                  <div><strong style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Email</strong> {form.email}</div>
                  <div><strong style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Phone</strong> {form.phone_number}</div>
                  <div><strong style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Father's Name</strong> {form.father_name}</div>
                  <div><strong style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Mother's Name</strong> {form.mother_name}</div>
                  <div><strong style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Gender</strong> {form.gender}</div>
                  <div><strong style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Occupation</strong> {form.occupation}</div>
                  <div style={{ gridColumn: 'span 2' }}><strong style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Address</strong> {form.street_address} {form.unit ? `Apt ${form.unit}` : ''}, {form.city}, {form.state} {form.zip_code}</div>
                </div>

                <div className="form-actions">
                  <button className="btn btn-ghost" onClick={() => { setError(''); setActiveStep(3); }}>← Edit Info</button>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Registration'} <span className="material-icons-round">cloud_upload</span>
                  </button>
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="card form-card animate-fade-up confirmed-card">
                <div className="confirmed-icon">
                  <span className="material-icons-round">verified</span>
                </div>
                <h3>{results?.eligible ? "You're Confirmed!" : "Attention Required"}</h3>
                <p className="form-subtitle">
                  {results?.eligible 
                    ? "Your voter eligibility has been verified. You're ready to vote!"
                    : "We found some issues with your eligibility. Please check the details below."}
                </p>
                
                <div className="status-list" style={{ marginTop: 24, marginBottom: 24 }}>
                  <div className="status-row">
                    <div className="status-row-left">
                      <span className="material-icons-round" style={{ color: 'var(--text-secondary)' }}>how_to_vote</span>
                      <span>Registration Status</span>
                    </div>
                    <span className={`badge badge-${results?.registration_status === 'active' ? 'green' : 'amber'}`}>
                      {results?.registration_status === 'active' ? 'Active' : 'Incomplete'}
                    </span>
                  </div>
                  <div className="status-row">
                    <div className="status-row-left">
                      <span className="material-icons-round" style={{ color: 'var(--text-secondary)' }}>location_on</span>
                      <span>Polling Place</span>
                    </div>
                    <span className="badge badge-blue">
                      {results?.polling_location || 'Pending Assignment'}
                    </span>
                  </div>
                  {results?.issues?.length > 0 && (
                    <div className="status-row" style={{ flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#ef4444', fontWeight: 600 }}>
                        <span className="material-icons-round" style={{ fontSize: 18 }}>warning</span>
                        Issues Detected
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
                        {results.issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button className="btn btn-outline full-width" onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard <span className="material-icons-round">dashboard</span>
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="vr-sidebar">
            <div className="card sidebar-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="sidebar-card-title">
                <span className="material-icons-round" style={{ color: 'var(--civic-blue-light)' }}>info</span>
                Registration Process
              </div>
              <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 4 }}>
                <p style={{ marginBottom: 12 }}><strong>1. Personal Details</strong><br/>Fill out your legal name, contact information, and address accurately to determine your precinct.</p>
                <p style={{ marginBottom: 12 }}><strong>2. Secure Verification</strong><br/>Your data is encrypted end-to-end and cross-referenced with state voter databases.</p>
                <p style={{ marginBottom: 12 }}><strong>3. Polling Assignment</strong><br/>Once verified, your polling location and ballot propositions will be automatically assigned.</p>
                <p style={{ marginBottom: 0 }}><strong>4. Confirmation</strong><br/>You will receive an official confirmation email when your registration is active.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
