import * as vscode from 'vscode';
import { UpgradeRule } from './interface';

export class UpgradeDashboard {
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
   * 显示升级仪表板
   */
  show(context: vscode.ExtensionContext) {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'upgradeDashboard',
      '🔄 框架升级概览',
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
        const severityKey = severity || 'Unknown';
        this.statistics.bySeverity.set(
          severityKey,
          (this.statistics.bySeverity.get(severityKey) || 0) + 1
        );

        const categoryKey = typeof diag.code === 'string'
          ? diag.code
          : typeof diag.code === 'object' && diag.code !== null && 'value' in diag.code
            ? String((diag.code as any).value)
            : 'unknown';
        this.statistics.byCategory.set(
          categoryKey,
          (this.statistics.byCategory.get(categoryKey) || 0) + 1
        );
      });
    });

    // 文件按问题数排序，保留最多 50 条以防列表过长
    this.statistics.fileList = this.statistics.fileList
      .sort((a, b) => b.issues - a.issues)
      .slice(0, 50);

    if (this.panel) {
      this.panel.webview.postMessage({
        type: 'updateStats',
        data: {
          totalIssues: this.statistics.totalIssues,
          byCategory: Array.from(this.statistics.byCategory.entries()),
          bySeverity: Array.from(this.statistics.bySeverity.entries()),
          fileList: this.statistics.fileList,
        },
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
          <h1>🔄 biz-framework → biz-core 升级进度</h1>
          <p>实时监控代码升级状态，帮助您快速完成框架升级</p>
        </div>

        <div class="stat-card">
          <h2>总体概览</h2>
          <div class="stat-number" id="totalIssues">0</div>
          <p>待升级项</p>
          <div class="progress-bar">
            <div id="progress" style="width: 0%; height: 100%; background: var(--vscode-progressBar-background);"></div>
          </div>
        </div>

        <div class="stat-card">
          <h2>严重级别分布</h2>
          <div id="severityChart"></div>
          <ul class="file-list" id="severityList"></ul>
        </div>

        <div class="stat-card">
          <h2>规则/分类分布</h2>
          <div id="categoryChart"></div>
          <ul class="file-list" id="categoryList"></ul>
        </div>

        <div class="stat-card">
          <h2>📁 文件列表</h2>
          <div style="margin-bottom: 10px;">
            <input id="fileFilter" type="text" placeholder="按文件名过滤..." style="width: 100%; padding: 6px;" />
          </div>
          <ul class="file-list" id="fileList"></ul>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'updateStats') {
              const data = message.data;
              const total = data.totalIssues || 0;
              document.getElementById('totalIssues').textContent = total;
              
              renderList('severityList', data.bySeverity || []);
              renderList('categoryList', data.byCategory || []);
              renderBars('severityChart', data.bySeverity || []);
              renderBars('categoryChart', data.byCategory || []);
              renderFiles(data.fileList || []);

              // 简单进度：目前只显示总数，宽度恒 100% 以示存在待处理项
              const progress = document.getElementById('progress') as HTMLElement;
              progress.style.width = total > 0 ? '100%' : '0%';
            }
          });

          function renderList(id, entries) {
            const dom = document.getElementById(id);
            dom.innerHTML = entries
              .map(([name, count]) => \`<li class="file-item">\${name}: \${count}</li>\`)
              .join('');
          }

          function renderBars(id, entries) {
            const container = document.getElementById(id);
            const max = entries.reduce((m, [, c]) => Math.max(m, c), 0) || 1;
            container.innerHTML = entries
              .map(([name, count]) => {
                const width = Math.round((count / max) * 100);
                return \`<div style="margin:6px 0;">
                  <div style="display:flex;justify-content:space-between;">
                    <span>\${name}</span><span>\${count}</span>
                  </div>
                  <div style="height:8px;background:var(--vscode-progressBar-background);border-radius:4px;">
                    <div style="width:\${width}%;height:100%;background:var(--vscode-textLink-foreground);border-radius:4px;"></div>
                  </div>
                </div>\`;
              })
              .join('');
          }

          function renderFiles(files) {
            const filterInput = document.getElementById('fileFilter') as HTMLInputElement;
            const keyword = (filterInput?.value || '').toLowerCase();
            const dom = document.getElementById('fileList');
            const filtered = keyword
              ? files.filter((f: any) => f.file.toLowerCase().includes(keyword))
              : files;
            dom.innerHTML = filtered
              .map(f => \`<li class="file-item">\${f.file} - \${f.issues} 项</li>\`)
              .join('');
          }

          const filterInput = document.getElementById('fileFilter') as HTMLInputElement;
          if (filterInput) {
            filterInput.addEventListener('input', () => {
              vscode.postMessage({ type: 'requestStats' });
            });
          }
        </script>
      </body>
      </html>
    `;
  }
}