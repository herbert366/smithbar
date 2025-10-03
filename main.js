const { Plugin, PluginSettingTab, Setting } = require('obsidian');

module.exports = class SmithBar extends Plugin {
    async onload() {
        console.log("SmithBar loaded.");

        // Capture native title for parsing program info and as ultimate fallback
        this.baseTitle = document.title || "";
        this.programInfo = this.extractProgramInfo(this.baseTitle) || "Obsidian";

        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.addSettingTab(new SmithBarSettingsTab(this.app, this));

        this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.updateWindowTitle()));
        this.registerEvent(this.app.workspace.on("file-open", () => this.updateWindowTitle()));

        this.updateWindowTitle();
    }

    onunload() {
        console.log("SmithBar unloaded.");
        document.title = this.baseTitle && this.baseTitle.trim()
            ? this.baseTitle
            : `Obsidian - ${this.app.vault.getName()}`;
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    updateWindowTitle() {
        const file = this.app.workspace.getActiveFile();

        const title = this.applyTemplate(this.settings.template || "", file);
        document.title = title;

        if (this.settingsTab) {
            this.settingsTab.updatePreview(file);
        }
    }

    // Pull "Obsidian vX.Y.Z" (or similar) from the native title
    extractProgramInfo(title) {
        if (!title) return "";
        const m = title.match(/Obsidian(?:\s+v[\d.]+)?/i);
        return m ? m[0] : "";
    }

    applyTemplate(template, file) {
        const vault = this.app.vault.getName();

        let fileName = "";
        let path = "";
        let foldersOrdered = []; // root -> deepest

        if (file) {
            path = file.path.replace(/\.md$/, "");
            const parts = path.split("/");
            fileName = file.basename;
            foldersOrdered = parts.slice(0, -1);
        }

        // --- sanitize template: collapse non-repeatable placeholders ---
        template = template
            .replace(/({{file}})+/g, "{{file}}")
            .replace(/({{vault}})+/g, "{{vault}}")
            .replace(/({{path}})+/g, "{{path}}")
            .replace(/({{app}})+/g, "{{app}}")
            .replace(/({{version}})+/g, "{{version}}")
            .replace(/({{app:none}})+/g, "{{app:none}}");

        const folderTokens = (template.match(/{{folder}}/g) || []).length;
        const fLen = foldersOrdered.length;
        let seenFolder = 0;

        let sawApp = false;
        let sawVersion = false;
        let sawAppNone = false;

        const tokens = template.split(/({{[^}]+}})/g);
        let result = "";

        tokens.forEach(token => {
            if (token === "{{file}}") {
                result += fileName;
            } else if (token === "{{vault}}") {
                result += vault;
            } else if (token === "{{path}}") {
                result += path;
            } else if (token === "{{folder}}") {
                const idx = fLen - folderTokens + seenFolder; // F - N + k
                result += (idx >= 0 && idx < fLen) ? foldersOrdered[idx] : "";
                seenFolder += 1;
            } else if (token === "{{app}}") {
                sawApp = true;
                result += "Obsidian";
            } else if (token === "{{version}}") {
                sawVersion = true;
                const verOnly = (this.programInfo && (this.programInfo.match(/v[\d.]+/i) || [])[0]) || "";
                result += verOnly;
            } else if (token === "{{app:none}}") {
                sawAppNone = true;
            } else {
                result += token;
            }
        });

        // fallback if template is empty
        if (!template.trim() || !result.trim()) {
            const left = path || fileName || "Untitled";
            const programInfo = this.programInfo || "Obsidian";
            return `${left} - ${vault} - ${programInfo}`;
        }

        // append program info if not suppressed
        if (!sawAppNone && !sawApp && !sawVersion) {
            const programInfo = this.programInfo || "Obsidian";
            const trimmedEnd = result.replace(/\s+$/, "");
            const endsWithSep = /[-–—|:]\s*$/.test(trimmedEnd);
            result = endsWithSep ? (trimmedEnd + " " + programInfo) : (result + " - " + programInfo);
        }

        return result
            .replace(/\/+/g, "/")
            .replace(/\/+$/g, "");
    }
};

const DEFAULT_SETTINGS = {
    template: "{{path}}"
};

class SmithBarSettingsTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.previewEl = null;
        this.plugin.settingsTab = this;
    }

    display() {
        let { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "SmithBar Settings" });

        containerEl.createEl("h3", { text: "Available placeholders" });

        const refList = containerEl.createEl("ul");
        refList.style.fontFamily = "monospace";
        refList.style.lineHeight = "1.6em";

        [
            "{{file}} → current note name",
            "{{folder}} → parent folders (repeat to go up the hierarchy)",
            "{{vault}} → vault name",
            "{{path}} → full relative path",
            "{{app}} → Obsidian (app name)",
            "{{version}} → Obsidian version only",
            "{{app:none}} → disable automatic Obsidian/version suffix"
        ].forEach(item => {
            refList.createEl("li", { text: item });
        });

        new Setting(containerEl)
            .setName("Window title template")
            .setDesc("Define how the window/tab title will be built using placeholders above.")
            .addTextArea(text => {
                text
                    .setValue(this.plugin.settings.template)
                    .onChange(async value => {
                        value = value
                            .replace(/({{file}})+/g, "{{file}}")
                            .replace(/({{vault}})+/g, "{{vault}}")
                            .replace(/({{path}})+/g, "{{path}}")
                            .replace(/({{app}})+/g, "{{app}}")
                            .replace(/({{version}})+/g, "{{version}}")
                            .replace(/({{app:none}})+/g, "{{app:none}}");

                        this.plugin.settings.template = value;
                        await this.plugin.saveSettings();
                        this.plugin.updateWindowTitle();

                        text.setValue(value);
                    });
                text.inputEl.style.width = "100%";
                text.inputEl.style.height = "100px";
                text.inputEl.style.fontFamily = "monospace";
            });

        this.previewEl = containerEl.createEl("div", { cls: "smithbar-preview" });
        this.previewEl.style.marginTop = "8px";
        this.previewEl.style.fontFamily = "monospace";
        this.previewEl.style.opacity = "0.8";

        this.plugin.updateWindowTitle();
    }

    updatePreview(file) {
        if (!this.previewEl) return;

        const template = (this.plugin.settings.template || "");
        const rendered = this.plugin.applyTemplate(template, file || null);

        if (!template.trim()) {
            this.previewEl.setText("Preview: (no template set, using Obsidian default) → " + rendered);
        } else {
            this.previewEl.setText("Preview: " + rendered);
        }
    }
}
