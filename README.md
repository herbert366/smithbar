# SmithBar

Custom window title plugin for [Obsidian](https://obsidian.md).

SmithBar lets you fully control how the Obsidian window title looks by using a flexible templating system.  
This is especially useful when using time trackers or productivity tools that depend on window titles, or if you just want more context in your window title.

---

## Features

- Fully customizable **window title template** (configurable in plugin settings).
- Live preview of your template in the settings panel.
- Automatic cleanup of duplicate placeholders that don’t make sense (e.g. multiple `{{file}}`).
- Always appends `Obsidian vX.Y.Z` to the end of the title, unless you explicitly override with `{{app}}`, `{{version}}` or `{{app:none}}`.
- Everything runs locally — **no data ever leaves your vault**.

### Placeholders

- `{{file}}` → current note name (basename without extension).
- `{{folder}}` → parent folders. You can chain as many as you want:
  - `{{folder}}` → deepest folder (immediate parent).
  - `{{folder}}/{{folder}}` → parent of parent / parent (ordered correctly).
  - `{{folder}}/{{folder}}/{{file}}` → full path down to the note.
- `{{vault}}` → vault name.
- `{{path}}` → full relative path (folders + file, without `.md`).
- `{{app}}` → app name (`Obsidian`).
- `{{version}}` → Obsidian version only (e.g. `v1.9.14`).
- `{{app:none}}` → disables the automatic `Obsidian vX.Y.Z` suffix entirely.

---

## Examples

Consider a file located at:

```

Skills/Math/multiplication.md

```

Using different templates:

- `{{file}}` → `multiplication`
- `{{folder}}` → `Math`
- `{{folder}}/{{file}}` → `Math/multiplication`
- `{{folder}}/{{folder}}` → `Skills/Math`
- `{{folder}}/{{folder}}/{{file}}` → `Skills/Math/multiplication`
- `{{path}}` → `Skills/Math/multiplication`
- `{{vault}}` → `MyVault`
- `{{file}} - {{vault}}` → `multiplication - MyVault - Obsidian v1.9.14`
- `{{file}} - {{vault}} - {{app:none}}` → `multiplication - MyVault` (no app info)
- `{{path}} ({{version}})` → `Skills/Math/multiplication (v1.9.14)`

---

## Installation

1. Copy the plugin folder into your Obsidian plugins directory:

```

<vault>/.obsidian/plugins/smithbar/

```

2. Enable **SmithBar** in Obsidian’s community plugins tab.
3. Open plugin settings to configure your template and see a live preview.

---

## Development

- Clone this repo.
- Run `npm install` to install dependencies.
- Run `npm run build` to compile.
- Load the plugin in your test vault.

---

## License

[MIT](LICENSE)

---

## Notes

- `{{folder}}` placeholders are **order-aware**: the first one in the template maps to the deepest folder, the second maps to its parent, and so on.
- If you add more `{{folder}}` than exist in the path, the extra ones resolve to empty strings (no crash).
- Non-repeatable placeholders (`{{file}}`, `{{vault}}`, `{{path}}`, `{{app}}`, `{{version}}`, `{{app:none}}`) are automatically reduced to a single occurrence.
- The plugin never sends data outside Obsidian. Everything happens locally.
