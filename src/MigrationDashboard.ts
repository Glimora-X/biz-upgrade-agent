import * as vscode from 'vscode';
import { MigrationRule } from './interface';

export class MigrationDashboard {
  private panel: vscode.WebviewPanel | undefined;
  private statistics: {
    totalIssues: number;
    byCategory: Map<string, number>;
    bySeverity: Map<string, number>;
    fileList: Array<{ file: string; issues: number }>;
  } = {
    totalIssues: 0,
    byCategory: new Map(),
    bySeverity: new Map(),
    fileList: [],
  };

  /**
   * 显示迁移仪表板
   */
  show(context: vscode.ExtensionContext) {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'migrationDashboard',
      '🔄 框架迁移概览',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getWebviewContent();

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  /**
   * 更新统计数据
   */
  updateStatistics(diagnostics: Map<string, vscode.Diagnostic[]>) {
    this.statistics = {
      totalIssues: 0,
      byCategory: new Map(),
      bySeverity: new Map(),
      fileList: [],
    };

    diagnostics.forEach((diags, file) => {
      this.statistics.totalIssues += diags.length;
      
      if (diags.length > 0) {
        this.statistics.fileList.push({
          file: file.split('/').pop() || file,
          issues: diags.length,
        });
      }

      diags.forEach(diag => {
        const severity = vscode.DiagnosticSeverity[diag.severity];
        this.statistics.bySeverity.set(
          severity,
          (this.statistics.bySeverity.get(severity) || 0) + 1
        );
      });
    });

    if (this.panel) {
      this.panel.webview.postMessage({
        type: 'updateStats',
        data: this.statistics,
      });
    }
  }

  private getWebviewContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
          }
          .header {
            margin-bottom: 30px;
          }
          .stat-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .stat-number {
            font-size: 36px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
          }
          .progress-bar {
            height: 20px;
            background: var(--vscode-progressBar-background);
            border-radius: 10px;
            margin: 10px 0;
          }
          .file-list {
            list-style: none;
            padding: 0;
          }
          .file-item {
            padding: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔄 biz-framework → biz-core 迁移进度</h1>
          <p>实时监控代码迁移状态，帮助您快速完成框架升级</p>
        </div>

        <div class="stat-card">
          <h2>总体概览</h2>
          <div class="stat-number" id="totalIssues">0</div>
          <p>待迁移项</p>
          <div class="progress-bar">
            <div id="progress" style="width: 0%; height: 100%; background: var(--vscode-progressBar-background);"></div>
          </div>
        </div>

        <div class="stat-card">
          <h2>📁 文件列表</h2>
          <ul class="file-list" id="fileList"></ul>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'updateStats') {
              document.getElementById('totalIssues').textContent = message.data.totalIssues;
              
              const fileList = document.getElementById('fileList');
              fileList.innerHTML = message.data.fileList
                .map(f => \`<li class="file-item">\${f.file} - \${f.issues} 项</li>\`)
                .join('');
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}