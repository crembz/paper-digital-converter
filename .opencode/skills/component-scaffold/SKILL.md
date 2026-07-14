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
6. All props typed; use `| null` or `| undefined` explicitly, never implicit
7. Event handlers typed with React event types (`React.ChangeEvent<HTMLInputElement>`, etc.)
8. Callbacks wrapped in `useCallback` when passed to children or used in `useEffect` deps

### React Patterns
9. Functional component only — no class components
10. `useState` for local state, `useRef` for DOM refs, `useEffect` for side effects
11. `useMemo` for expensive computations
12. Clean up effects in teardown functions

### Styling
13. BEM-like class names: `component-name__element--modifier`
14. Dark theme compatible (bg: `#1a1a2e`, text: `#cdd6f4`, accents: `#89b4fa`, `#f38ba8`)
15. Add corresponding CSS rules to `src/styles.css`
16. No inline styles except for dynamic values (transforms, computed dimensions)

### Accessibility
17. Semantic HTML elements (`<button>`, `<label>`, `<nav>`)
18. `aria-*` attributes where needed
19. Keyboard navigable (tab order, focus visible)
20. No color-only state indicators

### States
21. Handle empty state (placeholder text, icon)
22. Handle loading state (spinner, disabled buttons)
23. Handle error state (error message, retry option)

## Template

```tsx
import { useState, useCallback, useEffect } from 'react';

interface ComponentNameProps {
  // typed props
  onAction?: (value: string) => void;
  disabled?: boolean;
}

export default function ComponentName({
  onAction,
  disabled = false,
}: ComponentNameProps) {
  const [state, setState] = useState<string>('');

  const handleAction = useCallback(() => {
    if (onAction && state) {
      onAction(state);
    }
  }, [onAction, state]);

  return (
    <div className="component-name">
      {/* JSX with BEM classes, aria attributes */}
    </div>
  );
}
```

## After Creating

1. Import and use in `App.tsx` (or parent component)
2. Add CSS to `src/styles.css`
3. Run `npx tsc --noEmit` to verify
4. Test in dev mode
