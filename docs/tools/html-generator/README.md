# HTML Documentation Generator

This directory contains a script to convert the Markdown documentation to HTML format, including proper rendering of Mermaid diagrams.

## Features

- Converts all Markdown files in the docs directory to HTML
- Renders Mermaid diagrams using the Mermaid.js library
- Creates a navigation menu for easy access to all documentation pages
- Generates an index page with links to all documents
- Uses a clean, responsive layout for better readability

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)

## Usage

### Windows

Run the batch script from the main docs directory:

```
cd docs
tools\html-generator\generate-docs.bat
```

### macOS/Linux

Run the shell script from the main docs directory:

```
cd docs
./tools/html-generator/generate-docs.sh
```

### Manual Execution

If the scripts don't work for your environment, you can run the commands manually:

```bash
cd docs/tools/html-generator
npm install
node generate-html-docs.js
```

This will generate HTML files in the `docs/html` directory. You can then:
- Open `docs/html/index.html` in your browser
- Run `npm start` to start a local server that will open the documentation in your browser

## Output Structure

After generating the HTML documentation, you'll have the following structure:

```
docs/
├── html/
│   ├── assets/
│   │   └── style.css
│   ├── index.html
│   ├── architecture_design.html
│   ├── technical_specification.html
│   ├── technology_stack.html
│   ├── codebase_improvements.html
│   └── ... (other documentation files)
├── tools/
│   └── html-generator/
│       ├── generate-html-docs.js
│       ├── package.json
│       ├── generate-docs.bat
│       ├── generate-docs.sh
│       └── README.md
└── ... (original markdown files)
```

## Updating Documentation

When you update the Markdown documentation files, simply run the generator script again to regenerate the HTML files with the latest content.

## Technical Details

- The HTML conversion is performed using the `marked` library
- Mermaid diagrams are rendered client-side using the Mermaid.js library
- The layout is responsive and works well on desktop and mobile devices 