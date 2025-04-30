# SVG to GCode Converter - Architecture Design

## System Overview

The SVG to GCode Converter is designed as a standalone desktop application that transforms SVG vector files into GRBL-compatible GCode, using grayscale color information to determine cutting depth. The architecture follows a modular pipeline approach to process the input SVG through several transformation stages before producing the final GCode output.

### Component Pipeline Diagram

```mermaid
flowchart LR
    A[Input Handler] --> B[SVG Parser]
    B --> C[Path Processor]
    C --> D[Toolpath Generator]
    D --> E[GCode Generator]
    
    A -.-> F[User Interface]
    B -.-> G[Visualization Engine]
    C -.-> G
    D -.-> G
    E -.-> G
    G -.-> F
    
    classDef main fill:#d86c35,stroke:#fff,stroke-width:2px,color:#fff
    classDef ui fill:#2d7eb5,stroke:#fff,stroke-width:2px,color:#fff
    class A,B,C,D,E main
    class F,G ui
```

## Core Components

### 1. Input Handler
**Purpose**: Manages file input/output operations and validates input files.

**Responsibilities**:
- File loading and validation
- Input format verification
- Configuration parameter management
- Output file management

**Technical Approach**:
- Local file system access
- SVG format validation
- Configuration persistence

(See [Input Handler API](technical_specification.md#1-input-handler-api))

### 2. SVG Parser
**Purpose**: Extracts vector path and color information from SVG files.

**Responsibilities**:
- Parse standard SVG format
- Extract path elements (lines, curves, polygons)
- Process grayscale color attributes
- Normalize coordinate systems
- Handle transformations and groupings

**Technical Approach**:
- Leverage an open-source SVG parsing library (See [Technology Stack](technology_stack.md#svg-processing))
- Create an intermediate representation of paths and attributes
- Normalize to a common coordinate system

(See [SVG Parser API](technical_specification.md#2-svg-parser-api))

### 3. Path Processor
**Purpose**: Converts SVG paths into machining-ready paths with associated depth information.

**Responsibilities**:
- Convert SVG paths to simplified path segments
- Map grayscale values to Z-axis depth values
- Apply scaling and transformations
- Optimize paths for machining efficiency
- Handle filled areas and convert to appropriate toolpaths

**Technical Approach**:
- Path simplification algorithms (See [Path Simplification Algorithm](technical_specification.md#3-svg-path-simplification-algorithm))
- Grayscale mapping functions (linear, custom curves) (See [Grayscale to Depth Mapping Algorithm](technical_specification.md#1-grayscale-to-depth-mapping-algorithm))
- Path combination and optimization (See [Path Optimization Algorithm](technical_specification.md#2-path-optimization-algorithm))

(See [Path Processor API](technical_specification.md#3-path-processor-api))

### 4. Toolpath Generator
**Purpose**: Creates machine-specific toolpaths with appropriate cutting parameters.

**Responsibilities**:
- Generate efficient cutting strategies
- Calculate appropriate feed rates
- Handle tool entry and exit movements
- Apply safety height transitions
- Consider machine constraints

**Technical Approach**:
- Path to toolpath conversion algorithms (See [Toolpath Generation Algorithm](technical_specification.md#4-toolpath-generation-algorithm))
- Cutting strategy implementation (contour, pocket, etc.)
- Machine constraints management
- Collision avoidance

(See [Toolpath Generator API](technical_specification.md#4-toolpath-generator-api))

### 5. GCode Generator
**Purpose**: Produces GRBL-compatible GCode from toolpaths.

**Responsibilities**:
- Format toolpaths as GCode commands
- Add machine-specific commands and parameters
- Optimize for GRBL controller
- Include appropriate headers and safety features
- Format output file

**Technical Approach**:
- GRBL-specific command generation (See [GRBL-Specific GCode Generation](technical_specification.md#5-grbl-specific-gcode-generation))
- GCode optimization techniques
- Proper command sequencing

(See [GCode Generator API](technical_specification.md#5-gcode-generator-api))

### 6. Visualization Engine
**Purpose**: Provides visual feedback throughout the conversion process.

**Responsibilities**:
- Render SVG input
- Visualize resulting toolpaths
- Show depth mapping with color coding
- Display estimated cutting time and path statistics
- Support interactive preview

**Technical Approach**:
- 2D rendering engine (See [Technology Stack](technology_stack.md#frontend))
- Color-coded toolpath visualization
- Support for zooming and panning

(See [Visualization API](technical_specification.md#6-visualization-api))

### 7. User Interface
**Purpose**: Provides user interaction for file handling, parameter configuration, and visualization.

**Responsibilities**:
- Present intuitive controls for all operations
- Display conversion status and results
- Allow parameter adjustment
- Support configuration profiles
- Handle error reporting

**Technical Approach**:
- Modern desktop UI framework (See [Technology Stack](technology_stack.md#frontend))
- Responsive design for different screen sizes
- Intuitive control layout
- Streamlined workflow

(See [User Interface Section in Technical Specification](technical_specification.md#ui-specifications) - *Note: Section needs to be added in Tech Spec*)

### Component Class Diagram

```mermaid
classDiagram
    class InputHandler {
        +loadFile(path)
        +validateInput()
        +saveOutput(gcode, path)
        +getConfiguration()
        +setConfiguration(config)
    }
    
    class SVGParser {
        +parse(svgData)
        +extractPaths()
        +extractColorInfo()
        +normalizeCoordinates()
    }
    
    class PathProcessor {
        +processPaths(paths)
        +mapGrayscaleToDepth(color)
        +optimizePaths()
        +handleFilledAreas()
        +transformPaths(scale, rotation)
    }
    
    class ToolpathGenerator {
        +generateToolpaths(processedPaths)
        +calculateFeedRates()
        +handleToolMovements()
        +applySafetyHeights()
        +optimizeForEfficiency()
    }
    
    class GCodeGenerator {
        +generateGCode(toolpaths)
        +formatGRBLCommands()
        +addSafetyFeatures()
        +optimizeOutput()
    }
    
    class VisualizationEngine {
        +renderSVG(svgData)
        +renderToolpaths(toolpaths)
        +showDepthMap(paths)
        +calculateStatistics()
        +interactivePreview()
    }
    
    class UserInterface {
        +displayStatus(status)
        +showPreview(preview)
        +handleUserInput()
        +showConfiguration()
        +reportErrors(errors)
    }
    
    InputHandler --> SVGParser
    SVGParser --> PathProcessor
    PathProcessor --> ToolpathGenerator
    ToolpathGenerator --> GCodeGenerator
    
    InputHandler --> UserInterface
    VisualizationEngine --> UserInterface
    SVGParser --> VisualizationEngine
    PathProcessor --> VisualizationEngine
    ToolpathGenerator --> VisualizationEngine
    GCodeGenerator --> VisualizationEngine
```

## Data Flow

1. **Input Stage**:
   - User loads SVG file through UI
   - Input Handler validates and processes the file
   - Configuration parameters are applied
   
2. **Processing Stage**:
   - SVG Parser extracts vector paths and attributes
   - Path Processor converts to machine-ready paths with depth
   - Toolpath Generator creates optimized toolpaths
   - Each stage reports progress to UI
   
3. **Output Stage**:
   - GCode Generator creates GRBL-compatible code
   - Visualization Engine renders preview
   - Output statistics are calculated
   - GCode is saved to user-specified location

### Data Flow Diagram

```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    actor User
    participant UI as User Interface
    participant IH as Input Handler
    participant SP as SVG Parser
    participant PP as Path Processor
    participant TG as Toolpath Generator
    participant GG as GCode Generator
    participant VE as Visualization Engine
    
    User->>UI: Load SVG file
    UI->>IH: Process file
    IH->>SP: Parse SVG
    SP-->>VE: Send SVG data
    VE-->>UI: Display original SVG
    SP->>PP: Send paths
    
    PP->>PP: Map grayscale to depth
    PP-->>VE: Send processed paths
    VE-->>UI: Update preview with depth
    PP->>TG: Send processed paths
    
    TG->>TG: Generate toolpaths
    TG-->>VE: Send toolpaths
    VE-->>UI: Update toolpath preview
    TG->>GG: Send toolpaths
    
    GG->>GG: Generate GCode
    GG-->>VE: Send GCode preview
    VE-->>UI: Update GCode preview
    GG-->>IH: Return GCode
    
    User->>UI: Save GCode
    UI->>IH: Save to file
    IH-->>UI: Confirm save
    UI-->>User: Display completion
```

## Technical Architecture

### Application Structure
- Standalone desktop application
- Cross-platform compatibility (optional)
- Completely offline operation
- Local file system access only

### Development Approach
- Modular component design
- Clear interfaces between components
- Open-source libraries for SVG parsing and visualization
- Unit tests for core algorithms

### Component Architecture Diagram

```mermaid
flowchart TB
    subgraph UI [User Interface Layer]
        UI1[Main UI]
        UI2[Configuration Dialog]
        UI3[Preview Panel]
    end
    
    subgraph Core [Core Processing Layer]
        C1[SVG Parser]
        C2[Path Processor]
        C3[Toolpath Generator]
        C4[GCode Generator]
    end
    
    subgraph Services [Service Layer]
        S1[File I/O Service]
        S2[Configuration Service]
        S3[Visualization Service]
    end
    
    subgraph Data [Data Layer]
        D1[SVG Data]
        D2[Path Data]
        D3[Toolpath Data]
        D4[GCode Data]
        D5[Configuration Data]
    end
    
    UI1 --> S1
    UI1 --> S2
    UI1 --> S3
    UI2 --> S2
    UI3 --> S3
    
    S1 --> D1
    S1 --> D4
    S2 --> D5
    S3 --> D1
    S3 --> D2
    S3 --> D3
    S3 --> D4
    
    C1 --> D1
    C1 --> D2
    C2 --> D2
    C3 --> D2
    C3 --> D3
    C4 --> D3
    C4 --> D4
    
    S1 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> C4
    
    classDef ui fill:#2d7eb5,stroke:#fff,stroke-width:1px,color:#fff
    classDef core fill:#d86c35,stroke:#fff,stroke-width:1px,color:#fff
    classDef service fill:#3c9566,stroke:#fff,stroke-width:1px,color:#fff
    classDef data fill:#b05c8c,stroke:#fff,stroke-width:1px,color:#fff
    
    class UI1,UI2,UI3 ui
    class C1,C2,C3,C4 core
    class S1,S2,S3 service
    class D1,D2,D3,D4,D5 data
```

### Libraries and Dependencies
- SVG parsing library (e.g., SVG.js, SVGO)
- 2D graphics library for visualization
- Desktop UI framework
- File system access library
- Geometry processing libraries

(See [Technology Stack](technology_stack.md) for full list)

### Performance Considerations
- Efficient path optimization algorithms
- Memory management for large SVG files
- Progressive processing for responsive UI
- Background processing for compute-intensive tasks

## Extensibility

The architecture is designed to be extensible in several ways:

1. **Plugin System**: Support for future extensions through a plugin architecture
   - Custom toolpath strategies
   - Additional file format support
   - Machine-specific post-processors

2. **Configuration Profiles**: Support for saving and loading machine-specific configurations
   - Tool libraries
   - Material settings
   - Machine constraints

3. **Custom Mapping Functions**: Extensible grayscale-to-depth mapping mechanisms
   - Linear mapping
   - Custom curves
   - Lookup tables

### Plugin Architecture Diagram

```mermaid
flowchart TB
    subgraph Core [Core System]
        C1[Core Components]
        PI[Plugin Interface]
    end
    
    subgraph Plugins [Plugins]
        P1[Toolpath Strategies]
        P2[File Format Converters]
        P3[Post-Processors]
        P4[Custom Mapping Functions]
    end
    
    C1 <--> PI
    PI <--> P1
    PI <--> P2
    PI <--> P3
    PI <--> P4
    
    classDef core fill:#d86c35,stroke:#fff,stroke-width:1px,color:#fff
    classDef plugin fill:#3c9566,stroke:#fff,stroke-width:1px,color:#fff
    class C1,PI core
    class P1,P2,P3,P4 plugin
```

## Development Roadmap

### Phase 1: Core Functionality
- Basic SVG parsing
- Simple grayscale-to-depth mapping
- GRBL GCode generation
- Minimal UI

### Phase 2: Advanced Features
- Path optimization
- Enhanced visualization
- Configuration profiles
- Advanced toolpath strategies

### Phase 3: Community Features
- Plugin architecture
- Community sharing
- Additional machine support
- Enhanced documentation

### Roadmap Timeline

```mermaid
%%{init: {'theme': 'dark'}}%%
gantt
    title Development Roadmap
    dateFormat  YYYY-MM-DD
    
    section Phase 1
    SVG Parsing             :p1_1, 2023-01-01, 30d
    Grayscale Mapping       :p1_2, after p1_1, 20d
    Basic GRBL Output       :p1_3, after p1_2, 15d
    Minimal UI              :p1_4, after p1_3, 25d
    
    section Phase 2
    Path Optimization       :p2_1, after p1_4, 30d
    Enhanced Visualization  :p2_2, after p2_1, 25d
    Configuration Profiles  :p2_3, after p2_2, 20d
    Advanced Toolpaths      :p2_4, after p2_3, 30d
    
    section Phase 3
    Plugin Architecture     :p3_1, after p2_4, 35d
    Community Features      :p3_2, after p3_1, 25d
    Additional Machine Support :p3_3, after p3_2, 20d
    Documentation          :p3_4, after p3_3, 15d
```

## Deployment Considerations

### Installation
- Simple installer for hobbyist users
- Minimal dependencies
- Small footprint

### Updates
- Local update mechanism
- Version compatibility
- Configuration migration

### System Requirements
- Standard desktop/laptop
- Local file system access
- No internet requirement
- Minimal resource usage 