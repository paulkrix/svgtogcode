/**
 * SVG Parser Module
 * 
 * Parses SVG files to extract paths and metadata for processing
 */

const { JSDOM } = require('jsdom');
const svgParser = require('svg-parser');
const { createReadStream } = require('fs');
const { parseStringPromise } = require('xml2js');

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
    
    // Clean up DOM after use to free memory
    dom.window.close();
    
    return {
      width,
      height,
      viewBox,
      paths,
      colorData
    };
  }

  /**
   * Parse a large SVG file using streaming and chunking for memory efficiency
   * @param {string} filePath - Path to the SVG file
   * @returns {Promise<Object>} Parsed SVG data
   */
  static async parseFile(filePath) {
    return new Promise((resolve, reject) => {
      let chunks = [];
      
      const readStream = createReadStream(filePath, { encoding: 'utf8' });
      
      readStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      readStream.on('end', async () => {
        try {
          const svgString = chunks.join('');
          chunks = null; // Free memory
          
          // For extremely large files, use XML streaming parser instead of DOM
          if (svgString.length > 10 * 1024 * 1024) { // If > 10MB
            const result = await this._parseWithXml2js(svgString);
            resolve(result);
          } else {
            const result = this.parse(svgString);
            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      });
      
      readStream.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  /**
   * Parse SVG using xml2js for better memory efficiency with large files
   * @param {string} svgString - SVG content
   * @returns {Promise<Object>} Parsed SVG data
   */
  static async _parseWithXml2js(svgString) {
    try {
      const result = await parseStringPromise(svgString, {
        trim: true,
        explicitArray: false,
        mergeAttrs: true
      });
      
      if (!result.svg) {
        throw new Error('Invalid SVG: No SVG element found');
      }
      
      const svgElement = result.svg;
      
      // Extract metadata
      const width = this._parseLength(svgElement.width || '100');
      const height = this._parseLength(svgElement.height || '100');
      
      // Parse viewBox
      const viewBox = this._parseViewBox(svgElement.viewBox);
      
      // Parse paths - handle xml2js format which is different from DOM
      const paths = this._parsePathsFromXml2js(svgElement);
      
      // Parse color information
      const colorData = this._parseColorDataFromXml2js(svgElement);
      
      return {
        width,
        height,
        viewBox,
        paths,
        colorData
      };
    } catch (error) {
      throw new Error(`Failed to parse SVG with xml2js: ${error.message}`);
    }
  }
  
  /**
   * Parse paths from xml2js parsed object
   * @param {Object} svgElement - xml2js parsed SVG element
   * @returns {Array} Array of path objects
   */
  static _parsePathsFromXml2js(svgElement) {
    const paths = [];
    
    // Helper to process groups of elements
    const processElements = (elements, type) => {
      if (!elements) return;
      
      // Convert to array if single element
      const elemArray = Array.isArray(elements) ? elements : [elements];
      
      elemArray.forEach((element, index) => {
        if (type === 'path' && element.d) {
          paths.push({
            type: 'path',
            d: element.d,
            fill: this._parseColor(element.fill),
            stroke: this._parseColor(element.stroke),
            id: element.id || `path_${paths.length}`
          });
        } else if (type === 'rect' && element.width && element.height) {
          const x = parseFloat(element.x || 0);
          const y = parseFloat(element.y || 0);
          const width = parseFloat(element.width || 0);
          const height = parseFloat(element.height || 0);
          
          if (width > 0 && height > 0) {
            const d = `M${x},${y} h${width} v${height} h${-width} Z`;
            paths.push({
              type: 'rect',
              d,
              fill: this._parseColor(element.fill),
              stroke: this._parseColor(element.stroke),
              id: element.id || `rect_${paths.length}`
            });
          }
        } else if (type === 'line' && element.x1 !== undefined) {
          const x1 = parseFloat(element.x1 || 0);
          const y1 = parseFloat(element.y1 || 0);
          const x2 = parseFloat(element.x2 || 0);
          const y2 = parseFloat(element.y2 || 0);
          
          const d = `M${x1},${y1} L${x2},${y2}`;
          paths.push({
            type: 'line',
            d,
            fill: null,
            stroke: this._parseColor(element.stroke),
            strokeWidth: parseFloat(element['stroke-width'] || 1),
            id: element.id || `line_${paths.length}`
          });
        } else if (type === 'circle' && element.r) {
          const cx = parseFloat(element.cx || 0);
          const cy = parseFloat(element.cy || 0);
          const r = parseFloat(element.r || 0);
          
          if (r > 0) {
            paths.push({
              type: 'circle',
              cx, cy, r,
              fill: this._parseColor(element.fill),
              stroke: this._parseColor(element.stroke),
              id: element.id || `circle_${paths.length}`
            });
          }
        } else if (type === 'ellipse' && element.rx && element.ry) {
          const cx = parseFloat(element.cx || 0);
          const cy = parseFloat(element.cy || 0);
          const rx = parseFloat(element.rx || 0);
          const ry = parseFloat(element.ry || 0);
          
          if (rx > 0 && ry > 0) {
            paths.push({
              type: 'ellipse',
              cx, cy, rx, ry,
              fill: this._parseColor(element.fill),
              stroke: this._parseColor(element.stroke),
              id: element.id || `ellipse_${paths.length}`
            });
          }
        }
      });
    };
    
    // Process each type of element
    processElements(svgElement.path, 'path');
    processElements(svgElement.rect, 'rect');
    processElements(svgElement.line, 'line');
    processElements(svgElement.circle, 'circle');
    processElements(svgElement.ellipse, 'ellipse');
    
    // Process groups if they exist
    if (svgElement.g) {
      const groups = Array.isArray(svgElement.g) ? svgElement.g : [svgElement.g];
      groups.forEach(group => {
        processElements(group.path, 'path');
        processElements(group.rect, 'rect');
        processElements(group.line, 'line');
        processElements(group.circle, 'circle');
        processElements(group.ellipse, 'ellipse');
      });
    }
    
    return paths;
  }
  
  /**
   * Parse color data from xml2js parsed object
   * @param {Object} svgElement - xml2js parsed SVG element
   * @returns {Object} Color data mapping
   */
  static _parseColorDataFromXml2js(svgElement) {
    const colorMap = {};
    
    // Helper to extract color info from an element
    const extractColorInfo = (element, id, index) => {
      if (!element) return;
      
      const elementId = element.id || `element_${index}`;
      const fill = this._parseColor(element.fill);
      const stroke = this._parseColor(element.stroke);
      
      if (fill || stroke) {
        colorMap[elementId] = { fill, stroke };
      }
    };
    
    // Helper to process groups of elements
    const processElements = (elements, type) => {
      if (!elements) return;
      
      // Convert to array if single element
      const elemArray = Array.isArray(elements) ? elements : [elements];
      
      elemArray.forEach((element, index) => {
        extractColorInfo(element, `${type}_${index}`);
      });
    };
    
    // Process each type of element
    processElements(svgElement.path, 'path');
    processElements(svgElement.rect, 'rect');
    processElements(svgElement.line, 'line');
    processElements(svgElement.circle, 'circle');
    processElements(svgElement.ellipse, 'ellipse');
    
    // Process groups if they exist
    if (svgElement.g) {
      const groups = Array.isArray(svgElement.g) ? svgElement.g : [svgElement.g];
      groups.forEach((group, groupIndex) => {
        processElements(group.path, `group${groupIndex}_path`);
        processElements(group.rect, `group${groupIndex}_rect`);
        processElements(group.line, `group${groupIndex}_line`);
        processElements(group.circle, `group${groupIndex}_circle`);
        processElements(group.ellipse, `group${groupIndex}_ellipse`);
      });
    }
    
    return colorMap;
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
        // Clean up path data by normalizing whitespace and newlines
        const cleanedPathData = d.replace(/\s+/g, ' ').trim();
        
        paths.push({
          type: 'path',
          d: cleanedPathData,
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
    
    // Get all line elements
    const lineElements = svgElement.querySelectorAll('line');
    lineElements.forEach(line => {
      const x1 = parseFloat(line.getAttribute('x1') || 0);
      const y1 = parseFloat(line.getAttribute('y1') || 0);
      const x2 = parseFloat(line.getAttribute('x2') || 0);
      const y2 = parseFloat(line.getAttribute('y2') || 0);
      
      // Convert line to path
      const d = `M${x1},${y1} L${x2},${y2}`;
      paths.push({
        type: 'line',
        d,
        fill: null, // Lines don't have fill
        stroke: this._parseColor(line.getAttribute('stroke')),
        strokeWidth: parseFloat(line.getAttribute('stroke-width') || 1),
        id: line.getAttribute('id') || `line_${paths.length}`
      });
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