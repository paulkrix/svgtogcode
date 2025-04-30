/**
 * Path Generator Module
 * 
 * Generates optimized toolpaths from SVG paths
 */

const svgpath = require('svgpath');
const BezierJS = require('bezier-js');

/**
 * Generates optimized toolpaths from SVG paths
 */
class PathGenerator {
  /**
   * Create a new path generator with configuration
   * @param {Object} config - Configuration for toolpath generation
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Generate toolpaths from processed SVG data
   * @param {Object} processedData - Processed SVG data with depth information
   * @param {Object} svgInput - Original SVG input for reference
   * @returns {Object} Generated toolpaths
   */
  generate(processedData, svgInput) {
    const toolpaths = [];
    
    // Process each path
    processedData.paths.forEach(path => {
      // Generate points based on path type
      const pathPoints = this._generatePathPoints(path, svgInput);
      
      // Add depth to each point
      const pathWithDepth = pathPoints.map(point => ({
        ...point,
        z: -path.depth // Negative depth for CNC (Z goes down)
      }));
      
      // Add to toolpaths
      if (pathWithDepth.length > 0) {
        toolpaths.push({
          id: path.id,
          type: path.type,
          points: pathWithDepth,
          depth: path.depth
        });
      }
    });
    
    // Sort toolpaths by depth (shallow first)
    toolpaths.sort((a, b) => a.depth - b.depth);
    
    // Add metadata
    const result = {
      toolpaths,
      metadata: {
        ...processedData.metadata,
        toolDiameter: this.config.tool.diameter,
        feedRate: this.config.machine.feedRates.default,
        plungeRate: this.config.machine.feedRates.plunge,
        safeHeight: this.config.machine.safeHeight
      }
    };
    
    return result;
  }

  /**
   * Generate points from a path
   * @param {Object} path - Path object
   * @param {SVGInput} svgInput - SVG input for reference
   * @returns {Array} Array of {x, y} points
   */
  _generatePathPoints(path, svgInput) {
    // Handle different path types
    switch (path.type) {
      case 'path':
        return this._processPathData(path.d, svgInput.viewBox);
      case 'rect':
        return this._processPathData(path.d, svgInput.viewBox);
      case 'circle':
        return this._generateCirclePoints(path, svgInput.viewBox);
      case 'ellipse':
        return this._generateEllipsePoints(path, svgInput.viewBox);
      default:
        return [];
    }
  }

  /**
   * Process SVG path data into points
   * @param {string} pathData - SVG path data
   * @param {Object} viewBox - SVG viewBox
   * @returns {Array} Array of {x, y} points
   */
  _processPathData(pathData, viewBox) {
    // Normalize path data based on viewBox
    const normalizedPath = svgpath(pathData)
      .scale(1, 1)
      .rel()
      .round(this.config.output.precision)
      .toString();
    
    // Start with empty points array
    const points = [];
    let currentX = 0;
    let currentY = 0;
    
    // Simple path parser - for production use a more robust library
    // This is a simplified approach
    const commands = normalizedPath.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
    
    commands.forEach(cmd => {
      const type = cmd.charAt(0);
      const args = cmd.substring(1)
        .trim()
        .split(/[\s,]+/)
        .map(parseFloat);
      
      switch (type) {
        case 'm': // moveto
          currentX += args[0];
          currentY += args[1];
          points.push({ x: currentX, y: currentY });
          break;
          
        case 'l': // lineto
          currentX += args[0];
          currentY += args[1];
          points.push({ x: currentX, y: currentY });
          break;
          
        case 'h': // horizontal lineto
          currentX += args[0];
          points.push({ x: currentX, y: currentY });
          break;
          
        case 'v': // vertical lineto
          currentY += args[0];
          points.push({ x: currentX, y: currentY });
          break;
          
        case 'c': // curveto
          // Cubic Bezier curve - convert to points
          if (args.length >= 6) {
            const x1 = currentX + args[0];
            const y1 = currentY + args[1];
            const x2 = currentX + args[2];
            const y2 = currentY + args[3];
            const x = currentX + args[4];
            const y = currentY + args[5];
            
            // Generate points along the curve
            const curve = new BezierJS.Bezier(
              currentX, currentY,
              x1, y1,
              x2, y2,
              x, y
            );
            
            // Get points along the curve (resolution based on configuration)
            const resolution = this.config.toolpath?.resolution || 10;
            const curvePoints = curve.getLUT(resolution).map(pt => ({ x: pt.x, y: pt.y }));
            
            // Add points
            points.push(...curvePoints);
            
            // Update current position
            currentX = x;
            currentY = y;
          }
          break;
          
        case 'z': // closepath
          // If there are points, close back to the first point
          if (points.length > 0) {
            points.push({ x: points[0].x, y: points[0].y });
          }
          break;
          
        // Additional curve types could be added here
      }
    });
    
    // Scale points to machine coordinates
    return this._scalePoints(points, viewBox);
  }

  /**
   * Generate points for a circle
   * @param {Object} circle - Circle data {cx, cy, r}
   * @param {Object} viewBox - SVG viewBox
   * @returns {Array} Array of {x, y} points
   */
  _generateCirclePoints(circle, viewBox) {
    const points = [];
    const { cx, cy, r } = circle;
    
    // Number of segments based on resolution
    const resolution = this.config.toolpath?.resolution || 36;
    const angleStep = (2 * Math.PI) / resolution;
    
    // Generate points around the circle
    for (let i = 0; i <= resolution; i++) {
      const angle = i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push({ x, y });
    }
    
    // Scale points to machine coordinates
    return this._scalePoints(points, viewBox);
  }

  /**
   * Generate points for an ellipse
   * @param {Object} ellipse - Ellipse data {cx, cy, rx, ry}
   * @param {Object} viewBox - SVG viewBox
   * @returns {Array} Array of {x, y} points
   */
  _generateEllipsePoints(ellipse, viewBox) {
    const points = [];
    const { cx, cy, rx, ry } = ellipse;
    
    // Number of segments based on resolution
    const resolution = this.config.toolpath?.resolution || 36;
    const angleStep = (2 * Math.PI) / resolution;
    
    // Generate points around the ellipse
    for (let i = 0; i <= resolution; i++) {
      const angle = i * angleStep;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      points.push({ x, y });
    }
    
    // Scale points to machine coordinates
    return this._scalePoints(points, viewBox);
  }

  /**
   * Scale points from SVG coordinates to machine coordinates
   * @param {Array} points - Array of {x, y} points
   * @param {Object} viewBox - SVG viewBox
   * @returns {Array} Scaled points
   */
  _scalePoints(points, viewBox) {
    // Get machine dimensions
    const machineWidth = this.config.machine.workArea.width;
    const machineHeight = this.config.machine.workArea.height;
    
    // Calculate scaling factors
    const scaleX = machineWidth / viewBox.width;
    const scaleY = machineHeight / viewBox.height;
    
    // Scale each point
    return points.map(point => ({
      x: (point.x - viewBox.minX) * scaleX,
      y: (point.y - viewBox.minY) * scaleY
    }));
  }
}

module.exports = PathGenerator; 