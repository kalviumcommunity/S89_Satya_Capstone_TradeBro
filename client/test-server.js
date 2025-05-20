import http from 'http';
import fs from 'fs';
import path from 'path';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<html><body><h1>Test HTTP Server</h1><p>If you can see this, HTTP is working correctly.</p></body></html>');
});

server.listen(7000, 'localhost', () => {
  console.log('Test server running at http://localhost:7000/');
});
