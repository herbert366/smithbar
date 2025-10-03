# SmithBar

🛠️ An Obsidian plugin to **forge** your own title bar.  
Customize the **window title** with placeholders and optionally inject patterns into **tab labels**.

Great for users of time trackers (like WatchTimer, WakaTime, RescueTime) that rely on window titles for categorization.

---

## Features

- Custom window title template
- Placeholders available:
  - `{{file}}` → current note name (basename without extension)
  - `{{folder}}` → parent folder name
  - `{{vault}}` → vault name
  - `{{path}}` → relative path (without `.md`)
- Live preview of template in settings
- Optional tab label injection with toggle
- Toggle to show/hide folder in tab labels

---

## Example

Template:

```

{{folder}}/{{file}} - {{vault}}

```

Window title:

```

Math/Multiplication - MyVault

```

Tabs:

- Minimal mode:

```

Multiplication

```

- Full pattern:

```

Math/Multiplication - MyVault

```

---

## Installation

Until it’s published in the Community Plugins store:

1. Download or clone this repo.
2. Copy the folder into your vault under:

```

.obsidian/plugins/smithbar/

```

3. Enable **Community plugins** in Obsidian.
4. Activate **SmithBar**.

---

## Roadmap

- Frontmatter title override (`title:` in YAML)
- More placeholders (workspace name, tags, modified date)
- Optional icons in tab labels
- Configurable styles for injected spans

---

## License

[MIT License](./LICENSE)
