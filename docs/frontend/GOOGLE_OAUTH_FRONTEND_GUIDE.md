# Frontend Google OAuth Integration Guide

## Overview

This guide provides step-by-step instructions for implementing Google OAuth login in your frontend application. It covers React, Vue.js, and vanilla JavaScript implementations.

## Quick Start

### 1. Backend Setup Required

Before implementing frontend, ensure your backend has:

- Google OAuth endpoints configured (`/v1/api/auth/google`)
- Environment variables set (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.)
- Database migration applied for Google OAuth fields

### 2. Frontend Flow

```
User clicks "Login with Google"
→ Redirect to backend OAuth endpoint
→ Backend redirects to Google OAuth consent
→ User grants permissions
→ Google redirects to backend callback
→ Backend processes and redirects to frontend with tokens
→ Frontend stores tokens and redirects to dashboard
```

## React Implementation

### 1. Basic Google Login Component

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleGoogleLogin = () => {
        setIsLoading(true);
        // Redirect to backend Google OAuth endpoint
        window.location.href = `${process.env.REACT_APP_API_URL}/v1/api/auth/google`;
    };

    return (
        <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="google-login-btn"
        >
            {isLoading ? (
                <span>Redirecting...</span>
            ) : (
                <>
                    <img src="/google-icon.svg" alt="Google" />
                    Continue with Google
                </>
            )}
        </button>
    );
};

export default GoogleLoginButton;
```

### 2. OAuth Callback Handler

```jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const accessToken = searchParams.get('access_token');
                const refreshToken = searchParams.get('refresh_token');
                const userJson = searchParams.get('user');
                const error = searchParams.get('error');

                if (error) {
                    setStatus('error');
                    setTimeout(() => {
                        navigate('/login?error=' + error);
                    }, 2000);
                    return;
                }

                if (accessToken && refreshToken && userJson) {
                    const user = JSON.parse(decodeURIComponent(userJson));

                    // Store tokens and user info
                    localStorage.setItem('access_token', accessToken);
                    localStorage.setItem('refresh_token', refreshToken);
                    localStorage.setItem('user', JSON.stringify(user));

                    // Update auth context
                    login(user, accessToken, refreshToken);

                    setStatus('success');

                    // Redirect to dashboard
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1000);
                } else {
                    setStatus('error');
                    setTimeout(() => {
                        navigate('/login?error=invalid_response');
                    }, 2000);
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                setStatus('error');
                setTimeout(() => {
                    navigate('/login?error=processing_failed');
                }, 2000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, login]);

    return (
        <div className="auth-callback">
            {status === 'processing' && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Processing your login...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="success">
                    <div className="checkmark">✓</div>
                    <p>Login successful! Redirecting...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="error">
                    <div className="error-icon">✗</div>
                    <p>Login failed. Redirecting...</p>
                </div>
            )}
        </div>
    );
};

export default AuthCallback;
```

### 3. Auth Context (React Context API)

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setAccessToken(storedToken);
            setUser(JSON.parse(storedUser));
        }

        setIsLoading(false);
    }, []);

    const login = (userData, token, refreshToken) => {
        setUser(userData);
        setAccessToken(token);
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    };

    const linkGoogleAccount = async (googleId) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/v1/api/auth/google/link`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ googleId }),
                },
            );

            if (!response.ok) {
                throw new Error('Failed to link Google account');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Link Google account error:', error);
            throw error;
        }
    };

    const unlinkGoogleAccount = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/v1/api/auth/google/unlink`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Failed to unlink Google account');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Unlink Google account error:', error);
            throw error;
        }
    };

    const value = {
        user,
        accessToken,
        isLoading,
        login,
        logout,
        linkGoogleAccount,
        unlinkGoogleAccount,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
```

