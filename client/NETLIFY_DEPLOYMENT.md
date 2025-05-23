# TradeBro Netlify Deployment Guide

This guide provides detailed instructions for deploying the TradeBro application to Netlify, specifically addressing MIME type issues.

## Prerequisites

- A Netlify account
- The TradeBro codebase

## Deployment Steps

### 1. Build the Application for Netlify

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Build the application using the Netlify build script
npm run netlify-build
```

This will create a `dist` directory with the built application, specifically configured for Netlify deployment.

### 2. Deploy to Netlify

#### Option 1: Netlify UI (Recommended)

1. Log in to your Netlify account
2. Click "Add new site" > "Import an existing project"
3. Connect to your Git provider and select the repository
4. Configure the build settings:
   - Build command: `npm run netlify-build`
   - Publish directory: `dist`
5. Click "Deploy site"

#### Option 2: Netlify CLI

1. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Log in to Netlify:
   ```bash
   netlify login
   ```

3. Deploy the site:
   ```bash
   netlify deploy --prod
   ```

4. When prompted, select the `dist` directory as the publish directory

#### Option 3: Manual Upload (Most Reliable for MIME Type Issues)

1. Build the application using the Netlify build script:
   ```bash
   npm run netlify-build
   ```

2. Log in to your Netlify account
3. Click "Add new site" > "Deploy manually"
4. Drag and drop the entire `dist` directory to the upload area
5. Wait for the upload to complete
6. Click "Deploy site"

### 3. Environment Variables

Make sure to set the following environment variables in Netlify:

- `VITE_API_BASE_URL`: The URL of your backend API (e.g., `https://s89-satya-capstone-tradebro.onrender.com`)
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth client ID (if using Google authentication)

### 4. Troubleshooting MIME Type Issues

If you still encounter MIME type issues after deployment:

1. **Check the Headers**: Go to Site settings > Headers in the Netlify dashboard and verify that the following headers are set:
   ```
   /assets/*.js
     Content-Type: application/javascript; charset=utf-8
     X-Content-Type-Options: nosniff

   /*.js
     Content-Type: application/javascript; charset=utf-8
     X-Content-Type-Options: nosniff
   ```

2. **Clear Browser Cache**: Have users clear their browser cache or try in an incognito window.

3. **Verify Netlify Configuration**: Make sure the `netlify.toml` file is properly deployed.

4. **Check for 404 Errors**: If you see 404 errors in the console, check that all assets are properly included in the deployment.

### 5. Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#netlify)
- [Troubleshooting MIME Type Issues](https://docs.netlify.com/routing/headers/#content-type-and-cache-control)

## Important Files

- `netlify.toml`: Configuration for Netlify
- `public/_headers`: HTTP headers for Netlify
- `public/_redirects`: Redirect rules for SPA routing
- `netlify-build.js`: Script to build the application for Netlify
- `netlify-index.html`: Template for the index.html file with custom script loading
