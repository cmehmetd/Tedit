# AGENTS.md — Tedit Development Guide

This document describes the current architecture and conventions for contributors and AI coding agents working on Tedit.

## Project overview

| Property | Current value |
|---|---|
| Project | Tedit |
| Type | Browser-based YouTube thumbnail editor |
| Stack | Vanilla JavaScript, HTML5 Canvas API, CSS3 |
| Dependencies | No npm or runtime dependencies |
| Entry point | `index.html` |
| Logical canvas | 1280 × 720 px |
| Current source size | `app.js` ~1,895 lines, `style.css` ~1,101 lines, `index.html` ~372 lines |

The editor is client-side only. It has no backend and does not persist projects between page reloads. Google Fonts and Material Symbols are external UI dependencies and require a network connection for the complete visual experience.

## Repository layout

```text
Tedit/
├── index.html     # DOM structure, panels, controls, and canvas elements
├── style.css      # Dark theme, floating panels, controls, and responsive layout
├── app.js         # State, rendering, interactions, layer operations, and export
├── README.md      # Developer-facing project documentation
├── AGENTS.md      # This guide
└── LICENSE        # License text, when present in the checkout
```

## Application architecture

All application logic is inside one `DOMContentLoaded` callback in `app.js`. State and helper functions are intentionally kept private; nothing is exported to the global scope.

### Main code areas

| Area | Approximate location | Responsibility |
|---|---:|---|
| State and DOM references | `app.js` 1–125 | Canvas contexts, state, controls |
| Initialization and scaling | 126–240 | Startup, responsive canvas sizing, zoom transform |
| History | 241–310 | Snapshot creation, undo, redo, image restoration |
| Rendering | 311–636 | Background, layers, live drawing, snap guides |
| Selection and pointer interaction | 637–1000 | Hit testing, moving, resizing, rotation, panning |
| Layer creation and tools | 1001–1215 | Text, shapes, images, freehand strokes, background removal |
| UI and layers panel | 1217–1410 | Properties synchronization and drag-and-drop ordering |
| Export and event bindings | 1411–1895 | PNG/JPG output, controls, keyboard shortcuts |

Line ranges are orientation only; update this table if major sections are reorganized.

## Canvas and coordinate model

Two canvases share the logical 1280 × 720 coordinate space:

| Element | Purpose |
|---|---|
| `#main-canvas` | Final composition and export source |
| `#interactive-canvas` | Selection handles, alignment guides, and live drawing preview |

`state.scale` controls responsive display sizing. `state.userZoom`, `state.panX`, and `state.panY` are applied to `#canvas-wrapper` with a CSS transform. Layer coordinates must remain in logical canvas space.

Pointer coordinates are converted from the displayed interactive canvas as follows:

```js
const rect = interactiveCanvas.getBoundingClientRect();
const canvasX = ((event.clientX - rect.left) / rect.width) * state.canvasWidth;
const canvasY = ((event.clientY - rect.top) / rect.height) * state.canvasHeight;
```

Always use `state.canvasWidth` and `state.canvasHeight`; do not add new hard-coded canvas dimensions.

## State model

The central state object currently includes:

```js
{
  canvasWidth: 1280,
  canvasHeight: 720,
  backgroundColor: '#FFFFFF',
  layers: [],
  selectedLayerId: null,
  activeTool: 'select', // 'select' | 'drawing'
  history: [],
  historyIndex: -1,
  scale: 1,
  userZoom: 1,
  panX: 0,
  panY: 0,
  isPanning: false,
  snapLines: { x: false, y: false },
  drawingBrush: { color: '#FF2B2B', size: 12, points: [] }
}
```

Layer order is significant: `state.layers[0]` renders first and is the bottom layer. The layer panel displays the array in reverse order so the top layer appears first.

## Layer data model

All layers have `id`, `type`, `x`, `y`, `width`, `height`, `rotation`, `opacity`, and `visible`. User-facing layers also have a `name` field.

### Text layer

```js
{
  type: 'text',
  text, fontFamily, fontSize,
  fill, stroke, strokeWidth, shadow,
  x, y, width, height, rotation, opacity, visible, name
}
```

### Shape layer

All supported geometric shapes use one layer type and select the concrete shape with `shapeType`:

```js
{
  type: 'shape',
  shapeType: 'rect' | 'circle' | 'star' | 'arrow' | 'badge',
  fill, fillEnabled, stroke, strokeWidth, radius,
  x, y, width, height, rotation, opacity, visible, name
}
```

### Image layer

```js
{
  type: 'image',
  _imgElement: HTMLImageElement,
  x, y, width, height, rotation, opacity, visible, name
}
```

