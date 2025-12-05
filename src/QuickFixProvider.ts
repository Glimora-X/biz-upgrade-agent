import * as vscode from 'vscode';
import { ASTAnalyzer } from "./ASTAnalyzer";
import { ASTContext, MigrationRule } from "./interface";

export class QuickFixProvider implements vscode.CodeActionProvider {
  private rules: MigrationRule[] = [];
  private astAnalyzer: ASTAnalyzer;

  constructor(astAnalyzer: ASTAnalyzer) {
    this.astAnalyzer = astAnalyzer;
  }

  setRules(rules: MigrationRule[]) {
    this.rules = rules;
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source !== 'biz-framework-migration') continue;

      const rule = this.rules.find(r => r.id === diagnostic.code);
      if (!rule || !rule.quickFix) continue;

      const action = new vscode.CodeAction(
        rule.quickFix.title,
        vscode.CodeActionKind.QuickFix
      );

      action.diagnostics = [diagnostic];
      action.isPreferred = true;

      action.edit = new vscode.WorkspaceEdit();
      const code = document.getText(diagnostic.range);

      // 使用 AST 进行更智能的修复
      // 如果需要基于 AST 的复杂转换
      if (rule.astMatcher) {
        try {
          const fullCode = document.getText();
          // 👈 使用 this.astAnalyzer 分析上下文
          const analysisContext = this.astAnalyzer.analyzeContext(
            fullCode,
            document.uri.fsPath
          );

          // 基于上下文进行智能修复
          // 例如：知道是从哪个模块导入的，可以做更精确的替换
          const newCode = this.smartTransform(code, rule, analysisContext);
          action.edit.replace(document.uri, diagnostic.range, newCode);
        } catch {
          // 降级到简单转换
          const newCode = this.applyTransform(code, rule.quickFix.transform);
          action.edit.replace(document.uri, diagnostic.range, newCode);
        }
      } else {
        const newCode = this.applyTransform(code, rule.quickFix.transform);
        action.edit.replace(document.uri, diagnostic.range, newCode);
      }

      actions.push(action);
    }

    return actions;
  }

  // 应用转换
  private applyTransform(code: string, transform: string | ((code: string) => string)): string {
    if (typeof transform === 'function') {
      return transform(code);
    } else {
      // 如果是字符串，使用 eval 执行（配置文件中的转换表达式）
      try {
        return eval(transform);
      } catch {
        return code;
      }
    }
  }

  // 添加智能转换方法
  private smartTransform(
    code: string,
    rule: MigrationRule,
    context: ASTContext
  ): string {
    // 基于 AST 上下文的智能转换
    // 例如：检查导入来源，做更精确的替换
    if (context.imports.has('getData') &&
      context.imports.get('getData') === 'biz-framework') {
      return code.replace(/getData/g, 'fetchData');
    }
    return code;
  }
}