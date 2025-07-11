# Google OAuth Implementation Guide

## 🎯 **Complete Google OAuth Authentication System**

This implementation provides a secure Google OAuth authentication system for your TradeBro application using `google-auth-library` for server-side token verification.

## 📋 **Features**

- ✅ **Server-side Google ID token verification**
- ✅ **Automatic user creation/login**
- ✅ **JWT token generation**
- ✅ **MongoDB integration**
- ✅ **Rate limiting protection**
- ✅ **Comprehensive error handling**
- ✅ **Email verification requirement**
- ✅ **Unique username generation**

## 🔧 **Backend Implementation**

### **Endpoint: POST /api/auth/google**

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4M..."
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "john.doe123",
    "email": "john.doe@gmail.com",
    "fullName": "John Doe",
    "profileImage": "https://lh3.googleusercontent.com/...",
    "authProvider": "google",
    "emailVerified": true
  },
  "isNewUser": false
}
```

**Error Responses:**
```json
// Missing credential
{
  "success": false,
  "message": "Google credential is required"
}

// Invalid token
{
  "success": false,
  "message": "Invalid Google credential"
}

// Email not verified
{
  "success": false,
  "message": "Email verification required"
}
```

## 🗄️ **Database Schema**

### **Enhanced User Model**
```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Not required for OAuth
  fullName: { type: String, default: '' },
  profileImage: { type: String, default: null },
  authProvider: { 
    type: String, 
    enum: ['local', 'google'], 
    default: 'local' 
  },
  googleId: { 
    type: String, 
    unique: true, 
    sparse: true // Allows multiple null values
  },
  emailVerified: { type: Boolean, default: false },
  // ... other fields
});
```

## 🔐 **Security Features**

### **1. Rate Limiting**
- **Window**: 15 minutes
- **Max Requests**: 5 attempts per IP
- **Protection**: Against brute force attacks

### **2. Token Verification**
- **Google ID Token**: Verified using `google-auth-library`
- **Audience Validation**: Ensures token is for your app
- **Email Verification**: Requires verified Google email

### **3. Input Validation**
- **Credential Presence**: Required field validation
- **Token Format**: Google token structure validation
- **Email Requirements**: Must be verified by Google

## 🚀 **Frontend Integration**

### **React.js Example with Google Identity Services**

```javascript
// Install: npm install @google-cloud/local-auth google-auth-library

import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const GoogleAuthComponent = () => {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post('/api/auth/google', {
        credential: credentialResponse.credential
      });

      if (response.data.success) {
        // Store JWT token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Redirect or update UI
        if (response.data.isNewUser) {
          console.log('Welcome new user!');
          // Redirect to onboarding
        } else {
          console.log('Welcome back!');
          // Redirect to dashboard
        }
      }
    } catch (error) {
      console.error('Google auth failed:', error.response?.data?.message);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Sign-In was unsuccessful');
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={handleGoogleError}
      useOneTap
    />
  );
};

export default GoogleAuthComponent;
```

### **HTML Setup**
```html
<!-- Add to your HTML head -->
<script src="https://accounts.google.com/gsi/client" async defer></script>

<!-- In your React app root -->
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <GoogleAuthComponent />
    </GoogleOAuthProvider>
  );
}
```

## ⚙️ **Environment Variables**

```env
# Required for Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
JWT_SECRET=your_jwt_secret_here

# Database
MONGODB_URI=your_mongodb_connection_string

# Optional
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## 🔄 **Flow Diagram**

```
Frontend                    Backend                     Google
   |                          |                          |
   |-- Send credential ------>|                          |
   |                          |-- Verify token --------->|
   |                          |<-- Token payload --------|
   |                          |                          |
   |                          |-- Check user in DB       |
   |                          |-- Create/Update user     |
   |                          |-- Generate JWT           |
   |                          |                          |
   |<-- Return JWT & user ----|                          |
```

## 🧪 **Testing**

### **Manual Testing with Postman**
```bash
POST http://localhost:5001/api/auth/google
Content-Type: application/json

{
  "credential": "ACTUAL_GOOGLE_ID_TOKEN_HERE"
}
```

### **Get Google ID Token for Testing**
1. Go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Select "Google OAuth2 API v2"
3. Authorize and get the ID token
4. Use the token in your API tests

## 🚨 **Error Handling**

The implementation handles various error scenarios:

- **Invalid/Expired Tokens**: Returns 401 with clear message
- **Missing Credentials**: Returns 400 with validation error
- **Database Errors**: Returns 500 with generic message
- **Rate Limiting**: Returns 429 with retry information
- **Email Not Verified**: Returns 400 with verification requirement

## 📝 **Usage Notes**

1. **Existing Users**: If user exists, updates Google info and logs in
2. **New Users**: Creates account with Google info and default settings
3. **Username Generation**: Auto-generates unique username from email
4. **Profile Updates**: Updates profile image and name if not set
5. **JWT Expiration**: Tokens expire in 7 days by default

## 🔧 **Customization**

You can customize the implementation by:

- **Modifying User Schema**: Add/remove fields as needed
- **Changing JWT Expiration**: Update `generateToken()` call
- **Custom Rate Limits**: Modify rate limiting configuration
- **Additional Validation**: Add custom validation logic
- **Response Format**: Customize success/error responses

This implementation provides a robust, secure, and scalable Google OAuth authentication system for your TradeBro application! 🎉