### 4. Router Setup

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthCallback from './components/AuthCallback';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
```

## Vue.js Implementation

### 1. Google Login Component

```vue
<template>
    <button
        @click="handleGoogleLogin"
        :disabled="isLoading"
        class="google-login-btn"
    >
        <span v-if="isLoading">Redirecting...</span>
        <span v-else>
            <img src="/google-icon.svg" alt="Google" />
            Continue with Google
        </span>
    </button>
</template>

<script>
export default {
    name: 'GoogleLoginButton',
    data() {
        return {
            isLoading: false,
        };
    },
    methods: {
        handleGoogleLogin() {
            this.isLoading = true;
            window.location.href = `${process.env.VUE_APP_API_URL}/v1/api/auth/google`;
        },
    },
};
</script>
```

### 2. OAuth Callback Handler

```vue
<template>
    <div class="auth-callback">
        <div v-if="status === 'processing'" class="loading">
            <div class="spinner"></div>
            <p>Processing your login...</p>
        </div>

        <div v-if="status === 'success'" class="success">
            <div class="checkmark">✓</div>
            <p>Login successful! Redirecting...</p>
        </div>

        <div v-if="status === 'error'" class="error">
            <div class="error-icon">✗</div>
            <p>Login failed. Redirecting...</p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AuthCallback',
    data() {
        return {
            status: 'processing',
        };
    },
    async mounted() {
        await this.handleCallback();
    },
    methods: {
        async handleCallback() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const accessToken = urlParams.get('access_token');
                const refreshToken = urlParams.get('refresh_token');
                const userJson = urlParams.get('user');
                const error = urlParams.get('error');

                if (error) {
                    this.status = 'error';
                    setTimeout(() => {
                        this.$router.push(`/login?error=${error}`);
                    }, 2000);
                    return;
                }

                if (accessToken && refreshToken && userJson) {
                    const user = JSON.parse(decodeURIComponent(userJson));

                    // Store tokens and user info
                    localStorage.setItem('access_token', accessToken);
                    localStorage.setItem('refresh_token', refreshToken);
                    localStorage.setItem('user', JSON.stringify(user));

                    // Update Vuex store
                    this.$store.dispatch('auth/login', {
                        user,
                        accessToken,
                        refreshToken,
                    });

                    this.status = 'success';

                    setTimeout(() => {
                        this.$router.push('/dashboard');
                    }, 1000);
                } else {
                    this.status = 'error';
                    setTimeout(() => {
                        this.$router.push('/login?error=invalid_response');
                    }, 2000);
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                this.status = 'error';
                setTimeout(() => {
                    this.$router.push('/login?error=processing_failed');
                }, 2000);
            }
        },
    },
};
</script>
```

### 3. Vuex Store

```javascript
// store/modules/auth.js
const state = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
};

const mutations = {
    SET_USER(state, user) {
        state.user = user;
    },
    SET_TOKENS(state, { accessToken, refreshToken }) {
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
    },
    SET_AUTHENTICATED(state, status) {
        state.isAuthenticated = status;
    },
    CLEAR_AUTH(state) {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
    },
};

