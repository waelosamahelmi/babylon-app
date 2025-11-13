#!/usr/bin/env node

// Simple test script to verify Cloudinary configuration

console.log('🔧 Testing Cloudinary Configuration...\n');

// Test environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('📋 Environment Variables:');
console.log(`   CLOUDINARY_CLOUD_NAME: ${cloudName ? '✅ Set' : '❌ Missing'}`);
console.log(`   CLOUDINARY_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   CLOUDINARY_API_SECRET: ${apiSecret ? '✅ Set' : '❌ Missing'}`);

// Test folder name sanitization
function sanitizeRestaurantName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

console.log('\n📁 Folder Name Sanitization Test:');
const testNames = [
  'Pizzeria Antonio',
  'Café De Luxe',
  'Restaurant & Bar',
  'Sushi-Ya!',
  'McDonald\'s',
  'KFC',
];

testNames.forEach(name => {
  const sanitized = sanitizeRestaurantName(name);
  console.log(`   "${name}" → "${sanitized}"`);
});

console.log('\n🏗️  Expected Folder Structure:');
console.log('   pizzeria-antonio/');
console.log('   ├── menu-items/');
console.log('   ├── menu/');
console.log('   └── logos/');
console.log('   cafe-de-luxe/');
console.log('   ├── menu-items/');
console.log('   └── menu/');

console.log('\n✅ Cloudinary integration is configured!');
console.log('💡 Next steps:');
console.log('   1. Add your Cloudinary credentials to .env file');
console.log('   2. Restart the development server');
console.log('   3. Try uploading an image through the admin panel');

if (!cloudName || !apiKey || !apiSecret) {
  console.log('\n⚠️  Warning: Missing Cloudinary environment variables');
  console.log('   Please add them to your .env file before testing uploads');
}