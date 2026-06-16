# Dataflash Viewer

Desktop + web UI for `rust_dataflash_parser`.

## Layout

```
viewer/
├── apps/
│   ├── web/          # Browser SPA (Vite)
│   └── desktop/      # Tauri v2 shell
└── packages/
    └── viewer/       # Shared React UI + platform abstraction
```

The parser crate stays at the repository root (`../..` from `apps/desktop/src-tauri`).  
`viewer/` is **not** a Rust workspace member — only the Tauri shell links to the parser via `path` dependency.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Rust toolchain (for desktop)

## Commands

```bash
cd viewer
pnpm install

# Web (browser, mock parser for now)
pnpm dev

# Desktop (Tauri + mock parser in Phase 0)
pnpm dev:desktop
```

## Platform backends

| App | Backend | Status |
|-----|---------|--------|
| Web | `createMockParserBackend("web")` | Phase 0 |
| Web | WASM worker | Phase 1 |
| Desktop | Tauri commands → `LogSession` | Phase 1 (commands stubbed in Rust) |

To switch desktop from mock to real parser, update `apps/desktop/src/main.tsx` to use `createDesktopParserBackend()`.

## Repo layout rationale

`viewer/` lives next to `src/` and `tests/`, not inside `crates/`.  
`crates/` is for Rust-only workspace members; the viewer is a pnpm monorepo with its own toolchain.
