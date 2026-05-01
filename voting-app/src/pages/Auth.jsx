import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, setAuthToken, setRefreshToken, getAuthToken } from '../api';
import './Auth.css';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (getAuthToken()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    // Construct payload based on state
    let payload = { password: formData.password };
    
    if (isLogin) {
      if (loginMethod === 'email') payload.email = formData.email;
      if (loginMethod === 'phone') payload.phone_number = formData.phone_number;
    } else {
      payload.full_name = formData.full_name;
      payload.email = formData.email;
      // Optional: allow phone number on register if user typed it
      if (formData.phone_number) payload.phone_number = formData.phone_number;
    }

    try {
      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isLogin) {
        setAuthToken(data.data.access_token);
        setRefreshToken(data.data.refresh_token);
      } else {
        // Register successful, wait for login or auto-login depending on backend behavior
        // Our backend register doesn't return tokens, so we switch to login
        setIsLogin(true);
        setLoginMethod('email');
        setError('Registration successful! Please log in.');
        setIsLoading(false);
        return;
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card animate-fade-up">
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
          <p>{isLogin ? 'Sign in to access your civic dashboard' : 'Join CivicReady to get started'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {isLogin && (
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${loginMethod === 'email' ? 'active' : ''}`}
              onClick={() => setLoginMethod('email')}
              type="button"
            >
              Email
            </button>
            <button 
              className={`auth-tab ${loginMethod === 'phone' ? 'active' : ''}`}
              onClick={() => setLoginMethod('phone')}
              type="button"
            >
              Phone Number
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="full_name"
                className="form-input" 
                placeholder="Maria Rodriguez"
                value={formData.full_name}
                onChange={handleChange}
                required 
              />
            </div>
          )}

          {(!isLogin || loginMethod === 'email') && (
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email"
                className="form-input" 
                placeholder="maria@example.com"
                value={formData.email}
                onChange={handleChange}
                required={!isLogin || loginMethod === 'email'} 
              />
            </div>
          )}

          {(loginMethod === 'phone' || (!isLogin && formData.phone_number !== undefined)) && (
            <div className="form-group">
              <label>Phone Number {!isLogin && '(Optional)'}</label>
              <input 
                type="tel" 
                name="phone_number"
                className="form-input" 
                placeholder="555-019-2034"
                value={formData.phone_number}
                onChange={handleChange}
                required={isLogin && loginMethod === 'phone'} 
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              className="form-input" 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required 
              minLength="8"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }}>
            {isLogin ? 'Register here' : 'Sign in here'}
          </button>
        </div>
      </div>
    </div>
  );
}
