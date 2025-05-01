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
let isSimulating = false;
let simulationTimer = null;
let currentSimulationStep = 0;
let simulationSpeed = 1;

// DOM Elements - Main UI
const loadSvgBtn = document.getElementById('loadSvgBtn');
const saveGcodeBtn = document.getElementById('saveGcodeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const convertBtn = document.getElementById('convertBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const toggleDebugBtn = document.getElementById('toggleDebugBtn');
const svgPreview = document.getElementById('svgPreview');
const visualizationDashboard = document.getElementById('visualizationDashboard');
const toolpathVisualization = document.getElementById('toolpathVisualization');
const gcode3DVisualization = document.getElementById('gcode3DVisualization');
const debugPanel = document.getElementById('debugPanel');
const fileInfo = document.getElementById('fileInfo');
const progressFill = document.getElementById('progressFill');
const statusText = document.getElementById('statusText');

// DOM Elements - Settings Modal
const settingsModal = document.getElementById('settingsModal');
const closeButton = document.querySelector('.close-button');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');

// DOM Elements - View Controls
const syncViewsBtn = document.getElementById('syncViewsBtn');
const viewModeToggle = document.getElementById('viewModeToggle');
const viewModeToggle2D = document.getElementById('viewModeToggle2D');
const viewModeToggle3D = document.getElementById('viewModeToggle3D');
const viewTop = document.getElementById('viewTop');
const viewFront = document.getElementById('viewFront');
const viewSide = document.getElementById('viewSide');
const viewIsometric = document.getElementById('viewIsometric');
const zoomInBtn2D = document.getElementById('zoomInBtn2D');
const zoomOutBtn2D = document.getElementById('zoomOutBtn2D');
const resetViewBtn2D = document.getElementById('resetViewBtn2D');

// DOM Elements - Timeline and Playback
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const speedSelect = document.getElementById('speedSelect');
const timelineSlider = document.getElementById('timelineSlider');
const currentTimeDisplay = document.getElementById('currentTimeDisplay');
const totalTimeDisplay = document.getElementById('totalTimeDisplay');

// DOM Elements - Metadata
const estimatedTime = document.getElementById('estimatedTime');
const cuttingDistance = document.getElementById('cuttingDistance');
const depthRange = document.getElementById('depthRange');
const commandCount = document.getElementById('commandCount');

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
    
    // Apply saved theme
    applySavedTheme();
    
    // Update form values with config
    updateFormFromConfig();
    
    // Setup event listeners
    setupEventListeners();
    
    statusText.textContent = 'Ready';
  } catch (error) {
    statusText.textContent = `Error: ${error.message}`;
  }
}

// Apply saved theme from local storage
function applySavedTheme() {
  const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
  if (isDarkTheme) {
    document.body.classList.add('dark-theme');
    themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    document.body.classList.remove('dark-theme');
    themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
  }
}

