// Renderer process
// This script is loaded in the browser window

// Import path utility from global window object
const path = {
  basename: (filePath) => {
    // Extract filename from the path
    return filePath.split('/').pop().split('\\').pop();
  }
};

// Global variables
let currentSVG = null;
let currentGCode = null;
let processedData = null;
let toolpathData = null;
let config = null;

// DOM Elements
const loadSvgBtn = document.getElementById('loadSvgBtn');
const saveGcodeBtn = document.getElementById('saveGcodeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const convertBtn = document.getElementById('convertBtn');
const toggleDebugBtn = document.getElementById('toggleDebugBtn');
const svgPreview = document.getElementById('svgPreview');
const gcodePreview = document.getElementById('gcodePreview');
const debugPanel = document.getElementById('debugPanel');
const fileInfo = document.getElementById('fileInfo');
const progressFill = document.getElementById('progressFill');
const statusText = document.getElementById('statusText');
const settingsModal = document.getElementById('settingsModal');
const closeButton = document.querySelector('.close-button');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');

// Form elements
const minDepthInput = document.getElementById('minDepth');
const maxDepthInput = document.getElementById('maxDepth');
const invertMappingInput = document.getElementById('invertMapping');
const feedRateInput = document.getElementById('feedRate');
const plungeRateInput = document.getElementById('plungeRate');
const safeHeightInput = document.getElementById('safeHeight');

// Initialize application
async function initApp() {
  try {
    // Load configuration
    config = await window.api.loadConfiguration();
    
    // Update form values with config
    updateFormFromConfig();
    
    // Setup event listeners
    setupEventListeners();
    
    statusText.textContent = 'Ready';
  } catch (error) {
    statusText.textContent = `Error: ${error.message}`;
  }
}

// Update form values from config
function updateFormFromConfig() {
  minDepthInput.value = config.grayscaleMapping.minDepth;
  maxDepthInput.value = config.grayscaleMapping.maxDepth;
  invertMappingInput.checked = config.grayscaleMapping.invert;
  feedRateInput.value = config.machine.feedRates.default;
  plungeRateInput.value = config.machine.feedRates.plunge;
  safeHeightInput.value = config.machine.safeHeight;
}

// Setup event listeners
function setupEventListeners() {
  // Button click handlers
  loadSvgBtn.addEventListener('click', handleLoadSVG);
  saveGcodeBtn.addEventListener('click', handleSaveGCode);
  settingsBtn.addEventListener('click', handleOpenSettings);
  convertBtn.addEventListener('click', handleConvertSVG);
  toggleDebugBtn.addEventListener('click', toggleDebugPanel);
  closeButton.addEventListener('click', closeModal);
  saveSettingsBtn.addEventListener('click', saveSettings);
  cancelSettingsBtn.addEventListener('click', closeModal);
  
  // Tab handlers
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update active tab
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });
  
  // Listen for conversion progress
  window.api.on('conversion-progress', handleProgress);
  window.api.on('conversion-complete', handleConversionComplete);
  window.api.on('error', handleError);
  
  // Close modal if clicked outside
  window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
      closeModal();
    }
  });
}

// Toggle debug panel visibility
function toggleDebugPanel() {
  if (debugPanel.classList.contains('visible')) {
    debugPanel.classList.remove('visible');
    toggleDebugBtn.textContent = 'Show Debug Info';
  } else {
    debugPanel.classList.add('visible');
    toggleDebugBtn.textContent = 'Hide Debug Info';
  }
}

