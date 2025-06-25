# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Figma to eDocument converter that transforms Figma Raw plugin JSON exports into Salesforce eDocument-compatible JSON format. The project exists in two forms:

1. **Node.js CLI tool** (`figma-to-edocument-converter.js`) - Command-line conversion utility
2. **Browser-based GUI** (`index.html`, `app.js`, `converter-browser.js`, `styles.css`) - Web interface with preview and advanced features

## Core Architecture

### Conversion Engine (`FigmaToEDocumentConverter` class)
The main conversion logic exists in two variants:
- **Node.js version**: Basic conversion with A4 fixed output
- **Browser version**: Enhanced with paper size selection, scaling, collision detection, and preview

**Key conversion process:**
1. **Automatic Detection**: Check for `textContent` array in Figma JSON
2. **Path-based Conversion**: If `textContent` exists, use path-based element mapping for higher accuracy
3. **Fallback Conversion**: Use hierarchical layout calculation if no `textContent` available
4. Parse Figma JSON hierarchy (frames, groups, text, shapes)
5. Calculate coordinates using path analysis or relative layout positions  
6. Convert pixel coordinates to millimeter-based eDocument format
7. Transform text styling (fonts, colors, alignment)
8. Handle image/shape elements as placeholders or image types

### Coordinate System Transformation
- **Input**: Figma pixels (0,0 top-left, nested layout hierarchy)
- **Output**: eDocument millimeters (A4 paper dimensions)
- **Conversion**: 1px = 0.264583mm (96DPI standard)
- **Challenge**: Figma exports lack absolute coordinates, requiring hierarchical layout calculation

### Browser GUI Features
- Drag & drop file upload with validation
- Paper size selection (A4, A3, B4, B5, Letter, Legal)
- Scale factor adjustment (0.1x to 3.0x)
- Visual preview of converted layout
- Element mapping table showing Figma→eDocument coordinate translation
- Collision detection to prevent element overlap
- A4-optimized sizing constraints

## Common Commands

### CLI Conversion
```bash
# Basic conversion
node figma-to-edocument-converter.js "input.json" "output.json"

# Using npm script
npm run convert -- "input.json" "output.json"
```

### Testing
```bash
# Run test suite
npm test

# Test with sample files
node test-converter.js
```

### Browser Development
```bash
# Open in browser (file:// protocol)
open index.html

# Or serve locally
python3 -m http.server 8000
# Then open http://localhost:8000
```

## Critical Implementation Details

### Layout Calculation Strategy
The converter handles Figma's hierarchical layout system by:
1. Analyzing frame names to infer layout types (`header`, `groups`, `text`, `content`)
2. Calculating child element positions based on parent layout modes (`HORIZONTAL`/`VERTICAL`)
3. Using spacing heuristics (10px horizontal, 5px vertical gaps)
4. Applying intelligent collision detection for optimal placement

### Element Size Constraints (Browser Version)
- Maximum width: 80% of paper width minus margins
- Maximum height: 60% of paper height minus margins  
- Minimum readable size: 8mm
- Text height minimum: 15mm for readability

### Collision Detection Algorithm
50-attempt positioning system:
- Attempts 1-25: Move right/down with wrapping
- Attempts 26-50: Grid-based positioning (20mm grid)
- Fallback: Constrained positioning within paper bounds

## Data Formats

### Figma Input Structure
Exported via Figma Raw plugin with hierarchical node structure:
- `type`: NODE_TYPE (TEXT, RECTANGLE, FRAME, etc.)
- `width`, `height`: Element dimensions in pixels
- `children[]`: Nested elements array
- `characters`: Text content (for TEXT nodes)
- `fills[]`, `strokes[]`: Styling information

### Path-based Conversion System

The converter automatically detects and uses Figma Raw plugin's `textContent` array for enhanced accuracy:
- **textContent Detection**: Automatically switches to path-based conversion when `textContent` array is present
- **Path Mapping**: Uses hierarchical path strings to precisely locate and match text elements
- **Coordinate Calculation**: Employs path-based position estimation using segment analysis
- **Fallback Support**: Seamlessly falls back to traditional hierarchical parsing when `textContent` is unavailable

### Smart Element Filtering

The converter automatically excludes meaningless elements:
- **Skipped Image Elements**: `type: "RECTANGLE"` with `name: "Image"` containing `imageHash` are excluded as they cannot be imported into eDocument
- **Small Decorative Images**: Images smaller than 20x20px are considered decorative and excluded
- **Debug Tracking**: All skipped elements are logged in debug info with reasons and statistics displayed in the mapping table

### eDocument Output Structure
Salesforce-compatible JSON with:
- `panels[].printElements[]`: Array of positioned elements
- Element positioning in millimeters with `left`, `top`, `width`, `height`
- `printElementType.type`: "text", "image", or "table"
- Font sizing in points, colors in hex format

## Known Limitations

### Requires Manual Adjustment
- Data binding to Salesforce objects
- Dynamic table row counts
- Conditional visibility logic
- Mathematical formulas
- Image URLs (security restriction)
- Complex vector paths
- Animation effects

### Current Conversion Gaps
- Figma Auto Layout → eDocument positioning (approximated via heuristics)
- Complex nested transformations
- Advanced text styling (gradients, shadows)
- Non-standard fonts availability in Salesforce

## Workflow Integration

The typical usage flow:
1. Design in Figma with meaningful element names
2. Export via Figma Raw plugin
3. Convert using browser GUI or CLI tool
4. Preview and validate layout
5. Download eDocument JSON
6. Import into Salesforce eDocument
7. Manually configure data bindings and dynamic elements

## Files to Focus On

- `converter-browser.js`: Core conversion logic with all latest improvements
- `app.js`: Browser UI event handling and file management  
- `index.html`: Complete GUI interface
- `Figjson_conversion_workflow.md`: Detailed workflow documentation
- `Test_preprod_precontract.json`: Reference eDocument format example