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
   git clone https://github.com/paulkrix/svgtogcode.git
   cd svgtogcode
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