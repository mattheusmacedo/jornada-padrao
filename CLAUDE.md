# CLAUDE.md — Figma → Code Integration Rules for `jornada-padrao`

Project-local rules for translating Figma designs into this codebase via the Figma MCP. This file is the source of truth for *how* designs become code here. Keep it short and accurate; update it when the conventions actually change.

---

## 0. Project at a glance

- **Purpose:** Motion-design exploration project. Five mobile screens (`Perfil`, `Explorar`, `Evento`, `Ramificacao`, `Conclusao`) are pulled from Figma one at a time, then animated in a later phase.
- **Stack:** Vite + React 19 + TypeScript, Tailwind v3, framer-motion, react-router-dom v7.
- **Status:** Scaffold + routing in place. Screens are stubs wrapped in a fixed `PhoneFrame`. Motion system not yet wired (intentional).

---

## 1. Token definitions

**No tokens file exists yet.** This is deliberate — tokens will be extracted *holistically* after all five Figma screens have been pulled, so we capture real recurring values instead of guessing.

While pulling screens, follow these rules:

- **Do not** create `src/motion/tokens.ts`, a Tailwind theme extension, or CSS variables for design tokens during a single-screen pull.
- **Do** annotate recurring values as inline comments in the component file when you see something used 2+ times in a single screen. Format:
  ```tsx
  // token? color/brand-pink — used on FAB + active tab indicator (#FF2E93)
  <button className="bg-[#FF2E93] ..." />
  ```
- Use Tailwind **arbitrary values** (`bg-[#FF2E93]`, `rounded-[28px]`, `text-[15px]`) for one-off Figma values. Don't reach for the nearest Tailwind scale unless the Figma value already matches it exactly.
- Pull color/spacing/radius values from the MCP `get_variable_defs` response when available — those are the canonical names from Figma.

Once all five screens are in, tokens get extracted in one pass:

```
src/motion/tokens.ts     ← design tokens (colors, typography, radii, spacing)
src/motion/variants.ts   ← framer-motion variants
src/motion/transitions.tsx ← shared transition wrappers
```

The `motion/` folder currently contains TODO stubs — **do not modify them** during screen pulls.

**Card-to-detail morph rule:** when the source card and the destination screen have structurally different layouts (e.g. compact thumbnail vs. fullbleed hero), use **measured FLIP with a two-face overlay**: the outer shell owns geometry only (x/y/width/height/borderRadius), and a source-face + destination-face inside it own the visual content. Do NOT mix `layoutId`, manual FLIP, and crossfade cleanup for the same transition — pick one primary model. See `sequence-card-detail-flip` in `motion-system.json`.

---

## 2. Component library

```
src/
├── components/        ← reusable UI primitives (PhoneFrame, EventCard, BottomNav, …)
├── screens/           ← one file per route, each composes its own sub-components
└── motion/            ← (later) motion tokens + variants
```

**Conventions:**

- One component per file, **default-exported**, named in PascalCase matching the filename.
- Props typed inline with a `Props` type alias when there are 2+ props; otherwise destructure directly.
  ```tsx
  type Props = { children: ReactNode }
  export default function PhoneFrame({ children }: Props) { … }
  ```
- **Reusable across screens → `src/components/`.** Examples: `PhoneFrame`, `EventCard`, `BottomNav`.
- **Screen-specific sub-components → defined inline at the top of the screen file**, not split into separate files. Examples: `Header`, `ProfileBlock`, `ActionButtons`, `TabBar`, `EventList` inside `Perfil.tsx`. Promote to `src/components/` only when a second screen needs it.
- Every screen is wrapped in `<PhoneFrame>` so the mobile chrome is consistent.

**No Storybook, no MDX, no docs-as-code system.** Visual review happens against the Figma reference screenshot.

---

## 3. Frameworks & libraries

| Concern | Choice |
| --- | --- |
| Framework | React 19 (function components, hooks) |
| Language | TypeScript ~6.0 |
| Bundler / dev server | Vite 8 |
| Routing | react-router-dom v7 (`BrowserRouter` + `Routes`) |
| Styling | Tailwind CSS v3 (utility-first) |
| Motion | framer-motion 12 — installed but **not yet used** |
| Linting | ESLint flat config (`eslint.config.js`) |

**Do NOT add new libraries during a screen pull** unless explicitly asked. The one pre-approved exception is `lucide-react` for icons; install it the first time it's needed and re-use it everywhere.

---

## 4. Asset management

```
src/assets/
├── perfil/      ← assets for the Perfil screen
├── explorar/    ← assets for the Explorar screen
└── …            ← one folder per screen
```

**Rules:**

