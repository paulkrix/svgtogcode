/**
 * Update Manager - Handles checking for updates and updating the application
 */

const { app, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

class UpdateManager {
  /**
   * Create a new UpdateManager
   * @param {BrowserWindow} mainWindow - The main application window
   */
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.updateAvailable = false;
    this.updateDownloaded = false;
    
    // Configure logging
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    
    // Set up event handlers
    this.setupEventHandlers();
  }
  
  /**
   * Set up auto-updater event handlers
   */
  setupEventHandlers() {
    // When an update is available
    autoUpdater.on('update-available', (info) => {
      this.updateAvailable = true;
      log.info('Update available:', info);
      
      // Notify the user that an update is available
      this.mainWindow.webContents.send('update-available', info);
    });
    
    // When an update has been downloaded
    autoUpdater.on('update-downloaded', (info) => {
      this.updateDownloaded = true;
      log.info('Update downloaded:', info);
      
      // Notify the user that the update is ready to install
      this.mainWindow.webContents.send('update-downloaded', info);
      
      // Prompt the user to restart and install the update
      if (this.mainWindow) {
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Update Ready',
          message: 'A new version has been downloaded.',
          detail: 'Restart the application to apply the update.',
          buttons: ['Restart Now', 'Later'],
          defaultId: 0
        }).then(({ response }) => {
          if (response === 0) {
            // User clicked "Restart Now"
            this.installUpdate();
          }
        });
      }
    });
    
    // When there is an error during update
    autoUpdater.on('error', (err) => {
      log.error('Update error:', err);
      this.mainWindow.webContents.send('update-error', err.message);
    });
    
    // When there is a download progress
    autoUpdater.on('download-progress', (progressObj) => {
      this.mainWindow.webContents.send('update-progress', progressObj);
    });
  }
  
  /**
   * Check for updates
   * @param {boolean} silent - Whether to check silently or show messages
   */
  checkForUpdates(silent = false) {
    // Only check for updates if the app is packaged
    if (!app.isPackaged) {
      log.info('App is not packaged, skipping update check');
      return;
    }
    
    try {
      log.info('Checking for updates...');
      
      if (!silent) {
        this.mainWindow.webContents.send('checking-for-update');
      }
      
      autoUpdater.checkForUpdatesAndNotify().catch(err => {
        log.error('Error checking for updates:', err);
        if (!silent) {
          this.mainWindow.webContents.send('update-error', err.message);
        }
      });
    } catch (error) {
      log.error('Error in checkForUpdates:', error);
    }
  }
  
  /**
   * Install the downloaded update
   */
  installUpdate() {
    if (this.updateDownloaded) {
      log.info('Installing update...');
      autoUpdater.quitAndInstall(false, true);
    } else {
      log.warn('Attempted to install update, but no update has been downloaded');
    }
  }
  
  /**
   * Check if an update is ready to install
   * @returns {boolean} - Whether an update is ready
   */
  isUpdateReady() {
    return this.updateDownloaded;
  }
}

module.exports = UpdateManager; 