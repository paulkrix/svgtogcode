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

## Quick Start Guide

This quick start guide will help you get up and running with the SVG to GCode Converter in just a few minutes.

### Prerequisites

Before starting, ensure you have:
- Installed the SVG to GCode Converter (see [Installation Guide](installation_guide.md))
- A prepared SVG file you want to convert
- Knowledge of your CNC machine's specifications

### Step 1: Launch the Application

1. Start the SVG to GCode Converter application from your desktop shortcut or applications menu
2. The main interface will open, showing the file loader panel

### Step 2: Load Your SVG File

1. Click the "Open SVG" button in the toolbar or use File → Open from the menu
2. Browse to and select your SVG file
3. The SVG will be loaded and displayed in the preview area

### Step 3: Configure Grayscale-to-Depth Settings

1. In the settings panel on the right, locate the "Grayscale Mapping" section
2. Set your preferred depth mapping:
   - Minimum Depth: The depth (Z-axis) for white (or lightest grayscale)
   - Maximum Depth: The depth for black (or darkest grayscale)
   - Mapping Curve: Linear, Logarithmic, or Custom

### Step 4: Configure Machine Settings

1. In the "Machine Settings" section:
   - Set Feed Rate: The speed for X/Y movement (e.g., 1000 mm/min)
   - Set Plunge Rate: The speed for Z-axis movement (e.g., 300 mm/min)
   - Configure other machine-specific parameters

### Step 5: Generate and Preview GCode

1. Click the "Generate GCode" button
2. The application will process the SVG and display a preview of the toolpaths
3. The color-coded preview shows the depth levels with a scale on the right
4. Estimated machining time will be displayed at the bottom

### Step 6: Save GCode

1. When satisfied with the preview, click "Save GCode" or use File → Save GCode
2. Choose a location to save the .gcode or .nc file
3. The file is now ready to be loaded on your CNC machine

### Step 7: Run on Your CNC Machine

1. Transfer the GCode file to your CNC controller
2. Set up your machine according to your normal workflow
3. Run the GCode using your machine control software

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

## Tutorials

### Tutorial 1: Converting a Logo to 3D Relief

This tutorial demonstrates how to convert a grayscale logo to a 3D relief carving.

#### Preparation
1. Create a logo in your preferred graphic design software
2. Use grayscale shading to indicate depth (darker = deeper)
3. Export as SVG format
4. Ensure the dimensions match your intended physical size

#### Conversion Steps
1. Load the SVG in the converter
2. Set cutting depth range (e.g., 0mm to 5mm)
3. Choose your preferred curve mapping (try logarithmic for softer transitions)
4. Set appropriate feed and plunge rates for your material
5. Generate the GCode and preview
6. Make adjustments if needed
7. Save the final GCode

#### Machining Tips
- Use a ball-nose end mill for smooth transitions between depths
- Secure your material firmly to prevent movement during carving
- Consider a finishing pass at a slower feed rate for smoother results

### Tutorial 2: Creating Multi-Level Engravings

Learn how to create engravings with distinct depth levels using grayscale values.

## Frequently Asked Questions

### General Questions

**Q: What type of SVG files work best with this converter?**  
A: The converter works best with SVG files that use grayscale colors to indicate depth. Vector paths with solid grayscale fills or grayscale strokes will be interpreted correctly. Complex gradients may be simplified during conversion.

**Q: Can I use color SVGs instead of grayscale?**  
A: Yes, but colors will be converted to their grayscale equivalents. For precise depth control, using grayscale in your original design is recommended.

**Q: What's the maximum file size the converter can handle?**  
A: The converter can handle SVG files up to 50MB, but performance may decrease with very large or complex files. For optimal performance, keep files under 10MB.

**Q: Does the converter work offline?**  
A: Yes, the SVG to GCode Converter works completely offline. No internet connection is required for conversion.

### Technical Questions

**Q: What CNC controllers are supported?**  
A: The converter is optimized for GRBL controllers, but the GCode output is compatible with most hobby-grade CNC controllers including Mach3, LinuxCNC, and many others.

**Q: How is the depth mapping calculated?**  
A: Grayscale values (0-255) are mapped to depths between your minimum and maximum settings. By default, white (255) corresponds to minimum depth, and black (0) to maximum depth. The mapping curve determines how intermediate values are interpreted.

**Q: Can I use the converter for laser engraving?**  
A: Yes, you can configure the output for laser engraving by setting appropriate parameters. In the machine settings, enable the "Laser Mode" option, which will convert grayscale to laser power levels instead of depth.

**Q: How do I increase the accuracy of small details?**  
A: For small details, consider adjusting the "Resolution" setting in the advanced options. A higher resolution preserves more detail but generates larger GCode files and potentially longer machining time.

### Troubleshooting

**Q: Why are my circles appearing as polygons in the preview?**  
A: SVG circles are approximated using line segments. You can increase the "Circle Approximation Quality" in the settings to improve the smoothness of circles and arcs.

**Q: The converter is running very slowly with my file. How can I improve performance?**  
A: Try simplifying your SVG by reducing the number of paths or points. Many vector editing programs offer path simplification options. Also, check for unnecessarily complex elements that could be simplified.

**Q: My GCode file seems too large. How can I optimize it?**  
A: Enable the "Optimize GCode" option in the export settings. This will reduce file size by combining colinear movements and removing redundant commands. You can also try reducing the "Path Precision" setting, which affects how precisely curves are approximated.

**Q: Why are some parts of my SVG being ignored in the conversion?**  
A: Check that all elements in your SVG have grayscale fill or stroke values. Elements without color information or with non-standard SVG attributes might be ignored. Also, very thin lines or tiny details below the "Minimum Feature Size" setting will be filtered out. 