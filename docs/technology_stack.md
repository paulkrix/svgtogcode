# SVG to GCode Converter - Technology Stack

## Overview

This document outlines the technology decisions made for implementing the SVG to GCode Converter application. It serves as a reference for the development team and provides context for future maintenance and enhancements.

## Core Technology Stack

### Programming Language & Runtime
- **TypeScript**: Chosen for strong typing, modern JavaScript features, and excellent tooling support
- **Node.js**: Runtime environment for the application
- **Electron**: Framework for creating cross-platform desktop applications with web technologies

### Frontend
- **React**: UI library for building the user interface components (See [User Interface in Architecture Design](architecture_design.md#7-user-interface))
- **Tailwind CSS**: Utility-first CSS framework for styling
- **React Three Fiber**: React renderer for Three.js, used for 3D visualization of toolpaths (See [Visualization Engine in Architecture Design](architecture_design.md#6-visualization-engine) and [Visualization API](technical_specification.md#6-visualization-api))

### SVG Processing
- **SVG.js**: Library for SVG parsing and manipulation (See [SVG Parser in Architecture Design](architecture_design.md#2-svg-parser) and [SVG Parser API](technical_specification.md#2-svg-parser-api))
- **Paper.js**: Vector graphics scripting framework for path processing (See [Path Processor in Architecture Design](architecture_design.md#3-path-processor) and [Path Processor API](technical_specification.md#3-path-processor-api))
- **D3.js**: Used for advanced SVG manipulation and transformation

### GCode Generation
- **Custom GCode generator**: Built in-house to maintain control over GCode quality and optimization (See [GCode Generator in Architecture Design](architecture_design.md#5-gcode-generator) and [GCode Generator API](technical_specification.md#5-gcode-generator-api))
- **GRBL-specific optimizations**: Tailored for compatibility with GRBL controllers

### Data Persistence
- **Electron Store**: For saving application configuration and user preferences
- **JSON**: Used for serializing and storing conversion configurations

## Key Implementation Decisions

### Architecture Pattern
- **Model-View-Controller (MVC)**: Separates concerns between data, user interface, and control logic
- **Pipeline Processing**: Data flows through distinct processing stages with clear interfaces

### Performance Optimization
- **Web Workers**: For CPU-intensive operations like path optimization
- **Virtualized Rendering**: For efficient display of large path collections
- **Incremental Processing**: Allows for partial processing of large files with progress feedback

### Testing Strategy
- **Jest**: For unit and integration testing
- **Testing Library**: For component testing
- **Storybook**: For visual component development and testing

### Build & Packaging
- **Webpack**: For bundling and optimizing application code
- **Electron Forge**: For packaging and distributing the application
- **GitHub Actions**: For CI/CD pipeline

### Error Handling & Logging
- **Centralized Error Handling**: Using custom error classes and middleware
- **Winston**: For logging across the application
- **Sentry**: For production error tracking

## External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| typescript | ^4.9.5 | Static typing |
| react | ^18.2.0 | UI components |
| electron | ^26.0.0 | Desktop application framework |
| svg.js | ^3.1.2 | SVG parsing and manipulation |
| paper | ^0.12.17 | Vector graphics processing |
| d3 | ^7.8.5 | Data visualization and transformations |
| three | ^0.155.0 | 3D visualization |
| @react-three/fiber | ^8.14.1 | React renderer for Three.js |
| tailwindcss | ^3.3.3 | CSS utility framework |
| electron-store | ^8.1.0 | Local storage solution |
| jest | ^29.6.4 | Testing framework |
| webpack | ^5.88.2 | Code bundling |

## Development Environment

### Required Tools
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Git**: For version control
- **Visual Studio Code**: Recommended IDE with following extensions:
  - ESLint
  - Prettier
  - TypeScript ESLint
  - Tailwind CSS IntelliSense

### Development Workflow
1. Local development using Electron's development mode
2. Unit testing runs on file changes
3. Pull request validation with automated tests
4. Automated builds for major platforms (Windows, macOS, Linux)

## Rationale for Key Technology Choices

### Why TypeScript?
TypeScript provides strong typing that's essential for maintaining a complex application with multiple data transformations. The type system helps prevent errors in path processing and coordinate transformations.

### Why Electron?
Electron allows us to deliver a consistent experience across platforms while leveraging web technologies. It also provides native file system access required for loading SVGs and saving GCode files.

### Why SVG.js and Paper.js?
These libraries provide robust vector manipulation capabilities while abstracting browser inconsistencies. Paper.js excels at path operations needed for optimization.

### Why Custom GCode Generation?
Custom GCode generation ensures we have complete control over the output quality and can optimize specifically for CNC engraving with grayscale depth mapping. 