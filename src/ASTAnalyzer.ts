import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { ASTContext } from './interface';

export class ASTAnalyzer {
  /**
   * 解析代码为 AST
   */
  parse(code: string): any {
    return parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
    });
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
  findMatches(code: string, matcher: (node: any, context: ASTContext) => boolean): Array<{
    node: any;
    range: { start: number; end: number };
  }> {
    const ast = this.parse(code);
    const context = this.analyzeContext(code, '');
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