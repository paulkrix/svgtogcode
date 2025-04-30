# SVG to GCode Converter - Technical Specification

## Overview

This document details the technical specifications for the SVG to GCode converter application, focusing on API definitions, data models, and key algorithms. The specification serves as a blueprint for implementation, ensuring consistency across the codebase.

## Data Models

### 1. SVG Input Model

```typescript
interface SVGInput {
  rawData: string;                  // Raw SVG file content as string
  width: number;                    // Width of the SVG viewBox in pixels/units
  height: number;                   // Height of the SVG viewBox in pixels/units
  viewBox: {                        // SVG viewBox attributes
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
  filename: string;                 // Original filename for reference
}
```

### 2. Vector Path Models

```typescript
// Path representation after SVG parsing
interface VectorPath {
  id: string;                       // Path identifier
  type: PathType;                   // Line, curve, rect, circle, etc.
  points: Point[];                  // Array of key points
  closed: boolean;                  // Whether path is closed
  commands: PathCommand[];          // SVG path commands
  style: PathStyle;                 // Path style properties
  transform: Transform[];           // Applied transformations
}

// Path style properties including grayscale information
interface PathStyle {
  fill: string | null;              // Fill color/pattern
  fillOpacity: number;              // Fill opacity (0-1)
  stroke: string | null;            // Stroke color
  strokeWidth: number;              // Stroke width
  strokeOpacity: number;            // Stroke opacity (0-1)
  grayscaleValue: number;           // Computed grayscale value (0-255)
}

// Point in 2D space
interface Point {
  x: number;
  y: number;
}

// Path command types
enum PathType {
  LINE = 'line',
  CURVE = 'curve',
  ARC = 'arc',
  RECT = 'rect',
  CIRCLE = 'circle',
  ELLIPSE = 'ellipse',
  POLYGON = 'polygon',
  PATH = 'path'
}

// SVG path commands
interface PathCommand {
  command: string;                  // SVG command (M, L, C, etc.)
  parameters: number[];             // Command parameters
  absolute: boolean;                // Whether command uses absolute coordinates
}

// Transformation matrix
interface Transform {
  type: TransformType;              // Transform type
  values: number[];                 // Transform values
}

enum TransformType {
  TRANSLATE = 'translate',
  SCALE = 'scale',
  ROTATE = 'rotate',
  SKEW = 'skew',
  MATRIX = 'matrix'
}
```

### 3. Processed Path Models

```typescript
// Path with depth information derived from grayscale
interface ProcessedPath {
  id: string;                       // Path identifier
  segments: PathSegment[];          // Simplified path segments
  depth: number;                    // Computed cutting depth (based on grayscale)
  originalPath: VectorPath;         // Reference to original vector path
  optimized: boolean;               // Whether path has been optimized
}

// Simplified path segment for machining
interface PathSegment {
  type: SegmentType;                // Segment type
  startPoint: Point3D;              // Start point (including Z depth)
  endPoint: Point3D;                // End point (including Z depth)
  controlPoints?: Point3D[];        // Control points for curves
}

// 3D point with depth
interface Point3D extends Point {
  z: number;                        // Z-axis depth value
}

enum SegmentType {
  LINE = 'line',
  ARC = 'arc',
  CURVE = 'curve'
}
```

### 4. Toolpath Model

```typescript
// Complete toolpath for machining
interface Toolpath {
  id: string;                       // Toolpath identifier
  movements: ToolMovement[];        // Sequence of tool movements
  estimatedTime: number;            // Estimated machining time (seconds)
  totalDistance: number;            // Total movement distance (mm)
  safeHeight: number;               // Safe travel height (mm)
  originOffset: Point;              // Origin offset (mm)
}

// Individual tool movement
interface ToolMovement {
  type: MovementType;               // Type of movement
  startPoint: Point3D;              // Start point
  endPoint: Point3D;                // End point
  feedRate: number;                 // Feed rate (mm/min)
  isRapid: boolean;                 // Whether movement is rapid
}

enum MovementType {
  LINEAR = 'linear',                // Linear movement
  RAPID = 'rapid',                  // Rapid positioning
  ARC_CW = 'arc_cw',                // Clockwise arc
  ARC_CCW = 'arc_ccw'               // Counter-clockwise arc
}
```

### 5. GCode Output Model

