/**
 * SVG Processor - Handles SVG parsing, processing and conversion to GCode
 */

const { JSDOM } = require('jsdom');
const svgpath = require('svgpath');
const svgParser = require('svg-parser');
const Bezier = require('bezier-js');
const colorConvert = require('color-convert');
const GCodeGenerator = require('./gcode/gcode-generator');

class SVGProcessor {
  constructor() {
    this.processedData = null;
    this.toolpathData = null;
  }

  /**
   * Convert SVG data to GCode
   * @param {string} svgData - The SVG content as a string
   * @param {Object} config - Configuration options
   * @param {Function} progressCallback - Callback for progress updates
   * @returns {Object} - Generated GCode with commands, header, footer, and metadata
   */
  async convertToGCode(svgData, config, progressCallback = null) {
    try {
      console.log("Starting SVG to GCode conversion");
      
      // Process the SVG data
      if (progressCallback) progressCallback(10);
      console.log("Processing SVG data...");
      const processedData = await this.getProcessedData(svgData, config);
      
      // Update progress
      if (progressCallback) progressCallback(30);
      console.log("Generating toolpaths...");
      
      // Generate toolpaths
      const toolpathData = await this.getToolpathData(processedData, config);
      
      // Update progress
      if (progressCallback) progressCallback(60);
      console.log("Creating GCode...");
      
      // Generate GCode from toolpaths
      const gcode = this.generateGCode(toolpathData, config);
      
      // Update progress
      if (progressCallback) progressCallback(90);
      
      // Add timing and metadata information
      const metadata = {
        minDepth: config.grayscaleMapping.minDepth,
        maxDepth: config.grayscaleMapping.maxDepth,
        totalPaths: toolpathData.toolpaths.length,
        estimatedTime: this._calculateEstimatedTime(toolpathData, config)
      };
      
      // Format as a proper GCode object with header, commands, and footer
      const gcodeResult = {
        header: this._generateGCodeHeader(config, metadata),
        commands: this._formatGCodeCommands(gcode),
        footer: this._generateGCodeFooter(config),
        metadata: metadata,
        estimatedTime: metadata.estimatedTime
      };
      
      console.log("Conversion complete with", gcodeResult.commands.length, "commands");
      
      // Update progress to 100%
      if (progressCallback) progressCallback(100);
      
      return gcodeResult;
    } catch (error) {
      console.error('Error converting SVG to GCode:', error);
      throw error;
    }
  }

  /**
   * Process SVG data and extract paths
   * @param {string} svgData - The SVG content as a string
   * @param {Object} config - Configuration options
   * @returns {Object} - Processed SVG data
   */
  getProcessedData(svgData, config) {
    try {
      // Parse SVG
      console.log("Parsing SVG data...");
      const parsed = svgParser.parse(svgData);
      
      // Extract path data, handle nested groups, transforms, etc.
      const paths = this.extractPaths(parsed);
      
      // Process paths (convert to absolute coordinates, normalize, etc.)
      const processedPaths = this.processPaths(paths);
      
      // Store processed data for later use
      this.processedData = {
        paths: processedPaths,
        viewBox: this.extractViewBox(parsed),
        size: this.extractSize(parsed)
      };
      
      return this.processedData;
    } catch (error) {
      console.error('Error processing SVG data:', error);
      throw error;
    }
  }

  /**
   * Generate toolpath data from processed SVG
   * @param {Object|string} input - Processed SVG data object or raw SVG string
   * @param {Object} config - Configuration options
   * @returns {Object} - Toolpath data
   */
  async getToolpathData(input, config) {
    try {
      let processedData;
      
      // Check if we received raw SVG data or already processed data
      if (typeof input === 'string') {
        // It's raw SVG data, we need to process it first
        processedData = await this.getProcessedData(input, config);
      } else {
        // It's already processed data
        processedData = input;
      }
      
      const { paths } = processedData;
      
      if (!paths) {
        throw new Error('No processed SVG data available');
      }
      
      // Generate toolpaths based on configuration
      const toolpaths = paths.map(path => {
        // For each path, generate a toolpath based on the config
        // This would include depth calculation, tool offsets, etc.
        return this.generateToolpath(path, config);
      });
      
      // Store toolpath data for later use
      this.toolpathData = {
        toolpaths,
        config
      };
      
      return this.toolpathData;
    } catch (error) {
      console.error('Error generating toolpath data:', error);
      throw error;
    }
  }

  /**
   * Generate GCode from toolpath data
   * @param {Object} toolpathData - Toolpath data
   * @param {Object} config - Configuration
   * @returns {string} GCode
   */
  generateGCode(toolpathData, config) {
    console.log("Generating GCode...");
    
    if (!toolpathData || !toolpathData.toolpaths) {
      console.error("Error: No toolpath data available for GCode generation");
      throw new Error("No toolpath data available for GCode generation");
    }
    
    try {
      // Ensure all required configuration properties exist with defaults
      const fullConfig = {
        output: {
          includeHeader: true,
          includeFooter: true,
          precision: 3,
          ...(config?.output || {}) // Merge with provided output config
        },
        machine: {
          flavor: 'grbl',
          feedRates: {
            default: 1000,
            plunge: 500,
            rapid: 3000,
            ...(config?.machine?.feedRates || {})
          },
          safeHeight: 5,
          ...(config?.machine || {})
        },
        tool: {
          diameter: 3,
          spindleSpeed: 12000,
          ...(config?.tool || {})
        },
        ...(config || {}) // Keep any other config properties
      };
      
      // Create GCode generator
      const GCodeGenerator = require('./gcode/gcode-generator');
      const gCodeGenerator = new GCodeGenerator(fullConfig);
      
      // Generate GCode
      const gcodeData = gCodeGenerator.generate(toolpathData);
      
      // Return the formatted GCode as a string, which is what the main application expects
      return [
        ...gcodeData.header,
        ...gcodeData.commands,
        ...gcodeData.footer
      ].join('\n');
    } catch (error) {
      console.error("Error generating GCode:", error);
      throw error;
    }
  }

