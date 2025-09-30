const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Route Verification Script
 * Checks all routes are properly loaded and accessible
 */
class RouteVerifier {
  constructor() {
    this.routesDir = path.join(__dirname, '../routes');
    this.results = {
      total: 0,
      loaded: 0,
      failed: 0,
      routes: []
    };
  }

  /**
   * Verify all route files can be loaded
   */
  async verifyAllRoutes() {
    console.log('🔍 Verifying all routes...\n');

    try {
      const routeFiles = fs.readdirSync(this.routesDir)
        .filter(file => file.endsWith('.js'));

      this.results.total = routeFiles.length;

      for (const file of routeFiles) {
        await this.verifyRoute(file);
      }

      this.displayResults();
      return this.results;

    } catch (error) {
      console.error('❌ Route verification failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Verify individual route file
   */
  async verifyRoute(filename) {
    const routePath = path.join(this.routesDir, filename);
    const routeName = filename.replace('.js', '');

    try {
      // Clear require cache to ensure fresh load
      delete require.cache[require.resolve(routePath)];
      
      // Try to require the route
      const route = require(routePath);
      
      // Check if it's a valid Express router
      const isValidRouter = route && typeof route === 'function' && route.stack;
      
      if (isValidRouter) {
        const endpoints = this.extractEndpoints(route);
        
        this.results.loaded++;
        this.results.routes.push({
          name: routeName,
          status: 'loaded',
          endpoints: endpoints.length,
          methods: [...new Set(endpoints.map(e => e.method))],
          paths: endpoints.map(e => e.path)
        });
        
        console.log(`✅ ${routeName} - ${endpoints.length} endpoints`);
      } else {
        throw new Error('Not a valid Express router');
      }

    } catch (error) {
      this.results.failed++;
      this.results.routes.push({
        name: routeName,
        status: 'failed',
        error: error.message
      });
      
      console.log(`❌ ${routeName} - ${error.message}`);
    }
  }

  /**
   * Extract endpoints from router
   */
  extractEndpoints(router) {
    const endpoints = [];
    
    if (router.stack) {
      router.stack.forEach(layer => {
        if (layer.route) {
          // Regular route
          const methods = Object.keys(layer.route.methods);
          methods.forEach(method => {
            endpoints.push({
              method: method.toUpperCase(),
              path: layer.route.path
            });
          });
        } else if (layer.name === 'router') {
          // Nested router
          const nestedEndpoints = this.extractEndpoints(layer.handle);
          endpoints.push(...nestedEndpoints);
        }
      });
    }
    
    return endpoints;
  }

  /**
   * Display verification results
   */
  displayResults() {
    console.log('\n📊 Route Verification Results');
    console.log('='.repeat(40));
    console.log(`Total Routes: ${this.results.total}`);
    console.log(`✅ Loaded: ${this.results.loaded}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.loaded / this.results.total) * 100).toFixed(1)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ Failed Routes:');
      this.results.routes
        .filter(r => r.status === 'failed')
        .forEach(route => {
          console.log(`  • ${route.name}: ${route.error}`);
        });
    }

    console.log('\n📋 Route Summary:');
    this.results.routes
      .filter(r => r.status === 'loaded')
      .forEach(route => {
        console.log(`  • ${route.name}: ${route.endpoints} endpoints [${route.methods.join(', ')}]`);
      });
  }

  /**
   * Verify server integration
   */
  async verifyServerIntegration() {
    console.log('\n🔗 Verifying server integration...');
    
    const serverPath = path.join(__dirname, '../server.js');
    
    try {
      const serverContent = fs.readFileSync(serverPath, 'utf8');
      
      // Check if enhanced chatbot routes are included
      const hasEnhancedChatbot = serverContent.includes('chatbotRoutes');
      const hasAllRoutes = this.results.routes
        .filter(r => r.status === 'loaded')
        .every(route => {
          const routeVar = route.name.includes('Routes') ? route.name : `${route.name}Routes`;
          return serverContent.includes(routeVar) || serverContent.includes(route.name);
        });

      console.log(`✅ Enhanced chatbot routes: ${hasEnhancedChatbot ? 'Integrated' : 'Missing'}`);
      console.log(`📊 Route integration: ${hasAllRoutes ? 'Complete' : 'Incomplete'}`);

      return {
        enhancedChatbot: hasEnhancedChatbot,
        allRoutesIntegrated: hasAllRoutes
      };

    } catch (error) {
      console.error('❌ Server integration check failed:', error.message);
      return { error: error.message };
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new RouteVerifier();
  
  verifier.verifyAllRoutes()
    .then(async (results) => {
      await verifier.verifyServerIntegration();
      
      if (results.failed === 0) {
        console.log('\n🎉 All routes verified successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Some routes failed verification.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = RouteVerifier;