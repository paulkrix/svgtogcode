const GCodeGenerator = require('../../../src/gcode/gcode-generator');

describe('GCodeGenerator', () => {
  describe('generate', () => {
    test('should generate basic GCode from toolpaths', () => {
      // Create configuration
      const config = {
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
      
      // Create instance
      const gcodeGenerator = new GCodeGenerator(config);
      
      // Setup mock toolpaths
      const toolpathData = {
        toolpaths: [
          {
            id: 'path1',
            type: 'linear',
            points: [
              { x: 0, y: 0, z: 0 },
              { x: 10, y: 10, z: -1 }
            ],
            depth: 1
          }
        ],
        metadata: {
          feedRate: 1000,
          plungeRate: 500,
          maxDepth: 5,
          minDepth: 0,
          toolDiameter: 3
        }
      };
      
      const result = gcodeGenerator.generate(toolpathData);
      
      // Basic validations
      expect(result.header).toContain('G90');
      expect(result.header).toContain('G21');
      expect(result.commands).toContain('G0 Z5');
      expect(result.commands).toContain('G0 X0.000 Y0.000');
      expect(result.commands).toContain('G1 Z0.000 F500');
      expect(result.commands).toContain('G1 X10.000 Y10.000 Z-1.000');
      expect(result.footer).toContain('G0 Z5');
      expect(result.footer).toContain('M2');
    });
    
    test('should respect precision settings', () => {
      // Create configuration with different precision
      const config = {
        output: {
          precision: 2,
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
      
      // Create instance
      const gcodeGenerator = new GCodeGenerator(config);
      
      // Setup mock toolpaths with precise coordinates
      const toolpathData = {
        toolpaths: [
          {
            id: 'path1',
            type: 'linear',
            points: [
              { x: 0, y: 0, z: 0 },
              { x: 10.12345, y: 10.12345, z: -1.12345 }
            ],
            depth: 1.12345
          }
        ],
        metadata: {
          feedRate: 1000,
          plungeRate: 500,
          maxDepth: 5,
          minDepth: 0,
          toolDiameter: 3
        }
      };
      
      const result = gcodeGenerator.generate(toolpathData);
      
      // Check that coordinates use the specified precision
      const commands = result.commands.join('\n');
      expect(commands).toContain('X10.12');
      expect(commands).toContain('Y10.12');
      expect(commands).toContain('Z-1.12');
    });
    
    test('should handle path metadata', () => {
      // Create configuration
      const config = {
        output: {
          precision: 3,
          includeHeader: true,
          includeFooter: true
        },
        machine: {
          safeHeight: 5,
          feedRates: {
            default: 800,
            plunge: 400
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
      
      // Create instance
      const gcodeGenerator = new GCodeGenerator(config);
      
      // Setup mock toolpaths
      const toolpathData = {
        toolpaths: [
          {
            id: 'path1',
            type: 'path',
            points: [
              { x: 10, y: 15, z: -1 },
              { x: 15, y: 10, z: -1 }
            ],
            depth: 1
          }
        ],
        metadata: {
          feedRate: 800,
          plungeRate: 400,
          maxDepth: 5,
          minDepth: 0,
          toolDiameter: 3,
          originalFile: 'test.svg'
        }
      };
      
      const result = gcodeGenerator.generate(toolpathData);
      
      // Verify metadata is included
      expect(result.metadata).toBeDefined();
      expect(result.metadata.originalFile).toBe('test.svg');
      expect(result.metadata.toolDiameter).toBe(3);
      expect(result.metadata.maxDepth).toBe(5);
      expect(result.metadata.minDepth).toBe(0);
      
      // Check that the path ID is included in comments
      const commands = result.commands.join('\n');
      expect(commands).toContain('(Path: path1');
    });
    
    test('should handle empty paths', () => {
      // Create configuration
      const config = {
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
      
      // Create instance
      const gcodeGenerator = new GCodeGenerator(config);
      
      // Setup mock toolpaths with an empty path
      const toolpathData = {
        toolpaths: [
          {
            id: 'empty',
            type: 'path',
            points: [],
            depth: 1
          }
        ],
        metadata: {
          feedRate: 1000,
          plungeRate: 500,
          maxDepth: 5,
          minDepth: 0,
          toolDiameter: 3
        }
      };
      
      const result = gcodeGenerator.generate(toolpathData);
      
      // Check that no path commands were generated for the empty path
      expect(result.commands).toEqual([]);
      
      // But header and footer should still exist
      expect(result.header).not.toEqual([]);
      expect(result.footer).not.toEqual([]);
    });
  });
}); 