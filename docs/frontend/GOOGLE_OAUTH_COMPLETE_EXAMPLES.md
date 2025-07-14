# Google OAuth Complete Implementation Examples

## React Complete Example

### 1. Login Page Component

```jsx
// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check for OAuth errors
        const error = searchParams.get('error');
        if (error) {
            const errorMessages = {
                oauth_failed: 'Google login failed. Please try again.',
                invalid_response: 'Invalid response from server.',
                processing_failed: 'Failed to process login. Please try again.',
            };
            setError(errorMessages[error] || 'An unexpected error occurred.');
        }

        // Redirect if already logged in
        if (user) {
            navigate('/dashboard');
        }
    }, [searchParams, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/v1/api/auth/login`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                },
            );

            const data = await response.json();

            if (response.ok) {
                login(
                    data.metadata.user,
                    data.metadata.tokens.accessToken,
                    data.metadata.tokens.refreshToken,
                );
                navigate('/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Welcome Back</h1>
                    <p>Sign in to your account</p>
                </div>

                {error && <div className="error-alert">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="divider">
                    <span>or</span>
                </div>

                <GoogleLoginButton />

                <div className="login-footer">
                    <p>
                        Don't have an account?
                        <a href="/register"> Sign up</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
```

### 2. Google Login Button Component

```jsx
// src/components/GoogleLoginButton.jsx
import React, { useState } from 'react';
import googleIcon from '../assets/google-icon.svg';
import './GoogleLoginButton.css';

const GoogleLoginButton = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = () => {
        setIsLoading(true);
        window.location.href = `${process.env.REACT_APP_API_URL}/v1/api/auth/google`;
    };

    return (
        <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="google-login-btn"
        >
            {isLoading ? (
                <span className="loading-text">Redirecting...</span>
            ) : (
                <>
                    <img
                        src={googleIcon}
                        alt="Google"
                        className="google-icon"
                    />
                    <span>Continue with Google</span>
                </>
            )}
        </button>
    );
};

export default GoogleLoginButton;
```

### 3. OAuth Callback Component

```jsx
// src/components/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthCallback.css';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Processing your login...');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const accessToken = searchParams.get('access_token');
                const refreshToken = searchParams.get('refresh_token');
                const userJson = searchParams.get('user');
                const error = searchParams.get('error');

                if (error) {
                    setStatus('error');
                    setMessage('Login failed. Redirecting...');
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
                    setMessage('Login successful! Redirecting...');

                    // Redirect to dashboard
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1000);
                } else {
                    setStatus('error');
                    setMessage('Invalid response from server. Redirecting...');
                    setTimeout(() => {
                        navigate('/login?error=invalid_response');
                    }, 2000);
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                setStatus('error');
                setMessage('An error occurred. Redirecting...');
                setTimeout(() => {
                    navigate('/login?error=processing_failed');
                }, 2000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, login]);

    return (
        <div className="auth-callback">
            <div className={`callback-content ${status}`}>
                {status === 'processing' && (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <h2>{message}</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="success-container">
                        <div className="checkmark">✓</div>
                        <h2>{message}</h2>
                    </div>
                )}

                {status === 'error' && (
                    <div className="error-container">
                        <div className="error-icon">✗</div>
                        <h2>{message}</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
```

### 4. Auth Context

```jsx
// src/contexts/AuthContext.jsx
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
            try {
                const userData = JSON.parse(storedUser);
                setAccessToken(storedToken);
                setUser(userData);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                logout();
            }
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Failed to link Google account',
                );
            }

            return data;
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Failed to unlink Google account',
                );
            }

            return data;
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

### 5. Protected Route Component

```jsx
// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
```

## Vue.js Complete Example

### 1. Login Page Component

```vue
<!-- src/views/Login.vue -->
<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h1>Welcome Back</h1>
                <p>Sign in to your account</p>
            </div>

            <div v-if="error" class="error-alert">
                {{ error }}
            </div>

            <form @submit.prevent="handleSubmit" class="login-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        v-model="formData.email"
                        required
                        :disabled="isLoading"
                    />
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        v-model="formData.password"
                        required
                        :disabled="isLoading"
                    />
                </div>

                <button type="submit" class="submit-btn" :disabled="isLoading">
                    {{ isLoading ? 'Signing in...' : 'Sign In' }}
                </button>
            </form>

            <div class="divider">
                <span>or</span>
            </div>

            <GoogleLoginButton />

            <div class="login-footer">
                <p>
                    Don't have an account?
                    <router-link to="/register">Sign up</router-link>
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import GoogleLoginButton from '../components/GoogleLoginButton.vue';

export default {
    name: 'Login',
    components: {
        GoogleLoginButton,
    },
    data() {
        return {
            formData: {
                email: '',
                password: '',
            },
            isLoading: false,
            error: '',
        };
    },
    computed: {
        ...mapState('auth', ['user']),
    },
    mounted() {
        // Check for OAuth errors
        const error = this.$route.query.error;
        if (error) {
            const errorMessages = {
                oauth_failed: 'Google login failed. Please try again.',
                invalid_response: 'Invalid response from server.',
                processing_failed: 'Failed to process login. Please try again.',
            };
            this.error =
                errorMessages[error] || 'An unexpected error occurred.';
        }

        // Redirect if already logged in
        if (this.user) {
            this.$router.push('/dashboard');
        }
    },
    methods: {
        ...mapActions('auth', ['login']),

        async handleSubmit() {
            this.isLoading = true;
            this.error = '';

            try {
                const response = await fetch(
                    `${process.env.VUE_APP_API_URL}/v1/api/auth/login`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(this.formData),
                    },
                );

                const data = await response.json();

                if (response.ok) {
                    this.login({
                        user: data.metadata.user,
                        accessToken: data.metadata.tokens.accessToken,
                        refreshToken: data.metadata.tokens.refreshToken,
                    });
                    this.$router.push('/dashboard');
                } else {
                    this.error = data.message || 'Login failed';
                }
            } catch (error) {
                this.error = 'Network error. Please try again.';
            } finally {
                this.isLoading = false;
            }
        },
    },
};
</script>
```

