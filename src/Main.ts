import * as vscode from 'vscode';
import { ConfigLoader } from './ConfigLoader';
import { DeprecationDetector } from './DeprecationDetector';
import { EnhancedHoverProvider } from './EnhancedHoverProvider';
import { QuickFixProvider } from './QuickFixProvider';
import { ASTAnalyzer } from './ASTAnalyzer';
import { QuickUpgradeManager } from './QuickUpgradeManager';

export function activate(context: vscode.ExtensionContext) {
  console.log('Biz Framework Helper Agent activated');
  const astAnalyzer = new ASTAnalyzer();

  const configLoader = new ConfigLoader();
  const detector = new DeprecationDetector(astAnalyzer);
  const hoverProvider = new EnhancedHoverProvider(astAnalyzer);
  const quickFixProvider = new QuickFixProvider(astAnalyzer);
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

  // 注册命令：快速升级（test/inte 环境）
  context.subscriptions.push(
    vscode.commands.registerCommand('bizHelper.quickUpgrade', async () => {
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
    vscode.commands.registerCommand('bizHelper.resumeQuickUpgrade', () => {
      quickUpgradeManager.resolvePending();
    })
  );
}

export function deactivate() {
  console.log('Biz Framework Helper Agent deactivated');
}