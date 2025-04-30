const PathGenerator = require('../../../src/toolpath/path-generator');

describe('PathGenerator', () => {
  describe('generate', () => {
    test('should convert SVG paths to toolpaths', () => {
      // Create configuration
      const config = {
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
      
      // Create instance
      const pathGenerator = new PathGenerator(config);
      
      // Mock SVG data
      const svgData = {
        width: 100,
        height: 100,
        viewBox: { minX: 0, minY: 0, width: 100, height: 100 }
      };
      
      // Mock processed data with depth information
      const processedData = {
        paths: [
          {
            id: 'path1',
            type: 'path',
            d: 'M10,10 L90,10 L90,90 L10,90 Z',
            depth: 2.5
          }
        ],
        metadata: {
          maxDepth: 5,
          minDepth: 0
        }
      };
      
      const result = pathGenerator.generate(processedData, svgData);
      
      expect(result).toBeDefined();
      expect(result.toolpaths).toBeDefined();
      expect(Array.isArray(result.toolpaths)).toBe(true);
      expect(result.toolpaths.length).toBeGreaterThan(0);
      
      // Verify the toolpath contains the correct points
      const path = result.toolpaths.find(tp => tp.type === 'path');
      expect(path).toBeDefined();
      expect(path.points).toBeDefined();
      expect(path.points.length).toBeGreaterThan(0);
      
      // Check if points correspond to the square we defined
      const points = path.points;
      const containsPoint = (x, y) => {
        return points.some(p => Math.abs(p.x - x) < 0.1 && Math.abs(p.y - y) < 0.1);
      };
      
      expect(containsPoint(10, 10)).toBe(true);
      expect(containsPoint(90, 10)).toBe(true);
      expect(containsPoint(90, 90)).toBe(true);
      expect(containsPoint(10, 90)).toBe(true);
      
      // Verify Z depth is correctly applied
      expect(points[0].z).toBe(-2.5); // Z should be negative for CNC
    });
    
    test('should handle different path types', () => {
      // Create configuration
      const config = {
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
      
      // Create instance
      const pathGenerator = new PathGenerator(config);
      
      // Mock SVG data
      const svgData = {
        width: 200,
        height: 200,
        viewBox: { minX: 0, minY: 0, width: 200, height: 200 }
      };
      
      // Mock processed data with different path types
      const processedData = {
        paths: [
          {
            id: 'rect1',
            type: 'rect',
            d: 'M10,10 L60,10 L60,60 L10,60 Z',
            depth: 3
          },
          {
            id: 'circle1',
            type: 'circle',
            cx: 100,
            cy: 100,
            r: 30,
            depth: 2
          }
        ],
        metadata: {
          maxDepth: 5,
          minDepth: 0
        }
      };
      
      const result = pathGenerator.generate(processedData, svgData);
      
      expect(result.toolpaths.length).toBe(2);
      
      // Check that rectangle coordinates are present
      const rect = result.toolpaths.find(tp => tp.id === 'rect1');
      expect(rect).toBeDefined();
      expect(rect.depth).toBe(3);
      
      // Check that circle coordinates are present
      const circle = result.toolpaths.find(tp => tp.id === 'circle1');
      expect(circle).toBeDefined();
      expect(circle.depth).toBe(2);
      
      // Verify circle points are distributed around the center
      const circlePoints = circle.points;
      expect(circlePoints.length).toBeGreaterThan(0);
      
      // Check some points are at the right distance from center
      const isPointNearCircle = (x, y, cx, cy, r) => {
        const dx = x - cx;
        const dy = y - cy;
        const distance = Math.sqrt(dx*dx + dy*dy);
        return Math.abs(distance - r) < 0.5; // Allow small tolerance
      };
      
      const hasCirclePoints = circlePoints.some(p => 
        isPointNearCircle(p.x, p.y, 100, 100, 30)
      );
      
      expect(hasCirclePoints).toBe(true);
    });
    
    test('should sort toolpaths by depth', () => {
      // Create configuration
      const config = {
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
      
      // Create instance
      const pathGenerator = new PathGenerator(config);
      
      // Mock SVG data
      const svgData = {
        width: 100,
        height: 100,
        viewBox: { minX: 0, minY: 0, width: 100, height: 100 }
      };
      
      // Mock processed data with paths at different depths
      // The paths are intentionally out of order
      const processedData = {
        paths: [
          {
            id: 'deep',
            type: 'path',
            d: 'M10,10 L20,10 L20,20 L10,20 Z',
            depth: 5  // Deepest cut
          },
          {
            id: 'shallow',
            type: 'path',
            d: 'M30,30 L40,30 L40,40 L30,40 Z',
            depth: 1  // Shallowest cut
          },
          {
            id: 'medium',
            type: 'path',
            d: 'M50,50 L60,50 L60,60 L50,60 Z',
            depth: 3  // Medium depth
          }
        ],
        metadata: {
          maxDepth: 5,
          minDepth: 0
        }
      };
      
      const result = pathGenerator.generate(processedData, svgData);
      
      // Verify toolpaths are sorted by depth (shallow first)
      expect(result.toolpaths[0].id).toBe('shallow');
      expect(result.toolpaths[1].id).toBe('medium');
      expect(result.toolpaths[2].id).toBe('deep');
    });
  });
}); 