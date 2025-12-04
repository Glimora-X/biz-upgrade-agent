module.exports = [
  {
    id: 'complex-lifecycle-fetch',
    severity: 'warning',
    category: 'pattern',
    message: '不推荐在 componentDidMount 中直接调用 fetch',
    hoverMessage: '检测到在生命周期方法中直接使用 fetch，这可能导致内存泄漏',
    migrationGuide: '建议使用 biz-core 提供的 `useRequest` hook 或将 fetch 逻辑封装到独立的服务中。',
    
    // 使用 AST 匹配器
    astMatcher: (node, context) => {
      // 检测 componentDidMount 方法
      if (node.type !== 'ClassMethod') return false;
      if (node.key.name !== 'componentDidMount') return false;
      
      // 检查方法体中是否有 fetch 调用
      let hasFetch = false;
      
      const checkNode = (n) => {
        if (n.type === 'CallExpression' && n.callee.name === 'fetch') {
          hasFetch = true;
        }
        // 递归检查子节点
        if (n.body) {
          if (Array.isArray(n.body)) {
            n.body.forEach(checkNode);
          } else {
            checkNode(n.body);
          }
        }
        if (n.body?.body) {
          n.body.body.forEach(checkNode);
        }
      };
      
      checkNode(node);
      return hasFetch;
    },
    
    examples: {
      before: `componentDidMount() {
  fetch('/api/data')
    .then(res => res.json())
    .then(data => this.setState({ data }));
}`,
      after: `// 使用 biz-core 的 useRequest hook
const { data, loading } = useRequest('/api/data');

// 或封装为服务
async componentDidMount() {
  const data = await dataService.fetchData();
  this.setState({ data });
}`
    }
  },
  
  {
    id: 'deprecated-prop-types',
    severity: 'warning',
    category: 'structure',
    message: 'PropTypes 已不推荐使用',
    hoverMessage: 'biz-core 推荐使用 TypeScript 进行类型检查',
    migrationGuide: '将 PropTypes 定义迁移到 TypeScript 接口定义。',
    
    astMatcher: (node, context) => {
      // 检测 static propTypes = {...}
      if (node.type === 'ClassProperty' && node.key.name === 'propTypes') {
        return true;
      }
      // 检测 Component.propTypes = {...}
      if (node.type === 'AssignmentExpression' && 
          node.left.property?.name === 'propTypes') {
        return true;
      }
      return false;
    },
    
    examples: {
      before: `class MyComponent extends Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    age: PropTypes.number
  };
}`,
      after: `interface MyComponentProps {
  name: string;
  age?: number;
}

class MyComponent extends Component<MyComponentProps> {
  // ...
}`
    }
  },
  
  {
    id: 'context-api-change',
    severity: 'error',
    category: 'api',
    message: 'Context API 用法已改变',
    hoverMessage: 'biz-core 使用新的 Context API',
    migrationGuide: '将旧的 contextTypes 迁移到新的 Context API。',
    
    astMatcher: (node, context) => {
      // 检测使用了旧的 contextTypes
      if (node.type === 'ClassProperty' && node.key.name === 'contextTypes') {
        return true;
      }
      return false;
    },
    
    quickFix: {
      title: '转换为新 Context API',
      transform: (code, range) => {
        // 这里可以实现更复杂的转换逻辑
        return `// TODO: 请手动迁移到新的 Context API
// 参考文档: https://your-docs.com/context-api
${code}`;
      }
    },
    
    examples: {
      before: `class MyComponent extends Component {
  static contextTypes = {
    theme: PropTypes.object
  };
  
  render() {
    return <div style={this.context.theme} />;
  }
}`,
      after: `// 创建 Context
const ThemeContext = React.createContext();

// 使用 Context
class MyComponent extends Component {
  static contextType = ThemeContext;
  
  render() {
    return <div style={this.context} />;
  }
}

// 或使用 Hook
function MyComponent() {
  const theme = useContext(ThemeContext);
  return <div style={theme} />;
}`
    }
  }
];

// ==================== .vscode/settings.json (VSCode 配置) ====================
// {
//   "bizFrameworkMigration.enabled": true,
//   "bizFrameworkMigration.autoScan": true,
//   "bizFrameworkMigration.showDashboardOnStartup": false
// }