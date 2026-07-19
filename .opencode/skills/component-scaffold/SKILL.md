---
name: component-scaffold
description: Use when creating a new React component under src/components/. Triggers on "add component", "new component", "create component", or "scaffold component". Follows project conventions for props, exports, dark theme, and accessibility.
---

# Component Scaffold Skill

Use this skill whenever a new React component needs to be created under `src/components/`.

## Checklist

Every component must satisfy all items below:

### Structure
1. File: `src/components/<PascalName>.tsx`
2. Props interface at top, named `<ComponentName>Props`
3. `export default function <ComponentName>(props)` — default export, named function
4. No barrel exports, no named exports besides the component

### TypeScript
5. Strict mode — zero `any` types
6. All props typed; use `| null` or `| undefined` explicitly
7. Event handlers typed with React event types (`React.ChangeEvent<HTMLInputElement>`, etc.)

### React Patterns
8. Functional component only — no class components
9. `useState` for local state, `useRef` for DOM refs, `useEffect` for side effects
10. `useMemo`/`useCallback` only when needed for performance or deps
11. Clean up effects in teardown functions

### Styling
12. BEM-like class names: `component-name__element--modifier`
13. Use CSS custom properties from `:root` (see `src/styles.css`) — never hardcoded hex colors
14. Add corresponding CSS rules to `src/styles.css`
15. No inline styles except for dynamic values (transforms, computed dimensions)
16. Every interactive element needs `:focus-visible` and `:disabled` states

### Accessibility
17. Semantic HTML elements (`<button>`, `<label>`, `<nav>`)
18. `aria-*` attributes where needed
19. Keyboard navigable (tab order, focus visible)
20. No color-only state indicators

### States
21. Handle empty state (placeholder text, icon)
22. Handle loading state (spinner, disabled buttons)
23. Handle error state (error message, retry option)

## After Creating

1. Import and use in `App.tsx` (or parent component)
2. Add CSS to `src/styles.css`
3. Verify with `npx tsc --noEmit`
4. Test in dev mode
