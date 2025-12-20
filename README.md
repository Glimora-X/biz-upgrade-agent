# Biz 框架升级助手

帮助开发者从 `biz-framework` 平滑迁移到 `biz-core` 的 VS Code 智能插件。

## ✨ 功能特性

- **一键代码升级** - 自动化 Git 工作流，支持 test/inte 环境的快速升级流程
- **实时检测** - 自动扫描代码中的废弃 API 和过时写法，支持简单模式匹配和 AST 复杂规则
- **智能提示** - 悬停显示详细的迁移指南和代码示例
- **快速修复** - 一键自动替换为新框架写法，支持基于 AST 的智能转换
- **自定义规则** - 支持多来源配置、自定义规则文件和规则级别的忽略模式
- **配置热更新** - 修改配置文件后自动重新加载规则，无需重启


## 📦 安装

在 VS Code 扩展市场搜索 `biz框架升级助手` 或通过命令行安装：

```bash
code --install-extension GlimoraX.biz-upgrade-helper
```

## 🚀 使用方法

### 基本使用

1. 打开包含 `biz-framework` 代码的项目
2. 插件会自动扫描并标记需要升级的代码（支持 JavaScript、TypeScript、JSX、TSX、Vue、Svelte）
3. 悬停在标记处查看升级指南和代码示例
4. 使用指定命令进行一键代码升级
5. 点击灯泡图标或按 `Ctrl+.` 使用快速修复

### 命令

- `Biz Helper: 一键代码升级` - 启动自动化升级流程（test/inte 环境）
- `Biz Helper: 继续升级流程` - 在解决冲突或完成手动操作后继续升级流程

### 一键代码升级功能介绍

该功能提供了完整的 Git 工作流自动化，适用于 test/inte 环境的快速升级：

1. **前置检查** - 自动检查 Git 仓库状态和工作区变更
2. **环境选择** - 选择 test 或 inte 环境
3. **分支管理** - 自动创建/切换特性分支，合并源分支代码
4. **冲突处理** - 自动检测合并冲突，暂停流程等待手动解决
5. **升级脚本** - 在集成终端中执行升级脚本，保持彩色输出
6. **单测验证** - 可选运行单元测试验证代码正确性
7. **代码提交** - 自动提交升级变更并推送到远程
8. **分支合并** - 合并特性分支到目标分支并推送

**升级流程示例：**

- **Test 环境**：`test-220915 ← plus-test-250918`
- **Inte 环境**：`sprint-251225 ← plus-upgrade-sprint`

特性分支命名格式：`upgrade/{env}-{suffix}`（如：`upgrade/test-250918`）

## ⚙️ 配置

### 配置文件

插件支持多个配置来源，按以下优先级加载（后面的会合并前面的）：

1. `.migration/rules.json` - 项目级规则文件
2. `migration.config.json` - 项目根目录配置文件
3. VS Code 设置中的 `bizFrameworkMigration.rules`

### 配置示例

在项目根目录创建 `migration.config.json`：

```json
{
  "version": "1.0.0",
  "frameworkName": {
    "old": "biz-framework",
    "new": "biz-core"
  },
  "ignorePatterns": ["**/node_modules/**", "**/dist/**", "**/*.test.ts"],
  "customRules": [".migration/custom-rules.js"],
  "rules": [
    {
      "id": "import-statement-change",
      "severity": "error",
      "category": "api",
      "oldPattern": "from ['\"]biz-framework['\"]",
      "newPattern": "from 'biz-core'",
      "message": "请使用新的导入路径 'biz-core'",
      "hoverMessage": "biz-framework 已升级为 biz-core",
      "migrationGuide": "将所有 import ... from 'biz-framework' 更改为 import ... from 'biz-core'",
      "quickFix": {
        "title": "更新为 biz-core 导入",
        "transform": "code.replace(/from ['\"]biz-framework['\"]/g, \"from 'biz-core'\")"
      },
      "examples": {
        "before": "import { Component } from 'biz-framework';",
        "after": "import { Component } from 'biz-core';"
      },
      "ignorePatterns": ["**/legacy/**", "**/*.spec.ts"]
    }
  ]
}
```

### 规则定义

每个规则支持以下字段：

- `id` - 规则唯一标识
- `severity` - 严重程度：`error` | `warning` | `info`
- `category` - 分类：`api` | `pattern` | `structure` | `lifecycle`
- `oldPattern` - 旧代码模式（字符串或正则表达式）
- `newPattern` - 新代码模式（可选）
- `astMatcher` - AST 匹配函数（用于复杂规则，需在自定义规则文件中定义）
- `message` - 诊断消息
- `hoverMessage` - 悬停提示消息
- `migrationGuide` - 迁移指南
- `quickFix` - 快速修复配置
  - `title` - 修复操作标题
  - `transform` - 转换表达式（字符串，使用 `code` 变量）
- `examples` - 代码示例（`before` 和 `after`）
- `ignorePatterns` - 规则级别的忽略模式（支持 glob 模式）

### 规则级别的忽略模式

每个规则可以通过 `ignorePatterns` 字段指定忽略检查的文件或文件夹：

- 支持 glob 模式匹配
- 相对于项目根目录
- 常用模式：
  - `**/legacy/**` - 忽略所有 legacy 文件夹
  - `**/*.test.ts` - 忽略所有测试文件
  - `src/old-code/**` - 忽略特定目录
  - `**/vendor/**` - 忽略第三方代码

### 自定义规则文件

可以通过 `customRules` 字段引用 JavaScript 模块文件，定义复杂的 AST 匹配规则：

```javascript
// .migration/custom-rules.js
module.exports = [
  {
    id: "complex-ast-rule",
    severity: "warning",
    category: "pattern",
    astMatcher: (node, context) => {
      // 使用 AST 节点和上下文进行复杂匹配
      return (
        node.type === "CallExpression" &&
        node.callee.name === "deprecatedMethod"
      );
    },
    message: "检测到废弃方法调用",
    hoverMessage: "此方法已废弃",
    migrationGuide: "使用新方法替代",
    quickFix: {
      title: "替换为新方法",
      transform: (code) => code.replace(/deprecatedMethod/g, "newMethod"),
    },
  },
];
```

### VS Code 设置

```json
{
  "bizFrameworkMigration.enabled": true,
  "bizFrameworkMigration.autoScan": true,
  "bizFrameworkMigration.showDashboardOnStartup": false,
  "bizFrameworkMigration.rulePaths": [
    ".migration/rules.json",
    "migration.config.json"
  ]
}
```

## 🔧 技术实现

- **AST 分析** - 基于 Babel 解析器，支持 JavaScript、TypeScript、JSX、TSX
- **实时检测** - 监听文件变更，自动重新扫描
- **智能修复** - 基于 AST 上下文进行精确的代码转换
- **Git 集成** - 完整的 Git 工作流自动化，支持冲突检测和处理

## 📝 License

MIT
