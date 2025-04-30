/**
 * Grayscale Mapper Module
 * 
 * Maps grayscale colors to cutting depths
 */

const colorConvert = require('color-convert');

/**
 * Maps grayscale colors to cutting depths
 */
class GrayscaleMapper {
  /**
   * Create a new grayscale mapper with configuration
   * @param {Object} config - Configuration for mapping
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Map grayscale value to a depth within the configured range
   * @param {number} grayscaleValue - Grayscale value (0-255)
   * @returns {number} Depth value
   */
  mapToDepth(grayscaleValue) {
    // Normalize grayscale value to range 0-1
    const normalizedValue = grayscaleValue / 255;
    
    // Get depth range from config
    const { minDepth, maxDepth, invert } = this.config.grayscaleMapping;
    
    // Range of depths
    const depthRange = maxDepth - minDepth;
    
    // Map grayscale to depth (invert if needed)
    let mappedValue;
    if (invert) {
      mappedValue = minDepth + ((1 - normalizedValue) * depthRange);
    } else {
      mappedValue = minDepth + (normalizedValue * depthRange);
    }
    
    // Round to configured precision
    const precision = this.config.output.precision || 3;
    return Number(mappedValue.toFixed(precision));
  }

  /**
   * Process an SVG input to add depth information
   * @param {SVGInput} svgInput - SVG input object
   * @returns {Object} SVG data with depth mapping
   */
  process(svgInput) {
    const result = {
      paths: [],
      metadata: {
        minDepth: this.config.grayscaleMapping.minDepth,
        maxDepth: this.config.grayscaleMapping.maxDepth,
        invert: this.config.grayscaleMapping.invert
      }
    };
    
    // Process each path
    svgInput.paths.forEach(path => {
      const grayscaleValue = this._getGrayscaleValue(path, svgInput.colorData);
      const depth = this.mapToDepth(grayscaleValue);
      
      result.paths.push({
        ...path,
        depth,
        grayscaleValue
      });
    });
    
    return result;
  }

  /**
   * Extract grayscale value from a path
   * @param {Object} path - Path object
   * @param {Object} colorData - Color data mapping
   * @returns {number} Grayscale value (0-255)
   */
  _getGrayscaleValue(path, colorData) {
    // Get color from fill (preferred) or stroke
    let colorObj = null;
    
    // First try the path's own fill/stroke
    if (path.fill) {
      colorObj = path.fill;
    } else if (path.stroke) {
      colorObj = path.stroke;
    } 
    // Then try the color data map
    else if (path.id && colorData[path.id]) {
      const pathColorData = colorData[path.id];
      colorObj = pathColorData.fill || pathColorData.stroke || null;
    }
    
    // Default to black (0) if no color found
    if (!colorObj) {
      return 0;
    }
    
    // Convert color to grayscale
    return this._colorToGrayscale(colorObj);
  }

  /**
   * Convert a color object to grayscale value
   * @param {Object} colorObj - Color object
   * @returns {number} Grayscale value (0-255)
   */
  _colorToGrayscale(colorObj) {
    // For grayscale conversion, we use standard luminance formula:
    // Y = 0.299R + 0.587G + 0.114B
    
    let r, g, b;
    
    // Extract RGB values from different color formats
    if (colorObj.type === 'rgb') {
      r = colorObj.r;
      g = colorObj.g;
      b = colorObj.b;
    } else if (colorObj.type === 'hex') {
      // Convert hex to RGB
      try {
        const hex = colorObj.value.replace('#', '');
        const rgb = colorConvert.hex.rgb(hex);
        [r, g, b] = rgb;
      } catch (error) {
        // Default to black for invalid hex
        return 0;
      }
    } else if (colorObj.type === 'name') {
      // Convert named color to RGB
      try {
        const rgb = colorConvert.keyword.rgb(colorObj.value);
        [r, g, b] = rgb;
      } catch (error) {
        // Default to black for invalid name
        return 0;
      }
    } else {
      // Unknown color type
      return 0;
    }
    
    // Calculate grayscale value using luminance formula
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
}

module.exports = GrayscaleMapper; 