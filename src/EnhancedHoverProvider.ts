import * as vscode from 'vscode';
import { ASTAnalyzer } from "./ASTAnalyzer";
import { MigrationRule } from "./interface";

export class EnhancedHoverProvider implements vscode.HoverProvider {
  private rules: MigrationRule[] = [];
  private astAnalyzer: ASTAnalyzer;

  constructor() {
    this.astAnalyzer = new ASTAnalyzer();
  }

  setRules(rules: MigrationRule[]) {
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

    // 查找匹配的规则
    for (const rule of this.rules) {
      if (this.matchesRule(word, code, offset, rule)) {
        return this.createHover(rule, wordRange);
      }
    }

    return null;
  }

  private matchesRule(word: string, code: string, offset: number, rule: MigrationRule): boolean {
    if (rule.oldPattern) {
      const pattern = typeof rule.oldPattern === 'string' 
        ? new RegExp(rule.oldPattern) 
        : rule.oldPattern;
      
      if (pattern.test(word)) return true;
    }

    if (rule.astMatcher) {
      try {
        const matches = this.astAnalyzer.findMatches(code, rule.astMatcher);
        return matches.some(m => offset >= m.range.start && offset <= m.range.end);
      } catch {
        return false;
      }
    }

    return false;
  }

  private createHover(rule: MigrationRule, range: vscode.Range): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    
    // 标题
    markdown.appendMarkdown(`### 🔄 框架迁移提示\n\n`);
    
    // 问题描述
    markdown.appendMarkdown(`**${rule.hoverMessage}**\n\n`);
    
    // 迁移指南
    markdown.appendMarkdown(`#### 迁移指南\n\n${rule.migrationGuide}\n\n`);
    
    // 示例代码
    if (rule.examples) {
      markdown.appendMarkdown(`#### 代码示例\n\n`);
      markdown.appendMarkdown(`**旧写法 (biz-framework):**\n\`\`\`typescript\n${rule.examples.before}\n\`\`\`\n\n`);
      markdown.appendMarkdown(`**新写法 (biz-core):**\n\`\`\`typescript\n${rule.examples.after}\n\`\`\`\n\n`);
    }
    
    // 快速修复提示
    if (rule.quickFix) {
      markdown.appendMarkdown(`💡 *点击灯泡图标使用快速修复*\n`);
    }

    return new vscode.Hover(markdown, range);
  }
}