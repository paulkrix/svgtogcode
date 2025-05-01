const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Configure marked renderer
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code;

// Setup custom code renderer to handle Mermaid diagrams
renderer.code = function(code, language) {
  if (language === 'mermaid') {
    return `<div class="mermaid">${code}</div>`;
  }
  return originalCodeRenderer.call(this, code, language);
};

marked.setOptions({
  renderer: renderer,
  headerIds: true,
  gfm: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
});

// Configuration
const docsDir = path.join(__dirname, '../../');
const outputDir = path.join(docsDir, 'html');
const assetsDir = path.join(outputDir, 'assets');

// Create output directories if they don't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// Create CSS file
const cssContent = fs.readFileSync(path.join(__dirname, '../../html/assets/style.css'), 'utf8');
fs.writeFileSync(path.join(assetsDir, 'style.css'), cssContent);

// Get a list of markdown files to convert
const mdFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.md'));

// Generate the navigation structure for the sidebar
function generateSidebarNavigation(currentFile) {
  // Define the navigation sections and their respective files
  const navSections = [
    {
      title: 'Getting Started',
      links: [
        { href: 'README.html', label: 'Documentation Overview' },
        { href: 'project_description.html', label: 'Project Overview' },
        { href: 'installation_guide.html', label: 'Installation Guide' }
      ]
    },
    {
      title: 'User Documentation',
      links: [
        { href: 'user_guide.html', label: 'User Guide' }
      ]
    },
    {
      title: 'Technical Documentation',
      links: [
        { href: 'architecture_design.html', label: 'Architecture Design' },
        { href: 'technical_specification.html', label: 'Technical Specification' },
        { href: 'technology_stack.html', label: 'Technology Stack' }
      ]
    },
    {
      title: 'Developer Documentation',
      links: [
        { href: 'developer_guide.html', label: 'Developer Guide' },
        { href: 'implementation_steps.html', label: 'Implementation Steps' },
        { href: 'codebase_improvements.html', label: 'Codebase Improvements' },
        { href: 'assessment_checklists.html', label: 'Assessment Checklists' }
      ]
    }
  ];

  // Generate the HTML for the navigation sidebar
  let sidebarHtml = `
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>SVG to GCode Converter</h2>
      <p>Documentation</p>
    </div>
  `;

  navSections.forEach(section => {
    sidebarHtml += `
    <div class="nav-section">
      <div class="nav-section-title">${section.title}</div>
      <ul class="nav-links">
    `;

    section.links.forEach(link => {
      const isActive = link.href === currentFile || 
                       (currentFile === 'index.html' && link.href === 'README.html');
      const activeClass = isActive ? ' class="active"' : '';
      sidebarHtml += `<li><a href="${link.href}"${activeClass}>${link.label}</a></li>`;
    });

    sidebarHtml += `
      </ul>
    </div>
    `;
  });

  sidebarHtml += `</div>`;
  return sidebarHtml;
}

// Generate the mobile navigation
function generateMobileNav() {
  return `
  <div class="mobile-nav">
    <a href="index.html">Home</a>
    <a href="installation_guide.html">Installation</a>
    <a href="user_guide.html">User Guide</a>
    <a href="developer_guide.html">For Developers</a>
  </div>
  `;
}

// Generate the HTML wrapper for a markdown file
function generateHtmlWrapper(content, title, currentFile) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - SVG to GCode Converter</title>
  <link rel="stylesheet" href="assets/style.css">
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      mermaid.initialize({
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: { 
          useMaxWidth: true,
          htmlLabels: true
        }
      });

      // Add active class to current page link
      const currentPage = window.location.pathname.split('/').pop();
      const navLinks = document.querySelectorAll('.nav-links a');
      navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (currentPage === 'index.html' && linkHref === 'README.html')) {
          link.classList.add('active');
        }
      });
    });
  </script>
</head>
<body>
  ${generateMobileNav()}
  ${generateSidebarNavigation(currentFile)}
  <div class="main-content">
    ${content}
  </div>
</body>
</html>`;
}

// Process each markdown file
console.log('Converting markdown files to HTML...');

// Create special index.html file
const indexContent = fs.readFileSync(path.join(__dirname, '../../html/index.html'), 'utf8');
fs.writeFileSync(path.join(outputDir, 'index.html'), indexContent);
console.log('Created index.html');

// Process each markdown file
mdFiles.forEach(mdFile => {
  const mdFilePath = path.join(docsDir, mdFile);
  const htmlFileName = mdFile.replace('.md', '.html');
  const htmlFilePath = path.join(outputDir, htmlFileName);
  
  // Read and convert the markdown content
  const mdContent = fs.readFileSync(mdFilePath, 'utf8');
  const htmlContent = marked.parse(mdContent);
  
  // Get the title from the first h1 in the content or use filename
  let title = mdFile.replace('.md', '').replace(/_/g, ' ');
  const titleMatch = mdContent.match(/^# (.+)$/m);
  if (titleMatch) {
    title = titleMatch[1];
  }
  
  // Generate the full HTML page
  const fullHtml = generateHtmlWrapper(htmlContent, title, htmlFileName);
  
  // Write the HTML file
  fs.writeFileSync(htmlFilePath, fullHtml);
  console.log(`Converted ${mdFile} to ${htmlFileName}`);
});

// Create special page that lists all available documentation
const allDocsContent = `
<h1>All Available Documentation</h1>
<p>A comprehensive list of all documentation available for the SVG to GCode Converter:</p>
<ul>
${mdFiles.map(file => {
  const name = file.replace('.md', '').replace(/_/g, ' ');
  return `<li><a href="${file.replace('.md', '.html')}">${name}</a></li>`;
}).join('\n')}
</ul>
`;

const allDocsHtml = generateHtmlWrapper(allDocsContent, 'All Documentation', 'all-docs.html');
fs.writeFileSync(path.join(outputDir, 'all-docs.html'), allDocsHtml);

console.log('HTML documentation generated successfully in the docs/html directory.');
console.log('Open docs/html/index.html in your browser to view it.'); 