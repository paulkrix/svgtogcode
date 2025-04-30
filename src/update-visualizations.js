/**
 * Update Visualizations Script
 * 
 * Generates updated visualizations after the line element support fix
 */

const fs = require('fs');
const path = require('path');
const SVGParser = require('./parser/svg-parser');
const GrayscaleMapper = require('./processor/grayscale-mapper');
const PathGenerator = require('./toolpath/path-generator');
const GCodeGenerator = require('./gcode/gcode-generator');
const SVGVisualizer = require('./visualization/svg-visualizer');
const GCodeVisualizer = require('./visualization/gcode-visualizer');

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
const svgFilePath = path.join(outputDir, 'original_svg.svg');
const svgContent = fs.readFileSync(svgFilePath, 'utf8');

// Create visualizers
const svgVisualizer = new SVGVisualizer();
const gcodeVisualizer = new GCodeVisualizer(config);

// Process SVG file
console.log('Parsing SVG...');
const svgData = SVGParser.parse(svgContent);

// Save the parsed SVG data for debugging
fs.writeFileSync(
  path.join(outputDir, 'parsed_svg_data.json'),
  JSON.stringify(svgData, null, 2)
);

// Process depth mapping
console.log('Processing depth mapping...');
const grayscaleMapper = new GrayscaleMapper(config);
const processedData = grayscaleMapper.process(svgData);

// Generate toolpaths
console.log('Generating toolpaths...');
const pathGenerator = new PathGenerator(config);
const toolpathData = pathGenerator.generate(processedData, svgData);

// Generate toolpath visualization
console.log('Generating toolpath visualization...');
const toolpathSvg = svgVisualizer.generateToolpathPreview(toolpathData);
fs.writeFileSync(
  path.join(outputDir, 'updated_toolpath_visualization.svg'),
  toolpathSvg
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

// Generate GCode visualization
console.log('Generating GCode visualization...');
const gcodeVisualization = gcodeVisualizer.generateGCodePreview(
  { commands: gcodeContent.split('\n'), estimatedTime: 60 }, 
  toolpathData
);
fs.writeFileSync(
  path.join(outputDir, 'updated_gcode_visualization.svg'),
  gcodeVisualization
);

console.log('Visualizations updated successfully!');
console.log('Files saved to:', outputDir); 