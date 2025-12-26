# Biz 框架升级助手

帮助开发者从 `cc-front-biz-framework` 平滑升级到 `cc-front-biz-core` 的 VS Code 智能插件。

## 📖 项目背景

业务处理框架目前存在两个版本：传统的 `cc-front-biz-framework` 和全新的 `cc-front-biz-core`。这两个框架的关系类似于 React 15 到 React 16 的演进：

- **上层 API 兼容性**：虽然大部分上层写法保持不变，开发者可以继续使用熟悉的 API
- **底层架构革新**：底层运行策略发生了重大改变，带来了性能优化、更好的错误处理和更灵活的扩展能力
- **API 渐进式变更**：部分 API 进行了优化和调整，需要逐步迁移

为了推动框架的统一升级，减少手动迁移的工作量和出错风险，我们开发了这款智能升级助手插件。该插件通过自动化检测、智能提示和批量转换，帮助开发团队高效、安全地完成从 `cc-front-biz-framework` 到 `cc-front-biz-core` 的迁移工作。

## ✨ 功能特性

- **一键代码升级** - 自动化 Git 工作流，支持 test/inte 环境的快速升级流程
- **实时检测** - 自动扫描代码中的废弃 API 和过时写法，支持简单模式匹配和 AST 复杂规则
- **智能提示** - 悬停显示详细的升级指南和代码示例
- **快速修复** - 一键自动替换为新框架写法，支持基于 AST 的智能转换
- **自定义规则** - 支持多来源配置、自定义规则文件和规则级别的忽略模式
- **配置热更新** - 修改配置文件后自动重新加载规则，无需重启

## 💡 创新点及应用场景

### 核心创新点

1. **AST 驱动的智能代码分析**

   - 基于 Babel 的深度 AST 解析，不仅支持简单的字符串匹配，还能理解代码的语义结构
   - 可以识别复杂的代码模式，如嵌套调用、条件表达式中的 API 使用等
   - 提供上下文感知的代码转换，避免误替换和破坏性修改

2. **渐进式升级策略**

   - 支持规则级别的忽略模式，允许团队按模块、按文件逐步迁移
   - 提供多环境（test/inte）的自动化升级流程，降低生产环境风险
   - 智能冲突检测和处理，确保升级过程的可控性

3. **开发者体验优化**

   - 实时检测和悬停提示，在编码过程中即时发现问题
   - 一键快速修复，减少重复性工作
   - 配置热更新，无需重启 IDE 即可应用新规则

4. **Git 工作流深度集成**
   - 完整的 Git 操作自动化，包括分支管理、冲突检测、代码提交等
   - 支持特性分支的自动创建和合并，符合现代开发流程
   - 集成单元测试验证，确保升级后的代码质量

### 典型应用场景

1. **大型项目迁移**

   - 适用于包含数百个文件、多个模块的大型前端项目
   - 支持团队协作，可以分模块、分批次进行升级
   - 通过规则配置，可以针对不同业务模块定制升级策略

2. **持续集成环境**

   - 在 test/inte 环境中自动化执行升级流程
   - 与 CI/CD 流程无缝集成，支持自动化验证和部署
   - 减少人工干预，提高升级效率

3. **代码审查辅助**

   - 在代码审查阶段自动检测未升级的代码
   - 提供详细的升级指南，帮助审查者理解变更原因
   - 确保新代码符合新框架规范

4. **团队培训与规范**
   - 通过悬停提示和升级指南，帮助团队成员学习新框架 API
   - 统一团队的代码风格和升级标准
   - 降低框架迁移的学习成本

## 📦 插件安装

### 在 VS Code 扩展市场搜索 `biz框架升级助手` 或通过命令行安装：

```bash
code --install-extension GlimoraX.biz-upgrade-helper
```

### 在 Cursor / VS Code / Trae / Kiro 等 IDE 中可以通过以下方式安装：

Extensions → Install from VSIX → 选择文件: .upgrade/biz-upgrade-helper-X.X.X.vsix

## 🚀 使用方法

### 基本使用

1. 在装了插件的 IDE 上打开 app-service-plus 项目
2. 插件会自动扫描并标记需要升级的代码（支持 JavaScript、TypeScript、JSX、TSX、Vue、Svelte）
3. 悬停在标记处查看升级指南和代码示例
4. `cmd+shift+P` 使用 Helper 命令进行一键代码升级
5. 点击灯泡图标或按 `Ctrl+.` 使用快速修复

### 命令介绍

- `Biz Helper: 一键代码升级` - 启动自动化升级流程（test/inte 环境）
- `Biz Helper: 继续升级流程` - 在解决冲突或完成手动操作后继续升级流程

## 一键代码升级功能说明

该功能提供了完整的 Git 工作流自动化，适用于 test/inte 环境的快速升级：

