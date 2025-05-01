const { contextBridge, ipcRenderer } = require('electron');

// Expose API to renderer process
contextBridge.exposeInMainWorld('api', {
  // Dialog functions
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // File operations
  loadSVGFile: (filePath) => ipcRenderer.invoke('load-svg-file', filePath),
  saveGCodeFile: (gcode, filePath) => ipcRenderer.invoke('save-gcode-file', gcode, filePath),
  saveDebugFile: (content, filePath) => ipcRenderer.invoke('save-debug-file', content, filePath),
  
  // Configuration
  loadConfiguration: () => ipcRenderer.invoke('load-configuration'),
  saveConfiguration: (config) => ipcRenderer.invoke('save-configuration', config),
  
  // Conversion
  convertSVGToGCode: (svgData, config) => ipcRenderer.invoke('convert-svg-to-gcode', svgData, config),
  
  // Data processing and visualization
  getProcessedData: (svgData, config) => ipcRenderer.invoke('get-processed-data', svgData, config),
  getToolpathData: (svgData, config) => ipcRenderer.invoke('get-toolpath-data', svgData, config),
  getSVGVisualization: (processedData, svgData, config) => 
    ipcRenderer.invoke('get-svg-visualization', processedData, svgData, config),
  getToolpathVisualization: (toolpathData, config) => 
    ipcRenderer.invoke('get-toolpath-visualization', toolpathData, config),
  getGCodeVisualization: (gcodeData, toolpathData, config) =>
    ipcRenderer.invoke('get-gcode-visualization', gcodeData, toolpathData, config),
  
  // Three.js visualization
  generateThreeJsVisualization: (gcodeData) => 
    ipcRenderer.invoke('generate-threejs-visualization', gcodeData),
  openThreeJsVisualization: (htmlFilePath) => 
    ipcRenderer.invoke('open-threejs-visualization', htmlFilePath),
  openCurrentThreeJsVisualization: () => 
    ipcRenderer.invoke('open-current-threejs-visualization'),
  
  // Event listeners
  on: (channel, callback) => {
    // Whitelist channels for security
    const validChannels = ['conversion-progress', 'conversion-complete', 'error'];
    if (validChannels.includes(channel)) {
      const subscription = (_, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    return null;
  }
}); 