```typescript
// Final GCode output
interface GCodeOutput {
  commands: string[];               // Array of GCode commands
  header: string[];                 // Header comments/setup commands
  footer: string[];                 // Footer/cleanup commands
  estimatedTime: number;            // Estimated machining time
  metadata: GCodeMetadata;          // Additional metadata
}

// GCode metadata
interface GCodeMetadata {
  originalFile: string;             // Original SVG filename
  creationDate: string;             // Creation timestamp
  workpieceSize: {                  // Workpiece dimensions
    width: number;
    height: number;
    depth: number;
  };
  toolDiameter: number;             // Tool diameter (mm)
  maxDepth: number;                 // Maximum cutting depth (mm)
  minDepth: number;                 // Minimum cutting depth (mm)
}
```

### 6. Configuration Model

```typescript
// User configuration
interface Configuration {
  machine: MachineConfig;           // Machine configuration
  tool: ToolConfig;                 // Tool configuration
  grayscaleMapping: GrayscaleConfig; // Grayscale mapping configuration
  output: OutputConfig;             // Output configuration
}

// Machine configuration
interface MachineConfig {
  type: string;                     // Machine type
  workArea: {                       // Work area dimensions
    width: number;                  // Width (mm)
    height: number;                 // Height (mm)
    depth: number;                  // Depth (mm)
  };
  feedRates: {                      // Feed rates
    default: number;                // Default feed rate (mm/min)
    rapid: number;                  // Rapid feed rate (mm/min)
    plunge: number;                 // Plunge feed rate (mm/min)
  };
  safeHeight: number;               // Safe travel height (mm)
  homingPosition: Point3D;          // Homing position
}

// Tool configuration
interface ToolConfig {
  diameter: number;                 // Tool diameter (mm)
  type: string;                     // Tool type
  freeLength: number;               // Tool free length (mm)
}

// Grayscale to depth mapping configuration
interface GrayscaleConfig {
  type: MappingType;                // Mapping type (linear, custom)
  maxDepth: number;                 // Maximum cutting depth (mm)
  minDepth: number;                 // Minimum cutting depth (mm)
  invert: boolean;                  // Whether to invert depth mapping
  customMapping?: {                 // Custom mapping points
    grayscale: number;              // Grayscale value (0-255)
    depth: number;                  // Corresponding depth (mm)
  }[];
}

enum MappingType {
  LINEAR = 'linear',                // Linear mapping
  CUSTOM = 'custom'                 // Custom curve mapping
}

// Output configuration
interface OutputConfig {
  includeHeader: boolean;           // Include header comments
  includeFooter: boolean;           // Include footer comments
  gcodeFlavor: GCodeFlavor;         // GCode flavor/dialect
  fileExtension: string;            // Output file extension
  precision: number;                // Decimal precision
}

enum GCodeFlavor {
  GRBL = 'grbl',                    // GRBL dialect
  MARLIN = 'marlin',                // Marlin dialect
  REPRAP = 'reprap'                 // RepRap dialect
}
```

## API Specifications

### 1. Input Handler API

```typescript
/**
 * Handles SVG file loading and validation
 */
interface InputHandlerAPI {
  /**
   * Load an SVG file from the file system
   * @param filePath Path to the SVG file
   * @returns Parsed SVG input model
   * @throws Error if file cannot be loaded or is invalid
   */
  loadSVGFile(filePath: string): Promise<SVGInput>;
  
  /**
   * Validate an SVG file for compatibility
   * @param svgInput SVG input model to validate
   * @returns Validation result with any warnings/errors
   */
  validateSVG(svgInput: SVGInput): ValidationResult;
  
  /**
   * Save generated GCode to file
   * @param gcode GCode output model
   * @param filePath Target file path
   * @returns Success flag
   */
  saveGCodeFile(gcode: GCodeOutput, filePath: string): Promise<boolean>;
  
  /**
   * Load configuration from file
   * @param filePath Configuration file path
   * @returns Configuration model
   */
  loadConfiguration(filePath: string): Promise<Configuration>;
  
  /**
   * Save configuration to file
   * @param config Configuration to save
   * @param filePath Target file path
   * @returns Success flag
   */
  saveConfiguration(config: Configuration, filePath: string): Promise<boolean>;
}

interface ValidationResult {
  valid: boolean;                   // Whether SVG is valid
  warnings: string[];               // Warning messages
  errors: string[];                 // Error messages
}
```

### 2. SVG Parser API

