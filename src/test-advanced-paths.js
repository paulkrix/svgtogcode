/**
 * Test script for advanced SVG path processing
 * Processes the advanced path test SVG file to verify all path types are handled correctly
 */

const fs = require('fs');
const path = require('path');
const SVGProcessor = require('./svg-processor');

// Run test
async function runTest() {
  console.log("=== Advanced SVG Path Processing Test ===");
  
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'debug_output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Initialize processor
    const processor = new SVGProcessor();
    
    // Read the advanced test SVG file
    const svgPath = path.join(__dirname, '..', 'examples', 'path_test.svg');
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
      }
    };
    
    // Process SVG data
    console.log("\nProcessing SVG data...");
    const processedData = processor.getProcessedData(svgData, config);
    
    // Output summary of processed paths
    console.log(`\nProcessed ${processedData.paths.length} paths:`);
    processedData.paths.forEach((path, index) => {
      console.log(`Path ${index + 1}: type=${path.type}, segments=${path.segments?.length || 0}`);
    });
    
    // Save processed data for inspection
    const processedOutput = path.join(outputDir, 'advanced_processed.json');
    fs.writeFileSync(processedOutput, JSON.stringify(processedData, null, 2));
    console.log("\nSaved processed data to:", processedOutput);
    
    // Generate toolpaths
    console.log("\nGenerating toolpaths...");
    const toolpathData = await processor.getToolpathData(processedData, config);
    
    // Output summary of generated toolpaths
    console.log(`\nGenerated ${toolpathData.toolpaths.length} toolpaths:`);
    toolpathData.toolpaths.forEach((toolpath, index) => {
      console.log(`Toolpath ${index + 1}: ${toolpath.points?.length || 0} points, depth: ${toolpath.depth}mm`);
    });
    
    // Save toolpath data for inspection
    const toolpathOutput = path.join(outputDir, 'advanced_toolpath.json');
    fs.writeFileSync(toolpathOutput, JSON.stringify(toolpathData, null, 2));
    console.log("\nSaved toolpath data to:", toolpathOutput);
    
    // Generate GCode
    console.log("\nGenerating GCode...");
    const gcode = processor.generateGCode(toolpathData, config);
    
    // Save GCode
    const gcodeOutput = path.join(outputDir, 'advanced_gcode.nc');
    fs.writeFileSync(gcodeOutput, gcode);
    console.log("Saved GCode to:", gcodeOutput);
    
    // Generate visualization
    console.log("\nGenerating toolpath visualization...");
    const visualization = processor.getToolpathVisualization(toolpathData, config);
    
    // Save visualization
    const visOutput = path.join(outputDir, 'advanced_visualization.svg');
    fs.writeFileSync(visOutput, visualization);
    console.log("Saved visualization to:", visOutput);
    
    console.log("\n=== Test completed successfully ===");
  } catch (error) {
    console.error("\nTest failed with error:", error);
  }
}

// Run the test
runTest().catch(error => {
  console.error("Unhandled error in runTest:", error);
}); 