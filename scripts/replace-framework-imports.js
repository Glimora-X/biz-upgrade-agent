const fs = require('fs');
const path = require('path');

// 由扩展在业务仓库 cwd 下调用：
//   node ".../replace-framework-imports.js"
//   node ".../replace-framework-imports.js src/arap

const workspaceRoot = process.cwd();

const exclude = [];

const excludeFiles = [
  path.resolve(workspaceRoot, 'src/type.ts'),
];

const excludeDirs = [];

function shouldExclude(file, fullPath) {
  if (excludeFiles.includes(fullPath)) return true;
  return exclude.some(suffix => file.endsWith(suffix));
}

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(
    /from\s+['"]@chanjet\/cc-front-biz-framework(?:\/[^'"]*)?['"]/g,
    'from "@chanjet/cc-front-biz-core"'
  );
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}

function walkDir(dir) {
  if (excludeDirs.includes(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(ts|js)$/.test(file) && !shouldExclude(file, fullPath)) {
      replaceInFile(fullPath);
    }
  });
}

const userDir = process.argv[2] || 'src';
const absDir = path.resolve(workspaceRoot, userDir);

if (!fs.existsSync(absDir)) {
  console.error(`目录不存在: ${absDir}`);
  process.exit(1);
}

console.log(`处理目录: ${absDir}`);
walkDir(absDir);
