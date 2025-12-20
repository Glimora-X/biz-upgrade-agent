import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { UpgradeConfig } from './interface';

export class ConfigLoader {
  private config: UpgradeConfig | null = null;
  private watchers: vscode.FileSystemWatcher[] = [];
  private onConfigChangeEmitter = new vscode.EventEmitter<UpgradeConfig>();

  readonly onConfigChange = this.onConfigChangeEmitter.event;

  /**
   * 加载配置（支持多来源）
   */
  async loadConfig(workspaceRoot: string): Promise<UpgradeConfig> {
    const sources = [
      path.join(workspaceRoot, '.upgrade', 'rules.json'),
      path.join(workspaceRoot, 'upgrade.config.json'),
      this.getVSCodeSettingsConfig(),
    ];

    let config: UpgradeConfig | null = null;

    for (const source of sources) {
      if (typeof source === 'string' && fs.existsSync(source)) {
        const content = fs.readFileSync(source, 'utf-8');
        config = this.mergeConfig(config, JSON.parse(content));
      } else if (typeof source === 'object' && source !== null) {
        config = this.mergeConfig(config, source);
      }
    }

    if (!config) {
      config = this.getDefaultConfig();
    }

    // 加载自定义规则
    if (config.customRules) {
      for (const rulePath of config.customRules) {
        const fullPath = path.join(workspaceRoot, rulePath);
        if (fs.existsSync(fullPath)) {
          const customRules = require(fullPath);
          config.rules.push(...customRules);
        }
      }
    }

    this.config = config;
    return config;
  }

  /**
   * 热更新配置文件监听
   */
  watchConfig(workspaceRoot: string) {
    const patterns = [
      new vscode.RelativePattern(workspaceRoot, '.upgrade/**/*.json'),
      new vscode.RelativePattern(workspaceRoot, 'upgrade.config.json'),
    ];

    patterns.forEach(pattern => {
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);

      watcher.onDidChange(() => this.reloadConfig(workspaceRoot));
      watcher.onDidCreate(() => this.reloadConfig(workspaceRoot));
      watcher.onDidDelete(() => this.reloadConfig(workspaceRoot));

      this.watchers.push(watcher);
    });
  }

  private async reloadConfig(workspaceRoot: string) {
    const newConfig = await this.loadConfig(workspaceRoot);
    this.onConfigChangeEmitter.fire(newConfig);
    vscode.window.showInformationMessage('升级规则已更新');
  }

  private getVSCodeSettingsConfig(): Partial<UpgradeConfig> | null {
    const config = vscode.workspace.getConfiguration('bizFrameworkUpgrade');
    return config.get('rules') || null;
  }

  private mergeConfig(base: UpgradeConfig | null, override: Partial<UpgradeConfig>): UpgradeConfig {
    if (!base) return override as UpgradeConfig;

    return {
      ...base,
      ...override,
      rules: [...(base.rules || []), ...(override.rules || [])],
    };
  }

  private getDefaultConfig(): UpgradeConfig {
    return {
      version: '1.0.0',
      frameworkName: {
        old: 'biz-framework',
        new: 'biz-core',
      },
      rules: [],
    };
  }

  dispose() {
    this.watchers.forEach(w => w.dispose());
  }
}