/**
 * Star Printer Test Script - StarPRNT Mode
 * Send test receipts using Star's native command set
 * 
 * Usage: node test-star-prnt.js
 */

import net from 'net';

// Star Line Mode commands
const ESC = 0x1B;
const LF = 0x0A;

/**
 * Encode text (ASCII only for now)
 */
function encode(text) {
  return Array.from(text).map(c => c.charCodeAt(0));
}

/**
 * Generate StarPRNT format receipt
 */
function generateStarReceipt() {
  const cmd = [];
  
  // Initialize
  cmd.push(ESC, 0x40); // Initialize
  
  // Select international character set (Nordic)
  cmd.push(ESC, 0x52, 0x07); // R 7 = Nordic
  
  // Test 1: Simple text
  cmd.push(ESC, 0x1D, 0x61, 0x01); // Center
  cmd.push(...encode('*** STAR PRINTER TEST ***'));
  cmd.push(LF, LF);
  
  // Test 2: Character width/height
  cmd.push(ESC, 0x69, 0x02, 0x02); // Double width, Double height
  cmd.push(...encode('BABYLON'));
  cmd.push(LF);
  
  cmd.push(ESC, 0x69, 0x01, 0x01); // Normal
  cmd.push(...encode('RAVINTOLA'));
  cmd.push(LF, LF);
  
  // Test 3: Emphasis (Bold)
  cmd.push(ESC, 0x45); // Emphasis on
  cmd.push(...encode('BOLD TEXT TEST'));
  cmd.push(ESC, 0x46); // Emphasis off
  cmd.push(LF, LF);
  
  // Test 4: Different sizes
  cmd.push(ESC, 0x69, 0x00, 0x01); // Normal width, Double height
  cmd.push(...encode('Tall Text'));
  cmd.push(LF);
  
  cmd.push(ESC, 0x69, 0x01, 0x00); // Double width, Normal height
  cmd.push(...encode('Wide Text'));
  cmd.push(LF);
  
  cmd.push(ESC, 0x69, 0x01, 0x01); // Normal
  cmd.push(LF);
  
  // Test 5: Nordic characters (å, ä, ö)
  cmd.push(ESC, 0x1D, 0x61, 0x00); // Left align
  cmd.push(...encode('Nordic chars: '));
  cmd.push(0x5B); // å
  cmd.push(0x7B); // ä  
  cmd.push(0x7C); // ö
  cmd.push(LF, LF);
  
  // Test 6: Line breaks and spacing
  cmd.push(...encode('Line 1'));
  cmd.push(LF);
  cmd.push(...encode('Line 2'));
  cmd.push(LF);
  cmd.push(...encode('Line 3'));
  cmd.push(LF, LF, LF);
  
  // Cut
  cmd.push(ESC, 0x64, 0x02); // Feed and cut
  
  return Buffer.from(cmd);
}

/**
 * Send receipt to printer
 */
function sendToPrinter(host, port) {
  console.log(`\n🖨️  ===== STAR PRNT MODE TEST =====`);
  console.log(`📍 Target: ${host}:${port}`);
  console.log(`🌟 Using StarPRNT commands\n`);
  
  const receipt = generateStarReceipt();
  console.log(`📦 Generated ${receipt.length} bytes`);
  console.log(`📄 Raw data (hex):`, receipt.toString('hex').substring(0, 100), '...\n');
  
  const client = new net.Socket();
  
  client.setTimeout(5000);
  
  client.on('timeout', () => {
    console.error('❌ Connection timeout');
    client.destroy();
    process.exit(1);
  });
  
  client.on('error', (err) => {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  });
  
  client.on('connect', () => {
    console.log(`✅ Connected to ${host}:${port}`);
    console.log(`📤 Sending test receipt...`);
    
    client.write(receipt, () => {
      console.log(`✅ Data sent!`);
      console.log(`⏱️  Waiting for printer...\n`);
      
      setTimeout(() => {
        client.end();
        console.log(`✅ ===== TEST COMPLETE =====\n`);
        console.log(`Check the printer output:`);
        console.log(`  - Should see different text sizes`);
        console.log(`  - BABYLON should be large`);
        console.log(`  - Bold text should be darker`);
        console.log(`  - Nordic characters (å, ä, ö) should display`);
        console.log(``);
        process.exit(0);
      }, 1000);
    });
  });
  
  console.log(`🔌 Connecting...`);
  client.connect(port, host);
}

// Run the test
sendToPrinter('192.168.1.106', 9100);
