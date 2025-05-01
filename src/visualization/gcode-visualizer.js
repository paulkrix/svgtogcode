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
   * @param {Array} toolpaths - Toolpaths to visualize
   * @param {Object} bounds - Bounding box
   * @param {number} minDepth - Minimum depth for color mapping
   * @param {number} maxDepth - Maximum depth for color mapping
   * @returns {string} SVG markup
   */
  _generateSVG(toolpaths, bounds, minDepth, maxDepth) {
    const { minX, minY, minZ, maxX, maxY, maxZ } = bounds;
    
    // Calculate dimensions and add padding
    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const depth = maxZ - minZ;
    
    // Adjust so that the visualization is centered
    const translateX = -(minX + maxX) / 2;
    const translateY = -(minY + maxY) / 2;
    
    // Create SVG with perspective view
    let svg = `
      <svg width="100%" height="100%" viewBox="${-width/2} ${-height/2} ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="transform-origin: center; transform: rotateX(45deg) rotateY(45deg);">
        <style>
          .toolpath { fill: none; stroke-linecap: round; stroke-linejoin: round; }
          .rapid { stroke-dasharray: 2 2; }
          .grid { stroke: #eee; stroke-width: 0.5; }
          .axis { stroke-width: 1; }
          .x-axis { stroke: #f44336; }
          .y-axis { stroke: #4caf50; }
          .z-axis { stroke: #2196f3; }
          .label { font-size: 8px; fill: #666; text-anchor: middle; }
        </style>
        <g transform="translate(${translateX}, ${translateY})">
    `;
    
    // Add grid for reference
    svg += this._generateGrid(minX, minY, maxX, maxY);
    
    // Add coordinate axes
    svg += this._generateAxes(minX, minY, maxX, maxY);
    
    // Draw all toolpaths
    toolpaths.forEach(path => {
      if (path.points.length < 2) return;
      
      // Determine if this is a rapid move or cutting move
      const isRapid = path.rapid;
      
      // Generate color based on depth if cutting, or use gray for rapid
      let color = '#999';
      let strokeWidth = 1;
      
      // For cutting moves, color by depth
      if (!isRapid) {
        // Get the deepest point (most negative Z) of this path
        const deepestZ = Math.min(...path.points.map(p => p.z));
        
        // Normalize depth for coloring
        const normalizedDepth = Math.min(1, Math.max(0, (deepestZ - minDepth) / (maxDepth - minDepth)));
        color = this._getDepthColor(normalizedDepth);
        strokeWidth = 1.5;
      }
      
      // Create path data
      let pathData = `M${path.points[0].x},${path.points[0].y}`;
      
      for (let i = 1; i < path.points.length; i++) {
        pathData += ` L${path.points[i].x},${path.points[i].y}`;
      }
      
      // Add the path to SVG
      svg += `<path d="${pathData}" class="toolpath${isRapid ? ' rapid' : ''}" stroke="${color}" stroke-width="${strokeWidth}" />`;
    });
    
    // Add depth legend
    svg += this._generateLegend(minDepth, maxDepth);
    
    // Close SVG groups and element
    svg += `
        </g>
      </svg>
    `;
    
    return svg;
  }
  
  /**
   * Generate grid lines for reference
   * @param {number} minX - Left bound
   * @param {number} minY - Top bound
   * @param {number} maxX - Right bound
   * @param {number} maxY - Bottom bound
   * @returns {string} SVG markup for grid
   */
  _generateGrid(minX, minY, maxX, maxY) {
    // Create grid with 10mm spacing
    const spacing = 10;
    let grid = `<g class="grid">`;
    
    // Vertical lines
    for (let x = Math.floor(minX / spacing) * spacing; x <= Math.ceil(maxX / spacing) * spacing; x += spacing) {
      grid += `<line x1="${x}" y1="${minY}" x2="${x}" y2="${maxY}" />`;
    }
    
    // Horizontal lines
    for (let y = Math.floor(minY / spacing) * spacing; y <= Math.ceil(maxY / spacing) * spacing; y += spacing) {
      grid += `<line x1="${minX}" y1="${y}" x2="${maxX}" y2="${y}" />`;
    }
    
    grid += `</g>`;
    return grid;
  }
  
  /**
   * Generate coordinate axes
   * @param {number} minX - Left bound
   * @param {number} minY - Top bound
   * @param {number} maxX - Right bound
   * @param {number} maxY - Bottom bound
   * @returns {string} SVG markup for axes
   */
  _generateAxes(minX, minY, maxX, maxY) {
    // Calculate the axes length
    const size = Math.max(maxX - minX, maxY - minY) * 0.1;
    
    return `
      <g class="axes">
        <line x1="0" y1="0" x2="${size}" y2="0" class="x-axis axis" />
        <line x1="0" y1="0" x2="0" y2="${size}" class="y-axis axis" />
        <line x1="0" y1="0" x2="0" y2="-${size/2}" class="z-axis axis" />
        <text x="${size + 5}" y="0" class="label">X</text>
        <text x="0" y="${size + 10}" class="label">Y</text>
        <text x="0" y="-${size/2 + 10}" class="label">Z</text>
      </g>
    `;
  }
  
  /**
   * Generate a legend showing depth to color mapping
   * @param {number} minDepth - Minimum depth
   * @param {number} maxDepth - Maximum depth
   * @returns {string} SVG markup for legend
   */
  _generateLegend(minDepth, maxDepth) {
    const legendWidth = 100;
    const legendHeight = 15;
    const legendX = -50;  // Center the legend
    const legendY = -80;  // Position at the top
    const steps = 5;
    
    let legend = `
      <g transform="translate(${legendX}, ${legendY})">
        <rect x="0" y="0" width="${legendWidth}" height="${legendHeight}" fill="none" stroke="black" stroke-width="0.5" />
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
      <text x="0" y="${legendHeight + 10}" font-size="10">${minDepth}mm</text>
      <text x="${legendWidth}" y="${legendHeight + 10}" text-anchor="end" font-size="10">${maxDepth}mm</text>
      <text x="${legendWidth/2}" y="${legendHeight + 10}" text-anchor="middle" font-size="10">Depth</text>
    `;
    
    legend += '</g>';
    
    return legend;
  }
  
  /**
   * Get a color for a depth value
   * @param {number} normalizedDepth - Normalized depth (0-1)
   * @returns {string} CSS color string
   */
  _getDepthColor(normalizedDepth) {
    // Use a blue color scale, darker for deeper cuts
    const blue = Math.max(0, Math.min(255, Math.round(255 * (1 - normalizedDepth))));
    return `rgb(0, ${blue}, 255)`;
  }
  
  /**
   * Calculate total distance for all cutting moves
   * @param {Array} toolpaths - Toolpaths to measure
   * @returns {number} Total distance in mm
   */
  _calculateTotalDistance(toolpaths) {
    let totalDistance = 0;
    
    toolpaths.forEach(path => {
      // Skip rapid moves
      if (path.rapid) return;
      
      for (let i = 1; i < path.points.length; i++) {
        const p1 = path.points[i - 1];
        const p2 = path.points[i];
        
        // Calculate Euclidean distance
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;
        
        totalDistance += Math.sqrt(dx*dx + dy*dy + dz*dz);
      }
    });
    
    return totalDistance;
  }
  
  /**
   * Format distance as a readable string
   * @param {number} distance - Distance in mm
   * @returns {string} Formatted distance
   */
  _formatDistance(distance) {
    if (distance < 1000) {
      return `${distance.toFixed(1)}mm`;
    } else {
      return `${(distance / 1000).toFixed(2)}m`;
    }
  }
  
  /**
   * Format time in seconds as a readable string
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