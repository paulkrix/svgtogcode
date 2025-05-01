/**
 * Debug script for circle and arc processing issues
 * This script focuses specifically on how circles and arcs are processed
 */

const fs = require('fs');
const path = require('path');
const SVGProcessor = require('./svg-processor');
const PathGenerator = require('./toolpath/path-generator');
const GCodeGenerator = require('./gcode/gcode-generator');

// Create output directory
const outputDir = path.join(__dirname, '..', 'debug_output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to create test SVGs
function createTestSVG(testName, content) {
  const svgContent = `
<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  ${content}
</svg>
  `;
  const filePath = path.join(outputDir, `${testName}.svg`);
  fs.writeFileSync(filePath, svgContent);
  return { path: filePath, content: svgContent };
}

// Test cases
const testCases = [
  {
    name: 'simple_circle',
    content: '<circle cx="150" cy="150" r="50" fill="black" />',
    description: 'Simple centered circle with 50px radius'
  },
  {
    name: 'small_circle',
    content: '<circle cx="150" cy="150" r="10" fill="black" />',
    description: 'Small circle with 10px radius'
  },
  {
    name: 'offset_circle', 
    content: '<circle cx="100" cy="200" r="40" fill="black" />',
    description: 'Circle offset from center'
  },
  {
    name: 'simple_arc',
    content: '<path d="M 50,150 A 100,50 0 0 1 250,150" fill="none" stroke="black" stroke-width="2" />',
    description: 'Simple arc path'
  },
  {
    name: 'half_circle_arc',
    content: '<path d="M 50,150 A 100,100 0 0 1 250,150" fill="none" stroke="black" stroke-width="2" />',
    description: 'Half-circle arc'
  },
  {
    name: 'rectangle_comparison',
    content: '<rect x="100" y="100" width="100" height="100" fill="black" />',
    description: 'Rectangle for comparison'
  }
];

// Common configuration
const config = {
  output: {
    includeHeader: true,
    includeFooter: true,
    precision: 3
  },
  grayscaleMapping: {
    minDepth: 0.5,
    maxDepth: 5,
    invert: false
  },
  machine: {
    flavor: 'grbl',
    feedRates: {
      default: 1000,
      plunge: 500,
      rapid: 3000
    },
    safeHeight: 5
  },
  tool: {
    diameter: 3,
    spindleSpeed: 12000
  },
  toolpath: {
    resolution: 72,
    circleSegments: 72,
    optimize: false // Disable optimization for debugging
  }
};

// Process each test case
async function runTests() {
  console.log('Starting circle and arc debugging tests');
  
  for (const test of testCases) {
    console.log(`\nProcessing test: ${test.name} - ${test.description}`);
    
    // Create SVG file
    const svg = createTestSVG(test.name, test.content);
    console.log(`Created SVG file: ${svg.path}`);
    
    try {
      // Process SVG
      const svgProcessor = new SVGProcessor();
      const processedData = svgProcessor.getProcessedData(svg.content, config);
      
      // Save processed data
      const processedOutputPath = path.join(outputDir, `${test.name}_processed.json`);
      fs.writeFileSync(processedOutputPath, JSON.stringify(processedData, null, 2));
      
      // Generate toolpath
      const pathGenerator = new PathGenerator({
        toolpath: {
          resolution: 72, // Higher resolution for smoother curves
          circleSegments: 72
        }
      });
      
      // Create toolpaths directly from processed data
      const toolpaths = [];
      for (const path of processedData.paths) {
        const points = pathGenerator._generatePathPoints(path, processedData);
        if (points && points.length > 0) {
          toolpaths.push({
            type: path.type,
            id: path.id || `path_${toolpaths.length}`,
            depth: path.grayscale ? (5 - path.grayscale * 4.5) : 1,
            points: points,
            originalPath: path.d
          });
        }
      }
      
      // Structure toolpathData in the format GCodeGenerator expects
      const toolpathData = { 
        toolpaths: toolpaths,
        metadata: {
          maxDepth: 5,
          minDepth: 0.5,
          toolDiameter: 3
        }
      };
      
      // Save toolpath data
      const toolpathOutputPath = path.join(outputDir, `${test.name}_toolpath.json`);
      fs.writeFileSync(toolpathOutputPath, JSON.stringify(toolpathData, null, 2));
      
      // Generate G-code
      const gcodeGenerator = new GCodeGenerator({
        machine: {
          flavor: 'grbl',
          feedRates: {
            default: 1000,
            plunge: 300,
            rapid: 3000
          },
          safeHeight: 5
        },
        tool: {
          diameter: 3,
          spindleSpeed: 12000
        },
        toolpath: {
          constantZ: true
        },
        output: {
          includeHeader: true,
          includeFooter: true,
          precision: 3
        },
        grayscaleMapping: {
          minDepth: 0.5,
          maxDepth: 5
        }
      });
      
      const gcodeResult = gcodeGenerator.generate(toolpathData);
      
      // Concatenate header, commands and footer for the complete GCode
      const gcodeLines = [
        ...gcodeResult.header,
        ...gcodeResult.commands,
        ...gcodeResult.footer
      ];
      
      // Save G-code
      const gcodeOutputPath = path.join(outputDir, `${test.name}_gcode.nc`);
      fs.writeFileSync(gcodeOutputPath, gcodeLines.join('\n'));
      
      // Save raw points data for inspection
      if (toolpathData.toolpaths && toolpathData.toolpaths.length > 0) {
        const pointsData = toolpathData.toolpaths.map(path => ({
          type: path.type,
          depth: path.depth,
          points: path.points
        }));
        
        const pointsOutputPath = path.join(outputDir, `${test.name}_points.json`);
        fs.writeFileSync(pointsOutputPath, JSON.stringify(pointsData, null, 2));
      }
      
      console.log(`Generated files for ${test.name}:`);
      console.log(`- Processed data: ${processedOutputPath}`);
      console.log(`- Toolpath: ${toolpathOutputPath}`);
      console.log(`- GCode: ${gcodeOutputPath}`);
      
    } catch (error) {
      console.error(`Error processing ${test.name}:`, error);
    }
  }
  
  console.log('\nAll tests completed!');
}

// Run the tests
runTests().catch(console.error); 