// Handle loading an SVG file
async function handleLoadSVG() {
  try {
    statusText.textContent = 'Select an SVG file...';
    
    const result = await window.api.showOpenDialog({
      title: 'Select SVG File',
      filters: [{ name: 'SVG Files', extensions: ['svg'] }],
      properties: ['openFile']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      statusText.textContent = 'File selection canceled';
      return;
    }
    
    const filePath = result.filePaths[0];
    statusText.textContent = 'Loading SVG...';
    
    // Load the SVG file
    const svgData = await window.api.loadSVGFile(filePath);
    
    // Create a structured SVG object with metadata
    currentSVG = {
      filename: path.basename(filePath),
      filePath: filePath,
      rawData: svgData,
      // Default dimensions if not available in the SVG
      width: 100,
      height: 100
    };
    
    // Try to extract dimensions from SVG content
    const widthMatch = svgData.match(/width="([^"]+)"/);
    const heightMatch = svgData.match(/height="([^"]+)"/);
    
    if (widthMatch && widthMatch[1]) {
      currentSVG.width = parseFloat(widthMatch[1]) || 100;
    }
    
    if (heightMatch && heightMatch[1]) {
      currentSVG.height = parseFloat(heightMatch[1]) || 100;
    }
    
    // Reset previous data
    processedData = null;
    toolpathData = null;
    currentGCode = null;
    
    // Update UI
    fileInfo.textContent = `File: ${currentSVG.filename} (${currentSVG.width}x${currentSVG.height})`;
    svgPreview.innerHTML = currentSVG.rawData;
    convertBtn.disabled = false;
    saveGcodeBtn.disabled = true;
    toggleDebugBtn.disabled = true;
    debugPanel.classList.remove('visible');
    statusText.textContent = 'SVG loaded successfully';
    
    // Save original SVG for debugging
    await window.api.saveDebugFile(currentSVG.rawData, 'debug_output/original_svg.svg');
    
  } catch (error) {
    console.error('Error loading SVG:', error);
    statusText.textContent = `Error: ${error.message}`;
  }
}

// Handle saving GCode
async function handleSaveGCode() {
  try {
    if (!currentGCode) {
      statusText.textContent = 'No GCode to save';
      return;
    }
    
    const filePath = await window.api.showSaveDialog({
      title: 'Save GCode File',
      filters: [{ name: 'GCode Files', extensions: ['nc', 'gcode'] }],
      defaultPath: currentSVG.filename.replace('.svg', config.output.fileExtension)
    });
    
    if (!filePath) {
      statusText.textContent = 'File save canceled';
      return;
    }
    
    statusText.textContent = 'Saving GCode...';
    
    // Format the GCode as a single string
    const gcodeText = [
      ...currentGCode.header,
      ...currentGCode.commands,
      ...currentGCode.footer
    ].join('\n');
    
    await window.api.saveGCodeFile(gcodeText, filePath);
    statusText.textContent = 'GCode saved successfully';
    
  } catch (error) {
    statusText.textContent = `Error: ${error.message}`;
  }
}

// Handle converting SVG to GCode
async function handleConvertSVG() {
  try {
    if (!currentSVG) {
      statusText.textContent = 'No SVG to convert';
      return;
    }
    
    console.log("=== Starting conversion of SVG to GCode ===");
    console.log("SVG data size:", currentSVG.rawData.length, "characters");
    
    statusText.textContent = 'Converting SVG to GCode...';
    convertBtn.disabled = true;
    progressFill.style.width = '0%';
    
    // Update config with form values
    updateConfigFromForm();
    console.log("Using config:", JSON.stringify(config, null, 2));
    
    // Convert SVG to GCode
    console.log("Calling convertSVGToGCode with SVG data");
    currentGCode = await window.api.convertSVGToGCode(currentSVG.rawData, config);
    console.log("Received GCode result with", 
      currentGCode.commands ? currentGCode.commands.length : 0, "commands",
      "and metadata:", JSON.stringify(currentGCode.metadata, null, 2));
    
    // Save GCode for debugging
    const gcodeText = [
      ...currentGCode.header,
      ...currentGCode.commands,
      ...currentGCode.footer
    ].join('\n');
    await window.api.saveDebugFile(gcodeText, 'debug_output/debug_gcode.nc');
    console.log("Saved GCode to debug_output/debug_gcode.nc");
    
    // Get and save processed data for debugging
    console.log("Getting processed SVG data");
    if (!processedData) {
      processedData = await window.api.getProcessedData(currentSVG.rawData, config);
    }
    
    console.log("Getting toolpath data");
    if (!toolpathData) {
      toolpathData = await window.api.getToolpathData(processedData, config);
    }
    
    // Save toolpath data as JSON for debugging
    await window.api.saveDebugFile(JSON.stringify(toolpathData, null, 2), 'debug_output/toolpath_data.json');
    console.log("Saved toolpath data with", 
      toolpathData.toolpaths ? toolpathData.toolpaths.length : 0, 
      "toolpaths to debug_output/toolpath_data.json");
    
    // Debug the toolpaths
    if (toolpathData.toolpaths) {
      toolpathData.toolpaths.forEach((toolpath, index) => {
        console.log(`Toolpath ${index + 1}: ${toolpath.points ? toolpath.points.length : 0} points, depth: ${toolpath.depth}`);
      });
    }
    
    // Get and save visualizations
    console.log("Generating visualizations");
    const svgVisualization = await window.api.getSVGVisualization(processedData, currentSVG.rawData, config);
    const toolpathVisualization = await window.api.getToolpathVisualization(toolpathData, config);
    const gcodeVisualization = await window.api.getGCodeVisualization(currentGCode, toolpathData, config);
    
    // Extract just the SVG part from the HTML wrapper
    const extractSvg = (html) => {
      const match = html.match(/<svg[\s\S]*?<\/svg>/);
      return match ? match[0] : html;
    };
    
    await window.api.saveDebugFile(extractSvg(svgVisualization), 'debug_output/svg_visualization.svg');
    await window.api.saveDebugFile(extractSvg(toolpathVisualization), 'debug_output/toolpath_visualization.svg');
    
    // Check if we have a valid SVG match in gcodeVisualization
    const gcodeVisMatch = gcodeVisualization.match(/<svg[\s\S]*?<\/svg>/);
    if (gcodeVisMatch) {
      await window.api.saveDebugFile(gcodeVisMatch[0], 'debug_output/gcode_visualization.svg');
    } else {
      console.error("Could not extract SVG from GCode visualization");
      await window.api.saveDebugFile(gcodeVisualization, 'debug_output/gcode_visualization_raw.html');
    }
    
    console.log("Saved visualizations to debug_output/");
    
    // Display GCode preview
    displayGCodePreview();
    console.log("Updated GCode preview");
    
    // Enable save and debug buttons
    saveGcodeBtn.disabled = false;
    toggleDebugBtn.disabled = false;
    
    statusText.textContent = 'Conversion complete';
    console.log("=== Conversion completed successfully ===");
    
  } catch (error) {
    console.error("Conversion error:", error);
    statusText.textContent = `Error: ${error.message}`;
    convertBtn.disabled = false;
  }
}

