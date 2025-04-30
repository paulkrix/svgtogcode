# SVG to GCode Converter

A desktop application that converts SVG vector files to GRBL-compatible GCode, using grayscale color values to determine cutting depth.

## Features

- Import SVG files and convert to GCode for CNC milling
- Map grayscale colors to Z-axis depth values
- Preview conversion with depth visualization
- Configure machine-specific settings
- Generate optimized toolpaths
- Output GRBL-compatible GCode

## Installation

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/svg-to-gcode-converter.git
   cd svg-to-gcode-converter
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the application:
   ```
   npm start
   ```

## Development

### Project Structure

```
src/
├── input/         # Input file handling
├── parser/        # SVG parsing
├── processor/     # Path processing & grayscale mapping
├── toolpath/      # Toolpath generation
├── gcode/         # GCode generation
├── visualization/ # SVG and toolpath visualization
├── ui/            # User interface components
├── models/        # Data models
└── utils/         # Utility functions
```

### Building

```
npm run build
```

### Testing

```
npm test
```

## Usage

1. Launch the application
2. Load an SVG file
3. Configure grayscale to depth mapping
4. Adjust machine settings if needed
5. Preview the conversion
6. Generate and save GCode

## Configuration

The application supports configuring:

- Machine dimensions and feedrates
- Tool settings
- Grayscale to depth mapping options
- GCode output format

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Recent Updates

### Line Element Support Fix

We recently identified and fixed an issue with the SVG to GCode conversion process where line elements in SVG files were not being properly processed. The following changes were made:

1. **SVG Parser Enhancement**: Added support for parsing `<line>` elements in SVG files and converting them to path format for consistent processing.

2. **Grayscale Mapper Improvement**: Updated the grayscale depth mapping logic to properly handle line elements, which only have stroke attributes and no fill.

3. **Path Generation Fix**: Ensured that the path generator properly handles line elements when creating toolpaths.

4. **Visualization Updates**: Enhanced the SVG visualizer to properly display line elements with appropriate depth indicators.

These changes ensure that decorative line patterns and other line-based elements in SVG files are correctly processed and included in the generated GCode output. The fixes have been verified by processing test SVG files containing various line elements.

### Testing the Fix

To test the line element support fix:

1. Run the test script: `node src/test-line-support.js`
2. Update the visualizations: `node src/update-visualizations.js` 
3. Check the updated visualizations in the `debug_output` directory

The updated visualizations should now show line elements with proper depth values and include them in the GCode generation process. 