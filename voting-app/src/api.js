export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const getAuthToken = () => localStorage.getItem('access_token');
export const setAuthToken = (token) => localStorage.setItem('access_token', token);
export const removeAuthToken = () => localStorage.removeItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const setRefreshToken = (token) => localStorage.setItem('refresh_token', token);

export const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    let response = await fetch(url, config);
    
    // Auto-handle 401 Unauthorized (Token refresh workflow)
    if (response.status === 401) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${refreshToken}`
                    }
                });
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    setAuthToken(data.data.access_token);
                    
                    // Retry original request
                    headers['Authorization'] = `Bearer ${data.data.access_token}`;
                    response = await fetch(url, { ...config, headers });
                } else {
                    removeAuthToken();
                    window.location.href = '/login';
                }
            } catch (err) {
                removeAuthToken();
                window.location.href = '/login';
            }
        } else {
            removeAuthToken();
            window.location.href = '/login';
        }
    }

    return response;
};

// Default export — axios-style helper for components using `import api from '../api'`
const api = {
    get: async (endpoint) => {
        const res = await apiFetch(endpoint, { method: 'GET' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
        return json;
    },
    post: async (endpoint, body) => {
        const res = await apiFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
        return json;
    },
};

export default api;