  /**
   * Extract paths from SVG structure
   * @param {Object} parsed - Parsed SVG structure
   * @returns {Array} Array of paths
   */
  extractPaths(parsed) {
    console.log("Extracting paths from parsed SVG");
    const paths = [];
    
    // Get SVG size for background detection
    const svgSize = this.extractSize(parsed);
    const svgWidth = svgSize.width || 100;
    const svgHeight = svgSize.height || 100;
    
    // Function to check if a color is very light (likely background)
    const isLightColor = (color) => {
      if (!color) return false;
      
      // Skip transparent fills
      if (color === 'none' || color === 'transparent') return true;
      
      // For hex colors
      if (color.startsWith('#')) {
        // Pure white or very light colors
        const isWhiteOrLight = color === '#fff' || 
                              color === '#ffffff' || 
                              color === '#f0f0f0' || 
                              color === '#f8f8f8' || 
                              color === '#fafafa';
        if (isWhiteOrLight) return true;
        
        // Check if it's a light color by examining the hex values
        if (color.length === 7) {
          const r = parseInt(color.substr(1, 2), 16);
          const g = parseInt(color.substr(3, 2), 16);
          const b = parseInt(color.substr(5, 2), 16);
          // If average RGB value is high (>220), consider it light
          if ((r + g + b) / 3 > 220) return true;
        }
      }
      
      // For rgb colors
      if (color.startsWith('rgb')) {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const r = parseInt(match[1], 10);
          const g = parseInt(match[2], 10);
          const b = parseInt(match[3], 10);
          // If average RGB value is high (>220), consider it light
          if ((r + g + b) / 3 > 220) return true;
        }
      }
      
      return false;
    };
    
    // Function to check if an element is likely a background rectangle
    const isBackgroundRect = (x, y, width, height, fill) => {
      // Check if it's at position 0,0 or near origin
      const isAtOrigin = (x === 0 || x === '0' || x < 5) && 
                         (y === 0 || y === '0' || y < 5);
      
      // Check if it covers most of the SVG (at least 90%)
      const coversMostOfSvg = (width / svgWidth > 0.9) && 
                              (height / svgHeight > 0.9);
      
      // Check if it has a light color
      const hasLightColor = isLightColor(fill);
      
      // Very large rectangles at the origin are likely background elements 
      // regardless of their fill color 
      if (isAtOrigin && width > 250 && height > 250) {
        console.log("Skipping large background rectangle:", 
                    `x=${x}, y=${y}, width=${width}, height=${height}`);
        return true;
      }
      
      // Rectangles that cover most of the SVG and have a light fill
      return isAtOrigin && coversMostOfSvg && hasLightColor;
    };
    