// Function to save visualization to a file
async function saveVisualizationToFile(visualizationHtml, filename) {
  try {
    // Extract the SVG part from the HTML
    const svgMatch = visualizationHtml.match(/<svg[\s\S]*?<\/svg>/);
    
    if (svgMatch) {
      await window.api.saveDebugFile(svgMatch[0], filename);
      console.log(`Saved visualization to ${filename}`);
      return true;
    } else {
      console.error('Could not extract SVG from visualization HTML');
      return false;
    }
  } catch (error) {
    console.error('Error saving visualization:', error);
    return false;
  }
}

// Update config with form values
function updateConfigFromForm() {
  config.grayscaleMapping.minDepth = parseFloat(minDepthInput.value);
  config.grayscaleMapping.maxDepth = parseFloat(maxDepthInput.value);
  config.grayscaleMapping.invert = invertMappingInput.checked;
  config.machine.feedRates.default = parseInt(feedRateInput.value);
  config.machine.feedRates.plunge = parseInt(plungeRateInput.value);
  config.machine.safeHeight = parseFloat(safeHeightInput.value);
}

// Display GCode preview
function displayGCodePreview() {
  if (!currentGCode) return;
  
  // Create tabs for different views
  const tabContainer = document.createElement('div');
  tabContainer.className = 'preview-tabs';
  
  const gcodeLinkElem = document.createElement('a');
  gcodeLinkElem.innerText = 'GCode';
  gcodeLinkElem.href = '#';
  gcodeLinkElem.className = 'active';
  
  const toolpathLinkElem = document.createElement('a');
  toolpathLinkElem.innerText = 'Toolpath';
  toolpathLinkElem.href = '#';
  
  const gcodePath3DLinkElem = document.createElement('a');
  gcodePath3DLinkElem.innerText = '3D Path';
  gcodePath3DLinkElem.href = '#';
  
  tabContainer.appendChild(gcodeLinkElem);
  tabContainer.appendChild(toolpathLinkElem);
  tabContainer.appendChild(gcodePath3DLinkElem);
  
  // Create container for tab content
  const contentContainer = document.createElement('div');
  contentContainer.className = 'preview-content';
  
  // Create GCode text preview
  const codePreview = document.createElement('pre');
  codePreview.className = 'gcode-text';
  
  // Display just a portion of the GCode for performance
  const gcodeLines = [
    ...currentGCode.header,
    '...',
    ...currentGCode.commands.slice(0, 20),
    '...',
    ...currentGCode.footer
  ];
  
  codePreview.textContent = gcodeLines.join('\n');
  contentContainer.appendChild(codePreview);
  
  // Add metadata display
  const metadata = document.createElement('div');
  metadata.className = 'gcode-metadata';
  metadata.innerHTML = `
    <p>Estimated time: ${formatTime(currentGCode.estimatedTime)}</p>
    <p>Commands: ${currentGCode.commands.length}</p>
    <p>Max depth: ${currentGCode.metadata.maxDepth}mm</p>
  `;
  
  // Clear previous content and add new elements
  gcodePreview.innerHTML = '';
  gcodePreview.appendChild(tabContainer);
  gcodePreview.appendChild(contentContainer);
  gcodePreview.appendChild(metadata);
  
  // Add tab click handlers
  gcodeLinkElem.addEventListener('click', (e) => {
    e.preventDefault();
    gcodeLinkElem.className = 'active';
    toolpathLinkElem.className = '';
    gcodePath3DLinkElem.className = '';
    contentContainer.innerHTML = '';
    contentContainer.appendChild(codePreview);
  });
  
  toolpathLinkElem.addEventListener('click', async (e) => {
    e.preventDefault();
    gcodeLinkElem.className = '';
    toolpathLinkElem.className = 'active';
    gcodePath3DLinkElem.className = '';
    
    contentContainer.innerHTML = 'Loading toolpath visualization...';
    
    try {
      // Request toolpath data and visualization from main process
      if (!toolpathData) {
        // First get processed data if needed
        if (!processedData) {
          processedData = await window.api.getProcessedData(currentSVG.rawData, config);
        }
        // Then get toolpath data from processed data
        toolpathData = await window.api.getToolpathData(processedData, config);
      }
      
      // Generate visualization
      const visualizationHtml = await window.api.getToolpathVisualization(toolpathData, config);
      contentContainer.innerHTML = visualizationHtml;
    } catch (error) {
      contentContainer.innerHTML = `Error generating visualization: ${error.message}`;
    }
  });
  
  gcodePath3DLinkElem.addEventListener('click', async (e) => {
    e.preventDefault();
    gcodeLinkElem.className = '';
    toolpathLinkElem.className = '';
    gcodePath3DLinkElem.className = 'active';
    
    contentContainer.innerHTML = 'Loading 3D path visualization...';
    
    try {
      // Request toolpath data if we don't already have it
      if (!toolpathData) {
        // First get processed data if needed
        if (!processedData) {
          processedData = await window.api.getProcessedData(currentSVG.rawData, config);
        }
        // Then get toolpath data from processed data
        toolpathData = await window.api.getToolpathData(processedData, config);
      }
      
      // Generate 3D visualization
      const visualizationHtml = await window.api.getGCodeVisualization(currentGCode, toolpathData, config);
      contentContainer.innerHTML = visualizationHtml;
    } catch (error) {
      contentContainer.innerHTML = `Error generating 3D path visualization: ${error.message}`;
    }
  });
}

