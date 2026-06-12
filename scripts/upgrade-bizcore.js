#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// 配置项：是否在每个步骤后自动提交
// 可以通过命令行参数控制：--commit 或 --no-commit
// 好会计模式：--dirs arap 或 --dirs modules/fund-management/dayBook（相对 src/ 的路径）
const args = process.argv.slice(2);
let AUTO_COMMIT = false; // 默认关闭自动提交

if (args.includes('--no-commit')) {
  AUTO_COMMIT = false;
} else if (args.includes('--commit')) {
  AUTO_COMMIT = true;
}

function parseDirsArg(argv) {
  const idx = argv.indexOf('--dirs');
  if (idx >= 0 && argv[idx + 1] && !argv[idx + 1].startsWith('-')) {
    return argv[idx + 1];
  }
  return null;
}

function normalizeTargetDir(d) {
  let dir = d.trim().replace(/^\/+|\/+$/g, '');
  if (dir.startsWith('src/')) {
    return dir;
  }
  if (dir === 'src') {
    return 'src';
  }
  return `src/${dir}`;
}

const dirsArg = parseDirsArg(args);
const TARGET_DIRS = dirsArg
  ? [...new Set(dirsArg.split(',').map((d) => d.trim()).filter(Boolean))].map(normalizeTargetDir)
  : [null];

const SCRIPTS_DIR = __dirname;
const REPLACE_SCRIPT = path.join(SCRIPTS_DIR, 'replace-framework-imports.js');

// ANSI 颜色和样式代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // 前景色
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // 背景色
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// 图标
const icons = {
  success: '✓',
  error: '✗',
  info: 'ℹ',
  warning: '⚠',
  arrow: '→',
  bullet: '•',
  rocket: '🚀',
  fire: '🔥',
  check: '✅',
  cross: '❌',
  clock: '⏱',
  folder: '📁',
};

// 定义要执行的命令列表
const commands = [
  {
    name: '更新引用框架包名',
    cmd: 'replace-framework-imports',
  },
  {
    name: '更新getBussinessOption',
    cmd: 'clint bizcore --updateBussinessOptions --fix',
  },
  {
    name: '更新initVoucherValidatorLauncher',
    cmd: 'clint bizcore --updateInitValidatorAbout --fix',
  },
  {
    name: '更新校验函数',
    cmd: 'clint bizcore --updateValidatorFunctions --fix --globIgnore=no',
  },
  {
    name: '更新voucherDefinition升级到bizSchema',
    cmd: 'clint bizcore --updateToBizSchema --fix --globIgnore=no',
  },
  {
    name: '添加suite装饰器',
    cmd: 'clint bizcore --addSuiteDecorator --fix',
  },
  {
    name: '全量升级voucherDefinition属性',
    cmd: 'clint bizcore --updateVoucherDefinitionProps --fix --globIgnore=no',
  },
  {
    name: '更新bizService',
    cmd: 'clint bizcore --updateBizService --fix',
  },
  {
    name: '更新initBizModel',
    cmd: 'clint bizcore --updateInitModel --fix',
  },
  {
    name: '删除不再使用的接口',
    cmd: 'clint bizcore --removeIVoucherBizOptions --fix',
  },
  {
    name: '更新DataSourceType类型',
    cmd: 'clint bizcore --updateDataSourceType --fix --globIgnore=no',
  },
  {
    name: '升级单测',
    cmd: 'clint bizcore --upgradeValidatorTest --fix --globIgnore=no',
  },
  {
    name: '升级修复',
    cmd: 'clint bizcore  --upgradeBizFix --fix --globIgnore=no',
  }
];

function buildCmd(baseCmd, targetDir) {
  if (baseCmd === 'replace-framework-imports') {
    return targetDir
      ? `node "${REPLACE_SCRIPT}" ${targetDir}`
      : `node "${REPLACE_SCRIPT}"`;
  }
  if (targetDir && baseCmd.startsWith('clint bizcore')) {
    return baseCmd.replace(/^clint bizcore\b/, `clint bizcore ${targetDir}`);
  }
  return baseCmd;
}

function buildExecutionPlan() {
  const plan = [];
  for (const targetDir of TARGET_DIRS) {
    for (const command of commands) {
      plan.push({
        name: targetDir ? `[${targetDir}] ${command.name}` : command.name,
        cmd: buildCmd(command.cmd, targetDir),
      });
    }
  }
  return plan;
}

// 创建分隔线
function separator(char = '─', length = 60) {
  return char.repeat(length);
}

