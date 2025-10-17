import React from 'react';
import { useAndroid } from '../lib/android-context';

export const AlertSoundTest: React.FC = () => {
  const { sendNotification, playCustomSound, hasNotificationPermission, requestNotificationPermission } = useAndroid();

  const handleTestAlert = async () => {
    if (!hasNotificationPermission) {
      await requestNotificationPermission();
      return;
    }

    // Test your alert.mp3 file with notification
    sendNotification("Test Alert", "Testing your custom alert.mp3 sound", "alert");
  };

  const handlePlayAlertOnly = () => {
    // Just play the alert sound without notification
    playCustomSound("alert");
  };

  const handleTestDefault = async () => {
    if (!hasNotificationPermission) {
      await requestNotificationPermission();
      return;
    }

    // Test with default sound for comparison
    sendNotification("Default Sound", "This uses the default notification sound");
  };

  return (
    <div className="p-4 max-w-sm mx-auto bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold text-center">Test Your Alert Sound</h2>
      
      <div className="space-y-3">
        <button
          onClick={handleTestAlert}
          className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-medium"
        >
          🚨 Test Alert Notification
        </button>
        
        <button
          onClick={handlePlayAlertOnly}
          className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 font-medium"
        >
          🔊 Play Alert Sound Only
        </button>
        
        <button
          onClick={handleTestDefault}
          className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 font-medium"
        >
          🔔 Test Default Sound
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
        <p className="text-blue-800">
          <strong>Your sound file:</strong> <code>alert.mp3</code>
        </p>
        <p className="text-blue-600 mt-1">
          Referenced in code as: <code>"alert"</code>
        </p>
      </div>

      <div className="mt-2 p-3 bg-yellow-50 rounded text-xs">
        <p className="text-yellow-800">
          <strong>Note:</strong> Make sure to rebuild the app after adding the MP3 file:
        </p>
        <code className="block mt-1 text-yellow-700">npx cap sync android && npx cap run android</code>
      </div>
    </div>
  );
};