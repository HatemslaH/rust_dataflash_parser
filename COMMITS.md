# Commit message conventions

This project follows **[Conventional Commits](https://www.conventionalcommits.org/)** — a widely used format for structured, readable git history.

## Format

```
<type>(<scope>): <short description>

<full description>

<footer>
```

| Part | Required | Notes |
|------|----------|-------|
| `type` | yes | What kind of change this is |
| `scope` | no | Area of the codebase, e.g. `parser`, `bench`, `cli` |
| `short description` | yes | One line, imperative mood, no trailing period, ≤ 72 chars |
| `full description` | no | Why and how; wrap at ~72 characters per line |
| `footer` | no | Breaking changes, issue references |

## Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or user-visible behavior |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `build` | Build system, dependencies, `Cargo.toml` |
| `ci` | CI/CD configuration |
| `chore` | Maintenance that doesn't fit other types (tooling, housekeeping) |
| `revert` | Revert a previous commit |

## Rules

- Use **imperative mood** in the subject: `add parser`, not `added parser` or `adds parser`.
- Keep the **subject line short** — details go in the body.
- Separate **subject and body** with a blank line.
- Reference issues in the footer: `Closes #42`, `Refs #17`.
- Mark breaking changes in the footer:

  ```
  BREAKING CHANGE: describe what broke and how to migrate
  ```

  Or in the subject with `!`: `feat(parser)!: change public API`

## Examples

### Feature

```
feat(parser): add FILE message reassembly

Port FILE payload stitching from JsDataflashParser so reconstructed
files match the JavaScript output on autotest logs.
```

### Bug fix

```
fix(bench): restore JS parser JSON output

console.log was overridden to a no-op before the benchmark harness
printed results, so js_msgs was always empty.
```

### Refactor

```
refactor(format): extract field size lookup into match

No behavior change; simplifies parser.rs and mirrors JS structure.
```

### Performance

```
perf(parser): reuse FMT offset table across messages

Reduces allocations when scanning large .BIN files.
```

### Documentation

```
docs: document benchmark flags in README

Add --js-only, --rust-only, and --min-kb usage examples.
```

### Chore

```
chore: add dataflash_logs to gitignore
```

### With scope and issue reference

```
feat(download): parallel autotest log fetcher

Discover .BIN links from the autotest index page and download with
retries and skip-if-exists semantics.

Closes #12
```

### Breaking change

```
feat(api)!: rename process_data to parse

BREAKING CHANGE: DataflashParser::process_data is now parse.
Update call sites in main.rs and integration tests.
```

## Suggested scopes for this repo

| Scope | Area |
|-------|------|
| `parser` | `src/parser.rs`, core parsing logic |
| `format` | Binary field decoding |
| `cli` | `src/main.rs` |
| `bench` | `benchmark_parsers.py`, `benchmark_js.mjs` |
| `download` | `download_dataflash_logs.py` |
| `deps` | `Cargo.toml`, dependencies |

Scope is optional — use it when it helps readers scan the log quickly.
