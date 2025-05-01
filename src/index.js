/**
 * SVG to GCode Converter - Main Application Entry Point
 */

const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const UpdateManager = require('./update-manager');
const SVGProcessor = require('./svg-processor');
const ThreeJsGCodeVisualizer = require('./visualization/threejs-gcode-viewer');

// Keep references to prevent garbage collection
let mainWindow;
let updateManager;
let svgProcessor;
let threeJsVisualizer;
let currentGCodeData = null;

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
  
  // Initialize Three.js visualizer
  threeJsVisualizer = new ThreeJsGCodeVisualizer();
  
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

/**
 * Setup IPC handlers for communication with renderer process
 */
function setupIpcHandlers() {
  // Dialog handlers
  ipcMain.handle('show-open-dialog', async (event, options) => {
    return dialog.showOpenDialog(mainWindow, options);
  });
  
  ipcMain.handle('show-save-dialog', async (event, options) => {
    return dialog.showSaveDialog(mainWindow, options);
  });
  
  // File operation handlers
  ipcMain.handle('load-svg-file', async (event, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error('Error loading SVG file:', error);
      throw error;
    }
  });
  
  ipcMain.handle('save-gcode-file', async (event, gcode, filePath) => {
    try {
      fs.writeFileSync(filePath, gcode, 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving GCode file:', error);
      throw error;
    }
  });
  
  ipcMain.handle('save-debug-file', async (event, content, filePath) => {
    try {
      // Create debug_output directory if it doesn't exist
      const outputDir = path.join(app.getPath('userData'), 'debug_output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const fullPath = path.join(outputDir, filePath);
      fs.writeFileSync(fullPath, content, 'utf8');
      return fullPath;
    } catch (error) {
      console.error('Error saving debug file:', error);
      throw error;
    }
  });
  
  // Configuration handlers
  ipcMain.handle('load-configuration', async (event) => {
    // Return default configuration
    return getDefaultConfiguration();
  });
  
  ipcMain.handle('save-configuration', async (event, config) => {
    // TODO: Save configuration to file
    return true;
  });
  
  // Conversion handlers
  ipcMain.handle('convert-svg-to-gcode', async (event, svgData, config) => {
    try {
      const progressCallback = (progress) => {
        mainWindow.webContents.send('conversion-progress', progress);
      };
      
      const gcode = await svgProcessor.convertSVGToGCode(svgData, config, progressCallback);
      
      const gcodeData = {
        commands: gcode.split('\n'),
        estimatedTime: svgProcessor.getEstimatedTime(),
        metadata: svgProcessor.getMetadata()
      };
      
      // Store the GCode data for visualization
      currentGCodeData = gcodeData;
      
      mainWindow.webContents.send('conversion-complete');
      return gcode;
    } catch (error) {
      console.error('Error converting SVG to GCode:', error);
      mainWindow.webContents.send('error', error.message);
      throw error;
    }
  });
  
  // Visualization handlers
  ipcMain.handle('get-processed-data', async (event, svgData, config) => {
    try {
      return svgProcessor.getProcessedData(svgData, config);
    } catch (error) {
      console.error('Error getting processed data:', error);
      throw error;
    }
  });
  
  ipcMain.handle('get-toolpath-data', async (event, svgData, config) => {
    try {
      return svgProcessor.getToolpathData(svgData, config);
    } catch (error) {
      console.error('Error getting toolpath data:', error);
      throw error;
    }
  });
  
  ipcMain.handle('get-svg-visualization', async (event, processedData, svgData, config) => {
    try {
      return svgProcessor.getSVGVisualization(processedData, svgData, config);
    } catch (error) {
      console.error('Error getting SVG visualization:', error);
      throw error;
    }
  });
  
  ipcMain.handle('get-toolpath-visualization', async (event, toolpathData, config) => {
    try {
      return svgProcessor.getToolpathVisualization(toolpathData, config);
    } catch (error) {
      console.error('Error getting toolpath visualization:', error);
      throw error;
    }
  });
  
  ipcMain.handle('get-gcode-visualization', async (event, gcodeData, toolpathData, config) => {
    try {
      return svgProcessor.getGCodeVisualization(gcodeData, toolpathData, config);
    } catch (error) {
      console.error('Error getting GCode visualization:', error);
      throw error;
    }
  });
  
  // New IPC handlers for Three.js visualization
  ipcMain.handle('generate-threejs-visualization', async (event, gcodeData) => {
    try {
      const htmlFilePath = await generateThreeJsVisualization(gcodeData);
      return htmlFilePath;
    } catch (error) {
      console.error('Error handling generate-threejs-visualization:', error);
      throw error;
    }
  });
  
  ipcMain.handle('open-threejs-visualization', async (event, htmlFilePath) => {
    try {
      openThreeJsVisualization(htmlFilePath);
      return true;
    } catch (error) {
      console.error('Error handling open-threejs-visualization:', error);
      throw error;
    }
  });
  
  // Use current GCode data if available
  ipcMain.handle('open-current-threejs-visualization', async (event) => {
    try {
      if (currentGCodeData) {
        const htmlFilePath = await generateThreeJsVisualization(currentGCodeData);
        openThreeJsVisualization(htmlFilePath);
        return true;
      } else {
        throw new Error('No GCode data available');
      }
    } catch (error) {
      console.error('Error handling open-current-threejs-visualization:', error);
      throw error;
    }
  });
}

/**
 * Generate a Three.js visualization HTML page for the GCode
 * @param {Object} gcodeData - GCode data (commands and metadata)
 * @param {string} outputFilePath - Path to save the visualization
 * @returns {Promise<string>} - The full path to the generated HTML file
 */
async function generateThreeJsVisualization(gcodeData, outputFilePath = null) {
  try {
    // Set current GCode data for reference
    currentGCodeData = gcodeData;
    
    // Generate the HTML content
    const htmlContent = threeJsVisualizer.generateVisualizationPage(gcodeData);
    
    // If no output path specified, save to temporary file
    if (!outputFilePath) {
      // Create output directory if it doesn't exist
      const outputDir = path.join(app.getPath('temp'), 'svg2gcode-visualizations');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Create a filename based on current date/time
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      outputFilePath = path.join(outputDir, `gcode-visualization-${timestamp}.html`);
    }
    
    // Save the HTML file
    fs.writeFileSync(outputFilePath, htmlContent, 'utf8');
    
    return outputFilePath;
  } catch (error) {
    console.error('Error generating Three.js visualization:', error);
    throw error;
  }
}

/**
 * Open a Three.js visualization in the default browser
 * @param {string} htmlFilePath - Path to the HTML file
 */
function openThreeJsVisualization(htmlFilePath) {
  // Open the HTML file in the default browser
  shell.openExternal(`file://${htmlFilePath}`);
}

// Start the application
app.whenReady().then(() => {
  createWindow();
  
  // Register IPC handlers
  setupIpcHandlers();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 