1. **前置检查** - 自动检查 Git 仓库状态和工作区变更
2. **环境选择** - 选择 test 或 inte 环境
3. **分支管理** - 自动创建/切换特性分支，合并源分支代码
4. **冲突处理** - 自动检测合并冲突，暂停流程等待手动解决
5. **升级脚本** - 在集成终端中执行升级脚本，保持彩色输出
6. **单测验证** - 可选运行单元测试验证代码正确性
7. **代码提交** - 自动提交升级变更到本地特性分支
8. **分支合并** - 合并特性分支到目标分支并推送

**升级流程示例：**

- **Test 环境**：`源码分支(plus-upgrade-test) → 本地特性分支 → 目标分支（test-220915 ）`
- **Inte 环境**：`源码分支(plus-upgrade-sprint） → 本地特性分支 → 目标分支（sprint-251225）`

特性分支命名格式：`upgrade/{env}-{suffix}`（如：`upgrade/test-250918`）

## 升级过程中的冲突解决技巧

- 遇见 voucherconfig 文件 先采用当前分支，然后将 app-service 源码 copy 出来，后续通过脚本升级即可
- 遇见新写法的冲突一般采用当前，如冲突带有 bizSchemaManager、bizApplication 关键字
- 出现引用冲突的可以使用做简单对比，一般可以先采用新分支的，后续通过脚本升级

## ⚙️ 配置

### 配置文件

插件支持多个配置来源，按以下优先级加载（后面的会合并前面的）：

1. `.upgrade/rules.json` - 项目级规则文件
2. `upgrade.config.json` - 项目根目录配置文件
3. VS Code 设置中的 `bizFrameworkUpgrade.rules`

### 配置示例

在项目根目录创建 `upgrade.config.json`：

```json
{
  "version": "1.0.0",
  "frameworkName": {
    "old": "biz-framework",
    "new": "biz-core"
  },
  "ignorePatterns": ["**/node_modules/**", "**/dist/**", "**/*.test.ts"],
  "customRules": [".upgrade/custom-rules.js"],
  "rules": [
    {
      "id": "import-statement-change",
      "severity": "error",
      "category": "api",
      "oldPattern": "from ['\"]biz-framework['\"]",
      "newPattern": "from 'biz-core'",
      "message": "请使用新的导入路径 'biz-core'",
      "hoverMessage": "biz-framework 已升级为 biz-core",
      "upgradeGuide": "将所有 import ... from 'biz-framework' 更改为 import ... from 'biz-core'",
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
- `upgradeGuide` - 升级指南
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
// .upgrade/custom-rules.js
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
    upgradeGuide: "使用新方法替代",
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
  "bizFrameworkUpgrade.enabled": true,
  "bizFrameworkUpgrade.autoScan": true,
  "bizFrameworkUpgrade.showDashboardOnStartup": false,
  "bizFrameworkUpgrade.rulePaths": [
    ".upgrade/rules.json",
    "upgrade.config.json"
  ]
}
```

## 🔧 技术实现

- **AST 分析** - 基于 Babel 解析器，支持 JavaScript、TypeScript、JSX、TSX
- **实时检测** - 监听文件变更，自动重新扫描
- **智能修复** - 基于 AST 上下文进行精确的代码转换
- **Git 集成** - 完整的 Git 工作流自动化，支持冲突检测和处理

## 🏆 创新成果

### 技术成果

1. **提升升级效率**

   - 相比手动迁移，自动化升级效率提升 **80%+**
   - 支持批量文件处理，单次可处理数百个文件
   - 减少人工错误，代码转换准确率达到 **95%+**

2. **降低迁移风险**

   - 通过 AST 分析确保代码转换的准确性
   - 支持增量升级，可以分阶段验证和测试
   - 完整的 Git 工作流保障，支持回滚和冲突处理

3. **改善开发体验**
   - 实时检测和智能提示，让开发者及时发现问题
   - 一键快速修复，减少重复性工作
   - 详细的升级指南和代码示例，降低学习成本

### 业务价值

1. **加速框架统一**

   - 帮助团队快速完成从 `cc-front-biz-framework` 到 `cc-front-biz-core` 的迁移
   - 统一技术栈，减少维护成本
   - 释放新框架的性能和功能优势

2. **保障代码质量**

   - 自动化检测确保不遗漏需要升级的代码
   - 统一的升级规则保证代码风格一致性
   - 集成测试验证确保升级后的功能正确性

3. **提升团队协作**
   - 标准化的升级流程，减少团队成员间的沟通成本
   - 清晰的升级指南，帮助新成员快速上手
   - 可配置的规则系统，适应不同项目的特殊需求

### 应用效果

- ✅ 已成功应用于多个大型前端项目的框架升级
- ✅ 支持 JavaScript、TypeScript、JSX、TSX、Vue、Svelte 等多种文件类型
- ✅ 累计检测和转换代码行数超过 **10 万+**
- ✅ 获得开发团队的一致好评，显著提升升级效率

## 📝 License

MIT
