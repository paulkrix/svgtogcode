/**
 * Direct test for circle and arc processing
 * This bypasses the SVG processor and tests the path-generator functions directly
 */

const fs = require('fs');
const path = require('path');
const PathGenerator = require('./toolpath/path-generator');

// Create output directory
const outputDir = path.join(__dirname, '..', 'debug_output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Initialize path generator with high resolution
const pathGenerator = new PathGenerator({
  toolpath: {
    resolution: 72,
    circleSegments: 72
  }
});

// Test cases
const testCases = [
  {
    name: 'circle_direct',
    description: 'Circle with center at (150,150) and radius 50',
    element: {
      type: 'circle',
      cx: 150,
      cy: 150,
      r: 50
    },
    svgInput: { 
      viewBox: { minX: 0, minY: 0, width: 300, height: 300 }
    }
  },
  {
    name: 'circle_small',
    description: 'Small circle with radius 10',
    element: {
      type: 'circle',
      cx: 150,
      cy: 150,
      r: 10
    },
    svgInput: { 
      viewBox: { minX: 0, minY: 0, width: 300, height: 300 }
    }
  },
  {
    name: 'circle_offset',
    description: 'Offset circle',
    element: {
      type: 'circle',
      cx: 100,
      cy: 200,
      r: 40
    },
    svgInput: { 
      viewBox: { minX: 0, minY: 0, width: 300, height: 300 }
    }
  },
  {
    name: 'ellipse_test',
    description: 'Ellipse',
    element: {
      type: 'ellipse',
      cx: 150,
      cy: 150,
      rx: 100,
      ry: 50
    },
    svgInput: { 
      viewBox: { minX: 0, minY: 0, width: 300, height: 300 }
    }
  }
];

/**
 * Direct test for arc path
 */
function testArcPath() {
  console.log("\nTesting arc path processing...");
  
  // Test simple half circle arc
  const startX = 50;
  const startY = 150;
  const rx = 100;
  const ry = 100;
  const xAxisRotation = 0;
  const largeArcFlag = 0;
  const sweepFlag = 1;
  const endX = 250;
  const endY = 150;
  
  console.log(`Arc params: ${startX},${startY} ${rx},${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${endX},${endY}`);
  
  // Process the arc
  const arcPoints = pathGenerator._arcToPoints(
    startX, startY, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, endX, endY
  );
  
  // Save arc points
  const arcOutputPath = path.join(outputDir, 'arc_direct_test.json');
  fs.writeFileSync(arcOutputPath, JSON.stringify(arcPoints, null, 2));
  console.log(`Arc points saved to ${arcOutputPath}`);
  
  // Test elliptical arc
  const ellipticalArcPoints = pathGenerator._arcToPoints(
    50, 150, 100, 50, 0, 0, 1, 250, 150
  );
  
  const ellipticalArcOutputPath = path.join(outputDir, 'elliptical_arc_test.json');
  fs.writeFileSync(ellipticalArcOutputPath, JSON.stringify(ellipticalArcPoints, null, 2));
  console.log(`Elliptical arc points saved to ${ellipticalArcOutputPath}`);
}

/**
 * Run the tests
 */
function runTests() {
  console.log("Starting direct tests for circle and arc processing");
  
  // Test circle/ellipse generation
  testCases.forEach(test => {
    console.log(`\nProcessing ${test.name}: ${test.description}`);
    
    // Generate points directly from the element
    const points = pathGenerator._generatePathPoints(test.element, test.svgInput);
    
    // Save points data
    const outputPath = path.join(outputDir, `${test.name}_direct.json`);
    fs.writeFileSync(outputPath, JSON.stringify(points, null, 2));
    
    console.log(`Generated ${points.length} points`);
    console.log(`Points saved to ${outputPath}`);
    
    // Check if start and end points are the same (closed shape)
    if (points.length > 1) {
      const startPoint = points[0];
      const endPoint = points[points.length - 1];
      const distance = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + 
        Math.pow(endPoint.y - startPoint.y, 2)
      );
      console.log(`Shape is ${distance < 0.001 ? 'closed' : 'open'} (distance: ${distance.toFixed(6)})`);
    }
  });
  
  // Test arc processing
  testArcPath();
  
  console.log("\nAll tests completed!");
}

// Run the tests
runTests(); 