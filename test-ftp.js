/**
 * FTP Connection Test Script
 * Tests different FTP connection methods to Hostinger
 */

import { Client as FTPClient } from 'basic-ftp';

const FTP_HOST = '45.84.205.146';
const FTP_USER = 'u608790032.ravintolababylon.fi';
const FTP_PASS = 'Babylon@2025!';

async function testPlainFTP() {
  console.log('\n=== Test 1: Plain FTP (No Encryption) ===');
  const client = new FTPClient();
  client.ftp.verbose = true;
  
  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: false,
      port: 21
    });
    
    console.log('✅ Plain FTP connection successful!');
    console.log('Current directory:', await client.pwd());
    
    await client.list();
    client.close();
    return true;
  } catch (error) {
    console.error('❌ Plain FTP failed:', error.message);
    client.close();
    return false;
  }
}

async function testFTPSWithIgnoreCert() {
  console.log('\n=== Test 2: FTPS with Ignore Certificate ===');
  const client = new FTPClient();
  client.ftp.verbose = true;
  
  try {
    // Override certificate validation
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: true,
      secureOptions: {
        rejectUnauthorized: false
      },
      port: 21
    });
    
    console.log('✅ FTPS with ignored cert successful!');
    console.log('Current directory:', await client.pwd());
    
    await client.list();
    client.close();
    
    // Reset TLS setting
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    return true;
  } catch (error) {
    console.error('❌ FTPS with ignored cert failed:', error.message);
    client.close();
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    return false;
  }
}

async function testExplicitFTP() {
  console.log('\n=== Test 3: Explicit FTP (disable auto-upgrade) ===');
  const client = new FTPClient();
  client.ftp.verbose = true;
  
  try {
    // Prevent automatic TLS upgrade
    const originalSend = client.ftp.socket.write;
    client.ftp.socket.write = function(data) {
      if (data.toString().includes('AUTH TLS')) {
        console.log('🚫 Blocking AUTH TLS command');
        return;
      }
      return originalSend.apply(this, arguments);
    };
    
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: false,
      port: 21
    });
    
    console.log('✅ Explicit plain FTP successful!');
    console.log('Current directory:', await client.pwd());
    
    await client.list();
    client.close();
    return true;
  } catch (error) {
    console.error('❌ Explicit FTP failed:', error.message);
    client.close();
    return false;
  }
}

async function main() {
  console.log('🔌 Testing Hostinger FTP Connection Methods...\n');
  console.log(`Host: ${FTP_HOST}`);
  console.log(`User: ${FTP_USER}`);
  console.log(`Port: 21\n`);
  
  const results = {
    plainFTP: await testPlainFTP(),
    ftpsIgnoreCert: await testFTPSWithIgnoreCert(),
    explicitFTP: await testExplicitFTP()
  };
  
  console.log('\n=== Test Results ===');
  console.log('Plain FTP:', results.plainFTP ? '✅ SUCCESS' : '❌ FAILED');
  console.log('FTPS (Ignore Cert):', results.ftpsIgnoreCert ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Explicit FTP:', results.explicitFTP ? '✅ SUCCESS' : '❌ FAILED');
  
  if (results.ftpsIgnoreCert) {
    console.log('\n💡 Recommendation: Use FTPS with rejectUnauthorized: false');
  } else if (results.plainFTP) {
    console.log('\n💡 Recommendation: Use plain FTP (secure: false)');
  }
}

main().catch(console.error);
