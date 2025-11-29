/**
 * Modern Star Receipt Formatter
 * Based on Star Micronics CloudPRNT SDK best practices
 * Optimized for mC-Print3 and Star Line Mode printers
 */

import { ReceiptData } from './types';

// ESC/POS & Star Command constants
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

/**
 * Translate payment method to Finnish
 */
function translatePaymentMethod(method: string): string {
  const translations: Record<string, string> = {
    'card': 'Kortti',
    'credit card': 'Kortti',
    'debit card': 'Kortti',
    'cash': 'Käteinen',
    'stripe': 'Kortti',
    'online': 'Verkkomaksu',
    'cash_or_card': 'Käteinen tai kortti',
    'cash or card': 'Käteinen tai kortti'
  };
  
  return translations[method.toLowerCase()] || method;
}

export class StarModernReceipt {
  private cmd: number[] = [];
  
  // Initialize printer with proper settings
  private init(): void {
    // ESC @ - Initialize printer
    this.cmd.push(ESC, 0x40);
    // Set code page to CP850 (Multilingual Latin I) for Finnish
    this.cmd.push(ESC, 0x74, 0x02);
  }
  
  // Encode text with CP850 for Finnish characters
  private encode(text: string): number[] {
    const bytes: number[] = [];
    
    for (const char of text) {
      switch (char) {
        case 'ä': bytes.push(0x84); break;
        case 'Ä': bytes.push(0x8E); break;
        case 'ö': bytes.push(0x94); break;
        case 'Ö': bytes.push(0x99); break;
        case 'å': bytes.push(0x86); break;
        case 'Å': bytes.push(0x8F); break;
        case 'é': bytes.push(0x82); break;
        case '€': bytes.push(0xEE); break;
        default:
          const code = char.charCodeAt(0);
          bytes.push(code < 128 ? code : 0x3F);
      }
    }
    
    return bytes;
  }
  
  private text(str: string): void {
    this.cmd.push(...this.encode(str));
  }
  
  private nl(count: number = 1): void {
    for (let i = 0; i < count; i++) this.cmd.push(LF);
  }
  
  // ESC a n - Set alignment (0=left, 1=center, 2=right)
  private align(n: 0 | 1 | 2): void {
    this.cmd.push(ESC, 0x61, n);
  }
  
  // GS ! n - Set character size (width and height)
  private size(w: number, h: number): void {
    const ww = Math.max(0, Math.min(7, w - 1));
    const hh = Math.max(0, Math.min(7, h - 1));
    this.cmd.push(GS, 0x21, (ww << 4) | hh);
  }
  
  // ESC E n - Set bold
  private bold(on: boolean): void {
    this.cmd.push(ESC, 0x45, on ? 1 : 0);
  }
  
  // ESC - n - Set underline
  private underline(on: boolean): void {
    this.cmd.push(ESC, 0x2D, on ? 1 : 0);
  }
  
  // Two-column layout
  private cols(left: string, right: string, width: number = 48): void {
    const rLen = right.length;
    const lMax = width - rLen;
    const lText = left.length > lMax ? left.substring(0, lMax - 2) + '..' : left;
    const pad = ' '.repeat(Math.max(0, width - lText.length - rLen));
    this.text(lText + pad + right);
    this.nl();
  }
  
