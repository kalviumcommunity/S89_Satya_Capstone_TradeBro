// Netlify build script
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Netlify build process...');

try {
  // Run the build command (without the copy-netlify-config.js part)
  console.log('Building the application...');
  execSync('vite build', { stdio: 'inherit' });

  // Ensure the dist directory exists
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('Error: dist directory not found after build');
    process.exit(1);
  }

  // Copy Netlify configuration files
  console.log('Copying Netlify configuration files...');

  // Files to copy
  const filesToCopy = [
    {
      source: path.join(__dirname, 'netlify.toml'),
      destination: path.join(__dirname, 'dist', 'netlify.toml')
    },
    {
      source: path.join(__dirname, 'public', '_headers'),
      destination: path.join(__dirname, 'dist', '_headers')
    },
    {
      source: path.join(__dirname, 'public', '_redirects'),
      destination: path.join(__dirname, 'dist', '_redirects')
    }
  ];

  // Copy each file
  filesToCopy.forEach(file => {
    try {
      // Read the source file
      const sourceContent = fs.readFileSync(file.source, 'utf8');

      // Write to the destination
      fs.writeFileSync(file.destination, sourceContent);

      console.log(`Successfully copied ${file.source} to ${file.destination}`);
    } catch (error) {
      console.error(`Error copying ${file.source} to ${file.destination}:`, error.message);
    }
  });

  // Create a special _headers file for JavaScript modules
  console.log('Creating special _headers file for JavaScript modules...');
  const specialHeaders = `
# Headers for JavaScript modules
/assets/*.js
  Content-Type: application/javascript; charset=utf-8
  X-Content-Type-Options: nosniff

/*.js
  Content-Type: application/javascript; charset=utf-8
  X-Content-Type-Options: nosniff
`;

  fs.writeFileSync(path.join(__dirname, 'dist', '_headers'), specialHeaders);

  // Process the special index.html file for Netlify
  console.log('Processing special index.html file for Netlify...');

  try {
    // Read the built index.html file
    const builtIndexPath = path.join(__dirname, 'dist', 'index.html');
    const builtIndexContent = fs.readFileSync(builtIndexPath, 'utf8');

    // Extract the main script path from the built index.html
    const scriptMatch = builtIndexContent.match(/<script[^>]*src="([^"]+)"/);

    if (scriptMatch && scriptMatch[1]) {
      const mainScriptPath = scriptMatch[1];
      console.log(`Found main script path: ${mainScriptPath}`);

      // Read the Netlify index template
      const netlifyIndexPath = path.join(__dirname, 'netlify-index.html');
      let netlifyIndexContent = fs.readFileSync(netlifyIndexPath, 'utf8');

      // Replace the placeholder with the actual script path
      netlifyIndexContent = netlifyIndexContent.replace('/assets/main-[hash].js', mainScriptPath);

      // Write the processed index.html to the dist directory
      fs.writeFileSync(builtIndexPath, netlifyIndexContent);
      console.log('Successfully updated index.html for Netlify');
    } else {
      console.error('Could not find main script path in built index.html');
    }
  } catch (error) {
    console.error('Error processing index.html for Netlify:', error.message);
  }

  console.log('Netlify build process completed successfully!');
} catch (error) {
  console.error('Error during Netlify build process:', error.message);
  process.exit(1);
}
