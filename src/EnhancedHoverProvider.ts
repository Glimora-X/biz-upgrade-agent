import * as vscode from 'vscode';
import { ASTAnalyzer } from "./ASTAnalyzer";
import { UpgradeRule } from "./interface";

export class EnhancedHoverProvider implements vscode.HoverProvider {
  private rules: UpgradeRule[] = [];
  private astAnalyzer: ASTAnalyzer;

  constructor(astAnalyzer: ASTAnalyzer) {
    this.astAnalyzer = astAnalyzer;
  }

  setRules(rules: UpgradeRule[]) {
    this.rules = rules;
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return;

    const word = document.getText(wordRange);
    const code = document.getText();
    const offset = document.offsetAt(position);

    // 获取当前行的文本用于更好的匹配
    const line = document.lineAt(position.line).text;

    // 查找匹配的规则
    for (const rule of this.rules) {
      if (this.matchesRule(word, code, offset, rule, line)) {
        return this.createHover(rule, wordRange);
      }
    }

    return null;
  }

  private matchesRule(word: string, code: string, offset: number, rule: UpgradeRule, line?: string): boolean {
    if (rule.oldPattern) {
      const pattern = typeof rule.oldPattern === 'string'
        ? new RegExp(rule.oldPattern)
        : rule.oldPattern;

      // 先测试单词
      if (pattern.test(word)) {
        return true;
      }

      // 如果单词不匹配，尝试匹配整行（对于 import 语句很有用）
      if (line && pattern.test(line)) {
        return true;
      }
    }

    if (rule.astMatcher) {
      try {
        // 👈 使用共享的 astAnalyzer 实例
        const matches = this.astAnalyzer.findMatches(code, rule.astMatcher);
        const matched = matches.some(m => offset >= m.range.start && offset <= m.range.end);
        if (matched) {
          console.log('[Hover] AST matched:', rule.id);
        }
        return matched;
      } catch (error) {
        console.error('[Hover] AST match error:', error);
        return false;
      }
    }

    return false;
  }


  private createHover(rule: UpgradeRule, range: vscode.Range): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    // 标题和严重程度
    const severityIcon = {
      error: '❣️',
      warning: '⚠️',
      info: '🧚‍♀️'
    }[rule.severity];

    markdown.appendMarkdown(`## 代码升级指南📌 \n\n\n\n`);

    // 迁移指南（精简）
    markdown.appendMarkdown(`${severityIcon} ${rule.hoverMessage}\n\n`);

    // 代码示例（紧凑排版）
    if (rule.examples && rule.examples.length > 0) {
      markdown.appendMarkdown(`---\n\n`);

      rule.examples.forEach((example, index) => {
        // 多个示例时显示编号
        const label = rule.examples!.length > 1 ? `示例 ${index + 1}` : '示例';
        markdown.appendMarkdown(`**${label}**\n\n`);

        // 使用更紧凑的代码块
        markdown.appendMarkdown(
          `\`\`\`typescript\n// 旧写法 (biz-framework)\n${example.before}\n\`\`\`\n` +
          `\`\`\`typescript\n// 新写法 (biz-core)\n${example.after}\n\`\`\`\n\n`
        );
      });
    }

    // 快速修复提示
    if (rule.quickFix) {
      markdown.appendMarkdown(`---\n\n💡 **可用快速修复** · 按 \`Ctrl+.\` 或点击灯泡图标\n`);
    }

    return new vscode.Hover(markdown, range);
  }
}