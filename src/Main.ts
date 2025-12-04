import * as vscode from 'vscode';
import { ConfigLoader } from './ConfigLoader';
import { DeprecationDetector } from './DeprecationDetector';
import { EnhancedHoverProvider } from './EnhancedHoverProvider';
import { QuickFixProvider } from './QuickFixProvider';
import { MigrationDashboard } from './MigrationDashboard';
import { ASTAnalyzer } from './ASTAnalyzer';

export function activate(context: vscode.ExtensionContext) {
  console.log('Biz Framework Migration Agent activated');

  const configLoader = new ConfigLoader();
  const detector = new DeprecationDetector();
  const hoverProvider = new EnhancedHoverProvider();
  const quickFixProvider = new QuickFixProvider();
  const dashboard = new MigrationDashboard();
  const astAnalyzer = new ASTAnalyzer();

  // 加载配置
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    configLoader.loadConfig(workspaceRoot).then(config => {
      detector.setRules(config.rules);
      hoverProvider.setRules(config.rules);
      quickFixProvider.setRules(config.rules);
      
      // 扫描所有打开的文档
      vscode.workspace.textDocuments.forEach(doc => {
        if (doc.languageId === 'typescript' || doc.languageId === 'javascript') {
          detector.scanDocument(doc);
        }
      });
    });

    configLoader.watchConfig(workspaceRoot);
  }

  // 配置热更新
  configLoader.onConfigChange(config => {
    detector.setRules(config.rules);
    hoverProvider.setRules(config.rules);
    quickFixProvider.setRules(config.rules);
  });

  // 注册文档变更监听
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document.languageId === 'typescript' || event.document.languageId === 'javascript') {
        detector.scanDocument(event.document);
      }
    })
  );

  // 注册文档打开监听
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(document => {
      if (document.languageId === 'typescript' || document.languageId === 'javascript') {
        detector.scanDocument(document);
      }
    })
  );

  // 注册 Hover Provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: 'file', language: 'typescript' },
      hoverProvider
    ),
    vscode.languages.registerHoverProvider(
      { scheme: 'file', language: 'javascript' },
      hoverProvider
    )
  );

  // 注册 Quick Fix Provider
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file', language: 'typescript' },
      quickFixProvider,
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    ),
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file', language: 'javascript' },
      quickFixProvider,
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    )
  );

  // 注册命令：显示迁移仪表板
  context.subscriptions.push(
    vscode.commands.registerCommand('bizMigration.showDashboard', () => {
      dashboard.show(context);
    })
  );

  // 注册命令：扫描整个项目
  context.subscriptions.push(
    vscode.commands.registerCommand('bizMigration.scanProject', async () => {
      const files = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx}');
      for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        await detector.scanDocument(document);
      }
      vscode.window.showInformationMessage('项目扫描完成！');
    })
  );

  context.subscriptions.push(configLoader, detector);
}

export function deactivate() {
  console.log('Biz Framework Migration Agent deactivated');
}