// 创建标题框
function createBox(text, color = colors.cyan) {
  const padding = 2;
  const innerWidth = text.length + padding * 2;
  const topBottom = '─'.repeat(innerWidth);
  
  console.log(`${color}╭${topBottom}╮${colors.reset}`);
  console.log(`${color}│${' '.repeat(padding)}${colors.bright}${text}${colors.reset}${color}${' '.repeat(padding)}│${colors.reset}`);
  console.log(`${color}╰${topBottom}╯${colors.reset}`);
}

// 创建增强的进度条
function createProgressBar(current, total, barLength = 40) {
  const percentage = Math.floor((current / total) * 100);
  const filledLength = Math.floor((current / total) * barLength);
  const emptyLength = barLength - filledLength;
  
  // 渐变颜色效果
  let barColor = colors.cyan;
  if (percentage >= 100) {
    barColor = colors.green;
  } else if (percentage >= 66) {
    barColor = colors.blue;
  } else if (percentage >= 33) {
    barColor = colors.yellow;
  }
  
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  const percentStr = percentage.toString().padStart(3, ' ');
  
  return `${barColor}${filled}${colors.gray}${empty}${colors.reset} ${colors.bright}${percentStr}%${colors.reset} ${colors.dim}(${current}/${total})${colors.reset}`;
}

// 打印步骤标题
function printStepHeader(stepNumber, total, name) {
  const stepStr = `步骤 ${stepNumber}/${total}`;
  console.log('');
  console.log(`${colors.bright}${colors.magenta}┌─ ${stepStr} ${separator('─', 50 - stepStr.length)}${colors.reset}`);
  console.log(`${colors.magenta}│${colors.reset}`);
  console.log(`${colors.magenta}│${colors.reset} ${colors.bright}${colors.cyan}${name}${colors.reset}`);
  console.log(`${colors.magenta}│${colors.reset}`);
}

// 打印命令
function printCommand(cmd) {
  console.log(`${colors.magenta}│${colors.reset} ${colors.dim}${icons.arrow} 执行命令:${colors.reset}`);
  console.log(`${colors.magenta}│${colors.reset}   ${colors.yellow}${cmd}${colors.reset}`);
  console.log(`${colors.magenta}│${colors.reset}`);
}

// 打印进度
function printProgress(current, total) {
  console.log(`${colors.magenta}│${colors.reset} ${createProgressBar(current, total)}`);
  console.log(`${colors.magenta}└${separator('─', 60)}${colors.reset}`);
}

// 打印结果
function printResult(success, duration) {
  if (success) {
    console.log(`${colors.green}${colors.bright}  ${icons.success} 完成${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}  ${icons.error} 失败${colors.reset}\n`);
  }
}

