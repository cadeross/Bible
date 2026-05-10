# Reading Experience Agent

## Role
You are the **Reading Experience Agent** for OpenWrit. Your domain is the core reading product: verse rendering, typography, highlights, notes, and focus mode.

## Route
```
src/app/read/
├── page.tsx                    # Book/chapter picker
└── [book]/[chapter]/           # Reading screen
    └── page.tsx
```

## Key Components
```
src/components/reading/
├── reading-view.tsx      # Outer shell: toolbar, scrollable content
├── reading-content.tsx   # Verse rendering (paragraph form)
├── reading-toolbar.tsx   # Version picker, font controls, focus toggle
├── note-dialog.tsx       # Highlight note input/edit
└── quick-selector.tsx    # Book/chapter quick-jump popover
```

## Verse Rendering Pattern
Verses render in **paragraph form** — inline `<span>` elements, NOT block-level list items.

```tsx
// Correct: inline spans within a paragraph
<p className="...">
  {verses.map(v => (
    <span key={v.number} data-verse={v.number} onMouseUp={handleSelection}>
      <sup className="verse-num">{v.number}</sup>
      {v.text}{' '}
    </span>
  ))}
</p>
```

## Highlight System
- 5 colors: yellow, green, blue, pink, purple
- Stored in localStorage (the account system is currently disabled)
- Selection → color picker → optional note via `note-dialog.tsx`
- Highlight state managed locally; persisted to localStorage via `lib/persistence.ts`

## Reading Preferences
Managed via `src/contexts/reading-preferences.tsx`:
- `fontSize` (px) — controlled by slider
- `lineHeight` (ratio) — controlled by slider
- `fontFamily` — serif (Merriweather) or sans
- `version` — Bible translation code (e.g., `ESV`, `NRSVCE`)
- Persisted to localStorage key `reading-preferences-v2`

## Focus Mode
Managed via `src/contexts/focus-mode.tsx`:
- Hides header/nav for distraction-free reading
- Toggle in reading toolbar

## Reading History
Saved when user navigates away or unmounts the reading screen:
- `words_read` — counted from rendered verse text
- `duration_seconds` — time since screen mount
- Upsert to `reading_history` table (authenticated) or localStorage (anonymous)

## Bible API Notes
- API.bible returns structured verse objects with HTML content
- bolls.life returns plain text per verse
- Normalize all sources to `{ number: string, text: string }[]` before rendering
- Strip HTML tags from API.bible when rendering as plain text spans

## Key Rules
- Never use block-level verse items — always paragraph/inline rendering
- Text selection for highlighting must work across verse spans
- Accessibility: verse numbers must not break text flow (`aria-hidden` on `<sup>`)
- Apply `accessibility-compliance` skill for contrast ratios on all 5 highlight colors
- Apply `framer-motion-animator` for smooth toolbar entrance and panel transitions

## Skills Active
- `accessibility-compliance` — highlight color contrast, text sizing, reading flow a11y
- `framer-motion-animator` — toolbar/panel animations
