import * as vscode from 'vscode';
import { ConfigLoader } from './ConfigLoader';
import { DeprecationDetector } from './DeprecationDetector';
import { EnhancedHoverProvider } from './EnhancedHoverProvider';
import { QuickFixProvider } from './QuickFixProvider';
import { MigrationDashboard } from './MigrationDashboard';
import { ASTAnalyzer } from './ASTAnalyzer';
import { SyncManager } from './SyncManager';
import { QuickUpgradeManager } from './QuickUpgradeManager';

export function activate(context: vscode.ExtensionContext) {
  console.log('Biz Framework Migration Agent activated');
  const astAnalyzer = new ASTAnalyzer();

  const configLoader = new ConfigLoader();
  const detector = new DeprecationDetector(astAnalyzer);
  const hoverProvider = new EnhancedHoverProvider(astAnalyzer);
  const quickFixProvider = new QuickFixProvider(astAnalyzer);
  const dashboard = new MigrationDashboard();
  const syncManager = new SyncManager();
  const quickUpgradeManager = new QuickUpgradeManager();

  // 加载配置
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (workspaceRoot) {
    detector.setWorkspaceRoot(workspaceRoot);

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

  // 注册命令：一键同步升级代码
  context.subscriptions.push(
    vscode.commands.registerCommand('bizMigration.syncCode', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('请先打开工作区。');
        return;
      }

      let workspaceRoot = workspaceFolders[0].uri.fsPath;
      if (workspaceFolders.length > 1) {
        const pick = await vscode.window.showQuickPick(
          workspaceFolders.map(f => ({
            label: f.name,
            description: f.uri.fsPath,
            value: f.uri.fsPath,
          })),
          { placeHolder: '选择要执行同步的工作区目录' }
        );
        if (!pick) return;
        workspaceRoot = pick.value;
      }

      await syncManager.run(workspaceRoot);
    })
  );

  // 注册命令：继续当前同步流程（用于冲突解决后手动恢复）
  context.subscriptions.push(
    vscode.commands.registerCommand('bizMigration.resumeSync', () => {
      syncManager.resolvePending();
    })
  );

  // 注册命令：快速升级（test/inte 环境）
  context.subscriptions.push(
    vscode.commands.registerCommand('bizMigration.quickUpgrade', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('请先打开工作区。');
        return;
      }

      let workspaceRoot = workspaceFolders[0].uri.fsPath;
      if (workspaceFolders.length > 1) {
        const pick = await vscode.window.showQuickPick(
          workspaceFolders.map(f => ({
            label: f.name,
            description: f.uri.fsPath,
            value: f.uri.fsPath,
          })),
          { placeHolder: '选择要执行快速升级的工作区目录' }
        );
        if (!pick) return;
        workspaceRoot = pick.value;
      }

      await quickUpgradeManager.run(workspaceRoot);
    })
  );

  // 注册命令：继续快速升级流程（用于冲突解决后手动恢复）
  context.subscriptions.push(
    vscode.commands.registerCommand('bizMigration.resumeQuickUpgrade', () => {
      quickUpgradeManager.resolvePending();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('bizMigration.analyzeCode', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('请先打开一个文件');
        return;
      }

      const code = editor.document.getText();

      try {
        const analysisContext = astAnalyzer.analyzeContext(
          code,
          editor.document.uri.fsPath
        );

        // 显示分析结果
        const importList = Array.from(analysisContext.imports.entries())
          .map(([name, source]) => `  • ${name} from '${source}'`)
          .join('\n');

        const message = `
    📊 代码分析结果

    📦 导入模块数: ${analysisContext.imports.size} 个

    ${importList || '  (无导入)'}
          `.trim();

        vscode.window.showInformationMessage(
          message,
          { modal: false }
        );

        // 同时输出到控制台，方便调试
        console.log('AST Analysis Context:', analysisContext);

      } catch (error) {
        vscode.window.showErrorMessage(
          `代码分析失败: ${error instanceof Error ? error.message : String(error)}`
        );
        console.error('AST Analysis Error:', error);
      }
    })
  );

  // context.subscriptions.push(configLoader, detector, hoverProvider);
}

export function deactivate() {
  console.log('Biz Framework Migration Agent deactivated');
}