/**
 * Test script for debugging the circle and arc processing issues
 * This script will directly test the SVG processing, GCode generation, and visualization
 * without needing to run the full application
 */

const fs = require('fs');
const path = require('path');
const SVGProcessor = require('./svg-processor');
const PathGenerator = require('./toolpath/path-generator');
const GCodeGenerator = require('./gcode/gcode-generator');

// Ensure debug output directory exists
const DEBUG_DIR = path.join(__dirname, '..', 'debug_output');
if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

// Sample configuration matching the app's settings
const config = {
  output: {
    precision: 3,
    includeHeader: true,
    includeFooter: true,
    gcodeFlavor: 'grbl'
  },
  tool: {
    diameter: 3,
    spindleSpeed: 12000
  },
  grayscaleMapping: {
    minDepth: 0.5,
    maxDepth: 5,
    invert: false
  },
  machine: {
    safeHeight: 5,
    feedRates: {
      default: 1000,
      plunge: 500,
      rapid: 3000
    },
    flavor: 'grbl'
  },
  toolpath: {
    resolution: 72,
    circleSegments: 72,
    optimize: true,
    constantZ: false
  }
};

// Load the test SVG file
const testSvgPath = path.join(DEBUG_DIR, 'original_svg.svg');
let svgData;

try {
  svgData = fs.readFileSync(testSvgPath, 'utf-8');
  console.log(`Loaded SVG file (${svgData.length} bytes)`);
} catch (error) {
  console.error(`Failed to load SVG file: ${error.message}`);
  
  // Create a simple test SVG with circles
  svgData = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect x="0" y="0" width="300" height="300" fill="#f0f0f0" />
  
  <!-- Simple filled circle test -->
  <circle cx="150" cy="150" r="70" fill="#d0d0d0" />
  <circle cx="150" cy="150" r="50" fill="#a0a0a0" />
  <circle cx="150" cy="150" r="30" fill="#707070" />
  <circle cx="150" cy="150" r="15" fill="#404040" />
</svg>`;

  // Save this test SVG
  fs.writeFileSync(testSvgPath, svgData);
  console.log(`Created and saved test SVG file`);
}

// Function to process the SVG and generate debug outputs
async function processAndDebug() {
  console.log('=== Starting SVG to GCode conversion test ===');
  
  try {
    // Initialize the SVG processor
    const svgProcessor = new SVGProcessor();
    console.log('Created SVG processor');
    
    // 1. Process the SVG data
    const processedData = await svgProcessor.getProcessedData(svgData, config);
    console.log(`Processed SVG data with ${processedData.paths.length} paths`);
    
    // Save processed data for inspection
    fs.writeFileSync(
      path.join(DEBUG_DIR, 'processed_data.json'), 
      JSON.stringify(processedData, null, 2)
    );
    
    // 2. Generate SVG visualization of the processed data
    const svgVisualization = svgProcessor.getSVGVisualization(processedData, svgData, config);
    fs.writeFileSync(
      path.join(DEBUG_DIR, 'svg_visualization.svg'),
      svgVisualization
    );
    console.log('Generated SVG visualization');
    
    // 3. Generate toolpath data
    const toolpathData = await svgProcessor.getToolpathData(processedData, config);
    console.log(`Generated ${toolpathData.toolpaths.length} toolpaths`);
    
    // Save toolpath data for inspection
    fs.writeFileSync(
      path.join(DEBUG_DIR, 'toolpath_data.json'),
      JSON.stringify(toolpathData, null, 2)
    );
    
    // 4. Generate toolpath visualization
    const toolpathVisualization = svgProcessor.getToolpathVisualization(toolpathData, config);
    fs.writeFileSync(
      path.join(DEBUG_DIR, 'toolpath_visualization.svg'),
      toolpathVisualization
    );
    console.log('Generated toolpath visualization');
    
    // 5. Generate GCode
    const gcode = svgProcessor.generateGCode(toolpathData, config);
    console.log(`Generated GCode with ${gcode.split('\n').length} lines`);
    
    // Save GCode
    fs.writeFileSync(
      path.join(DEBUG_DIR, 'debug_gcode.nc'),
      gcode
    );
    
    // 6. Generate GCode visualization
    const gcodeVisualization = svgProcessor.getGCodeVisualization(gcode, toolpathData, config);
    fs.writeFileSync(
      path.join(DEBUG_DIR, 'gcode_visualization.svg'),
      gcodeVisualization
    );
    console.log('Generated GCode visualization');
    
    console.log('\n=== Test completed successfully ===');
    console.log(`All debug files saved to: ${DEBUG_DIR}`);
    
  } catch (error) {
    console.error('Error during processing:', error);
  }
}

// Run the test
processAndDebug().catch(console.error); 