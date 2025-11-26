import { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Dialog } from '@capacitor/dialog';
import { Browser } from '@capacitor/browser';

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseDate: string;
  fileSize: string;
}

export function useAppUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);

  const GITHUB_REPO = 'waelosamahelmi/babylon-app';
  const CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour
  const CURRENT_VERSION = '1.0.0'; // Update this with each release

  const checkForUpdates = async () => {
    try {
      setChecking(true);
      
      // Fetch latest release from GitHub
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
      );
      
      if (!response.ok) {
        console.error('Failed to check for updates');
        return;
      }

      const release = await response.json();
      const latestVersion = release.tag_name.replace('v', '');
      
      // Find APK asset
      const apkAsset = release.assets.find((asset: any) => 
        asset.name.endsWith('.apk')
      );

      if (!apkAsset) {
        console.error('No APK found in latest release');
        return;
      }

      // Compare versions
      if (isNewerVersion(latestVersion, CURRENT_VERSION)) {
        const updateInfo: UpdateInfo = {
          version: latestVersion,
          downloadUrl: apkAsset.browser_download_url,
          releaseDate: new Date(release.published_at).toLocaleDateString(),
          fileSize: (apkAsset.size / (1024 * 1024)).toFixed(2) + ' MB'
        };

        setUpdateInfo(updateInfo);
        setUpdateAvailable(true);
        
        // Show update dialog
        await showUpdateDialog(updateInfo);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      setChecking(false);
    }
  };

  const isNewerVersion = (latest: string, current: string): boolean => {
    // Simple version comparison (assumes format: YYYYMMDD_HHMMSS or X.Y.Z)
    return latest > current;
  };

  const showUpdateDialog = async (info: UpdateInfo) => {
    const { value } = await Dialog.confirm({
      title: '🎉 Update Available!',
      message: `PlateOS ${info.version} is now available!\n\nSize: ${info.fileSize}\nReleased: ${info.releaseDate}\n\nWould you like to download the update?`,
      okButtonTitle: 'Update Now',
      cancelButtonTitle: 'Later'
    });

    if (value) {
      downloadUpdate(info.downloadUrl);
    }
  };

  const downloadUpdate = async (url: string) => {
    try {
      // Open download URL in browser
      await Browser.open({ url });
      
      // Show instructions
      await Dialog.alert({
        title: 'Download Started',
        message: 'The APK is downloading. Once complete:\n\n1. Open the downloaded file\n2. Install the update\n3. The app will restart automatically'
      });
    } catch (error) {
      console.error('Error downloading update:', error);
    }
  };

  const manualCheckForUpdates = async () => {
    await checkForUpdates();
    
    if (!updateAvailable && !checking) {
      await Dialog.alert({
        title: 'No Updates',
        message: 'You are using the latest version of PlateOS!'
      });
    }
  };

  // Auto-check on app startup
  useEffect(() => {
    checkForUpdates();
  }, []);

  // Periodic update checks
  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdates();
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Check when app becomes active
  useEffect(() => {
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        checkForUpdates();
      }
    });

    return () => {
      listener.remove();
    };
  }, []);

  return {
    updateAvailable,
    updateInfo,
    checking,
    checkForUpdates: manualCheckForUpdates,
    downloadUpdate: updateInfo ? () => downloadUpdate(updateInfo.downloadUrl) : undefined
  };
}
