/**
 * Represents an SVG input file with metadata
 */
const SVGParser = require('../parser/svg-parser');

class SVGInput {
  /**
   * Create a new SVG input object
   * @param {string} rawData - Raw SVG file content as string
   * @param {number} width - Width of the SVG in pixels/units
   * @param {number} height - Height of the SVG in pixels/units
   * @param {Object} viewBox - SVG viewBox attributes
   * @param {Array} paths - Array of parsed path objects
   * @param {Object} colorData - Mapping of IDs to color data
   * @param {string} filename - Original filename for reference
   */
  constructor(rawData, width, height, viewBox, paths, colorData, filename) {
    this.rawData = rawData;
    this.width = width;
    this.height = height;
    this.viewBox = viewBox || { minX: 0, minY: 0, width: width, height: height };
    this.paths = paths || [];
    this.colorData = colorData || {};
    this.filename = filename;
  }

  /**
   * Create an SVG input from a file string
   * @param {string} svgString - Raw SVG content
   * @param {string} filename - Filename
   * @returns {SVGInput} SVG input object
   */
  static fromString(svgString, filename) {
    // Use the SVG parser to extract data
    const parsedData = SVGParser.parse(svgString);
    
    return new SVGInput(
      svgString,
      parsedData.width,
      parsedData.height,
      parsedData.viewBox,
      parsedData.paths,
      parsedData.colorData,
      filename
    );
  }

  /**
   * Get the aspect ratio of the SVG
   * @returns {number} Aspect ratio (width/height)
   */
  getAspectRatio() {
    return this.width / this.height;
  }

  /**
   * Check if the SVG has a valid viewBox
   * @returns {boolean} True if viewBox is valid
   */
  hasValidViewBox() {
    return (
      this.viewBox &&
      typeof this.viewBox.width === 'number' &&
      typeof this.viewBox.height === 'number' &&
      this.viewBox.width > 0 &&
      this.viewBox.height > 0
    );
  }
  
  /**
   * Get SVG dimensions
   * @returns {Object} Width and height
   */
  getDimensions() {
    return {
      width: this.width,
      height: this.height
    };
  }
  
  /**
   * Get the number of paths in the SVG
   * @returns {number} Path count
   */
  getPathCount() {
    return this.paths.length;
  }
}

module.exports = SVGInput; 