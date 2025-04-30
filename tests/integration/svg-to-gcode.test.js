const fs = require('fs');
const path = require('path');
const SVGParser = require('../../src/parser/svg-parser');
const PathGenerator = require('../../src/toolpath/path-generator');
const GCodeGenerator = require('../../src/gcode/gcode-generator');
const GrayscaleMapper = require('../../src/processor/grayscale-mapper');

describe('SVG to GCode Integration', () => {
  test('should convert a simple SVG to GCode', () => {
    // Create a simple SVG file for testing
    const svgString = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="80" height="80" fill="#808080" />
      </svg>
    `;
    
    // Configure the path generator
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
          width: 500,
          height: 500
        }
      },
      toolpath: {
        resolution: 10
      }
    };
    
    // Configure the GCode generator
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
    
    // Configure the grayscale mapper
    const grayscaleConfig = {
      grayscaleMapping: {
        minDepth: 0,
        maxDepth: 5,
        invert: false
      }
    };
    
    // Create instances
    const pathGenerator = new PathGenerator(pathConfig);
    const gcodeGenerator = new GCodeGenerator(gcodeConfig);
    const grayscaleMapper = new GrayscaleMapper(grayscaleConfig);
    
    // Parse SVG
    const svgData = SVGParser.parse(svgString);
    
    // Process grayscale to depth mapping
    const processedData = grayscaleMapper.process(svgData);
    
    // Generate toolpaths
    const toolpathData = pathGenerator.generate(processedData, svgData);
    
    // Generate GCode
    const gcodeData = gcodeGenerator.generate(toolpathData);
    
    // Convert GCode data to string for checks
    const gcodeLines = [...gcodeData.header, ...gcodeData.commands, ...gcodeData.footer];
    const gcode = gcodeLines.join('\n');
    
    // Verify the GCode has the expected format and commands
    expect(gcode).toContain('G90');
    expect(gcode).toContain('G21');
    expect(gcode).toContain('G0 Z5');
    expect(gcode).toContain('M2');
    
    // Verify toolpath content made it to GCode
    expect(gcode).toContain('X10.000');
    expect(gcode).toContain('Y10.000');
    expect(gcode).toContain('X90.000');
    expect(gcode).toContain('Y90.000');
    
    // Verify the grayscale depth mapping in GCode (50% gray should give -2.5 depth)
    expect(gcode).toContain('Z-2.500');
  });
  
  test('should handle complex shapes and paths', () => {
    // SVG with different element types
    const complexSvg = `
      <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="50" height="50" fill="#404040" />
        <circle cx="100" cy="100" r="30" fill="#808080" />
        <path d="M150,50 L190,50 L170,90 Z" fill="#C0C0C0" />
      </svg>
    `;
    
    // Configure the path generator
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
          width: 500,
          height: 500
        }
      },
      toolpath: {
        resolution: 10
      }
    };
    
    // Configure the GCode generator
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
    
    // Configure the grayscale mapper
    const grayscaleConfig = {
      grayscaleMapping: {
        minDepth: 0,
        maxDepth: 5,
        invert: false
      }
    };
    
    // Create instances
    const pathGenerator = new PathGenerator(pathConfig);
    const gcodeGenerator = new GCodeGenerator(gcodeConfig);
    const grayscaleMapper = new GrayscaleMapper(grayscaleConfig);
    
    // Parse SVG
    const svgData = SVGParser.parse(complexSvg);
    
    // Process grayscale to depth mapping
    const processedData = grayscaleMapper.process(svgData);
    
    // Generate toolpaths
    const toolpathData = pathGenerator.generate(processedData, svgData);
    
    // Generate GCode
    const gcodeData = gcodeGenerator.generate(toolpathData);
    
    // Convert GCode data to string for checks
    const gcodeLines = [...gcodeData.header, ...gcodeData.commands, ...gcodeData.footer];
    const gcode = gcodeLines.join('\n');
    
    // Check for rect coordinates (75% gray = 3.75 depth)
    expect(gcode).toContain('X10.000');
    expect(gcode).toContain('Y10.000');
    expect(gcode).toContain('Z-3.750');
    
    // Check for circle coordinates (50% gray = 2.5 depth)
    expect(gcode).toContain('X100.000');
    expect(gcode).toContain('Y100.000');
    expect(gcode).toContain('Z-2.500');
    
    // Check for triangle coordinates (25% gray = 1.25 depth)
    expect(gcode).toContain('X150.000');
    expect(gcode).toContain('Y50.000');
    expect(gcode).toContain('Z-1.250');
  });
  
  test('should handle empty SVG', () => {
    const emptySvg = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      </svg>
    `;
    
    // Configure the path generator
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
          width: 500,
          height: 500
        }
      }
    };
    
    // Configure the GCode generator
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
    
    // Configure the grayscale mapper
    const grayscaleConfig = {
      grayscaleMapping: {
        minDepth: 0,
        maxDepth: 5,
        invert: false
      }
    };
    
    // Create instances
    const pathGenerator = new PathGenerator(pathConfig);
    const gcodeGenerator = new GCodeGenerator(gcodeConfig);
    const grayscaleMapper = new GrayscaleMapper(grayscaleConfig);
    
    // Parse SVG
    const svgData = SVGParser.parse(emptySvg);
    
    // Process grayscale to depth mapping
    const processedData = grayscaleMapper.process(svgData);
    
    // Generate toolpaths
    const toolpathData = pathGenerator.generate(processedData, svgData);
    
    // Empty SVG should result in empty toolpaths
    expect(toolpathData.toolpaths.length).toBe(0);
    
    // Generate GCode
    const gcodeData = gcodeGenerator.generate(toolpathData);
    
    // Convert GCode data to string for checks
    const gcodeLines = [...gcodeData.header, ...gcodeData.commands, ...gcodeData.footer];
    const gcode = gcodeLines.join('\n');
    
    // Should still have start and end commands
    expect(gcode).toContain('G90');
    expect(gcode).toContain('G21');
    expect(gcode).toContain('G0 Z5');
    expect(gcode).toContain('M2');
    
    // But no movement commands (check commands array is empty)
    expect(gcodeData.commands.length).toBe(0);
  });
}); 