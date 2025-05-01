#!/bin/bash

# SVG to GCode Converter Documentation Generator
# This script generates HTML documentation from Markdown files

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOCS_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
HTML_DIR="$DOCS_DIR/html"
ASSETS_DIR="$HTML_DIR/assets"

# Print banner
echo "====================================================="
echo "  SVG to GCode Converter - Documentation Generator"
echo "====================================================="
echo

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    echo "Visit https://nodejs.org/ for installation instructions."
    exit 1
fi

# Change to the html-generator directory
cd "$SCRIPT_DIR" || exit

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies. Please check your npm installation."
        exit 1
    fi
    echo "Dependencies installed successfully."
else
    echo "Dependencies already installed."
fi

# Create the HTML directory if it doesn't exist
if [ ! -d "$HTML_DIR" ]; then
    echo "Creating HTML directory..."
    mkdir -p "$HTML_DIR"
fi

# Create the assets directory if it doesn't exist
if [ ! -d "$ASSETS_DIR" ]; then
    echo "Creating assets directory..."
    mkdir -p "$ASSETS_DIR"
fi

# Run the HTML generator script
echo "Generating HTML documentation..."
node generate-html-docs.js
if [ $? -ne 0 ]; then
    echo "Error: Failed to generate HTML documentation."
    exit 1
fi

# Show success message
echo
echo "====================================================="
echo "  Documentation generated successfully!"
echo "  The HTML files are available in: $HTML_DIR"
echo "  Open $HTML_DIR/index.html in your browser to view."
echo "====================================================="

# Optionally open the documentation in the default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Opening documentation in your browser..."
    open "$HTML_DIR/index.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        echo "Opening documentation in your browser..."
        xdg-open "$HTML_DIR/index.html"
    else
        echo "To view the documentation, open $HTML_DIR/index.html in your browser."
    fi
else
    echo "To view the documentation, open $HTML_DIR/index.html in your browser."
fi

exit 0 