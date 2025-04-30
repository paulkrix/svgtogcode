/**
 * Test Script for SVG Line Element Support
 * 
 * This script tests the processing of SVG line elements by loading
 * the original SVG from debug_output and verifying that lines are
 * properly processed in the conversion pipeline.
 */

const fs = require('fs');
const path = require('path');
const SVGParser = require('./parser/svg-parser');
const GrayscaleMapper = require('./processor/grayscale-mapper');
const PathGenerator = require('./toolpath/path-generator');
const GCodeGenerator = require('./gcode/gcode-generator');

// Configuration
const config = {
  output: {
    precision: 3
  },
  tool: {
    diameter: 3
  },
  machine: {
    feedRates: {
      default: 800,
      plunge: 300
    },
    safeHeight: 5,
    workArea: {
      width: 500,
      height: 500
    }
  },
  grayscaleMapping: {
    minDepth: 0.5,
    maxDepth: 5,
    invert: false
  },
  toolpath: {
    resolution: 10
  }
};

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../debug_output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Load SVG file
const svgFilePath = path.join(__dirname, '../debug_output/original_svg.svg');
const svgContent = fs.readFileSync(svgFilePath, 'utf8');

// Process SVG file
console.log('Parsing SVG...');
const svgData = SVGParser.parse(svgContent);

// Count elements by type
const elementCounts = {};
svgData.paths.forEach(path => {
  elementCounts[path.type] = (elementCounts[path.type] || 0) + 1;
});
console.log('Element counts:', elementCounts);

// Process grayscale to depth mapping
console.log('Processing depth mapping...');
const grayscaleMapper = new GrayscaleMapper(config);
const processedData = grayscaleMapper.process(svgData);

// Log processed paths
console.log(`Processed ${processedData.paths.length} paths`);
const lineElements = processedData.paths.filter(path => path.type === 'line');
console.log(`Found ${lineElements.length} line elements with depths:`);
lineElements.forEach((line, index) => {
  console.log(`  Line ${index + 1}: depth = ${line.depth}mm`);
});

// Generate toolpaths
console.log('Generating toolpaths...');
const pathGenerator = new PathGenerator(config);
const toolpathData = pathGenerator.generate(processedData, svgData);

// Save toolpath data for inspection
fs.writeFileSync(
  path.join(outputDir, 'updated_toolpath_data.json'), 
  JSON.stringify(toolpathData, null, 2)
);

// Generate GCode
console.log('Generating GCode...');
const gcodeGenerator = new GCodeGenerator(config);
const gcodeData = gcodeGenerator.generate(toolpathData);

// Save GCode
const gcodePath = path.join(outputDir, 'updated_gcode.nc');
const gcodeContent = [
  ...gcodeData.header,
  ...gcodeData.commands,
  ...gcodeData.footer
].join('\n');

fs.writeFileSync(gcodePath, gcodeContent);
console.log(`GCode saved to ${gcodePath}`);

console.log('Test completed successfully!'); 