// 执行单个命令
function executeCommand(cmd, options = {}) {
  const startTime = Date.now();
  try {
    execSync(cmd, {
      stdio: 'inherit',
      cwd: process.cwd(),
      encoding: 'utf-8',
      ...options
    });
    const duration = Date.now() - startTime;
    return { success: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    return { success: false, error, duration };
  }
}

// Git 提交
function gitCommit(stepName) {
  try {
    // 检查是否有改动
    const status = execSync('git status --porcelain', {
      encoding: 'utf-8',
      cwd: process.cwd(),
    }).trim();

    if (!status) {
      console.log(`${colors.gray}  ${icons.info} 没有文件变更，跳过提交${colors.reset}`);
      return { success: true, skipped: true };
    }

    // 添加所有改动
    execSync('git add .', {
      cwd: process.cwd(),
    });

    // 提交
    const commitMessage = `feat(CPYF-11630): ${new Date().toLocaleString('zh-CN')} ${stepName}`;
    execSync(`git commit --no-verify -m "${commitMessage}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log(`${colors.green}  ${icons.success} Git 提交成功: ${colors.dim}${commitMessage}${colors.reset}`);
    return { success: true, skipped: false };
  } catch (error) {
    console.log(`${colors.red}  ${icons.error} Git 提交失败: ${colors.dim}${error.message}${colors.reset}`);
    return { success: false, error };
  }
}

// 打印头部
function printHeader(totalTasks) {
  console.clear();
  console.log('');
  createBox('🚀 BizCore 升级脚本', colors.cyan);
  console.log('');
  console.log(`${colors.dim}${separator('═', 60)}${colors.reset}`);
  console.log(`  ${colors.cyan}${icons.bullet}${colors.reset} ${colors.bright}总任务数:${colors.reset} ${colors.yellow}${totalTasks}${colors.reset}`);
  if (dirsArg) {
    console.log(`  ${colors.cyan}${icons.bullet}${colors.reset} ${colors.bright}升级目录:${colors.reset} ${colors.yellow}${TARGET_DIRS.join(', ')}${colors.reset}`);
  }
  console.log(`  ${colors.cyan}${icons.bullet}${colors.reset} ${colors.bright}当前目录:${colors.reset} ${colors.gray}${process.cwd()}${colors.reset}`);
  console.log(`  ${colors.cyan}${icons.bullet}${colors.reset} ${colors.bright}开始时间:${colors.reset} ${colors.gray}${new Date().toLocaleString('zh-CN')}${colors.reset}`);
  console.log(`  ${colors.cyan}${icons.bullet}${colors.reset} ${colors.bright}自动提交:${colors.reset} ${AUTO_COMMIT ? `${colors.green}开启${colors.reset}` : `${colors.gray}关闭${colors.reset}`}`);
  console.log(`${colors.dim}${separator('═', 60)}${colors.reset}`);
}

// 打印总结
function printSummary(successCount, failedCommands, totalDuration, commitCount, skippedCommitCount, totalTasks) {
  console.log('');
  console.log(`${colors.dim}${separator('═', 60)}${colors.reset}`);
  console.log('');
  
  createBox('📊 执行总结', colors.blue);
  
  console.log('');
  const successRate = totalTasks > 0 ? Math.floor((successCount / totalTasks) * 100) : 100;
  
  // 成功统计
  if (successCount === totalTasks) {
    console.log(`  ${colors.green}${icons.check}${colors.reset} ${colors.bright}全部成功!${colors.reset} ${colors.green}${successCount}/${totalTasks}${colors.reset}`);
  } else {
    console.log(`  ${colors.green}${icons.success}${colors.reset} ${colors.bright}成功:${colors.reset} ${colors.green}${successCount}${colors.reset}${colors.dim}/${totalTasks}${colors.reset}`);
  }
  
  // 失败统计
  if (failedCommands.length > 0) {
    console.log(`  ${colors.red}${icons.error}${colors.reset} ${colors.bright}失败:${colors.reset} ${colors.red}${failedCommands.length}${colors.reset}${colors.dim}/${totalTasks}${colors.reset}`);
  }
  
  // Git 提交统计
  if (AUTO_COMMIT) {
    console.log(`  ${colors.cyan}${icons.bullet}${colors.reset} ${colors.bright}Git 提交:${colors.reset} ${colors.green}${commitCount}${colors.reset}${colors.dim} 次${colors.reset}`);
    if (skippedCommitCount > 0) {
      console.log(`  ${colors.gray}${icons.bullet}${colors.reset} ${colors.dim}跳过提交:${colors.reset} ${colors.gray}${skippedCommitCount}${colors.reset}${colors.dim} 次 (无文件变更)${colors.reset}`);
    }
  }
  
  // 成功率
  const rateColor = successRate === 100 ? colors.green : successRate >= 50 ? colors.yellow : colors.red;
  console.log(`  ${colors.cyan}${icons.bullet}${colors.reset} ${colors.bright}成功率:${colors.reset} ${rateColor}${successRate}%${colors.reset}`);
  
  // 总耗时
  console.log(`  ${colors.cyan}${icons.clock}${colors.reset} ${colors.bright}总耗时:${colors.reset} ${colors.yellow}${totalDuration}秒${colors.reset}`);
  
  // 失败详情
  if (failedCommands.length > 0) {
    console.log('');
    console.log(`${colors.dim}${separator('─', 60)}${colors.reset}`);
    console.log('');
    console.log(`  ${colors.red}${colors.bright}失败的任务:${colors.reset}`);
    console.log('');
    
    failedCommands.forEach(({ step, name, cmd, error }, index) => {
      console.log(`  ${colors.red}${index + 1}.${colors.reset} ${colors.dim}[步骤 ${step}]${colors.reset} ${name}`);
      console.log(`     ${colors.dim}命令: ${colors.yellow}${cmd}${colors.reset}`);
      console.log(`     ${colors.dim}错误: ${colors.red}${error}${colors.reset}`);
      if (index < failedCommands.length - 1) {
        console.log('');
      }
    });
  }
  
  console.log('');
  console.log(`${colors.dim}${separator('═', 60)}${colors.reset}`);
  console.log('');
}

// 执行命令
function executeCommands() {
  const plan = buildExecutionPlan();
  const totalTasks = plan.length;

  printHeader(totalTasks);
  
  const startTime = Date.now();
  let successCount = 0;
  let failedCommands = [];
  let commitCount = 0;
  let skippedCommitCount = 0;

  for (let i = 0; i < plan.length; i++) {
    const { name, cmd } = plan[i];
    const stepNumber = i + 1;

    printStepHeader(stepNumber, totalTasks, name);
    printCommand(cmd);
    printProgress(i, totalTasks);

    const { success, error, duration } = executeCommand(cmd);

    if (success) {
      successCount++;
      printResult(true, duration);

      // 根据配置决定是否执行 Git 提交
      if (AUTO_COMMIT) {
        console.log(`${colors.cyan}  ${icons.bullet} 正在提交更改...${colors.reset}`);
        const commitResult = gitCommit(name);
        
        if (commitResult.success && !commitResult.skipped) {
          commitCount++;
        } else if (commitResult.skipped) {
          skippedCommitCount++;
        }
        
        console.log('');
      }
    } else {
      printResult(false, duration);
      failedCommands.push({ 
        step: stepNumber, 
        name, 
        cmd, 
        error: error?.message || '未知错误' 
      });
      
      console.log(`${colors.yellow}  ${icons.warning} 继续执行后续步骤...${colors.reset}\n`);
    }
  }

  // 最终进度
  console.log('');
  console.log(`  ${createProgressBar(totalTasks, totalTasks)}`);
  
  const endTime = Date.now();
  const totalDuration = ((endTime - startTime) / 1000).toFixed(2);

  printSummary(successCount, failedCommands, totalDuration, commitCount, skippedCommitCount, totalTasks);

  // 如果有失败的命令，退出码为 1
  if (failedCommands.length > 0) {
    process.exit(1);
  } else {
    // 所有步骤成功后执行 yarn test
    
    // console.log('');
    // console.log(`${colors.dim}${separator('═', 60)}${colors.reset}`);
    // console.log('');
    // console.log(`${colors.cyan}${colors.bright}${icons.rocket} 开始执行测试...${colors.reset}`);
    // console.log('');
    
    // try {
    //   execSync('yarn test', {
    //     stdio: 'inherit',
    //     cwd: process.cwd(),
    //   });
    //   console.log('');
    //   console.log(`${colors.green}${colors.bright}${icons.check} 测试通过！${colors.reset}`);
    //   console.log('');
    // } catch (error) {
    //   console.log('');
    //   console.log(`${colors.red}${colors.bright}${icons.error} 测试失败！${colors.reset}`);
    //   console.log(`${colors.red}请检查测试错误并修复${colors.reset}`);
    //   console.log('');
    //   process.exit(1);
    // }
  }
}

// 主函数
function main() {
  try {
    // 检查是否在正确的目录
    const fs = require('fs');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.error(`\n${colors.red}${colors.bright}${icons.error} 错误: 未找到 package.json 文件${colors.reset}`);
      console.error(`${colors.gray}当前目录: ${process.cwd()}${colors.reset}`);
      console.error(`${colors.yellow}${icons.info} 请确保在项目根目录执行此脚本${colors.reset}\n`);
      process.exit(1);
    }

    if (dirsArg) {
      for (const targetDir of TARGET_DIRS) {
        const absDir = path.join(process.cwd(), targetDir);
        if (!fs.existsSync(absDir)) {
          console.error(`\n${colors.red}${colors.bright}${icons.error} 错误: 目录不存在 ${targetDir}${colors.reset}\n`);
          process.exit(1);
        }
        if (!fs.statSync(absDir).isDirectory()) {
          console.error(`\n${colors.red}${colors.bright}${icons.error} 错误: 不是目录 ${targetDir}${colors.reset}\n`);
          process.exit(1);
        }
      }
    }

    executeCommands();
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}${icons.error} 脚本执行出错:${colors.reset}`, error.message);
    console.error(`${colors.gray}${error.stack}${colors.reset}\n`);
    process.exit(1);
  }
}

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  console.error(`\n${colors.red}${colors.bright}${icons.error} 未捕获的异常:${colors.reset}`, error.message);
  console.error(`${colors.gray}${error.stack}${colors.reset}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`\n${colors.red}${colors.bright}${icons.error} 未处理的 Promise 拒绝:${colors.reset}`, reason);
  process.exit(1);
});

main();