// Format time in seconds to minutes and seconds
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

// Handle progress updates
function handleProgress(progress) {
  // Make sure progress is a number between 0-100
  const percentage = typeof progress === 'number' ? Math.min(100, Math.max(0, progress)) : 0;
  console.log(`Progress update: ${percentage}%`);
  progressFill.style.width = `${percentage}%`;
  
  // Update status text with percentage
  statusText.textContent = `Converting... ${Math.round(percentage)}%`;
}

// Handle conversion complete
function handleConversionComplete() {
  console.log("Conversion complete, updating UI");
  statusText.textContent = 'Conversion complete';
  
  // Make sure the progress bar is at 100%
  progressFill.style.width = '100%';
  
  // Re-enable the convert button
  convertBtn.disabled = false;
  
  // Display GCode preview if we have currentGCode
  if (currentGCode) {
    const commandCount = currentGCode.commands ? currentGCode.commands.length : 0;
    const estimatedTime = currentGCode.estimatedTime ? formatTime(currentGCode.estimatedTime) : 'N/A';
    
    statusText.textContent = `Conversion complete: ${commandCount} commands (Est. time: ${estimatedTime})`;
    displayGCodePreview();
  }
}

// Handle errors
function handleError(message) {
  statusText.textContent = `Error: ${message}`;
  convertBtn.disabled = false;
}

// Open settings modal
function handleOpenSettings() {
  settingsModal.style.display = 'block';
}

// Close modal
function closeModal() {
  settingsModal.style.display = 'none';
}

// Save settings
async function saveSettings() {
  try {
    // This would collect values from the settings forms and update the config
    // For now, we'll just save the current config
    await window.api.saveConfiguration(config);
    statusText.textContent = 'Settings saved';
    closeModal();
  } catch (error) {
    statusText.textContent = `Error: ${error.message}`;
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initApp); 