# Z92 Printer Plugin Test

## Quick Plugin Test

To verify the Z92PrinterPlugin is working, open the browser console in the app and run:

```javascript
// Test if plugin is available
const testZ92Plugin = async () => {
  try {
    console.log('Testing Z92 Printer Plugin...');
    
    // Import the plugin
    const { registerPlugin } = await import('@capacitor/core');
    const Z92Printer = registerPlugin('Z92Printer');
    
    console.log('Plugin imported:', Z92Printer);
    
    // Test availability
    const result = await Z92Printer.isZ92PrinterAvailable();
    console.log('Availability result:', result);
    
    if (result.available) {
      console.log('✅ Z92 Printer is AVAILABLE!');
      console.log('Message:', result.message);
    } else {
      console.log('❌ Z92 Printer is NOT available');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Plugin test failed:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return { error: error.message };
  }
};

// Run the test
testZ92Plugin();
```

## Expected Results

### If Working:
```
Testing Z92 Printer Plugin...
Plugin imported: Proxy {...}
Availability result: {available: true, message: "Z92 built-in printer service available"}
✅ Z92 Printer is AVAILABLE!
Message: Z92 built-in printer service available
```

### If Plugin Not Registered:
```
Testing Z92 Printer Plugin...
❌ Plugin test failed: Error: "Z92Printer" plugin is not implemented on android
```
**Fix**: Check MainActivity.java has `registerPlugin(Z92PrinterPlugin.class);`

### If Print Manager Disabled:
```
Testing Z92 Printer Plugin...
Plugin imported: Proxy {...}
Availability result: {available: false, message: "Z92 built-in printer service available"}
❌ Z92 Printer is NOT available
```
**Fix**: Enable Print Service in Android Settings

## Alternative: Test from Settings

You can also add a test button in the app. Add this to your settings/admin page:

```typescript
import { Z92PrinterService } from '@/lib/z92-printer';

const TestZ92Button = () => {
  const testPrinter = async () => {
    const z92 = new Z92PrinterService();
    
    console.log('Testing Z92 printer...');
    const available = await z92.isAvailable();
    
    if (available) {
      alert('✅ Z92 Printer is available!');
      
      // Try test print
      try {
        await z92.testPrint();
        alert('Test print sent!');
      } catch (e) {
        alert('Test print failed: ' + e.message);
      }
    } else {
      alert('❌ Z92 Printer not available');
    }
  };
  
  return (
    <button onClick={testPrinter}>
      Test Z92 Printer
    </button>
  );
};
```

## Logcat Command

To see Android native logs:

```bash
# Windows PowerShell
adb logcat | Select-String "Z92Printer"

# Windows CMD
adb logcat | findstr "Z92Printer"

# Mac/Linux
adb logcat | grep "Z92Printer"
```

Look for:
```
D/Z92Printer: isZ92PrinterAvailable called
D/Z92Printer: Context obtained: true
D/Z92Printer: PrintManager obtained: true
D/Z92Printer: Returning available: true
```
