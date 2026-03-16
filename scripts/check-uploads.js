const fs = require('fs');
const path = require('path');

console.log('=== Checking uploads directory structure ===');

const publicDir = path.join(process.cwd(), 'public');
console.log('Public directory:', publicDir);
console.log('Public directory exists:', fs.existsSync(publicDir));

const uploadsDir = path.join(publicDir, 'uploads');
console.log('Uploads directory:', uploadsDir);
console.log('Uploads directory exists:', fs.existsSync(uploadsDir));

if (fs.existsSync(uploadsDir)) {
  try {
    const tasksDirs = fs.readdirSync(uploadsDir);
    console.log('Task directories:', tasksDirs);
    
    tasksDirs.forEach(taskDir => {
      const taskDirPath = path.join(uploadsDir, taskDir);
      const files = fs.readdirSync(taskDirPath);
      console.log(`Files in ${taskDir}:`, files);
    });
  } catch (error) {
    console.error('Error reading uploads directory:', error);
  }
} else {
  console.log('Creating uploads directory...');
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created successfully');
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
}

console.log('=== Current working directory ===');
console.log('CWD:', process.cwd());
console.log('User:', process.env.USER || 'Unknown');
