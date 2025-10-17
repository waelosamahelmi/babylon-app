import React, { useState } from 'react';
import { useAndroid } from '../lib/android-context';
import { CapacitorThermalPrinterService } from '../lib/capacitor-thermal-printer';

export const AndroidFeaturesDemo: React.FC = () => {
  const { sendNotification, playCustomSound, hasNotificationPermission, requestNotificationPermission } = useAndroid();
  const [printerService] = useState(() => new CapacitorThermalPrinterService());
  const [isConnected, setIsConnected] = useState(false);

  const handleTestNotification = async () => {
    if (!hasNotificationPermission) {
      await requestNotificationPermission();
      return;
    }

    // Test with default sound
    sendNotification("Default Sound Test", "This uses the default notification sound");

    // Test with custom alert sound
    setTimeout(() => {
      sendNotification("Custom Sound Test", "This uses your custom alert.mp3 sound", "alert");
    }, 2000);
  };

  const handleTestCustomSound = () => {
    // Play custom alert sound directly without notification
    playCustomSound("alert");
  };

  const handleConnectPrinter = async () => {
    try {
      const devices = await printerService.scanBluetoothPrinters();
      console.log('Available printers:', devices);

      if (devices.length > 0) {
        const connected = await printerService.connectToPrinter(devices[0]);
        setIsConnected(connected);
        
        if (connected) {
          // Send notification about successful connection
          sendNotification("Printer Connected", `Connected to ${devices[0].name}`, "alert");
        }
      }
    } catch (error) {
      console.error('Printer connection error:', error);
      sendNotification("Connection Failed", "Could not connect to printer", "alert");
    }
  };

  const handlePrintTest = async () => {
    if (!isConnected) {
      sendNotification("Printer Not Connected", "Please connect to a printer first", "alert");
      return;
    }

    try {
      // Print a simple test receipt
      await printerService.printTestReceipt();
      
      sendNotification("Print Complete", "Receipt printed successfully", "alert");
    } catch (error) {
      console.error('Print error:', error);
      sendNotification("Print Failed", "Could not print receipt", "alert");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6">Android Features Demo</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Notifications</h3>
          <div className="space-y-2">
            <button
              onClick={handleTestNotification}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Notifications
            </button>
            <button
              onClick={handleTestCustomSound}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Play Custom Sound
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Thermal Printer</h3>
          <div className="space-y-2">
            <button
              onClick={handleConnectPrinter}
              className={`w-full px-4 py-2 rounded text-white ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500 hover:bg-yellow-600'
              }`}
              disabled={isConnected}
            >
              {isConnected ? 'Printer Connected' : 'Connect to Printer'}
            </button>
            <button
              onClick={handlePrintTest}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              disabled={!isConnected}
            >
              Print Test Receipt
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded text-sm">
        <h4 className="font-semibold mb-2">Current sound file:</h4>
        <p className="text-xs mb-2">
          ✅ <code>alert.mp3</code> → Referenced as <code>"alert"</code>
        </p>
        <h4 className="font-semibold mb-2">To add more sounds:</h4>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Place MP3 files in: <code>android/app/src/main/res/raw/</code></li>
          <li>Use lowercase names with underscores only</li>
          <li>Reference without .mp3 extension in code</li>
          <li>Rebuild app: <code>npx cap run android</code></li>
        </ol>
      </div>
    </div>
  );
};