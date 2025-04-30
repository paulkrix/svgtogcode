const fs = require('fs');
const path = require('path');
const SVGParser = require('../../src/parser/svg-parser');
const PathGenerator = require('../../src/toolpath/path-generator');
const GCodeGenerator = require('../../src/gcode/gcode-generator');
const GrayscaleMapper = require('../../src/processor/grayscale-mapper');

describe('Performance Tests', () => {
  // Set timeout to higher value for performance tests
  jest.setTimeout(30000);
  
  test('should process complex SVG within reasonable time', () => {
    // Read the complex test SVG file
    const svgPath = path.join(__dirname, '../test-files/complex-svg.svg');
    const svgString = fs.readFileSync(svgPath, 'utf8');
    
    // Configure the processors
    const pathConfig = {
      output: {
        precision: 3
      },
      tool: {
        diameter: 3
      },
      machine: {
        feedRates: {
          default: 1000,
          plunge: 500
        },
        safeHeight: 5,
        workArea: {
          width: 800,
          height: 800
        }
      },
      toolpath: {
        resolution: 10
      }
    };
    
    const gcodeConfig = {
      output: {
        precision: 3,
        includeHeader: true,
        includeFooter: true
      },
      machine: {
        safeHeight: 5,
        feedRates: {
          default: 1000,
          plunge: 500
        }
      },
      tool: {
        diameter: 3
      },
      grayscaleMapping: {
        minDepth: 0,
        maxDepth: 5
      }
    };
    
    const grayscaleConfig = {
      grayscaleMapping: {
        minDepth: 0,
        maxDepth: 5,
        invert: false
      },
      output: {
        precision: 3
      }
    };
    
    // Create instances
    const pathGenerator = new PathGenerator(pathConfig);
    const gcodeGenerator = new GCodeGenerator(gcodeConfig);
    const grayscaleMapper = new GrayscaleMapper(grayscaleConfig);
    
    // Measure parsing time
    const parseStart = performance.now();
    const svgData = SVGParser.parse(svgString);
    const parseEnd = performance.now();
    const parseTime = parseEnd - parseStart;
    
    console.log(`SVG Parsing took ${parseTime.toFixed(2)}ms`);
    
    // Verify the parsing completed successfully
    expect(svgData).toBeDefined();
    expect(svgData.width).toBe(800);
    expect(svgData.height).toBe(800);
    
    // Ensure parsing completes in reasonable time (adjust threshold as needed)
    expect(parseTime).toBeLessThan(1000); // Should parse in less than 1 second
    
    // Measure grayscale processing time
    const grayscaleStart = performance.now();
    const processedData = grayscaleMapper.process(svgData);
    const grayscaleEnd = performance.now();
    const grayscaleTime = grayscaleEnd - grayscaleStart;
    
    console.log(`Grayscale processing took ${grayscaleTime.toFixed(2)}ms`);
    
    // Measure toolpath generation time
    const toolpathStart = performance.now();
    const toolpathData = pathGenerator.generate(processedData, svgData);
    const toolpathEnd = performance.now();
    const toolpathTime = toolpathEnd - toolpathStart;
    
    console.log(`Toolpath generation took ${toolpathTime.toFixed(2)}ms`);
    
    // Verify toolpath generation completed successfully
    expect(toolpathData).toBeDefined();
    expect(Array.isArray(toolpathData.toolpaths)).toBe(true);
    expect(toolpathData.toolpaths.length).toBeGreaterThan(0);
    
    // Ensure toolpath generation completes in reasonable time
    expect(toolpathTime).toBeLessThan(3000); // Should generate toolpaths in less than 3 seconds
    
    // Measure GCode generation time
    const gcodeStart = performance.now();
    const gcodeData = gcodeGenerator.generate(toolpathData);
    const gcodeEnd = performance.now();
    const gcodeTime = gcodeEnd - gcodeStart;
    
    console.log(`GCode generation took ${gcodeTime.toFixed(2)}ms`);
    
    // Convert GCode data to string for checks
    const gcodeLines = [...gcodeData.header, ...gcodeData.commands, ...gcodeData.footer];
    const gcode = gcodeLines.join('\n');
    
    // Verify GCode generation completed successfully
    expect(gcode).toBeDefined();
    expect(typeof gcode).toBe('string');
    expect(gcode.length).toBeGreaterThan(0);
    
    // Ensure GCode generation completes in reasonable time
    expect(gcodeTime).toBeLessThan(1000); // Should generate GCode in less than 1 second
    
    // Measure total processing time
    const totalTime = parseTime + grayscaleTime + toolpathTime + gcodeTime;
    console.log(`Total processing time: ${totalTime.toFixed(2)}ms`);
    
    // Ensure total processing completes in reasonable time
    expect(totalTime).toBeLessThan(5000); // Should complete full pipeline in less than 5 seconds
    
    // Verify GCode size is reasonable
    const gcodeLines2 = gcode.split('\n').length;
    console.log(`Generated GCode has ${gcodeLines2} lines`);
    
    // Final check on memory usage (optional, only works in Node.js)
    const memoryUsage = process.memoryUsage();
    console.log(`Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
    
    // Ensure memory usage is reasonable
    expect(memoryUsage.heapUsed).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
  });
}); 