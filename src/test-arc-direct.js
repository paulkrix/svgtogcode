/**
 * Direct test for arc paths in SVGs
 * Tests the path parsing and arc handling directly
 */

const fs = require('fs');
const path = require('path');
const PathGenerator = require('./toolpath/path-generator');
const GCodeGenerator = require('./gcode/gcode-generator');

// Create output directory
const outputDir = path.join(__dirname, '..', 'debug_output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Initialize generators with high resolution
const pathGenerator = new PathGenerator({
  toolpath: {
    resolution: 72,
    circleSegments: 72
  }
});

// Test direct arc path processing
function testArcPath() {
  console.log("Direct SVG arc path to GCode test");
  
  // Create a path with arc segments
  const arcPath = {
    type: 'path',
    d: 'M 50,150 A 100,100 0 0 1 250,150', 
    id: 'arc1',
    depth: 1.0,
    grayscale: 0.8
  };
  
  // Generate points for the path using our improved processor
  const pathPoints = pathGenerator._processPathData(arcPath.d, { minX: 0, minY: 0, width: 300, height: 300 });
  
  // Save the points to inspect them
  const pointsFile = path.join(outputDir, 'direct_arc_points.json');
  fs.writeFileSync(pointsFile, JSON.stringify(pathPoints, null, 2));
  console.log(`Generated ${pathPoints.length} points for arc path, saved to ${pointsFile}`);
  
  // Create a toolpath that can be used for GCode generation
  const toolpath = {
    type: 'path',
    id: 'arc1',
    points: pathPoints.map(p => ({ ...p, z: -1.0 })), // Add z-depth
    depth: 1.0,
    originalPath: arcPath.d
  };
  
  // Create a toolpath data object
  const toolpathData = {
    toolpaths: [toolpath],
    metadata: {
      maxDepth: 5,
      minDepth: 0.5,
      toolDiameter: 3
    }
  };
  
  // Save the toolpath data
  const toolpathFile = path.join(outputDir, 'direct_arc_toolpath.json');
  fs.writeFileSync(toolpathFile, JSON.stringify(toolpathData, null, 2));
  console.log(`Saved toolpath data to ${toolpathFile}`);
  
  // Generate GCode from the toolpath
  const gcodeGenerator = new GCodeGenerator({
    machine: {
      flavor: 'grbl',
      feedRates: {
        default: 1000,
        plunge: 300,
        rapid: 3000
      },
      safeHeight: 5
    },
    tool: {
      diameter: 3,
      spindleSpeed: 12000
    },
    output: {
      includeHeader: true,
      includeFooter: true,
      precision: 3
    },
    grayscaleMapping: {
      minDepth: 0.5,
      maxDepth: 5
    }
  });
  
  const gcodeResult = gcodeGenerator.generate(toolpathData);
  
  // Concatenate header, commands and footer for the complete GCode
  const gcodeLines = [
    ...gcodeResult.header,
    ...gcodeResult.commands,
    ...gcodeResult.footer
  ];
  
  // Save the GCode
  const gcodePath = path.join(outputDir, 'direct_arc_gcode.nc');
  fs.writeFileSync(gcodePath, gcodeLines.join('\n'));
  console.log(`Generated and saved GCode to ${gcodePath}`);
  
  // Create second test with elliptical arc
  const ellipticalArcPath = {
    type: 'path',
    d: 'M 50,150 A 100,50 0 0 1 250,150', 
    id: 'elliptical_arc',
    depth: 1.0,
    grayscale: 0.8
  };
  
  const ellipticalPoints = pathGenerator._processPathData(ellipticalArcPath.d, { minX: 0, minY: 0, width: 300, height: 300 });
  const ellipticalFile = path.join(outputDir, 'direct_elliptical_arc_points.json');
  fs.writeFileSync(ellipticalFile, JSON.stringify(ellipticalPoints, null, 2));
  console.log(`Generated ${ellipticalPoints.length} points for elliptical arc, saved to ${ellipticalFile}`);
  
  // Create a large arc flag test
  const largeArcPath = {
    type: 'path',
    d: 'M 50,150 A 100,100 1 0 1 250,150', // Note: large-arc-flag is 1 here
    id: 'large_arc',
    depth: 1.0,
    grayscale: 0.8
  };
  
  const largeArcPoints = pathGenerator._processPathData(largeArcPath.d, { minX: 0, minY: 0, width: 300, height: 300 });
  const largeArcFile = path.join(outputDir, 'direct_large_arc_points.json');
  fs.writeFileSync(largeArcFile, JSON.stringify(largeArcPoints, null, 2));
  console.log(`Generated ${largeArcPoints.length} points for large arc path, saved to ${largeArcFile}`);
  
  // Create a full circle with arcs
  const fullCirclePath = {
    type: 'path',
    d: 'M 200,150 A 50,50 0 0 1 150,200 A 50,50 0 0 1 100,150 A 50,50 0 0 1 150,100 A 50,50 0 0 1 200,150', 
    id: 'full_circle_with_arcs',
    depth: 1.0,
    grayscale: 0.8
  };
  
  const fullCirclePoints = pathGenerator._processPathData(fullCirclePath.d, { minX: 0, minY: 0, width: 300, height: 300 });
  const fullCircleFile = path.join(outputDir, 'direct_full_circle_points.json');
  fs.writeFileSync(fullCircleFile, JSON.stringify(fullCirclePoints, null, 2));
  console.log(`Generated ${fullCirclePoints.length} points for full circle with arcs, saved to ${fullCircleFile}`);
  
  // Check if the points form a closed shape
  if (fullCirclePoints.length > 1) {
    const firstPoint = fullCirclePoints[0];
    const lastPoint = fullCirclePoints[fullCirclePoints.length - 1];
    const distance = Math.sqrt(
      Math.pow(lastPoint.x - firstPoint.x, 2) + 
      Math.pow(lastPoint.y - firstPoint.y, 2)
    );
    console.log(`Full circle shape is ${distance < 0.001 ? 'closed' : 'open'} (distance: ${distance.toFixed(6)})`);
  }
  
  console.log("\nAll arc tests completed!");
}

// Run the tests
testArcPath(); 