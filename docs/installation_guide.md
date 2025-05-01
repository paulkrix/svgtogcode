# SVG to GCode Converter - Installation Guide

This guide will help you install the SVG to GCode Converter on your system.

## System Requirements

Before installing, ensure your system meets these minimum requirements:

- **Operating System**:
  - Windows 10 or 11 (64-bit)
  - macOS 10.14 or later
  - Linux (Ubuntu 18.04+, Debian 10+, Fedora 30+, or similar)
- **Hardware**:
  - 4GB RAM (8GB recommended for large SVG files)
  - 200MB free disk space
  - 1280x720 screen resolution or higher
- **Additional**:
  - Internet connection (for updates)

## Installation Instructions

### Windows

1. **Download the installer**:
   - Go to the [releases page](https://github.com/svg-to-gcode/svg-to-gcode-converter/releases)
   - Download the latest `SVG-to-GCode-Converter-Setup-x.x.x.exe` file

2. **Run the installer**:
   - Double-click the downloaded `.exe` file
   - If you see a security warning, click "More info" and then "Run anyway"
   - Follow the on-screen instructions
   - Choose the installation location (default is recommended)
   - Select whether to create desktop and Start menu shortcuts

3. **Launch the application**:
   - After installation completes, you can launch the application from:
     - The desktop shortcut (if created)
     - The Start menu
     - The installation directory

### macOS

1. **Download the disk image**:
   - Go to the [releases page](https://github.com/svg-to-gcode/svg-to-gcode-converter/releases)
   - Download the latest `SVG-to-GCode-Converter-x.x.x.dmg` file

2. **Install the application**:
   - Double-click the downloaded `.dmg` file to open it
   - Drag the SVG to GCode Converter icon to the Applications folder
   - Eject the disk image

3. **First Launch**:
   - Open the Applications folder
   - Right-click (or Ctrl+click) on "SVG to GCode Converter"
   - Select "Open" from the context menu
   - Click "Open" on the security dialog (only needed the first time)

### Linux

#### AppImage (Recommended for most users)

1. **Download the AppImage**:
   - Go to the [releases page](https://github.com/svg-to-gcode/svg-to-gcode-converter/releases)
   - Download the latest `SVG-to-GCode-Converter-x.x.x.AppImage` file

2. **Make it executable**:
   - Open a terminal
   - Navigate to the download location
   - Run: `chmod +x SVG-to-GCode-Converter-x.x.x.AppImage`

3. **Run the application**:
   - Double-click the AppImage file or run it from terminal:
   - `./SVG-to-GCode-Converter-x.x.x.AppImage`

#### Debian/Ubuntu (.deb)

1. **Download the package**:
   - Go to the [releases page](https://github.com/svg-to-gcode/svg-to-gcode-converter/releases)
   - Download the latest `svg-to-gcode-converter_x.x.x_amd64.deb` file

2. **Install the package**:
   - Open a terminal
   - Navigate to the download location
   - Run: `sudo apt install ./svg-to-gcode-converter_x.x.x_amd64.deb`

3. **Launch the application**:
   - From the applications menu, or
   - Run `svg-to-gcode-converter` in terminal

#### Fedora/RHEL/CentOS (.rpm)

1. **Download the package**:
   - Go to the [releases page](https://github.com/svg-to-gcode/svg-to-gcode-converter/releases)
   - Download the latest `svg-to-gcode-converter-x.x.x.x86_64.rpm` file

2. **Install the package**:
   - Open a terminal
   - Navigate to the download location
   - Run: `sudo dnf install ./svg-to-gcode-converter-x.x.x.x86_64.rpm`

3. **Launch the application**:
   - From the applications menu, or
   - Run `svg-to-gcode-converter` in terminal

## Development Installation

For developers who want to run the application from source:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/svg-to-gcode/svg-to-gcode-converter.git
   cd svg-to-gcode-converter
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run dev
   ```

## Troubleshooting Installation Issues

### Windows

- **"Windows protected your PC" message**:
  - Click "More info" and then "Run anyway"
  - This happens because the app is not signed with a Microsoft-verified certificate

- **Missing DLL error**:
  - Install the latest [Visual C++ Redistributable](https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads)

### macOS

- **"App is damaged and can't be opened" message**:
  - Open System Preferences > Security & Privacy
  - Click "Open Anyway" for the application
  - Or run: `xattr -d com.apple.quarantine /Applications/SVG\ to\ GCode\ Converter.app`

- **"App is from an unidentified developer" message**:
  - Right-click (or Ctrl+click) on the app in Finder
  - Select "Open" from the context menu
  - Click "Open" in the dialog

### Linux

- **AppImage not launching**:
  - Ensure it's executable: `chmod +x SVG-to-GCode-Converter-x.x.x.AppImage`
  - Install required libraries: `sudo apt install libfuse2` (on newer systems)

- **Missing dependencies on older systems**:
  - Install required packages: 
    ```
    sudo apt update
    sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libuuid1
    ```

## Uninstallation

### Windows
- Use "Add or Remove Programs" in the Windows Settings
- Or run the uninstaller from the installation directory

### macOS
- Drag the application from the Applications folder to the Trash
- Optionally run: `rm -rf ~/Library/Application\ Support/svg-to-gcode-converter/`

### Linux
- AppImage: Simply delete the AppImage file
- Debian/Ubuntu: `sudo apt remove svg-to-gcode-converter`
- Fedora/RHEL: `sudo dnf remove svg-to-gcode-converter`

## Getting Support

If you encounter any issues during installation:

1. Check the [Troubleshooting](#troubleshooting-installation-issues) section above
2. Visit our [GitHub Issues](https://github.com/svg-to-gcode/svg-to-gcode-converter/issues) page
3. Join our community forum for support
4. Contact support at support@svgtogcode.com 