Image history snapshots store `_imgSrc` instead of serializing `_imgElement`. `restoreState()` recreates the image element from that data URL.

### Drawing layer

```js
{
  type: 'drawing',
  points: Array<{ x: number, y: number }>,
  strokeColor, strokeWidth,
  x, y, width, height, rotation, opacity, visible, name
}
```

Freehand points are normalized around the stroke center when the layer is created. While drawing, points remain temporarily in `state.drawingBrush.points` and are committed with `saveStrokeLayer()`.

## Mutation and rendering rules

For a persistent document change, use the established sequence:

```js
saveHistoryState();
render();
updateUI(); // when properties or layer controls changed
```

During continuous pointer movement, update the layer and call `render()` for responsiveness; save one history snapshot when the interaction is committed on pointer-up or control change. Do not add history entries for every mousemove.

When adding a new layer type or tool:

1. Add the layer factory data and a stable `type` value.
2. Handle it in `renderLayer()` and any relevant drawing helper.
3. Add its display name and icon to `renderLayersPanel()`.
4. Add property controls and synchronization in `updateUI()` and `bindEvents()`.
5. Include it in history, visibility, duplication, deletion, hit testing, and export paths.
6. Add a manual regression check to the README or test notes.

## Current tools and behaviors

- Canvas orientation: the top-center `Yatay | Dikey` control defaults to landscape and switches between 1280 x 720 and 1080 x 1920.
- Export filenames use the active canvas dimensions, such as `Tedit_Thumbnail_1080x1920.png` in portrait mode.

- Text: font family, 16–250 px size, fill, stroke, stroke width, and shadow.
- Shapes: rectangle, circle, star/burst, arrow, and badge; fill toggle, fill/stroke colors, stroke width, and radius.
- Drawing: continuous freehand mode with brush size 2–60 px; finish with the drawing control or `Escape`.
- Images: local `image/*` uploads are converted to data URLs by `FileReader`.
- Background removal: image-only tool that removes pixels near a selected color using a configurable 0–150 tolerance; it creates a processed data-URL image for the selected image layer.
- Layers: select, hide/show, reorder via HTML5 drag-and-drop, move up/down, duplicate, delete, and opacity 0–100%.
- Alignment: center snapping exposes horizontal/vertical guides through `state.snapLines`.
- Export: `mainCanvas.toDataURL()` produces PNG or JPG files named `Tedit_Thumbnail_1280x720.*`.

## UI language

The UI is English-only. All user-facing strings live directly in the `index.html` markup and layer names are generated in English in `app.js`. There is no translation layer, so add new labels directly in English.

## CSS conventions

Visual constants should use the custom properties in `:root` in `style.css`, including `--bg-main`, `--bg-panel`, `--accent-color`, `--brand-red`, `--danger-color`, and `--panel-width`. Avoid introducing repeated color or spacing literals when a theme variable exists. Preserve the floating-panel layout and the canvas viewport's stacking order.

## Keyboard and pointer controls

| Control | Action |
|---|---|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Mouse Wheel` | Zoom, clamped to 25%–350% |
| `Ctrl/Cmd + 0` | Reset zoom and pan |
| `Space + Drag` or middle-button drag | Pan |
| Arrow keys | Move selected layer by 2 px; `Shift` moves by 10 px |
| `Delete` / `Backspace` | Delete selected layer |
| `Escape` | Exit drawing mode or clear selection |

## Validation

The orientation control and dimension-based export filename must be tested in both modes.

There is no automated test suite or build pipeline. Validate changes manually in a modern browser:

1. Load the page and confirm both canvases initialize without console errors.
2. Add, edit, move, resize, rotate, hide, duplicate, reorder, and delete each layer type.
3. Draw multiple strokes without leaving drawing mode and verify each stroke becomes a layer.
4. Upload an image, remove a background, then test undo/redo and export.
5. Verify center snapping, zoom limits, panning, keyboard movement, and responsive resizing.
6. Export PNG and JPG and confirm the output dimensions are 1280 × 720.
7. Check text nodes, tooltips, placeholders, and shape labels are all in English.

## Known limitations

- No project persistence or import/export of editable layer data.
- History is limited to 30 snapshots and does not include viewport zoom/pan.
- No multi-selection, grouping, or alignment to arbitrary guides.
- Touch editing is not a dedicated interaction path.
- Background removal is color/tolerance based and is not semantic image segmentation.
- No automated tests, linting, or dependency management are configured.

## Safety and scope

Do not modify or discard unrelated working-tree changes. Before committing, inspect `git status` and stage only the files relevant to the requested task. Avoid destructive Git commands such as `reset --hard` or `checkout --` unless explicitly requested.
