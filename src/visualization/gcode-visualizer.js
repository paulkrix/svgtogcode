/**
 * GCode Visualizer Module
 * 
 * Provides 3D visualization of GCode toolpaths
 */

/**
 * Visualizes GCode data with 3D representation
 */
class GCodeVisualizer {
  /**
   * Create a new visualizer with configuration
   * @param {Object} config - Configuration for visualization
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Generate a 3D visualization of GCode toolpaths
   * @param {Object} gcodeData - Processed GCode data
   * @param {Object} toolpathData - Toolpath data for reference
   * @returns {string} HTML for visualization
   */
  generateGCodePreview(gcodeData, toolpathData) {
    // Extract data
    const { commands, metadata } = gcodeData;
    const { minDepth, maxDepth } = this.config.grayscaleMapping;
    
    // Parse GCode to get coordinates
    const toolpaths = this._parseGCodePaths(commands);
    
    // Calculate visualization bounds
    const bounds = this._calculateBounds(toolpaths);
    
    // Generate SVG for the visualization
    const svg = this._generateSVG(toolpaths, bounds, minDepth, maxDepth);
    
    return `
      <div class="gcode-visualization">
        <div class="visualization-controls">
          <button id="viewTop" class="view-btn active">Top</button>
          <button id="viewFront" class="view-btn">Front</button>
          <button id="viewSide" class="view-btn">Side</button>
          <button id="viewIso" class="view-btn">Isometric</button>
        </div>
        <div class="visualization-container">
          ${svg}
        </div>
        <div class="visualization-info">
          <div class="info-item">
            <span class="info-label">Cutting distance:</span>
            <span class="info-value">${this._formatDistance(this._calculateTotalDistance(toolpaths))}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Est. time:</span>
            <span class="info-value">${this._formatTime(gcodeData.estimatedTime)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Commands:</span>
            <span class="info-value">${commands.length}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Depth range:</span>
            <span class="info-value">${minDepth}mm - ${maxDepth}mm</span>
          </div>
        </div>
      </div>
      <script>
        // Add view controls functionality
        document.querySelectorAll('.view-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Get the visualization container
            const container = document.querySelector('.visualization-container svg');
            
            // Set the appropriate transform based on view
            if (btn.id === 'viewTop') {
              container.style.transform = 'rotateX(0deg) rotateY(0deg)';
            } else if (btn.id === 'viewFront') {
              container.style.transform = 'rotateX(90deg) rotateY(0deg)';
            } else if (btn.id === 'viewSide') {
              container.style.transform = 'rotateX(0deg) rotateY(90deg)';
            } else if (btn.id === 'viewIso') {
              container.style.transform = 'rotateX(45deg) rotateY(45deg)';
            }
          });
        });
      </script>
    `;
  }

  /**
   * Parse GCode commands to extract toolpaths
   * @param {Array} commands - GCode commands
   * @returns {Array} Toolpaths with coordinates
   */
  _parseGCodePaths(commands) {
    const toolpaths = [];
    let currentPath = null;
    
    // Current position
    let currentX = 0;
    let currentY = 0;
    let currentZ = 0;
    
    // Parse each command
    commands.forEach(cmd => {
      // Skip comments and empty lines
      if (cmd.startsWith('(') || cmd.trim() === '') {
        return;
      }
      
      // New path start with G0 Z movement to safe height
      if (cmd.startsWith('G0 Z')) {
        if (currentPath && currentPath.points.length > 0) {
          toolpaths.push(currentPath);
        }
        currentPath = { points: [], rapid: true };
        currentZ = parseFloat(cmd.match(/Z([-\d.]+)/)[1]);
      }
      // Rapid move to starting position
      else if (cmd.startsWith('G0 X') || cmd.startsWith('G0 Y')) {
        if (!currentPath) {
          currentPath = { points: [], rapid: true };
        }
        
        // Extract coordinates
        const xMatch = cmd.match(/X([-\d.]+)/);
        const yMatch = cmd.match(/Y([-\d.]+)/);
        
        if (xMatch) currentX = parseFloat(xMatch[1]);
        if (yMatch) currentY = parseFloat(yMatch[1]);
        
        currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
      }
      // Plunge movement
      else if (cmd.startsWith('G1 Z')) {
        if (!currentPath) {
          currentPath = { points: [], rapid: false };
        }
        currentPath.rapid = false;
        
        currentZ = parseFloat(cmd.match(/Z([-\d.]+)/)[1]);
        currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
      }
      // Linear cutting movement
      else if (cmd.startsWith('G1 X') || cmd.startsWith('G1 Y')) {
        if (!currentPath) {
          currentPath = { points: [], rapid: false };
        }
        currentPath.rapid = false;
        
        // Extract coordinates
        const xMatch = cmd.match(/X([-\d.]+)/);
        const yMatch = cmd.match(/Y([-\d.]+)/);
        const zMatch = cmd.match(/Z([-\d.]+)/);
        
        if (xMatch) currentX = parseFloat(xMatch[1]);
        if (yMatch) currentY = parseFloat(yMatch[1]);
        if (zMatch) currentZ = parseFloat(zMatch[1]);
        
        currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
      }
    });
    
    // Add the last path if it exists
    if (currentPath && currentPath.points.length > 0) {
      toolpaths.push(currentPath);
    }
    
    return toolpaths;
  }

