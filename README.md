# Tedit

> A client-side YouTube thumbnail editor built with the HTML5 Canvas API, vanilla JavaScript, and CSS.

![Status](https://img.shields.io/badge/status-active-27B3FF?style=for-the-badge) ![Technology](https://img.shields.io/badge/technology-vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript)

Tedit is a zero-build, browser-based visual editor for creating YouTube thumbnails. It runs entirely on the client, requires no server or npm dependencies, and exports artwork at the YouTube-standard **1280 × 720** resolution.

Live demo: [cmehmetd.github.io/Tedit](https://cmehmetd.github.io/Tedit/)

## Features

- Text layers with selectable fonts, size, color, stroke, and shadow.
- Rectangle, circle, starburst, arrow, and badge shape layers.
- Freehand drawing with configurable brush color and size.
- Local image uploads through `FileReader` and image layers.
- Layer ordering, visibility, duplication, deletion, opacity, and drag-and-drop reordering.
- Selection handles for moving, resizing, and rotating layers.
- Center snapping with visual alignment guides.
- Undo/redo history with a 30-step limit.
- Viewport zoom and spacebar-based panning.
- PNG and JPG export at the fixed logical canvas size.

## Getting started

No installation or build step is required.

1. Clone or download the repository.
2. Open `index.html` in a modern browser.
3. Alternatively, serve the directory with any static HTTP server and open the local URL.

Google Fonts and Material Symbols are loaded remotely, so the complete UI requires an internet connection. The editor itself does not send project data to a backend.

## Repository structure

```text
Tedit/
├── index.html     # Application markup and panel layout
├── style.css      # Theme, layout, controls, and responsive styles
├── app.js         # Application state, canvas renderer, interactions, and export
├── README.md      # Developer documentation
├── AGENTS.md      # Repository guidance for AI-assisted development
└── LICENSE        # Project license, when included in the checkout
```

## Architecture

The application logic is contained in one `DOMContentLoaded` module in `app.js`; it intentionally does not expose application state or functions globally.

### Rendering model

Tedit uses two canvases with a shared logical coordinate system:

| Canvas | ID | Responsibility |
|---|---|---|
| Output canvas | `#main-canvas` | Renders the final 1280 × 720 composition used for export |
| Interaction canvas | `#interactive-canvas` | Renders selection handles, snap guides, and drawing previews |

The render pipeline clears the output canvas, paints the background, renders layers from bottom to top, and then draws interaction-only overlays. Viewport zoom and pan affect the displayed wrapper through CSS transforms; layer coordinates remain in logical canvas space.

### Application state

The central `state` object contains the document, selection, history, and viewport state:

```js
{
  canvasWidth: 1280,
  canvasHeight: 720,
  backgroundColor: '#FFFFFF',
  layers: [],
  selectedLayerId: null,
  history: [],
  historyIndex: -1,
  userZoom: 1,
  panX: 0,
  panY: 0,
  activeTool: 'select',
  drawingBrush: { color, size, points }
}
```

Layer order is significant: `state.layers[0]` is the bottom-most layer. Every visual mutation should follow the project convention:

```js
saveHistoryState();
render();
updateUI(); // when the properties or layer panels are affected
```

### Layer model

All layers share `id`, `type`, `x`, `y`, `width`, `height`, `rotation`, `opacity`, `visible`, and `label` fields. Type-specific data includes:

| Type | Additional data |
|---|---|
| `text` | `text`, `fontFamily`, `fontSize`, `color`, `strokeColor`, `strokeWidth`, `shadow` |
| `rect` | `fillEnabled`, `fillColor`, `strokeColor`, `strokeWidth`, `radius` |
| `circle`, `star`, `arrow`, `badge` | `fillEnabled`, `fillColor`, `strokeColor`, `strokeWidth` |
| `image` | `_imgElement` for rendering and `_imgSrc` for history snapshots |
| `freehand` | `points`, `color`, and `size` |

When adding a new layer type, update the layer factory, `renderLayer()`, the layer-panel type metadata, and the properties/event bindings as needed.

## Coordinate systems

Layer data uses the fixed logical canvas space (`1280 × 720`). Pointer input is converted from the displayed canvas rectangle into logical coordinates:

```js
const rect = interactiveCanvas.getBoundingClientRect();
const scaleX = state.canvasWidth / rect.width;
const scaleY = state.canvasHeight / rect.height;
const canvasX = (event.clientX - rect.left) * scaleX;
const canvasY = (event.clientY - rect.top) * scaleY;
```

Keep canvas dimensions configurable through `state.canvasWidth` and `state.canvasHeight`; do not introduce new hard-coded canvas dimensions.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + Mouse Wheel` | Zoom in or out |
| `Space + Drag` | Pan the viewport |
| `Delete` / `Backspace` | Delete the selected layer |
| Click | Select a layer |

## Development notes

- There are currently no automated tests or runtime dependencies.
- Use the browser console and manual interaction flows when validating changes.
- Preserve image history behavior: snapshots serialize `_imgSrc`, not the `HTMLImageElement` reference.
- Keep visual constants in CSS custom properties defined in `:root`.
- The application has no persistent storage; refreshing the page resets the document.

Recommended manual regression checks:

1. Add and edit text, shapes, freehand paths, and images.
2. Move, resize, rotate, reorder, duplicate, hide, and delete layers.
3. Verify undo/redo across more than five changes.
4. Check center snapping, zoom, pan, and both export formats.
5. Confirm exported files are 1280 × 720 and that transparent PNG output behaves as expected.

## Known limitations and extension points

- No local project persistence; `localStorage` or IndexedDB could be added.
- Font choices are currently a fixed list; custom font loading is not implemented.
- History is limited to 30 states.
- Multi-selection and group transforms are not supported.
- Snap guides currently focus on canvas center alignment.
- Touch interaction and mobile editing can be improved.

## License

Tedit is licensed under the GNU General Public License v3.0 (GPLv3). See `LICENSE` for the full license text.
