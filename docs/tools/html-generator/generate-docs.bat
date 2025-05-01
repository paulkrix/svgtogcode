@echo off
echo ==========================================================
echo   SVG to GCode Converter - Documentation Generator
echo ==========================================================
echo.

rem Get the directory of this script
set "SCRIPT_DIR=%~dp0"
set "DOCS_DIR=%SCRIPT_DIR%..\..\"
set "HTML_DIR=%DOCS_DIR%html"
set "ASSETS_DIR=%HTML_DIR%\assets"

rem Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in the PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

rem Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed or not in the PATH.
    echo Please install npm as part of Node.js from https://nodejs.org/
    pause
    exit /b 1
)

rem Change to the html-generator directory
cd /d "%SCRIPT_DIR%"

rem Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install dependencies. Please check your npm installation.
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
) else (
    echo Dependencies already installed.
)

rem Create the HTML directory if it doesn't exist
if not exist "%HTML_DIR%" (
    echo Creating HTML directory...
    mkdir "%HTML_DIR%"
)

rem Create the assets directory if it doesn't exist
if not exist "%ASSETS_DIR%" (
    echo Creating assets directory...
    mkdir "%ASSETS_DIR%"
)

rem Generate HTML documentation
echo Generating HTML documentation...
node generate-html-docs.js
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to generate HTML documentation.
    pause
    exit /b 1
)

rem Show success message
echo.
echo ==========================================================
echo   Documentation generated successfully!
echo   The HTML files are available in: %HTML_DIR%
echo   Open %HTML_DIR%\index.html in your browser to view.
echo ==========================================================

rem Automatically open the documentation in the default browser
echo Opening documentation in your browser...
start "" "%HTML_DIR%\index.html"

pause 