```typescript
/**
 * Handles parsing SVG content into path data
 */
interface SVGParserAPI {
  /**
   * Parse SVG content into vector paths
   * @param svgInput SVG input model
   * @returns Array of parsed vector paths
   */
  parseSVG(svgInput: SVGInput): VectorPath[];
  
  /**
   * Extract style information from SVG elements
   * @param svgInput SVG input model
   * @returns Mapping of element IDs to styles
   */
  extractStyles(svgInput: SVGInput): Map<string, PathStyle>;
  
  /**
   * Convert SVG transforms to transformation matrices
   * @param transform SVG transform string
   * @returns Array of transformation objects
   */
  parseTransforms(transform: string): Transform[];
  
  /**
   * Normalize SVG coordinates to workspace coordinates
   * @param paths Vector paths with SVG coordinates
   * @param viewBox SVG viewBox information
   * @returns Vector paths with normalized coordinates
   */
  normalizeCoordinates(paths: VectorPath[], viewBox: SVGInput['viewBox']): VectorPath[];
}
```

### 3. Path Processor API

```typescript
/**
 * Handles processing vector paths into machine-ready paths with depth
 */
interface PathProcessorAPI {
  /**
   * Process vector paths into machine-ready paths with depth information
   * @param paths Vector paths from SVG parser
   * @param config Grayscale mapping configuration
   * @returns Processed paths with depth information
   */
  processPaths(paths: VectorPath[], config: GrayscaleConfig): ProcessedPath[];
  
  /**
   * Map grayscale values to depth values
   * @param grayscale Grayscale value (0-255)
   * @param config Grayscale mapping configuration
   * @returns Depth value (mm)
   */
  mapGrayscaleToDepth(grayscale: number, config: GrayscaleConfig): number;
  
  /**
   * Simplify complex paths into segments
   * @param path Vector path to simplify
   * @returns Array of simplified path segments
   */
  simplifyPath(path: VectorPath): PathSegment[];
  
  /**
   * Optimize paths for machining efficiency
   * @param paths Processed paths
   * @returns Optimized paths
   */
  optimizePaths(paths: ProcessedPath[]): ProcessedPath[];
}
```

### 4. Toolpath Generator API

```typescript
/**
 * Handles generating toolpaths from processed paths
 */
interface ToolpathGeneratorAPI {
  /**
   * Generate toolpaths from processed paths
   * @param paths Processed paths with depth information
   * @param config Machine and tool configuration
   * @returns Complete toolpath for machining
   */
  generateToolpath(paths: ProcessedPath[], config: Configuration): Toolpath;
  
  /**
   * Calculate feed rates for different operations
   * @param movement Movement type
   * @param config Machine configuration
   * @returns Appropriate feed rate (mm/min)
   */
  calculateFeedRate(movement: MovementType, config: MachineConfig): number;
  
  /**
   * Generate safe travel moves between paths
   * @param from End point of previous path
   * @param to Start point of next path
   * @param safeHeight Safe travel height
   * @returns Array of tool movements for safe travel
   */
  generateSafeTravel(from: Point3D, to: Point3D, safeHeight: number): ToolMovement[];
  
  /**
   * Calculate estimated machining time
   * @param toolpath Complete toolpath
   * @returns Estimated time in seconds
   */
  calculateMachiningTime(toolpath: Toolpath): number;
}
```

### 5. GCode Generator API

```typescript
/**
 * Handles generating GCode from toolpaths
 */
interface GCodeGeneratorAPI {
  /**
   * Generate GCode from toolpath
   * @param toolpath Toolpath to convert
   * @param config Output configuration
   * @returns GCode output model
   */
  generateGCode(toolpath: Toolpath, config: OutputConfig): GCodeOutput;
  
  /**
   * Format a specific movement as GCode
   * @param movement Tool movement to format
   * @param config Output configuration
   * @returns Formatted GCode command
   */
  formatMovement(movement: ToolMovement, config: OutputConfig): string;
  
  /**
   * Generate GCode header with setup commands
   * @param config Machine configuration
   * @param metadata Metadata for the job
   * @returns Array of header GCode commands
   */
  generateHeader(config: MachineConfig, metadata: GCodeMetadata): string[];
  
  /**
   * Generate GCode footer with cleanup commands
   * @param config Machine configuration
   * @returns Array of footer GCode commands
   */
  generateFooter(config: MachineConfig): string[];
}
```

### 6. Visualization API

