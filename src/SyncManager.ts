import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

type StepKind = 'command' | 'pause' | 'info';

interface SyncStep {
  title: string;
  detail?: string;
  kind: StepKind;
  command?: string | (() => Promise<void>);
  onContinue?: () => Promise<void>;
}

interface StandardSyncParams {
  remoteName: string;
  remoteUrl: string;
  baseBranch: string;
  upstreamBranch: string;
  featureBranch: string;
  remoteTargetBranch: string;
}

interface RebuildSyncParams {
  remoteName: string;
  remoteUrl: string;
  baseBranch: string;
  previousBranch: string;
  newBranch: string;
  finalBaseBranch: string;
  remoteTargetBranch: string;
}

export class SyncManager {
  private output = vscode.window.createOutputChannel('Biz Upgrade Sync');
  private lastSourceTargetBranch: string | null = 'feat-test-250918';
  private pendingResolve: (() => void) | null = null;
  private pendingReject: ((reason?: any) => void) | null = null;
  private pendingMessage: string | null = null;

  async run(workspaceRoot: string) {
    type ScenarioPick = vscode.QuickPickItem & { value: 'sourcePush' | 'standard' | 'rebuild' };
    const scenarios: ScenarioPick[] = [
      { label: '源仓库(app-service): 代码推送', value: 'sourcePush', detail: '源仓库代码推送到目标仓库指定分支' },
      { label: '目标仓库(app-service-plus)：常规同步', value: 'standard', detail: '无脚本改动以及日常开发变动' },
      { label: '目标仓库(app-service-plus)：重建分支', value: 'rebuild', detail: '存在脚本变更， 或规模性的文件结构调整' },
    ];

    const scenario = await vscode.window.showQuickPick<ScenarioPick>(scenarios, {
      placeHolder: '选择要执行的升级模式',
    });

    if (!scenario) return;
    const mode = scenario.value;

    // 源仓库模式：允许自定义远程（默认 plus）；目标仓库模式：直接使用 origin
    const remoteName =
      mode === 'sourcePush'
        ? await this.prompt('远程仓库名称（plus）', 'plus', '远程仓库别名: 默认使用 plus')
        : 'origin';
    if (!remoteName) return;

    const remoteUrl = await this.ensureRemoteUrl(remoteName, workspaceRoot);
    if (!remoteUrl) {
      vscode.window.showErrorMessage('未提供远程仓库地址，已中止同步流程。');
      return;
    }

    if (mode === 'sourcePush') {
      const params = await this.collectSourceParams(remoteName, remoteUrl);
      if (params) {
        await this.runSourcePush(workspaceRoot, params);
      }
      return;
    }

    if (mode === 'standard') {
      const params = await this.collectStandardParams(remoteName, remoteUrl);
      if (params) {
        await this.runStandard(workspaceRoot, params);
      }
    } else {
      const params = await this.collectRebuildParams(remoteName, remoteUrl);
      if (params) {
        await this.runRebuild(workspaceRoot, params);
      }
    }
  }

  private async collectSourceParams(remoteName: string, remoteUrl: string) {
    const baseBranch = await this.prompt(
      '基线分支（默认 test-220915）',
      'test-220915',
      '源仓库(app-service)：同步到目标仓库的分支'
    );
    if (!baseBranch) return;

    const targetBranch = await this.prompt(
      '同步到 plus 的分支（默认 feat-test-250918）',
      this.lastSourceTargetBranch || 'feat-test-250918',
      '目标仓库(app-service-plus): 接收源仓库代码的分支'
    );
    if (!targetBranch) return;

    this.lastSourceTargetBranch = targetBranch;

    return { remoteName, remoteUrl, baseBranch, targetBranch };
  }

  private async collectStandardParams(remoteName: string, remoteUrl: string): Promise<StandardSyncParams | undefined> {
    const today = this.getDateTag();
    const baseBranch = await this.prompt(
      '升级基础分支（默认 test-220915）',
      'test-220915',
      '基线分支: 后续基于基线分支拉取特性分支'
    );
    if (!baseBranch) return;

    const upstreamBranchDefault = this.lastSourceTargetBranch || 'feat-test-250918';
    const upstreamBranch = await this.prompt(
      '升级源码分支（默认取源仓库推送的目标分支）',
      upstreamBranchDefault,
      '从源仓库推送过来的同步分支，这个分支只做数据同步和源码一致，test环境固定是feat-test-250918'
    );
    if (!upstreamBranch) return;

    const featureBranch = await this.prompt(
      '升级特性分支名称',
      `feature/upgrade-test-${today}`,
      '在当前仓库上创建的升级特性分支，用来做脚本升级与冲突处理的中间分支'
    );
    if (!featureBranch) return;

    return {
      remoteName,
      remoteUrl,
      baseBranch,
      upstreamBranch,
      featureBranch,
      remoteTargetBranch: upstreamBranch,
    };
  }

