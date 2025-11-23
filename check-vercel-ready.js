#!/usr/bin/env node

console.log('\n🔍 Vercel Deployment Readiness Check\n');

const checks = [
  { name: 'api/index.js exists', path: './api/index.js' },
  { name: 'lib/mongodb.js exists', path: './lib/mongodb.js' },
  { name: 'vercel.json exists', path: './vercel.json' },
  { name: 'package.json exists', path: './package.json' },
  { name: '.vercelignore exists', path: './.vercelignore' }
];

let allGood = true;

checks.forEach(check => {
  try {
    require('fs').accessSync(check.path);
    console.log('✅', check.name);
  } catch {
    console.log('❌', check.name, '- MISSING!');
    allGood = false;
  }
});

console.log('\n📋 Next Steps:\n');
console.log('1. Set environment variables in Vercel Dashboard:');
console.log('   - MONGODB_URI (MongoDB Atlas connection string)');
console.log('   - JWT_SECRET (random secret key)');
console.log('   - REDIS_HOST (optional)');
console.log('   - REDIS_PASSWORD (optional)\n');

console.log('2. Deploy to Vercel:');
console.log('   vercel\n');

console.log('3. Test your deployment:');
console.log('   curl https://your-app.vercel.app/health\n');

if (allGood) {
  console.log('✅ All files present! Ready for deployment.\n');
} else {
  console.log('⚠️  Some files are missing. Please create them first.\n');
}
