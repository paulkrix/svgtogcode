/**
 * SVG Parser Module
 * 
 * Parses SVG files to extract paths and metadata for processing
 */

const { JSDOM } = require('jsdom');
const svgParser = require('svg-parser');

/**
 * Parses SVG content and extracts necessary information
 */
class SVGParser {
  /**
   * Parse SVG string to extract metadata and paths
   * @param {string} svgString - Raw SVG content
   * @returns {Object} Parsed SVG data
   */
  static parse(svgString) {
    // Create a DOM to parse the SVG
    const dom = new JSDOM(svgString, { contentType: 'image/svg+xml' });
    const svgElement = dom.window.document.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('Invalid SVG: No SVG element found');
    }

    // Extract metadata
    const width = this._parseLength(svgElement.getAttribute('width') || '100');
    const height = this._parseLength(svgElement.getAttribute('height') || '100');
    
    // Parse viewBox
    const viewBox = this._parseViewBox(svgElement.getAttribute('viewBox'));
    
    // Parse paths and shapes
    const paths = this._parsePaths(svgElement);
    
    // Parse color information
    const colorData = this._parseColorData(svgElement);
    
    return {
      width,
      height,
      viewBox,
      paths,
      colorData
    };
  }

  /**
   * Parse SVG viewBox attribute
   * @param {string} viewBoxStr - ViewBox attribute value
   * @returns {Object} Parsed viewBox
   */
  static _parseViewBox(viewBoxStr) {
    if (!viewBoxStr) {
      return { minX: 0, minY: 0, width: 100, height: 100 };
    }
    
    const [minX, minY, width, height] = viewBoxStr.split(/\s+/).map(parseFloat);
    
    return {
      minX: minX || 0,
      minY: minY || 0,
      width: width || 100,
      height: height || 100
    };
  }

  /**
   * Parse SVG length values
   * @param {string} lengthStr - Length attribute value
   * @returns {number} Parsed length in pixels/units
   */
  static _parseLength(lengthStr) {
    if (!lengthStr) return 0;
    
    // Remove any unit suffix and parse as float
    return parseFloat(lengthStr.replace(/[^0-9.-]/g, ''));
  }

  /**
   * Parse path elements from SVG
   * @param {Element} svgElement - SVG DOM element
   * @returns {Array} Array of path objects
   */
  static _parsePaths(svgElement) {
    const paths = [];
    
    // Get all path elements
    const pathElements = svgElement.querySelectorAll('path');
    pathElements.forEach(path => {
      const d = path.getAttribute('d');
      if (d) {
        paths.push({
          type: 'path',
          d,
          fill: this._parseColor(path.getAttribute('fill')),
          stroke: this._parseColor(path.getAttribute('stroke')),
          id: path.getAttribute('id') || `path_${paths.length}`
        });
      }
    });
    
    // Get all rect elements
    const rectElements = svgElement.querySelectorAll('rect');
    rectElements.forEach(rect => {
      const x = parseFloat(rect.getAttribute('x') || 0);
      const y = parseFloat(rect.getAttribute('y') || 0);
      const width = parseFloat(rect.getAttribute('width') || 0);
      const height = parseFloat(rect.getAttribute('height') || 0);
      
      if (width > 0 && height > 0) {
        // Convert rect to path
        const d = `M${x},${y} h${width} v${height} h${-width} Z`;
        paths.push({
          type: 'rect',
          d,
          fill: this._parseColor(rect.getAttribute('fill')),
          stroke: this._parseColor(rect.getAttribute('stroke')),
          id: rect.getAttribute('id') || `rect_${paths.length}`
        });
      }
    });
    
    // Get all circle elements
    const circleElements = svgElement.querySelectorAll('circle');
    circleElements.forEach(circle => {
      const cx = parseFloat(circle.getAttribute('cx') || 0);
      const cy = parseFloat(circle.getAttribute('cy') || 0);
      const r = parseFloat(circle.getAttribute('r') || 0);
      
      if (r > 0) {
        paths.push({
          type: 'circle',
          cx, cy, r,
          fill: this._parseColor(circle.getAttribute('fill')),
          stroke: this._parseColor(circle.getAttribute('stroke')),
          id: circle.getAttribute('id') || `circle_${paths.length}`
        });
      }
    });
    
    // Get all ellipse elements
    const ellipseElements = svgElement.querySelectorAll('ellipse');
    ellipseElements.forEach(ellipse => {
      const cx = parseFloat(ellipse.getAttribute('cx') || 0);
      const cy = parseFloat(ellipse.getAttribute('cy') || 0);
      const rx = parseFloat(ellipse.getAttribute('rx') || 0);
      const ry = parseFloat(ellipse.getAttribute('ry') || 0);
      
      if (rx > 0 && ry > 0) {
        paths.push({
          type: 'ellipse',
          cx, cy, rx, ry,
          fill: this._parseColor(ellipse.getAttribute('fill')),
          stroke: this._parseColor(ellipse.getAttribute('stroke')),
          id: ellipse.getAttribute('id') || `ellipse_${paths.length}`
        });
      }
    });
    
    return paths;
  }

  /**
   * Parse color from SVG attributes
   * @param {string} colorStr - Color attribute value
   * @returns {Object} Parsed color data
   */
  static _parseColor(colorStr) {
    if (!colorStr || colorStr === 'none') {
      return null;
    }
    
    // Handle hex colors
    if (colorStr.startsWith('#')) {
      return { type: 'hex', value: colorStr };
    }
    
    // Handle rgb colors
    if (colorStr.startsWith('rgb')) {
      const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [_, r, g, b] = match.map(Number);
        return { type: 'rgb', r, g, b };
      }
    }
    
    // Handle named colors
    return { type: 'name', value: colorStr };
  }
  
  /**
   * Extract color data for grayscale mapping
   * @param {Element} svgElement - SVG DOM element
   * @returns {Object} Color data mapping
   */
  static _parseColorData(svgElement) {
    const colorMap = {};
    
    // Process all elements with fill or stroke
    const elements = svgElement.querySelectorAll('*[fill], *[stroke]');
    elements.forEach(el => {
      const id = el.getAttribute('id') || `element_${Object.keys(colorMap).length}`;
      
      const fill = this._parseColor(el.getAttribute('fill'));
      const stroke = this._parseColor(el.getAttribute('stroke'));
      
      if (fill || stroke) {
        colorMap[id] = { fill, stroke };
      }
    });
    
    return colorMap;
  }
}

module.exports = SVGParser; 