const actions = {
    login({ commit }, { user, accessToken, refreshToken }) {
        commit('SET_USER', user);
        commit('SET_TOKENS', { accessToken, refreshToken });
        commit('SET_AUTHENTICATED', true);
    },

    logout({ commit }) {
        commit('CLEAR_AUTH');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    },

    async linkGoogleAccount({ state }, googleId) {
        try {
            const response = await fetch(
                `${process.env.VUE_APP_API_URL}/v1/api/auth/google/link`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${state.accessToken}`,
                    },
                    body: JSON.stringify({ googleId }),
                },
            );

            if (!response.ok) {
                throw new Error('Failed to link Google account');
            }

            return await response.json();
        } catch (error) {
            console.error('Link Google account error:', error);
            throw error;
        }
    },

    async unlinkGoogleAccount({ state }) {
        try {
            const response = await fetch(
                `${process.env.VUE_APP_API_URL}/v1/api/auth/google/unlink`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${state.accessToken}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Failed to unlink Google account');
            }

            return await response.json();
        } catch (error) {
            console.error('Unlink Google account error:', error);
            throw error;
        }
    },
};

const getters = {
    isAuthenticated: (state) => state.isAuthenticated,
    user: (state) => state.user,
    accessToken: (state) => state.accessToken,
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters,
};
```

## Vanilla JavaScript Implementation

### 1. Basic Implementation

```javascript
// auth.js
class GoogleAuth {
    constructor(config) {
        this.apiUrl = config.apiUrl;
        this.redirectUrl = config.redirectUrl || '/dashboard';
        this.loginUrl = config.loginUrl || '/login';
    }

    // Initiate Google OAuth login
    login() {
        const loginBtn = document.querySelector('.google-login-btn');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = 'Redirecting...';
        }

        window.location.href = `${this.apiUrl}/v1/api/auth/google`;
    }

    // Handle OAuth callback
    handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const userJson = urlParams.get('user');
        const error = urlParams.get('error');

        if (error) {
            this.showError('Login failed. Please try again.');
            setTimeout(() => {
                window.location.href = `${this.loginUrl}?error=${error}`;
            }, 2000);
            return;
        }

        if (accessToken && refreshToken && userJson) {
            try {
                const user = JSON.parse(decodeURIComponent(userJson));

                // Store tokens and user info
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('refresh_token', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));

                this.showSuccess('Login successful! Redirecting...');

                setTimeout(() => {
                    window.location.href = this.redirectUrl;
                }, 1000);
            } catch (error) {
                console.error('Failed to parse user data:', error);
                this.showError('Login failed. Please try again.');
            }
        } else {
            this.showError('Invalid response from server.');
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('access_token');
        const user = localStorage.getItem('user');
        return !!(token && user);
    }

    // Get current user
    getCurrentUser() {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    }

    // Logout user
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = this.loginUrl;
    }

    // Link Google account
    async linkGoogleAccount(googleId) {
        const token = localStorage.getItem('access_token');

        try {
            const response = await fetch(
                `${this.apiUrl}/v1/api/auth/google/link`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ googleId }),
                },
            );

            if (!response.ok) {
                throw new Error('Failed to link Google account');
            }

            return await response.json();
        } catch (error) {
            console.error('Link Google account error:', error);
            throw error;
        }
    }

    // Unlink Google account
    async unlinkGoogleAccount() {
        const token = localStorage.getItem('access_token');

        try {
            const response = await fetch(
                `${this.apiUrl}/v1/api/auth/google/unlink`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Failed to unlink Google account');
            }

            return await response.json();
        } catch (error) {
            console.error('Unlink Google account error:', error);
            throw error;
        }
    }

    // Show success message
    showSuccess(message) {
        const container = document.querySelector('.auth-callback');
        if (container) {
            container.innerHTML = `
        <div class="success">
          <div class="checkmark">✓</div>
          <p>${message}</p>
        </div>
      `;
        }
    }

    // Show error message
    showError(message) {
        const container = document.querySelector('.auth-callback');
        if (container) {
            container.innerHTML = `
        <div class="error">
          <div class="error-icon">✗</div>
          <p>${message}</p>
        </div>
      `;
        }
    }
}

// Initialize Google Auth
const googleAuth = new GoogleAuth({
    apiUrl: 'http://localhost:3055',
    redirectUrl: '/dashboard',
    loginUrl: '/login',
});

// Export for use in other files
window.googleAuth = googleAuth;
```

### 2. HTML Implementation

```html
<!-- login.html -->
<!DOCTYPE html>
<html>
    <head>
        <title>Login</title>
        <link rel="stylesheet" href="styles.css" />
    </head>
    <body>
        <div class="login-container">
            <div class="login-form">
                <h2>Login to Your Account</h2>

                <!-- Regular login form -->
                <form id="loginForm">
                    <input type="email" placeholder="Email" required />
                    <input type="password" placeholder="Password" required />
                    <button type="submit">Login</button>
                </form>

                <div class="divider">
                    <span>or</span>
                </div>

                <!-- Google login button -->
                <button class="google-login-btn" onclick="googleAuth.login()">
                    <img src="/google-icon.svg" alt="Google" />
                    Continue with Google
                </button>
            </div>
        </div>

        <script src="auth.js"></script>
    </body>
</html>
```

```html
<!-- callback.html -->
<!DOCTYPE html>
<html>
    <head>
        <title>Processing Login</title>
        <link rel="stylesheet" href="styles.css" />
    </head>
    <body>
        <div class="auth-callback">
            <div class="loading">
                <div class="spinner"></div>
                <p>Processing your login...</p>
            </div>
        </div>

        <script src="auth.js"></script>
        <script>
            // Handle OAuth callback
            googleAuth.handleCallback();
        </script>
    </body>
</html>
```

## Environment Variables

### React (.env)

```env
REACT_APP_API_URL=http://localhost:3055
```

### Vue.js (.env)

```env
VUE_APP_API_URL=http://localhost:3055
```

### Next.js (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3055
```

## Styling Examples

### CSS for Google Login Button

```css
.google-login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #dadce0;
    border-radius: 4px;
    background: white;
    color: #3c4043;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.google-login-btn:hover {
    background: #f8f9fa;
    border-color: #d2d4d7;
}

.google-login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.google-login-btn img {
    width: 20px;
    height: 20px;
    margin-right: 12px;
}

.auth-callback {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
}

.loading,
.success,
.error {
    padding: 32px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.checkmark {
    font-size: 48px;
    color: #4caf50;
    margin-bottom: 16px;
}

.error-icon {
    font-size: 48px;
    color: #f44336;
    margin-bottom: 16px;
}
```

## Error Handling

### Common Error Scenarios

1. **OAuth Failed**: Google OAuth process failed
2. **Invalid Response**: Missing or corrupted callback data
3. **Processing Failed**: Error parsing user data
4. **Network Error**: API request failed

### Error Handling Example

```javascript
// React error handling
const handleGoogleLogin = async () => {
  try {
    setIsLoading(true);
    window.location.href = `${process.env.REACT_APP_API_URL}/v1/api/auth/google`;
  } catch (error) {
    console.error('Google login error:', error);
    setError('Failed to initiate Google login');
    setIsLoading(false);
  }
};

// Vue error handling
methods: {
  async handleGoogleLogin() {
    try {
      this.isLoading = true;
      window.location.href = `${process.env.VUE_APP_API_URL}/v1/api/auth/google`;
    } catch (error) {
      console.error('Google login error:', error);
      this.error = 'Failed to initiate Google login';
      this.isLoading = false;
    }
  }
}
```

## Testing

### Test OAuth Flow

1. Click "Login with Google" button
2. Verify redirect to Google consent screen
3. Grant permissions
4. Verify successful callback and token storage
5. Check user is redirected to dashboard

### Test Error Scenarios

1. Cancel OAuth consent (should redirect to login with error)
2. Invalid callback URL (should show error message)
3. Network failures (should show appropriate error)

## Security Best Practices

1. **HTTPS Only**: Use HTTPS in production
2. **Token Expiration**: Handle token refresh
3. **Secure Storage**: Consider using secure storage for tokens
4. **CSRF Protection**: Implement CSRF tokens
5. **Input Validation**: Validate all OAuth callback data

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure callback URLs match Google Console settings
2. **CORS Issues**: Configure CORS properly on backend
3. **Token Storage**: Ensure tokens are stored securely
4. **Route Configuration**: Verify callback route is configured correctly

### Debug Tips

```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Log OAuth callback data
console.log('OAuth callback data:', {
    accessToken: searchParams.get('access_token'),
    refreshToken: searchParams.get('refresh_token'),
    user: searchParams.get('user'),
    error: searchParams.get('error'),
});
```

This comprehensive guide should help frontend developers implement Google OAuth login successfully in their applications.