- One subfolder per screen (`src/assets/<screen-name>/`).
- Download Figma raster assets (avatars, event card images, photos) via the MCP and save with **descriptive kebab-case filenames** — e.g. `avatar-mattheus.png`, `event-jazz-festival.jpg`. Avoid Figma's node-id-based default names.
- **Import images as ES modules** so Vite fingerprints them:
  ```tsx
  import avatar from '../assets/perfil/avatar-mattheus.png'
  <img src={avatar} alt="" />
  ```
- Don't reference assets via raw `/src/...` paths in JSX.
- Use `public/` only for files that must keep a stable, unhashed URL (rare here; prefer `src/assets/`).
- No CDN, no image optimization pipeline. Vite handles fingerprinting + the `<img>` tag handles the rest.

---

## 5. Icon system

- **Library:** `lucide-react` (install on first use: `npm i lucide-react`).
- Icons are imported by name; the bundler tree-shakes unused ones:
  ```tsx
  import { ChevronLeft, MoreHorizontal, Plus } from 'lucide-react'
  <ChevronLeft size={24} strokeWidth={2} className="text-neutral-900" />
  ```
- For shapes that don't exist in lucide (custom brand glyphs, the FAB's plus-with-special-stroke, etc.), use **inline SVG** in the component. Don't create a separate icon-component file unless the same custom icon is reused across screens.
- Sizing convention: pass `size` as a number (pixels), match the Figma frame's icon size exactly.

---

## 6. Styling approach

- **Tailwind utility classes only.** No CSS Modules, no styled-components, no emotion, no per-component `.css` files.
- The only stylesheet is `src/index.css`, which contains the three `@tailwind` directives plus a tiny reset:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- Use **Tailwind arbitrary values** for Figma-derived numbers that don't match the default scale: `w-[390px]`, `rounded-[28px]`, `text-[13px]`, `tracking-[-0.3px]`, `bg-[#FF2E93]`.
- **No responsive prefixes** during Figma pulls. Every screen is designed at a fixed 390px width and rendered inside `<PhoneFrame>`. Mobile-only.
- **No dark mode classes** yet — designs are light-theme only.
- For dynamic styles dependent on JS state, prefer conditional class strings; do not introduce `clsx`/`classnames` unless the conditional chains get unreadable.

`tailwind.config.js` is minimal — **do not extend the theme** during screen pulls. Token extraction comes later.

---

## 7. Project structure

```
jornada-padrao/
├── public/                     ← static files served as-is
├── src/
│   ├── assets/                 ← per-screen image folders (perfil/, explorar/, …)
│   ├── components/             ← reusable UI: PhoneFrame, EventCard, BottomNav
│   ├── motion/                 ← TODO stubs: tokens.ts, variants.ts, transitions.tsx
│   ├── screens/                ← one file per route, composes inline sub-components
│   │   ├── Perfil.tsx
│   │   ├── Explorar.tsx
│   │   ├── Evento.tsx
│   │   ├── Ramificacao.tsx
│   │   └── Conclusao.tsx
│   ├── App.tsx                 ← BrowserRouter + <Routes>
│   ├── main.tsx                ← React root
│   └── index.css               ← Tailwind directives
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig*.json
└── eslint.config.js
```

**Routing** (in `App.tsx`):

| Path | Screen |
| --- | --- |
| `/` | `Perfil` |
| `/explorar` | `Explorar` |
| `/evento` | `Evento` |
| `/ramificacao` | `Ramificacao` |
| `/conclusao` | `Conclusao` |

---

## 8. Figma MCP workflow (per-screen pull)

For each Figma frame, follow this sequence:

1. **Confirm access.** `whoami` → verify the file is in a team the user has access to. On Starter + View seat, MCP read calls are capped at 6/month; budget accordingly.
2. **Pull structure.** `get_metadata(fileKey, nodeId)` for the layer tree.
3. **Pull design context.** `get_design_context(fileKey, nodeId)` — returns reference code, asset URLs, contextual metadata. This is the primary source.
4. **Pull variables.** `get_variable_defs(fileKey, nodeId)` — canonical token names if the file uses Figma variables.
5. **Pull reference screenshot.** `get_screenshot(fileKey, nodeId)` — saved alongside the screen for visual comparison; download with `curl` from the returned URL.
6. **Download raster assets.** Save to `src/assets/<screen>/` with descriptive filenames.
7. **Generate the screen file.** Compose sub-components inline. Annotate recurring values as `// token?` comments.
8. **Verify dev server hot-reloads.** Don't commit until the user has done visual review.

**Constraints during a pull:**

- Do not touch `motion/`, other screen files, or `tailwind.config.js`.
- Do not add libraries other than the pre-approved `lucide-react`.
- Do not add animations, transitions, or framer-motion variants.
- Do not git-commit until the user explicitly approves visual review.

---

## 9. Commit conventions

- Single-line conventional-style prefixes used so far: `scaffold:`, `screen:`, `chore:`, `fix:`.
- One commit per logical step (scaffold, each screen pull, motion phase, etc.). User gates commits — wait for explicit approval.
