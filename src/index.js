/**
 * SVG to GCode Converter - Main Application Entry Point
 */

const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const UpdateManager = require('./update-manager');
const SVGProcessor = require('./svg-processor');

// Keep references to prevent garbage collection
let mainWindow;
let updateManager;
let svgProcessor;

/**
 * Create the main application window
 */
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'SVG to GCode Converter',
    icon: path.join(__dirname, '../resources/icon.png')
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'ui/index.html'));
  
  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
  
  // Initialize SVG processor
  svgProcessor = new SVGProcessor();
  
  // Initialize update manager
  updateManager = new UpdateManager(mainWindow);
  
  // Check for updates (silently)
  setTimeout(() => {
    updateManager.checkForUpdates(true);
  }, 3000);
  
  // Create application menu
  createAppMenu();
}

/**
 * Create the application menu
 */
function createAppMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open SVG...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            openSVGFile();
          }
        },
        {
          label: 'Save GCode...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            saveGCodeFile();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            openDocumentation();
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => {
            updateManager.checkForUpdates(false);
          }
        },
        {
          label: 'About',
          click: () => {
            showAboutDialog();
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Open SVG file dialog
 */
function openSVGFile() {
  dialog.showOpenDialog(mainWindow, {
    title: 'Open SVG File',
    filters: [
      { name: 'SVG Files', extensions: ['svg'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      mainWindow.webContents.send('svg-file-opened', filePath);
    }
  }).catch(err => {
    console.error('Error opening SVG file:', err);
    dialog.showErrorBox('Error', 'Failed to open SVG file');
  });
}

/**
 * Save GCode file dialog
 */
function saveGCodeFile() {
  dialog.showSaveDialog(mainWindow, {
    title: 'Save GCode File',
    filters: [
      { name: 'GCode Files', extensions: ['gcode', 'nc', 'tap', 'ngc'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      mainWindow.webContents.send('save-gcode-requested', result.filePath);
    }
  }).catch(err => {
    console.error('Error saving GCode file:', err);
    dialog.showErrorBox('Error', 'Failed to save GCode file');
  });
}

/**
 * Show the About dialog
 */
function showAboutDialog() {
  const appVersion = app.getVersion();
  dialog.showMessageBox(mainWindow, {
    title: 'About SVG to GCode Converter',
    message: 'SVG to GCode Converter',
    detail: `Version: ${appVersion}\n\nA tool for converting SVG files to GCode with grayscale-to-depth mapping.\n\n© 2023 SVG to GCode Converter Team`,
    buttons: ['OK'],
    icon: path.join(__dirname, '../resources/icon.png')
  });
}

/**
 * Open documentation
 */
function openDocumentation() {
  const userGuidePath = path.join(__dirname, '../docs/user_guide.md');
  
  // Check if documentation exists
  if (fs.existsSync(userGuidePath)) {
    // If we have a dedicated documentation viewer, use it
    // For now, just open in default markdown viewer or editor
    require('electron').shell.openPath(userGuidePath);
  } else {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Documentation',
      message: 'Documentation is available online at:\nhttps://github.com/svg-to-gcode/svg-to-gcode-converter/docs',
      buttons: ['OK']
    });
  }
}

// Handle IPC events
ipcMain.on('check-for-updates', () => {
  updateManager.checkForUpdates(false);
});

ipcMain.on('install-update', () => {
  if (updateManager.isUpdateReady()) {
    updateManager.installUpdate();
  }
});

// Add handlers for configuration loading/saving
ipcMain.handle('load-configuration', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    
    // Check if config file exists
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } else {
      // Return default configuration if file doesn't exist
      return getDefaultConfiguration();
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
    throw new Error('Failed to load configuration');
  }
});

ipcMain.handle('save-configuration', async (event, config) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving configuration:', error);
    throw new Error('Failed to save configuration');
  }
});

/**
 * Get default configuration settings
 */
