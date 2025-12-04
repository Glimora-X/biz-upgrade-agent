import * as vscode from 'vscode';
import { ASTAnalyzer } from "./ASTAnalyzer";
import { MigrationRule } from "./interface";

export class QuickFixProvider implements vscode.CodeActionProvider {
  private rules: MigrationRule[] = [];
  private astAnalyzer: ASTAnalyzer;

  constructor() {
    this.astAnalyzer = new ASTAnalyzer();
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
      const newCode = rule.quickFix.transform(code, diagnostic.range);
      
      action.edit.replace(document.uri, diagnostic.range, newCode);

      actions.push(action);
    }

    return actions;
  }
}