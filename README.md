# SmithBar

Custom window title plugin for [Obsidian](https://obsidian.md).

SmithBar lets you fully control how the Obsidian window title looks by using a flexible templating system.  
This is especially useful when using time trackers or productivity tools that depend on window titles, or if you just want more context in your tabs.

---

## Features

- Custom window title template (configurable in plugin settings).
- Placeholders available:
  - `{{file}}` → current note name (basename without extension).
  - `{{folder}}` → parent folders.
    - You can chain as many `{{folder}}` as you want:
      - `{{folder}}` → deepest folder (immediate parent).
      - `{{folder}}/{{folder}}` → parent of parent / parent (ordered correctly).
      - `{{folder}}/{{folder}}/{{file}}` → full path down to the note.
  - `{{vault}}` → vault name.
  - `{{path}}` → full relative path (folders + file, without `.md`).
- Live preview of the template in settings.
- Toggle to show/hide pattern in tab labels.
- Toggle to enable/disable tab injection separately from window title.

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

This means you can design the window/tab title exactly the way you want:

- Example: `{{path}} - {{vault}}` → `Skills/Math/multiplication - MyVault`
- Example: `Note: {{file}} (in {{folder}})` → `Note: multiplication (in Math)`

---

## Installation

1. Copy the plugin folder into your Obsidian plugins directory:

```

<vault>/.obsidian/plugins/smithbar/

```

2. Enable "SmithBar" in Obsidian’s community plugins tab.
3. Open plugin settings to configure your template.

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
- The plugin never sends data outside Obsidian. Everything happens locally.
