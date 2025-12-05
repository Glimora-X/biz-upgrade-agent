/**
 * 迁移规则定义
 */
export interface MigrationRule {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'api' | 'pattern' | 'structure' | 'lifecycle';

  // 简单匹配规则
  oldPattern?: string | RegExp;
  newPattern?: string;

  // AST 复杂规则
  astMatcher?: (node: any, context: ASTContext) => boolean;

  // 提示信息
  message: string;
  hoverMessage: string;
  migrationGuide: string;

  // 快速修复
  quickFix?: QuickFixProvider;

  // 示例代码
  examples?: {
    before: string;
    after: string;
  }[];

  // 忽略模式（针对此规则）
  ignorePatterns?: string[];
}

export interface QuickFixProvider {
  title: string;
  transform: string | ((code: string) => string);
}


export interface ASTContext {
  filePath: string;
  sourceCode: string;
  imports: Map<string, string>;
  scope: string[];
}
/**
 * 配置定义
 */
export interface MigrationConfig {
  version: string;
  frameworkName: {
    old: string;
    new: string;
  };
  rules: MigrationRule[];
  ignorePatterns?: string[];
  customRules?: string[]; // 自定义规则文件路径
}