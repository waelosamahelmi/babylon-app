# TESTING INSTRUCTIONS - BLUETOOTH & NOTIFICATION FIXES

## 🔍 **NEW DEBUG APK CREATED**
The APK has been rebuilt with extensive debugging to help identify what's happening. 

📍 **APK Location**: `android\app\build\outputs\apk\debug\app-debug.apk`

## 🧪 **Testing Steps**

### Test 1: Bluetooth Discovery (Paired Devices Only)

1. **Before Testing**: 
   - Pair your thermal printer in Android Bluetooth settings first
   - Go to Settings > Bluetooth > Available devices > Find your printer > Pair

2. **In the App**:
   - Go to Bluetooth printer settings/discovery
   - Press "Scan for Bluetooth"
   - **Check the console/logs** for these debug messages:
     ```
     🔍 DEBUG: Alternative Bluetooth scanner is being used!
     🔍 DEBUG: Attempting to get paired devices from Android...
     📱 DEBUG: Found paired devices: [array of devices]
     🔍 DEBUG: Checking device [name] for printer keywords...
     ✅ DEBUG: Found paired printer: [name] ([address])
     ```

3. **Expected Result**: 
   - Should only show printers that are already paired
   - Should NOT show random phones, headphones, etc.
   - Should show message "Please pair your printer in Android Bluetooth settings first" if no paired printers

### Test 2: Notification Sound (Alert.mp3)

1. **Trigger a Notification**:
   - Create a test order from the customer website
   - OR use the notification test button in the app
   - OR manually trigger any notification

2. **Check the Console/Logs** for these debug messages:
   ```
   🔍 DEBUG: Checking Android bridge availability...
   🔍 DEBUG: window.Android exists: true
   🔍 DEBUG: Available Android methods:
     - showNotificationWithSound: function
   🔔 Using showNotificationWithSound with alert
   ✅ Android notification sent successfully
   ```

3. **Expected Result**:
   - Should hear your custom alert.mp3 sound
   - Should NOT hear the old system beep/ding

## 🔍 **Debugging Information**

### If Bluetooth Still Shows All Devices:
1. Check if you see this debug message: `🔍 DEBUG: Alternative Bluetooth scanner is being used!`
   - If NO: The thermal printer plugin is not failing, so fallback isn't triggered
   - If YES: Check for permission errors or plugin registration issues

2. Look for error messages like:
   - `❌ Could not get paired devices: [error]`
   - `❌ Alternative Bluetooth error: [error]`

### If Notifications Still Use Old Sound:
1. Check if you see: `🔍 DEBUG: window.Android exists: true`
   - If NO: Android bridge not available (web fallback being used)
   - If YES: Check which notification method is being called

2. Look for these specific debug lines:
   - `🔔 Using showNotificationWithSound with alert` ✅ Good
   - `🔔 Using showNotification (should use alert by default now)` ✅ Good  
   - `❌ No Android notification methods available!` ❌ Problem

## 📱 **How to View Debug Logs**

### Option 1: Chrome DevTools (Recommended)
1. Connect your Android device to computer via USB
2. Enable USB Debugging on your Android device
3. Open Chrome and go to `chrome://inspect`
4. Find your app and click "Inspect"
5. Go to Console tab to see all debug messages

### Option 2: Android Studio Logcat
1. Open Android Studio
2. Go to View > Tool Windows > Logcat
3. Select your device and app
4. Filter by "TAG" to see our debug messages

## 🚨 **What to Report Back**

If the fixes still aren't working, please share:

1. **Console/Log Output**: Copy the debug messages you see
2. **Bluetooth Behavior**: What devices are shown (paired only vs all devices)
3. **Notification Sound**: Old system sound vs new alert.mp3
4. **Any Error Messages**: Full error text from console

## 📧 **Expected Debug Output Examples**

### Successful Bluetooth (Paired Only):
```
🔍 DEBUG: Alternative Bluetooth scanner is being used!
🔍 DEBUG: Attempting to get paired devices from Android...
📱 DEBUG: Found paired devices: [{name: "Thermal Printer", address: "XX:XX:XX:XX"}]
✅ DEBUG: Found paired printer: Thermal Printer (XX:XX:XX:XX:XX:XX)
✅ DEBUG: Scan completed: 1 paired printers found
```

### Successful Notification (Alert.mp3):
```
🔍 DEBUG: Checking Android bridge availability...
🔍 DEBUG: window.Android exists: true
🔍 DEBUG: Available Android methods: showNotificationWithSound: function
🔔 Using showNotificationWithSound with alert
✅ Android notification sent successfully
```

## 🛠️ **If Issues Persist**

The debugging will help identify exactly where the problem is:
- **Plugin registration issues**
- **Permission problems** 
- **Android bridge connectivity**
- **Fallback mechanism not triggering**

With the debug output, I can provide targeted fixes for the specific issue you're experiencing.