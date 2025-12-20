module.exports = [
  {
    id: "IVoucherBizOptions-重命名为-IVoucherBizSchema",
    severity: "error",
    category: "api",
    message: "IVoucherBizOptions 升级为 IVoucherBizSchema",
    hoverMessage:
      "将所有 : IVoucherBizOptions 类型标注替换为 : IVoucherBizSchema",
    upgradeGuide:
      "IVoucherBizOptions 已重命名为 IVoucherBizSchema，这是一个类型别名层面的重命名。单测可以使用兼容函数忽略此变更，但不建议。",
    oldPattern: "\\bIVoucherBizOptions\\b",
    newPattern: "\\bIVoucherBizSchema\\b",
    examples: [
      {
        before:
          "protected getBussinessOptions(): IVoucherBizOptions {\n  return ExpenseVoucherConfig;\n}",
        after:
          "protected getBussinessOptions(): IVoucherBizSchema {\n  return ExpenseVoucherConfig;\n}",
        file: "arap/expense/service/ExpenseService.ts",
      },
      {
        before:
          "export const ExpenseVoucherConfig: IVoucherBizOptions = { ... }",
        after: "export const ExpenseVoucherConfig: IVoucherBizSchema = { ... }",
        file: "arap/expense/service/ExpenseVoucherConfig.ts",
      },
      {
        before: "protected getBussinessOptions(): IVoucherBizOptions { ... }",
        after: "protected getBussinessOptions(): IVoucherBizSchema { ... }",
        file: "arap/expense/service-mobile/MobileExpenseService.ts",
      },
      {
        before:
          "export const MobileExpenseVoucherConfig: IVoucherBizOptions = { ... }",
        after:
          "export const MobileExpenseVoucherConfig: IVoucherBizSchema = { ... }",
        file: "arap/expense/service-mobile/MobileExpenseVoucherConfig.ts",
      },
    ],
  },
  {
    id: "VoucherValidatorLauncher-构造函数参数变更",
    severity: "error",
    category: "api",
    message:
      "VoucherValidatorLauncher 构造函数从两个参数变为一个参数，不再需要传入 bizModel",
    hoverMessage:
      "旧代码使用 new VoucherValidatorLauncher(config, bizModel)，新代码改为 new VoucherValidatorLauncher(config)",
    upgradeGuide:
      "VoucherValidatorLauncher 构造函数签名已调整：\n- 旧：new VoucherValidatorLauncher(config, bizModel)\n- 新：new VoucherValidatorLauncher(config)\n迁移时删除多余的 bizModel 参数，并确认校验逻辑仍然按预期工作。",
    oldPattern:
      "\\bnew\\s+VoucherValidatorLau?ncher\\s*\\([^,]+,\\s*[^\\)]+\\)",
    newPattern: "\\bnew\\s+VoucherValidatorLauncher\\s*\\([^,\\)]+\\)",
    examples: [
      {
        before:
          "protected initVoucherValidatorLauncher(): VoucherValidatorLaucher {\n  return new VoucherValidatorLaucher(ExpenseFieldValidatorConfig, this.bizModel);\n}",
        after:
          "protected initVoucherValidatorLauncher(): VoucherValidatorLauncher {\n  return new VoucherValidatorLauncher(ExpenseFieldValidatorConfig);\n}",
        file: "arap/expense/service/ExpenseService.ts",
      },
      {
        before:
          "protected initVoucherValidatorLauncher(): VoucherValidatorLaucher {\n  return new VoucherValidatorLaucher(ExpenseFieldValidatorConfig, this.bizModel);\n}",
        after:
          "protected initVoucherValidatorLauncher(): VoucherValidatorLauncher {\n  return new VoucherValidatorLauncher(ExpenseFieldValidatorConfig);\n}",
        file: "arap/expense/service-mobile/MobileExpenseService.ts",
      },
      {
        before:
          "return new VoucherValidatorLauncher(expenseFromSalesFreightFieldValidatorConfig, this.bizModel);",
        after:
          "return new VoucherValidatorLauncher(expenseFromSalesFreightFieldValidatorConfig);",
        file: "arap/expense/expense-from-sales-freight/service/ExpenseFromSalesFeightBizService.ts",
      },
    ],
  },
  {
    id: "cc-front-biz-framework-导入迁移到-core-and-common",
    severity: "warning",
    category: "pattern",
    message:
      "所有从 @chanjet/cc-front-biz-framework* 的导入需要迁移到 @chanjet/cc-front-biz-core 或 @chanjet/cc-front-biz-common",
    hoverMessage:
      "用 @chanjet/cc-front-biz-core 提供的统一入口替代原先分散在 dist/* 下的导入；通用类型、工具迁移到 @chanjet/cc-front-biz-common。",
    upgradeGuide:
      "旧版通过多处路径从 @chanjet/cc-front-biz-framework 引入类型和装饰器，例如 dist/controller/actionRouter、dist/model、dist/processor 等。新版统一改为：\n- 业务核心、装饰器、上下文、处理器等：从 @chanjet/cc-front-biz-core 导入（如 Action, FieldChanged, BizContext, IProcessor, Command, OtherAction, Suite, VoucherValidatorLauncher, IVoucherBizSchema 等）。\n- 通用工具/公共能力：从 @chanjet/cc-front-biz-common 导入。\n迁移时请根据现有新代码中的 import 结构逐项对应替换。",
    oldPattern: "@chanjet/cc-front-biz-framework",
    newPattern: "@chanjet/cc-front-biz-core",
    examples: [
      {
        before:
          "import { Action, FieldChanged} from '@chanjet/cc-front-biz-framework/dist/controller/actionRouter';\nimport {IVoucherBizOptions} from '@chanjet/cc-front-biz-framework/dist/model';\nimport {BizContext} from '@chanjet/cc-front-biz-framework/dist/controller/BizContext';\nimport {IProcessor} from '@chanjet/cc-front-biz-framework/dist/processor';\nimport {VoucherValidatorLaucher} from '@chanjet/cc-front-biz-framework/dist/validator/VoucherValidaorLauncher';\nimport {SupportPool} from '@chanjet/cc-front-biz-framework/dist/controller/workerPoolAnnotation';\nimport {Command, OtherAction} from '@chanjet/cc-front-biz-framework';",
        after:
          "import { Action, FieldChanged, BizContext, IProcessor, Command, OtherAction, IVoucherBizSchema, Suite, VoucherValidatorLauncher, SupportPool } from '@chanjet/cc-front-biz-core';",
        file: "arap/expense/service/ExpenseService.ts",
      },
      {
        before:
          "import { BizModel } from '@chanjet/cc-front-biz-framework/dist/model/BizModel';",
        after: "import { BizModel } from '@chanjet/cc-front-biz-core';",
        file: "arap/expense/model/ExpenseBizModel.ts",
      },
      {
        before:
          "import { createValidatorConfig } from '@chanjet/cc-front-biz-framework/dist/validator';",
        after:
          "import { createValidatorConfig } from '@chanjet/cc-front-biz-core';",
        file: "arap/expense/validator/ExpenseFieldValidatorConfig.ts",
      },
    ],
  },
  {
    id: "VoucherConfig-配置结构变更",
    severity: "error",
    category: "structure",
    message:
      "Expense 相关凭证配置的 bodies / isInvalidRow / minRowCount 配置结构发生变更，需要迁移到新 schema 结构",
    hoverMessage:
      "旧版通过 bodies/detailList/isInvalidRow 以及 config.minRowCount 控制表体校验和最小行数，新版改为在 base.detailList.__properties__.invalid.validator 和 autoOperaRow 中配置。",
    upgradeGuide:
      "在 Expense 模块（PC + Mobile + 销售运费模块）的凭证配置中：\n- 旧结构：\n  - bodies: { detailList: { isInvalidRow: (row) => ... } }\n  - minRowCount: number\n- 新结构：\n  - base: { detailList: { __properties__: { invalid: { validator: (row) => ... } } } }\n  - autoOperaRow: { minRowCount: number }\n迁移时需要：\n1. 将原 bodies.detailList.isInvalidRow 的函数迁移到 base.detailList.__properties__.invalid.validator。\n2. 将原 config.minRowCount 移动到 autoOperaRow.minRowCount。\n3. 确保新 schema 下的字段名与 UI/校验逻辑匹配。",
    astMatcher:
      "(node, context) => context.matchConfigStructureChange(node, 'ExpenseVoucherConfig')",
    examples: [
      {
        before:
          "export const ExpenseVoucherConfig: IVoucherBizOptions = {\n  bodies: {\n    detailList: {\n      isInvalidRow: (row) => { /* ... */ }\n    }\n  },\n  minRowCount: 1\n};",
        after:
          "export const ExpenseVoucherConfig: IVoucherBizSchema = {\n  base: {\n    detailList: {\n      __properties__: {\n        invalid: {\n          validator: (row) => { /* ... */ }\n        }\n      }\n    }\n  },\n  autoOperaRow: {\n    minRowCount: 1\n  }\n};",
        file: "arap/expense/service/ExpenseVoucherConfig.ts",
      },
      {
        before:
          "export const MobileExpenseVoucherConfig: IVoucherBizOptions = {\n  bodies: { detailList: { isInvalidRow: (row) => { /* ... */ } } },\n  minRowCount: 1\n};",
        after:
          "export const MobileExpenseVoucherConfig: IVoucherBizSchema = {\n  base: { detailList: { __properties__: { invalid: { validator: (row) => { /* ... */ } } } } },\n  autoOperaRow: { minRowCount: 1 }\n};",
        file: "arap/expense/service-mobile/MobileExpenseVoucherConfig.ts",
      },
      {
        before:
          "export const ExpenseFromSalesFeightVoucherConfig: IVoucherBizOptions = {\n  bodies: { detailList: { isInvalidRow: (row) => { /* ... */ } } },\n  minRowCount: 1\n};",
        after:
          "export const ExpenseFromSalesFeightVoucherConfig: IVoucherBizSchema = {\n  base: { detailList: { __properties__: { invalid: { validator: (row) => { /* ... */ } } } } },\n  autoOperaRow: { minRowCount: 1 }\n};",
        file: "arap/expense/expense-from-sales-freight/service/ExpenseFromSalesFeightVoucherConfig.ts",
      },
    ],
  },
  {
    id: "访问配置属性方式变更-voucherDefinition-到-bizSchemaManager",
    severity: "error",
    category: "lifecycle",
    message:
      "Mobile Expense 中访问配置属性的方式由 ctx.voucherDefinition.main 改为 ctx.bizApplication.bizSchemaManager.getProperty",
    hoverMessage:
      "旧代码直接从 ctx.voucherDefinition.main 读取配置，新代码从 ctx.bizApplication.bizSchemaManager.getProperty('xxx') 获取。",
    upgradeGuide:
      "在 Mobile Expense 模块中，原本通过 ctx.voucherDefinition.main 访问字段配置，例如获取往来单位字段配置。新版调整为通过 bizSchemaManager 来统一管理 schema：\n- 旧：const custVendorConfig = ctx.voucherDefinition.main.custVendor;\n- 新：const custVendorConfig = ctx.bizApplication.bizSchemaManager.getProperty('custVendor');\n迁移时请统一将对 ctx.voucherDefinition.main 的访问替换为 bizSchemaManager.getProperty，并确保 propertyName 与 schema 中的字段名一致。",
    oldPattern: "ctx\\.voucherDefinition\\.main\\.[a-zA-Z0-9_]+",
    newPattern:
      "ctx\\.bizApplication\\.bizSchemaManager\\.getProperty\\('[a-zA-Z0-9_]+'\\)",
    examples: [
      {
        before: "const custVendorDef = ctx.voucherDefinition.main.custVendor;",
        after:
          "const custVendorDef = ctx.bizApplication.bizSchemaManager.getProperty('custVendor');",
        file: "arap/expense/service-mobile/MobileExpenseService.ts",
      },
    ],
  },
  {
    id: "ExpenseService-增加-Suite-装饰器",
    severity: "info",
    category: "lifecycle",
    message: "ExpenseService 新增 @Suite('Expense') 装饰器用于声明业务套件名",
    hoverMessage:
      "通过 @Suite('Expense') 将 ExpenseService 归属于 Expense 套件，便于框架做统一管理和路由。",
    upgradeGuide:
      "在使用 cc-front-biz-core 后，业务服务类推荐通过 @Suite 装饰器声明所属业务套件。对于 Expense 模块：\n- 在 ExpenseService 类定义前增加 @Suite('Expense')。\n- 确保从 @chanjet/cc-front-biz-core 正确导入 Suite。\n这有助于在多套件场景下做统一注册与路由。",
    oldPattern:
      "export\\s+class\\s+ExpenseService\\s+extends\\s+ExpenseRevenueBaseService",
    newPattern:
      "@Suite\\('Expense'\\)\\s*export\\s+class\\s+ExpenseService\\s+extends\\s+ExpenseRevenueBaseService",
    examples: [
      {
        before:
          "export class ExpenseService extends  ExpenseRevenueBaseService {",
        after:
          "@Suite('Expense')\nexport class ExpenseService extends  ExpenseRevenueBaseService {",
        file: "arap/expense/service/ExpenseService.ts",
      },
    ],
  },
  {
    id: "Service-接口基类变更",
    severity: "warning",
    category: "api",
    message:
      "IGoodsIssueService 的接口基类从 IBizService 变为 CommonBaseController",
    hoverMessage:
      "旧代码通过 IBizService 暴露服务能力，新代码改为继承 CommonBaseController，更贴近控制器能力模型。",
    upgradeGuide:
      "在 goods-issue 模块中，服务接口 IGoodsIssueService 不再继承 IBizService，而是继承 CommonBaseController：\n- 旧：export interface IGoodsIssueService extends IBizService {}\n- 新：export interface IGoodsIssueService extends CommonBaseController {}\n如果有地方对 IGoodsIssueService 做类型约束或强转，需要同步更新为以 CommonBaseController 能力为基础的接口约束（例如调用方式、生命周期钩子）。",
    oldPattern:
      "export\\s+interface\\s+IGoodsIssueService\\s+extends\\s+IBizService",
    newPattern:
      "export\\s+interface\\s+IGoodsIssueService\\s+extends\\s+CommonBaseController",
    examples: [
      {
        before: "export interface IGoodsIssueService extends IBizService {}",
        after:
          "export interface IGoodsIssueService extends CommonBaseController {}",
        file: "sales/goods-issue/service/GoodsIssueService.ts",
      },
    ],
  },
  {
    id: "initBizModel-签名和参数变更",
    severity: "error",
    category: "lifecycle",
    message:
      "GoodsIssueService.initBizModel 的方法签名以及 GoodsIssueBizModel 构造参数发生变更，改为使用 bizSchemaManager / bizApplicationOptions",
    hoverMessage:
      "旧版 initBizModel 依赖 voucherDefinition 和 getUiStateManager，新版通过 IBizModelOptions 注入 bizSchemaManager 和 bizApplicationOptions。",
    upgradeGuide:
      "在 goods-issue 模块中，初始化 BizModel 的方式发生变化：\n- 旧：\n  - 签名：protected initBizModel(options: IBizServiceOptions, voucherDefinition: IVoucherDefinition)\n  - 构造：this.bizModel = new GoodsIssueBizModel({ voucherDefinition, getUiStateManager: options.getUiStateManager });\n- 新：\n  - 签名：protected initBizModel(options: IBizModelOptions)\n  - 构造：return new GoodsIssueBizModel({ bizSchemaManager: options.bizSchemaManager, bizApplicationOptions: options.bizApplicationOptions });\n如果有自定义 BizModel 或覆写 initBizModel 的地方，需要同步：\n1. 将第二个参数 voucherDefinition 去掉，改为只接收 IBizModelOptions；\n2. 从 options 中使用 bizSchemaManager / bizApplicationOptions 替代原 voucherDefinition / getUiStateManager。",
    oldPattern:
      "protected\\s+initBizModel\\s*\\(options:\\s*IBizServiceOptions\\s*,\\s*voucherDefinition:\\s*IVoucherDefinition\\)",
    newPattern:
      "protected\\s+initBizModel\\s*\\(options:\\s*IBizModelOptions\\s*\\)",
    examples: [
      {
        before:
          "protected initBizModel(options: IBizServiceOptions, voucherDefinition: IVoucherDefinition) {\n  this.bizModel = new GoodsIssueBizModel({\n    voucherDefinition: voucherDefinition,\n    getUiStateManager: options.getUiStateManager,\n  });\n}",
        after:
          "protected initBizModel(options: IBizModelOptions) {\n  return new GoodsIssueBizModel({\n    bizSchemaManager: options.bizSchemaManager,\n    bizApplicationOptions: options.bizApplicationOptions,\n  });\n}",
        file: "sales/goods-issue/service/GoodsIssueService.ts",
      },
    ],
  },
  {
    id: "bodiesName[0]-绑定路径从-voucherDefinition-到-bizSchemaManager",
    severity: "error",
    category: "lifecycle",
    message:
      "GoodsIssue 草稿套打处理中的 bindingObjectPath 从 ctx.voucherDefinition.bodiesName[0] 改为 ctx.bizApplication.bizSchemaManager.defaultBodyName",
    hoverMessage:
      "旧代码直接读取 voucherDefinition.bodiesName[0] 作为表体绑定路径，新代码通过 bizSchemaManager.defaultBodyName 获取默认表体名。",
    upgradeGuide:
      "在 goods-issue 模块中，草稿套打 DraftCover 的绑定表体路径发生变化：\n- 旧：bindingObjectPath: `${ctx.voucherDefinition.bodiesName[0]}`\n- 新：bindingObjectPath: `${ctx.bizApplication.bizSchemaManager.defaultBodyName}`\n如果在其他模块（或自定义处理器）中也依赖 ctx.voucherDefinition.bodiesName[0] 来确定默认表体名，迁移时需要统一替换为通过 bizSchemaManager.defaultBodyName 获取，以适配新 schema 管理方式。",
    oldPattern:
      "bindingObjectPath:\\s*`\\$\\{ctx\\.voucherDefinition\\.bodiesName\\[0\\]\\}`",
    newPattern:
      "bindingObjectPath:\\s*`\\$\\{ctx\\.bizApplication\\.bizSchemaManager\\.defaultBodyName\\}`",
    examples: [
      {
        before:
          'protected DraftCover(ctx: BizContext): IProcessor {\n  const block = new AsyncProcessBlock(ctx, "GoodsIssueDraftCoverBlock", {\n    concurrency: 1,\n    bindingObjectPath: `${ctx.voucherDefinition.bodiesName[0]}`,\n  });\n  block.add(getSalesDraftCoverBlock(ctx));\n  return block;\n}',
        after:
          'protected DraftCover(ctx: BizContext): IProcessor {\n  const block = new AsyncProcessBlock(ctx, "GoodsIssueDraftCoverBlock", {\n    concurrency: 1,\n    bindingObjectPath: `${ctx.bizApplication.bizSchemaManager.defaultBodyName}`,\n  });\n  block.add(getSalesDraftCoverBlock(ctx));\n  return block;\n}',
        file: "sales/goods-issue/service/GoodsIssueService.ts",
      },
    ],
  },
  {
    id: "BussinessConfig-整体迁移到-base-__properties__-结构",
    severity: "error",
    category: "structure",
    message:
      "GoodsIssueBussinessConfig 从扁平 IVoucherBizOptions 配置迁移为基于 base.__properties__ 的 IVoucherBizSchema 结构",
    hoverMessage:
      "旧版在顶层挂载 payment / inventory / custVendor / redBlue* / extendBody， 新版将这些全部移动到 base.__properties__ 下，并配合新的 schema 管理方式。",
    upgradeGuide:
      "在 goods-issue 模块中，GoodsIssueBussinessConfig 发生了比 expense 更全面的结构升级：\n- 旧：\n  - export const GoodsIssueBussinessConfig: IVoucherBizOptions = { payment, inventory, main, redBlueVoucherAbbr, redBlueVoucherLabel, redBlueStrict, redBlueVoucherField, extendBody, ... }\n- 新：\n  - export const GoodsIssueBussinessConfig: IVoucherBizSchema = { base: { __properties__: { name, boName, payment, inventory, custVendor, redBlueVoucherAbbr, redBlueVoucherLabel, redBlueStrict, redBlueMode, redBlueVoucherField, extendBody, goodsIssueExpenseList, ... } } }\n迁移其它模块时，可参考 goods-issue 的做法，将原先散落在顶层的业务配置字段统一迁移到 base.__properties__ 下，保持 schema 一致性。",
    astMatcher:
      "(node, context) => context.matchConfigStructureChange(node, 'GoodsIssueBussinessConfig')",
    examples: [
      {
        before:
          "export const GoodsIssueBussinessConfig: IVoucherBizOptions = {\n  payment: { paymentDirection: PaymentDirection.AR, ... },\n  inventory: { outBoundDirection: true, direction: 'sales' },\n  main: { custVendor: 'soldToCustId' },\n  redBlueVoucherAbbr: { redVoucher: 'SA', blueVoucher: 'SA' },\n  redBlueVoucherLabel: { blueVoucher: '销货单', redVoucher: '退货单' },\n  redBlueStrict: false,\n  redBlueVoucherField: { ... },\n  extendBody: { paymentList: { ... }, promoList: { ... }, goodsIssueExpenseList: { ... } }\n};",
        after:
          "export const GoodsIssueBussinessConfig: IVoucherBizSchema = {\n  base: {\n    __properties__: {\n      name: \"\",\n      boName: \"\",\n      payment: { paymentDirection: PaymentDirection.AR, ... },\n      inventory: { outBoundDirection: true, direction: 'sales' },\n      custVendor: 'soldToCustId',\n      redBlueVoucherAbbr: { redVoucher: 'SA', blueVoucher: 'SA' },\n      redBlueVoucherLabel: { blueVoucher: '销货单', redVoucher: '退货单' },\n      redBlueStrict: false,\n      redBlueMode: 'redMode',\n      redBlueVoucherField: { ... },\n      extendBody: { paymentList: { ... }, promoList: { ... }, goodsIssueExpenseList: { ... } }\n    }\n  }\n};",
        file: "sales/goods-issue/service/GoodsIssueVoucherConfig.ts",
      },
    ],
  },
  {
    id: "ActionFullpath-迁移到-path-与-bizSchemaManager",
    severity: "error",
    category: "lifecycle",
    message:
      "ctx.action.fullpath 的使用需要迁移为基于 ctx.action.path 和 bizSchemaManager.defaultBodyName 的新模式",
    hoverMessage:
      "旧代码通过 ctx.action.fullpath 拆分出 body 名称与行号，新代码统一改为使用 ctx.action.path（不再包含前缀 type）配合 bizSchemaManager.defaultBodyName 获取表体名。",
    upgradeGuide:
      "在旧版框架中，Action 上提供 fullpath 字段，通常为四段结构，例如 detailList.goodsItems.0.transQty：\n- 典型写法：\n  - const bodyfFieldName = ctx.action.fullpath.split('.')[1]\n  - let [type, bodyFieldName, rowIndex, changedField] = ctx.action.fullpath.split('.')\n  - bindingObjectPath: `${ctx.action.fullpath.split('.')[1]}`\n在新版框架中，推荐的写法为：\n1. 使用 ctx.action.path 获取三段式路径 [bodyFieldName, rowIndex, changedField]，不再包含 type 前缀：\n   - let [bodyFieldName, rowIndex, changedField] = ctx.action.path.split('.')\n2. 对于处理明细表体的 ProcessorBlock / Processor，优先通过 bizSchemaManager.defaultBodyName 获取默认表体名，而不是从 fullpath 中截取：\n   - const bodyFieldName = ctx.bizApplication.bizSchemaManager.defaultBodyName\n   - bindingObjectPath: `${ctx.bizApplication.bizSchemaManager.defaultBodyName}`\n迁移建议：\n- 所有直接访问 ctx.action.fullpath 的地方，改为 ctx.action.path 或通过 bizSchemaManager.defaultBodyName 获取表体名；\n- 对于数量变更等场景，参考新实现：biz-common/application/(stock|sales)/quantity/processor/quantityChangedProcessorBlock.ts。",
    astMatcher:
      "(node, context) => {\n      // 匹配 MemberExpression 形式的 ctx.action.fullpath\n      return context.isMemberExpression(node, 'ctx.action.fullpath');\n    }",
    quickFix: {
      title:
        "将 ctx.action.fullpath 迁移为 ctx.action.path / bizSchemaManager.defaultBodyName",
      transform:
        "(code, range) => {\n        // 简单 quick fix：将 .fullpath 文本替换为 .path，复杂解构与 bindingObjectPath 迁移需人工参考迁移指南调整\n        const target = code.slice(range.start, range.end);\n        const replaced = target.replace(/\\.fullpath/g, '.path');\n        return code.slice(0, range.start) + replaced + code.slice(range.end);\n      }",
    },
    examples: [
      {
        before:
          "export function detailProductProcessBlock(ctx: BizContext, options?: IProcessorOptions) {\n  const bodyfFieldName = ctx.action.fullpath.split('.')[1]\n  const processorBlock = new SyncProcessBlock(ctx, \"detailProductProcessBlock\", options || {\n    concurrency: 1,\n    bindingObjectPath: `${bodyfFieldName}`\n  });\n}",
        after:
          "export function detailProductProcessBlock(ctx: BizContext, options?: IProcessorOptions) {\n  const bodyfFieldName = ctx.action.path.split('.')[0]\n  const processorBlock = new SyncProcessBlock(ctx, \"detailProductProcessBlock\", options || {\n    concurrency: 1,\n    bindingObjectPath: `${bodyfFieldName}`\n  });\n}",
        file: "invoice/invoice-issue-list/service/action-handler/detailProductProcessBlock.ts",
      },
      {
        before:
          'export function quantityChangedProcessorBlock(ctx: BizContext, options?: IProcessorOptions): SyncProcessBlock {\n  const processorBlock = new SyncProcessBlock(ctx, "QuantityChangedSyncProcessorBlock", {\n    condition: (processor: IProcessor) => {\n      let params = ctx.action.fullpath.split(".");\n      let [type, bodyFieldName, rowIndex, changedField] = params;\n      if (params.length == 4) {\n        if (ctx.bizService.bizModel.getDetailItemByIndex(bodyFieldName, parseInt(rowIndex))["productId"]) {\n          return true;\n        } else {\n          return false;\n        }\n      } else {\n        return true;\n      }\n    }\n  });\n  // ...\n}',
        after:
          'export function quantityChangedProcessorBlock(ctx: BizContext, options?: IProcessorOptions): SyncProcessBlock {\n  const processorBlock = new SyncProcessBlock(ctx, "QuantityChangedSyncProcessorBlock", {\n    condition: (processor: IProcessor) => {\n      let params = ctx.action.path.split(".");\n      let [bodyFieldName, rowIndex, changedField] = params;\n      if (params.length == 3) {\n        if (ctx.model.getDetailItemByIndex(bodyFieldName, parseInt(rowIndex))["productId"]) {\n          return true;\n        } else {\n          return false;\n        }\n      } else {\n        return true;\n      }\n    }\n  });\n  // ...\n}',
        file: "biz-common/application/sales/quantity/processor/quantityChangedProcessorBlock.ts",
      },
      {
        before:
          'export function quantityChangedProcessorBlock(ctx: BizContext, options?: IProcessorOptions): SyncProcessBlock {\n  const processorBlock = new SyncProcessBlock(ctx, "QuantityChangedSyncProcessorBlock", {\n    condition: (processor: IProcessor) => {\n      let params = ctx.action.fullpath.split(".");\n      let [type, bodyFieldName, rowIndex, changedField] = params;\n      if (params.length == 4) {\n        if (ctx.bizService.bizModel.getDetailItemByIndex(bodyFieldName, parseInt(rowIndex))["productId"]) {\n          return true;\n        } else {\n          return false;\n        }\n      } else {\n        return true;\n      }\n    }\n  });\n  // ...\n}',
        after:
          'export function quantityChangedProcessorBlock(ctx: BizContext, options?: IProcessorOptions): AsyncProcessBlock {\n  const processorBlock = new AsyncProcessBlock(ctx, "QuantityChangedSyncProcessorBlock", {\n    condition: (processor: IProcessor) => {\n      let params = ctx.action.path.split(".");\n      let [bodyFieldName, rowIndex, changedField] = params;\n      if (params.length == 3) {\n        if (ctx.model.getDetailItemByIndex(bodyFieldName, parseInt(rowIndex))["productId"]) {\n          return true;\n        } else {\n          return false;\n        }\n      } else {\n        return true;\n      }\n    }\n  });\n  // ...\n}',
        file: "biz-common/application/stock/quantity/processor/quantityChangedProcessorBlock.ts",
      },
    ],
  },
  {
    id: "ValidatorConfig-扁平化-main-body-结构",
    severity: "error",
    category: "structure",
    message:
      "校验器配置对象中 main/body 下的字段需要扁平化到顶层，以适配新版 VoucherValidatorLauncher",
    hoverMessage:
      "旧版校验配置使用 main / body 分组，新版要求将这些分组下的字段直接提升到配置对象顶层。",
    upgradeGuide:
      "在旧版代码中，字段校验配置通常形如：\n- const config = { main: { fieldA: {...}, fieldB: {...} }, body: { detailList: {...} }, ... }\n新版中，VoucherValidatorLauncher 仅接受已扁平化的配置对象：\n- const config = { fieldA: {...}, fieldB: {...}, detailList: {...}, ... }\n迁移时：\n1. 展开 config.main 和 config.body 内部的属性，合并到配置对象顶层；\n2. 确保不会丢失原有字段配置；\n3. 配合构造函数从两个参数变为一个参数的变更一起完成（参见 VoucherValidatorLauncher 构造函数规则）。",
    astMatcher: "(node, context) => context.matchValidatorConfigFlatten(node)",
    examples: [
      {
        before:
          "const expenseFieldValidatorConfig = {\n  main: {\n    bizTypeId: { /* ... */ },\n    billCustVendorId: { /* ... */ }\n  },\n  body: {\n    detailList: { /* ... */ }\n  }\n};\nnew VoucherValidatorLauncher(expenseFieldValidatorConfig, bizModel);",
        after:
          "const expenseFieldValidatorConfig = {\n  bizTypeId: { /* ... */ },\n  billCustVendorId: { /* ... */ },\n  detailList: { /* ... */ }\n};\nnew VoucherValidatorLauncher(expenseFieldValidatorConfig);",
        file: "arap/expense/validator/ExpenseFieldValidatorConfig.ts",
      },
    ],
  },
  {
    id: "IDetailFieldValidator-迁移为-IFieldValidator-并调整参数",
    severity: "error",
    category: "api",
    message:
      "校验函数从 IDetailFieldValidator 迁移为 IFieldValidator，参数与返回字段约定也需要同步更新",
    hoverMessage:
      "旧版明细校验使用 IDetailFieldValidator(value, { _bizModel }, ctx?)，新版统一为 IFieldValidator(currentRow, { model }, ctx?)，并要求返回对象使用 $level / $message / $fieldName 等字段。",
    upgradeGuide:
      "在旧版中，明细字段校验通常形如：\n- const myValidator: IDetailFieldValidator = (value, { _bizModel }, ctx) => ({ level: 'error', message: 'xxx', fieldName: 'yyy' });\n新版要求：\n1. 类型统一为 IFieldValidator；\n2. 参数签名调整为 (currentRow: any, { model: _bizModel }, ctx: BizContext) 或去掉未使用的参数；\n3. 返回对象的属性名从 level/message/fieldName 改为 $level/$message/$fieldName，以避免和业务字段冲突。\n迁移可以参考 eslint 规则对参数与返回字段的自动修复逻辑，逐个替换函数声明与实现。",
    astMatcher:
      "(node, context) => context.matchValidatorFunctionMigration(node)",
    examples: [
      {
        before:
          "const amountValidator: IDetailFieldValidator = (value, { _bizModel }) => {\n  if (!value) {\n    return { level: 'error', message: '金额必填', fieldName: 'amount' };\n  }\n  return { level: 'success', message: '', fieldName: 'amount' };\n};",
        after:
          "const amountValidator: IFieldValidator = (currentRow: any, { model: _bizModel }, ctx: BizContext) => {\n  if (!currentRow.amount) {\n    return { $level: 'error', $message: '金额必填', $fieldName: 'amount' };\n  }\n  return { $level: 'success', $message: '', $fieldName: 'amount' };\n};",
        file: "biz-common/validator/amountValidator.ts",
      },
    ],
  },
  {
    id: "VoucherDefinition-访问迁移到-bizSchemaManager-与-bizOptions",
    severity: "error",
    category: "lifecycle",
    message:
      "直接访问 voucherDefinition / bizService.options 等旧属性需要迁移为 bizSchemaManager.getProperty / bizApplication.bizOptions.getOption 模式",
    hoverMessage:
      "旧代码通过 voucherDefinition/bizService.options 直接读配置，新代码统一通过 bizSchemaManager.getProperty(...) 和 bizApplication.bizOptions.getOption(...) 访问。",
    upgradeGuide:
      "典型旧代码包括：\n- ctx.voucherDefinition.main.custVendor\n- ctx.bizService.options.commonType\n- bizModel.voucherDefinition.bodies[bodyFieldName].isInvalidRow(row)\n迁移模式包括：\n1. voucherDefinition 主体改为 bizSchemaManager：\n   - ctx.voucherDefinition.main.custVendor -> ctx.bizApplication.bizSchemaManager.getProperty('custVendor')\n   - this.bizModel.voucherDefinition -> this.bizModel.bizSchemaManager\n2. bodies 配置改为 invalid/autoOperaRow：\n   - bizSchemaManager.getProperty('bodies')[bodyFieldName].isInvalidRow(row) -> bizSchemaManager.getProperty('invalid.validator', bodyFieldName)(row)\n3. options 访问改为 getOption：\n   - ctx.bizService.options.commonType -> ctx.bizApplication.bizOptions.getOption('commonType')\n4. bodiesName[0] 改为 defaultBodyName：\n   - bizSchemaManager.bodiesName[0] -> bizSchemaManager.defaultBodyName。\n这些迁移在 eslint 规则中通过精确的 MemberExpression 匹配与文本重写完成，建议在手动修改时保持同样的模式，避免误伤。",
    astMatcher:
      "(node, context) => context.matchVoucherDefinitionAndBizOptionsAccess(node)",
    examples: [
      {
        before:
          "const custVendor = ctx.voucherDefinition.main.custVendor;\nconst invalid = bizSchemaManager.getProperty('bodies')[bodyFieldName].isInvalidRow(row);\nconst commonType = ctx.bizService.options.commonType;",
        after:
          "const custVendor = ctx.bizApplication.bizSchemaManager.getProperty('custVendor');\nconst invalid = bizSchemaManager.getProperty('invalid.validator', bodyFieldName)(row);\nconst commonType = ctx.bizApplication.bizOptions.getOption('commonType');",
        file: "biz-common/domain/voucher/processor/SomeProcessor.ts",
      },
    ],
  },
  {
    id: "ValidatorTest-断言与-mockService-调用升级",
    severity: "warning",
    category: "pattern",
    message:
      "校验器测试用例中的断言字段与 mockService 调用方式需要按新约定升级",
    hoverMessage:
      "旧测试代码直接断言 level/message/fieldName 或调用 mockService，新版期望使用 $level/$message/$fieldName 以及 bizMock.mockBizApplicationForVoucherDefinition。",
    upgradeGuide:
      "在测试代码中，典型旧写法包括：\n1. 对结果对象的断言：\n   - expect(result).toEqual({ level: 'error', message: 'xxx', fieldName: 'amount' })\n   - expect(result.level).toBe('error')\n2. 使用 mockService 构造上下文：\n   - const ctx = mockService({ ... });\n3. bodiesName 仅为数组：\n   - { bodiesName: ['detailList'] }\n新版约定为：\n1. 字段名统一加上 $ 前缀：$level / $message / $fieldName；\n2. 使用 bizMock.mockBizApplicationForVoucherDefinition 替代 mockService，并从 '@chanjet/cc-front-biz-mock' 导入 bizMock；\n3. 在 bodiesName 配置的对象中补充 defaultBodyName，并取 bodiesName[0] 作为默认表体名。\n这些规则只作用在测试文件中（*.test.ts），用于保证测试代码与运行时代码的新返回结构和上下文构造方式一致。",
    astMatcher:
      "(node, context) => context.matchValidatorTestAndMockServicePatterns(node)",
    examples: [
      {
        before:
          "const ctx = mockService({ bodiesName: ['detailList'] });\nconst result = validator(value, ctx);\nexpect(result).toEqual({ level: 'error', message: '必填', fieldName: 'amount' });",
        after:
          "const ctx = bizMock.mockBizApplicationForVoucherDefinition({ bodiesName: ['detailList'], defaultBodyName: 'detailList' });\nconst result = validator(value, ctx);\nexpect(result).toEqual({ $level: 'error', $message: '必填', $fieldName: 'amount' });",
        file: "biz-common/validator/__tests__/amountValidator.test.ts",
      },
    ],
  },
  {
    id: "DollarField-属性去除前缀",
    severity: "warning",
    category: "pattern",
    message: "去除 refer/C/error 等对象上的 $ 前缀字段访问",
    hoverMessage:
      "旧代码中存在 refer.$xxx / C.$fieldName / error.$message 访问，新版字段名已去掉 $ 前缀，应统一替换。",
    upgradeGuide:
      "将以下形式统一去除 $：\n- refer.$amount -> refer.amount\n- C.$fieldName -> C.fieldName\n- expect(error.$message).toBe('...') -> expect(error.message).toBe('...')",
    oldPattern: "refer\\.\\$\\w+|C\\.\\$fieldName|error\\.\\$message",
    newPattern: "refer\\.\\w+|C\\.fieldName|error\\.message",
    examples: [
      {
        before: "const val = refer.$amount;",
        after: "const val = refer.amount;",
        file: "arap/expense/service/ExpenseService.ts",
      },
      {
        before: "expect(error.$message).toBe('清理凭证失败')",
        after: "expect(error.message).toBe('清理凭证失败')",
        file: "biz-common/validator/__tests__/errorMessage.test.ts",
      },
    ],
  },
  {
    id: "bodiesName-与-defaultBodyName-访问调整",
    severity: "warning",
    category: "lifecycle",
    message:
      "bodiesName 相关访问统一迁移到 bizSchemaManager.defaultBodyName 或 getProperty",
    hoverMessage:
      "旧代码直接取 bodiesName[0] 或从 bizOptions/bizSchemaManager 取数组，新版推荐使用 bizSchemaManager.defaultBodyName 或 getProperty('bodiesName')[n]。",
    upgradeGuide:
      "常见旧写法：\n- ctx.bizApplication.bizOptions.bodiesName[0]\n- ctx?.bizSchemaManager?.bodiesName?.[0]\n- this.bizSchemaManager?.bodiesName?.[0]\n- getProperty('bodies')[bodyFieldName]\n迁移为：\n- ctx.bizApplication.bizSchemaManager.defaultBodyName\n- ctx.bizApplication.bizSchemaManager.getProperty('bodiesName')[n]\n- 或直接使用 defaultBodyName 作为绑定路径。",
    oldPattern:
      "bodiesName\\s*\\[0\\]|bizSchemaManager\\.getProperty\\('bodies'\\)\\[[^\\]]+\\]",
    newPattern:
      "bizSchemaManager\\.defaultBodyName|bizSchemaManager\\.getProperty\\('bodiesName'\\)\\[\\d+\\]|bizSchemaManager\\.getProperty\\([^)]*bodyFieldName[^)]*\\)",
    examples: [
      {
        before: "const path = `${ctx.voucherDefinition.bodiesName[0]}`;",
        after:
          "const path = `${ctx.bizApplication.bizSchemaManager.defaultBodyName}`;",
        file: "sales/goods-issue/service/GoodsIssueService.ts",
      },
      {
        before:
          "const body = this.bizSchemaManager.getProperty('bodies')[this.bodyFieldName];",
        after: "const body = this.bizSchemaManager.defaultBodyName;",
        file: "biz-common/application/stock/processor/SomeProcessor.ts",
      },
    ],
  },
  {
    id: "redBlue-属性访问改为-getProperty",
    severity: "warning",
    category: "api",
    message: "redBlueStrict/redBlueDataConvertMode 统一通过 getProperty 获取",
    hoverMessage:
      "voucherDefinition.redBlueStrict / redBlueDataConvertMode 不再直接暴露，需通过 bizSchemaManager.getProperty 访问。",
    upgradeGuide:
      "将 voucherDefinition.redBlueStrict 替换为 voucherDefinition.getProperty('redBlueStrict')；\n将 voucherDefinition.redBlueDataConvertMode 替换为 voucherDefinition.getProperty('redBlueDataConvertMode')。",
    oldPattern:
      "voucherDefinition\\.redBlueStrict|voucherDefinition\\.redBlueDataConvertMode",
    newPattern:
      "voucherDefinition\\.getProperty\\('redBlueStrict'\\)|voucherDefinition\\.getProperty\\('redBlueDataConvertMode'\\)",
    examples: [
      {
        before: "if (voucherDefinition.redBlueStrict) { ... }",
        after: "if (voucherDefinition.getProperty('redBlueStrict')) { ... }",
        file: "arap/expense/service/ExpenseService.ts",
      },
    ],
  },
  {
    id: "custVendor-与-promotion-属性访问迁移",
    severity: "warning",
    category: "lifecycle",
    message:
      "custVendor / isVoucherSupportPromotion 等属性改为 bizSchemaManager.getProperty 访问",
    hoverMessage:
      "旧代码 ctx.voucherDefinition.main.custVendor 或 ctx.bizApplication.bizSchemaManager?.isVoucherSupportPromotion 需改为 getProperty('custVendor' | 'isVoucherSupportPromotion')。",
    upgradeGuide:
      "示例：\n- ctx.voucherDefinition.main.custVendor -> ctx.bizApplication.bizSchemaManager.getProperty('custVendor')\n- ctx.bizApplication.bizSchemaManager?.isVoucherSupportPromotion -> ctx.bizApplication.bizSchemaManager?.getProperty('isVoucherSupportPromotion')",
    oldPattern: "custVendor|isVoucherSupportPromotion",
    newPattern:
      "getProperty\\('custVendor'\\)|getProperty\\('isVoucherSupportPromotion'\\)",
    examples: [
      {
        before: "const custVendor = ctx.voucherDefinition.main.custVendor;",
        after:
          "const custVendor = ctx.bizApplication.bizSchemaManager.getProperty('custVendor');",
        file: "arap/expense/service-mobile/MobileExpenseService.ts",
      },
      {
        before:
          "if (ctx.bizApplication.bizSchemaManager?.isVoucherSupportPromotion) { ... }",
        after:
          "if (ctx.bizApplication.bizSchemaManager?.getProperty('isVoucherSupportPromotion')) { ... }",
        file: "biz-common/application/stock/processor/Promotion.ts",
      },
    ],
  },
  {
    id: "minRowCount-迁移到-autoOperaRow",
    severity: "warning",
    category: "structure",
    message: "表体 minRowCount 访问改为 autoOperaRow.minRowCount",
    hoverMessage:
      "旧结构在 bodies.detail.minRowCount，新版放到 autoOperaRow.minRowCount，通过 getProperty('autoOperaRow.minRowCount', bodyFieldName) 获取。",
    upgradeGuide:
      "示例迁移：\nthis.bizSchemaManager.getProperty('bodies')[bodyFieldName].minRowCount -> this.bizSchemaManager.getProperty('autoOperaRow.minRowCount', bodyFieldName)",
    oldPattern: "getProperty\\('bodies'\\)\\[[^\\]]+\\]\\.minRowCount",
    newPattern: "getProperty\\('autoOperaRow\\.minRowCount',\\s*[^)]+\\)",
    examples: [
      {
        before:
          "const min = this.bizSchemaManager.getProperty('bodies')[this.bodyFieldName].minRowCount;",
        after:
          "const min = this.bizSchemaManager.getProperty('autoOperaRow.minRowCount', this.bodyFieldName);",
        file: "biz-common/application/stock/processor/RowGuard.ts",
      },
    ],
  },
  {
    id: "文案修正-Ware-Location",
    severity: "info",
    category: "pattern",
    message: "将错误文案 “Ware Location不能为空” 修正为 “调出货位不能为空”",
    hoverMessage: "新规范的提示文案已更改，请同步更新字符串字面量。",
    upgradeGuide:
      "查找字面量 'Ware Location不能为空' 并替换为 '调出货位不能为空'。",
    oldPattern: "Ware Location不能为空",
    newPattern: "调出货位不能为空",
    examples: [
      {
        before: "throw new Error('Ware Location不能为空');",
        after: "throw new Error('调出货位不能为空');",
        file: "biz-common/validator/stockValidator.ts",
      },
    ],
  },
  {
    id: "getGlobbingSublistName-迁移为-isBody",
    severity: "warning",
    category: "api",
    message:
      "getGlobbingSublistName(this.bizSchemaManager, fieldNamePath) -> this.bizSchemaManager.isBody(fieldNamePath)",
    hoverMessage:
      "新版 bizSchemaManager 提供 isBody 方法判断是否表体，旧的 getGlobbingSublistName 已废弃。",
    upgradeGuide:
      "将 getGlobbingSublistName(this.bizSchemaManager, fieldNamePath) 直接替换为 this.bizSchemaManager.isBody(fieldNamePath)。",
    oldPattern:
      "getGlobbingSublistName\\(this\\.bizSchemaManager\\s*,\\s*fieldNamePath\\)",
    newPattern: "this\\.bizSchemaManager\\.isBody\\(fieldNamePath\\)",
    examples: [
      {
        before:
          "return getGlobbingSublistName(this.bizSchemaManager, fieldNamePath);",
        after: "return this.bizSchemaManager.isBody(fieldNamePath);",
        file: "biz-common/application/stock/processor/SomeProcessor.ts",
      },
    ],
  },
  {
    id: "getProperty-bodies-改为-getPropertyByBoFieldPath",
    severity: "warning",
    category: "lifecycle",
    message:
      "getProperty('bodies')[path] 访问表体配置需改为 getPropertyByBoFieldPath",
    hoverMessage:
      "旧写法通过 getProperty('bodies')[path] 读取表体配置，新版需调用 bizSchemaManager.getPropertyByBoFieldPath。",
    upgradeGuide:
      "示例迁移：\nthis.bizModel.bizSchemaManager.getProperty('bodies')[this.getFieldPath('paymentList')] -> this.bizModel.bizSchemaManager.getPropertyByBoFieldPath(null, this.getFieldPath('paymentList'))",
    oldPattern: "getProperty\\('bodies'\\)\\[[^\\]]+\\]",
    newPattern: "getPropertyByBoFieldPath\\([^)]*\\)",
    examples: [
      {
        before:
          "const body = this.bizModel.bizSchemaManager.getProperty('bodies')[this.getFieldPath('paymentList')];",
        after:
          "const body = this.bizModel.bizSchemaManager.getPropertyByBoFieldPath(null, this.getFieldPath('paymentList'));",
        file: "biz-common/application/stock/processor/PaymentProcessor.ts",
      },
    ],
  },
  {
    id: "payName-调用参数迁移",
    severity: "warning",
    category: "api",
    message: "payName 调用不再传 bizModel/model，改传 bizApplication",
    hoverMessage:
      "旧代码 payName(mockBizModel) 或 payName(ctx?.model) 需改为 payName(mockBizContext.bizApplication) / payName(ctx?.bizApplication)。",
    upgradeGuide:
      "将 payName 第一个参数替换为 bizApplication：\n- payName(mockBizModel) -> payName(mockBizContext.bizApplication)\n- payName(ctx?.model) -> payName(ctx?.bizApplication)",
    oldPattern: "payName\\((mockBizModel|ctx\\?\\.model)\\)",
    newPattern:
      "payName\\((mockBizContext\\.bizApplication|ctx\\?\\.bizApplication)\\)",
    examples: [
      {
        before: "const r = payName(mockBizModel);",
        after: "const r = payName(mockBizContext.bizApplication);",
        file: "biz-common/validator/__tests__/payName.test.ts",
      },
      {
        before: "payName(ctx?.model);",
        after: "payName(ctx?.bizApplication);",
        file: "biz-common/validator/amountValidator.ts",
      },
    ],
  },
  {
    id: "isMobileLotNoAutoGenerated-解构迁移",
    severity: "warning",
    category: "lifecycle",
    message:
      "从 voucherDefinition 解构 isMobileLotNoAutoGenerated 改为 bizSchemaManager.getProperty 获取",
    hoverMessage:
      "旧代码 const { isMobileLotNoAutoGenerated } = voucherDefinition; 新版应从 ctx?.model?.bizSchemaManager.getProperty('isMobileLotNoAutoGenerated') 获取。",
    upgradeGuide:
      "替换解构：\nconst { isMobileLotNoAutoGenerated } = voucherDefinition;\n-> const isMobileLotNoAutoGenerated = ctx?.model?.bizSchemaManager.getProperty('isMobileLotNoAutoGenerated');",
    oldPattern:
      "\\{\\s*isMobileLotNoAutoGenerated\\s*\\}\\s*=\\s*voucherDefinition",
    newPattern:
      "bizSchemaManager\\.getProperty\\('isMobileLotNoAutoGenerated'\\)",
    examples: [
      {
        before: "const { isMobileLotNoAutoGenerated } = voucherDefinition;",
        after:
          "const isMobileLotNoAutoGenerated = ctx?.model?.bizSchemaManager.getProperty('isMobileLotNoAutoGenerated');",
        file: "biz-common/application/stock/processor/LotValidator.ts",
      },
    ],
  },
  {
    id: "bizOptions-与-action-访问迁移",
    severity: "warning",
    category: "lifecycle",
    message:
      "bizSchemaManager.action / ctx.bizService.options 等访问需迁移到 bizApplication.bizOptions",
    hoverMessage:
      "旧代码 ctx.bizApplication.bizSchemaManager.action 或 processor.bizModel.bizSchemaManager.action 需改为 bizApplication.bizOptions.action；commonType 等选项应统一使用 bizOptions.getOption。",
    upgradeGuide:
      "示例：\n- ctx.bizApplication.bizSchemaManager.action -> ctx.bizApplication.bizOptions.action\n- processor.bizModel.bizSchemaManager.action -> processor.bizContext.bizApplication.bizOptions.action\n- ctx.bizService.options.commonType -> ctx.bizApplication.bizOptions.getOption('commonType')",
    oldPattern: "bizSchemaManager\\.action|bizService\\.options",
    newPattern: "bizOptions\\.action|bizOptions\\.getOption",
    examples: [
      {
        before: "const action = ctx.bizApplication.bizSchemaManager.action;",
        after: "const action = ctx.bizApplication.bizOptions.action;",
        file: "biz-common/application/stock/processor/QuantityChanged.ts",
      },
      {
        before: "const commonType = ctx.bizService.options.commonType;",
        after:
          "const commonType = ctx.bizApplication.bizOptions.getOption('commonType');",
        file: "biz-common/domain/voucher/processor/CommonType.ts",
      },
    ],
  },
  {
    id: "校验辅助函数-参数签名调整",
    severity: "warning",
    category: "api",
    message: "部分校验辅助函数参数需改为新版签名，统一传 ctx 或 {model}",
    hoverMessage:
      "如下函数需要按新版签名调整：bodyExchangeRateValidator、inventoryLotCreationDateValidator、mobileInventoryLotCreationDateRequiredValidator、inventoryLotExpirationDateValidator、analysisQtyValidator、superadditionQtyValidator、transForOnAvailQtyAndOnHandQtyValidator。",
    upgradeGuide:
      "典型迁移示例：\n- bodyExchangeRateValidator(master, detailRow, bizModel, detailName) -> bodyExchangeRateValidator(master, detailRow, {model: bizModel}, detailName)\n- transForOnAvailQtyAndOnHandQtyValidator(master, detailRow, ctx?.model) -> transForOnAvailQtyAndOnHandQtyValidator(master, detailRow, ctx)\n- mobileInventoryLotCreationDateRequiredValidator(mockDetailRow, mockDetailRow, mockBizModel as any) -> ...({model: service.bizModel} as any)",
    oldPattern:
      "bodyExchangeRateValidator\\(|inventoryLotCreationDateValidator\\(|mobileInventoryLotCreationDateRequiredValidator\\(|inventoryLotExpirationDateValidator\\(|analysisQtyValidator\\(|superadditionQtyValidator\\(|transForOnAvailQtyAndOnHandQtyValidator\\(",
    newPattern: "model\\}|ctx\\)",
    examples: [
      {
        before:
          "bodyExchangeRateValidator(master, detailRow, bizModel, detailName);",
        after:
          "bodyExchangeRateValidator(master, detailRow, {model: bizModel}, detailName);",
        file: "biz-common/validator/bodyExchangeRateValidator.test.ts",
      },
      {
        before:
          "transForOnAvailQtyAndOnHandQtyValidator(master, detailRow, ctx?.model);",
        after:
          "transForOnAvailQtyAndOnHandQtyValidator(master, detailRow, ctx);",
        file: "biz-common/application/stock/quantity/processor/quantityChangedProcessorBlock.ts",
      },
    ],
  },
];