  private async collectRebuildParams(remoteName: string, remoteUrl: string): Promise<RebuildSyncParams | undefined> {
    const today = this.getDateTag();
    const baseDefault = this.lastSourceTargetBranch || 'feat-test-250918';
    const baseBranch = await this.prompt(
      '升级基线分支（默认取源仓库推送的目标分支）',
      baseDefault,
      '升级基线分支: 后续基于基线分支拉取特性分支'
    );
    if (!baseBranch) return;

    const newBranch = await this.prompt(
      '升级特性分支名称',
      `feature/upgrade-test-${today}`,
      '新的升级特性分支，执行脚本升级 --commit'
    );
    if (!newBranch) return;

    const previousBranch = await this.prompt(
      '需要合并的上一版本特性分支（如 feature/upgrade-test-旧）',
      '',
      '可选：把上一版升级分支合并进来，保持连续性'
    );
    if (previousBranch === undefined) return;

    const finalBaseBranch = await this.prompt(
      '最终合入的分支（默认 test-220915）',
      'test-220915',
      '完成升级后最终合入的主分支'
    );
    if (!finalBaseBranch) return;

    return {
      remoteName,
      remoteUrl,
      baseBranch,
      previousBranch,
      newBranch,
      finalBaseBranch,
      remoteTargetBranch: baseBranch,
    };
  }

  private async runStandard(workspaceRoot: string, params: StandardSyncParams) {
    this.output.show(true);
    const steps: SyncStep[] = [
      { kind: 'info', title: `工作区：${workspaceRoot}` },
      { kind: 'command', title: `切换到升级基础分支 ${params.baseBranch}`, command: `git checkout ${params.baseBranch}` },
      { kind: 'command', title: `更新 origin/${params.baseBranch}`, command: `git pull origin ${params.baseBranch}` },
      { kind: 'command', title: `创建/切换升级特性分支 ${params.featureBranch}`, command: () => this.checkoutFeature(params.featureBranch, params.baseBranch, workspaceRoot) },
      { kind: 'command', title: `合入源码分支 origin/${params.upstreamBranch}`, command: () => this.runWithConflictSupport(`git pull origin ${params.upstreamBranch}`, workspaceRoot, true) },
      { kind: 'pause', title: '处理冲突:', detail: '规则: (1)遇到 voucherconfig 冲突时先保留当前分支版本，之后再覆盖；(2)涉及 bizSchemaManager/bizApplication 的冲突优先采用当前分支；(3) 引用冲突可按需对比后取新分支。(4) 解决完毕后点击继续。', command: () => this.openConflictResolver() },
      { kind: 'command', title: '执行升级脚本 yarn upgrade', command: 'yarn upgrade' },
      { kind: 'command', title: '运行单测 yarn test（可在弹窗选择跳过）', command: () => this.runOptionalTest(workspaceRoot) },
      { kind: 'command', title: `推送特性分支到 origin/${params.featureBranch}`, command: `git push origin ${params.featureBranch}` },
      { kind: 'command', title: `切回基础分支 ${params.baseBranch}`, command: `git checkout ${params.baseBranch}` },
      { kind: 'command', title: `合并 ${params.featureBranch} 到 ${params.baseBranch}`, command: () => this.runWithConflictSupport(`git merge ${params.featureBranch}`, workspaceRoot, true) },
      { kind: 'command', title: `推送 ${params.baseBranch} 到 origin`, command: `git push origin ${params.baseBranch}` },
      { kind: 'command', title: `推送 ${params.baseBranch} 到远程 ${params.remoteName}`, command: `git push ${params.remoteName} ${params.baseBranch}:${params.baseBranch}` },
      { kind: 'pause', title: '流程完成', detail: '请部署pre-test环境，或继续人工验证。' },
    ];

    await this.runSteps('Biz 框架升级同步（常规）', steps, workspaceRoot);
  }

