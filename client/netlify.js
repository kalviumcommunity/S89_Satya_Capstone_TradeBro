// Netlify configuration script
// This script is used to configure the Netlify deployment

// Export the Netlify configuration
export default {
  // Build settings
  build: {
    publish: "dist",
    command: "npm run netlify-build"
  },
  
  // Redirects
  redirects: [
    {
      from: "/*",
      to: "/index.html",
      status: 200
    }
  ],
  
  // Headers
  headers: [
    {
      for: "/assets/*.js",
      values: {
        "Content-Type": "application/javascript; charset=utf-8",
        "X-Content-Type-Options": "nosniff"
      }
    },
    {
      for: "/*.js",
      values: {
        "Content-Type": "application/javascript; charset=utf-8",
        "X-Content-Type-Options": "nosniff"
      }
    },
    {
      for: "/assets/*.css",
      values: {
        "Content-Type": "text/css; charset=utf-8"
      }
    },
    {
      for: "/*.css",
      values: {
        "Content-Type": "text/css; charset=utf-8"
      }
    },
    {
      for: "/assets/*",
      values: {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  ]
};
