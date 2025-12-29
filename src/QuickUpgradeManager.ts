import * as vscode from 'vscode';
import { exec, spawn } from 'child_process';
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

interface QuickUpgradeParams {
  env: 'test' | 'inte';
  targetBranch: string;
  sourceBranch: string;
  featureBranch: string;
}

/**
 * 快速升级管理器
 * 这是 SyncManager 的精简版，专注于 test/inte 环境的快速升级
 */
export class QuickUpgradeManager {
  private output = vscode.window.createOutputChannel('Biz Quick Upgrade');
  private pendingResolve: (() => void) | null = null;
  private pendingReject: ((reason?: any) => void) | null = null;
  private pendingMessage: string | null = null;
  private currentStatusBarItem: vscode.StatusBarItem | null = null;

  /**
   * 运行快速升级流程
   */
  async run(workspaceRoot: string) {
    try {
      // 前置检查
      await this.preflightCheck(workspaceRoot);

      // 收集参数
      const params = await this.collectParams();
      if (!params) return;

      // 执行升级流程
      await this.runUpgrade(workspaceRoot, params);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`快速升级失败: ${message}`);
      this.output.appendLine(`\n❌ 错误: ${message}`);
    }
  }

  /**
   * 前置检查
   */
  private async preflightCheck(workspaceRoot: string) {
    this.output.show(true);
    this.output.appendLine('='.repeat(60));
    this.output.appendLine('🚀 开始快速升级流程');
    this.output.appendLine('='.repeat(60));
    this.output.appendLine('');

    // 检查是否为 Git 仓库
    try {
      await this.execLogged('git rev-parse --git-dir', workspaceRoot);
    } catch (error) {
      throw new Error('当前目录不是 Git 仓库');
    }

    // 检查工作区状态
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: workspaceRoot });
      if (stdout.trim()) {
        const choice = await vscode.window.showWarningMessage(
          '工作区有未提交的更改，是否继续？',
          { modal: true },  // 模态对话框
          '继续',
          '取消'
        );
        if (choice !== '继续') {
          throw new Error('用户取消：工作区有未提交的更改');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('用户取消')) {
        throw error;
      }
      // 其他错误忽略，继续执行
    }

    this.output.appendLine('✅ 前置检查通过\n');
  }

  /**
   * 收集升级参数
   */
  private async collectParams(): Promise<QuickUpgradeParams | undefined> {
    // 步骤1: 选择升级环境
    type EnvPick = vscode.QuickPickItem & { value: 'test' | 'inte' };
    const envOptions: EnvPick[] = [
      {
        label: '$(cloud) Test 环境',
        description: 'plus-upgrade-test → test-220915',
        detail: '测试环境快速升级',
        value: 'test',
      },
      {
        label: '$(rocket) Inte 环境',
        description: 'plus-upgrade-sprint → sprint-251225',
        detail: '集成环境快速升级',
        value: 'inte',
      },
    ];

    const envChoice = await vscode.window.showQuickPick<EnvPick>(envOptions, {
      placeHolder: '选择要升级的环境',
      title: '快速升级 - 步骤 1/2',
    });

    if (!envChoice) return;
    const env = envChoice.value;

    // 根据环境确定分支
    const branchMap = {
      test: {
        targetBranch: 'test-220915',
        sourceBranch: 'plus-upgrade-test',
      },
      inte: {
        targetBranch: 'sprint-251225',
        sourceBranch: 'plus-upgrade-sprint',
      },
    };

    const { targetBranch, sourceBranch } = branchMap[env];

    // 步骤2: 输入特性分支后缀
    const today = this.getDateTag();
    const suffix = await vscode.window.showInputBox({
      prompt: `特性分支将自动添加前缀：upgrade/${env}-`,
      placeHolder: `请输入特性分支后缀（如：${today}）`,
      value: today,
      title: '快速升级 - 步骤 2/2',
      validateInput: (value) => {
        if (!value || !value.trim()) {
          return '请输入分支后缀';
        }
        if (value.includes('/') || value.includes(' ')) {
          return '分支名不能包含 / 或空格';
        }
        return null;
      },
    });

    if (!suffix) return;

    const featureBranch = `upgrade/${env}-${suffix.trim()}`;

    // 步骤3：确认目标分支
    const targetBranchInput = await vscode.window.showInputBox({
      prompt: `请输入目标分支名称`,
      placeHolder: `请输入目标分支名称`,
      value: targetBranch,
      title: '快速升级 - 步骤 3/3',
    });

    if (!targetBranchInput) return;

    return {
      env,
      targetBranch: targetBranchInput,
      sourceBranch,
      featureBranch,
    };
  }

  /**
   * 执行升级流程
   */
  private async runUpgrade(workspaceRoot: string, params: QuickUpgradeParams) {
    const { env, targetBranch, sourceBranch, featureBranch } = params;

    const steps: SyncStep[] = [
      // 0. 信息展示
      {
        kind: 'info',
        title: `📁 工作区：${workspaceRoot}`,
      },
      {
        kind: 'info',
        title: `🎯 升级环境：${env.toUpperCase()}`,
        detail: `   目标分支：${targetBranch}\n   源分支：${sourceBranch}\n   特性分支：${featureBranch}`,
      },

      // 1. 切换并更新目标分支
      {
        kind: 'command',
        title: `切换到目标分支 ${targetBranch}`,
        command: `git checkout ${targetBranch}`,
      },
      {
        kind: 'command',
        title: `更新 origin/${targetBranch}`,
        command: `git pull origin ${targetBranch}`,
      },

      // 2. 创建/切换特性分支
      {
        kind: 'command',
        title: `创建/切换特性分支 ${featureBranch}`,
        command: () => this.checkoutFeature(featureBranch, targetBranch, workspaceRoot),
      },

      // 3. 合入源代码分支（自动检测冲突，有冲突时会自动暂停）
      {
        kind: 'command',
        title: `合入源码分支 origin/${sourceBranch}`,
        command: () => this.runWithConflictSupport(`git pull origin ${sourceBranch}`, workspaceRoot),
      },

      // 4. 执行升级脚本（自动等待完成，保持彩色输出）
      {
        kind: 'command',
        title: '正在执行升级脚本与单测验证，请在终端中查看进度...',
        command: () => this.execInTerminalAndWait('node ./scripts/upgrade-bizcore.js', workspaceRoot, '升级脚本'),
      },


      // 6. 提交特性分支代码
      {
        kind: 'command',
        title: '提交升级变更，等待git commit完成...',
        command: () => this.commitChanges(sourceBranch, workspaceRoot),
      },

      // 7. 合并前确认（二次确认）
      {
        kind: 'pause',
        title: `⚠️  即将合并到目标分支 ${targetBranch}`,
        detail: `请确认以下信息：
✓ 特性分支 ${featureBranch} 已完成升级
✓ 单测已通过（或已知风险）

注意：此操作将切到 ${targetBranch} 分支进行代码合并，请谨慎操作！

确认无误后点击"继续"按钮。`,
      },

      // 8. 切回目标分支
      {
        kind: 'command',
        title: `切回目标分支 ${targetBranch}`,
        command: `git checkout ${targetBranch}`,
      },

      // 9. 更新目标分支
      {
        kind: 'command',
        title: `更新 origin/${targetBranch}`,
        command: `git pull origin ${targetBranch}`,
      },



      // 11. 合并特性分支到目标分支（自动检测冲突）
      {
        kind: 'command',
        title: `合并 ${featureBranch} 到 ${targetBranch}`,
        command: () => this.runWithConflictSupport(`git merge ${featureBranch}`, workspaceRoot),
      },
      // 5. 运行单测（可选）
      {
        kind: 'command',
        title: `运行 ${targetBranch}分支的单测 yarn test`,
        command: () => this.runOptionalTest(workspaceRoot),
      },


      // 12. 推送目标分支
      {
        kind: 'command',
        title: `推送 ${targetBranch} 到 origin`,
        command: `git push origin ${targetBranch}`,
      },

      // 13. 删除临时特性分支
      {
        kind: 'command',
        title: `删除临时特性分支 ${featureBranch}`,
        command: () => this.deleteFeatureBranch(featureBranch, workspaceRoot),
      },

      // 14. 完成
      {
        kind: 'info',
        title: '🎉 快速升级流程完成',
        detail: `后续操作：
1. 部署 ${env === 'test' ? 'pre-test' : 'pre-inte'} 环境
2. 进行功能验证
3. 观察线上日志
4. 如有问题，可回滚到升级前版本`,
      },
    ];

    await this.runSteps('Biz 框架快速升级', steps, workspaceRoot);
  }

  /**
   * 执行步骤列表
   */
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
            if (token.isCancellationRequested) {
              throw new Error('用户取消');
            }

            const step = steps[i];
            const percentage = Math.floor((i / steps.length) * 100);
            progress.report({
              message: `${step.title} (${i + 1}/${steps.length})`,
              increment: percentage,
            });

            if (step.kind === 'pause') {
              await this.waitForContinue(step);
              continue;
            }

            if (step.kind === 'info') {
              this.output.appendLine(step.title);
              if (step.detail) {
                this.output.appendLine(step.detail);
              }
              this.output.appendLine('');
              continue;
            }

            await this.runCommand(step, cwd);
          }
        }
      );

      vscode.window.showInformationMessage(`${title} 已完成！`, '查看输出').then((choice) => {
        if (choice === '查看输出') {
          this.output.show(true);
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const action = await vscode.window.showErrorMessage(
        `升级流程中断：${message}`,
        '查看输出',
        '重试'
      );
      if (action === '查看输出') {
        this.output.show(true);
      }
      throw error;
    } finally {
      // 清理状态栏按钮（流程结束时，无论成功或失败）
      if (this.currentStatusBarItem) {
        this.currentStatusBarItem.dispose();
        this.currentStatusBarItem = null;
      }
    }
  }

  /**
   * 执行单个命令
   */
  private async runCommand(step: SyncStep, cwd: string) {
    if (!step.command) return;

    const commandToRun = step.command;
    if (typeof commandToRun === 'function') {
      await commandToRun();
      return;
    }

    await this.execLogged(commandToRun, cwd);
  }

  /**
   * 执行命令并记录日志
   */
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

  /**
   * 在集成终端中执行命令并自动等待完成（支持 ANSI 颜色）
   * 使用标记文件来检测命令是否完成
   */
  private async execInTerminalAndWait(command: string, cwd: string, name: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();

      // 使用标记文件检测命令完成
      const fs = require('fs');
      const path = require('path');
      const marker = `.upgrade-marker-${Date.now()}`;
      const successMarker = `${marker}-success`;
      const failMarker = `${marker}-fail`;
      const successPath = path.join(cwd, successMarker);
      const failPath = path.join(cwd, failMarker);

      // 输出开始信息
      this.output.appendLine('');
      this.output.appendLine('='.repeat(60));
      this.output.appendLine(`⚙️  执行命令: ${command}`);
      this.output.appendLine(`📺 终端名称: Biz Upgrade: ${name}`);
      this.output.appendLine(`📁 工作目录: ${cwd}`);
      this.output.appendLine(`🕐 开始时间: ${new Date().toLocaleTimeString()}`);
      this.output.appendLine(`🔍 成功标记: ${successMarker}`);
      this.output.appendLine(`🔍 失败标记: ${failMarker}`);
      this.output.appendLine('='.repeat(60));
      this.output.appendLine('');
      this.output.appendLine('👉 命令正在集成终端中运行，可以看到完整的彩色输出');
      this.output.appendLine('👉 命令完成后会自动检测并继续下一步');
      this.output.appendLine('👉 正在等待命令完成...');
      this.output.appendLine('');

      // 创建终端
      const terminal = vscode.window.createTerminal({
        name: `Biz Upgrade: ${name}`,
        cwd: cwd,
      });
      terminal.show(true);

      // 清理可能存在的旧标记
      try {
        if (fs.existsSync(successPath)) fs.unlinkSync(successPath);
        if (fs.existsSync(failPath)) fs.unlinkSync(failPath);
      } catch { }

      // 执行命令并在完成后创建标记文件（合并为一条命令）
      const fullCommand = `${command}; if [ $? -eq 0 ]; then touch ${successMarker}; else touch ${failMarker}; fi`;
      terminal.sendText(fullCommand);

      // 轮询检查标记文件
      let checkCount = 0;
      const checkInterval = setInterval(() => {
        checkCount++;

        // 每 10 秒输出一次检测日志（20 次 * 500ms = 10秒）
        if (checkCount % 20 === 0) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          this.output.appendLine(`⏳ 等待中... (已等待 ${elapsed} 秒，检查标记文件: ${successMarker})`);
        }

        if (fs.existsSync(successPath)) {
          clearInterval(checkInterval);
          clearTimeout(timeout);

          // 清理标记文件
          try {
            fs.unlinkSync(successPath);
          } catch { }

          const endTime = Date.now();
          const duration = Math.floor((endTime - startTime) / 1000);
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const durationText = minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;

          this.output.appendLine('');
          this.output.appendLine('='.repeat(60));
          this.output.appendLine(`✅ 检测到命令执行完成`);
          this.output.appendLine(`⏱️  耗时: ${durationText}`);
          this.output.appendLine(`🕐 完成时间: ${new Date().toLocaleTimeString()}`);
          this.output.appendLine('='.repeat(60));
          this.output.appendLine('');

          vscode.window.showInformationMessage(`${name} 执行完成，耗时 ${durationText}`);
          resolve();
        } else if (fs.existsSync(failPath)) {
          clearInterval(checkInterval);
          clearTimeout(timeout);

          // 清理标记文件
          try {
            fs.unlinkSync(failPath);
          } catch { }

          const endTime = Date.now();
          const duration = Math.floor((endTime - startTime) / 1000);
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const durationText = minutes > 0 ? `${minutes} 分 ${seconds} 秒` : `${seconds} 秒`;

          this.output.appendLine('');
          this.output.appendLine('='.repeat(60));
          this.output.appendLine(`❌ 检测到命令执行失败`);
          this.output.appendLine(`⏱️  耗时: ${durationText}`);
          this.output.appendLine('='.repeat(60));
          this.output.appendLine('');

          reject(new Error('命令执行失败'));
        }
      }, 500);

      // 超时保护（30 分钟）
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);

        // 清理标记文件
        try {
          if (fs.existsSync(successPath)) fs.unlinkSync(successPath);
          if (fs.existsSync(failPath)) fs.unlinkSync(failPath);
        } catch { }

        this.output.appendLine('');
        this.output.appendLine('❌ 命令执行超时（30分钟）');
        this.output.appendLine('');

        reject(new Error('命令执行超时（30分钟）'));
      }, 30 * 60 * 1000);
    });
  }

  /**
   * 在集成终端中执行命令（支持 ANSI 颜色，保持原样式）
   */

  /**
   * 执行命令（支持冲突检测）
   */
  private async runWithConflictSupport(command: string, cwd: string) {
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

      // 检测到冲突或合并失败
      if (isConflict || isMergeOrPull) {
        if (merged) this.output.appendLine(merged);

        // 检查是否真的有冲突文件
        const hasConflicts = await this.checkConflictFiles(cwd);

        if (hasConflicts) {
          // 有冲突，调用 handleConflict 等待用户解决
          await this.handleConflict(cwd);
        } else {
          // 可能是其他合并问题，输出警告但继续
          this.output.appendLine('');
          this.output.appendLine('⚠️  合并命令执行失败，但未检测到冲突文件');
          this.output.appendLine('');
        }
        return;
      }

      // 其他错误
      throw new Error(err.message);
    }
  }

  /**
   * 检查是否存在冲突文件
   */
  private async checkConflictFiles(cwd: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync('git diff --name-only --diff-filter=U', { cwd });
      const conflictFiles = stdout.trim();
      return conflictFiles.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 处理冲突（暂停并等待用户解决）
   */
  private async handleConflict(cwd: string) {
    this.output.appendLine('');
    this.output.appendLine('⚠️  检测到合并冲突，需要手动解决');

    // 列出冲突文件
    try {
      const { stdout } = await execAsync('git diff --name-only --diff-filter=U', { cwd });
      const conflictFiles = stdout.trim().split('\n').filter(Boolean);
      this.output.appendLine('\n冲突文件列表：');
      conflictFiles.forEach(file => {
        this.output.appendLine(`  - ${file}`);
      });
      this.output.appendLine('');
    } catch {
      // 忽略错误
    }

    // 打开 SCM 视图
    await this.openConflictResolver();

    // 暂停流程，等待用户解决冲突
    await this.waitForContinue({
      kind: 'pause',
      title: '⚠️  等待解决合并冲突',
      detail: `冲突处理规则：
(1) voucherconfig 冲突：先保留当前分支版本，之后再覆盖
(2) bizSchemaManager/bizApplication：优先采用当前分支
(3) 引用冲突：对比后按需取新分支
(4) 完成后点击"继续"按钮`,
    });

    // 验证冲突是否已解决
    const stillHasConflicts = await this.checkConflictFiles(cwd);
    if (stillHasConflicts) {
      const choice = await vscode.window.showWarningMessage(
        '仍然存在未解决的冲突，是否继续？',
        { modal: true },  // 模态对话框
        '重新检查',
        '强制继续',
        '中止'
      );

      if (choice === '重新检查') {
        await this.handleConflict(cwd);
      } else if (choice === '中止') {
        throw new Error('用户中止：存在未解决的冲突');
      }
      // "强制继续" 会直接继续执行
    } else {
      this.output.appendLine('✅ 冲突已解决\n');
    }
  }

  /**
   * 创建或切换到特性分支
   */
  private async checkoutFeature(featureBranch: string, baseBranch: string, cwd: string) {
    try {
      // 检查分支是否存在
      await this.execLogged(`git rev-parse --verify ${featureBranch}`, cwd);
      // 分支存在，切换过去
      this.output.appendLine(`✓ 特性分支 ${featureBranch} 已存在`);
      await this.execLogged(`git checkout ${featureBranch}`, cwd);
    } catch {
      // 分支不存在，基于基础分支创建
      this.output.appendLine(`✓ 创建新特性分支 ${featureBranch}`);
      await this.execLogged(`git checkout -b ${featureBranch} ${baseBranch}`, cwd);
    }
  }

  /**
   * 删除临时特性分支
   */
  private async deleteFeatureBranch(featureBranch: string, cwd: string) {
    try {
      // 删除本地特性分支（-D 强制删除，因为已经合并过了）
      await this.execLogged(`git branch -D ${featureBranch}`, cwd);
      this.output.appendLine(`✅ 临时特性分支 ${featureBranch} 已删除\n`);
    } catch (error) {
      // 删除失败不中断流程，只输出警告
      this.output.appendLine(`⚠️  删除特性分支失败，可稍后手动删除: git branch -D ${featureBranch}\n`);
    }
  }

  /**
   * 运行单测（可选）
   */
  private async runOptionalTest(cwd: string) {
    // 使用模态对话框，确保用户能看到并做出选择
    const choice = await vscode.window.showInformationMessage(
      `代码已合并完成，是否在目标分支运行单测？\n\n单测通常需要 1-10 分钟，建议在升级后运行以验证代码正确性。`,
      { modal: true },
      '运行',
      '跳过'
    );

    if (choice === '运行') {
      await this.runTestWithRetry(cwd);
    } else {
      this.output.appendLine('⏭️  跳过单测\n');
    }
  }

  /**
   * 运行单测（支持失败后重试）
   */
  private async runTestWithRetry(cwd: string) {
    let testPassed = false;

    while (!testPassed) {
      this.output.appendLine('🧪 开始运行单测...\n');
      try {
        await this.execInTerminalAndWait('yarn test', cwd, '单元测试');
        this.output.appendLine('✅ 单测完成\n');
        testPassed = true;
      } catch (error) {
        this.output.appendLine('⚠️  单测失败\n');

        // 单测失败，暂停流程，让用户修复后继续
        await this.waitForContinue({
          kind: 'pause',
          title: '⚠️  单测执行失败，需要修复',
          detail: `单测失败处理方式：
(1) 请在终端查看失败原因
(2) 修复相关代码或测试文件
(3) 点击左下角"继续升级"按钮重新运行单测
(4) 如果确认单测问题可忽略，请选择"跳过单测"

注意：修复完成后点击"继续"按钮将重新运行单测验证`,
        });

        // 用户点击继续后，询问是重新运行还是跳过
        const action = await vscode.window.showInformationMessage(
          '请选择下一步操作',
          { modal: true },
          '重新运行单测',
          '跳过单测继续',
          '中止升级'
        );

        if (action === '重新运行单测') {
          // 继续循环，重新运行单测
          continue;
        } else if (action === '跳过单测继续') {
          // 跳过单测，标记为通过并退出循环
          this.output.appendLine('⏭️  用户选择跳过单测，继续后续流程\n');
          testPassed = true;
        } else {
          // 中止升级
          throw new Error('单测失败，用户中止流程');
        }
      }
    }
  }

  /**
   * 提交变更
   */
  private async commitChanges(sourceBranch: string, cwd: string): Promise<void> {
    // 检查是否有变更
    const { stdout } = await execAsync('git status --porcelain', { cwd });
    if (!stdout.trim()) {
      this.output.appendLine('✓ 没有需要提交的变更');
      return;
    }

    // 暂存变更
    await this.execLogged('git add .', cwd);

    // 让用户填写提交信息
    const defaultMessage = `upgrade(CPYF-12595):${this.getDateTag(true)} ${sourceBranch} 分支代码升级 `;
    const commitMessage = await vscode.window.showInputBox({
      prompt: '请输入提交信息（Commit Message）',
      placeHolder: '例如：chore: upgrade from plus-test-250918',
      value: defaultMessage,
      title: '提交升级变更',
      validateInput: (value) => {
        if (!value || !value.trim()) {
          return '提交信息不能为空';
        }
        return null;
      },
    });

    // 如果用户取消输入
    if (!commitMessage) {
      const choice = await vscode.window.showWarningMessage(
        '未填写提交信息。\n\n跳过提交将结束后续流程，不会执行后续步骤（推送分支、合并等），需个人手动提交代码。',
        { modal: true },
        '跳过提交并结束',
        '重新填写',
        '中止流程'
      );

      if (choice === '重新填写') {
        // 递归调用，重新提示
        return this.commitChanges(sourceBranch, cwd);
      } else if (choice === '中止流程') {
        throw new Error('用户取消：未填写提交信息');
      } else if (choice === '跳过提交并结束') {
        // 跳过提交，终止整个流程
        this.output.appendLine('⏭️  跳过提交，流程已结束\n');
        throw new Error('用户选择跳过提交，流程结束');
      }
      // 如果用户关闭对话框（choice 为 undefined），也终止流程
      throw new Error('用户取消：未填写提交信息');
    }

    // 此时 commitMessage 一定不为空（已验证）
    if (!commitMessage) {
      throw new Error('提交信息为空');
    }

    // 提交变更
    try {
      await this.execLogged(`git commit -m "${commitMessage.replace(/"/g, '\\"')}" --no-verify`, cwd);
      this.output.appendLine('✅ 变更已提交\n');
    } catch (error) {
      // Git 提交失败，但不终止流程
      this.output.appendLine('⚠️  Git 提交失败，可能没有需要提交的变更或已经提交过\n');
      // 提交失败时不抛出错误，允许流程继续
    }
  }

  /**
   * 打开冲突解决器
   */
  private async openConflictResolver() {
    await vscode.commands.executeCommand('workbench.view.scm');
    vscode.window.showInformationMessage(
      '已打开源代码管理视图，请在 Merge Changes 区域逐项解决冲突'
    );
  }

  /**
   * 等待用户继续
   */
  private async waitForContinue(step: SyncStep) {
    this.pendingResolve = null;
    this.pendingReject = null;
    this.pendingMessage = null;

    const message = step.detail ? `${step.title}\n${step.detail}` : step.title;
    this.pendingMessage = message;

    const choicePromise = new Promise<void>((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;
    });

    // 输出到 Output Channel
    this.output.appendLine('');
    this.output.appendLine('='.repeat(60));
    this.output.appendLine(`⏸️  ${step.title}`);
    if (step.detail) {
      this.output.appendLine(step.detail);
    }
    this.output.appendLine('');
    this.output.appendLine('👉 请处理完成后执行命令: "Biz Helper: 继续快速升级"');
    this.output.appendLine('='.repeat(60));
    this.output.appendLine('');

    // 清理旧的状态栏按钮（如果存在）
    if (this.currentStatusBarItem) {
      this.currentStatusBarItem.dispose();
    }

    // 显示状态栏按钮（持久显示，不会消失，不阻塞界面）
    this.currentStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      999999
    );
    this.currentStatusBarItem.text = '$(debug-pause) 点击继续升级';
    this.currentStatusBarItem.tooltip = `${step.title}\n\n点击继续或执行命令: Biz Helper: 继续快速升级`;
    this.currentStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    this.currentStatusBarItem.command = 'bizHelper.resumeQuickUpgrade';
    this.currentStatusBarItem.show();

    // 显示非模态通知（不阻塞界面，允许操作）
    vscode.window
      .showInformationMessage(
        `${step.title}\n\n👉 请完成操作后点击左下角状态栏的"点击继续升级"按钮`,
        '继续',
        '取消'
      )
      .then((choice) => {
        if (choice === '继续') {
          this.resolvePending();
        } else if (choice === '取消') {
          this.rejectPending(new Error('用户取消'));
        }
      });

    // 等待用户点击状态栏按钮或通知中的按钮
    await choicePromise;

    if (step.onContinue) {
      await step.onContinue();
    }
  }

  /**
   * 继续执行（从暂停状态恢复）
   */
  resolvePending() {
    if (this.pendingResolve) {
      this.output.appendLine('✅ 用户点击继续，恢复升级流程\n');
      this.output.show(true);

      // 显示成功消息
      vscode.window.showInformationMessage('✅ 升级流程已恢复，继续执行...');

      // 执行 resolve
      const resolve = this.pendingResolve;

      // 清理状态栏按钮
      if (this.currentStatusBarItem) {
        this.currentStatusBarItem.dispose();
        this.currentStatusBarItem = null;
      }

      // 重置状态
      this.pendingResolve = null;
      this.pendingReject = null;
      this.pendingMessage = null;

      // 最后调用 resolve（确保状态已清理）
      resolve();
    } else {
      vscode.window.showWarningMessage('⚠️ 当前没有暂停的升级流程');
      this.output.appendLine('⚠️ resolvePending 被调用，但没有待处理的流程\n');
    }
  }

  /**
   * 拒绝执行（取消流程）
   */
  rejectPending(reason?: any) {
    if (this.pendingReject) {
      const errorMsg = reason instanceof Error ? reason.message : String(reason || '用户取消');
      this.output.appendLine(`❌ 升级流程已取消: ${errorMsg}\n`);
      this.output.show(true);

      // 执行 reject
      const reject = this.pendingReject;

      // 清理状态栏按钮
      if (this.currentStatusBarItem) {
        this.currentStatusBarItem.dispose();
        this.currentStatusBarItem = null;
      }

      // 重置状态
      this.pendingResolve = null;
      this.pendingReject = null;
      this.pendingMessage = null;

      // 最后调用 reject（确保状态已清理）
      reject(reason);
    } else {
      this.output.appendLine('⚠️ rejectPending 被调用，但没有待处理的流程\n');
    }
  }

  /**
   * 获取日期标签（YYMMDD）
   */
  private getDateTag(withTime: boolean = false): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    const time = `${now.getHours()}`.padStart(2, '0');
    const minute = `${now.getMinutes()}`.padStart(2, '0');
    const second = `${now.getSeconds()}`.padStart(2, '0');
    if (withTime) {
      return `${year}${month}${day} ${time}:${minute}:${second}`;
    }
    return `${year}${month}${day}`;
  }
}

