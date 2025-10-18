# Z92 Built-in Printer Connection Guide

## Overview
The Z92 Android POS device has a built-in thermal printer that appears as "BluetoothPrint" in the Bluetooth settings. Unlike external Bluetooth printers, this printer uses Android's native printing framework instead of BLE connections.

## How It Works

### Detection
When you manually add a Bluetooth printer with:
- **Name**: BluetoothPrint
- **MAC Address**: 66:11:22:33:44:55 (or actual MAC)

The system automatically detects it's the Z92's built-in printer.

### Connection Process
1. **User clicks "Connect"** on the BluetoothPrint printer
2. **System detects** printer name contains "bluetoothprint"
3. **Uses Z92PrinterPlugin** (Android native) instead of BLE
4. **Checks availability** of Android Print Manager
5. **Marks printer as connected** if Print Manager is available

### Printing Process
1. **User initiates print** (e.g., new order receipt)
2. **System checks** if printer is BluetoothPrint
3. **Uses Z92PrinterService** to format and send print job
4. **Android Print Manager** handles the actual printing
5. **Print dialog may appear** (Android system UI)

## Technical Implementation

### Native Android Plugin
**File**: `Z92PrinterPlugin.java`
- `isZ92PrinterAvailable()` - Checks if Print Manager is available
- `printText()` - Prints text using WebView and Print Manager
- `testPrint()` - Sends a test receipt

### TypeScript Service
**File**: `z92-printer.ts`
- `isAvailable()` - Check if Z92 printer is ready
- `print(text)` - Print formatted text
- `testPrint()` - Send test receipt
- `printOrder(order)` - Format and print order receipt

### Printer Context Integration
**File**: `printer-context.tsx`

When connecting to a Bluetooth printer:
```typescript
if (printer.name.toLowerCase().includes('bluetoothprint')) {
  // Use Z92 native printing
  const z92Printer = new Z92PrinterService();
  const available = await z92Printer.isAvailable();
  // Mark as connected if available
} else {
  // Use BLE for external Bluetooth printers
}
```

## Why This Approach?

### Problem with BLE Connection
- Z92's built-in printer is NOT a separate BLE device
- MAC address doesn't correspond to a BLE deviceId
- BLE scan cannot find it because it's part of the device itself

### Solution: Native Printing API
- Android Print Manager is designed for this use case
- Directly accesses built-in printer hardware
- No need for BLE pairing or connection
- More reliable for built-in printers

## User Experience

### Connection
1. Go to **Discovery** tab
2. Click **Manual Bluetooth Entry**
3. Enter:
   - Name: `BluetoothPrint`
   - MAC: `66:11:22:33:44:55`
4. Click **Add Bluetooth Printer**
5. Go to **Printers** tab
6. Click **Connect** on BluetoothPrint
7. See "Z92 built-in printer ready" success message

### Printing
When an order comes in:
- System automatically uses Z92PrinterService
- Formats receipt with order details
- Sends to Android Print Manager
- Receipt prints from built-in printer

## Testing

### Test Print
1. Connect to BluetoothPrint
2. Click **Test Print** button
3. Should see Android print dialog
4. Receipt should print with:
   - "TEST RECEIPT" header
   - Current date/time
   - Device info
   - Confirmation message

### Order Print
1. Receive a new order
2. System automatically prints receipt
3. Verify all order details appear correctly

## Troubleshooting

### "Z92 built-in printer not available"
- Check Android Print Manager is enabled
- Verify device is actually a Z92
- Check printer hardware is functioning

### Print dialog appears but nothing prints
- Built-in printer may be offline
- Check printer paper
- Restart device

### Connection fails immediately
- Verify printer name contains "bluetoothprint"
- Check Z92PrinterPlugin is registered
- Review Android logs for errors

## Benefits

✅ **No BLE complexity** - Direct access to built-in printer
✅ **More reliable** - Uses Android's native printing framework
✅ **Automatic detection** - Recognizes BluetoothPrint by name
✅ **No pairing required** - Built-in printer is always "paired"
✅ **Better error handling** - Android Print Manager provides feedback

## Files Modified

1. `Z92PrinterPlugin.java` - New native Android plugin
2. `z92-printer.ts` - New TypeScript service wrapper
3. `printer-context.tsx` - Updated connection logic
4. `MainActivity.java` - Registered Z92PrinterPlugin
5. `printer-management-modal.tsx` - Manual entry with defaults

## Next Steps

Once connected:
1. Test with a real order
2. Verify receipt formatting
3. Adjust print layout if needed
4. Configure auto-print settings
