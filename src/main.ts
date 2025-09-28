import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import MyItemView from './views/MyItemView';
import UseAgentView from './views/UseAgentView';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerView('my-item-view', (leaf) => new MyItemView(leaf));

		// Register the right-side UseAgent view
		this.registerView('use-agent-view', (leaf) => new UseAgentView(leaf));

		this.addCommand({
			id: 'open-my-item-view',
			name: 'Open My Item View',
			callback: () => {
				this.app.workspace.getLeaf(true).setViewState({
					type: 'my-item-view',
					active: true,
				});
			}
		});

		this.addCommand({
			id: 'open-use-agent-view',
			name: 'Open UseAgent View',
			callback: () => {
				const leaf = this.app.workspace.getRightLeaf(true);
				if (leaf) {
					leaf.setViewState({ type: 'use-agent-view', active: true });
				}
			}
		});

		this.addSettingTab(new JayWorksSettingTab(this.app, this));
	}

	onunload() {

	}

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
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
