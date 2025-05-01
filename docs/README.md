# SVG to GCode Converter Documentation

Welcome to the official documentation for the SVG to GCode Converter, an open-source tool designed to transform SVG vector graphics into GRBL-compatible GCode instructions, with special support for grayscale-to-depth mapping.

## Documentation Structure

### Getting Started
- [Project Overview](project_description.md) - Introduction to the project, its purpose and key features
- [Installation Guide](installation_guide.md) - Step-by-step instructions for installing the application
- [Quick Start Guide](user_guide.md#quick-start) - Get up and running quickly with essential operations

### User Documentation
- [User Guide](user_guide.md) - Comprehensive guide for using the application
- [Tutorials](user_guide.md#tutorials) - Step-by-step guides for common tasks
- [FAQ](user_guide.md#frequently-asked-questions) - Answers to common questions

### Technical Documentation
- [Architecture Design](architecture_design.md) - System architecture, component design, and data flow
- [Technical Specification](technical_specification.md) - Detailed API definitions and algorithms
- [Technology Stack](technology_stack.md) - Languages, frameworks, and libraries used

### Developer Documentation
- [Developer Guide](developer_guide.md) - Guide for developers contributing to the project
- [Implementation Steps](implementation_steps.md) - Step-by-step implementation guidance
- [Codebase Improvements](codebase_improvements.md) - Ongoing improvements and technical debt
- [Assessment Checklists](assessment_checklists.md) - Quality evaluation guides

## View Documentation

### HTML Documentation

This repository includes a tool to generate an HTML version of this documentation with proper rendering of Mermaid diagrams:

```bash
# On Windows
docs/tools/html-generator/generate-docs.bat

# On macOS/Linux
docs/tools/html-generator/generate-docs.sh
```

The generated HTML documentation will be available in the `docs/html` directory. Open `docs/html/index.html` in your browser to view it.

## Documentation Diagram

```mermaid
graph TD
    A[SVG to GCode Converter Docs] --> B[Getting Started]
    A --> C[User Documentation]
    A --> D[Technical Documentation]
    A --> E[Developer Documentation]
    
    B --> B1[Project Overview]
    B --> B2[Installation Guide]
    B --> B3[Quick Start Guide]
    
    C --> C1[User Guide]
    C --> C2[Tutorials]
    C --> C3[FAQ]
    
    D --> D1[Architecture Design]
    D --> D2[Technical Specification]
    D --> D3[Technology Stack]
    
    E --> E1[Developer Guide]
    E --> E2[Implementation Steps]
    E --> E3[Codebase Improvements]
    E --> E4[Assessment Checklists]
    
    classDef category fill:#4285F4,stroke:#fff,stroke-width:2px,color:#fff
    classDef document fill:#34A853,stroke:#fff,stroke-width:2px,color:#fff
    class A category
    class B,C,D,E category
    class B1,B2,B3,C1,C2,C3,D1,D2,D3,E1,E2,E3,E4 document
```

## Contributing to Documentation

We welcome contributions to improve this documentation. Please follow these guidelines:

1. Use Markdown formatting for consistency
2. Add Mermaid diagrams where visualization would be helpful
3. Keep the language clear and accessible 
4. Follow the established structure
5. Test all internal and external links

To contribute, please submit a pull request with your changes.

## Documentation Updates

All documentation is regularly updated to reflect the latest changes in requirements, architecture, and implementation details. Check the repository for the most up-to-date information. 