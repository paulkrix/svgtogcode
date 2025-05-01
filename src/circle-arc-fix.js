/**
 * Improved circle and arc processing for SVG to GCode conversion
 * Use these functions to replace the existing implementations in path-generator.js
 */

/**
 * Generate improved points for a circle
 * @param {number} cx - Circle center X
 * @param {number} cy - Circle center Y
 * @param {number} r - Circle radius
 * @param {number} segments - Number of segments (resolution)
 * @returns {Array} Array of points representing the circle
 */
function generateCirclePoints(cx, cy, r, segments = 72) {
  // Validate inputs
  if (typeof cx !== 'number' || typeof cy !== 'number' || typeof r !== 'number') {
    console.error('Invalid circle parameters:', { cx, cy, r });
    return [];
  }
  
  if (r <= 0) {
    console.warn('Circle radius must be positive');
    return [];
  }
  
  const points = [];
  
  // Generate points with exact trigonometric values
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    
    points.push({ 
      x: Number(x.toFixed(6)), // Prevent floating point imprecision
      y: Number(y.toFixed(6))
    });
  }
  
  // Ensure the last point exactly matches the first point
  if (points.length > 1) {
    points[points.length - 1] = { ...points[0] };
  }
  
  return points;
}

/**
 * Improved conversion of SVG arc command to a series of points
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
function arcToPoints(startX, startY, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, endX, endY) {
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
  if ((Math.abs(startX - endX) < 0.001 && Math.abs(startY - endY) < 0.001) || rx < 0.001 || ry < 0.001) {
    console.log('Arc is nearly a point or has zero radius, returning line');
    return [{ x: endX, y: endY }];
  }
  
  // Convert angle from degrees to radians
  const angleRad = (xAxisRotation % 360) * Math.PI / 180;
  
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
  
  // Check if the radii are big enough, scale if necessary
  const radiiCheck = x1PrimeSq / rxSq + y1PrimeSq / rySq;
  if (radiiCheck > 1) {
    // Scale up radii
    const radiiScale = Math.sqrt(radiiCheck);
    rx = radiiScale * rx;
    ry = radiiScale * ry;
    rxSq = rx * rx;
    rySq = ry * ry;
  }
  
  // Step 3: Compute center parameters (cx', cy')
  // SVG spec F.6.5
  const sign = (largeArcFlag !== sweepFlag) ? 1 : -1;
  
  // Value under the radical
  let square = (rxSq * rySq - rxSq * y1PrimeSq - rySq * x1PrimeSq) / 
               (rxSq * y1PrimeSq + rySq * x1PrimeSq);
  
  // Prevent square root of negative (can happen due to floating point errors)
  square = Math.max(0, square);
  
  const coef = sign * Math.sqrt(square);
  
  const cxPrime = coef * ((rx * y1Prime) / ry);
  const cyPrime = coef * (-(ry * x1Prime) / rx);
  
  // Step 4: Transform center back to original coordinate system
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  const cx = Math.cos(angleRad) * cxPrime - Math.sin(angleRad) * cyPrime + midX;
  const cy = Math.sin(angleRad) * cxPrime + Math.cos(angleRad) * cyPrime + midY;
  
  // Step 5: Calculate angles
  const translateX1 = (x1Prime - cxPrime) / rx;
  const translateY1 = (y1Prime - cyPrime) / ry;
  const translateX2 = (-x1Prime - cxPrime) / rx;
  const translateY2 = (-y1Prime - cyPrime) / ry;
  
  // Calculate start angle
  let startAngle = angleBetween(1, 0, translateX1, translateY1);
  
  // Calculate angle extent
  let deltaAngle = angleBetween(translateX1, translateY1, translateX2, translateY2);
  
  // Adjust delta angle based on sweep and large arc flags
  if (!sweepFlag && deltaAngle > 0) {
    deltaAngle -= 2 * Math.PI;
  } else if (sweepFlag && deltaAngle < 0) {
    deltaAngle += 2 * Math.PI;
  }
  
  // Ensure we take the correct arc (large or small)
  if (largeArcFlag) {
    if (Math.abs(deltaAngle) < Math.PI) {
      // If large arc flag but small angle, adjust to take the large arc
      if (deltaAngle > 0) {
        deltaAngle = deltaAngle - 2 * Math.PI;
      } else {
        deltaAngle = deltaAngle + 2 * Math.PI;
      }
    }
  } else {
    // If small arc flag, ensure we're taking the small arc
    if (Math.abs(deltaAngle) > Math.PI) {
      if (deltaAngle > 0) {
        deltaAngle = deltaAngle - 2 * Math.PI;
      } else {
        deltaAngle = deltaAngle + 2 * Math.PI;
      }
    }
  }
  
  // Calculate appropriate number of points based on arc size
  // More points for larger arcs
  const arcLength = Math.abs(deltaAngle * Math.min(rx, ry));
  const suggestedPoints = Math.max(Math.ceil(arcLength / 4), 8);
  const numPoints = Math.min(Math.max(suggestedPoints, 12), 100); // Between 12 and 100 points
  
  // Generate points along the arc
  const points = [{x: startX, y: startY}]; // Start with the starting point
  
  for (let i = 1; i <= numPoints; i++) {
    const t = i / numPoints;
    const angle = startAngle + deltaAngle * t;
    
    // First calculate coordinates in the ellipse system
    const ellipseX = rx * Math.cos(angle);
    const ellipseY = ry * Math.sin(angle);
    
    // Then rotate and translate back to original coordinate system
    const x = Math.cos(angleRad) * ellipseX - Math.sin(angleRad) * ellipseY + cx;
    const y = Math.sin(angleRad) * ellipseX + Math.cos(angleRad) * ellipseY + cy;
    
    points.push({ 
      x: Number(x.toFixed(6)), 
      y: Number(y.toFixed(6)) 
    });
  }
  
  // Don't include start point if it matches end point (for closed paths)
  if (points.length > 1 && 
      Math.abs(points[0].x - endX) < 0.001 && 
      Math.abs(points[0].y - endY) < 0.001) {
    points.shift();
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
function angleBetween(ux, uy, vx, vy) {
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

module.exports = {
  generateCirclePoints,
  arcToPoints,
  angleBetween
}; 