/**
 * SVG Visualizer Module
 * 
 * Provides visualization of SVG paths with depth information
 */

/**
 * Visualizes SVG data with depth coloring
 */
class SVGVisualizer {
  /**
   * Create a new visualizer with configuration
   * @param {Object} config - Configuration for visualization
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Generate a colorized SVG preview showing depths
   * @param {Object} processedData - Processed SVG data with depths
   * @param {Object} svgInput - Original SVG input for reference
   * @returns {string} HTML for visualization
   */
  generatePreview(processedData, svgInput) {
    const { minDepth, maxDepth } = this.config.grayscaleMapping;
    const depthRange = maxDepth - minDepth;
    
    // Create SVG element
    let svg = `<svg 
      width="100%" 
      height="100%" 
      viewBox="${svgInput.viewBox.minX} ${svgInput.viewBox.minY} ${svgInput.viewBox.width} ${svgInput.viewBox.height}"
      xmlns="http://www.w3.org/2000/svg">
      <style>
        .depth-path { stroke-width: 1; fill-opacity: 0.7; }
        .depth-label { font-size: 8px; fill: black; }
      </style>`;
    
    // Add a legend
    svg += this._generateLegend(minDepth, maxDepth);
    
    // Add each path with color based on depth
    processedData.paths.forEach(path => {
      // Calculate color - use a blue scale from light to dark
      const normalizedDepth = (path.depth - minDepth) / depthRange;
      const color = this._getDepthColor(normalizedDepth);
      
      // Add the path with color
      switch (path.type) {
        case 'path':
        case 'rect':
          svg += `<path d="${path.d}" class="depth-path" fill="${color}" />`;
          break;
          
        case 'circle':
          svg += `<circle cx="${path.cx}" cy="${path.cy}" r="${path.r}" class="depth-path" fill="${color}" />`;
          break;
          
        case 'ellipse':
          svg += `<ellipse cx="${path.cx}" cy="${path.cy}" rx="${path.rx}" ry="${path.ry}" class="depth-path" fill="${color}" />`;
          break;
      }
      
      // Add depth label
      if (path.type === 'path' && path.d) {
        // For paths, try to center the text by finding the "middle" point
        // This is a simple approach that works for some paths
        const match = path.d.match(/M\s*(\d+(?:\.\d+)?)[,\s](\d+(?:\.\d+)?)/);
        if (match) {
          const x = parseFloat(match[1]);
          const y = parseFloat(match[2]);
          svg += `<text x="${x + 5}" y="${y + 5}" class="depth-label">${path.depth}mm</text>`;
        }
      } else if (path.type === 'circle') {
        svg += `<text x="${path.cx}" y="${path.cy}" class="depth-label" text-anchor="middle">${path.depth}mm</text>`;
      } else if (path.type === 'ellipse') {
        svg += `<text x="${path.cx}" y="${path.cy}" class="depth-label" text-anchor="middle">${path.depth}mm</text>`;
      }
    });
    
    // Close SVG
    svg += '</svg>';
    
    return svg;
  }

  /**
   * Generate a color for a depth value
   * @param {number} normalizedDepth - Normalized depth value (0-1)
   * @returns {string} CSS color
   */
  _getDepthColor(normalizedDepth) {
    // Blue scale - light blue for shallow, dark blue for deep
    const blue = Math.round(255 * (1 - normalizedDepth));
    return `rgb(0, ${blue}, 255)`;
  }

  /**
   * Generate a legend showing depth to color mapping
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
   * Generate toolpath visualization
   * @param {Object} toolpathData - Toolpath data
   * @returns {string} HTML for visualization
   */
  generateToolpathPreview(toolpathData) {
    const { toolpaths, metadata } = toolpathData;
    
    // Determine the bounding box of all toolpaths
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    toolpaths.forEach(toolpath => {
      toolpath.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });
    
    // Add some padding
    const padding = 10;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Create SVG element
    let svg = `<svg 
      width="100%" 
      height="100%" 
      viewBox="${minX} ${minY} ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg">
      <style>
        .toolpath { fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .depth-indicator { font-size: 8px; fill: black; }
        .origin { stroke: red; stroke-width: 1; }
      </style>`;
    
    // Add depth legend
    svg += this._generateLegend(metadata.minDepth, metadata.maxDepth);
    
    // Add each toolpath
    toolpaths.forEach(toolpath => {
      const { points, depth } = toolpath;
      
      if (points.length < 2) {
        return;
      }
      
      // Calculate color based on depth
      const normalizedDepth = (depth - metadata.minDepth) / (metadata.maxDepth - metadata.minDepth);
      const color = this._getDepthColor(normalizedDepth);
      const strokeWidth = 1 + normalizedDepth * 2; // Thicker lines for deeper cuts
      
      // Create path from points
      let pathData = `M${points[0].x},${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        pathData += ` L${points[i].x},${points[i].y}`;
      }
      
      svg += `<path d="${pathData}" class="toolpath" stroke="${color}" stroke-width="${strokeWidth}" />`;
      
      // Add depth indicator at the start of the path
      svg += `<text x="${points[0].x + 5}" y="${points[0].y - 5}" class="depth-indicator">${depth}mm</text>`;
    });
    
    // Add origin marker
    svg += `
      <g class="origin">
        <line x1="-10" y1="0" x2="10" y2="0" />
        <line x1="0" y1="-10" x2="0" y2="10" />
        <circle cx="0" cy="0" r="2" fill="red" />
      </g>
    `;
    
    // Close SVG
    svg += '</svg>';
    
    return svg;
  }
}

module.exports = SVGVisualizer; 