  private async runSourcePush(workspaceRoot: string, params: { remoteName: string; remoteUrl: string; baseBranch: string; targetBranch: string }) {
    this.output.show(true);
    const steps: SyncStep[] = [
      { kind: 'info', title: `工作区：${workspaceRoot}` },
      { kind: 'command', title: `确保远程 ${params.remoteName} 存在`, command: () => this.ensureRemote(params.remoteName, params.remoteUrl, workspaceRoot) },
      {
        kind: 'command',
        title: '拉取最新代码（origin）',
        command: async () => {
          await this.execLogged('git fetch origin', workspaceRoot);
        },
      },
      { kind: 'command', title: `切换到基线分支 ${params.baseBranch}`, command: `git checkout ${params.baseBranch}` },
      { kind: 'command', title: `更新 origin/${params.baseBranch}`, command: `git pull origin ${params.baseBranch}` },
      { kind: 'command', title: `推送到 plus/${params.targetBranch}`, command: `git push ${params.remoteName} ${params.baseBranch}:${params.targetBranch}` },
      {
        kind: 'pause',
        title: '源仓库推送完成',
        detail: '切换到 app-service-plus 仓库继续后续升级流程。',
        onContinue: () => this.continueInTarget(workspaceRoot, params.remoteName, params.remoteUrl),
      },
    ];

    await this.runSteps('Biz 框架升级同步（源仓库推送）', steps, workspaceRoot);
  }

  private async continueInTarget(currentRoot: string, remoteName: string, remoteUrl: string) {
    const targetRoot = await this.pickOtherWorkspace(currentRoot);
    if (!targetRoot) return;

    type TargetScenario = vscode.QuickPickItem & { value: 'standard' | 'rebuild' };
    const targetModes: TargetScenario[] = [
      { label: '目标仓库(app-service-plus)：常规同步', description: '无脚本/小改动', value: 'standard' },
      { label: '目标仓库(app-service-plus)：重建分支', description: '脚本变更/结构调整', value: 'rebuild' },
    ];

    const chosenMode = await vscode.window.showQuickPick<TargetScenario>(targetModes, {
      placeHolder: '选择在 app-service-plus 上要执行的升级模式',
    });
    if (!chosenMode) return;

    if (chosenMode.value === 'standard') {
      const params = await this.collectStandardParams(remoteName, remoteUrl);
      if (params) {
        await this.runStandard(targetRoot, params);
      }
    } else {
      const params = await this.collectRebuildParams(remoteName, remoteUrl);
      if (params) {
        await this.runRebuild(targetRoot, params);
      }
    }
  }

  private async pickOtherWorkspace(currentRoot: string): Promise<string | undefined> {
    const folders = vscode.workspace.workspaceFolders || [];
    const picks = folders
      .filter(f => f.uri.fsPath !== currentRoot)
      .map(f => ({
        label: f.name,
        description: f.uri.fsPath,
        value: f.uri.fsPath,
      }));

    if (picks.length === 0) {
      vscode.window.showInformationMessage('未找到其他工作区，请先将 app-service-plus 加入工作区。');
      return;
    }

    const chosen = await vscode.window.showQuickPick(picks, {
      placeHolder: '选择 app-service-plus 工作区继续升级流程',
    });

    return chosen?.value;
  }

