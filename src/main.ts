import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import MyItemView from "./views/MyItemView";

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: "default",
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();

    this.registerView("my-item-view", (leaf) => new MyItemView(leaf));

    // Add ribbon icon to open the view
    this.addRibbonIcon("book-open", "Open My Item View", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-my-item-view",
      name: "Open My Item View",
      callback: () => {
        this.activateView();
      },
    });

    this.addSettingTab(new JayWorksSettingTab(this.app, this));
  }

  async activateView() {
    const { workspace } = this.app;

    // Check if the view is already open
    let leaf = workspace.getLeavesOfType("my-item-view")[0];

    if (!leaf) {
      // If not open, create a new leaf and open the view
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({
        type: "my-item-view",
        active: true,
      });
    }

    // Reveal and focus the leaf
    workspace.revealLeaf(leaf);
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class JayWorksSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Setting #1")
      .setDesc("It's a secret")
      .addText((text) =>
        text
          .setPlaceholder("Enter your secret")
          .setValue(this.plugin.settings.mySetting)
          .onChange(async (value) => {
            this.plugin.settings.mySetting = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
