import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { ASTContext } from './interface';

export class ASTAnalyzer {
  /**
   * 解析代码为 AST
   */
  parse(code: string): any {
    try {
      return parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
      });
    } catch (err: any) {
      const message = err?.message ? String(err.message) : 'Unknown parse error';
      throw new Error(`ASTAnalyzer.parse failed: ${message}`);
    }
  }

  /**
   * 分析代码结构
   */
  analyzeContext(code: string, filePath: string): ASTContext {
    const ast = this.parse(code);
    const imports = new Map<string, string>();
    const scope: string[] = [];

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        path.node.specifiers.forEach(spec => {
          if (t.isImportSpecifier(spec)) {
            imports.set(spec.local.name, source);
          }
        });
      },
    });

    // 记录顶层声明名称，便于规则快速判断作用域
    ast.program.body.forEach((node: t.Statement | t.ModuleDeclaration) => {
      if (t.isVariableDeclaration(node)) {
        node.declarations.forEach(decl => {
          if (t.isIdentifier(decl.id)) {
            scope.push(decl.id.name);
          }
        });
      }
      if (t.isFunctionDeclaration(node) && node.id) {
        scope.push(node.id.name);
      }
      if (t.isClassDeclaration(node) && node.id) {
        scope.push(node.id.name);
      }
      if (t.isTSInterfaceDeclaration(node) && node.id) {
        scope.push(node.id.name);
      }
    });

    return {
      filePath,
      sourceCode: code,
      imports,
      scope,
    };
  }

  /**
   * 查找匹配的节点
   */
  findMatches(
    code: string,
    matcher: (node: any, context: ASTContext) => boolean,
    filePath = ''
  ): Array<{
    node: any;
    range: { start: number; end: number };
  }> {
    const ast = this.parse(code);
    const context = this.analyzeContext(code, filePath);
    const matches: any[] = [];

    traverse(ast, {
      enter(path) {
        if (matcher(path.node, context)) {
          matches.push({
            node: path.node,
            range: {
              start: path.node.start,
              end: path.node.end,
            },
          });
        }
      },
    });

    return matches;
  }

  /**
   * 提供便捷的源码切片，避免重复手动 slice
   */
  getSourceSnippet(code: string, range: { start: number; end: number }): string {
    if (!range) return '';
    return code.slice(range.start, range.end);
  }

  /**
   * 高级规则示例：检测特定模式
   */
  createComplexMatcher(pattern: {
    type: string;
    conditions: Array<(node: any, context: ASTContext) => boolean>;
  }) {
    return (node: any, context: ASTContext) => {
      if (node.type !== pattern.type) return false;
      return pattern.conditions.every(cond => cond(node, context));
    };
  }
}