  private async runRebuild(workspaceRoot: string, params: RebuildSyncParams) {
    this.output.show(true);
    const steps: SyncStep[] = [
      { kind: 'info', title: `工作区：${workspaceRoot}` },
      { kind: 'command', title: `切换到升级基线分支 ${params.baseBranch}`, command: `git checkout ${params.baseBranch}` },
      { kind: 'command', title: `更新 origin/${params.baseBranch}`, command: `git pull origin ${params.baseBranch}` },
      { kind: 'command', title: `创建/切换升级特性分支 ${params.newBranch}`, command: () => this.checkoutFeature(params.newBranch, params.baseBranch, workspaceRoot) },
      { kind: 'command', title: '执行升级脚本 yarn upgrade --commit', command: 'yarn upgrade --commit' },
      {
        kind: 'command', title: `合并上一版本分支 ${params.previousBranch || '(无)'}`, command: async () => {
          if (!params.previousBranch) return;
          await this.execLogged(`git fetch origin ${params.previousBranch}`, workspaceRoot);
          await this.runWithConflictSupport(`git merge origin/${params.previousBranch} --no-verify`, workspaceRoot, true);
        }
      },
      { kind: 'command', title: '打开冲突解决器（SCM 视图）', command: () => this.openConflictResolver() },
      { kind: 'pause', title: '处理冲突', detail: '按文档要求处理 voucherconfig、bizSchemaManager/bizApplication 等文件的冲突。完成后点击继续。' },
      { kind: 'command', title: '运行单测 yarn test（可在弹窗选择跳过）', command: () => this.runOptionalTest(workspaceRoot) },
      { kind: 'command', title: `推送新分支到 origin/${params.newBranch}`, command: `git push origin ${params.newBranch}` },
      { kind: 'command', title: `切换到最终合入分支 ${params.finalBaseBranch}`, command: `git checkout ${params.finalBaseBranch}` },
      { kind: 'command', title: `更新 origin/${params.finalBaseBranch}`, command: `git pull origin ${params.finalBaseBranch}` },
      { kind: 'command', title: `合并 ${params.newBranch} 到 ${params.finalBaseBranch}`, command: () => this.runWithConflictSupport(`git merge ${params.newBranch}`, workspaceRoot, true) },
      { kind: 'command', title: `推送 ${params.finalBaseBranch} 到 origin`, command: `git push origin ${params.finalBaseBranch}` },
      { kind: 'command', title: `推送 ${params.finalBaseBranch} 到远程 ${params.remoteName}`, command: `git push ${params.remoteName} ${params.finalBaseBranch}:${params.finalBaseBranch}` },
      { kind: 'pause', title: '流程完成', detail: '请部署pre-test环境，并按需回归验证。' },
    ];

    await this.runSteps('Biz 框架升级同步（重建分支）', steps, workspaceRoot);
  }

