/**
 * Star mC-Print3 / StarPRNT Formatter
 * Optimized for Star thermal printers using StarPRNT command set
 */

import { ReceiptData, ReceiptSection } from './types';

export class StarFormatter {
  private encoder = new TextEncoder();

  /**
   * Format receipt data for Star printers
   */
  formatReceipt(data: ReceiptData): Uint8Array {
    const commands: number[] = [];

    // Initialize printer
    commands.push(...this.initialize());

    // Set UTF-8 encoding
    commands.push(...this.setEncoding('UTF-8'));

    // Header
    if (data.header) {
      commands.push(...this.center());
      commands.push(...this.bold(true));
      commands.push(...this.textSize(2, 2)); // Double size
      commands.push(...this.text(data.header.text));
      commands.push(...this.lineFeed(2));
      commands.push(...this.bold(false));
      commands.push(...this.textSize(1, 1)); // Normal size
    }

    // Order info
    commands.push(...this.left());
    commands.push(...this.bold(true));
    commands.push(...this.text('TILAUS / ORDER'));
    commands.push(...this.lineFeed());
    commands.push(...this.bold(false));
    commands.push(...this.text('------------------------------'));
    commands.push(...this.lineFeed());

    if (data.orderNumber) {
      commands.push(...this.text(`Tilausnro: ${data.orderNumber}`));
      commands.push(...this.lineFeed());
    }

    // Customer info
    if (data.sections) {
      data.sections.forEach((section: ReceiptSection) => {
        if (section.title) {
          commands.push(...this.bold(true));
          commands.push(...this.text(section.title));
          commands.push(...this.lineFeed());
          commands.push(...this.bold(false));
        }

        section.items.forEach((item: string) => {
          commands.push(...this.text(item));
          commands.push(...this.lineFeed());
        });

        if (section.notes) {
          commands.push(...this.text(section.notes));
          commands.push(...this.lineFeed());
        }

        commands.push(...this.lineFeed());
      });
    }

    // Items
    if (data.items && data.items.length > 0) {
      commands.push(...this.bold(true));
      commands.push(...this.text('TUOTTEET / ITEMS'));
      commands.push(...this.lineFeed());
      commands.push(...this.bold(false));
      commands.push(...this.text('------------------------------'));
      commands.push(...this.lineFeed());

      data.items.forEach((item: any) => {
        const qty = item.quantity || 1;
        const name = item.name || 'Item';
        
        commands.push(...this.bold(true));
        commands.push(...this.text(`${qty}x ${name}`));
        commands.push(...this.lineFeed());
        commands.push(...this.bold(false));

        if (item.size) {
          commands.push(...this.text(`   Koko: ${item.size}`));
          commands.push(...this.lineFeed());
        }

        if (item.toppings && item.toppings.length > 0) {
          item.toppings.forEach((topping: string) => {
            commands.push(...this.text(`   + ${topping}`));
            commands.push(...this.lineFeed());
          });
        }

        if (item.price) {
          commands.push(...this.text(`   ${item.price.toFixed(2)} €`));
          commands.push(...this.lineFeed());
        }

        commands.push(...this.lineFeed());
      });
    }

    // Total
    if (data.total !== undefined) {
      commands.push(...this.text('------------------------------'));
      commands.push(...this.lineFeed());
      commands.push(...this.bold(true));
      commands.push(...this.textSize(2, 2));
      commands.push(...this.text(`YHTEENSÄ: ${data.total.toFixed(2)} €`));
      commands.push(...this.lineFeed());
      commands.push(...this.textSize(1, 1));
      commands.push(...this.bold(false));
    }

    // Footer
    if (data.footer) {
      commands.push(...this.lineFeed(2));
      commands.push(...this.center());
      commands.push(...this.text(data.footer.text));
      commands.push(...this.lineFeed(2));
    }

    // Cut paper (this is crucial to stop printing!)
    commands.push(...this.cutPaper());

    return new Uint8Array(commands);
  }

  /**
   * Initialize printer (Star command)
   */
  private initialize(): number[] {
    return [0x1B, 0x40]; // ESC @
  }

  /**
   * Set encoding to UTF-8 (Star supports UTF-8)
   */
  private setEncoding(encoding: string): number[] {
    if (encoding === 'UTF-8') {
      // Set code page to UTF-8 (Star printers)
      return [0x1B, 0x1D, 0x74, 0x20]; // Select UTF-8
    }
    return [];
  }

  /**
   * Center align text
   */
  private center(): number[] {
    return [0x1B, 0x1D, 0x61, 0x01]; // ESC GS a 1
  }

  /**
   * Left align text
   */
  private left(): number[] {
    return [0x1B, 0x1D, 0x61, 0x00]; // ESC GS a 0
  }

  /**
   * Set bold text
   */
  private bold(enabled: boolean): number[] {
    return [0x1B, 0x45, enabled ? 0x01 : 0x00]; // ESC E n
  }

  /**
   * Set text size (width and height magnification)
   */
  private textSize(width: number, height: number): number[] {
    const size = ((width - 1) << 4) | (height - 1);
    return [0x1B, 0x69, size & 0x07, size & 0x70]; // ESC i (Star command)
  }

  /**
   * Convert text to bytes with UTF-8 encoding
   */
  private text(str: string): number[] {
    // Encode using UTF-8
    const encoded = this.encoder.encode(str);
    return Array.from(encoded);
  }

  /**
   * Line feed
   */
  private lineFeed(lines: number = 1): number[] {
    const commands: number[] = [];
    for (let i = 0; i < lines; i++) {
      commands.push(0x0A); // LF
    }
    return commands;
  }

  /**
   * Cut paper (CRITICAL - stops the printer!)
   */
  private cutPaper(): number[] {
    // Star partial cut command
    return [
      0x1B, 0x64, 0x02, // Feed 2 lines before cut
      0x1B, 0x64, 0x03  // Partial cut
    ];
  }

  /**
   * Generate test receipt
   */
  generateTestReceipt(): Uint8Array {
    const commands: number[] = [];

    commands.push(...this.initialize());
    commands.push(...this.setEncoding('UTF-8'));
    commands.push(...this.center());
    commands.push(...this.bold(true));
    commands.push(...this.textSize(2, 2));
    commands.push(...this.text('TEST PRINT'));
    commands.push(...this.lineFeed(2));
    commands.push(...this.textSize(1, 1));
    commands.push(...this.bold(false));
    commands.push(...this.text('=============================='));
    commands.push(...this.lineFeed());
    commands.push(...this.text('Star mC-Print3 Test'));
    commands.push(...this.lineFeed());
    commands.push(...this.text('Ravintola Babylon'));
    commands.push(...this.lineFeed(2));
    commands.push(...this.left());
    commands.push(...this.text(`Date: ${new Date().toLocaleDateString('fi-FI')}`));
    commands.push(...this.lineFeed());
    commands.push(...this.text(`Time: ${new Date().toLocaleTimeString('fi-FI')}`));
    commands.push(...this.lineFeed(2));
    commands.push(...this.text('Printer Status: OK'));
    commands.push(...this.lineFeed());
    commands.push(...this.text('UTF-8 Test: ä ö å Ä Ö Å € ñ'));
    commands.push(...this.lineFeed(3));
    commands.push(...this.cutPaper());

    return new Uint8Array(commands);
  }
}