    // Function to recursively extract paths from the SVG structure
    const extractPathsFromNode = (node, transform = '') => {
      if (!node) return;
      
      // Process based on node type
      if (node.tagName === 'path') {
        console.log("Found path element:", node.properties?.d?.substring(0, 30) + "...");
        
        // Get the path data
        const pathData = {
          type: 'path',
          d: node.properties?.d || '',
          fill: node.properties?.fill || '#000000',
          stroke: node.properties?.stroke,
          transform: transform + (node.properties?.transform || '')
        };
        
        // Skip background elements with light colors
        if (isLightColor(pathData.fill)) {
          console.log("Skipping background element with light fill:", pathData.fill);
          return;
        }
        
        // Only add valid paths with path data
        if (pathData.d && pathData.d.length > 0) {
          paths.push(pathData);
        }
      } 
      // If this is a rect, convert it to a path
      else if (node.tagName === 'rect') {
        console.log("Found rectangle element, converting to path");
        
        const x = parseFloat(node.properties?.x || 0);
        const y = parseFloat(node.properties?.y || 0);
        const width = parseFloat(node.properties?.width || 0);
        const height = parseFloat(node.properties?.height || 0);
        const rx = parseFloat(node.properties?.rx || 0);
        const ry = parseFloat(node.properties?.ry || 0);
        
        // Skip background rectangles
        if (isBackgroundRect(x, y, width, height, node.properties?.fill)) {
          console.log("Skipping background rectangle:", 
                    `x=${x}, y=${y}, width=${width}, height=${height}, fill=${node.properties?.fill}`);
          return;
        }
        
        // Create path data for rectangle (with optional rounded corners)
        let d;
        if (rx > 0 || ry > 0) {
          // Rounded rectangle
          const r = rx || ry;
          d = `M${x+r},${y} h${width-2*r} a${r},${r} 0 0 1 ${r},${r} v${height-2*r} a${r},${r} 0 0 1 -${r},${r} h-${width-2*r} a${r},${r} 0 0 1 -${r},-${r} v-${height-2*r} a${r},${r} 0 0 1 ${r},-${r} z`;
        } else {
          // Regular rectangle
          d = `M${x},${y} h${width} v${height} h-${width} z`;
        }
        
        // Add both fill and stroke paths if both are specified
        if (node.properties?.fill && node.properties?.fill !== 'none') {
          paths.push({
            type: 'path',
            d: d,
            fill: node.properties.fill,
            stroke: null,
            transform: transform + (node.properties?.transform || '')
          });
        }
        
        if (node.properties?.stroke && node.properties?.stroke !== 'none') {
          paths.push({
            type: 'path',
            d: d,
            fill: null,
            stroke: node.properties.stroke,
            strokeWidth: parseFloat(node.properties?.['stroke-width'] || 1),
            transform: transform + (node.properties?.transform || '')
          });
        }
        
        // If neither fill nor stroke is specified, use default fill
        if ((!node.properties?.fill || node.properties?.fill === 'none') && 
            (!node.properties?.stroke || node.properties?.stroke === 'none')) {
          paths.push({
            type: 'path',
            d: d,
            fill: '#000000',
            transform: transform + (node.properties?.transform || '')
          });
        }
      }
      // If this is a circle, convert it to a path
      else if (node.tagName === 'circle') {
        console.log("Found circle element, converting to path");
        
        const cx = parseFloat(node.properties?.cx || 0);
        const cy = parseFloat(node.properties?.cy || 0);
        const r = parseFloat(node.properties?.r || 0);
        
        if (isNaN(cx) || isNaN(cy) || isNaN(r) || r <= 0) {
          console.warn("Invalid circle parameters, skipping", { cx, cy, r });
          return;
        }
        
        // For filled circles, generate a proper circular path that traces the circumference
        // Use arc commands for precision: M cx-r,cy A r,r 0 1 1 cx+r,cy A r,r 0 1 1 cx-r,cy Z
        const d = `M${cx-r},${cy} A${r},${r} 0 1 1 ${cx+r},${cy} A${r},${r} 0 1 1 ${cx-r},${cy} Z`;
        
        console.log(`Generated circle path: ${d}`);
        
        // Handle fill and stroke appropriately
        if (node.properties?.fill && node.properties?.fill !== 'none') {
          const pathObj = {
            type: 'path',
            d: d,
            fill: node.properties.fill,
            stroke: null,
            strokeWidth: 0,
            transform: transform + (node.properties?.transform || ''),
            id: node.properties?.id || `circle_${paths.length}`
          };
          
          // For SVG interpretation, the path is filled
          pathObj.isFilled = true;
          
          // Store original circle parameters
          pathObj.originalType = 'circle';
          pathObj.cx = cx;
          pathObj.cy = cy;
          pathObj.r = r;
          
          paths.push(pathObj);
          console.log(`Added filled circle path with fill ${node.properties.fill}`);
        }
        
        if (node.properties?.stroke && node.properties?.stroke !== 'none') {
          paths.push({
            type: 'path',
            d: d,
            fill: null,
            stroke: node.properties.stroke,
            strokeWidth: parseFloat(node.properties?.['stroke-width'] || 1),
            transform: transform + (node.properties?.transform || ''),
            id: node.properties?.id || `circle_stroke_${paths.length}`
          });
          console.log(`Added circle stroke path with stroke ${node.properties.stroke}`);
        }
        
        // If neither fill nor stroke is specified, use default fill
        if ((!node.properties?.fill || node.properties?.fill === 'none') && 
            (!node.properties?.stroke || node.properties?.stroke === 'none')) {
          paths.push({
            type: 'path',
            d: d,
            fill: '#000000',
            transform: transform + (node.properties?.transform || ''),
            id: node.properties?.id || `circle_default_${paths.length}`
          });
          console.log("Added circle with default fill");
        }
      }
      // If this is a line, convert it to a path
      else if (node.tagName === 'line') {
        console.log("Found line element, converting to path");
        
        const x1 = parseFloat(node.properties?.x1 || 0);
        const y1 = parseFloat(node.properties?.y1 || 0);
        const x2 = parseFloat(node.properties?.x2 || 0);
        const y2 = parseFloat(node.properties?.y2 || 0);
        
        // Create path data for the line
        const d = `M${x1},${y1} L${x2},${y2}`;
        
        paths.push({
          type: 'path',
          d: d,
          fill: null,
          stroke: node.properties?.stroke || '#000000',
          strokeWidth: parseFloat(node.properties?.['stroke-width'] || 1),
          transform: transform + (node.properties?.transform || '')
        });
      }
      
      // For groups, process all children with accumulated transforms
      if (node.tagName === 'g') {
        console.log("Processing group element");
        const groupTransform = transform + (node.properties?.transform || '');
        
        // Process all children of the group
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => {
            extractPathsFromNode(child, groupTransform);
          });
        }
      }
      
      // Process all children for non-group elements (like svg root)
      if (node.tagName !== 'g' && node.children && node.children.length > 0) {
        node.children.forEach(child => {
          extractPathsFromNode(child, transform);
        });
      }
    };
    
    // Start extraction from the root element
    if (parsed.children && parsed.children.length > 0) {
      parsed.children.forEach(child => {
        extractPathsFromNode(child);
      });
    }
    
    console.log(`Extracted ${paths.length} paths from SVG`);
    
    // If no paths were found, create a simple example path
    if (paths.length === 0) {
      console.log("No paths found, adding example path");
      paths.push({ 
        type: 'path',
        d: 'M10,10 L90,10 L90,90 L10,90 Z',
        fill: '#000000'
      });
    }
    
    return paths;
  }

  /**
   * Process extracted paths
   * @param {Array} paths - Extracted paths
   * @returns {Array} - Processed paths
   */
  processPaths(paths) {
    console.log("Processing", paths.length, "paths");
    
    return paths.map((path, index) => {
      console.log(`Processing path ${index + 1}`);
      let processedPath = { ...path };
      
      try {
        // Normalize path data using svgpath
        let normalizedPath = svgpath(path.d);
        
        // Apply any transforms
        if (path.transform) {
          normalizedPath = normalizedPath.transform(path.transform);
        }
        
        // Convert to absolute coordinates
        normalizedPath = normalizedPath.abs();
        
        // Simplify and optimize
        normalizedPath = normalizedPath.round(3);
        
        // Update the path data
        processedPath.d = normalizedPath.toString();
        
        // Extract path segments for easier processing
        processedPath.segments = this._extractPathSegments(processedPath.d);
        
        // Calculate fill color as grayscale value (0-1)
        processedPath.grayscale = this._calculateGrayscale(path.fill);
        
        // Calculate bounding box
        const bounds = this._calculatePathBounds(processedPath.segments);
        processedPath.bounds = bounds;
        
        console.log(`Path ${index + 1} processed successfully`);
      } catch (error) {
        console.error(`Error processing path ${index + 1}:`, error);
        // Keep original data if processing fails
      }
      
      return processedPath;
    });
  }
  
  /**
   * Extract segments from an SVG path string
   * @private
   * @param {string} pathData - SVG path data
   * @returns {Array} - Path segments
   */
  _extractPathSegments(pathData) {
    const segments = [];
    
    // Very simple regex-based parser for demonstration
    // A production implementation would use a proper SVG path parser
    
    // Match commands like M, L, C, Z, etc. followed by their parameters
    const commandRegex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
    let match;
    
    while ((match = commandRegex.exec(pathData)) !== null) {
      const command = match[1];
      const params = match[2].trim()
        .split(/[\s,]+/)
        .filter(p => p !== '')
        .map(parseFloat);
      
      segments.push({
        command,
        params
      });
    }
    
    return segments;
  }
  
  /**
   * Calculate grayscale value from a fill color
   * @private
   * @param {string} fill - Fill color (hex, rgb, etc.)
   * @returns {number} - Grayscale value (0-1)
   */
  _calculateGrayscale(fill) {
    if (!fill || fill === 'none') {
      return 0.5; // Default mid-gray
    }
    
    try {
      // Handle hex colors
      if (fill.startsWith('#')) {
        // Convert hex to RGB
        let hex = fill.slice(1);
        
        // Handle short hex format (#RGB)
        if (hex.length === 3) {
          hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        // Parse RGB components
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Calculate luminance (grayscale)
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      }
      
      // Handle rgb/rgba colors
      if (fill.startsWith('rgb')) {
        const rgbMatch = fill.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1], 10);
          const g = parseInt(rgbMatch[2], 10);
          const b = parseInt(rgbMatch[3], 10);
          
          // Calculate luminance (grayscale)
          return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        }
      }
      
      // For other colors, use a default value
      return 0.5;
      
    } catch (error) {
      console.error('Error calculating grayscale:', error);
      return 0.5; // Default mid-gray on error
    }
  }
  
  /**
   * Calculate bounding box for path segments
   * @private
   * @param {Array} segments - Path segments
   * @returns {Object} - Bounding box {minX, minY, maxX, maxY}
   */
  _calculatePathBounds(segments) {
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;
    
    let currentX = 0;
    let currentY = 0;
    
    segments.forEach(segment => {
      const { command, params } = segment;
      
      switch (command) {
        case 'M': // Move
          currentX = params[0];
          currentY = params[1];
          minX = Math.min(minX, currentX);
          minY = Math.min(minY, currentY);
          maxX = Math.max(maxX, currentX);
          maxY = Math.max(maxY, currentY);
          break;
          
        case 'L': // Line
          currentX = params[0];
          currentY = params[1];
          minX = Math.min(minX, currentX);
          minY = Math.min(minY, currentY);
          maxX = Math.max(maxX, currentX);
          maxY = Math.max(maxY, currentY);
          break;
          
        case 'H': // Horizontal line
          currentX = params[0];
          minX = Math.min(minX, currentX);
          maxX = Math.max(maxX, currentX);
          break;
          
        case 'V': // Vertical line
          currentY = params[0];
          minY = Math.min(minY, currentY);
          maxY = Math.max(maxY, currentY);
          break;
          
        // Simplified handling for curves - just use control points
        case 'C': // Cubic Bezier
          for (let i = 0; i < params.length; i += 2) {
            const x = params[i];
            const y = params[i + 1];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
          currentX = params[4];
          currentY = params[5];
          break;
          
        default:
          // For other commands, we would need more complex handling
          break;
      }
    });
    
    // If no valid bounds were calculated, use defaults
    if (minX === Number.MAX_SAFE_INTEGER) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    }
    
    return { minX, minY, maxX, maxY };
  }

  /**
   * Extract viewBox from parsed SVG
   * @param {Object} parsed - Parsed SVG data
   * @returns {Object} - ViewBox information
   */
  extractViewBox(parsed) {
    // Extract viewBox from SVG - simplified placeholder
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  /**
   * Extract size from parsed SVG
   * @param {Object} parsed - Parsed SVG data
   * @returns {Object} - Size information
   */
  extractSize(parsed) {
    // Extract width and height from SVG - simplified placeholder
    return { width: 100, height: 100 };
  }

  /**
   * Generate toolpath for a single path
   * @param {Object} path - Processed path data
   * @param {Object} config - Configuration options
   * @returns {Object} - Toolpath data
   */
  generateToolpath(path, config) {
    const { type, d, originalType, cx, cy, r } = path;
    
    // Calculate depth based on grayscale value
    const { minDepth, maxDepth, invert } = config.grayscaleMapping || { minDepth: 0.5, maxDepth: 5, invert: false };
    const grayscaleValue = path.grayscale !== undefined ? path.grayscale : 0.5;
    
    // Calculate depth based on grayscale and invert setting
    let depth;
    if (invert) {
      // Darker colors (lower grayscale) = shallower cuts
      depth = minDepth + ((1 - grayscaleValue) * (maxDepth - minDepth));
    } else {
      // Darker colors (lower grayscale) = deeper cuts
      depth = minDepth + (grayscaleValue * (maxDepth - minDepth));
    }
    
    // Round depth to reasonable precision
    depth = Math.round(depth * 100) / 100;
    
    console.log(`Generating toolpath for path`);
    console.log(`Path depth: ${depth}mm (grayscale: ${grayscaleValue})`);
    
    if (originalType === 'circle' && cx !== undefined && cy !== undefined && r !== undefined) {
      // This was originally a circle - handle it directly
      console.log(`Generating circle toolpath: cx=${cx}, cy=${cy}, r=${r}`);
      
      const points = [];
      const resolution = config.toolpath?.resolution || 72;
      
      // Generate points around the circle
      for (let i = 0; i <= resolution; i++) {
        const angle = (i / resolution) * Math.PI * 2;
        points.push({
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle)
        });
      }
      
      // Add Z-depth to each point
      const pointsWithDepth = points.map(p => ({
        ...p,
        z: -depth // Negative depth for CNC (Z goes down)
      }));
      
      return {
        points: [
          // First point at Z=0 (approach)
          { ...pointsWithDepth[0], z: 0 },
          // Points at cutting depth
          ...pointsWithDepth,
          // Last point back at Z=0 (retract)
          { ...pointsWithDepth[pointsWithDepth.length - 1], z: 0 }
        ],
        depth,
        bounds: {
          minX: cx - r,
          minY: cy - r,
          maxX: cx + r,
          maxY: cy + r
        },
        originalPath: d
      };
    }
    
    // Handle path data with segments
    if (type === 'path' && d) {
      // Check for any Arc commands (A)
      if (d.includes('A') || d.includes('a')) {
        console.log('Unhandled path command: A');
        
        // Check for circle pattern
        const circlePattern = /M\s*([0-9.-]+),\s*([0-9.-]+)\s*A\s*([0-9.-]+),\s*([0-9.-]+)\s+0\s+1\s+1\s+([0-9.-]+),\s*([0-9.-]+)/i;
        const match = d.match(circlePattern);
        
        if (match) {
          // Extract circle parameters
          const x1 = parseFloat(match[1]);
          const y1 = parseFloat(match[2]);
          const rx = parseFloat(match[3]);
          const ry = parseFloat(match[4]);
          const x2 = parseFloat(match[5]);
          const y2 = parseFloat(match[6]);
          
          // Check if it's a circle
          if (Math.abs(rx - ry) < 0.01) {
            // It's likely a circle or an arc
            console.log(`Detected circle arc: x1=${x1}, y1=${y1}, r=${rx}`);
            
            let cx, cy, r;
            
            // Check if it's a half circle
            if (Math.abs(x2 - x1) > 1.5 * rx && Math.abs(y2 - y1) < 0.01) {
              // Horizontal half circle
              cx = (x1 + x2) / 2;
              cy = y1;
              r = rx;
              console.log(`Processing as horizontal half circle: cx=${cx}, cy=${cy}, r=${r}`);
            } else if (Math.abs(x2 - x1) < 0.01 && Math.abs(y2 - y1) > 1.5 * ry) {
              // Vertical half circle
              cx = x1;
              cy = (y1 + y2) / 2;
              r = ry;
              console.log(`Processing as vertical half circle: cx=${cx}, cy=${cy}, r=${r}`);
            } else if (Math.abs(x2 - x1) < 0.01 && Math.abs(y2 - y1) < 0.01) {
              // Full circle
              cx = x1 + rx; // Adjust based on where the arc starts
              cy = y1;
              r = rx;
              console.log(`Processing as full circle: cx=${cx}, cy=${cy}, r=${r}`);
            } else {
              // Generic arc
              console.log('Processing as generic arc');
              // Fall back to segmentation
              return this._segmentsToPoints(path.segments, depth);
            }
            
            // Generate points around the circle/arc
            const points = [];
            const resolution = config.toolpath?.resolution || 72;
            
            for (let i = 0; i <= resolution; i++) {
              const angle = (i / resolution) * Math.PI * 2;
              points.push({
                x: cx + r * Math.cos(angle),
                y: cy + r * Math.sin(angle)
              });
            }
            
            // Add Z-depth to each point
            const pointsWithDepth = points.map(p => ({
              ...p,
              z: -depth // Negative depth for CNC (Z goes down)
            }));
            
            return {
              points: [
                // First point at Z=0 (approach)
                { ...pointsWithDepth[0], z: 0 },
                // Points at cutting depth
                ...pointsWithDepth,
                // Last point back at Z=0 (retract)
                { ...pointsWithDepth[pointsWithDepth.length - 1], z: 0 }
              ],
              depth,
              bounds: {
                minX: cx - r,
                minY: cy - r,
                maxX: cx + r,
                maxY: cy + r
              },
              originalPath: d
            };
          }
        }
      }
      
      // Process path segments
      return this._segmentsToPoints(path.segments, depth);
    }
    
    // For other types or fallback
    console.log(`Using default segment processing for path`);
    return this._segmentsToPoints(path.segments, depth);
  }
  
  /**
   * Convert path segments to toolpath points
   * @private
   * @param {Array} segments - Path segments
   * @param {number} depth - Cutting depth
   * @returns {Array} - Array of points with x, y, z coordinates
   */
  _segmentsToPoints(segments, depth) {
    if (!segments || segments.length === 0) {
      // Return a simple square toolpath if no segments
      return [
        { x: 10, y: 10, z: 0 },      // Starting point, safe Z
        { x: 10, y: 10, z: -depth },  // Plunge
        { x: 90, y: 10, z: -depth },
        { x: 90, y: 90, z: -depth },
        { x: 10, y: 90, z: -depth },
        { x: 10, y: 10, z: -depth },
        { x: 10, y: 10, z: 0 }       // Retract to safe Z
      ];
    }
    
    const points = [];
    let currentX = 0;
    let currentY = 0;
    let firstX = null;
    let firstY = null;
    let penDown = false;
    let lastCommand = null;
    
    const ensurePenUp = () => {
      if (penDown) {
        // Retract to safe Z at current position
        points.push({ x: currentX, y: currentY, z: 0 });
        penDown = false;
      }
    };
    
    const ensurePenDown = () => {
      if (!penDown) {
        // Plunge at current position
        points.push({ x: currentX, y: currentY, z: -depth });
        penDown = true;
      }
    };
    
    // Process each segment to generate toolpath points
    segments.forEach((segment, index) => {
      const { command, params } = segment;
      
      switch (command) {
        case 'M': // Move To
          // If this is the first point in the path
          if (index === 0 || !lastCommand) {
            ensurePenUp();
            
            currentX = params[0];
            currentY = params[1];
            firstX = currentX;
            firstY = currentY;
            
            // Add starting point with safe Z
            points.push({ x: currentX, y: currentY, z: 0 });
            
            // Add plunge point
            points.push({ x: currentX, y: currentY, z: -depth });
            penDown = true;
          } else {
            // For subsequent moves, add a safe Z move
            ensurePenUp();
            
            // Move to new position
            currentX = params[0];
            currentY = params[1];
            
            // Safe Z at new position
            points.push({ x: currentX, y: currentY, z: 0 });
            
            // Plunge at new position
            points.push({ x: currentX, y: currentY, z: -depth });
            penDown = true;
          }
          break;
          
        case 'L': // Line To
          ensurePenDown();
          currentX = params[0];
          currentY = params[1];
          points.push({ x: currentX, y: currentY, z: -depth });
          break;
          
        case 'H': // Horizontal Line
          ensurePenDown();
          currentX = params[0];
          points.push({ x: currentX, y: currentY, z: -depth });
          break;
          
        case 'V': // Vertical Line
          ensurePenDown();
          currentY = params[0];
          points.push({ x: currentX, y: currentY, z: -depth });
          break;
          
        case 'Z': // Close Path
          ensurePenDown();
          // If we have a first point and the current point is different
          if (firstX !== null && firstY !== null && 
              (Math.abs(currentX - firstX) > 0.01 || Math.abs(currentY - firstY) > 0.01)) {
            // Add a line back to the first point
            points.push({ x: firstX, y: firstY, z: -depth });
            currentX = firstX;
            currentY = firstY;
          }
          break;
          
        case 'C': // Cubic Bezier
          ensurePenDown();
          
          // For bezier curves, interpolate points along the curve
          const steps = 10;  // Number of interpolation steps
          const [x1, y1, x2, y2, x3, y3] = params;
          
          // Control points for the bezier
          const p0 = { x: currentX, y: currentY };
          const p1 = { x: x1, y: y1 };
          const p2 = { x: x2, y: y2 };
          const p3 = { x: x3, y: y3 };
          
          // Add interpolated points
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            
            // Cubic bezier formula
            const cx = (1-t)**3 * p0.x + 3 * (1-t)**2 * t * p1.x + 3 * (1-t) * t**2 * p2.x + t**3 * p3.x;
            const cy = (1-t)**3 * p0.y + 3 * (1-t)**2 * t * p1.y + 3 * (1-t) * t**2 * p2.y + t**3 * p3.y;
            
            points.push({ x: cx, y: cy, z: -depth });
          }
          
          // Update current position to the end of the curve
          currentX = x3;
          currentY = y3;
          break;
          
        case 'S': // Smooth Cubic Bezier
          ensurePenDown();
          
          // Reflect previous control point if it exists
          let sx1, sy1;
          if (lastCommand === 'C' || lastCommand === 'S') {
            const prevSegment = segments[index - 1];
            const prevParams = prevSegment.params;
            const prevX = prevParams[prevParams.length - 4];
            const prevY = prevParams[prevParams.length - 3];
            const prevEndX = prevParams[prevParams.length - 2];
            const prevEndY = prevParams[prevParams.length - 1];
            
            // Reflect control point
            sx1 = 2 * prevEndX - prevX;
            sy1 = 2 * prevEndY - prevY;
          } else {
            // If no previous control point, use current point
            sx1 = currentX;
            sy1 = currentY;
          }
          
          // Rest of control points from params
          const [sx2, sy2, sx3, sy3] = params;
          
          // Control points for the bezier
          const s0 = { x: currentX, y: currentY };
          const s1 = { x: sx1, y: sy1 };
          const s2 = { x: sx2, y: sy2 };
          const s3 = { x: sx3, y: sy3 };
          
          // Add interpolated points
          for (let i = 1; i <= 10; i++) {
            const t = i / 10;
            
            // Cubic bezier formula
            const cx = (1-t)**3 * s0.x + 3 * (1-t)**2 * t * s1.x + 3 * (1-t) * t**2 * s2.x + t**3 * s3.x;
            const cy = (1-t)**3 * s0.y + 3 * (1-t)**2 * t * s1.y + 3 * (1-t) * t**2 * s2.y + t**3 * s3.y;
            
            points.push({ x: cx, y: cy, z: -depth });
          }
          
          // Update current position to the end of the curve
          currentX = sx3;
          currentY = sy3;
          break;
          
        case 'Q': // Quadratic Bezier
          ensurePenDown();
          
          // For quadratic bezier curves
          const [qx1, qy1, qx2, qy2] = params;
          
          // Control points for the bezier
          const q0 = { x: currentX, y: currentY };
          const q1 = { x: qx1, y: qy1 };
          const q2 = { x: qx2, y: qy2 };
          
          // Add interpolated points
          for (let i = 1; i <= 8; i++) {
            const t = i / 8;
            
            // Quadratic bezier formula
            const cx = (1-t)**2 * q0.x + 2 * (1-t) * t * q1.x + t**2 * q2.x;
            const cy = (1-t)**2 * q0.y + 2 * (1-t) * t * q1.y + t**2 * q2.y;
            
            points.push({ x: cx, y: cy, z: -depth });
          }
          
          // Update current position to the end of the curve
          currentX = qx2;
          currentY = qy2;
          break;
        
        // Add other curve handlers as needed...
        
        default:
          console.log(`Unhandled path command: ${command}`);
          break;
      }
      
      lastCommand = command;
    });
    
    // Add final retract if needed
    ensurePenUp();
    
    return points;
  }

  /**
   * Convert toolpath to GCode commands
   * @param {Object} toolpath - Toolpath data
   * @param {Object} config - Configuration options
   * @returns {string} - GCode commands
   */
  toolpathToGCode(toolpath, config) {
    const { points } = toolpath;
    
    // Get feed rates from config, with fallbacks if not available
    const feedRate = config.machine?.feedRates?.default || config.toolSettings.feedRate || 1000;
    const plungeRate = config.machine?.feedRates?.plunge || config.toolSettings.plungeRate || 500;
    const rapidRate = config.machine?.feedRates?.rapid || config.toolSettings.rapidRate || 3000;
    
    let gcode = '';
    
    // Move to starting position (rapid move)
    if (points.length > 0) {
      const startPoint = points[0];
      gcode += `G0 X${startPoint.x.toFixed(3)} Y${startPoint.y.toFixed(3)}\n`;
      gcode += `G0 Z5.000\n`; // Safe height before plunge
      gcode += `G1 Z${startPoint.z.toFixed(3)} F${plungeRate}\n`; // Plunge to start depth
    }
    
    // Process each point in the toolpath
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      gcode += `G1 X${point.x.toFixed(3)} Y${point.y.toFixed(3)} Z${point.z.toFixed(3)} F${feedRate}\n`;
    }
    
    // Retract to safe height
    gcode += `G0 Z5.000\n`;
    
    return gcode;
  }

  /**
   * Generate SVG visualization for processed data
   * @param {Object} processedData - Processed SVG data
   * @param {string} svgData - Original SVG data
   * @param {Object} config - Configuration options
   * @returns {string} - SVG visualization
   */
  getSVGVisualization(processedData, svgData, config) {
    // This would generate an SVG visualization of the processed data
    // Simplified placeholder
    return svgData; // Just return original SVG for now
  }

  /**
   * Generate a SVG visualization of the toolpath
   * @param {Object} toolpathData - Toolpath data
   * @param {Object} config - Configuration
   * @returns {string} SVG visualization
   */
  getToolpathVisualization(toolpathData, config) {
    console.log("Generating toolpath visualization...");
    console.log(`Generating toolpath visualization with ${toolpathData.toolpaths.length} toolpaths`);
    
    const { toolpaths } = toolpathData;
    
    // Calculate overall bounds
    const bounds = this._getToolpathBounds(toolpaths);
    
    // Add some padding
    const padding = 10;
    const viewBoxWidth = bounds.maxX - bounds.minX + padding * 2;
    const viewBoxHeight = bounds.maxY - bounds.minY + padding * 2;
    const viewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${viewBoxWidth} ${viewBoxHeight}`;
    
    // Create SVG header with styling
    let svg = `<svg 
      width="100%" 
      height="100%" 
      viewBox="${viewBox}"
      xmlns="http://www.w3.org/2000/svg">
      <style>
        .toolpath { fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .depth-indicator { font-size: 8px; fill: black; }
        .origin { stroke: red; stroke-width: 1; }
      </style>`;
    
    // Add depth legend
    svg += this._generateDepthLegend(config);
    
    // Add each toolpath
    toolpaths.forEach(toolpath => {
      if (!toolpath || !toolpath.points || toolpath.points.length < 2) return;
      
      try {
        // Generate SVG path from the toolpath
        const path = this._toolpathToSVGPath(toolpath);
        
        // Get color based on depth
        const color = this._getColorForDepth(toolpath.depth, config);
        
        // Get stroke width based on depth
        const strokeWidth = this._getStrokeWidthForDepth(toolpath.depth, config);
        
        // Add the path to the SVG
        svg += `<path d="${path}" class="toolpath" stroke="${color}" stroke-width="${strokeWidth}" />`;
        
        // Add depth indicator near the start of the path
        if (toolpath.points.length > 0) {
          const p = toolpath.points[1]; // Use second point to avoid Z=0 points
          svg += `<text x="${p.x + 5}" y="${p.y - 5}" class="depth-indicator">${toolpath.depth.toFixed(3)}mm</text>`;
        }
      } catch (err) {
        console.error("Error generating toolpath visualization:", err);
      }
    });
    
    // Add origin indicator
    svg += `
      <g class="origin">
        <line x1="-10" y1="0" x2="10" y2="0" />
        <line x1="0" y1="-10" x2="0" y2="10" />
        <circle cx="0" cy="0" r="2" fill="red" />
      </g>
    </svg>`;
    
    return svg;
  }
  
  /**
   * Calculate the bounds of toolpaths
   * @param {Array} toolpaths - Array of toolpaths
   * @returns {Object} Bounds object with minX, minY, maxX, maxY, width, height
   */
  _getToolpathBounds(toolpaths) {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;
    
    // Calculate bounds from all toolpath points
    toolpaths.forEach(toolpath => {
      if (toolpath.points && toolpath.points.length > 0) {
        toolpath.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      }
    });
    
    // Handle case where no points were found
    if (minX === Number.MAX_VALUE) {
      minX = 0;
      minY = 0;
      maxX = 100;
      maxY = 100;
    }
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  /**
   * Calculate stroke width based on depth
   * @param {number} depth - Cutting depth
   * @param {Object} config - Configuration
   * @returns {number} Stroke width
   */
  _getStrokeWidthForDepth(depth, config) {
    // Get depth range from config
    const minDepth = config.grayscaleMapping?.minDepth || 0.5;
    const maxDepth = config.grayscaleMapping?.maxDepth || 5;
    
    // Calculate normalized depth value (0-1)
    const normalizedDepth = Math.min(1, Math.max(0, 
      (depth - minDepth) / (maxDepth - minDepth)
    ));
    
    // Map to stroke width range (1-3)
    return 1 + normalizedDepth * 2;
  }
  
  /**
   * Get color for depth
   * @param {number} depth - Cutting depth
   * @param {Object} config - Configuration
   * @returns {string} Color in rgb format
   */
  _getColorForDepth(depth, config) {
    // Get depth range from config
    const minDepth = config.grayscaleMapping?.minDepth || 0.5;
    const maxDepth = config.grayscaleMapping?.maxDepth || 5;
    
    // Calculate normalized depth value (0-1)
    const normalizedDepth = Math.min(1, Math.max(0, 
      (depth - minDepth) / (maxDepth - minDepth)
    ));
    
    // Blue gradient: light blue to dark blue
    const blue = 255;
    const green = Math.floor(255 * (1 - normalizedDepth));
    const red = 0;
    
    return `rgb(${red}, ${green}, ${blue})`;
  }
  
  /**
   * Convert toolpath to SVG path data
   * @param {Object} toolpath - Toolpath
   * @returns {string} SVG path data
   */
  _toolpathToSVGPath(toolpath) {
    if (!toolpath.points || toolpath.points.length === 0) {
      return '';
    }
    
    // Filter out Z=0 points (entry and exit moves) and just use the cutting path points
    const cuttingPoints = toolpath.points.filter(p => p.z !== 0);
    
    if (cuttingPoints.length === 0) {
      return '';
    }
    
    // For line elements, we need to handle them differently
    if (toolpath.type === 'line') {
      const first = cuttingPoints[0];
      const last = cuttingPoints[cuttingPoints.length - 1];
      return `M${first.x},${first.y} L${last.x},${last.y}`;
    }
    
    // For circle elements or other closed paths, check if it's a complete circle
    if (toolpath.originalType === 'circle' || 
        (toolpath.originalPath && 
         (toolpath.originalPath.includes('A') || toolpath.originalPath.includes('a')))) {
      
      // Get a clean set of points by removing duplicates
      const points = [];
      let lastX = null, lastY = null;
      
      for (const p of cuttingPoints) {
        if (lastX === null || lastY === null || 
            Math.abs(p.x - lastX) > 0.01 || 
            Math.abs(p.y - lastY) > 0.01) {
          points.push(p);
          lastX = p.x;
          lastY = p.y;
        }
      }
      
      if (points.length === 0) return '';
      
      // Start at the first point
      let pathData = `M${points[0].x},${points[0].y}`;
      
      // Add line segments for the remaining points
      for (let i = 1; i < points.length; i++) {
        pathData += ` L${points[i].x},${points[i].y}`;
      }
      
      // If it's a circle, close the path
      if (Math.abs(points[0].x - points[points.length - 1].x) < 0.01 &&
          Math.abs(points[0].y - points[points.length - 1].y) < 0.01) {
        // Already closes back to starting point
      } else {
        // Close the path
        pathData += ` Z`;
      }
      
      return pathData;
    }
    
    // For path and other elements
    let pathData = '';
    
    // Start at the first point
    pathData = `M${cuttingPoints[0].x},${cuttingPoints[0].y}`;
    
    // Add line segments for the remaining points
    for (let i = 1; i < cuttingPoints.length; i++) {
      pathData += ` L${cuttingPoints[i].x},${cuttingPoints[i].y}`;
    }
    
    return pathData;
  }
  
  /**
   * Generate depth legend for visualization
   * @param {Object} config - Configuration
   * @returns {string} SVG for depth legend
   */
  _generateDepthLegend(config) {
    // Get depth range from config
    const minDepth = config.grayscaleMapping?.minDepth || 0.5;
    const maxDepth = config.grayscaleMapping?.maxDepth || 5;
    
    // Number of color bands in legend
    const colorBands = 5;
    const bandWidth = 20;
    
    let legend = `<g transform="translate(10, 10)">
        <rect x="0" y="0" width="${bandWidth * colorBands}" height="15" fill="none" stroke="black" stroke-width="1" />`;
    
    // Add color bands
    for (let i = 0; i < colorBands; i++) {
      const depth = minDepth + (i / (colorBands - 1)) * (maxDepth - minDepth);
      const color = this._getColorForDepth(depth, config);
      legend += `<rect x="${i * bandWidth}" y="0" width="${bandWidth}" height="15" fill="${color}" />`;
    }
    
    // Add labels
    legend += `
      <text x="0" y="25" font-size="8">${minDepth}mm</text>
      <text x="${bandWidth * colorBands}" y="25" text-anchor="end" font-size="8">${maxDepth}mm</text>
      <text x="${bandWidth * colorBands / 2}" y="25" text-anchor="middle" font-size="8">Depth</text>
    </g>`;
    
    return legend;
  }

  /**
   * Generate GCode visualization
   * @param {string} gcode - GCode data
   * @param {Object} toolpathData - Toolpath data
   * @param {Object} config - Configuration options
   * @returns {string} - SVG visualization of GCode
   */
  getGCodeVisualization(gcode, toolpathData, config) {
    console.log("Generating GCode 3D visualization...");
    
    try {
      // If gcode is a string, parse it to extract commands
      let gcodeLines = [];
      if (typeof gcode === 'string') {
        gcodeLines = gcode.split('\n');
      } else if (gcode && gcode.commands) {
        // For backward compatibility - if it's still the old object format
        gcodeLines = [
          ...(gcode.header || []), 
          ...(gcode.commands || []), 
          ...(gcode.footer || [])
        ];
      } else {
        console.error("Invalid gcode format for visualization");
        return "<svg width='300' height='200'><text x='10' y='100' fill='red'>Invalid GCode format</text></svg>";
      }
      
      // Validate that we have GCode commands
      if (!gcodeLines || gcodeLines.length === 0) {
        console.error("No GCode commands to visualize");
        return "<svg width='300' height='200'><text x='10' y='100' fill='red'>No GCode commands to visualize</text></svg>";
      }
      
      // Ensure each command is a string
      gcodeLines = gcodeLines.map(cmd => String(cmd || ''));
      
      // Use the GCodeVisualizer to create a 3D visualization
      try {
        // Create GCode visualizer instance
        const GCodeVisualizer = require('./visualization/gcode-visualizer');
        const visualizer = new GCodeVisualizer(config || {
          grayscaleMapping: { minDepth: 0.5, maxDepth: 5 }
        });
        
        // Create visualization data object with necessary fields
        const gcodeData = {
          commands: gcodeLines,
          metadata: {
            minDepth: config && config.grayscaleMapping ? config.grayscaleMapping.minDepth : 0.5,
            maxDepth: config && config.grayscaleMapping ? config.grayscaleMapping.maxDepth : 5
          },
          estimatedTime: this._calculateEstimatedTime(toolpathData, config)
        };
        
        // Generate the visualization
        return visualizer.generateGCodePreview(gcodeData, toolpathData);
      } catch (error) {
        console.error("Error generating 3D GCode visualization:", error);
        return `<svg width='300' height='200'>
          <text x='10' y='100' fill='red'>Error generating 3D visualization: ${error.message}</text>
        </svg>`;
      }
    } catch (error) {
      console.error("Error preparing data for GCode visualization:", error);
      return `<svg width='300' height='200'>
        <text x='10' y='100' fill='red'>Error preparing data: ${error.message}</text>
      </svg>`;
    }
  }

  /**
   * Generate GCode header with metadata
   * @private
   * @param {Object} config - Configuration options
   * @param {Object} metadata - Metadata about the job
   * @returns {Array} - Array of header lines
   */
  _generateGCodeHeader(config, metadata) {
    const header = [];
    
    // Add job information
    header.push('; SVG to GCode - Generated GCode');
    header.push('; Conversion Date: ' + new Date().toISOString());
    header.push(';');
    header.push('; Settings:');
    header.push('; - Min Depth: ' + metadata.minDepth + 'mm');
    header.push('; - Max Depth: ' + metadata.maxDepth + 'mm');
    header.push('; - Feed Rate: ' + (config.machine?.feedRates?.default || 1000) + 'mm/min');
    header.push('; - Plunge Rate: ' + (config.machine?.feedRates?.plunge || 500) + 'mm/min');
    header.push(';');
    
    // Add user defined start GCode from config
    if (config.gcodeSettings?.startGcode) {
      const startGcodeLines = config.gcodeSettings.startGcode.split('\n');
      header.push('; User-defined start GCode:');
      header.push(...startGcodeLines);
    } else {
      // Default initialization
      header.push('G90 ; Absolute positioning');
      header.push('G21 ; Millimeters');
      header.push('G0 Z5 ; Move to safe height');
      header.push('M3 S12000 ; Start spindle');
    }
    
    return header;
  }
  
  /**
   * Format GCode commands as an array of strings
   * @private
   * @param {string} gcode - Raw GCode string
   * @returns {Array} - Array of command lines
   */
  _formatGCodeCommands(gcode) {
    // Split by newlines and filter empty lines
    return gcode.split('\n').filter(line => line.trim() !== '');
  }
  
  /**
   * Generate GCode footer
   * @private
   * @param {Object} config - Configuration options
   * @returns {Array} - Array of footer lines
   */
  _generateGCodeFooter(config) {
    const footer = [];
    
    // Add user defined end GCode from config
    if (config.gcodeSettings?.endGcode) {
      const endGcodeLines = config.gcodeSettings.endGcode.split('\n');
      footer.push('; User-defined end GCode:');
      footer.push(...endGcodeLines);
    } else {
      // Default end commands
      footer.push('G0 Z10 ; Retract to safe height');
      footer.push('M5 ; Stop spindle');
      footer.push('M2 ; End program');
    }
    
    return footer;
  }
  
  /**
   * Calculate estimated machining time
   * @private
   * @param {Object} toolpathData - Toolpath data object
   * @param {Object} config - Configuration options
   * @returns {number} - Estimated time in seconds
   */
  _calculateEstimatedTime(toolpathData, config) {
    // This is a very rough estimate
    const { toolpaths } = toolpathData;
    const feedRate = config.machine?.feedRates?.default || config.toolSettings?.feedRate || 1000;
    const plungeRate = config.machine?.feedRates?.plunge || config.toolSettings?.plungeRate || 500;
    const rapidRate = config.machine?.feedRates?.rapid || config.toolSettings?.rapidRate || 3000;
    
    let totalDistance = 0;
    let totalPlungeDistance = 0;
    let rapidMoves = 0;
    
    // Sum up distances in all toolpaths
    toolpaths.forEach(toolpath => {
      const { points } = toolpath;
      
      if (points && points.length > 1) {
        for (let i = 1; i < points.length; i++) {
          const dx = points[i].x - points[i-1].x;
          const dy = points[i].y - points[i-1].y;
          const dz = Math.abs(points[i].z - points[i-1].z);
          
          const moveDistance = Math.sqrt(dx*dx + dy*dy);
          totalDistance += moveDistance;
          
          if (dz > 0) {
            totalPlungeDistance += dz;
          }
        }
        
        // Each toolpath has at least one rapid positioning move
        rapidMoves += 1;
      }
    });
    
    // Calculate times based on feed rates (mm/min -> seconds)
    const feedTime = (totalDistance / feedRate) * 60;
    const plungeTime = (totalPlungeDistance / plungeRate) * 60;
    const rapidTime = (rapidMoves * 5 / rapidRate) * 60; // Assume average 5mm per rapid move
    
    // Sum all times and add 10% for acceleration/deceleration
    return (feedTime + plungeTime + rapidTime) * 1.1;
  }
}

module.exports = SVGProcessor;