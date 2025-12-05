import * as vscode from 'vscode';
import { ASTAnalyzer } from './ASTAnalyzer';
import { MigrationRule } from './interface';
import * as minimatch from 'minimatch';

export class DeprecationDetector {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private astAnalyzer: ASTAnalyzer;
  private rules: MigrationRule[] = [];
  private workspaceRoot: string = '';

  constructor(astAnalyzer: ASTAnalyzer) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('bizMigration');
    this.astAnalyzer = astAnalyzer;
  }

  setWorkspaceRoot(root: string) {
    this.workspaceRoot = root;
  }

  setRules(rules: MigrationRule[]) {
    this.rules = rules;
  }

  /**
   * 扫描文档
   */
  async scanDocument(document: vscode.TextDocument) {
    const diagnostics: vscode.Diagnostic[] = [];
    const code = document.getText();

    // 简单模式匹配
    for (const rule of this.rules) {
      // 检查文件是否应该被此规则忽略
      if (this.shouldIgnoreFile(document.uri.fsPath, rule)) {
        continue;
      }

      if (rule.oldPattern) {
        const matches = this.findSimpleMatches(code, rule.oldPattern);
        matches.forEach(match => {
          const range = new vscode.Range(
            document.positionAt(match.start),
            document.positionAt(match.end)
          );

          diagnostics.push(this.createDiagnostic(range, rule));
        });
      }
    }

    // AST 复杂匹配
    for (const rule of this.rules) {
      // 检查文件是否应该被此规则忽略
      if (this.shouldIgnoreFile(document.uri.fsPath, rule)) {
        continue;
      }

      if (rule.astMatcher) {
        try {
          // 👈 使用共享的 astAnalyzer 实例
          const matches = this.astAnalyzer.findMatches(code, rule.astMatcher);
          matches.forEach(match => {
            const range = new vscode.Range(
              document.positionAt(match.range.start),
              document.positionAt(match.range.end)
            );
            diagnostics.push(this.createDiagnostic(range, rule));
          });
        } catch (error) {
          console.error('AST analysis error:', error);
        }
      }
    }
    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * 检查文件是否应该被规则忽略
   */
  private shouldIgnoreFile(filePath: string, rule: MigrationRule): boolean {
    if (!rule.ignorePatterns || rule.ignorePatterns.length === 0) {
      return false;
    }

    // 获取相对路径
    const relativePath = this.workspaceRoot
      ? filePath.replace(this.workspaceRoot, '').replace(/^[\/\\]/, '')
      : filePath;

    // 检查是否匹配任何忽略模式
    return rule.ignorePatterns.some(pattern => {
      return minimatch(relativePath, pattern, { dot: true });
    });
  }

  private findSimpleMatches(code: string, pattern: string | RegExp): Array<{ start: number; end: number }> {
    const matches: Array<{ start: number; end: number }> = [];
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : pattern;

    let match;
    while ((match = regex.exec(code)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return matches;
  }

  private createDiagnostic(range: vscode.Range, rule: MigrationRule): vscode.Diagnostic {
    const severity = {
      error: vscode.DiagnosticSeverity.Error,
      warning: vscode.DiagnosticSeverity.Warning,
      info: vscode.DiagnosticSeverity.Information,
    }[rule.severity];

    const diagnostic = new vscode.Diagnostic(
      range,
      rule.message,
      severity
    );

    diagnostic.code = rule.id;
    diagnostic.source = 'biz-framework-migration';

    return diagnostic;
  }

  dispose() {
    this.diagnosticCollection.dispose();
  }
}