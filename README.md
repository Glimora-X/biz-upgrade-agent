# Biz Framework 升级助手

帮助开发者从 `biz-framework` 平滑迁移到 `biz-core` 的 VS Code 智能插件。

## ✨ 功能特性

- 🔍 **实时检测** - 自动扫描代码中的废弃 API 和过时写法
- 💡 **智能提示** - 悬停显示详细的迁移指南和代码示例
- ⚡ **快速修复** - 一键自动替换为新框架写法
- 📊 **迁移仪表板** - 可视化展示项目迁移进度
- 🔧 **可配置规则** - 支持自定义迁移规则

## 📦 安装

在 VS Code 扩展市场搜索 `biz框架升级助手` 或通过命令行安装：

```bash
code --install-extension Glimora_X.biz-upgrade-agent
```

## 🚀 使用方法

### 基本使用

1. 打开包含 `biz-framework` 代码的项目
2. 插件会自动扫描并标记需要迁移的代码
3. 悬停在标记处查看迁移指南
4. 点击灯泡图标使用快速修复

### 命令

- `Biz Migration: 显示迁移仪表板` - 打开迁移进度面板
- `Biz Migration: 扫描整个项目` - 扫描项目中所有文件

## ⚙️ 配置

在项目根目录创建 `migration.config.json` 自定义规则：

```json
{
  "version": "1.0.0",
  "rules": [
    {
      "id": "custom-rule",
      "severity": "warning",
      "category": "api",
      "oldPattern": "oldMethod",
      "message": "请使用新方法",
      "hoverMessage": "此方法已废弃",
      "migrationGuide": "使用 newMethod 替代"
    }
  ]
}
```

### VS Code 设置

```json
{
  "bizFrameworkMigration.enabled": true,
  "bizFrameworkMigration.autoScan": true,
  "bizFrameworkMigration.showDashboardOnStartup": false
}
```

## 📝 License

MIT