  /**
   * Calculate bounds of all toolpaths
   * @param {Array} toolpaths - Toolpaths with coordinates
   * @returns {Object} Bounds with min/max values
   */
  _calculateBounds(toolpaths) {
    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;
    
    toolpaths.forEach(path => {
      path.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        minZ = Math.min(minZ, point.z);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
        maxZ = Math.max(maxZ, point.z);
      });
    });
    
    // Add some padding
    const padding = 10;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    return { minX, minY, minZ, maxX, maxY, maxZ, width: maxX - minX, height: maxY - minY, depth: maxZ - minZ };
  }

  /**
   * Generate SVG for the visualization
   * @param {Array} toolpaths - Toolpaths with coordinates
   * @param {Object} bounds - Bounds with min/max values
   * @param {number} minDepth - Minimum depth
   * @param {number} maxDepth - Maximum depth
   * @returns {string} SVG for visualization
   */
  _generateSVG(toolpaths, bounds, minDepth, maxDepth) {
    const { minX, minY, minZ, maxX, maxY, maxZ, width, height, depth } = bounds;
    
    // SVG container
    let svg = `<svg 
      width="100%" 
      height="100%" 
      viewBox="${minX} ${minY} ${width} ${height}"
      style="transform: rotateX(45deg) rotateY(45deg); transform-origin: center; transition: transform 0.5s ease;"
      xmlns="http://www.w3.org/2000/svg">
      <style>
        .toolpath-rapid { stroke: #3498db; stroke-width: 1; fill: none; stroke-dasharray: 5,2; }
        .toolpath-cut { stroke: #e74c3c; stroke-width: 1.5; fill: none; }
        .grid-line { stroke: #ecf0f1; stroke-width: 0.5; }
        .axis-x { stroke: #e74c3c; stroke-width: 1; }
        .axis-y { stroke: #2ecc71; stroke-width: 1; }
        .axis-z { stroke: #3498db; stroke-width: 1; }
      </style>`;
    
    // Add background grid
    svg += this._generateGrid(minX, minY, maxX, maxY);
    
    // Add coordinate axes
    svg += this._generateAxes(minX, minY, maxX, maxY);
    
    // Add each toolpath
    toolpaths.forEach(path => {
      if (path.points.length < 2) {
        return;
      }
      
      // Create path string
      let pathData = `M${path.points[0].x},${path.points[0].y}`;
      for (let i = 1; i < path.points.length; i++) {
        pathData += ` L${path.points[i].x},${path.points[i].y}`;
      }
      
      // Add path with appropriate class
      svg += `<path d="${pathData}" class="${path.rapid ? 'toolpath-rapid' : 'toolpath-cut'}" />`;
      
      // Add depth indicators for cutting paths
      if (!path.rapid) {
        path.points.forEach((point, index) => {
          // Add a depth indicator every few points
          if (index % 10 === 0) {
            const depth = Math.abs(point.z);
            if (depth > 0.1) { // Only show significant depths
              // Calculate color based on normalized depth (red for deep, blue for shallow)
              const normalizedDepth = (depth - minDepth) / (maxDepth - minDepth);
              const color = this._getDepthColor(normalizedDepth);
              
              svg += `<circle cx="${point.x}" cy="${point.y}" r="1.5" fill="${color}" />`;
            }
          }
        });
      }
    });
    
    // Add depth legend
    svg += this._generateLegend(minDepth, maxDepth);
    
    // Close SVG
    svg += '</svg>';
    
    return svg;
  }
  
  /**
   * Generate a grid for the background
   * @param {number} minX - Minimum X
   * @param {number} minY - Minimum Y
   * @param {number} maxX - Maximum X
   * @param {number} maxY - Maximum Y
   * @returns {string} SVG for grid
   */
  _generateGrid(minX, minY, maxX, maxY) {
    const gridSize = 10;
    let grid = '<g class="grid">';
    
    // Vertical lines
    for (let x = Math.floor(minX / gridSize) * gridSize; x <= maxX; x += gridSize) {
      grid += `<line class="grid-line" x1="${x}" y1="${minY}" x2="${x}" y2="${maxY}" />`;
    }
    
    // Horizontal lines
    for (let y = Math.floor(minY / gridSize) * gridSize; y <= maxY; y += gridSize) {
      grid += `<line class="grid-line" x1="${minX}" y1="${y}" x2="${maxX}" y2="${y}" />`;
    }
    
    grid += '</g>';
    return grid;
  }
  
  /**
   * Generate coordinate axes
   * @param {number} minX - Minimum X
   * @param {number} minY - Minimum Y
   * @param {number} maxX - Maximum X
   * @param {number} maxY - Maximum Y
   * @returns {string} SVG for axes
   */
  _generateAxes(minX, minY, maxX, maxY) {
    return `
      <g class="axes">
        <line class="axis-x" x1="0" y1="0" x2="${maxX * 0.8}" y2="0" />
        <line class="axis-y" x1="0" y1="0" x2="0" y2="${maxY * 0.8}" />
        <line class="axis-z" x1="0" y1="0" x2="0" y2="0" transform="rotate(-90)" />
        <text x="${maxX * 0.8 + 5}" y="0" fill="#e74c3c" font-size="8">X</text>
        <text x="0" y="${maxY * 0.8 + 10}" fill="#2ecc71" font-size="8">Y</text>
        <text x="0" y="-10" transform="rotate(-90)" fill="#3498db" font-size="8">Z</text>
      </g>
    `;
  }
  
  /**
   * Generate a depth legend
   * @param {number} minDepth - Minimum depth
   * @param {number} maxDepth - Maximum depth
   * @returns {string} SVG for legend
   */
  _generateLegend(minDepth, maxDepth) {
    const legendWidth = 100;
    const legendHeight = 15;
    const legendX = 10;
    const legendY = 10;
    const steps = 5;
    
    let legend = `
      <g transform="translate(${legendX}, ${legendY})">
        <rect x="0" y="0" width="${legendWidth}" height="${legendHeight}" fill="none" stroke="black" stroke-width="1" />
    `;
    
    // Add gradient steps
    for (let i = 0; i < steps; i++) {
      const normalizedDepth = i / (steps - 1);
      const stepWidth = legendWidth / steps;
      const color = this._getDepthColor(normalizedDepth);
      
      legend += `<rect x="${i * stepWidth}" y="0" width="${stepWidth}" height="${legendHeight}" fill="${color}" />`;
    }
    
    // Add text labels
    legend += `
      <text x="0" y="${legendHeight + 10}" font-size="8">${minDepth}mm</text>
      <text x="${legendWidth}" y="${legendHeight + 10}" text-anchor="end" font-size="8">${maxDepth}mm</text>
      <text x="${legendWidth/2}" y="${legendHeight + 10}" text-anchor="middle" font-size="8">Depth</text>
    `;
    
    legend += '</g>';
    
    return legend;
  }
  
  /**
   * Get a color for a depth value
   * @param {number} normalizedDepth - Normalized depth value (0-1)
   * @returns {string} CSS color
   */
  _getDepthColor(normalizedDepth) {
    // Use a color scale - blue to red (shallow to deep)
    const r = Math.round(255 * normalizedDepth);
    const b = Math.round(255 * (1 - normalizedDepth));
    return `rgb(${r}, 50, ${b})`;
  }
  
  /**
   * Calculate total distance of toolpaths
   * @param {Array} toolpaths - Toolpaths with coordinates
   * @returns {number} Total distance in mm
   */
  _calculateTotalDistance(toolpaths) {
    let totalDistance = 0;
    
    toolpaths.forEach(path => {
      const { points } = path;
      
      if (points.length < 2) {
        return;
      }
      
      // Calculate distance between consecutive points
      for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        
        const dx = currentPoint.x - prevPoint.x;
        const dy = currentPoint.y - prevPoint.y;
        const dz = currentPoint.z - prevPoint.z;
        
        totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
    });
    
    return totalDistance;
  }
  
  /**
   * Format a distance in mm
   * @param {number} distance - Distance in mm
   * @returns {string} Formatted distance
   */
  _formatDistance(distance) {
    return `${distance.toFixed(1)}mm`;
  }
  
  /**
   * Format time in seconds to minutes and seconds
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  _formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }
}

module.exports = GCodeVisualizer; 