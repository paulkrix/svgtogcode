# Changelog

## [Unreleased]

### Fixed
- Fixed SVG path processing to correctly handle all path types, not just circles and arcs
- Added proper handling for line elements in SVG files
- Improved parsing of SVG path commands, including relative commands
- Enhanced toolpath generation for all SVG elements
- Fixed handling of curved paths (bezier curves, arcs)
- Better error handling and debug output throughout the SVG processing pipeline
- Fixed async/await handling in toolpath generation

### Added
- Added specialized toolpath generation for different path types
- Added pen-up/pen-down flags for better control of the cutting process
- Added diagnostic test script for path processing
- Added more comprehensive error handling for invalid SVG files

## [1.0.0] - 2023-09-15

### Added
- Initial release of SVG to GCode converter
- Support for SVG parsing and GCode generation
- Grayscale to depth mapping for 3D carving
- Circle and arc processing
- Basic path processing
- GRBL-compatible GCode output 