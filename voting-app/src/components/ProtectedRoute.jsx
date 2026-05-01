import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../api';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const isLoggedIn = !!getAuthToken();

  if (!isLoggedIn) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 80px)',
        width: '100%',
        textAlign: 'center'
      }}>
        <div className="card animate-fade-up" style={{ padding: '3rem', maxWidth: 400, margin: '0 auto' }}>
          <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--civic-blue)', marginBottom: 16 }}>lock</span>
          <h2 style={{ marginBottom: 8 }}>Please Login</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            You must be logged in to access this page. Sign in to view your civic profile and tools.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center' }}>
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  return children;
}
