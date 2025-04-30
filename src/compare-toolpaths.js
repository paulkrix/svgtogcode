/**
 * Toolpath Comparison Script
 * 
 * Compares the original and updated toolpaths to verify line element processing
 */

const fs = require('fs');
const path = require('path');

// Paths to original and updated toolpath data
const outputDir = path.join(__dirname, '../debug_output');
const originalPath = path.join(outputDir, 'toolpath_data.json');
const updatedPath = path.join(outputDir, 'updated_toolpath_data.json');

// Load toolpath data
console.log('Loading toolpath data...');
let originalData, updatedData;

try {
  originalData = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
  console.log('Original toolpath loaded successfully');
} catch (error) {
  console.error('Error loading original toolpath:', error.message);
  originalData = { toolpaths: [], metadata: {} };
}

try {
  updatedData = JSON.parse(fs.readFileSync(updatedPath, 'utf8'));
  console.log('Updated toolpath loaded successfully');
} catch (error) {
  console.error('Error loading updated toolpath:', error.message);
  updatedData = { toolpaths: [], metadata: {} };
}

// Generate comparison report
console.log('\n--- TOOLPATH COMPARISON REPORT ---\n');

// Compare toolpath counts
const originalCount = originalData.toolpaths?.length || 0;
const updatedCount = updatedData.toolpaths?.length || 0;
const diff = updatedCount - originalCount;

console.log(`Original toolpath count: ${originalCount}`);
console.log(`Updated toolpath count: ${updatedCount}`);
console.log(`Difference: ${diff > 0 ? '+' + diff : diff} toolpaths\n`);

// Check for line elements
const originalTypes = {};
const updatedTypes = {};

originalData.toolpaths?.forEach(toolpath => {
  const type = toolpath.type || 'unknown';
  originalTypes[type] = (originalTypes[type] || 0) + 1;
});

updatedData.toolpaths?.forEach(toolpath => {
  const type = toolpath.type || 'unknown';
  updatedTypes[type] = (updatedTypes[type] || 0) + 1;
});

console.log('Original toolpath types:');
for (const [type, count] of Object.entries(originalTypes)) {
  console.log(`  ${type}: ${count}`);
}

console.log('\nUpdated toolpath types:');
for (const [type, count] of Object.entries(updatedTypes)) {
  console.log(`  ${type}: ${count}`);
}

// Check for the specific line elements from SVG
const decorativeLines = updatedData.toolpaths?.filter(
  tp => tp.type === 'line' && tp.id?.startsWith('line_')
);

console.log(`\nDecorative line elements found: ${decorativeLines?.length || 0}`);
if (decorativeLines?.length > 0) {
  console.log('\nLine element details:');
  decorativeLines.forEach((line, index) => {
    const startPoint = line.points[0];
    const endPoint = line.points[line.points.length - 1];
    
    console.log(`  Line ${index + 1} (${line.id}):`);
    console.log(`    Depth: ${line.depth}mm`);
    console.log(`    From: (${startPoint.x}, ${startPoint.y})`);
    console.log(`    To: (${endPoint.x}, ${endPoint.y})`);
  });
}

// Check if original SVG had lines that weren't processed
console.log('\n--- VERIFICATION REPORT ---\n');

try {
  const originalSvgPath = path.join(outputDir, 'original_svg.svg');
  const svgContent = fs.readFileSync(originalSvgPath, 'utf8');
  
  // Count line elements in SVG
  const lineCount = (svgContent.match(/<line/g) || []).length;
  console.log(`Line elements in original SVG: ${lineCount}`);
  console.log(`Line elements in updated toolpaths: ${decorativeLines?.length || 0}`);
  
  if (lineCount === decorativeLines?.length) {
    console.log('\n✅ VERIFICATION SUCCESSFUL: All line elements are now properly processed!');
  } else {
    console.log('\n⚠️ VERIFICATION INCOMPLETE: Not all line elements were processed correctly.');
  }
} catch (error) {
  console.error('Error during verification:', error.message);
}

console.log('\n--- END OF REPORT ---'); 