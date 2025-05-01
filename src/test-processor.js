/**
 * Test script for SVG processor
 * This script processes the test SVG file directly without going through the UI
 */

const fs = require('fs');
const path = require('path');
const SVGProcessor = require('./svg-processor');

// Load test.svg
function runTest() {
  console.log("=== SVG Processor Test ===");
  
  try {
    // Initialize processor
    const processor = new SVGProcessor();
    
    // Read the test SVG file
    const svgPath = path.join(__dirname, '..', 'test.svg');
    console.log("Reading SVG file:", svgPath);
    
    const svgData = fs.readFileSync(svgPath, 'utf8');
    console.log("SVG data loaded, size:", svgData.length, "characters");
    
    // Define test configuration
    const config = {
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
        }
      },
      gcodeSettings: {
        startGcode: 'G90\nG21\nG0 Z5\nM3 S12000',
        endGcode: 'G0 Z10\nM5\nM2'
      }
    };
    
    // Process raw SVG data
    console.log("Processing SVG data...");
    const processedData = processor.getProcessedData(svgData, config);
    
    // Save processed data for inspection
    const processedOutput = path.join(__dirname, '..', 'debug_output', 'processed_data.json');
    fs.writeFileSync(processedOutput, JSON.stringify(processedData, null, 2));
    console.log("Saved processed data to:", processedOutput);
    
    // Generate toolpaths
    console.log("Generating toolpaths...");
    const toolpathData = processor.getToolpathData(processedData, config);
    
    // Save toolpath data for inspection
    const toolpathOutput = path.join(__dirname, '..', 'debug_output', 'test_toolpath_data.json');
    fs.writeFileSync(toolpathOutput, JSON.stringify(toolpathData, null, 2));
    console.log("Saved toolpath data to:", toolpathOutput);
    
    // Print summary of toolpaths
    if (toolpathData && toolpathData.toolpaths && toolpathData.toolpaths.length > 0) {
      console.log(`Generated ${toolpathData.toolpaths.length} toolpaths:`);
      toolpathData.toolpaths.forEach((toolpath, index) => {
        console.log(`Toolpath ${index + 1}: ${toolpath.points.length} points, depth: ${toolpath.depth}mm`);
      });
    } else {
      console.log("No toolpaths were generated or toolpaths array is empty.");
    }
    
    // Generate GCode
    console.log("Generating GCode...");
    const gcode = processor.generateGCode(toolpathData, config);
    
    // Save GCode
    const gcodeOutput = path.join(__dirname, '..', 'debug_output', 'test_gcode.nc');
    fs.writeFileSync(gcodeOutput, gcode);
    console.log("Saved GCode to:", gcodeOutput);
    
    // Generate visualization
    console.log("Generating toolpath visualization...");
    const visualization = processor.getToolpathVisualization(toolpathData, config);
    
    // Save visualization
    const visOutput = path.join(__dirname, '..', 'debug_output', 'test_visualization.svg');
    fs.writeFileSync(visOutput, visualization);
    console.log("Saved visualization to:", visOutput);
    
    console.log("=== Test completed successfully ===");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
runTest(); 