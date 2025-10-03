const { Plugin, PluginSettingTab, Setting } = require('obsidian');

module.exports = class SmithBar extends Plugin {
    async onload() {
        console.log("SmithBar loaded.");

        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.addSettingTab(new SmithBarSettingsTab(this.app, this));

        this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.updateWindowTitle()));
        this.registerEvent(this.app.workspace.on("file-open", () => this.updateWindowTitle()));

        this.updateWindowTitle();
    }

    onunload() {
        console.log("SmithBar unloaded.");
        document.title = `Obsidian - ${this.app.vault.getName()}`;
        this.clearTabInjections();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    updateWindowTitle() {
        const file = this.app.workspace.getActiveFile();

        const title = this.applyTemplate(this.settings.template, file);
        document.title = title;

        if (this.settings.injectIntoTabs) {
            this.updateTabInjections(file);
        } else {
            this.clearTabInjections();
        }

        if (this.settingsTab) {
            this.settingsTab.updatePreview(file);
        }
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

    const folderTokens = (template.match(/{{folder}}/g) || []).length;

    const fLen = foldersOrdered.length;
    let seenFolder = 0;

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
            const idx = fLen - folderTokens + seenFolder; // can be < 0 if user asked more than exists
            result += (idx >= 0 && idx < fLen) ? foldersOrdered[idx] : "";
            seenFolder += 1;
        } else {
            result += token;
        }
    });

    if (!result.trim()) result = `${vault} - Obsidian`;

    // Cleanup separators
    return result
        .replace(/\/+/g, "/")              
        .replace(/\/(\s*[-–—]\s*)/g, "$1") 
        .replace(/\/+$/g, "");             
}


    updateTabInjections(file) {
        const leaves = this.app.workspace.getLeavesOfType("markdown");
        leaves.forEach(leaf => {
            if (!leaf.view || !leaf.view.file || !leaf.tabHeaderEl) return;

            const tabFile = leaf.view.file;

            // Clean old
            const oldSpan = leaf.tabHeaderEl.querySelector(".smithbar-tab-injection");
            if (oldSpan) oldSpan.remove();

            let tabText;
            if (this.settings.showFolderInTabs) {
                tabText = this.applyTemplate(this.settings.template, tabFile);
            } else {
                tabText = tabFile.basename;
            }

            const span = document.createElement("span");
            span.className = "smithbar-tab-injection";
            span.style.marginLeft = "4px";
            span.style.opacity = "0.7";
            span.innerText = tabText;

            leaf.tabHeaderEl.appendChild(span);
        });
    }

    clearTabInjections() {
        const leaves = this.app.workspace.getLeavesOfType("markdown");
        leaves.forEach(leaf => {
            if (!leaf.tabHeaderEl) return;
            const oldSpan = leaf.tabHeaderEl.querySelector(".smithbar-tab-injection");
            if (oldSpan) oldSpan.remove();
        });
    }
};

const DEFAULT_SETTINGS = {
    template: "{{folder}}/{{file}} - {{vault}}",
    injectIntoTabs: false,
    showFolderInTabs: true
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

        new Setting(containerEl)
            .setName("Window title template")
            .setDesc("Placeholders: {{file}}, {{folder}}, {{vault}}, {{path}}. Multiple {{folder}} consume folders from deepest to root.")
            .addTextArea(text => {
                text
                    .setValue(this.plugin.settings.template)
                    .onChange(async value => {
                        this.plugin.settings.template = value;
                        await this.plugin.saveSettings();
                        this.plugin.updateWindowTitle();
                    });
                text.inputEl.style.width = "100%";
                text.inputEl.style.height = "60px";
            });

        this.previewEl = containerEl.createEl("div", { cls: "smithbar-preview" });
        this.previewEl.style.marginTop = "8px";
        this.previewEl.style.fontFamily = "monospace";
        this.previewEl.style.opacity = "0.8";

        new Setting(containerEl)
            .setName("Inject into tab labels")
            .setDesc("If enabled, apply the template also to tab headers (UI).")
            .addToggle(toggle => {
                toggle
                    .setValue(this.plugin.settings.injectIntoTabs)
                    .onChange(async value => {
                        this.plugin.settings.injectIntoTabs = value;
                        await this.plugin.saveSettings();
                        this.plugin.updateWindowTitle();
                    });
            });

        new Setting(containerEl)
            .setName("Show folder in tab labels")
            .setDesc("If disabled, only the file name will be shown in tabs.")
            .addToggle(toggle => {
                toggle
                    .setValue(this.plugin.settings.showFolderInTabs)
                    .onChange(async value => {
                        this.plugin.settings.showFolderInTabs = value;
                        await this.plugin.saveSettings();
                        this.plugin.updateWindowTitle();
                    });
            });

        this.plugin.updateWindowTitle();
    }

    updatePreview(file) {
        if (!this.previewEl) return;
        let example = this.plugin.applyTemplate(this.plugin.settings.template, file);
        this.previewEl.setText("Preview: " + (example || "(empty)"));
    }
}
