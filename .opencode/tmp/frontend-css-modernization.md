# CSS Modernization Changes

## Changes Made to `src/styles.css`

### 1. CSS Custom Properties (Design Tokens)
- Added `--bg-primary`, `--bg-secondary` for consistent background colors
- Added `--border-subtle`, `--border-subtle-hover`, `--border-focus` for borders
- Added `--text-primary`, `--text-secondary`, `--text-tertiary` for text colors
- Added `--accent-primary`, `--accent-primary-hover` for brand colors
- Added `--shadow-sm`, `--shadow-md`, `--shadow-lg` for elevation

### 2. Typography & Font Rendering
- Added `text-rendering: optimizeLegibility` to body
- Added `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale`
- Added `font-smoothing: antialiased` for Safari
- Added `text-size-adjust: 100%` for mobile
- Added `direction: ltr` for consistent text direction
- Added `box-sizing: border-box` to all elements

### 3. Button Styles
- Added `transition: background-color 0.15s, opacity 0.15s` to base button
- Added `font-family: inherit` to buttons for consistency
- Added `border: none` to buttons
- Added `border-radius: 6px` to buttons
- Improved button hover states

### 4. Dropzone Styles
- Added `border-radius: 12px` to dropzone
- Added `background: linear-gradient` for subtle purple gradient
- Added `radial-gradient` pseudo-element for hover effect
- Added `transform: translateY(-2px)` on hover for depth
- Added `box-shadow: 0 8px 24px rgba(108, 99, 255, 0.15)` on hover
- Added `transform: scale(1.01)` on active/drag
- Added `transition: transform 0.2s ease` to icon

### 5. Card & Panel Styles
- Added `border-radius: 12px` to config panel
- Added `box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2)` to config panel
- Added `border-radius: 16px` to modal
- Added `box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5)` to modal
- Added `backdrop-filter: blur(4px)` to overlay
- Added `animation: slideUp 0.25s ease` to modal
- Added `animation: fadeIn 0.2s ease` to overlay

### 6. Form Inputs & Selects
- Added `border-radius: 8px` to all inputs
- Added `border: 1px solid #3a3a5a` to all inputs
- Added `background-color: #2a2a4a` to all inputs
- Added `box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.15)` on focus
- Added custom SVG chevron to select dropdowns
- Added `accent-color: #6c63ff` to checkboxes
- Added `.error` class for error messages
- Added `.form-hint` class for hint text

### 7. Scrollbar Styles
- Increased width/height from 8px to 10px
- Added `linear-gradient` background to scrollbar thumb
- Added `border: 2px solid #1a1a2e` to thumb for breathing room
- Added `::-webkit-scrollbar-corner` styling

### 8. Animation Keyframes
- Added `fadeIn` keyframe for overlay
- Added `slideUp` keyframe for modal
- Added `pulse` keyframe for pulsing elements
- Added `shimmer` keyframe for loading placeholders
- Improved `spin` keyframe with `0.6s linear infinite`

### 9. Responsive Breakpoints
- Added `@media (max-width: 768px)` styles for tablets
- Added `@media (max-width: 480px)` styles for mobile
- Added `100dvh` to `#root` for mobile viewport
- Improved padding for smaller screens
- Added full-screen modal styles for very small screens
