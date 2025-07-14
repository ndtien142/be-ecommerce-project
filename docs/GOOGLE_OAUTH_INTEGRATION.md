# Google OAuth Integration Guide

## Overview

This guide explains how to integrate Google OAuth login into your application backend.

## Prerequisites

1. **Google Cloud Console Setup**

    - Go to [Google Cloud Console](https://console.cloud.google.com/)
    - Create a new project or select existing one
    - Enable Google+ API and Google OAuth2 API
    - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
    - Select "Web application"
    - Add authorized redirect URIs:
        - `http://localhost:3055/v1/api/auth/google/callback` (development)
        - `https://yourdomain.com/v1/api/auth/google/callback` (production)

2. **Environment Variables**
   Update your `.env` file with:
    ```env
    GOOGLE_CLIENT_ID=your_google_client_id_here
    GOOGLE_CLIENT_SECRET=your_google_client_secret_here
    GOOGLE_CALLBACK_URL=http://localhost:3055/v1/api/auth/google/callback
    SESSION_SECRET=your_session_secret_here
    FRONTEND_URL=http://localhost:3000
    ```

## Database Changes

Run the migration to add Google OAuth fields:

```sql
-- Add Google OAuth fields to users table
ALTER TABLE tb_user
ADD COLUMN google_id VARCHAR(255) NULL UNIQUE,
ADD COLUMN avatar VARCHAR(500) NULL,
MODIFY COLUMN user_pass VARCHAR(255) NULL;
```

## API Endpoints

### 1. Initiate Google OAuth Login

```
GET /v1/api/auth/google
```

- Redirects user to Google OAuth consent screen
- No authentication required

### 2. Google OAuth Callback

```
GET /v1/api/auth/google/callback
```

- Handles callback from Google OAuth
- Automatically creates user if doesn't exist
- Redirects to frontend with tokens

### 3. Link Google Account (Authenticated)

```
POST /v1/api/auth/google/link
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "googleId": "google_user_id"
}
```

### 4. Unlink Google Account (Authenticated)

```
DELETE /v1/api/auth/google/unlink
Authorization: Bearer <access_token>
```

## Frontend Integration

### 1. React Example

```javascript
// Login with Google
const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3055/v1/api/auth/google';
};

// Handle callback (create this route in your app)
// URL: /auth/callback
const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const user = searchParams.get('user');

        if (accessToken && refreshToken) {
            // Store tokens
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('user', user);

            // Redirect to dashboard
            navigate('/dashboard');
        } else {
            // Handle error
            navigate('/login?error=oauth_failed');
        }
    }, [searchParams, navigate]);

    return <div>Processing login...</div>;
};
```

### 2. Vue.js Example

```javascript
// Login with Google
const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3055/v1/api/auth/google';
};

// Handle callback
// Component: AuthCallback.vue
export default {
    mounted() {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const user = urlParams.get('user');

        if (accessToken && refreshToken) {
            // Store tokens
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('user', user);

            // Redirect to dashboard
            this.$router.push('/dashboard');
        } else {
            // Handle error
            this.$router.push('/login?error=oauth_failed');
        }
    },
};
```

## User Flow

1. **New User with Google**:

    - User clicks "Login with Google"
    - Redirected to Google OAuth consent
    - User grants permissions
    - Google redirects back to callback URL
    - System creates new user account
    - User redirected to frontend with tokens

2. **Existing User with Google**:

    - User clicks "Login with Google"
    - System finds existing user by Google ID
    - User redirected to frontend with tokens

3. **Existing User Linking Google**:
    - User logs in with username/password
    - User clicks "Link Google Account"
    - System links Google ID to existing account

## Security Features

1. **Session Management**: Uses secure sessions for OAuth flow
2. **Token Security**: JWT tokens with expiration
3. **Google ID Uniqueness**: Prevents duplicate Google account linking
4. **Password Fallback**: Users can't unlink Google if no password set

## Error Handling

Common error scenarios:

- `oauth_failed`: OAuth process failed
- `google_account_linked`: Google account already linked to another user
- `no_password_set`: Can't unlink Google without password

## Testing

1. **Test Google OAuth Flow**:

    ```bash
    curl -X GET http://localhost:3055/v1/api/auth/google
    ```

2. **Test Link Google Account**:

    ```bash
    curl -X POST http://localhost:3055/v1/api/auth/google/link \
      -H "Authorization: Bearer <access_token>" \
      -H "Content-Type: application/json" \
      -d '{"googleId": "google_user_id"}'
    ```

3. **Test Unlink Google Account**:
    ```bash
    curl -X DELETE http://localhost:3055/v1/api/auth/google/unlink \
      -H "Authorization: Bearer <access_token>"
    ```

## Production Considerations

1. **SSL/HTTPS**: Required for production OAuth
2. **Domain Whitelist**: Add production domains to Google Console
3. **Session Store**: Use Redis/database for session storage
4. **Rate Limiting**: Implement rate limiting for OAuth endpoints
5. **Monitoring**: Monitor OAuth success/failure rates

## Troubleshooting

1. **"Invalid redirect URI"**: Check Google Console redirect URIs
2. **"Invalid client ID"**: Verify GOOGLE_CLIENT_ID in .env
3. **"OAuth failed"**: Check GOOGLE_CLIENT_SECRET
4. **Session errors**: Verify SESSION_SECRET is set
5. **Database errors**: Ensure migration is applied

## Dependencies

Required npm packages:

```json
{
    "passport": "^0.6.0",
    "passport-google-oauth20": "^2.0.0",
    "express-session": "^1.17.3"
}
```

Install with:

```bash
npm install passport passport-google-oauth20 express-session
```
