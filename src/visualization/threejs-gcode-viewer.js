/**
 * Three.js GCode Visualizer Template Generator
 * 
 * Generates a standalone HTML page with Three.js for visualizing GCode
 */

class ThreeJsGCodeVisualizer {
  /**
   * Create a new Three.js GCode visualizer
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      ...{
        width: 800,
        height: 600,
        backgroundColor: 0x1a1a1a,
        gridColor: 0x555555,
        rapidColor: 0xff0000,
        normalColor: 0x0088ff,
        plungeColor: 0x00ff00
      },
      ...config
    };
  }

  /**
   * Generate a standalone HTML page with Three.js visualization for GCode
   * @param {Object} gcodeData - The GCode data with commands array
   * @returns {string} Complete HTML content for the visualization page
   */
  generateVisualizationPage(gcodeData) {
    // Extract data from GCode
    const { commands, metadata } = gcodeData;
    
    // Generate the HTML page with Three.js
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GCode 3D Visualization</title>
  <!-- Use Three.js from unpkg for better compatibility -->
  <script src="https://unpkg.com/three@0.126.1/build/three.min.js"></script>
  <!-- Use OrbitControls from unpkg for better compatibility -->
  <script src="https://unpkg.com/three@0.126.1/examples/js/controls/OrbitControls.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #000;
      color: #fff;
      font-family: Arial, sans-serif;
    }
    #container {
      position: absolute;
      width: 100%;
      height: 100%;
    }
    #info {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      pointer-events: none;
    }
    #legend {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
    }
    .color-box {
      width: 12px;
      height: 12px;
      margin-right: 5px;
      border-radius: 2px;
    }
    #controls {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      padding: 10px;
      border-radius: 5px;
    }
    button {
      background: #333;
      color: #fff;
      border: 1px solid #555;
      padding: 5px 10px;
      margin: 0 5px;
      border-radius: 3px;
      cursor: pointer;
    }
    button:hover {
      background: #444;
    }
    button.active {
      background: #0088ff;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  
  <div id="info">
    <div><strong>File Info:</strong> ${metadata?.fileName || 'GCode Visualization'}</div>
    <div><strong>Estimated Time:</strong> <span id="estimatedTime">${this._formatTime(metadata?.estimatedTime || 0)}</span></div>
    <div><strong>Total Distance:</strong> <span id="totalDistance">${this._formatDistance(metadata?.totalDistance || 0)}</span></div>
    <div><strong>Commands:</strong> ${commands.length}</div>
  </div>
  
  <div id="legend">
    <div class="legend-item">
      <div class="color-box" style="background-color: #ff0000;"></div>
      <span>Rapid Movement</span>
    </div>
    <div class="legend-item">
      <div class="color-box" style="background-color: #0088ff;"></div>
      <span>Cutting Movement</span>
    </div>
    <div class="legend-item">
      <div class="color-box" style="background-color: #00ff00;"></div>
      <span>Plunge Movement</span>
    </div>
  </div>
  
  <div id="controls">
    <button id="viewTop">Top</button>
    <button id="viewFront">Front</button>
    <button id="viewSide">Side</button>
    <button id="viewIso" class="active">Isometric</button>
  </div>

  <script>
    // Main Three.js visualization code
    (function() {
      // Initialize Three.js scene
      const scene = new THREE.Scene();
      const container = document.getElementById('container');
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Camera setup
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
      camera.position.set(100, 100, 100);
      
      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setClearColor(${this.config.backgroundColor});
      container.appendChild(renderer.domElement);
      
      // Add OrbitControls
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      
      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(200, 200, 200);
      scene.add(directionalLight);
      
      // Add grid
      const gridSize = 200;
      const gridDivisions = 20;
      const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, ${this.config.gridColor}, ${this.config.gridColor});
      scene.add(gridHelper);
      
      // Add axes
      const axesHelper = new THREE.AxesHelper(50);
      scene.add(axesHelper);
      
      // Parse GCode
      const toolpaths = parseGCode(${JSON.stringify(commands)});
      
      // Create geometries for different types of movements
      const rapidLineMaterial = new THREE.LineBasicMaterial({ color: ${this.config.rapidColor}, linewidth: 1 });
      const normalLineMaterial = new THREE.LineBasicMaterial({ color: ${this.config.normalColor}, linewidth: 2 });
      const plungeLineMaterial = new THREE.LineBasicMaterial({ color: ${this.config.plungeColor}, linewidth: 2 });
      
      // Add toolpaths to scene
      visualizeToolpaths(toolpaths);
      
      // Center camera on toolpaths
      centerCameraOnToolpaths();
      
      // Handle window resize
      window.addEventListener('resize', onWindowResize);
      
      // Set up view buttons
      document.getElementById('viewTop').addEventListener('click', setTopView);
      document.getElementById('viewFront').addEventListener('click', setFrontView);
      document.getElementById('viewSide').addEventListener('click', setSideView);
      document.getElementById('viewIso').addEventListener('click', setIsometricView);
      
      // Animation loop
      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      
      // Start animation
      animate();
      
      // Parse GCode commands to toolpaths
      function parseGCode(commands) {
        const toolpaths = [];
        let currentPath = null;
        
        // Current position
        let currentX = 0;
        let currentY = 0;
        let currentZ = 0;
        
        // Parse each command
        commands.forEach(cmd => {
          // Skip comments and empty lines
          if (!cmd || cmd.startsWith('(') || cmd.trim() === '') {
            return;
          }
          
          try {
            // New path start with G0 Z movement to safe height
            if (cmd.startsWith('G0 Z')) {
              if (currentPath && currentPath.points.length > 0) {
                toolpaths.push(currentPath);
              }
              currentPath = { points: [], type: 'rapid' };
              const zMatch = cmd.match(/Z([-\\d.]+)/);
              if (zMatch && zMatch[1]) {
                currentZ = parseFloat(zMatch[1]);
              }
              currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
            }
            // Rapid move to starting position
            else if (cmd.startsWith('G0 X') || cmd.startsWith('G0 Y')) {
              if (!currentPath) {
                currentPath = { points: [], type: 'rapid' };
                currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
              }
              
              // Extract coordinates
              const xMatch = cmd.match(/X([-\\d.]+)/);
              const yMatch = cmd.match(/Y([-\\d.]+)/);
              
              if (xMatch && xMatch[1]) currentX = parseFloat(xMatch[1]);
              if (yMatch && yMatch[1]) currentY = parseFloat(yMatch[1]);
              
              currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
            }
            // Plunge movement
            else if (cmd.startsWith('G1 Z')) {
              if (currentPath && currentPath.points.length > 0) {
                toolpaths.push(currentPath);
              }
              currentPath = { points: [], type: 'plunge' };
              currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
              
              const zMatch = cmd.match(/Z([-\\d.]+)/);
              if (zMatch && zMatch[1]) {
                currentZ = parseFloat(zMatch[1]);
              }
              currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
              
              toolpaths.push(currentPath);
              currentPath = { points: [], type: 'normal' };
              currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
            }
            // Linear cutting movement
            else if (cmd.startsWith('G1 X') || cmd.startsWith('G1 Y')) {
              if (!currentPath) {
                currentPath = { points: [], type: 'normal' };
                currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
              }
              
              // Extract coordinates
              const xMatch = cmd.match(/X([-\\d.]+)/);
              const yMatch = cmd.match(/Y([-\\d.]+)/);
              const zMatch = cmd.match(/Z([-\\d.]+)/);
              
              if (xMatch && xMatch[1]) currentX = parseFloat(xMatch[1]);
              if (yMatch && yMatch[1]) currentY = parseFloat(yMatch[1]);
              if (zMatch && zMatch[1]) currentZ = parseFloat(zMatch[1]);
              
              currentPath.points.push({ x: currentX, y: currentY, z: currentZ });
            }
          } catch (error) {
            console.error(\`Error parsing GCode command: \${cmd}\`, error);
          }
        });
        
        // Add the last path if it exists
        if (currentPath && currentPath.points.length > 0) {
          toolpaths.push(currentPath);
        }
        
        return toolpaths;
      }
      
      // Visualize toolpaths
      function visualizeToolpaths(toolpaths) {
        toolpaths.forEach(path => {
          if (path.points.length < 2) return;
          
          const geometry = new THREE.BufferGeometry();
          const vertices = [];
          
          path.points.forEach(point => {
            vertices.push(point.x, point.y, point.z);
          });
          
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
          
          let material;
          switch(path.type) {
            case 'rapid':
              material = rapidLineMaterial;
              break;
            case 'plunge':
              material = plungeLineMaterial;
              break;
            default:
              material = normalLineMaterial;
          }
          
          const line = new THREE.Line(geometry, material);
          scene.add(line);
        });
      }
      
      // Calculate bounding box to center camera
      function centerCameraOnToolpaths() {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        
        // Find min/max coordinates
        toolpaths.forEach(path => {
          path.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            minZ = Math.min(minZ, p.z);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
            maxZ = Math.max(maxZ, p.z);
          });
        });
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;
        
        // Set controls target to center
        controls.target.set(centerX, centerY, centerZ);
        
        // Set camera position relative to size
        const sizeX = Math.max(1, maxX - minX);
        const sizeY = Math.max(1, maxY - minY);
        const sizeZ = Math.max(1, maxZ - minZ);
        const maxSize = Math.max(sizeX, sizeY, sizeZ);
        
        // Position camera based on bounding box
        setIsometricView();
      }
      
      // Resize handler
      function onWindowResize() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
      
      // View functions
      function setTopView() {
        setActiveViewButton('viewTop');
        const centerX = controls.target.x;
        const centerY = controls.target.y;
        const centerZ = controls.target.z;
        const distance = camera.position.distanceTo(controls.target);
        camera.position.set(centerX, centerY + distance, centerZ);
        camera.up.set(0, 0, 1);
        camera.lookAt(controls.target);
      }
      
      function setFrontView() {
        setActiveViewButton('viewFront');
        const centerX = controls.target.x;
        const centerY = controls.target.y;
        const centerZ = controls.target.z;
        const distance = camera.position.distanceTo(controls.target);
        camera.position.set(centerX, centerY - distance, centerZ);
        camera.up.set(0, 0, 1);
        camera.lookAt(controls.target);
      }
      
      function setSideView() {
        setActiveViewButton('viewSide');
        const centerX = controls.target.x;
        const centerY = controls.target.y;
        const centerZ = controls.target.z;
        const distance = camera.position.distanceTo(controls.target);
        camera.position.set(centerX + distance, centerY, centerZ);
        camera.up.set(0, 0, 1);
        camera.lookAt(controls.target);
      }
      
      function setIsometricView() {
        setActiveViewButton('viewIso');
        const centerX = controls.target.x;
        const centerY = controls.target.y;
        const centerZ = controls.target.z;
        const distance = camera.position.distanceTo(controls.target);
        camera.position.set(
          centerX + distance * 0.7,
          centerY + distance * 0.7,
          centerZ + distance * 0.7
        );
        camera.up.set(0, 0, 1);
        camera.lookAt(controls.target);
      }
      
      function setActiveViewButton(id) {
        document.querySelectorAll('#controls button').forEach(btn => {
          btn.classList.remove('active');
        });
        document.getElementById(id).classList.add('active');
      }
    })();
  </script>
</body>
</html>
    `;
  }

  /**
   * Format time display
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  _formatTime(seconds) {
    if (isNaN(seconds)) return '--:--';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Format distance display
   * @param {number} distance - Distance in mm
   * @returns {string} Formatted distance string
   */
  _formatDistance(distance) {
    if (isNaN(distance)) return '-- mm';
    
    if (distance < 10) {
      return `${distance.toFixed(2)} mm`;
    } else if (distance < 1000) {
      return `${distance.toFixed(1)} mm`;
    } else {
      return `${(distance / 1000).toFixed(2)} m`;
    }
  }
}

module.exports = ThreeJsGCodeVisualizer; 