```typescript
/**
 * Handles visualization of SVG and toolpaths
 */
interface VisualizationAPI {
  /**
   * Render SVG preview
   * @param svg SVG input model
   * @param canvas Target canvas element
   * @returns Success flag
   */
  renderSVG(svg: SVGInput, canvas: HTMLCanvasElement): boolean;
  
  /**
   * Render toolpath preview
   * @param toolpath Toolpath to visualize
   * @param canvas Target canvas element
   * @returns Success flag
   */
  renderToolpath(toolpath: Toolpath, canvas: HTMLCanvasElement): boolean;
  
  /**
   * Render depth map based on grayscale values
   * @param paths Processed paths with depth information
   * @param canvas Target canvas element
   * @param config Grayscale configuration for color mapping
   * @returns Success flag
   */
  renderDepthMap(paths: ProcessedPath[], canvas: HTMLCanvasElement, config: GrayscaleConfig): boolean;
  
  /**
   * Simulate toolpath execution
   * @param toolpath Toolpath to simulate
   * @param canvas Target canvas element
   * @param speed Simulation speed factor
   * @returns Simulation controller
   */
  simulateToolpath(toolpath: Toolpath, canvas: HTMLCanvasElement, speed: number): SimulationController;
}

interface SimulationController {
  play(): void;                     // Start/resume simulation
  pause(): void;                    // Pause simulation
  stop(): void;                     // Stop and reset simulation
  setSpeed(speed: number): void;    // Adjust simulation speed
  getCurrentProgress(): number;     // Get current progress (0-1)
}
```

## Algorithm Specifications

### 1. Grayscale to Depth Mapping Algorithm

The grayscale to depth mapping algorithm converts grayscale values (0-255) to physical depth values (in mm) for CNC machining.

#### Linear Mapping

For linear mapping, the algorithm uses the following formula:

```
depth = minDepth + (maxDepth - minDepth) * normalizedGrayscaleValue
```

Where:
- `depth` is the resulting depth value in mm
- `minDepth` is the minimum cutting depth (closest to material surface)
- `maxDepth` is the maximum cutting depth (deepest cut)
- `normalizedGrayscaleValue` is the grayscale value normalized to 0-1 range

If `invert` is `true`, the formula becomes:

```
depth = minDepth + (maxDepth - minDepth) * (1 - normalizedGrayscaleValue)
```

#### Custom Curve Mapping

For custom curve mapping, the algorithm uses interpolation between defined points:

1. Sort custom mapping points by grayscale value
2. For a given grayscale value, find the two nearest mapping points
3. Perform linear interpolation between their depth values

The formula for linear interpolation:

```
depth = depth1 + (depth2 - depth1) * ((grayscale - grayscale1) / (grayscale2 - grayscale1))
```

Where:
- `depth1` and `depth2` are the depths at the two nearest mapping points
- `grayscale1` and `grayscale2` are the grayscale values at the two nearest mapping points

### 2. Path Optimization Algorithm

The path optimization algorithm reorders paths to minimize non-cutting travel distance and time.

#### Algorithm Steps:

1. Identify all distinct paths requiring machining
2. Start from the machine origin (or a designated start point)
3. For each step, select the path with the nearest starting point to the current position
4. Calculate the optimal entry point for each path based on current position
5. Update current position to the exit point of the selected path
6. Repeat until all paths are processed

The nearest path selection uses Euclidean distance:

```
distance = sqrt((x2 - x1)² + (y2 - y1)²)
```

#### Optimization Constraints:

- Maintain contiguous paths when they share endpoints
- Consider safe height travel when changing between paths with different depths
- Avoid unnecessary tool retraction when staying at the same depth

### 3. SVG Path Simplification Algorithm

The path simplification algorithm converts complex SVG paths into simplified segments suitable for machining.

#### Algorithm Steps:

1. Parse SVG path commands (M, L, C, A, etc.)
2. Convert commands to canonical form (convert relative to absolute coordinates)
3. Approximate curves with line segments based on a tolerance threshold
4. Merge collinear line segments
5. Remove redundant points (points along the same line with tolerance)

For Bézier curve approximation, the algorithm uses recursive subdivision with a flatness test:

```
flatness = max(|P1 - Q1| + |P2 - Q2|)
```

Where:
- `P1` and `P2` are control points
- `Q1` and `Q2` are points on the polygon approximation

Subdivide the curve if flatness exceeds the tolerance threshold.

### 4. Toolpath Generation Algorithm

The toolpath generation algorithm converts processed paths with depth information into actual tool movements with appropriate feed rates and safety considerations.

#### Algorithm Steps:

1. Sort paths by depth (typically from shallow to deep)
2. For each path:
   - Generate approach move from current position to path start point
   - Generate cutting moves along the path at the specified depth
   - Generate exit move from path end point
3. Insert safe travel moves between discontinuous paths
4. Apply feed rate calculations for different movement types

#### Safety Considerations:

- Ensure tool retraction to safe height between discontinuous paths
- Implement gradual plunge for initial depth entries
- Add additional clearance for rapid movements
- Include pause at depth transitions for spindle speed adjustment (if applicable)

