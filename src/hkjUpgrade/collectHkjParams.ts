import * as vscode from 'vscode';
import { parseSrcDirs } from './parseSrcDirs';

function getDateTag(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
}

export interface HkjUpgradeParams {
  env: 'hkj';
  targetBranch: string;
  featureBranch: string;
  srcDirs: string[];
}

/**
 * 好会计升级参数收集（在环境已选 hkj 后调用）。
 */
export async function collectHkjParams(
  workspaceRoot: string
): Promise<HkjUpgradeParams | undefined> {
  const today = getDateTag();
  const suffix = await vscode.window.showInputBox({
    prompt: '特性分支将自动添加前缀：upgrade/hkj-',
    placeHolder: `请输入特性分支后缀（如：${today}）`,
    value: today,
    title: '好会计升级 - 步骤 2/4',
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

  if (!suffix) {
    return;
  }

  const targetBranchInput = await vscode.window.showInputBox({
    prompt: '请输入目标分支名称',
    placeHolder: 'test-260423',
    value: 'test-260423',
    title: '好会计升级 - 步骤 3/4',
    validateInput: (value) => {
      if (!value || !value.trim()) {
        return '请输入目标分支名称';
      }
      return null;
    },
  });

  if (!targetBranchInput) {
    return;
  }

  const dirsInput = await vscode.window.showInputBox({
    prompt: '请输入 src 下要升级的路径（逗号分隔，相对 src/，可多级）',
    placeHolder: '如 arap 或 modules/fund-management/dayBook',
    title: '好会计升级 - 步骤 4/4',
    validateInput: (value) => {
      if (!value || !value.trim()) {
        return '请输入至少一个目录';
      }
      const parsed = parseSrcDirs(value, workspaceRoot);
      if (!parsed.ok) {
        return parsed.error;
      }
      return null;
    },
  });

  if (!dirsInput) {
    return;
  }

  const parsed = parseSrcDirs(dirsInput, workspaceRoot);
  if (!parsed.ok) {
    return;
  }

  return {
    env: 'hkj',
    targetBranch: targetBranchInput.trim(),
    featureBranch: `upgrade/hkj-${suffix.trim()}`,
    srcDirs: parsed.dirs,
  };
}
