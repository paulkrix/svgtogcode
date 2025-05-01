/**
 * Test Script for SVG Teardrop Path Processing
 * 
 * This script specifically tests the processing of the teardrop-shaped path
 * from the test.svg file to diagnose and fix issues with its processing.
 */

const fs = require('fs');
const path = require('path');
const SVGProcessor = require('./svg-processor');

// Create a test SVG with just the teardrop shape
const createTeardropSVG = () => {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect x="0" y="0" width="300" height="300" fill="#f0f0f0" />
  
  <!-- Only the teardrop shape from test.svg -->
  <path d="M 150,100 
           C 180,120 200,150 180,180 
           C 160,200 140,200 120,180 
           C 100,150 120,120 150,100 Z" 
        fill="#505050" />
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
  console.log("=== SVG Teardrop Path Processing Test ===");
  
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'debug_output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create test SVG
    const svgData = createTeardropSVG();
    
    // Save test SVG for reference
    const testSvgPath = path.join(outputDir, 'test_teardrop.svg');
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
      },
      toolpath: {
        resolution: 40  // Increase resolution for better curve quality
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
          console.log(`  Segment ${i + 1}: command=${segment.command}, params=[${segment.params.join(', ')}]`);
        });
      }
    });
    
    // Save processed data for inspection
    const processedOutput = path.join(outputDir, 'teardrop_processed.json');
    fs.writeFileSync(processedOutput, JSON.stringify(processedData, null, 2));
    console.log("Saved processed data to:", processedOutput);
    
    // Generate toolpaths
    console.log("Generating toolpaths...");
    const toolpathData = await processor.getToolpathData(processedData, config);
    
    // Log toolpath information
    console.log(`Generated ${toolpathData.toolpaths.length} toolpaths:`);
    toolpathData.toolpaths.forEach((toolpath, index) => {
      console.log(`Toolpath ${index + 1}: ${toolpath.points?.length || 0} points, depth: ${toolpath.depth}mm`);
      
      // Analyze the points to find any issues
      if (toolpath.points) {
        const points = toolpath.points;
        const validPoints = points.filter(p => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z));
        console.log(`  Valid points: ${validPoints.length}/${points.length}`);
        
        if (validPoints.length < points.length) {
          console.error("  WARNING: Found invalid points in toolpath!");
          points.forEach((p, i) => {
            if (isNaN(p.x) || isNaN(p.y) || isNaN(p.z)) {
              console.error(`  Point ${i}: Invalid values - x:${p.x}, y:${p.y}, z:${p.z}`);
            }
          });
        }
        
        // Check if path is closed properly
        if (points.length > 2) {
          const firstPoint = points[0];
          const lastPoint = points[points.length - 2]; // Skip the final retract
          const distance = Math.sqrt(
            Math.pow(firstPoint.x - lastPoint.x, 2) + 
            Math.pow(firstPoint.y - lastPoint.y, 2)
          );
          console.log(`  Path closure distance: ${distance.toFixed(4)}`);
          if (distance > 0.1) {
            console.warn(`  WARNING: Path may not be properly closed (distance: ${distance.toFixed(4)})`);
          }
        }
      }
    });
    
    // Save toolpath data for inspection
    const toolpathOutput = path.join(outputDir, 'teardrop_toolpath.json');
    fs.writeFileSync(toolpathOutput, JSON.stringify(toolpathData, null, 2));
    console.log("Saved toolpath data to:", toolpathOutput);
    
    // Generate visualization
    console.log("Generating toolpath visualization...");
    const visualization = processor.getToolpathVisualization(toolpathData, config);
    
    // Save visualization
    const visOutput = path.join(outputDir, 'teardrop_visualization.svg');
    fs.writeFileSync(visOutput, visualization);
    console.log("Saved visualization to:", visOutput);
    
    // Generate GCode
    console.log("Generating GCode...");
    const gcode = processor.generateGCode(toolpathData, config);
    
    // Save GCode
    const gcodeOutput = path.join(outputDir, 'teardrop_gcode.nc');
    fs.writeFileSync(gcodeOutput, gcode);
    console.log("Saved GCode to:", gcodeOutput);
    
    console.log("=== Test completed successfully ===");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
runTest(); 