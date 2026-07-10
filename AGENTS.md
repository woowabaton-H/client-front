# Client Agent Notes

- Use `/Users/laboon/workspace/project/clean/reference` as the visual and product reference when it is available.
- Use Lucide (`lucide-react`) for app UI icons.
- The design-system package already uses `lucide-react`; add the dependency to this client package before implementing Lucide icons here.
- Prefer named Lucide imports, for example `import { Home, Bell, UserRound } from "lucide-react";`.
- Keep icons as inline React components so they inherit `currentColor` and can be styled through existing button, tab, and state classes.
- Do not use temporary glyphs, emoji, or geometric placeholder text for UI icons.
- Decorative icons should use `aria-hidden="true"`. Icon-only buttons must keep a Korean `aria-label` that describes the action.
- Keep default stroke icons visually consistent: use 20-24 px for navigation and icon buttons, 16-18 px for inline button icons, and preserve the existing 8 px control radius unless the local component style already differs.
- Treat category imagery separately from navigation icons. Category tiles can continue using `/cleanloop/icons/category-*.png` until the category icon migration is handled intentionally.
