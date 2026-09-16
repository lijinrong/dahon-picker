# 大行选购器(Dahon Picker)

帮你回答"预算 X、用途 Y,该买哪款大行折叠车?":4 题向导给出 2-4 款推荐与理由;
型号百科可筛选对比;官方代码(如 KAA084)逐位解读,俗称(K3/P8)双向查询。

## 技术栈

Astro 5(静态生成)+ Vue 3 岛屿 + TypeScript(strict)+ zod 数据校验 + Vitest + Playwright。

## 本地开发

    npm install
    npm run dev          # 开发服务器
    npm run build        # 静态构建到 dist/
    npm run check        # astro 类型检查
    npm test             # 单元 + 数据测试
    npm run validate     # 仅数据校验(改完数据快速验收)
    npm run test:coverage# 覆盖率(门禁 80%)
    npm run e2e          # Playwright(需先 build)

## 数据维护流程

1. 编辑 `src/data/bikes.json`(车型)或 `src/data/naming.json`(命名规则)
2. `npm run validate` 确认数据合法(任何坏数据 fail)
3. commit + push → CI 自动校验、测试、构建并发布
4. 价格更新时同步改 `priceUpdatedAt`,页面向用户展示"更新于 YYYY-MM"

字段说明与收录标准见 `docs/superpowers/specs/2026-09-14-dahon-picker-design.md` §5;
逐车型来源台账见 `docs/data-sources.md`。

## 部署

Cloudflare Pages,项目名 `dahon-picker`。手动发布:`npx wrangler pages deploy dist`。

## 免责

价格仅供参考,以实际渠道为准。本项目与大行(DAHON)无隶属关系;"Dahon"商标归其所有者。