function getDefaultConfiguration() {
  return {
    // Default settings
    machineType: 'grbl',
    workArea: {
      width: 200,
      height: 200,
      depth: 20
    },
    toolSettings: {
      diameter: 3.175,
      stepover: 40,
      depthPerPass: 1,
      feedRate: 1000,
      plungeRate: 500,
      rapidRate: 3000
    },
    gcodeSettings: {
      startGcode: 'G90\nG21\nG0 Z5\nM3 S12000',
      endGcode: 'G0 Z10\nM5\nM2',
      gcodeFilename: 'output.gcode'
    },
    grayscaleMapping: {
      enabled: true,
      minDepth: 0.5,
      maxDepth: 5,
      invert: false
    },
    machine: {
      type: 'grbl',
      units: 'mm',
      feedRates: {
        default: 1000,
        rapid: 3000,
        plunge: 500
      },
      workOffset: 'G54',
      spindleSpeed: 12000
    }
  };
}

// Add IPC handlers for all methods exposed in preload.js
ipcMain.handle('show-open-dialog', async (event, options) => {
  return dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  return dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('load-svg-file', async (event, filePath) => {
  try {
    const svgData = fs.readFileSync(filePath, 'utf8');
    return svgData;
  } catch (error) {
    console.error('Error loading SVG file:', error);
    throw new Error('Failed to load SVG file');
  }
});

ipcMain.handle('save-gcode-file', async (event, gcode, filePath) => {
  try {
    fs.writeFileSync(filePath, gcode, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving GCode file:', error);
    throw new Error('Failed to save GCode file');
  }
});

ipcMain.handle('save-debug-file', async (event, content, filePath) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving debug file:', error);
    throw new Error('Failed to save debug file');
  }
});

ipcMain.handle('convert-svg-to-gcode', async (event, svgData, config) => {
  try {
    // This should be implemented in your SVGProcessor class
    if (!svgProcessor) {
      svgProcessor = new SVGProcessor();
    }
    
    // Send progress updates as conversion proceeds
    const progressCallback = (progress) => {
      mainWindow.webContents.send('conversion-progress', progress);
    };
    
    const result = await svgProcessor.convertToGCode(svgData, config, progressCallback);
    mainWindow.webContents.send('conversion-complete', result);
    return result;
  } catch (error) {
    console.error('Error converting SVG to GCode:', error);
    mainWindow.webContents.send('error', error.message || 'Failed to convert SVG to GCode');
    throw error;
  }
});

ipcMain.handle('get-processed-data', async (event, svgData, config) => {
  try {
    if (!svgProcessor) {
      svgProcessor = new SVGProcessor();
    }
    return await svgProcessor.getProcessedData(svgData, config);
  } catch (error) {
    console.error('Error processing SVG data:', error);
    throw new Error('Failed to process SVG data');
  }
});

ipcMain.handle('get-toolpath-data', async (event, svgData, config) => {
  try {
    if (!svgProcessor) {
      svgProcessor = new SVGProcessor();
    }
    return await svgProcessor.getToolpathData(svgData, config);
  } catch (error) {
    console.error('Error generating toolpath:', error);
    throw new Error('Failed to generate toolpath');
  }
});

ipcMain.handle('get-svg-visualization', async (event, processedData, svgData, config) => {
  try {
    if (!svgProcessor) {
      svgProcessor = new SVGProcessor();
    }
    return await svgProcessor.getSVGVisualization(processedData, svgData, config);
  } catch (error) {
    console.error('Error creating SVG visualization:', error);
    throw new Error('Failed to create SVG visualization');
  }
});

ipcMain.handle('get-toolpath-visualization', async (event, toolpathData, config) => {
  try {
    if (!svgProcessor) {
      svgProcessor = new SVGProcessor();
    }
    return await svgProcessor.getToolpathVisualization(toolpathData, config);
  } catch (error) {
    console.error('Error creating toolpath visualization:', error);
    throw new Error('Failed to create toolpath visualization');
  }
});

ipcMain.handle('get-gcode-visualization', async (event, gcodeData, toolpathData, config) => {
  try {
    if (!svgProcessor) {
      svgProcessor = new SVGProcessor();
    }
    return await svgProcessor.getGCodeVisualization(gcodeData, toolpathData, config);
  } catch (error) {
    console.error('Error creating GCode visualization:', error);
    throw new Error('Failed to create GCode visualization');
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    // On macOS re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 