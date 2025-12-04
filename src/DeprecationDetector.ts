import * as vscode from 'vscode';
import { ASTAnalyzer } from './ASTAnalyzer';
import { MigrationRule } from './interface';

export class DeprecationDetector {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private astAnalyzer: ASTAnalyzer;
  private rules: MigrationRule[] = [];

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('bizMigration');
    this.astAnalyzer = new ASTAnalyzer();
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
      if (rule.astMatcher) {
        try {
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