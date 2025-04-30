const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'SVG to GCode Converter'
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when the dock icon is clicked and no windows are open
  if (mainWindow === null) {
    createWindow();
  }
});

// Initialize IPC handlers
require('./ui/ipc-handlers'); 