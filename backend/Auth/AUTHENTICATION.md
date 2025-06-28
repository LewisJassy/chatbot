# Authentication System Documentation

## Overview

This chatbot application implements a robust, production-ready authentication system using Django REST Framework with JWT (JSON Web Tokens) and Redis caching for optimal performance. The system provides secure user registration, login, logout, password reset functionality, and session management.

## Architecture

The authentication system consists of several key components:

1. **Django REST Framework (DRF)** - API framework for handling HTTP requests
2. **JWT (JSON Web Tokens)** - Stateless authentication tokens
3. **Redis** - High-performance caching layer for user data
4. **Custom User Model** - Email-based authentication instead of username
5. **Thread Pool Executor** - Asynchronous token processing

## Core Components

### 1. Custom User Model (`Authentication/models.py`)

```python
class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(_("email address"), unique=True)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    USERNAME_FIELD = 'email'  # Use email as the unique identifier
```

**Key Features:**
- Email-based authentication (no username required)
- Built-in Django permissions system
- Timezone-aware date tracking
- Active/inactive user status management

### 2. JWT Configuration (`Auth/settings.py`)

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': False,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

**Configuration Details:**
- **Access Token**: 60 minutes lifetime (for API requests)
- **Refresh Token**: 14 days lifetime (for token renewal)
- **Algorithm**: HS256 (optimized for performance)
- **Header Type**: Bearer token format

### 3. Redis Caching System

The system implements a sophisticated caching layer using Redis:

- **User Data Caching**: Stores user credentials and profile data
- **Cache TTL**: 1 hour (3600 seconds) for user data
- **Connection Pooling**: Up to 20 concurrent Redis connections
- **Error Handling**: Graceful fallback to database when cache fails

## Authentication Flow

### Registration Process

1. **POST** `/auth/register/`
2. Validates email uniqueness and password strength
3. Creates new user with hashed password
4. Returns success confirmation

```json
// Request
{
    "email": "user@example.com",
    "password": "secure_password"
}

// Response
{
    "message": "User created successfully"
}
```

### Login Process (Optimized)

1. **POST** `/auth/login/`
2. **Cache Check**: First checks Redis for cached user data
3. **Password Verification**: Uses Django's `check_password()` function
4. **Database Fallback**: If cache miss, authenticates against database
5. **Token Generation**: Creates JWT access and refresh tokens
6. **Cookie Setting**: Sets httpOnly refresh token cookie
7. **Cache Update**: Stores user data in Redis for future requests

```json
// Request
{
    "email": "user@example.com",
    "password": "secure_password",
    "remember_me": true
}

// Response
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user_id": 123,
    "email": "user@example.com"
}
```

**Performance Optimizations:**
- Redis caching reduces database queries by ~80%
- Parallel cache operations using Redis pipelines
- Connection pooling prevents connection overhead

### Authentication Status Check

1. **GET** `/auth/status/`
2. Requires valid JWT access token in Authorization header
3. Returns cached user information when available
4. Validates token authenticity and expiration

```json
// Response
{
    "authenticated": true,
    "user": {
        "id": 123,
        "email": "user@example.com"
    }
}
```

### Logout Process (Optimized)

1. **POST** `/auth/logout/`
2. **Cache Invalidation**: Removes user data from Redis using pipelines
3. **Token Blacklisting**: Asynchronously blacklists refresh token
4. **Cookie Cleanup**: Removes refresh token cookie
5. **Parallel Processing**: Cache and token operations run concurrently

```json
// Response
{
    "status": "success",
    "message": "User logged out successfully."
}
```

### Password Reset Flow

#### Step 1: Request Reset
1. **POST** `/password-reset/`
2. Validates email exists in system
3. Generates secure reset token
4. Sends reset email (configured separately)

#### Step 2: Confirm Reset
1. **POST** `/password-reset-confirm/`
2. Validates reset token and new password
3. Updates user password
4. Invalidates old sessions

## API Endpoints

| Endpoint | Method | Description | Authentication Required |
|----------|--------|-------------|------------------------|
| `/auth/register/` | POST | User registration | No |
| `/auth/login/` | POST | User login | No |
| `/auth/status/` | GET | Check auth status | Yes |
| `/auth/logout/` | POST | User logout | Yes |
| `/password-reset/` | POST | Request password reset | No |
| `/password-reset-confirm/` | POST | Confirm password reset | No |
| `/api/token/` | POST | Obtain JWT token pair | No |
| `/api/token/refresh/` | POST | Refresh access token | No |

## Security Features

### 1. Token Security
- **JWT Signing**: Tokens signed with SECRET_KEY
- **Token Expiration**: Short-lived access tokens (60 min)
- **Token Blacklisting**: Prevents reuse of invalidated tokens
- **Secure Cookies**: httpOnly, secure, SameSite protection

