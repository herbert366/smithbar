const { Plugin, PluginSettingTab, Setting } = require('obsidian');

module.exports = class CustomWindowTitle extends Plugin {
    async onload() {
        console.log("Custom Window Title plugin loaded.");

        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this.addSettingTab(new TitleSettingsTab(this.app, this));

        this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.updateWindowTitle()));
        this.registerEvent(this.app.workspace.on("file-open", () => this.updateWindowTitle()));

        this.updateWindowTitle();
    }

    onunload() {
        console.log("Custom Window Title plugin unloaded.");
        document.title = `Obsidian - ${this.app.vault.getName()}`;
        this.clearTabInjections();
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    updateWindowTitle() {
        const file = this.app.workspace.getActiveFile();
        const vault = this.app.vault.getName();

        const vars = {
            vault: vault,
            file: file ? file.basename : "",
            folder: file && file.parent ? file.parent.name : "",
            path: file ? file.path.replace(/\.md$/, "") : ""
        };

        // Apply template to window title
        let title = this.applyTemplate(this.settings.template, vars);
        if (!title.trim()) title = `${vault} - Obsidian`;
        document.title = title;

        // Optionally update tab UI
        if (this.settings.injectIntoTabs) {
            this.updateTabInjections(vars);
        } else {
            this.clearTabInjections();
        }

        // Update preview in settings if visible
        if (this.settingsTab) {
            this.settingsTab.updatePreview(vars);
        }
    }

    applyTemplate(template, vars) {
        let result = template;
        Object.keys(vars).forEach(key => {
            let regex = new RegExp(`{{${key}}}`, "g");
            result = result.replace(regex, vars[key]);
        });
        return result;
    }

    updateTabInjections(vars) {
        const leaves = this.app.workspace.getLeavesOfType("markdown");
        leaves.forEach(leaf => {
            if (!leaf.view || !leaf.view.file || !leaf.tabHeaderEl) return;

            const file = leaf.view.file;
            const varsForTab = {
                vault: vars.vault,
                file: file.basename,
                folder: file.parent ? file.parent.name : "",
                path: file.path.replace(/\.md$/, "")
            };

            // Clean previous injection
            const oldSpan = leaf.tabHeaderEl.querySelector(".cwt-tab-injection");
            if (oldSpan) oldSpan.remove();

            // Decide injection content
            let tabText;
            if (this.settings.showFolderInTabs) {
                tabText = this.applyTemplate(this.settings.template, varsForTab);
            } else {
                tabText = varsForTab.file;
            }

            // Inject into tab
            const span = document.createElement("span");
            span.className = "cwt-tab-injection";
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
            const oldSpan = leaf.tabHeaderEl.querySelector(".cwt-tab-injection");
            if (oldSpan) oldSpan.remove();
        });
    }
};

const DEFAULT_SETTINGS = {
    template: "{{folder}}/{{file}} - {{vault}}",
    injectIntoTabs: false,
    showFolderInTabs: true
};

class TitleSettingsTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.previewEl = null;
        this.plugin.settingsTab = this; // reference back to update preview
    }

    display() {
        let { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Custom Window Title" });

        new Setting(containerEl)
            .setName("Window title template")
            .setDesc("Use placeholders: {{file}}, {{folder}}, {{vault}}, {{path}}")
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

        // Live preview element
        this.previewEl = containerEl.createEl("div", { cls: "cwt-preview" });
        this.previewEl.style.marginTop = "8px";
        this.previewEl.style.fontFamily = "monospace";
        this.previewEl.style.opacity = "0.8";

        new Setting(containerEl)
            .setName("Inject into tab labels")
            .setDesc("If enabled, apply the pattern also to tab headers (UI).")
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

        // Initialize preview once
        this.plugin.updateWindowTitle();
    }

    updatePreview(vars) {
        if (!this.previewEl) return;
        let example = this.plugin.applyTemplate(this.plugin.settings.template, vars);
        this.previewEl.setText("Preview: " + (example || "(empty)"));
    }
}