// Toggle dark/light theme
function toggleTheme() {
  const isDarkTheme = document.body.classList.toggle('dark-theme');
  localStorage.setItem('darkTheme', isDarkTheme);
  
  if (isDarkTheme) {
    themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
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
  // Button click handlers - Main UI
  loadSvgBtn.addEventListener('click', handleLoadSVG);
  saveGcodeBtn.addEventListener('click', handleSaveGCode);
  settingsBtn.addEventListener('click', handleOpenSettings);
  convertBtn.addEventListener('click', handleConvertSVG);
  themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Settings modal handlers
  closeButton.addEventListener('click', closeModal);
  saveSettingsBtn.addEventListener('click', saveSettings);
  cancelSettingsBtn.addEventListener('click', closeModal);
  
  // View mode toggles
  viewModeToggle.addEventListener('click', () => setViewMode('side-by-side'));
  viewModeToggle2D.addEventListener('click', () => setViewMode('2d-only'));
  viewModeToggle3D.addEventListener('click', () => setViewMode('3d-only'));
  
  // 3D view buttons
  viewTop.addEventListener('click', () => set3DView('top'));
  viewFront.addEventListener('click', () => set3DView('front'));
  viewSide.addEventListener('click', () => set3DView('side'));
  viewIsometric.addEventListener('click', () => set3DView('isometric'));
  
  // Zoom controls
  zoomInBtn2D.addEventListener('click', () => zoom2D('in'));
  zoomOutBtn2D.addEventListener('click', () => zoom2D('out'));
  resetViewBtn2D.addEventListener('click', resetView2D);
  
  // Playback controls
  playBtn.addEventListener('click', startSimulation);
  pauseBtn.addEventListener('click', pauseSimulation);
  stopBtn.addEventListener('click', stopSimulation);
  speedSelect.addEventListener('change', updateSimulationSpeed);
  timelineSlider.addEventListener('input', handleTimelineChange);
  
  // Sync views button
  syncViewsBtn.addEventListener('click', toggleSyncViews);
  
  // Tab handlers for settings modal
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
  
  // Listen for conversion progress and completion
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

// Set view mode (side-by-side, 2D only, 3D only)
function setViewMode(mode) {
  // Reset all buttons
  viewModeToggle.classList.remove('active');
  viewModeToggle2D.classList.remove('active');
  viewModeToggle3D.classList.remove('active');
  
  const toolpathPanel = document.getElementById('toolpathPanel');
  const gcodePanel = document.getElementById('gcodePanel');
  
  switch (mode) {
    case 'side-by-side':
      viewModeToggle.classList.add('active');
      toolpathPanel.style.display = 'flex';
      gcodePanel.style.display = 'flex';
      break;
    case '2d-only':
      viewModeToggle2D.classList.add('active');
      toolpathPanel.style.display = 'flex';
      gcodePanel.style.display = 'none';
      break;
    case '3d-only':
      viewModeToggle3D.classList.add('active');
      toolpathPanel.style.display = 'none';
      gcodePanel.style.display = 'flex';
      break;
  }
}

// Set 3D view perspective
function set3DView(view) {
  // Reset all buttons
  document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
  
  const svg = document.querySelector('#gcode3DVisualization svg');
  if (!svg) return;
  
  switch (view) {
    case 'top':
      viewTop.classList.add('active');
      svg.style.transform = 'rotateX(0deg) rotateY(0deg)';
      break;
    case 'front':
      viewFront.classList.add('active');
      svg.style.transform = 'rotateX(90deg) rotateY(0deg)';
      break;
    case 'side':
      viewSide.classList.add('active');
      svg.style.transform = 'rotateX(0deg) rotateY(90deg)';
      break;
    case 'isometric':
      viewIsometric.classList.add('active');
      svg.style.transform = 'rotateX(45deg) rotateY(45deg)';
      break;
  }
}

// Zoom controls for 2D view
function zoom2D(direction) {
  const svg = document.querySelector('#toolpathVisualization svg');
  if (!svg) return;
  
  // Get current scale from transform or set default
  let currentScale = 1;
  const transformValue = svg.style.transform;
  if (transformValue) {
    const match = transformValue.match(/scale\(([^)]+)\)/);
    if (match && match[1]) {
      currentScale = parseFloat(match[1]);
    }
  }
  
  // Adjust scale
  if (direction === 'in') {
    currentScale += 0.1;
  } else {
    currentScale -= 0.1;
  }
  
  // Limit scale
  currentScale = Math.max(0.5, Math.min(3, currentScale));
  
  // Apply new scale
  svg.style.transform = `scale(${currentScale})`;
}

// Reset 2D view
function resetView2D() {
  const svg = document.querySelector('#toolpathVisualization svg');
  if (svg) {
    svg.style.transform = 'scale(1)';
  }
}

// Toggle sync views
function toggleSyncViews() {
  const isActive = syncViewsBtn.classList.toggle('active');
  
  if (isActive) {
    syncViewsBtn.style.backgroundColor = 'var(--primary-color)';
    syncViewsBtn.style.color = 'white';
  } else {
    syncViewsBtn.style.backgroundColor = '';
    syncViewsBtn.style.color = '';
  }
}

// Timeline simulation controls
function startSimulation() {
  if (isSimulating) return;
  
  isSimulating = true;
  playBtn.disabled = true;
  pauseBtn.disabled = false;
  stopBtn.disabled = false;
  
  simulationSpeed = parseFloat(speedSelect.value);
  
  simulationTimer = setInterval(() => {
    currentSimulationStep += 1 * simulationSpeed;
    
    if (currentSimulationStep > 100) {
      stopSimulation();
      return;
    }
    
    timelineSlider.value = currentSimulationStep;
    updateTimeDisplay();
    
    // Here would be code to update the visualization based on timeline position
  }, 100);
}

function pauseSimulation() {
  if (!isSimulating) return;
  
  isSimulating = false;
  clearInterval(simulationTimer);
  
  playBtn.disabled = false;
  pauseBtn.disabled = true;
}

function stopSimulation() {
  if (simulationTimer) {
    clearInterval(simulationTimer);
  }
  
  isSimulating = false;
  currentSimulationStep = 0;
  timelineSlider.value = 0;
  updateTimeDisplay();
  
  playBtn.disabled = false;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
  
  // Reset visualization to initial state
}

function updateSimulationSpeed() {
  simulationSpeed = parseFloat(speedSelect.value);
}

function handleTimelineChange() {
  currentSimulationStep = parseInt(timelineSlider.value);
  updateTimeDisplay();
  
  // Update visualization based on timeline position
}

function updateTimeDisplay() {
  if (!currentGCode || !currentGCode.estimatedTime) return;
  
  const totalSeconds = currentGCode.estimatedTime;
  const currentSeconds = (currentSimulationStep / 100) * totalSeconds;
  
  currentTimeDisplay.textContent = formatTime(currentSeconds);
  totalTimeDisplay.textContent = formatTime(totalSeconds);
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
    
    // Hide visualization dashboard
    visualizationDashboard.classList.add('hidden');
    
    // Update UI
    fileInfo.textContent = `File: ${currentSVG.filename} (${currentSVG.width}x${currentSVG.height})`;
    svgPreview.innerHTML = currentSVG.rawData;
    convertBtn.disabled = false;
    saveGcodeBtn.disabled = true;
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
      currentGCode.header ? currentGCode.header.length : 0, "header lines",
      currentGCode.footer ? currentGCode.footer.length : 0, "footer lines");
    
    // Get processed data and toolpath data for visualization
    console.log("Getting processed data...");
    processedData = await window.api.getProcessedData(currentSVG.rawData, config);
    
    console.log("Getting toolpath data...");
    toolpathData = await window.api.getToolpathData(processedData, config);
    
    // Generate visualizations
    console.log("Generating visualizations...");
    const svgVisualization = await window.api.getSVGVisualization(processedData, currentSVG.rawData, config);
    const toolpathVisualizationHtml = await window.api.getToolpathVisualization(toolpathData, config);
    const gcodeVisualization = await window.api.getGCodeVisualization(currentGCode, toolpathData, config);
    
    // Save visualizations to debug output
    await saveVisualizationToFile(extractSvg(svgVisualization), 'debug_output/svg_visualization.svg');
    await saveVisualizationToFile(extractSvg(toolpathVisualizationHtml), 'debug_output/toolpath_visualization.svg');
    await saveVisualizationToFile(extractSvg(gcodeVisualization), 'debug_output/gcode_visualization.svg');
    
    // Save toolpath data for debugging
    await window.api.saveDebugFile(
      JSON.stringify(toolpathData, null, 2),
      'debug_output/toolpath_data.json'
    );
    
    // Save GCode for debugging
    const debugGCode = [
      ...currentGCode.header,
      ...currentGCode.commands,
      ...currentGCode.footer
    ].join('\n');
    await window.api.saveDebugFile(debugGCode, 'debug_output/debug_gcode.nc');
    
    // Update visualizations
    toolpathVisualization.innerHTML = toolpathVisualizationHtml;
    gcode3DVisualization.innerHTML = gcodeVisualization;
    
    // Make visualization dashboard visible
    visualizationDashboard.classList.remove('hidden');
    
    // Update metadata
    updateMetadata();
    
    // Initialize timeline
    initializeTimeline();
    
    // Enable save button
    saveGcodeBtn.disabled = false;
    
    statusText.textContent = 'Conversion complete';
  } catch (error) {
    console.error('Error converting SVG:', error);
    statusText.textContent = `Error: ${error.message}`;
    convertBtn.disabled = false;
  }
}