### 2. Google Login Button Component

```vue
<!-- src/components/GoogleLoginButton.vue -->
<template>
    <button
        @click="handleGoogleLogin"
        :disabled="isLoading"
        class="google-login-btn"
    >
        <span v-if="isLoading" class="loading-text">Redirecting...</span>
        <template v-else>
            <img
                src="@/assets/google-icon.svg"
                alt="Google"
                class="google-icon"
            />
            <span>Continue with Google</span>
        </template>
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

### 3. OAuth Callback Component

```vue
<!-- src/views/AuthCallback.vue -->
<template>
    <div class="auth-callback">
        <div :class="['callback-content', status]">
            <div v-if="status === 'processing'" class="loading-container">
                <div class="spinner"></div>
                <h2>{{ message }}</h2>
            </div>

            <div v-else-if="status === 'success'" class="success-container">
                <div class="checkmark">✓</div>
                <h2>{{ message }}</h2>
            </div>

            <div v-else-if="status === 'error'" class="error-container">
                <div class="error-icon">✗</div>
                <h2>{{ message }}</h2>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
    name: 'AuthCallback',
    data() {
        return {
            status: 'processing',
            message: 'Processing your login...',
        };
    },
    async mounted() {
        await this.handleCallback();
    },
    methods: {
        ...mapActions('auth', ['login']),

        async handleCallback() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const accessToken = urlParams.get('access_token');
                const refreshToken = urlParams.get('refresh_token');
                const userJson = urlParams.get('user');
                const error = urlParams.get('error');

                if (error) {
                    this.status = 'error';
                    this.message = 'Login failed. Redirecting...';
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
                    this.login({
                        user,
                        accessToken,
                        refreshToken,
                    });

                    this.status = 'success';
                    this.message = 'Login successful! Redirecting...';

                    setTimeout(() => {
                        this.$router.push('/dashboard');
                    }, 1000);
                } else {
                    this.status = 'error';
                    this.message =
                        'Invalid response from server. Redirecting...';
                    setTimeout(() => {
                        this.$router.push('/login?error=invalid_response');
                    }, 2000);
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                this.status = 'error';
                this.message = 'An error occurred. Redirecting...';
                setTimeout(() => {
                    this.$router.push('/login?error=processing_failed');
                }, 2000);
            }
        },
    },
};
</script>
```

## Styling (CSS)

### Login Page Styles

```css
/* src/styles/Login.css */
.login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.login-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    padding: 40px;
    width: 100%;
    max-width: 400px;
}

.login-header {
    text-align: center;
    margin-bottom: 30px;
}

.login-header h1 {
    color: #333;
    font-size: 28px;
    margin-bottom: 8px;
}

.login-header p {
    color: #666;
    font-size: 16px;
}

.error-alert {
    background: #fee;
    color: #c33;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 20px;
    border: 1px solid #fcc;
}

.login-form {
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 6px;
    color: #333;
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 12px;
    border: 2px solid #e1e5e9;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.2s ease;
}

.form-group input:focus {
    outline: none;
    border-color: #667eea;
}

.form-group input:disabled {
    background: #f8f9fa;
    opacity: 0.6;
}

.submit-btn {
    width: 100%;
    padding: 12px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
    background: #5a6fd8;
}

.submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.divider {
    text-align: center;
    margin: 20px 0;
    position: relative;
}

.divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e1e5e9;
}

.divider span {
    background: white;
    padding: 0 15px;
    color: #666;
    font-size: 14px;
}

.login-footer {
    text-align: center;
    margin-top: 20px;
}

.login-footer p {
    color: #666;
    font-size: 14px;
}

.login-footer a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
}

.login-footer a:hover {
    text-decoration: underline;
}
```

### Google Button Styles

```css
/* src/styles/GoogleLoginButton.css */
.google-login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #dadce0;
    border-radius: 6px;
    background: white;
    color: #3c4043;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.google-login-btn:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #d2d4d7;
}

.google-login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.google-icon {
    width: 20px;
    height: 20px;
    margin-right: 12px;
}

.loading-text {
    color: #666;
}
```

### Auth Callback Styles

```css
/* src/styles/AuthCallback.css */
.auth-callback {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.callback-content {
    background: white;
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    max-width: 400px;
}

.loading-container,
.success-container,
.error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
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
    width: 60px;
    height: 60px;
    background: #4caf50;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    color: white;
    margin-bottom: 20px;
}

.error-icon {
    width: 60px;
    height: 60px;
    background: #f44336;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    color: white;
    margin-bottom: 20px;
}

.callback-content h2 {
    color: #333;
    font-size: 20px;
    margin: 0;
}

.success h2 {
    color: #4caf50;
}

.error h2 {
    color: #f44336;
}
```

This complete implementation provides:

1. **Full login page** with both regular and Google OAuth login
2. **Error handling** for OAuth failures
3. **Loading states** during authentication
4. **Secure token storage** in localStorage
5. **Protected routes** that redirect to login if not authenticated
6. **Responsive design** that works on mobile devices
7. **Proper state management** with Context API (React) or Vuex (Vue)
8. **Complete styling** with modern UI components

The examples are production-ready and include all the necessary error handling, loading states, and security considerations for implementing Google OAuth login in your frontend application.
