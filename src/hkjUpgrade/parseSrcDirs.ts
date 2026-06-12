import * as fs from 'fs';
import * as path from 'path';

export type ParseSrcDirsResult =
  | { ok: true; dirs: string[] }
  | { ok: false; error: string };

/**
 * 解析逗号分隔的 src 相对路径，并校验目录存在。
 * 支持单段（arap）或多段（modules/fund-management/dayBook）。
 * 可带或不带 src/ 前缀。
 */
function normalizeSrcRelativeDir(dir: string): string | null {
  let d = dir.trim().replace(/^\/+|\/+$/g, '');
  if (d.startsWith('src/')) {
    d = d.slice(4);
  } else if (d === 'src') {
    return null;
  }
  if (!d || d.includes(' ') || d.includes('..')) {
    return null;
  }
  return d;
}

export function parseSrcDirs(input: string, workspaceRoot: string): ParseSrcDirsResult {
  const raw = input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (raw.length === 0) {
    return { ok: false, error: '请输入至少一个目录' };
  }

  const seen = new Set<string>();
  const dirs: string[] = [];

  for (const entry of raw) {
    const dir = normalizeSrcRelativeDir(entry);
    if (!dir) {
      return { ok: false, error: `无效目录: ${entry}（示例: arap 或 modules/fund-management/dayBook）` };
    }
    if (seen.has(dir)) {
      continue;
    }
    seen.add(dir);

    const absDir = path.join(workspaceRoot, 'src', dir);
    if (!fs.existsSync(absDir)) {
      return { ok: false, error: `目录不存在: src/${dir}` };
    }
    if (!fs.statSync(absDir).isDirectory()) {
      return { ok: false, error: `不是目录: src/${dir}` };
    }
    dirs.push(dir);
  }

  return { ok: true, dirs };
}