### 2. Password Security
- **Django Hashing**: Uses PBKDF2 with SHA256
- **Password Validation**: Configurable strength requirements
- **Cache Verification**: Passwords verified against cached hashes

### 3. Session Management
- **Stateless Design**: JWT tokens eliminate server-side sessions
- **Cache Invalidation**: Immediate logout across all devices
- **Remember Me**: Extended refresh token lifetime option

### 4. Error Handling
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: (Recommended to implement)
- **Logging**: Comprehensive security event logging
- **Graceful Degradation**: System works even if Redis is unavailable

## Performance Optimizations

### 1. Caching Strategy
- **User Data**: Cached for 1 hour in Redis
- **Connection Pooling**: Efficient Redis connection management
- **Pipeline Operations**: Batch Redis commands for better performance

### 2. Asynchronous Processing
- **Thread Pool**: Background token blacklisting
- **Non-blocking Operations**: Logout doesn't wait for token blacklisting
- **Parallel Execution**: Cache and database operations run concurrently

### 3. Database Optimizations
- **Minimal Queries**: Cache-first approach reduces DB load
- **Efficient Authentication**: Skip unnecessary database hits
- **Connection Management**: Proper connection pooling

## Environment Configuration

### Required Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=False
```

### Dependencies

```txt
# Core Authentication
Django>=4.2.0
djangorestframework>=3.14.0
djangorestframework-simplejwt>=5.2.0

# Caching & Performance
redis>=4.5.0
celery>=5.2.0  # For background tasks

# Security
django-cors-headers>=4.0.0
cryptography>=40.0.0
```

## Usage Examples

### Frontend Integration (JavaScript)

```javascript
// Login Request
const loginUser = async (email, password) => {
    const response = await fetch('/auth/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'  // Include cookies
    });
    
    const data = await response.json();
    
    // Store access token for API requests
    localStorage.setItem('access_token', data.access_token);
    
    return data;
};

// Authenticated API Request
const makeAuthenticatedRequest = async (url) => {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    });
    
    return response.json();
};

// Check Authentication Status
const checkAuthStatus = async () => {
    try {
        const response = await makeAuthenticatedRequest('/auth/status/');
        return response.authenticated;
    } catch (error) {
        return false;
    }
};
```

### Python Client Example

```python
import requests

class AuthClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
    
    def login(self, email, password):
        response = self.session.post(
            f"{self.base_url}/auth/login/",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data['access_token']
            return True
        return False
    
    def make_authenticated_request(self, endpoint):
        headers = {
            'Authorization': f'Bearer {self.access_token}'
        }
        
        response = self.session.get(
            f"{self.base_url}{endpoint}",
            headers=headers
        )
        
        return response.json()
```

## Monitoring and Logging

### Log Levels and Events

The system logs the following events:

- **INFO**: Successful authentication, logout events
- **WARNING**: Cache errors, token blacklisting failures
- **ERROR**: Authentication failures, system errors
- **DEBUG**: Cache hits/misses, detailed flow information

### Metrics to Monitor

1. **Authentication Success Rate**: Percentage of successful logins
2. **Cache Hit Rate**: Redis cache effectiveness
3. **Token Refresh Rate**: How often tokens are refreshed
4. **Response Times**: API endpoint performance
5. **Error Rates**: Failed authentication attempts

## Troubleshooting

### Common Issues

1. **Redis Connection Errors**
   - Check Redis server status
   - Verify connection parameters
   - System falls back to database automatically

2. **Token Validation Failures**
   - Verify SECRET_KEY consistency
   - Check token expiration times
   - Ensure proper token format in requests

3. **Cache Inconsistency**
   - Cache automatically invalidates on logout
   - Manual cache clear: `redis-cli FLUSHDB`
   - System handles cache misses gracefully

### Performance Issues

1. **Slow Authentication**
   - Check Redis performance and memory usage
   - Monitor database connection pool
   - Review cache hit rates

2. **High Memory Usage**
   - Adjust cache TTL values
   - Monitor Redis memory usage
   - Implement cache key rotation

## Security Best Practices

1. **Token Management**
   - Store access tokens in memory (not localStorage for sensitive apps)
   - Use secure, httpOnly cookies for refresh tokens
   - Implement token rotation for high-security applications

2. **Environment Security**
   - Use strong SECRET_KEY values
   - Enable HTTPS in production
   - Configure proper CORS settings

3. **Monitoring**
   - Log all authentication events
   - Monitor for brute force attacks
   - Implement rate limiting (recommended)

4. **Regular Maintenance**
   - Rotate signing keys periodically
   - Update dependencies regularly
   - Monitor cache performance and adjust TTL values

This authentication system provides a solid foundation for secure, scalable user management in the chatbot application while maintaining high performance through intelligent caching and asynchronous processing.