  // Generate QR code for website
  private qr(url: string): void {
    // GS ( k - QR Code
    const data = this.encode(url);
    const pL = (data.length + 3) % 256;
    const pH = Math.floor((data.length + 3) / 256);
    
    // Model
    this.cmd.push(GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // Size
    this.cmd.push(GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x08);
    // Error correction L
    this.cmd.push(GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30);
    // Store data
    this.cmd.push(GS, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...data);
    // Print
    this.cmd.push(GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);
  }
  
  // Cut paper
  private cut(): void {
    this.cmd.push(GS, 0x56, 0x00); // Partial cut
  }
  
  /**
   * Generate complete modern receipt
   */
  public static generate(data: ReceiptData, originalOrder?: any): Uint8Array {
    const r = new StarModernReceipt();
    r.init();
    
    // ═══════════════════════════════════════
    // HEADER - Restaurant Name & Info
    // ═══════════════════════════════════════
    r.align(1);
    r.nl(2);
    r.bold(true);
    r.size(3, 3);
    r.text('BABYLON');
    r.nl();
    r.size(2, 2);
    r.text('RAVINTOLA');
    r.nl();
    r.bold(false);
    r.size(1, 1);
    r.nl();
    r.text('Vapaudenkatu 28, 15140 Lahti');
    r.nl();
    r.text('+358-3781-2222');
    r.nl(2);
    r.text('--------------------------------');
    r.nl(2);
    
    // ═══════════════════════════════════════
    // ORDER NUMBER (Prominent)
    // ═══════════════════════════════════════
    r.bold(true);
    r.size(3, 3);
    r.text(`#${data.orderNumber}`);
    r.nl();
    r.bold(false);
    r.size(1, 1);
    r.nl();
    
    // Date & Time
    const date = data.timestamp.toLocaleDateString('fi-FI');
    const time = data.timestamp.toLocaleTimeString('fi-FI', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    r.text(`${date} klo ${time}`);
    r.nl(2);
    
    // Order Type
    r.bold(true);
    r.size(2, 2);
    const orderType = data.orderType === 'delivery' ? 'KOTIINKULJETUS' : 'NOUTO';
    r.text(orderType);
    r.nl();
    r.size(1, 1);
    r.bold(false);
    r.nl();
    
    if (data.paymentMethod) {
      const payment = translatePaymentMethod(data.paymentMethod);
      r.text(`Maksutapa: ${payment}`);
      r.nl();
    }
    
    r.nl();
    r.text('--------------------------------');
    r.nl(2);
    
    // ═══════════════════════════════════════
    // CUSTOMER INFO (if available)
    // ═══════════════════════════════════════
    if (data.customerName || data.customerPhone || data.deliveryAddress) {
      r.bold(true);
      r.underline(true);
      r.text('ASIAKASTIEDOT');
      r.nl();
      r.underline(false);
      r.bold(false);
      r.nl();
      r.align(0);
      
      if (data.customerName) {
        r.bold(true);
        r.text('Nimi: ');
        r.bold(false);
        r.text(data.customerName);
        r.nl();
      }
      
      if (data.customerPhone) {
        r.bold(true);
        r.text('Puh: ');
        r.bold(false);
        r.text(data.customerPhone);
        r.nl();
      }
      
      if (data.deliveryAddress) {
        r.bold(true);
        r.text('Osoite:');
        r.nl();
        r.bold(false);
        data.deliveryAddress.split('\n').forEach(line => {
          r.text('  ' + line.trim());
          r.nl();
        });
      }
      
      r.nl();
      r.align(1);
      r.text('--------------------------------');
      r.nl(2);
    }
    
    // ═══════════════════════════════════════
    // ITEMS
    // ═══════════════════════════════════════
    r.bold(true);
    r.underline(true);
    r.text('TUOTTEET');
    r.nl();
    r.underline(false);
    r.bold(false);
    r.text('================================');
    r.nl(2);
    
    r.align(0);
    
    for (const item of data.items) {
      // Item name and price
      const itemName = `${item.quantity}x ${item.name}`;
      const itemPrice = `${item.totalPrice.toFixed(2)}€`;
      
      r.bold(true);
      r.size(2, 2);
      r.cols(itemName, itemPrice, 24);
      r.size(1, 1);
      r.bold(false);
      
      // Toppings
      if (item.toppings && item.toppings.length > 0) {
        r.text('  Lisatatteet:');
        r.nl();
        
        item.toppings.forEach((topping: { name: string; price: number }) => {
          const toppingName = `    + ${topping.name}`;
          const toppingPrice = topping.price > 0 ? `+${topping.price.toFixed(2)}€` : '';
          
          if (toppingPrice) {
            r.cols(toppingName, toppingPrice, 48);
          } else {
            r.text(toppingName);
            r.nl();
          }
        });
        r.nl();
      }
      
      // Notes
      if (item.notes) {
        const cleanNotes = item.notes
          .split(';')
          .filter(p => !p.toLowerCase().includes('size:') && !p.toLowerCase().includes('toppings:'))
          .map(p => p.trim())
          .filter(p => p.length > 0)
          .join('; ');
          
        if (cleanNotes) {
          r.text('  Huom: ' + cleanNotes);
          r.nl();
        }
      }
      
      r.text('- - - - - - - - - - - - - - - -');
      r.nl();
    }
    
    // ═══════════════════════════════════════
    // SPECIAL INSTRUCTIONS
    // ═══════════════════════════════════════
    if (originalOrder?.specialInstructions || originalOrder?.special_instructions) {
      const instructions = originalOrder.specialInstructions || originalOrder.special_instructions;
      
      r.nl();
      r.align(1);
      r.bold(true);
      r.text('ERIKOISOHJEET');
      r.nl();
      r.bold(false);
      r.align(0);
      r.nl();
      
      // Word wrap at 46 chars
      const words = instructions.split(' ');
      let line = '';
      
      for (const word of words) {
        if ((line + ' ' + word).length > 46) {
          if (line) {
            r.text('  ' + line);
            r.nl();
          }
          line = word;
        } else {
          line = line ? line + ' ' + word : word;
        }
      }
      
      if (line) {
        r.text('  ' + line);
        r.nl();
      }
      
      r.nl();
      r.align(1);
    }
    
    // ═══════════════════════════════════════
    // TOTALS
    // ═══════════════════════════════════════
    r.align(1);
    r.text('================================');
    r.nl();
    r.bold(true);
    r.underline(true);
    r.text('YHTEENVETO');
    r.nl();
    r.underline(false);
    r.bold(false);
    r.text('================================');
    r.nl(2);
    
    r.align(0);
    r.size(2, 2);
    
    if (originalOrder?.subtotal) {
      r.cols('Välisumma:', `${parseFloat(originalOrder.subtotal).toFixed(2)}€`, 24);
    }
    
    if (originalOrder?.deliveryFee && parseFloat(originalOrder.deliveryFee) > 0) {
      r.cols('Toimitusmaksu:', `${parseFloat(originalOrder.deliveryFee).toFixed(2)}€`, 24);
    }
    
    if (originalOrder?.smallOrderFee && parseFloat(originalOrder.smallOrderFee) > 0) {
      r.cols('Pientilauslisa:', `${parseFloat(originalOrder.smallOrderFee).toFixed(2)}€`, 24);
    }
    
    if (originalOrder?.discount && parseFloat(originalOrder.discount) > 0) {
      r.cols('Alennus:', `-${parseFloat(originalOrder.discount).toFixed(2)}€`, 24);
    }
    
    r.nl();
    r.bold(true);
    r.size(3, 3);
    r.cols('YHTEENSA:', `${data.total.toFixed(2)}€`, 16);
    r.size(1, 1);
    r.bold(false);
    
    // ═══════════════════════════════════════
    // FOOTER - QR Code & Thank You
    // ═══════════════════════════════════════
    r.nl(2);
    r.align(1);
    r.text('================================');
    r.nl(2);
    
    r.text('Kiitos tilauksestasi!');
    r.nl();
    r.text('Tervetuloa uudelleen!');
    r.nl(2);
    
    // QR Code to website
    r.qr('https://ravintolababylon.fi');
    r.nl(2);
    
    r.text('ravintolababylon.fi');
    r.nl(3);
    
    // Cut
    r.cut();
    
    return new Uint8Array(r.cmd);
  }
}
