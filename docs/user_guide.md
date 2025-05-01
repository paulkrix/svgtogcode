# SVG to GCode Converter User Guide

## Introduction

The SVG to GCode Converter is a powerful application that transforms vector graphics in SVG format into machine-readable GCode for CNC machines, laser cutters, and engravers. It specializes in grayscale-to-depth mapping, allowing you to easily convert shaded SVG images into 3D engravings.

## Installation

### System Requirements
- Operating System: Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+ recommended)
- RAM: 4GB minimum, 8GB recommended for large SVG files
- Disk Space: 200MB

### Installation Steps

#### Windows
1. Download the installer from the releases page
2. Run the `.exe` installer and follow the on-screen instructions
3. Launch the application from the Start menu or desktop shortcut

#### macOS
1. Download the `.dmg` file from the releases page
2. Open the `.dmg` file and drag the application to your Applications folder
3. Launch from the Applications folder or Dock

#### Linux
1. Download the `.AppImage` or distribution-specific package (`.deb`, `.rpm`)
2. Make the AppImage executable: `chmod +x SVGtoGCode.AppImage`
3. Run the application: `./SVGtoGCode.AppImage`

## Quick Start

1. Launch the SVG to GCode Converter
2. Click the "Open SVG" button to select your SVG file
3. Adjust settings in the configuration panel as needed
4. Click "Generate GCode" to process your file
5. Preview the generated toolpath in the visualization panel
6. Save the generated GCode using the "Save GCode" button

## Interface Overview

The application interface consists of the following main areas:

- **File Operations Panel**: Open SVG files and save GCode output
- **SVG Preview**: View your imported SVG file
- **Configuration Panel**: Customize conversion settings
- **Toolpath Visualization**: Preview the generated toolpath
- **Console Output**: View processing logs and messages

## Settings and Configuration

### Basic Settings

- **Cutting Depth**: Set the maximum depth of the engraving
- **Safe Height**: Set the height at which the tool moves when not cutting
- **Feed Rate**: Set the speed at which the tool moves during cutting
- **Plunge Rate**: Set the speed at which the tool moves vertically

### Grayscale Mapping

- **Min Depth**: The depth corresponding to white (or lightest color)
- **Max Depth**: The depth corresponding to black (or darkest color)
- **Invert Mapping**: Swap depth mapping (light colors become deep cuts and vice versa)
- **Grayscale Algorithm**: Choose how colors are converted to grayscale (Luminosity, Average, etc.)

### Machine Settings

- **Machine Type**: Select from predefined machine profiles or create your own
- **GCode Flavor**: Choose the GCode dialect for your machine (GRBL, Marlin, Mach3, Fanuc, LinuxCNC)
- **Tool Diameter**: Set the diameter of your cutting tool
- **Work Area**: Define the maximum work area of your machine

### Toolpath Settings

- **Path Optimization**: Enable/disable path optimization algorithms
- **Smoothing**: Apply smoothing to reduce jerky movements
- **Constant Z**: Keep Z-height constant within each path
- **Safety Height Transitions**: Configure how the tool transitions between cuts

## Advanced Features

### SVG Processing Options

- **Large File Handling**: Special processing for very large SVG files
- **Layer Support**: Process specific layers from multi-layer SVG files
- **Path Simplification**: Reduce point count while preserving shape fidelity

### Custom GCode

- **Custom Header**: Add custom GCode at the beginning of the file
- **Custom Footer**: Add custom GCode at the end of the file
- **Custom Tool Changes**: Configure tool change operations

### Batch Processing

For processing multiple files:

1. Click the "Batch Process" button in the main interface
2. Select multiple SVG files or a folder containing SVG files
3. Configure common settings for all files
4. Click "Process All" to generate GCode for each file

## Troubleshooting

### Common Issues

- **SVG File Not Loading**: Ensure your SVG file is valid and conforms to SVG standards
- **Unexpected Toolpaths**: Check if your SVG has overlapping paths or unsupported elements
- **Performance Issues**: For large files, try enabling the "Optimize for large files" option

### Error Messages

- **"Invalid SVG"**: The file is not a valid SVG file or contains unsupported elements
- **"Path Processing Error"**: Problem encountered when processing specific SVG paths
- **"Memory Limit Exceeded"**: File is too large for available memory

### Getting Help

If you encounter issues not covered in this guide:

1. Check the FAQ section on our website
2. Review the issue tracker on GitHub
3. Join our community forum for support
4. Contact support at support@svgtogcode.com

## Keyboard Shortcuts

- **Ctrl+O**: Open SVG file
- **Ctrl+S**: Save GCode
- **Ctrl+G**: Generate GCode
- **Ctrl+P**: Preview toolpath
- **Ctrl+Z**: Undo
- **Ctrl+Shift+Z**: Redo
- **F1**: Open this help documentation

## Best Practices

- Use vector graphics software (Inkscape, Adobe Illustrator) to prepare your SVG files
- Simplify complex paths before importing
- Use grayscale colors to define depth variations
- Test with small files before processing large or complex designs
- Back up your machine settings and configurations regularly

## License and Legal Information

This software is distributed under the MIT License. See the LICENSE file for more details.

Copyright (c) 2023 SVG to GCode Converter Team 