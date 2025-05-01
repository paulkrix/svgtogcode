/**
 * Test Script for SVG Path Processing
 * 
 * This script tests the processing of different SVG path types (non-circular paths)
 * to help diagnose and fix issues with path processing.
 */

const fs = require('fs');
const path = require('path');
const SVGProcessor = require('./svg-processor');

// Create a simple SVG with various path types for testing
const createTestSVG = () => {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect x="0" y="0" width="300" height="300" fill="#f0f0f0" />
  
  <!-- Rectangles -->
  <rect x="20" y="20" width="60" height="40" fill="#606060" />
  <rect x="100" y="20" width="50" height="40" rx="10" ry="10" fill="#808080" />
  
  <!-- Basic path - triangle -->
  <path d="M 180,20 L 230,60 L 180,60 Z" fill="#404040" />
  
  <!-- Bezier path -->
  <path d="M 50,100 C 80,80 120,80 150,100 S 220,120 250,100" 
        fill="none" stroke="#303030" stroke-width="3" />
  
  <!-- Combination path with multiple commands -->
  <path d="M 50,150 h 50 v 30 h -50 Z" fill="#505050" />
  
  <!-- Path with quadratic bezier -->
  <path d="M 150,150 Q 200,120 250,150 T 350,150" 
        fill="none" stroke="#606060" stroke-width="2" />
  
  <!-- Regular polygon (hexagon) -->
  <path d="M 75,240 L 125,220 L 175,240 L 175,280 L 125,300 L 75,280 Z" 
        fill="#707070" />
  
  <!-- Line elements -->
  <line x1="200" y1="200" x2="250" y2="250" stroke="#000000" stroke-width="3" />
  <line x1="250" y1="200" x2="200" y2="250" stroke="#000000" stroke-width="3" />
</svg>`;
};

// Configure debug output
const enableDebugLog = true;
const logDetail = (label, data) => {
  if (enableDebugLog) {
    if (typeof data === 'object') {
      console.log(`[DEBUG] ${label}:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`[DEBUG] ${label}:`, data);
    }
  }
};

// Run test
async function runTest() {
  console.log("=== SVG Path Processing Test ===");
  
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'debug_output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create test SVG
    const svgData = createTestSVG();
    
    // Save test SVG for reference
    const testSvgPath = path.join(outputDir, 'test_paths.svg');
    fs.writeFileSync(testSvgPath, svgData);
    console.log("Created test SVG at:", testSvgPath);
    
    // Initialize processor
    const processor = new SVGProcessor();
    
    // Configuration
    const config = {
      grayscaleMapping: {
        enabled: true,
        minDepth: 0.5,
        maxDepth: 3,
        invert: false
      },
      machine: {
        type: 'grbl',
        units: 'mm',
        feedRates: {
          default: 1000,
          rapid: 3000,
          plunge: 500
        }
      }
    };
    
    // Process SVG data
    console.log("Processing SVG data...");
    const processedData = processor.getProcessedData(svgData, config);
    
    // Log detailed information about path extraction
    logDetail("Extracted paths count", processedData.paths.length);
    processedData.paths.forEach((path, index) => {
      console.log(`Path ${index + 1}: type=${path.type}, segments=${path.segments?.length || 0}`);
      
      if (path.segments) {
        path.segments.forEach((segment, i) => {
          console.log(`  Segment ${i + 1}: command=${segment.command}, params=${segment.params}`);
        });
      }
    });
    
    // Save processed data for inspection
    const processedOutput = path.join(outputDir, 'path_test_processed.json');
    fs.writeFileSync(processedOutput, JSON.stringify(processedData, null, 2));
    console.log("Saved processed data to:", processedOutput);
    
    // Generate toolpaths
    console.log("Generating toolpaths...");
    const toolpathData = await processor.getToolpathData(processedData, config);
    
    // Log toolpath information
    console.log(`Generated ${toolpathData.toolpaths.length} toolpaths:`);
    toolpathData.toolpaths.forEach((toolpath, index) => {
      console.log(`Toolpath ${index + 1}: ${toolpath.points?.length || 0} points, depth: ${toolpath.depth}mm`);
    });
    
    // Save toolpath data for inspection
    const toolpathOutput = path.join(outputDir, 'path_test_toolpath.json');
    fs.writeFileSync(toolpathOutput, JSON.stringify(toolpathData, null, 2));
    console.log("Saved toolpath data to:", toolpathOutput);
    
    // Generate visualization
    console.log("Generating toolpath visualization...");
    const visualization = processor.getToolpathVisualization(toolpathData, config);
    
    // Save visualization
    const visOutput = path.join(outputDir, 'path_test_visualization.svg');
    fs.writeFileSync(visOutput, visualization);
    console.log("Saved visualization to:", visOutput);
    
    // Generate GCode
    console.log("Generating GCode...");
    const gcode = processor.generateGCode(toolpathData, config);
    
    // Save GCode
    const gcodeOutput = path.join(outputDir, 'path_test_gcode.nc');
    fs.writeFileSync(gcodeOutput, gcode);
    console.log("Saved GCode to:", gcodeOutput);
    
    console.log("=== Test completed successfully ===");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
runTest(); 