# Google OAuth Frontend Quick Reference

## 🚀 Quick Setup

### 1. Environment Variables

```env
# React
REACT_APP_API_URL=http://localhost:3055

# Vue.js
VUE_APP_API_URL=http://localhost:3055

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3055
```

### 2. Basic Login Button

```javascript
const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/v1/api/auth/google`;
};
```

### 3. Callback Handler

```javascript
// Get tokens from URL params
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('access_token');
const refreshToken = urlParams.get('refresh_token');
const user = JSON.parse(decodeURIComponent(urlParams.get('user')));

// Store tokens
localStorage.setItem('access_token', accessToken);
localStorage.setItem('refresh_token', refreshToken);
localStorage.setItem('user', JSON.stringify(user));
```

## 📱 Framework-Specific Examples

### React Hook

```jsx
import { useState, useEffect } from 'react';

const useGoogleAuth = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = () => {
        setIsLoading(true);
        window.location.href = `${process.env.REACT_APP_API_URL}/v1/api/auth/google`;
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        window.location.href = '/login';
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return { user, isLoading, login, logout };
};
```

### Vue.js Composable

```javascript
import { ref, onMounted } from 'vue';

export const useGoogleAuth = () => {
    const user = ref(null);
    const isLoading = ref(false);

    const login = () => {
        isLoading.value = true;
        window.location.href = `${process.env.VUE_APP_API_URL}/v1/api/auth/google`;
    };

    const logout = () => {
        localStorage.clear();
        user.value = null;
        window.location.href = '/login';
    };

    onMounted(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            user.value = JSON.parse(storedUser);
        }
    });

    return { user, isLoading, login, logout };
};
```

## 🛣️ Router Setup

### React Router

```jsx
import { Routes, Route } from 'react-router-dom';
import AuthCallback from './components/AuthCallback';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
    );
}
```

### Vue Router

```javascript
const routes = [
    { path: '/login', component: Login },
    { path: '/auth/callback', component: AuthCallback },
    { path: '/dashboard', component: Dashboard },
];
```

## 🎨 Styling

### Google Button CSS

```css
.google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
    border: 2px solid #dadce0;
    border-radius: 4px;
    background: white;
    color: #3c4043;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.google-btn:hover {
    background: #f8f9fa;
    border-color: #d2d4d7;
}

.google-btn img {
    width: 20px;
    height: 20px;
    margin-right: 12px;
}
```

### Loading States

```css
.loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
```

## 🔐 API Calls

### Link Google Account

```javascript
const linkGoogleAccount = async (googleId) => {
    const response = await fetch(`${API_URL}/v1/api/auth/google/link`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ googleId }),
    });

    return response.json();
};
```

### Unlink Google Account

```javascript
const unlinkGoogleAccount = async () => {
    const response = await fetch(`${API_URL}/v1/api/auth/google/unlink`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
    });

    return response.json();
};
```

## 🚨 Error Handling

### Common Error Codes

- `oauth_failed`: OAuth process failed
- `invalid_response`: Missing callback data
- `processing_failed`: Error parsing user data
- `google_account_linked`: Account already linked

### Error Display

```javascript
const handleError = (error) => {
    const messages = {
        oauth_failed: 'Google login failed. Please try again.',
        invalid_response: 'Invalid response from server.',
        processing_failed: 'Failed to process login. Please try again.',
        google_account_linked:
            'This Google account is already linked to another user.',
    };

    return messages[error] || 'An unexpected error occurred.';
};
```

## 🔧 Utilities

### Check Authentication

```javascript
const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return !!(token && user);
};
```

### Get Current User

```javascript
const getCurrentUser = () => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
};
```

### Protected Route (React)

```jsx
const ProtectedRoute = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
        }
    }, [navigate]);

    return isAuthenticated() ? children : null;
};
```

## 📞 Backend Endpoints

| Method | Endpoint                       | Description           |
| ------ | ------------------------------ | --------------------- |
| GET    | `/v1/api/auth/google`          | Initiate Google OAuth |
| GET    | `/v1/api/auth/google/callback` | Handle OAuth callback |
| POST   | `/v1/api/auth/google/link`     | Link Google account   |
| DELETE | `/v1/api/auth/google/unlink`   | Unlink Google account |

## 🎯 Testing Checklist

- [ ] Google login button redirects to OAuth
- [ ] OAuth callback processes tokens correctly
- [ ] User data is stored in localStorage
- [ ] Dashboard loads after successful login
- [ ] Error states display properly
- [ ] Logout clears all data
- [ ] Protected routes work correctly

## 🐛 Common Issues

1. **CORS Error**: Check backend CORS configuration
2. **Redirect URI Mismatch**: Verify Google Console settings
3. **Token Not Found**: Check localStorage implementation
4. **Parse Error**: Ensure user data is properly decoded

## 📚 Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React Router Documentation](https://reactrouter.com/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [MDN Web API Reference](https://developer.mozilla.org/en-US/docs/Web/API)
