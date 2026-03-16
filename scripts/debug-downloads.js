#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== Debug Download Issues ===');
console.log('Current working directory:', process.cwd());
console.log('Node environment:', process.env.NODE_ENV);
console.log('');

// Check if public directory exists
const publicDir = path.join(process.cwd(), 'public');
console.log('Public directory:', publicDir);
console.log('Public directory exists:', fs.existsSync(publicDir));

if (fs.existsSync(publicDir)) {
  console.log('Public directory contents:');
  try {
    const items = fs.readdirSync(publicDir);
    items.forEach(item => {
      const itemPath = path.join(publicDir, item);
      const stats = fs.statSync(itemPath);
      console.log(`  ${item} - ${stats.isDirectory() ? 'DIR' : 'FILE'}`);
    });
  } catch (error) {
    console.error('Error reading public directory:', error.message);
  }
}

console.log('');

// Check uploads directory
const uploadsDir = path.join(publicDir, 'uploads');
console.log('Uploads directory:', uploadsDir);
console.log('Uploads directory exists:', fs.existsSync(uploadsDir));

if (fs.existsSync(uploadsDir)) {
  console.log('Uploads directory contents:');
  try {
    const taskDirs = fs.readdirSync(uploadsDir);
    console.log(`Found ${taskDirs.length} task directories`);
    
    taskDirs.slice(0, 5).forEach(taskDir => {
      const taskDirPath = path.join(uploadsDir, taskDir);
      const stats = fs.statSync(taskDirPath);
      if (stats.isDirectory()) {
        try {
          const files = fs.readdirSync(taskDirPath);
          console.log(`  Task ${taskDir}: ${files.length} files`);
          files.slice(0, 3).forEach(file => {
            const filePath = path.join(taskDirPath, file);
            const fileStats = fs.statSync(filePath);
            console.log(`    - ${file} (${fileStats.size} bytes)`);
          });
        } catch (error) {
          console.error(`    Error reading task ${taskDir}:`, error.message);
        }
      }
    });
    
    if (taskDirs.length > 5) {
      console.log(`  ... and ${taskDirs.length - 5} more task directories`);
    }
  } catch (error) {
    console.error('Error reading uploads directory:', error.message);
  }
}

console.log('');

// Check alternative paths
const alternativePaths = [
  '/var/www/SaaS-polatform/public',
  '/var/www/SaaS-polatform/public/uploads',
  '/var/www/SaaS-polatform/public/uploads/tasks'
];

console.log('Checking alternative paths:');
alternativePaths.forEach(altPath => {
  console.log(`${altPath}: ${fs.existsSync(altPath) ? 'EXISTS' : 'NOT FOUND'}`);
  if (fs.existsSync(altPath)) {
    try {
      const items = fs.readdirSync(altPath);
      console.log(`  Contents: ${items.length} items`);
    } catch (error) {
      console.log(`  Error reading: ${error.message}`);
    }
  }
});

console.log('');
console.log('=== Test API Endpoints ===');
console.log('Test these URLs in your browser:');
console.log('- https://saas-platform.ru/api/attachments/test-id/test');
console.log('- https://saas-platform.ru/api/attachments/YOUR_ATTACHMENT_ID/download');
console.log('');
console.log('Check server logs for detailed error messages.');