// Extract SVG content from HTML
const extractSvg = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const svgElement = doc.querySelector('svg');
  
  if (svgElement) {
    return svgElement.outerHTML;
  }
  
  return '';
};

// Save visualization to file
async function saveVisualizationToFile(visualizationHtml, filename) {
  try {
    if (!visualizationHtml) {
      console.warn(`No visualization HTML to save to ${filename}`);
      return;
    }
    
    await window.api.saveDebugFile(visualizationHtml, filename);
    console.log(`Saved visualization to ${filename}`);
  } catch (error) {
    console.error(`Error saving visualization to ${filename}:`, error);
  }
}

// Update metadata display in the UI
function updateMetadata() {
  if (!currentGCode || !toolpathData) return;
  
  // Estimated time
  estimatedTime.textContent = formatTime(currentGCode.estimatedTime || 0);
  
  // Command count
  commandCount.textContent = currentGCode.commands ? currentGCode.commands.length.toString() : '0';
  
  // Depth range
  const minDepth = config.grayscaleMapping.minDepth;
  const maxDepth = config.grayscaleMapping.maxDepth;
  depthRange.textContent = `${minDepth} - ${maxDepth} mm`;
  
  // Calculate cutting distance (estimation)
  let totalDistance = 0;
  if (toolpathData && toolpathData.toolpaths) {
    toolpathData.toolpaths.forEach(path => {
      if (path.points && path.points.length > 1) {
        for (let i = 1; i < path.points.length; i++) {
          const dx = path.points[i].x - path.points[i-1].x;
          const dy = path.points[i].y - path.points[i-1].y;
          totalDistance += Math.sqrt(dx*dx + dy*dy);
        }
      }
    });
  }
  
  cuttingDistance.textContent = totalDistance < 1000 
    ? `${totalDistance.toFixed(1)} mm` 
    : `${(totalDistance / 1000).toFixed(2)} m`;
}

// Initialize timeline with estimated time
function initializeTimeline() {
  if (!currentGCode) return;
  
  const totalTime = currentGCode.estimatedTime || 0;
  timelineSlider.value = 0;
  currentSimulationStep = 0;
  
  currentTimeDisplay.textContent = '00:00';
  totalTimeDisplay.textContent = formatTime(totalTime);
  
  // Reset controls
  playBtn.disabled = false;
  pauseBtn.disabled = true;
  stopBtn.disabled = true;
}

// Update config from form
function updateConfigFromForm() {
  config.grayscaleMapping.minDepth = parseFloat(minDepthInput.value);
  config.grayscaleMapping.maxDepth = parseFloat(maxDepthInput.value);
  config.grayscaleMapping.invert = invertMappingInput.checked;
  config.machine.feedRates.default = parseInt(feedRateInput.value);
  config.machine.feedRates.plunge = parseInt(plungeRateInput.value);
  config.machine.safeHeight = parseFloat(safeHeightInput.value);
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