### 5. GRBL-Specific GCode Generation

The GRBL-specific GCode generation algorithm converts abstract toolpath movements into GRBL-compatible GCode commands.

#### Common GRBL Commands:

- `G0`: Rapid positioning
- `G1`: Linear interpolation (cutting move)
- `G2`/`G3`: Circular interpolation (CW/CCW)
- `F`: Feed rate specification
- `S`: Spindle speed setting
- `M3`/`M5`: Spindle on/off
- `G90`/`G91`: Absolute/relative positioning

#### Formatting Rules:

1. Use absolute positioning (G90) by default
2. Include feed rate (F) only when it changes
3. Minimize redundant axis specifications
4. Round values to configured precision
5. Include comments for significant operations
6. Add safety commands in header and footer

#### Header Structure:

```gcode
; SVG to GCode - Filename: <original_file>
; Generated: <timestamp>
; Material: <width> x <height> x <depth>mm
G90 ; Absolute positioning
G21 ; Millimeters
M3 S<spindle_speed> ; Spindle on
G0 Z<safe_height> ; Move to safe height
G0 X0 Y0 ; Move to origin
```

#### Footer Structure:

```gcode
G0 Z<safe_height> ; Move to safe height
G0 X0 Y0 ; Return to origin
M5 ; Spindle off
M2 ; Program end
```

## Error Handling

### 1. Input Validation Errors

- Invalid SVG format
- Unsupported SVG features
- Missing required attributes
- File access errors

### 2. Processing Errors

- Path conversion failures
- Grayscale extraction issues
- Coordinate transformation errors
- Optimization failures

### 3. GCode Generation Errors

- Machine constraints violations
- Tool path conflicts
- Unsupported movement types
- Configuration inconsistencies

## File Format Specifications

### 1. Configuration File (JSON)

```json
{
  "machine": {
    "type": "custom_mill",
    "workArea": {
      "width": 300,
      "height": 200,
      "depth": 50
    },
    "feedRates": {
      "default": 800,
      "rapid": 1500,
      "plunge": 300
    },
    "safeHeight": 5,
    "homingPosition": {
      "x": 0,
      "y": 0,
      "z": 0
    }
  },
  "tool": {
    "diameter": 3.175,
    "type": "endmill",
    "freeLength": 20
  },
  "grayscaleMapping": {
    "type": "linear",
    "maxDepth": 5,
    "minDepth": 0.5,
    "invert": false
  },
  "output": {
    "includeHeader": true,
    "includeFooter": true,
    "gcodeFlavor": "grbl",
    "fileExtension": ".nc",
    "precision": 3
  }
}
```

### 2. Project File (JSON)

```json
{
  "version": "1.0.0",
  "sourceFile": "example.svg",
  "outputFile": "example.nc",
  "configuration": {
    // Configuration object as above
  },
  "metadata": {
    "creationDate": "2023-04-30T00:00:00Z",
    "lastModified": "2023-04-30T00:00:00Z",
    "notes": "Example project"
  },
  "customMappings": [
    {
      "grayscale": 0,
      "depth": 5
    },
    {
      "grayscale": 128,
      "depth": 2.5
    },
    {
      "grayscale": 255,
      "depth": 0.5
    }
  ]
}
```

## Appendix: GRBL Command Reference

This section provides a reference for the most commonly used GRBL commands in the generated GCode.

| Command | Description | Example | Notes |
|---------|-------------|---------|-------|
| G0 | Rapid positioning | G0 X10 Y20 Z5 | Used for non-cutting movements |
| G1 | Linear interpolation | G1 X10 Y20 Z-1 F800 | Used for cutting movements |
| G2 | Circular interpolation (CW) | G2 X10 Y10 I5 J0 F800 | Center specified with I,J |
| G3 | Circular interpolation (CCW) | G3 X10 Y10 I0 J5 F800 | Center specified with I,J |
| G90 | Absolute positioning | G90 | Coordinates relative to origin |
| G91 | Relative positioning | G91 | Coordinates relative to current position |
| G20 | Inch units | G20 | Not used in this application |
| G21 | Millimeter units | G21 | Default for this application |
| M3 | Spindle on (clockwise) | M3 S10000 | S parameter sets RPM |
| M5 | Spindle off | M5 | Used in footer |
| F | Feed rate | F800 | In mm/min |
| S | Spindle speed | S10000 | In RPM |
| M2 | Program end | M2 | Used in footer |
| G92 | Set position | G92 X0 Y0 Z0 | Reset work coordinates | 