  private async runSteps(title: string, steps: SyncStep[], cwd: string) {
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title,
          cancellable: true,
        },
        async (progress, token) => {
          for (let i = 0; i < steps.length; i++) {
            if (token.isCancellationRequested) throw new Error('用户取消');
            const step = steps[i];
            progress.report({ message: step.title, increment: (i / steps.length) * 100 });

            if (step.kind === 'pause') {
              await this.waitForContinue(step);
              continue;
            }

            if (step.kind === 'info') {
              this.output.appendLine(step.title);
              if (step.detail) this.output.appendLine(step.detail);
              continue;
            }

            await this.runCommand(step, cwd);
          }
        }
      );

      vscode.window.showInformationMessage(`${title} 已完成。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const action = await vscode.window.showErrorMessage(`同步流程中断：${message}`, '查看输出');
      if (action === '查看输出') {
        this.output.show(true);
      }
    }
  }

  private async runCommand(step: SyncStep, cwd: string) {
    if (!step.command) return;
    const commandToRun = step.command;
    if (typeof commandToRun === 'function') {
      await commandToRun();
      return;
    }

    await this.execLogged(commandToRun, cwd);
  }

  private async execLogged(command: string, cwd: string) {
    this.output.appendLine(`> ${command}`);
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      if (stdout) this.output.appendLine(stdout.trim());
      if (stderr) this.output.appendLine(stderr.trim());
    } catch (error) {
      const err = error as { stderr?: string; message: string };
      if (err.stderr) this.output.appendLine(err.stderr.trim());
      throw new Error(err.message);
    }
  }

  private async runWithConflictSupport(command: string, cwd: string, warnOnConflict = false) {
    this.output.appendLine(`> ${command}`);
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      if (stdout) this.output.appendLine(stdout.trim());
      if (stderr) this.output.appendLine(stderr.trim());
    } catch (error) {
      const err = error as { stderr?: string; stdout?: string; message: string };
      const stderr = (err.stderr || '').trim();
      const stdout = (err.stdout || '').trim();
      const message = err.message || '';
      const merged = [stdout, stderr, message].filter(Boolean).join('\n');

      const isConflict = /CONFLICT|Automatic merge failed/i.test(merged);
      const isMergeOrPull = /git (pull|merge)/i.test(command);

      // 对 pull/merge 的非零返回，统一当作需要人工处理（即便未显式输出 CONFLICT）
      if (isConflict || (warnOnConflict && isMergeOrPull)) {
        if (merged) this.output.appendLine(merged);
        vscode.window.showWarningMessage('检测到可能的冲突/合并中断，请在 SCM 视图中解决后点击“继续”或执行命令：Biz Helper: 继续同步流程。');
        await this.openConflictResolver();
        return;
      }

      throw new Error(err.message);
    }
  }

  private async ensureRemote(remoteName: string, remoteUrl: string, cwd: string) {
    try {
      await this.execLogged(`git remote get-url ${remoteName}`, cwd);
      return;
    } catch {
      // continue to add remote
    }
    await this.execLogged(`git remote add ${remoteName} ${remoteUrl}`, cwd);
  }

  private async ensureRemoteUrl(remoteName: string, cwd: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync(`git remote get-url ${remoteName}`, { cwd });
      return stdout.trim();
    } catch {
      const defaultUrl = 'https://gitlab.rd.chanjet.com/cc_web/cc-front-biz-app-service-plus';
      return this.prompt('远程仓库地址', defaultUrl, '填写 plus 仓库地址（如果尚未 git remote add）');
    }
  }

  private async checkoutFeature(featureBranch: string, baseBranch: string, cwd: string) {
    try {
      await this.execLogged(`git rev-parse --verify ${featureBranch}`, cwd);
      await this.execLogged(`git checkout ${featureBranch}`, cwd);
    } catch {
      await this.execLogged(`git checkout -b ${featureBranch} ${baseBranch}`, cwd);
    }
  }

  private async runOptionalTest(cwd: string) {
    const choice = await vscode.window.showInformationMessage('是否运行 yarn test？', '运行', '跳过');
    if (choice === '运行') {
      await this.execLogged('yarn test', cwd);
    } else {
      this.output.appendLine('跳过 yarn test。');
    }
  }

  private async openConflictResolver() {
    // 打开源代码管理视图，便于使用内置冲突解决器或 merge editor
    await vscode.commands.executeCommand('workbench.view.scm');
    // 提示用户可在 Source Control 面板中展开 Merge Changes 逐项解决
    vscode.window.showInformationMessage('已打开源代码管理视图，请在 Merge Changes 区域逐项解决冲突。');
  }

  private async waitForContinue(step: SyncStep) {
    this.pendingResolve = null;
    this.pendingReject = null;
    this.pendingMessage = null;

    const message = step.detail ? `${step.title}:${step.detail}` : step.title;
    this.pendingMessage = message;

    const choicePromise = new Promise<void>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });

    // 输出到 Output Channel 提醒用户
    this.output.appendLine('');
    this.output.appendLine('='.repeat(50));
    this.output.appendLine(`⏸️  ${message}`);
    this.output.appendLine('请处理完成后执行命令: "Biz Helper: 继续同步流程"');
    this.output.appendLine('='.repeat(50));
    this.output.appendLine('');

    // 显示持久化的状态栏消息
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      600000
    );
    statusBarItem.text = '$(debug-pause) 等待继续同步...';
    statusBarItem.tooltip = message;
    statusBarItem.command = 'bizHelper.continue'; // 绑定到继续命令
    statusBarItem.show();

    // 也显示一个通知
    vscode.window.showInformationMessage(
      message,
      '继续',
      '取消'
    ).then(choice => {
      if (choice === '继续') {
        statusBarItem.dispose();
        this.resolvePending();
      } else if (choice === '取消') {
        statusBarItem.dispose();
        this.rejectPending(new Error('用户取消'));
      }
    });

    await choicePromise;

    if (step.onContinue) {
      await step.onContinue();
    }
  }

  resolvePending() {
    if (this.pendingResolve) {
      this.pendingResolve();
    }
    this.pendingResolve = null;
    this.pendingReject = null;
    this.pendingMessage = null;
  }

  rejectPending(reason?: any) {
    if (this.pendingReject) {
      this.pendingReject(reason);
    }
    this.pendingResolve = null;
    this.pendingReject = null;
    this.pendingMessage = null;
  }

  private async prompt(placeHolder: string, value?: string, promptMessage?: string) {
    return vscode.window.showInputBox({
      placeHolder,
      value,
      prompt: promptMessage,
    });
  }

  private getDateTag() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}${month}${day}`;
  }
}

