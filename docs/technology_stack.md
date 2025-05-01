# SVG to GCode Converter - Technology Stack

## Overview

This document outlines the technology stack currently used in the SVG to GCode Converter application. It provides a reference for the current implementation and context for future enhancements.

## Current Technology Stack

### Programming Language & Runtime
- **JavaScript**: Core language used throughout the application
- **Node.js**: Runtime environment for the application
- **Electron**: Framework for creating the desktop application

### User Interface
- **HTML/CSS/JavaScript**: Standard web technologies for the UI
- **Electron**: Provides the desktop application framework
- **DOM manipulation**: Used for visualization and UI updates

### SVG Processing
- **svg-parser**: Library for SVG parsing and extraction
- **svgpath**: Library for SVG path manipulation
- **JSDOM**: For DOM manipulation and SVG processing
- **Bezier.js**: For Bézier curve manipulation and path processing

### GCode Generation
- **Custom GCode generator**: Built in-house to maintain control over GCode quality and optimization
- **GRBL-specific optimizations**: Tailored for compatibility with GRBL controllers

### Data Persistence
- **Electron Store**: For saving application configuration and user preferences
- **JSON**: Used for serializing and storing conversion configurations

## Current Implementation Structure

### Architecture Pattern
- **Monolithic Processing**: Central SVGProcessor class handles most core functionality
- **Module-based organization**: Some functionality is separated into modules (GCode, Path Generation)

### File Organization
- **src/**: Main source directory
  - **svg-processor.js**: Core processing component
  - **index.js**: Main application entry point
  - **update-manager.js**: Update management
  - **parser/**: SVG parsing modules
  - **processor/**: Processing utilities
  - **toolpath/**: Toolpath generation
  - **gcode/**: GCode generation
  - **visualization/**: Visualization utilities
  - **ui/**: User interface components
  - **models/**: Data models
  - **utils/**: Utility functions

### Performance Considerations
- **Efficient path processing**: Implemented in the SVG processor
- **Optimized toolpath generation**: For better machining results
- **Progress callbacks**: To provide feedback during processing

### Error Handling
- **Try-catch blocks**: For error handling in processing methods
- **Console logging**: For debugging and error reporting
- **Dialog boxes**: For user-facing error messages

## External Dependencies

| Dependency | Purpose |
|------------|---------|
| electron | Desktop application framework |
| svg-parser | SVG parsing and manipulation |
| svgpath | SVG path manipulation |
| bezier-js | Bézier curve manipulation |
| jsdom | DOM manipulation for SVG processing |
| color-convert | Color processing for grayscale mapping |
| electron-log | Logging |
| electron-builder | Application packaging |
| electron-updater | Update management |

## Development Environment

### Required Tools
- **Node.js**: v14.x or higher
- **npm**: v7.x or higher
- **Git**: For version control
- **Any code editor**: Visual Studio Code recommended

### Development Workflow
1. Local development using Electron's development mode (`npm run dev`)
2. Testing with built-in test scripts
3. Packaging for different platforms (`npm run package-win`, `npm run package-mac`, etc.)

## Future Technology Considerations

The following technologies were originally planned but not yet implemented:

### Planned Future Technologies
- **TypeScript**: For strong typing and improved code quality
- **React**: For a more structured and component-based UI
- **Tailwind CSS**: For improved styling
- **Three.js/React Three Fiber**: For 3D visualization
- **Web Workers**: For improved performance with background processing

## Rationale for Current Technologies

### SVG Processing Libraries
The current implementation uses a combination of svg-parser, svgpath, and custom processing to handle SVG parsing and transformation. These libraries provide the necessary functionality for extracting paths and attributes from SVG files.

### Electron for Desktop Application
Electron provides cross-platform compatibility and native file system access, which is essential for loading SVGs and saving GCode files. It also enables offline operation, which is a key requirement for workshop environments.

### Custom GCode Generation
The custom GCode generation ensures complete control over the output quality and optimization specifically for GRBL controllers. It allows for tailored commands based on path characteristics and depth information.

### Development Tools
The current build and packaging tools provide the necessary functionality for creating distributable applications for multiple platforms. Electron-builder simplifies the packaging process, and electron-updater provides update management capabilities. 