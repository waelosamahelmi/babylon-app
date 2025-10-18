# 🔍 DIRECTPRINT PLUGIN - DEBUGGING GUIDE

## ✅ What's Been Fixed

1. **Added better error detection** in `direct-print.ts`
2. **Added platform checks** - won't try to run on web
3. **Added plugin availability checks** - detects if plugin is registered
4. **Clean build completed** - DirectPrintPlugin compiled successfully

## 🧪 How to Test & Debug

### Step 1: Install Fresh APK
```powershell
cd C:\Projects\restaurant\android-admin-app\android\app\build\outputs\apk\debug
adb install -r app-debug.apk
```

### Step 2: Open Chrome DevTools
1. Connect device via USB
2. Open Chrome on your computer
3. Go to: `chrome://inspect`
4. Click **"Inspect"** under your app
5. Go to **Console** tab

### Step 3: Click "Test Print (System)" Button
- Open admin app
- Go to Printer Settings → Discovery tab
- Click the big blue **"Test Print (System)"** button
- **Watch the console logs**

## 📊 What Logs Tell You

### ✅ Plugin Works - Success Path:
```
[DirectPrint] Plugin is available, checking service...
[DirectPrint] Availability result: { available: true, message: "Print service ready" }
✅ System print service detected! Sending test print...
[DirectPrint] Running test print...
[DirectPrint] Test print result: { success: true, ... }
```
**Result:** Android print dialog appears! Select printer and tap Print.

### ❌ Plugin NOT Registered:
```
[DirectPrint] Not running on Android platform  // If on web
```
OR
```
[DirectPrint] Plugin not available! Check MainActivity registration.
[DirectPrint] Make sure DirectPrintPlugin is registered in MainActivity.java
DirectPrint plugin not implemented. Check MainActivity.java registration.
```
**Fix:** Plugin registration issue (shouldn't happen - we registered it)

### ⚠️ Plugin Registered BUT Print Service Unavailable:
```
[DirectPrint] Plugin is available, checking service...
[DirectPrint] Availability result: { available: false, message: "Print service not available" }
⚠️ No system print service found, trying other methods...
```
**Fix:** LocalPrintService not enabled on device

## 🔧 Troubleshooting Steps

### If: "Plugin not available"

**Check 1:** Verify MainActivity.java has registration
```powershell
cd C:\Projects\restaurant\android-admin-app
code android\app\src\main\java\com\restaurant\ordermaster\MainActivity.java
```
Look for line 21:
```java
registerPlugin(DirectPrintPlugin.class);
```

**Check 2:** Verify DirectPrintPlugin.java exists
```powershell
dir android\app\src\main\java\com\restaurant\ordermaster\DirectPrintPlugin.java
```
Should show the file (69,066 bytes)

**Check 3:** Check Android logs
```powershell
adb logcat -s MainActivity DirectPrint
```
Look for:
```
MainActivity: ✅ DirectPrintPlugin registered for LocalPrintService support
```

### If: "Print service not available"

**Option 1: Enable LocalPrintService**
1. Settings → Printing
2. Find "LocalPrintService" or "Print Service"
3. Toggle ON
4. Go back to app and try again

**Option 2: Add Printer Through Android Settings**
1. Settings → Printing → Add Service
2. Select your Z92 printer
3. Return to app and try again

**Option 3: Check Print Service Status**
```powershell
adb shell dumpsys print
```
Look for enabled print services.

### If: Print Dialog Appears But Printer Not Listed

**Option 1: Restart Print Service**
1. Settings → Apps → Print Service
2. Force Stop
3. Clear Cache
4. Return to app and try again

**Option 2: Restart Device**
Sometimes print services need a reboot to detect built-in printers.

## 📱 Alternative Testing Methods

### Method 1: Test from Chrome DevTools Console
```javascript
// Paste this in Chrome DevTools console:
const { directPrint } = await import('./lib/direct-print.js');
await directPrint.testPrint();
```

### Method 2: Test Plugin Availability
```javascript
// Check if plugin is registered:
Capacitor.isPluginAvailable('DirectPrint')
// Should return: true
```

### Method 3: Call Plugin Directly
```javascript
// Direct plugin call:
const DirectPrint = Capacitor.Plugins.DirectPrint;
const result = await DirectPrint.isAvailable();
console.log('DirectPrint availability:', result);
```

## 🎯 Expected Behavior Matrix

| Scenario | Console Output | UI Result |
|----------|---------------|-----------|
| ✅ Everything works | "Plugin is available" + "service detected" | Print dialog opens |
| ⚠️ Plugin works, no service | "Plugin is available" + "service not found" | Toast: falls back to other methods |
| ❌ Plugin not registered | "Plugin not available" | Error toast |
| ❌ Running on web | "Not running on Android" | Silent fail |

## 🔍 Deep Debugging - If Nothing Works

### Step 1: Verify Plugin Compiled
```powershell
cd C:\Projects\restaurant\android-admin-app\android
.\gradlew :app:dependencies | Select-String "DirectPrint"
```

### Step 2: Check APK Contains Plugin
```powershell
cd android\app\build\outputs\apk\debug
jar tf app-debug.apk | Select-String "DirectPrintPlugin"
```
Should show:
```
com/restaurant/ordermaster/DirectPrintPlugin.class
```

### Step 3: Full Android Logs
```powershell
adb logcat | Select-String "DirectPrint|MainActivity|Print"
```

### Step 4: Decompile APK (Advanced)
```powershell
# Install apktool if needed
choco install apktool

# Decompile APK
apktool d app-debug.apk

# Check if DirectPrintPlugin exists
dir app-debug\smali\com\restaurant\ordermaster\ | Select-String "DirectPrint"
```

## 📋 Checklist Before Asking for Help

- [ ] Fresh APK installed (`adb install -r`)
- [ ] Chrome DevTools open and console visible
- [ ] Clicked "Test Print (System)" button
- [ ] Captured console logs (screenshot)
- [ ] Captured Android logs: `adb logcat -s DirectPrint`
- [ ] Checked Settings → Printing for LocalPrintService
- [ ] Tried restarting the app
- [ ] Tried restarting the device

## 🎉 Success Indicators

You'll know DirectPrint plugin is working when:
1. ✅ Console shows "Plugin is available, checking service..."
2. ✅ No error about "not implemented"
3. ✅ Android print dialog appears
4. ✅ Can select printer in dialog

If you see the print dialog, **the plugin is working!** The next step is just selecting the right printer.

---

## 📞 What to Report

If still not working, provide:
1. **Console logs** (full output after clicking button)
2. **Android logs**: `adb logcat -s DirectPrint MainActivity`
3. **Device model**: Z92
4. **Android version**: Check Settings → About
5. **Print services enabled**: Settings → Printing (screenshot)

The enhanced error messages will tell us exactly where it's failing! 🔍
