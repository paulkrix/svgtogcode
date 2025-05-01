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
    let toolpaths = [];
    
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
    
    // Apply path optimization if enabled
    if (this.config.toolpath?.optimize) {
      toolpaths = this._optimizeToolpaths(toolpaths);
    }
    
    // Sort toolpaths by depth (shallow first)
    toolpaths.sort((a, b) => a.depth - b.depth);
    
    // Add metadata
    const result = {
      toolpaths,
      metadata: {
        ...processedData.metadata,
        toolDiameter: this.config.tool.diameter,
        feedRates: {
          default: this.config.machine.feedRates.default,
          plunge: this.config.machine.feedRates.plunge,
          rapid: this.config.machine.feedRates.rapid
        },
        safeHeight: this.config.machine.safeHeight
      }
    };
    
    return result;
  }

  /**
   * Optimize toolpaths for efficient machining
   * @param {Array} toolpaths - Original toolpaths
   * @returns {Array} Optimized toolpaths
   */
  _optimizeToolpaths(toolpaths) {
    // Group paths by depth
    const pathsByDepth = {};
    
    toolpaths.forEach(path => {
      const depthKey = path.depth.toFixed(3);
      if (!pathsByDepth[depthKey]) {
        pathsByDepth[depthKey] = [];
      }
      pathsByDepth[depthKey].push(path);
    });
    
    const optimizedToolpaths = [];
    
    // Optimize each depth group separately
    Object.values(pathsByDepth).forEach(depthGroup => {
      // For each depth, reorder paths to minimize travel distance
      const reorderedPaths = this._reorderPathsForMinimumTravel(depthGroup);
      
      // For each path, apply path smoothing if enabled
      const smoothedPaths = reorderedPaths.map(path => {
        const smoothedPoints = this._smoothPathPoints(path.points);
        return { ...path, points: smoothedPoints };
      });
      
      optimizedToolpaths.push(...smoothedPaths);
    });
    
    return optimizedToolpaths;
  }
  
  /**
   * Reorder paths to minimize travel distance
   * @param {Array} paths - Paths to reorder
   * @returns {Array} Reordered paths for minimum travel distance
   */
  _reorderPathsForMinimumTravel(paths) {
    if (!paths || paths.length <= 1) {
      return paths;
    }
    
    const reordered = [];
    const remaining = [...paths];
    
    // Start with first path
    let currentPath = remaining.shift();
    reordered.push(currentPath);
    
    // Get last point of the current path as the current position
    let currentPosition = this._getLastPoint(currentPath);
    
    // Keep finding the next closest path until no more paths remain
    while (remaining.length > 0) {
      let closestPathIndex = this._findClosestPathIndex(currentPosition, remaining);
      currentPath = remaining.splice(closestPathIndex, 1)[0];
      reordered.push(currentPath);
      
      // Update current position
      currentPosition = this._getLastPoint(currentPath);
    }
    
    return reordered;
  }
  
  /**
   * Find the index of the closest path from the current position
   * @param {Object} position - Current {x, y} position
   * @param {Array} paths - Remaining paths
   * @returns {number} Index of the closest path
   */
  _findClosestPathIndex(position, paths) {
    let closestIndex = 0;
    let closestDistance = Number.MAX_VALUE;
    
    paths.forEach((path, index) => {
      if (path.points && path.points.length > 0) {
        const firstPoint = path.points[0];
        const distance = Math.sqrt(
          Math.pow(position.x - firstPoint.x, 2) +
          Math.pow(position.y - firstPoint.y, 2)
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });
    
    return closestIndex;
  }
  
  /**
   * Get the last point of a path
   * @param {Object} path - Path object
   * @returns {Object} Last point {x, y}
   */
  _getLastPoint(path) {
    if (!path.points || path.points.length === 0) {
      return { x: 0, y: 0 };
    }
    
    return path.points[path.points.length - 1];
  }
  
  /**
   * Apply smoothing to path points to reduce jerky movements
   * @param {Array} points - Original points
   * @returns {Array} Smoothed points
   */
  _smoothPathPoints(points) {
    if (!points || points.length <= 2) {
      return points;
    }
    
    const smoothLevel = this.config.toolpath?.smoothingLevel || 0.2;
    
    // If smoothing is disabled, return original points
    if (smoothLevel <= 0) {
      return points;
    }
    
    // Create a copy of the points array to avoid modifying the original
    const result = [...points];
    
    // Apply Chaikin's smoothing algorithm
    // This algorithm creates a smoother curve by taking each pair of points
    // and replacing them with two new points that are positioned between the original points
    for (let iteration = 0; iteration < 3; iteration++) {
      const newPoints = [];
      
      // Always keep the first point
      newPoints.push(result[0]);
      
      for (let i = 0; i < result.length - 1; i++) {
        const current = result[i];
        const next = result[i + 1];
        
        // Calculate first quarter point
        const q1 = {
          x: current.x + (next.x - current.x) * 0.25,
          y: current.y + (next.y - current.y) * 0.25,
          z: current.z + (next.z - current.z) * 0.25
        };
        
        // Calculate third quarter point
        const q3 = {
          x: current.x + (next.x - current.x) * 0.75,
          y: current.y + (next.y - current.y) * 0.75,
          z: current.z + (next.z - current.z) * 0.75
        };
        
        newPoints.push(q1);
        newPoints.push(q3);
      }
      
      // Always keep the last point
      newPoints.push(result[result.length - 1]);
      
      // Update the result with the new smoothed points
      result.length = 0;
      result.push(...newPoints);
    }
    
    // Apply adaptive decimation to reduce the number of points
    // while preserving the overall shape
    return this._adaptiveDecimation(result);
  }
  
  /**
   * Apply adaptive decimation to reduce the number of points
   * @param {Array} points - Original points
   * @returns {Array} Decimated points
   */
  _adaptiveDecimation(points) {
    if (points.length <= 10) {
      return points;
    }
    
    const tolerance = this.config.toolpath?.decimationTolerance || 0.05;
    
    // We always keep the first and last points
    const result = [points[0]];
    
    // The Douglas-Peucker algorithm
    const douglasPeucker = (startIndex, endIndex) => {
      // Find the point furthest from the line from start to end
      let maxDistance = 0;
      let maxIndex = 0;
      
      const startPoint = points[startIndex];
      const endPoint = points[endIndex];
      
      // Calculate line segment length
      const lineLength = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.y - startPoint.y, 2)
      );
      
      for (let i = startIndex + 1; i < endIndex; i++) {
        const point = points[i];
        
        // Calculate perpendicular distance from point to line
        let distance;
        
        if (lineLength < 0.00001) {
          // Line is very short, use distance to start point
          distance = Math.sqrt(
            Math.pow(point.x - startPoint.x, 2) +
            Math.pow(point.y - startPoint.y, 2)
          );
        } else {
          const u = ((point.x - startPoint.x) * (endPoint.x - startPoint.x) +
                     (point.y - startPoint.y) * (endPoint.y - startPoint.y)) /
                    (lineLength * lineLength);
                    
          // Point projection on the line
          const projectionX = startPoint.x + u * (endPoint.x - startPoint.x);
          const projectionY = startPoint.y + u * (endPoint.y - startPoint.y);
          
          // Calculate distance from point to its projection
          distance = Math.sqrt(
            Math.pow(point.x - projectionX, 2) +
            Math.pow(point.y - projectionY, 2)
          );
        }
        
        if (distance > maxDistance) {
          maxDistance = distance;
          maxIndex = i;
        }
      }
      
      // If the furthest point is further than our tolerance,
      // recursively simplify both parts of the curve
      if (maxDistance > tolerance) {
        douglasPeucker(startIndex, maxIndex);
        result.push(points[maxIndex]);
        douglasPeucker(maxIndex, endIndex);
      }
    };
    
    // Apply the algorithm
    douglasPeucker(0, points.length - 1);
    
    // Add the last point
    result.push(points[points.length - 1]);
    
    // Sort points in original order
    result.sort((a, b) => {
      const indexA = points.findIndex(p => p === a);
      const indexB = points.findIndex(p => p === b);
      return indexA - indexB;
    });
    
    return result;
  }

  /**
   * Generate points for a path
   * @param {Object} path - Path object with type and geometry
   * @param {Object} svgInput - Original SVG input
   * @returns {Array} Array of points
   */
  _generatePathPoints(path, svgInput) {
    // Default viewBox if not provided
    const viewBox = svgInput.viewBox || { minX: 0, minY: 0, width: 100, height: 100 };
    
    // For standard SVG path
    if (path.type === 'path' && path.d) {
      return this._processPathData(path.d, viewBox);
    }
    
    // For rectangle (already converted to path, but may have special handling)
    if (path.type === 'rect' && path.d) {
      return this._processPathData(path.d, viewBox);
    }
    
    // For circle (generate a circle path with appropriate resolution)
    if (path.type === 'circle' && path.cx !== undefined && path.cy !== undefined && path.r !== undefined) {
      const { cx, cy, r } = path;
      if (typeof cx !== 'number' || typeof cy !== 'number' || typeof r !== 'number') {
        console.error('Invalid circle parameters:', { cx, cy, r });
        return [];
      }
      
      if (r <= 0) {
        console.warn('Circle radius must be positive');
        return [];
      }
      
      const points = [];
      
      // Create a full circle with appropriate number of points
      const resolution = this.config.toolpath?.resolution || 72;
      const angleStep = (2 * Math.PI) / resolution;
      
      // Generate points around the circle - start at angle 0 and go all the way around
      for (let i = 0; i <= resolution; i++) {
        const angle = i * angleStep;
        points.push({
          x: Number((cx + r * Math.cos(angle)).toFixed(6)),
          y: Number((cy + r * Math.sin(angle)).toFixed(6))
        });
      }
      
      // Apply viewBox transformation
      return points.map(point => ({
        x: point.x - viewBox.minX,
        y: point.y - viewBox.minY
      }));
    }
    
    // For line
    if (path.type === 'line' && path.d) {
      // For line elements, just process the path data
      return this._processPathData(path.d, viewBox);
    }
    
    // For ellipse
    if (path.type === 'ellipse' && path.cx !== undefined && path.cy !== undefined && 
        path.rx !== undefined && path.ry !== undefined) {
      const { cx, cy, rx, ry } = path;
      if (typeof cx !== 'number' || typeof cy !== 'number' || 
          typeof rx !== 'number' || typeof ry !== 'number') {
        console.error('Invalid ellipse parameters:', { cx, cy, rx, ry });
        return [];
      }
      
      if (rx <= 0 || ry <= 0) {
        console.warn('Ellipse radii must be positive');
        return [];
      }
      
      const points = [];
      
      // Create a full ellipse with appropriate number of points
      const resolution = this.config.toolpath?.resolution || 72;
      const angleStep = (2 * Math.PI) / resolution;
      
      // First point on ellipse - start at 0 degrees
      const firstPoint = {
        x: Number((cx + rx).toFixed(6)),
        y: Number(cy.toFixed(6))
      };
      points.push(firstPoint);
      
      // Generate points around the ellipse
      for (let i = 1; i < resolution; i++) {
        const angle = i * angleStep;
        points.push({
          x: Number((cx + rx * Math.cos(angle)).toFixed(6)),
          y: Number((cy + ry * Math.sin(angle)).toFixed(6))
        });
      }
      
      // Close the ellipse by returning to first point exactly
      points.push({
        x: firstPoint.x,
        y: firstPoint.y
      });
      
      // Apply viewBox transformation
      return points.map(point => ({
        x: point.x - viewBox.minX,
        y: point.y - viewBox.minY
      }));
    }
    
    // Default: return empty array
    return [];
  }

  /**
   * Process SVG path data into points
   * @param {string} pathData - SVG path data
   * @param {Object} viewBox - SVG viewBox
   * @returns {Array} Array of {x, y} points
   */
  _processPathData(pathData, viewBox) {
    if (!pathData) return [];
    
    // Clean up the path data by removing excess whitespace and normalizing spacing
    const cleanedPathData = pathData.replace(/\s+/g, ' ').trim();
    
    // For simple rectangle paths like "M10,10 L90,10 L90,90 L10,90 Z"
    if (cleanedPathData.startsWith('M') && (cleanedPathData.includes('L') || cleanedPathData.includes('l')) && !cleanedPathData.includes('C') && !cleanedPathData.includes('c') && !cleanedPathData.includes('A') && !cleanedPathData.includes('a')) {
      const points = [];
      const segments = cleanedPathData.split(/[MLZ ]/);
      
      for (const segment of segments) {
        if (segment.trim() === '' || segment.trim() === ',') continue;
        
        const [x, y] = segment.split(',').map(Number);
        if (!isNaN(x) && !isNaN(y)) {
          points.push({ x, y });
        }
      }
      
      // Add closing point if needed
      if (points.length > 0 && (cleanedPathData.includes('Z') || cleanedPathData.includes('z'))) {
        points.push({ x: points[0].x, y: points[0].y });
      }
      
      // Only apply the viewBox offset transformation without scaling
      return points.map(point => ({
        x: point.x - viewBox.minX,
        y: point.y - viewBox.minY
      }));
    }
    
    // Special case for circles defined with arc commands
    // Detect circle path: M cx-r,cy A r,r 0 1 1 cx+r,cy A r,r 0 1 1 cx-r,cy Z
    const circlePattern = /M\s*([0-9.-]+),\s*([0-9.-]+)\s*A\s*([0-9.-]+),\s*([0-9.-]+)\s+0\s+1\s+1\s+([0-9.-]+),\s*([0-9.-]+)\s*A\s*([0-9.-]+),\s*([0-9.-]+)\s+0\s+1\s+1\s+([0-9.-]+),\s*([0-9.-]+)\s*Z/i;
    const circleMatch = cleanedPathData.match(circlePattern);
    
    if (circleMatch) {
      // Extract circle parameters from the path
      const startX = parseFloat(circleMatch[1]);
      const cy = parseFloat(circleMatch[2]);
      const r1 = parseFloat(circleMatch[3]);
      // Further validation to ensure it's a proper circle
      const endX = parseFloat(circleMatch[5]);
      
      if (Math.abs(endX - (startX + 2 * r1)) < 0.001) {
        // This is definitely a circle, generate points directly
        const cx = startX + r1;
        const r = r1;
        
        console.log(`Detected circle from arc path: cx=${cx}, cy=${cy}, r=${r}`);
        
        // Generate points around the circle
        const resolution = this.config.toolpath?.resolution || 72;
        const points = [];
        
        for (let i = 0; i <= resolution; i++) {
          const angle = (i / resolution) * Math.PI * 2;
          points.push({
            x: Number((cx + r * Math.cos(angle)).toFixed(6)),
            y: Number((cy + r * Math.sin(angle)).toFixed(6))
          });
        }
        
        // Apply viewBox offset
        return points.map(point => ({
          x: point.x - viewBox.minX,
          y: point.y - viewBox.minY
        }));
      }
    }
    
    // Log if we've detected arc commands
    if (cleanedPathData.includes('A') || cleanedPathData.includes('a')) {
      console.log("Path has arc commands: " + cleanedPathData);
    }
    
    // Try to handle more general path data using svgpath library
    try {
      // First make path absolute
      const absolutePath = svgpath(cleanedPathData)
        .abs()
        .toString();
      
      console.log("Absolute path:", absolutePath);
      
      // Then extract points
      const points = [];
      const pathSegments = absolutePath.match(/[MLCAQTZ][^MLCAQTZ]*/gi) || [];
      
      let x = 0;
      let y = 0;
      let firstX = 0;
      let firstY = 0;
      
      for (const segment of pathSegments) {
        const command = segment.charAt(0).toUpperCase();
        const params = segment.substring(1).trim().split(/[\s,]+/).map(parseFloat);
        
        switch (command) {
          case 'M': // Move to
            if (params.length >= 2) {
              x = params[0];
              y = params[1];
              firstX = x;
              firstY = y;
              points.push({ x, y });
            }
            break;
            
          case 'L': // Line to
            if (params.length >= 2) {
              x = params[0];
              y = params[1];
              points.push({ x, y });
            }
            break;
            
          case 'C': // Cubic bezier
            if (params.length >= 6) {
              const x1 = params[0];
              const y1 = params[1];
              const x2 = params[2];
              const y2 = params[3];
              const endX = params[4];
              const endY = params[5];
              
              const curve = new BezierJS.Bezier(x, y, x1, y1, x2, y2, endX, endY);
              const resolution = this.config.toolpath?.resolution || 20;
              const curvePoints = curve.getLUT(resolution);
              
              // Skip the first point to avoid duplication
              for (let i = 1; i < curvePoints.length; i++) {
                points.push({ x: curvePoints[i].x, y: curvePoints[i].y });
              }
              
              x = endX;
              y = endY;
            }
            break;
            
          case 'A': // Arc
            if (params.length >= 7) {
              const rx = params[0];
              const ry = params[1];
              const xAxisRotation = params[2];
              const largeArcFlag = params[3];
              const sweepFlag = params[4];
              const endX = params[5];
              const endY = params[6];
              
              console.log(`Processing arc: A ${rx} ${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`);
              
              // Convert SVG arc to points
              const arcPoints = this._arcToPoints(
                x, y,
                rx, ry,
                xAxisRotation,
                largeArcFlag,
                sweepFlag,
                endX, endY
              );
              
              // Add the generated points
              arcPoints.forEach(point => {
                points.push(point);
              });
              
              // Update current position
              x = endX;
              y = endY;
            } else {
              console.warn("Invalid arc command parameters:", params);
            }
            break;
            
          case 'Z': // Close path
            if (points.length > 0) {
              const lastPoint = points[points.length - 1];
              if (Math.abs(lastPoint.x - firstX) > 0.001 || 
                  Math.abs(lastPoint.y - firstY) > 0.001) {
                points.push({ x: firstX, y: firstY });
              }
            }
            break;
        }
      }
      
      // Apply viewBox offset
      return points.map(point => ({
        x: point.x - viewBox.minX,
        y: point.y - viewBox.minY
      }));
    } catch (error) {
      console.error('Error processing path data:', error);
      return [];
    }
  }

  /**
   * Convert SVG arc command to a series of points
   * @param {number} startX - Start X coordinate
   * @param {number} startY - Start Y coordinate
   * @param {number} rx - X radius
   * @param {number} ry - Y radius
   * @param {number} xAxisRotation - X axis rotation in degrees
   * @param {number} largeArcFlag - Large arc flag (0 or 1)
   * @param {number} sweepFlag - Sweep flag (0 or 1)
   * @param {number} endX - End X coordinate
   * @param {number} endY - End Y coordinate
   * @returns {Array} Array of points
   */
  _arcToPoints(startX, startY, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, endX, endY) {
    console.log(`Arc params: ${startX},${startY} ${rx},${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${endX},${endY}`);
    
    // Convert parameters to numbers to ensure proper calculations
    startX = Number(startX);
    startY = Number(startY);
    rx = Math.abs(Number(rx)); // Radius must be positive
    ry = Math.abs(Number(ry));
    xAxisRotation = Number(xAxisRotation);
    largeArcFlag = Number(largeArcFlag);
    sweepFlag = Number(sweepFlag);
    endX = Number(endX);
    endY = Number(endY);
    
    // If the arc is actually a straight line or radii are too small, return a line
    if (rx < 0.001 || ry < 0.001) {
      console.log('Arc has zero radius, returning line');
      return [{ x: endX, y: endY }];
    }
    
    // Convert angle from degrees to radians
    const angleRad = (xAxisRotation % 360) * Math.PI / 180;
    
    // The number of points to generate for the arc
    const resolution = this.config.toolpath?.resolution || 72;
    
    // For a full circle or very close to it, handle specially
    const isFullCircle = largeArcFlag === 1 && 
                        Math.abs(startX - endX) < 0.001 && 
                        Math.abs(startY - endY) < 0.001;
    
    // Another case: an arc that covers a complete circle when combined with another arc
    // This is often how SVG represents circles: two 180-degree arcs
    const isHalfCircle = largeArcFlag === 1 && 
                         Math.abs(Math.abs(startX - endX) - 2 * rx) < 0.001 && 
                         Math.abs(startY - endY) < 0.001;
    
    console.log(`Arc analysis: isFullCircle=${isFullCircle}, isHalfCircle=${isHalfCircle}`);
    
    if (isFullCircle) {
      // For a full circle (same start and end point with large arc flag)
      console.log("Processing full circle");
      
      // Calculate circle center (for a full circle, the center is rx away from start point)
      const cx = startX;
      const cy = startY;
      
      const points = [];
      for (let i = 0; i <= resolution; i++) {
        const angle = (i / resolution) * 2 * Math.PI;
        const x = cx + rx * Math.cos(angle);
        const y = cy + ry * Math.sin(angle);
        points.push({ 
          x: Number(x.toFixed(6)), 
          y: Number(y.toFixed(6)) 
        });
      }
      
      return points;
    }
    
    // For half circles (often used in SVG to represent a full circle)
    if (isHalfCircle) {
      console.log("Processing half circle");
      
      // Calculate circle center
      const cx = (startX + endX) / 2;
      const cy = startY; // For horizontal half-circle
      
      // Generate points for half circle based on sweep direction
      const points = [];
      const startAngle = sweepFlag === 1 ? 0 : Math.PI;
      const endAngle = sweepFlag === 1 ? Math.PI : 2 * Math.PI;
      
      for (let i = 0; i <= resolution/2; i++) {
        const t = i / (resolution/2);
        const angle = startAngle + t * (endAngle - startAngle);
        const x = cx + rx * Math.cos(angle);
        const y = cy + ry * Math.sin(angle);
        points.push({ 
          x: Number(x.toFixed(6)), 
          y: Number(y.toFixed(6)) 
        });
      }
      
      return points;
    }
    
    // For normal arcs, continue with standard arc calculation
    // Step 1: Transform to origin
    const dx = (startX - endX) / 2;
    const dy = (startY - endY) / 2;
    
    // Rotate to align with coordinate axes
    const x1Prime = Math.cos(angleRad) * dx + Math.sin(angleRad) * dy;
    const y1Prime = -Math.sin(angleRad) * dx + Math.cos(angleRad) * dy;
    
    // Step 2: Ensure radii are large enough (SVG spec F.6.6)
    let rxSq = rx * rx;
    let rySq = ry * ry;
    const x1PrimeSq = x1Prime * x1Prime;
    const y1PrimeSq = y1Prime * y1Prime;
    
    // Check if radii are too small and adjust if necessary (SVG spec F.6.6)
    const radiiCheck = x1PrimeSq / rxSq + y1PrimeSq / rySq;
    if (radiiCheck > 1) {
      // Scale up the radii to satisfy the equation
      const radiiScale = Math.sqrt(radiiCheck);
      rx *= radiiScale;
      ry *= radiiScale;
      rxSq = rx * rx;
      rySq = ry * ry;
    }
    
    // Step 3: Compute the center (SVG spec F.6.5)
    let sign = (largeArcFlag !== sweepFlag) ? 1 : -1;
    
    const term = rxSq * y1PrimeSq + rySq * x1PrimeSq;
    const sq = (rxSq * rySq - term) / term;
    // Avoid negative sqrt that would result in NaN
    const coef = sign * Math.sqrt(Math.max(0, sq));
    
    const cxPrime = coef * ((rx * y1Prime) / ry);
    const cyPrime = coef * (-(ry * x1Prime) / rx);
    
    // Step 4: Compute actual center (SVG spec F.6.5)
    const cx = Math.cos(angleRad) * cxPrime - Math.sin(angleRad) * cyPrime + (startX + endX) / 2;
    const cy = Math.sin(angleRad) * cxPrime + Math.cos(angleRad) * cyPrime + (startY + endY) / 2;
    
    // Step 5: Compute start and end angles
    const ux = (x1Prime - cxPrime) / rx;
    const uy = (y1Prime - cyPrime) / ry;
    const vx = (-x1Prime - cxPrime) / rx;
    const vy = (-y1Prime - cyPrime) / ry;
    
    // Start angle
    let startAngle = this._angleBetween(1, 0, ux, uy);
    
    // Angular extent
    let deltaAngle = this._angleBetween(ux, uy, vx, vy);
    
    // Ensure positive delta for sweep flag 1, negative for sweep flag 0
    if (sweepFlag === 0 && deltaAngle > 0) {
      deltaAngle -= 2 * Math.PI;
    } else if (sweepFlag === 1 && deltaAngle < 0) {
      deltaAngle += 2 * Math.PI;
    }
    
    // Step 6: Generate the points along the arc
    const points = [];
    const numSegments = resolution; // Number of line segments to approximate the arc
    
    for (let i = 0; i <= numSegments; i++) {
      const angle = startAngle + deltaAngle * (i / numSegments);
      
      // Calculate point on the ellipse
      const x = cx + rx * Math.cos(angle) * Math.cos(angleRad) - ry * Math.sin(angle) * Math.sin(angleRad);
      const y = cy + rx * Math.cos(angle) * Math.sin(angleRad) + ry * Math.sin(angle) * Math.cos(angleRad);
      
      points.push({ x: Number(x.toFixed(6)), y: Number(y.toFixed(6)) });
    }
    
    return points;
  }
  
  /**
   * Calculate angle between two vectors
   * @param {number} ux - First vector x component
   * @param {number} uy - First vector y component
   * @param {number} vx - Second vector x component
   * @param {number} vy - Second vector y component
   * @returns {number} Angle in radians
   */
  _angleBetween(ux, uy, vx, vy) {
    // Dot product
    const dot = ux * vx + uy * vy;
    // Magnitudes
    const magU = Math.sqrt(ux * ux + uy * uy);
    const magV = Math.sqrt(vx * vx + vy * vy);
    
    // Avoid division by zero
    if (magU < 0.000001 || magV < 0.000001) return 0;
    
    // Compute angle using acos, clamping dot product to [-1, 1]
    const cosAngle = Math.max(-1, Math.min(1, dot / (magU * magV)));
    let angle = Math.acos(cosAngle);
    
    // Determine correct quadrant (cross product for sign)
    const cross = ux * vy - uy * vx;
    if (cross < 0) {
      angle = -angle;
    }
    
    return angle;
  }

  /**
   * Generate points for a circle element
   * @param {Object} circle - Circle data
   * @param {Object} viewBox - SVG viewBox
   * @returns {Array} Array of points
   */
  _generateCirclePoints(circle, viewBox) {
    const { cx, cy, r } = circle;
    const points = [];
    
    // Number of segments - higher for smoother circles
    const segments = this.config.toolpath?.circleSegments || 36;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      
      points.push({ x, y });
    }
    
    // Apply viewBox offset
    return this._scalePoints(points, viewBox);
  }
  
  /**
   * Generate points for an ellipse element
   * @param {Object} ellipse - Ellipse data
   * @param {Object} viewBox - SVG viewBox
   * @returns {Array} Array of points
   */
  _generateEllipsePoints(ellipse, viewBox) {
    const { cx, cy, rx, ry } = ellipse;
    const points = [];
    
    // Number of segments - higher for smoother ellipses
    const segments = this.config.toolpath?.circleSegments || 36;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      
      points.push({ x, y });
    }
    
    // Apply viewBox offset
    return this._scalePoints(points, viewBox);
  }
  
  /**
   * Scale points according to viewBox
   * @param {Array} points - Array of points
   * @param {Object} viewBox - SVG viewBox
   * @returns {Array} Scaled points
   */
  _scalePoints(points, viewBox) {
    return points.map(point => ({
      x: point.x - viewBox.minX,
      y: point.y - viewBox.minY
    }));
  }
}

module.exports = PathGenerator; 