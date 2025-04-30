const SVGParser = require('../../../src/parser/svg-parser');

describe('SVGParser', () => {
  describe('parse', () => {
    test('should correctly parse a simple SVG', () => {
      const svgString = `
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="80" height="80" fill="#808080" />
        </svg>
      `;
      
      const result = SVGParser.parse(svgString);
      
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(result.viewBox).toEqual({ minX: 0, minY: 0, width: 100, height: 100 });
      expect(result.paths.length).toBe(1);
      expect(result.paths[0].type).toBe('rect');
    });
    
    test('should throw error for invalid SVG', () => {
      const invalidSvg = '<not-svg></not-svg>';
      
      expect(() => {
        SVGParser.parse(invalidSvg);
      }).toThrow('Invalid SVG: No SVG element found');
    });
  });
  
  describe('_parseViewBox', () => {
    test('should parse valid viewBox attribute', () => {
      const viewBox = SVGParser._parseViewBox('10 20 200 150');
      
      expect(viewBox).toEqual({
        minX: 10,
        minY: 20,
        width: 200,
        height: 150
      });
    });
    
    test('should return default values for undefined viewBox', () => {
      const viewBox = SVGParser._parseViewBox(undefined);
      
      expect(viewBox).toEqual({
        minX: 0,
        minY: 0,
        width: 100,
        height: 100
      });
    });
  });
  
  describe('_parseLength', () => {
    test('should parse pixel values', () => {
      expect(SVGParser._parseLength('100px')).toBe(100);
    });
    
    test('should parse percentage values', () => {
      expect(SVGParser._parseLength('50%')).toBe(50);
    });
    
    test('should return 0 for undefined length', () => {
      expect(SVGParser._parseLength(undefined)).toBe(0);
    });
  });
  
  describe('_parseColor', () => {
    test('should parse hex colors', () => {
      const color = SVGParser._parseColor('#ff0000');
      
      expect(color).toEqual({
        type: 'hex',
        value: '#ff0000'
      });
    });
    
    test('should parse rgb colors', () => {
      const color = SVGParser._parseColor('rgb(255, 0, 0)');
      
      expect(color).toEqual({
        type: 'rgb',
        r: 255,
        g: 0,
        b: 0
      });
    });
    
    test('should parse named colors', () => {
      const color = SVGParser._parseColor('red');
      
      expect(color).toEqual({
        type: 'name',
        value: 'red'
      });
    });
    
    test('should return null for undefined color', () => {
      expect(SVGParser._parseColor(undefined)).toBeNull();
    });
    
    test('should return null for "none" color', () => {
      expect(SVGParser._parseColor('none')).toBeNull();
    });
  });
}); 