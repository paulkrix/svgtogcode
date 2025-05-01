# SVG to GCode Converter - Developer Guide

## Architecture Overview

The SVG to GCode Converter is built with a modular architecture to allow for easy maintenance and extension. The application follows a data transformation pipeline pattern where SVG files go through several processing stages before being output as GCode.

### High-Level Components

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│             │    │             │    │             │    │             │
│  SVG Input  │──▶│  Processor  │──▶│  Toolpath   │──▶│    GCode    │
│             │    │             │    │  Generator  │    │  Generator  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Directory Structure

```
/svg-to-gcode-converter
├── src/                  # Source code
│   ├── parser/           # SVG parsing modules
│   ├── processor/        # SVG processing and transformation
│   ├── toolpath/         # Toolpath generation algorithms
│   ├── gcode/            # GCode generation and flavors
│   ├── models/           # Data models and types
│   ├── utils/            # Utility functions
│   ├── ui/               # User interface components
│   ├── visualization/    # Toolpath visualization
│   ├── input/            # Input handling (files, streams)
│   └── index.js          # Application entry point
├── tests/                # Test files
├── docs/                 # Documentation
├── examples/             # Example SVG files
├── output/               # Default output directory
└── debug_output/         # Debug files and visualizations
```

## Core Modules

### SVG Parser (`src/parser/svg-parser.js`)

Responsible for parsing SVG files and extracting path data. It handles different SVG element types (paths, rectangles, circles, etc.) and converts them into a unified internal representation.

```javascript
// Example usage:
const svgData = SVGParser.parse(svgString);
// For large files:
const svgData = await SVGParser.parseFile(filePath);
```

#### Key Methods:
- `parse(svgString)`: Parse SVG string content
- `parseFile(filePath)`: Parse SVG file with streaming for large files
- `_parseWithXml2js(svgString)`: Alternative parser for very large files

### Path Generator (`src/toolpath/path-generator.js`)

Converts SVG paths into toolpaths with 3D coordinates, incorporating depth based on grayscale values.

```javascript
// Example usage:
const pathGenerator = new PathGenerator(config);
const toolpaths = pathGenerator.generate(processedData, svgInput);
```

#### Key Features:
- Path optimization via reordering to minimize travel distance
- Path smoothing to reduce jerky movements
- Adaptive point decimation to reduce GCode file size
- Support for various SVG path commands and shape types

### GCode Generator (`src/gcode/gcode-generator.js`)

Creates machine-specific GCode from toolpaths.

```javascript
// Example usage:
const gcodeGenerator = new GCodeGenerator(config);
const gcode = gcodeGenerator.generate(toolpathData);
```

#### Key Features:
- Support for multiple GCode flavors (GRBL, Marlin, Mach3, etc.)
- Smart height transitions between toolpaths
- Collision avoidance
- Time and distance estimation

### GCode Flavors (`src/gcode/gcode-flavors.js`)

Defines syntax and commands for different machine controllers.

```javascript
// Available flavors:
const { 
  GRBL_FLAVOR,
  MARLIN_FLAVOR,
  MACH3_FLAVOR,
  FANUC_FLAVOR,
  LINUXCNC_FLAVOR
} = require('./gcode-flavors');
```

## Data Flow

1. SVG input is parsed into an internal representation
2. The processor applies grayscale-to-depth mapping
3. The path generator creates optimized toolpaths
4. The GCode generator outputs machine code

```javascript
// Example of the complete pipeline:
const svgString = fs.readFileSync(filePath, 'utf8');
const svgData = SVGParser.parse(svgString);
const processedData = Processor.process(svgData, config);
const toolpaths = pathGenerator.generate(processedData, svgData);
const gcode = gcodeGenerator.generate(toolpaths);
```

## Configuration System

The application uses a unified configuration object that defines all aspects of the conversion process. Configuration is modular with sensible defaults.

```javascript
// Example configuration:
const config = {
  grayscaleMapping: {
    minDepth: 0,
    maxDepth: 5,
    invert: false
  },
  machine: {
    workArea: { width: 300, height: 300 },
    feedRates: {
      default: 500,
      plunge: 100,
      rapid: 3000
    },
    safeHeight: 5,
    flavor: 'grbl',
    clearanceMoveMaxDistance: 50,
    clearanceMoveMaxDepthDiff: 5
  },
  tool: {
    diameter: 3.175,
    spindleSpeed: 1000
  },
  toolpath: {
    optimize: true,
    smoothingLevel: 0.2,
    resolution: 20,
    decimationTolerance: 0.05,
    circleSegments: 36,
    constantZ: false
  },
  output: {
    precision: 3,
    includeHeader: true,
    includeFooter: true
  }
};
```

## Adding New Features

### Adding a New GCode Flavor

1. Add a new flavor definition in `src/gcode/gcode-flavors.js`
2. Define syntax, commands, and feature support
3. Update the `_initializeFlavor()` method in GCodeGenerator

### Extending SVG Support

To add support for new SVG elements or attributes:

1. Update the appropriate parsing method in `SVGParser`
2. Add handling in the processor for the new elements
3. Implement path generation for the new element type

### Adding Path Optimization Algorithms

1. Create a new method in `PathGenerator` (e.g., `_newOptimizationAlgorithm()`)
2. Add a configuration option to control the new algorithm
3. Integrate the algorithm into the path generation pipeline

## Testing

The project uses Jest for testing. Run tests with:

```bash
npm test
```

Key test areas:
- SVG parsing accuracy
- Path generation correctness
- GCode output validation
- Performance benchmarks

### Writing Tests

```javascript
// Example test for SVG parsing
describe('SVGParser', () => {
  it('should parse a simple rectangle', () => {
    const svgString = '<svg><rect x="10" y="10" width="100" height="50" /></svg>';
    const result = SVGParser.parse(svgString);
    expect(result.paths).toHaveLength(1);
    expect(result.paths[0].type).toBe('rect');
  });
});
```

## Building for Distribution

The project uses Electron for the desktop application and Webpack for bundling.

```bash
# Development build
npm run dev

# Production build
npm run build

# Package for distribution
npm run package
```

## Update Mechanism

The application includes an auto-update mechanism using Electron's autoUpdater module. Updates are pulled from the GitHub releases page.

### Update Process

1. Application checks for updates at startup
2. If an update is available, it's downloaded in the background
3. User is prompted to install after download completes
4. Update is applied on application restart

### Publishing Updates

1. Increment version in `package.json`
2. Build the application: `npm run build`
3. Package for all platforms: `npm run package-all`
4. Create a new GitHub release with the packaged files
5. Tag the release with the version number

## Contributing

We follow a standard Git workflow:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write or update tests
5. Submit a pull request

### Code Style Guidelines

- Use ES6+ features where appropriate
- Follow the existing module pattern
- Document public methods with JSDoc comments
- Keep functions small and focused
- Use meaningful variable names

## Common Development Tasks

### Adding a New Configuration Option

1. Add the option to the configuration schema
2. Set a sensible default value
3. Add UI controls in the configuration panel
4. Update the relevant modules to use the new option
5. Document the option in user and developer guides

### Debugging Tips

- Enable debug output: `DEBUG=svg-to-gcode:* npm run dev`
- Use the debug output directory to examine intermediate results
- The application can generate SVG visualizations of toolpaths

## License

This project is licensed under the MIT License - see the LICENSE file for details. 