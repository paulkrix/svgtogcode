const { ipcMain, dialog, app } = require('electron');
const fs = require('fs').promises;
const path = require('path');

// Import components
const SVGInput = require('../models/svg-input');
const SVGParser = require('../parser/svg-parser');
const GrayscaleMapper = require('../processor/grayscale-mapper');
const PathGenerator = require('../toolpath/path-generator');
const GCodeGenerator = require('../gcode/gcode-generator');
const SVGVisualizer = require('../visualization/svg-visualizer');
const GCodeVisualizer = require('../visualization/gcode-visualizer');

// Initialize IPC handlers
function initializeIpcHandlers() {
  // Handle file opening
  ipcMain.handle('show-open-dialog', async (_, options) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(options);
    if (canceled || filePaths.length === 0) {
      return null;
    }
    return filePaths[0];
  });

  // Handle file saving
  ipcMain.handle('show-save-dialog', async (_, options) => {
    const { canceled, filePath } = await dialog.showSaveDialog(options);
    if (canceled || !filePath) {
      return null;
    }
    return filePath;
  });

  // Save debug file
  ipcMain.handle('save-debug-file', async (_, content, filePath) => {
    try {
      // Create directories if they don't exist
      const directory = path.dirname(filePath);
      await fs.mkdir(directory, { recursive: true });
      
      // Write the file
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`Debug file saved: ${filePath}`);
      return true;
    } catch (error) {
      console.error('Error saving debug file:', error);
      throw new Error(`Failed to save debug file: ${error.message}`);
    }
  });

  // Load SVG file
  ipcMain.handle('load-svg-file', async (_, filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const filename = path.basename(filePath);
      return SVGInput.fromString(data, filename);
    } catch (error) {
      console.error('Error loading SVG file:', error);
      throw new Error(`Failed to load SVG file: ${error.message}`);
    }
  });

  // Save GCode file
  ipcMain.handle('save-gcode-file', async (_, gcode, filePath) => {
    try {
      await fs.writeFile(filePath, gcode, 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving GCode file:', error);
      throw new Error(`Failed to save GCode file: ${error.message}`);
    }
  });

  // Load configuration
  ipcMain.handle('load-configuration', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const configPath = path.join(userDataPath, 'config.json');
      const exists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (!exists) {
        // Return default configuration
        return {
          machine: {
            type: 'custom_mill',
            workArea: { width: 300, height: 200, depth: 50 },
            feedRates: { default: 800, rapid: 1500, plunge: 300 },
            safeHeight: 5,
            homingPosition: { x: 0, y: 0, z: 0 }
          },
          tool: {
            diameter: 3.175,
            type: 'endmill',
            freeLength: 20
          },
          grayscaleMapping: {
            type: 'linear',
            maxDepth: 5,
            minDepth: 0.5,
            invert: false
          },
          output: {
            includeHeader: true,
            includeFooter: true,
            gcodeFlavor: 'grbl',
            fileExtension: '.nc',
            precision: 3
          },
          toolpath: {
            resolution: 36 // For curve interpolation
          }
        };
      }
      
      const data = await fs.readFile(configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  });

  // Save configuration
  ipcMain.handle('save-configuration', async (_, config) => {
    try {
      const userDataPath = app.getPath('userData');
      const configPath = path.join(userDataPath, 'config.json');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  });

  // Convert SVG to GCode
  ipcMain.handle('convert-svg-to-gcode', async (event, svgData, config) => {
    try {
      // Initialize the conversion pipeline
      const grayscaleMapper = new GrayscaleMapper(config);
      const pathGenerator = new PathGenerator(config);
      const gcodeGenerator = new GCodeGenerator(config);
      
      // Report progress start
      event.sender.send('conversion-progress', 0);
      
      // Step 1: Process SVG with grayscale mapping
      event.sender.send('conversion-progress', 25);
      const processedData = grayscaleMapper.process(svgData);
      
      // Step 2: Generate toolpaths
      event.sender.send('conversion-progress', 50);
      const toolpathData = pathGenerator.generate(processedData, svgData);
      
      // Step 3: Generate GCode
      event.sender.send('conversion-progress', 75);
      const gcodeData = gcodeGenerator.generate(toolpathData);
      
      // Report completion
      event.sender.send('conversion-progress', 100);
      event.sender.send('conversion-complete');
      
      return gcodeData;
    } catch (error) {
      console.error('Error converting SVG to GCode:', error);
      event.sender.send('error', `Failed to convert SVG to GCode: ${error.message}`);
      throw new Error(`Failed to convert SVG to GCode: ${error.message}`);
    }
  });
  
  // Get processed data with depth mapping
  ipcMain.handle('get-processed-data', async (_, svgData, config) => {
    try {
      const grayscaleMapper = new GrayscaleMapper(config);
      return grayscaleMapper.process(svgData);
    } catch (error) {
      console.error('Error processing SVG data:', error);
      throw new Error(`Failed to process SVG data: ${error.message}`);
    }
  });
  
  // Get toolpath data
  ipcMain.handle('get-toolpath-data', async (_, svgData, config) => {
    try {
      const grayscaleMapper = new GrayscaleMapper(config);
      const pathGenerator = new PathGenerator(config);
      
      const processedData = grayscaleMapper.process(svgData);
      return pathGenerator.generate(processedData, svgData);
    } catch (error) {
      console.error('Error generating toolpath data:', error);
      throw new Error(`Failed to generate toolpath data: ${error.message}`);
    }
  });
  
  // Get SVG visualization with depth coloring
  ipcMain.handle('get-svg-visualization', async (_, processedData, svgData, config) => {
    try {
      const visualizer = new SVGVisualizer(config);
      return visualizer.generatePreview(processedData, svgData);
    } catch (error) {
      console.error('Error generating SVG visualization:', error);
      throw new Error(`Failed to generate SVG visualization: ${error.message}`);
    }
  });
  
  // Get toolpath visualization
  ipcMain.handle('get-toolpath-visualization', async (_, toolpathData, config) => {
    try {
      const visualizer = new SVGVisualizer(config);
      return visualizer.generateToolpathPreview(toolpathData);
    } catch (error) {
      console.error('Error generating toolpath visualization:', error);
      throw new Error(`Failed to generate toolpath visualization: ${error.message}`);
    }
  });
  
  // Get GCode visualization
  ipcMain.handle('get-gcode-visualization', async (_, gcodeData, toolpathData, config) => {
    try {
      const visualizer = new GCodeVisualizer(config);
      return visualizer.generateGCodePreview(gcodeData, toolpathData);
    } catch (error) {
      console.error('Error generating GCode visualization:', error);
      throw new Error(`Failed to generate GCode visualization: ${error.message}`);
    }
  });
}

// Export the initialization function
module.exports = initializeIpcHandlers(); 