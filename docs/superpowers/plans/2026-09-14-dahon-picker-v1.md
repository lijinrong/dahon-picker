# 大行选购器 v1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建移动优先的静态网站:4 题选购向导 + 型号百科/对比 + 命名解读器,帮助消费者选大行折叠车。

**Architecture:** Astro 静态生成 + 4 个 Vue 交互岛屿(WizardFlow / BikeTable / CompareTable / Decoder)。全部业务逻辑在 `src/lib/` 纯 TypeScript 函数(无 DOM 依赖),数据为手动维护的两个 JSON(bikes.json / naming.json),build 时 zod 全量校验。纯静态产物部署 Cloudflare Pages。

**Tech Stack:** Astro 5 + @astrojs/vue + Vue 3 + TypeScript(strict)+ zod 3 + Vitest(happy-dom、@vue/test-utils)+ Playwright。

**Spec:** `docs/superpowers/specs/2026-09-14-dahon-picker-design.md`(本计划从 spec 出发,执行者需同时阅读 spec)

## Global Constraints

- 项目根目录:`~/projects/dahon-picker`(git 仓库已初始化,当前分支 master,Task 18 推送前会统一改名为 main)。所有命令默认在此目录执行。
- Node ≥ 20;npm 作为包管理器;TypeScript `strict: true`。
- `src/lib/` 下所有函数必须为纯函数:不访问 `window`/`document`、不发起网络请求、不读文件。URL 解析用 `URLSearchParams`(Node/浏览器通用)封装在 `urlState.ts`,浏览器跳转只出现在 `.vue` 岛屿组件里。
- 数据是唯一事实源:`src/data/bikes.json` 与 `src/data/naming.json` 手动维护;任何代码不得硬编码车型参数(筛选控件的选项也须从数据推导)。
- build 时必须全量校验数据,任何一条坏数据 fail build。`npm run validate`(即 `vitest run tests/data`)是数据相关任务的验收门。
- v1 不做:后端、账号、爬虫、小程序、导购链接、实拍图。页面不引用任何外部图片(示意图用内联 SVG/CSS)。
- 面向用户的所有文案为简体中文,口吻"人话、不堆参数";价格旁必须显示更新年月;页脚必须有"价格仅供参考,以实际渠道为准"。
- 提交信息用约定式格式(`feat:` / `test:` / `docs:` / `chore:`),中文描述。每个任务至少一次提交。
- 推荐容差(预算上限 × 1.1)、身高代表值(158/165/175/183)、打分权重等数值常量以 Task 2/3 定义为准,与 spec §4.3 一致,不得在别处另行发明。

---

### Task 1: 项目脚手架 + zod Schema + 数据校验闭环

**Files:**
- Create: `package.json`、`astro.config.mjs`、`tsconfig.json`、`vitest.config.ts`、`.gitignore`、`src/env.d.ts`
- Create: `src/lib/schema.ts`
- Create: `src/data/bikes.json`(种子:1 款真实车型,需检索考证)
- Create: `tests/helpers.ts`、`tests/data/schema.test.ts`
- Create: `src/styles/tokens.css`(最小骨架,Task 9 扩充)、`src/styles/global.css`(最小)、`src/layouts/Base.astro`、`src/pages/index.astro`(最小首页)

**Interfaces:**
- Consumes: 无(首个任务)
- Produces:
  - `import { bikeSchema, namingSchema, loadBikes, loadNaming } from './lib/schema'`
  - `export type Bike`、`export type Naming`(zod 推导类型,后续所有任务消费)
  - `tests/helpers.ts` 的 `mkBike(overrides?: Partial<Bike>): Bike` 工厂(后续所有测试消费)

- [ ] **Step 1: 手写脚手架文件(不用 create-astro,避免交互式脚手架在非空目录出错)**

`package.json`:

```json
{
  "name": "dahon-picker",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "validate": "vitest run tests/data",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@astrojs/vue": "^5.0.0",
    "astro": "^5.0.0",
    "vue": "^3.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "@types/node": "^22.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "@vue/test-utils": "^2.4.0",
    "@vitest/coverage-v8": "^3.0.0",
    "happy-dom": "^18.0.0",
    "typescript": "^5.5.0",
    "vitest": "^3.0.0"
  }
}
```

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'

export default defineConfig({
  integrations: [vue()],
  site: 'https://dahon-picker.pages.dev',
})
```

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "types": ["node"],
    "resolveJsonModule": true
  }
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true,
  },
})
```

`src/env.d.ts`:

```ts
/// <reference types="astro/client" />
```

`.gitignore`:

```
node_modules/
dist/
.astro/
playwright-report/
test-results/
```

- [ ] **Step 2: 安装依赖并确认构建可用**

Run: `cd ~/projects/dahon-picker && npm install && npm install && npm run build`
Expected: 安装成功;build 因为还没有页面会警告,但必须 exit 0(若无页面 Astro 默认仍可构建;若报错,先创建 Step 5 的 index.astro 再回来跑)。

- [ ] **Step 3: 写 `src/lib/schema.ts`**

```ts
import { z } from 'zod'
import bikesJson from '../data/bikes.json'
import namingJson from '../data/naming.json'

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD')

export const bikeSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug 只允许小写字母数字和连字符'),
    model: z.string().regex(/^[A-Z][A-Z0-9]{2,}$/, '官方代码应为全大写字母数字,至少 3 位'),
    marketingName: z.string().min(1),
    series: z.string().length(1),
    status: z.enum(['active', 'discontinued']),
    discontinuedInfo: z
      .object({
        lastPriceCny: z.number().int().positive(),
        year: z.number().int().min(1990).max(2100),
      })
      .nullable(),
    wheelSize: z.number().int().min(14).max(32),
    weightKg: z.number().positive().max(25),
    folding: z.object({
      mechanism: z.string().min(1),
      foldedSize: z.string().min(1),
      carryScore: z.number().int().min(1).max(5),
    }),
    drivetrain: z.object({
      speeds: z.number().int().min(1).max(33),
      climbScore: z.number().int().min(1).max(5),
    }),
    priceCny: z.number().int().positive().max(200000),
    priceUpdatedAt: dateStr,
    heightRangeCm: z
      .tuple([z.number().int().min(120), z.number().int().max(220)])
      .refine(([lo, hi]) => lo < hi, '身高区间下限必须小于上限'),
    useCases: z.array(z.enum(['commute', 'sport', 'travel', 'casual'])).min(1),
    highlights: z.array(z.string().min(1)).min(1),
    pros: z.array(z.string().min(1)),
    cons: z.array(z.string().min(1)),
    nameDecodeOverride: z
      .array(z.object({ char: z.string().min(1), meaning: z.string().min(1) }))
      .nullable(),
    specs: z.record(z.string()),
    affiliateUrl: z.string().url().nullable(),
    sources: z.array(z.string().min(1)).min(2, '参数/价格需至少 2 个来源交叉验证'),
    updatedAt: dateStr,
  })
  .strict()
  .refine((b) => b.status === 'active' || b.discontinuedInfo !== null, '停产车型必须填 discontinuedInfo')

export const namingSchema = z
  .object({
    positions: z
      .array(
        z.object({
          index: z.number().int().min(0),
          dimension: z.string().min(1),
          map: z.record(z.string()),
        }),
      )
      .min(1),
    nicknames: z.record(z.string()),
    uncertain: z.array(z.object({ note: z.string().min(1) })),
  })
  .strict()

export type Bike = z.infer<typeof bikeSchema>
export type Naming = z.infer<typeof namingSchema>

export function loadBikes(): Bike[] {
  const parsed = z.array(bikeSchema).parse(bikesJson)
  const slugs = new Set<string>()
  for (const b of parsed) {
    if (slugs.has(b.slug)) throw new Error(`slug 重复:${b.slug}`)
    slugs.add(b.slug)
  }
  return parsed
}

export function loadNaming(): Naming {
  return namingSchema.parse(namingJson)
}
```

- [ ] **Step 4: 检索并写入种子车型(1 款,真实数据)**

用 WebSearch/WebFetch 检索 **KAA084**(大行 K3 系列 16 寸折叠车)的当前参数与价格。来源要求:大行官网(dahon.com / dahon.com.cn)+ 京东"大行官方旗舰店/自营"或天猫旗舰店,至少 2 个来源交叉验证价格;参数(重量、变速数、折叠尺寸)以官网为准。

写入 `src/data/bikes.json`(数组,含这一款):

```jsonc
[
  {
    "slug": "kaa084",
    "model": "KAA084",
    "marketingName": "<官方市场名,如 K3 系列…以检索结果为准>",
    "series": "K",
    "status": "active",
    "discontinuedInfo": null,
    "wheelSize": 16,
    "weightKg": <检索值>,
    "folding": { "mechanism": "<检索值>", "foldedSize": "<检索值,如 36×66×69cm>", "carryScore": <按下方评级规则> },
    "drivetrain": { "speeds": <检索值>, "climbScore": <按下方评级规则> },
    "priceCny": <交叉验证后的参考价,取整数>,
    "priceUpdatedAt": "<今天,YYYY-MM-DD>",
    "heightRangeCm": [<官网或推算下限>, <上限>],
    "useCases": ["commute", "travel"],
    "highlights": ["<1-3 条,人话>"],
    "pros": ["<2-4 条>"],
    "cons": ["<1-3 条,如实>"],
    "nameDecodeOverride": null,
    "specs": { "车架": "<…>", "变速": "<…>", "刹车": "<…>" },
    "affiliateUrl": null,
    "sources": ["大行官网 <URL>", "京东旗舰店 <URL>"],
    "updatedAt": "<今天>"
  }
]
```

> 文件必须是合法 JSON(无注释、无双引号内中文括号)。找不到的字段如实给保守估计并在 sources 注明依据,不得臆造精确值。

**carryScore 评级规则(后续数据任务复用):** 5=16 寸且 ≤10kg(可单手提上地铁);4=20 寸且 ≤11kg;3=20 寸 11-12.5kg(可搬但重);2=>12.5kg 或 26 寸;1=基本靠推。
**climbScore 评级规则:** 5=齿比下限 ≤0.8 或明确"爬坡利器"定位;4=齿比下限 ≤1.0;3=常规城市齿比(≤1.2);2=齿比偏高;1=单速/平路定位。查不到齿比时按变速数+产品定位保守评级并在 sources 注明"评级依据"。

同目录写 `src/data/naming.json` 占位结构(内容 Task 8 考证,现在给空规则,保证 loadNaming 可用):

```json
{
  "positions": [{ "index": 0, "dimension": "待考证", "map": {} }],
  "nicknames": {},
  "uncertain": [{ "note": "命名规则待考证(Task 8)" }]
}
```

- [ ] **Step 5: 写最小布局与首页**

`src/styles/tokens.css`:

```css
:root {
  --color-bg: oklch(97.5% 0.005 95);
  --color-surface: oklch(100% 0 0);
  --color-ink: oklch(22% 0.02 250);
  --color-ink-soft: oklch(46% 0.02 250);
  --color-accent: oklch(52% 0.14 150);
  --color-accent-soft: oklch(94% 0.03 150);
  --color-line: oklch(88% 0.01 250);
  --text-base: clamp(1rem, 0.95rem + 0.3vw, 1.0625rem);
  --text-h1: clamp(1.75rem, 1.2rem + 2.5vw, 2.75rem);
  --text-h2: clamp(1.375rem, 1.1rem + 1.2vw, 1.75rem);
  --space-block: clamp(1.5rem, 1.2rem + 1.5vw, 3rem);
  --space-inline: 1rem;
  --radius-card: 14px;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --font-serif: 'Songti SC', 'Noto Serif SC', serif;
  --font-sans: system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
```

`src/styles/global.css`(最小骨架,Task 9 扩充):

```css
@import './tokens.css';

* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.65;
}
```

`src/layouts/Base.astro`:

```astro
---
import '../styles/global.css'
interface Props { title: string; description?: string }
const { title, description = '4 个问题,帮你选到合适的大行折叠车。' } = Astro.props
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <main class="page">
      <slot />
    </main>
    <footer class="site-footer">
      <p>价格仅供参考,以实际渠道为准。数据更新记录见各车型页面。</p>
    </footer>
  </body>
</html>
```

`src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro'
---
<Base title="大行折叠车选购器 · 4 个问题找到适合你的车">
  <section class="hero">
    <h1>大行折叠车,选哪款?</h1>
    <p>4 个问题,30 秒,给你 2-4 款具体型号和推荐理由。</p>
  </section>
</Base>
```

并在 `src/layouts/Base.astro` 的 `<body>` 顶部加降级提示(Task 11 前部分页面依赖 JS):

```astro
{<noscript><p class="noscript-note">本页部分功能需要 JavaScript;型号百科与详情页可直接浏览。</p></noscript>}
```

(直接写在 body 内,不要包在大括号里;上面仅为示意位置。)

- [ ] **Step 6: 写测试工厂 `tests/helpers.ts`**

```ts
import type { Bike } from '../src/lib/schema'

export function mkBike(overrides: Partial<Bike> = {}): Bike {
  return {
    slug: 'test-bike',
    model: 'TEST01',
    marketingName: '测试车',
    series: 'T',
    status: 'active',
    discontinuedInfo: null,
    wheelSize: 20,
    weightKg: 11,
    folding: { mechanism: '磁吸快折', foldedSize: '35×70×75cm', carryScore: 4 },
    drivetrain: { speeds: 8, climbScore: 3 },
    priceCny: 3000,
    priceUpdatedAt: '2026-09-14',
    heightRangeCm: [155, 185],
    useCases: ['commute'],
    highlights: ['测试亮点'],
    pros: ['优点一'],
    cons: ['缺点一'],
    nameDecodeOverride: null,
    specs: { 车架: '铝合金' },
    affiliateUrl: null,
    sources: ['来源A', '来源B'],
    updatedAt: '2026-09-14',
    ...overrides,
  }
}
```

- [ ] **Step 7: 写失败测试 `tests/data/schema.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { mkBike } from '../helpers'
import { bikeSchema, loadBikes } from '../../src/lib/schema'

describe('bikeSchema', () => {
  it('接受合法车型', () => {
    expect(bikeSchema.safeParse(mkBike()).success).toBe(true)
  })
  it('拒绝未知字段(防字段拼写错误)', () => {
    expect(bikeSchema.safeParse({ ...mkBike(), prices: 3000 }).success).toBe(false)
  })
  it('拒绝身高区间倒置', () => {
    expect(bikeSchema.safeParse(mkBike({ heightRangeCm: [180, 160] })).success).toBe(false)
  })
  it('拒绝越界评级 carryScore=6', () => {
    expect(
      bikeSchema.safeParse(mkBike({ folding: { mechanism: 'x', foldedSize: 'x', carryScore: 6 } })).success,
    ).toBe(false)
  })
  it('停产车型必须带 discontinuedInfo', () => {
    expect(bikeSchema.safeParse(mkBike({ status: 'discontinued' })).success).toBe(false)
  })
  it('来源少于 2 个被拒', () => {
    expect(bikeSchema.safeParse(mkBike({ sources: ['仅一个来源'] })).success).toBe(false)
  })
})

describe('bikes.json 数据文件', () => {
  it('全量通过 schema 且 slug 唯一', () => {
    expect(() => loadBikes()).not.toThrow()
    const slugs = loadBikes().map((b) => b.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
```

- [ ] **Step 8: 跑测试确认通过(测试与实现同任务内完成,schema 错误会直接暴露)**

Run: `npm test`
Expected: 全部 PASS。若 bikes.json 种子数据校验失败,按报错修数据(不是改 schema 放宽,除非字段本身设计有误)。

- [ ] **Step 9: 构建验证**

Run: `npm run build && npm run check`
Expected: build 成功,`dist/index.html` 生成;astro check 无错误。

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: 项目脚手架 + zod 数据校验闭环(含 KAA084 种子数据)"
```

---

### Task 2: 答案类型与 URL 编解码(answers.ts / urlState.ts)

**Files:**
- Create: `src/lib/answers.ts`
- Create: `src/lib/urlState.ts`
- Modify: `tests/helpers.ts`(追加 `mkAnswers` 工厂)
- Test: `tests/unit/urlState.test.ts`

**Interfaces:**
- Consumes: 无(仅 Task 1 的目录结构)
- Produces:
  - `export type Budget / UseCase / FoldFrequency / HeightBand / Answers`(字段:`budget`、`useCase`、`fold`、`height`)
  - `BUDGET_MAX: Record<Budget, number>`、`HEIGHT_MID: Record<HeightBand, number>`(158/165/175/183)
  - `*_LABEL` 中文标签、`WIZARD_QUESTIONS` 向导题目定义(Task 10 消费)
  - `encodeAnswers(a: Answers): string`、`parseAnswers(search: string): Answers | null`、`parseIds(search: string): string[]`(Task 11/14 消费)

- [ ] **Step 1: 写 `src/lib/answers.ts`**

```ts
export const BUDGETS = ['under-2000', '2000-4000', '4000-8000', 'over-8000'] as const
export const USE_CASES = ['commute', 'sport', 'travel', 'casual'] as const
export const FOLD_FREQUENCIES = ['daily', 'occasional', 'rarely'] as const
export const HEIGHT_BANDS = ['under-160', '160-170', '170-180', 'over-180'] as const

export type Budget = (typeof BUDGETS)[number]
export type UseCase = (typeof USE_CASES)[number]
export type FoldFrequency = (typeof FOLD_FREQUENCIES)[number]
export type HeightBand = (typeof HEIGHT_BANDS)[number]

export interface Answers {
  budget: Budget
  useCase: UseCase
  fold: FoldFrequency
  height: HeightBand
}

export const BUDGET_MAX: Record<Budget, number> = {
  'under-2000': 2000,
  '2000-4000': 4000,
  '4000-8000': 8000,
  'over-8000': Number.POSITIVE_INFINITY,
}

export const HEIGHT_MID: Record<HeightBand, number> = {
  'under-160': 158,
  '160-170': 165,
  '170-180': 175,
  'over-180': 183,
}

export const BUDGET_LABEL: Record<Budget, string> = {
  'under-2000': '2000 元以内',
  '2000-4000': '2000-4000 元',
  '4000-8000': '4000-8000 元',
  'over-8000': '8000 元以上',
}
export const USE_CASE_LABEL: Record<UseCase, string> = {
  commute: '城市通勤',
  sport: '运动健身',
  travel: '旅行携车',
  casual: '休闲代步',
}
export const FOLD_LABEL: Record<FoldFrequency, string> = {
  daily: '每天都要折',
  occasional: '偶尔折',
  rarely: '基本不折',
}
export const HEIGHT_LABEL: Record<HeightBand, string> = {
  'under-160': '160cm 以下',
  '160-170': '160-170cm',
  '170-180': '170-180cm',
  'over-180': '180cm 以上',
}

export const WIZARD_QUESTIONS = [
  { key: 'budget', title: '你的预算大概是?', options: BUDGETS.map((v) => ({ value: v, label: BUDGET_LABEL[v] })) },
  { key: 'useCase', title: '主要用来做什么?', options: USE_CASES.map((v) => ({ value: v, label: USE_CASE_LABEL[v] })) },
  { key: 'fold', title: '多久折叠一次车?', options: FOLD_FREQUENCIES.map((v) => ({ value: v, label: FOLD_LABEL[v] })) },
  { key: 'height', title: '你的身高?', options: HEIGHT_BANDS.map((v) => ({ value: v, label: HEIGHT_LABEL[v] })) },
] as const
```

- [ ] **Step 2: 在 `tests/helpers.ts` 追加答案工厂**

```ts
import type { Answers } from '../src/lib/answers'

export function mkAnswers(overrides: Partial<Answers> = {}): Answers {
  return {
    budget: '2000-4000',
    useCase: 'commute',
    fold: 'daily',
    height: '170-180',
    ...overrides,
  }
}
```

- [ ] **Step 3: 写失败测试 `tests/unit/urlState.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { encodeAnswers, parseAnswers, parseIds } from '../../src/lib/urlState'
import { mkAnswers } from '../helpers'

describe('encodeAnswers / parseAnswers', () => {
  it('编解码往返一致,参数键为 b/u/f/h', () => {
    const a = mkAnswers()
    expect(encodeAnswers(a)).toBe('b=2000-4000&u=commute&f=daily&h=170-180')
    expect(parseAnswers('?' + encodeAnswers(a))).toEqual(a)
    expect(parseAnswers(encodeAnswers(a))).toEqual(a)
  })
  it('缺少任一参数返回 null', () => {
    expect(parseAnswers('b=2000-4000&u=commute&f=daily')).toBeNull()
  })
  it('枚举值非法返回 null', () => {
    expect(parseAnswers('b=9999-1&u=commute&f=daily&h=170-180')).toBeNull()
    expect(parseAnswers('b=2000-4000&u=fly&f=daily&h=170-180')).toBeNull()
  })
  it('多余参数被忽略', () => {
    expect(parseAnswers('?b=2000-4000&u=commute&f=daily&h=170-180&x=1')).toEqual(mkAnswers())
  })
  it('空串返回 null', () => {
    expect(parseAnswers('')).toBeNull()
  })
})

describe('parseIds(对比页)', () => {
  it('解析去重并截断到 3 个', () => {
    expect(parseIds('?ids=aaa,bbb,aaa,ccc,ddd')).toEqual(['aaa', 'bbb', 'ccc'])
  })
  it('无参数返回空数组', () => {
    expect(parseIds('')).toEqual([])
  })
})
```

- [ ] **Step 4: 跑测试确认失败**

Run: `npx vitest run tests/unit/urlState.test.ts`
Expected: FAIL,报错为找不到模块 `../../src/lib/urlState`。

- [ ] **Step 5: 写 `src/lib/urlState.ts`**

```ts
import {
  BUDGETS,
  FOLD_FREQUENCIES,
  HEIGHT_BANDS,
  USE_CASES,
  type Answers,
} from './answers'

const KEYS = { budget: 'b', useCase: 'u', fold: 'f', height: 'h' } as const

export function encodeAnswers(a: Answers): string {
  const p = new URLSearchParams()
  p.set(KEYS.budget, a.budget)
  p.set(KEYS.useCase, a.useCase)
  p.set(KEYS.fold, a.fold)
  p.set(KEYS.height, a.height)
  return p.toString()
}

export function parseAnswers(search: string): Answers | null {
  const p = new URLSearchParams(search)
  const budget = p.get(KEYS.budget)
  const useCase = p.get(KEYS.useCase)
  const fold = p.get(KEYS.fold)
  const height = p.get(KEYS.height)
  if (!budget || !useCase || !fold || !height) return null
  if (!BUDGETS.includes(budget as never)) return null
  if (!USE_CASES.includes(useCase as never)) return null
  if (!FOLD_FREQUENCIES.includes(fold as never)) return null
  if (!HEIGHT_BANDS.includes(height as never)) return null
  return { budget, useCase, fold, height } as Answers
}

export function parseIds(search: string): string[] {
  const raw = new URLSearchParams(search).get('ids') ?? ''
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 3)
}
```

- [ ] **Step 6: 跑测试确认通过**

Run: `npx vitest run tests/unit/urlState.test.ts`
Expected: 全部 PASS。

- [ ] **Step 7: Commit**

```bash
git add src/lib/answers.ts src/lib/urlState.ts tests/helpers.ts tests/unit/urlState.test.ts
git commit -m "feat: 向导答案类型与 URL 编解码"
```

---

### Task 3: 推荐引擎 recommend.ts

**Files:**
- Create: `src/lib/recommend.ts`
- Test: `tests/unit/recommend.test.ts`

**Interfaces:**
- Consumes: `Bike`(Task 1)、`Answers`、`BUDGET_MAX`、`HEIGHT_MID`(Task 2)
- Produces:
  - `interface Recommendation { bike: Bike; score: number }`
  - `interface RankedResult { mode: 'strict' | 'relaxed'; relaxedDimensions: Array<'budget' | 'height'>; recommendations: Recommendation[] }`
  - `recommend(answers: Answers, all: Bike[]): RankedResult`(Task 4 理由生成与 Task 11 结果页消费)

- [ ] **Step 1: 写失败测试 `tests/unit/recommend.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { recommend } from '../../src/lib/recommend'
import { mkBike, mkAnswers } from '../helpers'

describe('recommend 硬过滤', () => {
  it('过滤停产车型', () => {
    const bikes = [mkBike({ slug: 'a', status: 'discontinued', discontinuedInfo: { lastPriceCny: 2000, year: 2024 } })]
    const r = recommend(mkAnswers(), bikes)
    expect(r.recommendations).toHaveLength(0)
    expect(r.mode).toBe('relaxed')
  })
  it('价格容差:预算上限 4000 时 4400 通过、4401 被过滤', () => {
    const bikes = [
      mkBike({ slug: 'edge-ok', priceCny: 4400 }),
      mkBike({ slug: 'edge-no', priceCny: 4401 }),
    ]
    const slugs = recommend(mkAnswers(), bikes).recommendations.map((r) => r.bike.slug)
    expect(slugs).toContain('edge-ok')
    expect(slugs).not.toContain('edge-no')
  })
  it('身高:155 以下用户匹配不到下限 160 的车 → 放宽身高', () => {
    const bikes = [mkBike({ slug: 'tall-only', heightRangeCm: [160, 190], priceCny: 3000 })]
    const r = recommend(mkAnswers({ height: 'under-160' }), bikes)
    expect(r.mode).toBe('relaxed')
    expect(r.relaxedDimensions).toEqual(['height'])
    expect(r.recommendations[0].bike.slug).toBe('tall-only')
  })
  it('over-8000 预算不做价格过滤', () => {
    const bikes = [mkBike({ slug: 'lux', priceCny: 128000 })]
    const r = recommend(mkAnswers({ budget: 'over-8000' }), bikes)
    expect(r.mode).toBe('strict')
  })
})

describe('recommend 打分与排序', () => {
  it('daily 折叠场景下 carryScore 高者排前', () => {
    const bikes = [
      mkBike({ slug: 'chunky', folding: { mechanism: 'x', foldedSize: 'x', carryScore: 2 } }),
      mkBike({ slug: 'handy', folding: { mechanism: 'x', foldedSize: 'x', carryScore: 5 } }),
    ]
    const r = recommend(mkAnswers({ fold: 'daily' }), bikes)
    expect(r.recommendations[0].bike.slug).toBe('handy')
  })
  it('用途不匹配的车型得分劣势', () => {
    const bikes = [
      mkBike({ slug: 'match', useCases: ['commute'] }),
      mkBike({ slug: 'off', useCases: ['casual'], folding: { mechanism: 'x', foldedSize: 'x', carryScore: 5 } }),
    ]
    const r = recommend(mkAnswers({ fold: 'rarely' }), bikes)
    expect(r.recommendations[0].bike.slug).toBe('match')
  })
  it('同分按价格升序、再按 slug 字典序', () => {
    const bikes = [
      mkBike({ slug: 'b', priceCny: 2500 }),
      mkBike({ slug: 'a', priceCny: 2500 }),
      mkBike({ slug: 'c', priceCny: 3000 }),
    ]
    const r = recommend(mkAnswers({ fold: 'rarely' }), bikes)
    expect(r.recommendations.map((x) => x.bike.slug)).toEqual(['a', 'b', 'c'])
  })
  it('最多输出 4 款', () => {
    const bikes = Array.from({ length: 6 }, (_, i) => mkBike({ slug: 'bike-' + i }))
    expect(recommend(mkAnswers(), bikes).recommendations).toHaveLength(4)
  })
})

describe('recommend 放宽兜底', () => {
  it('身高都合适但全部超预算 → 放宽预算', () => {
    const bikes = [mkBike({ slug: 'pricey', priceCny: 9000, heightRangeCm: [150, 190] })]
    const r = recommend(mkAnswers({ height: '160-170' }), bikes)
    expect(r.mode).toBe('relaxed')
    expect(r.relaxedDimensions).toEqual(['budget'])
  })
  it('无在售车型 → 空推荐 + 双放宽标记', () => {
    const r = recommend(mkAnswers(), [])
    expect(r.mode).toBe('relaxed')
    expect(r.relaxedDimensions).toEqual(['budget', 'height'])
    expect(r.recommendations).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/recommend.test.ts`
Expected: FAIL,找不到模块 `../../src/lib/recommend`。

- [ ] **Step 3: 写 `src/lib/recommend.ts`**

```ts
import type { Bike } from './schema'
import { BUDGET_MAX, HEIGHT_MID, type Answers } from './answers'

const FOLD_W = { daily: 3, occasional: 1.5, rarely: 0.3 } as const
const CLIMB_W = { sport: 2.5, commute: 1.2, travel: 1, casual: 0.4 } as const
const TOP_N = 4

export interface Recommendation {
  bike: Bike
  score: number
}

export interface RankedResult {
  mode: 'strict' | 'relaxed'
  relaxedDimensions: Array<'budget' | 'height'>
  recommendations: Recommendation[]
}

function heightOk(bike: Bike, a: Answers): boolean {
  const [lo, hi] = bike.heightRangeCm
  const mid = HEIGHT_MID[a.height]
  return mid >= lo && mid <= hi
}

function priceOk(bike: Bike, a: Answers): boolean {
  return bike.priceCny <= BUDGET_MAX[a.budget] * 1.1
}

function scoreOf(bike: Bike, a: Answers): number {
  const useMatch = bike.useCases.includes(a.useCase) ? 10 : 0
  const carry = bike.folding.carryScore * FOLD_W[a.fold]
  const climb = bike.drivetrain.climbScore * CLIMB_W[a.useCase]
  const travelBonus = a.useCase === 'travel' ? Math.max(0, 12 - bike.weightKg) * 1.5 : 0
  return useMatch + carry + climb + travelBonus
}

function rank(pool: Bike[], a: Answers): Recommendation[] {
  return pool
    .map((bike) => ({ bike, score: scoreOf(bike, a) }))
    .sort(
      (x, y) =>
        y.score - x.score ||
        x.bike.priceCny - y.bike.priceCny ||
        x.bike.slug.localeCompare(y.bike.slug),
    )
    .slice(0, TOP_N)
}

export function recommend(answers: Answers, all: Bike[]): RankedResult {
  const active = all.filter((b) => b.status === 'active')
  const strict = active.filter((b) => priceOk(b, answers) && heightOk(b, answers))
  if (strict.length > 0) {
    return { mode: 'strict', relaxedDimensions: [], recommendations: rank(strict, answers) }
  }
  const heightOkPool = active.filter((b) => heightOk(b, answers))
  if (heightOkPool.length > 0) {
    return { mode: 'relaxed', relaxedDimensions: ['budget'], recommendations: rank(heightOkPool, answers) }
  }
  const priceOkPool = active.filter((b) => priceOk(b, answers))
  if (priceOkPool.length > 0) {
    return { mode: 'relaxed', relaxedDimensions: ['height'], recommendations: rank(priceOkPool, answers) }
  }
  return { mode: 'relaxed', relaxedDimensions: ['budget', 'height'], recommendations: rank(active, answers) }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/unit/recommend.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/lib/recommend.ts tests/unit/recommend.test.ts
git commit -m "feat: 规则推荐引擎(硬过滤+软打分+放宽兜底)"
```

---

### Task 4: 推荐理由生成 reasons.ts

**Files:**
- Create: `src/lib/reasons.ts`
- Test: `tests/unit/reasons.test.ts`

**Interfaces:**
- Consumes: `Bike`、`Answers`、`BUDGET_MAX`、`USE_CASE_LABEL`(Task 1/2)、`Recommendation`、`RankedResult`(Task 3)
- Produces:
  - `export type ReasonKind = 'match' | 'stretch' | 'relaxed'`
  - `export interface Reason { kind: ReasonKind; text: string }`
  - `reasonsFor(rec: Recommendation, answers: Answers, result: RankedResult): Reason[]`(Task 11 结果页消费)

- [ ] **Step 1: 写失败测试 `tests/unit/reasons.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { recommend, type Recommendation, type RankedResult } from '../../src/lib/recommend'
import { reasonsFor } from '../../src/lib/reasons'
import { mkBike, mkAnswers } from '../helpers'

function scenario(overrides: Parameters<typeof mkBike>[0], answers: Parameters<typeof mkAnswers>[0]) {
  const bike = mkBike(overrides)
  const result = recommend(mkAnswers(answers), [bike])
  const rec = result.recommendations[0]
  return { bike, result, rec }
}

describe('reasonsFor', () => {
  it('用途命中给出对应理由', () => {
    const { rec, result } = scenario({}, {})
    const texts = reasonsFor(rec as Recommendation, mkAnswers(), result as RankedResult).map((r) => r.text)
    expect(texts).toContain('适合城市通勤的定位')
  })
  it('daily + carryScore>=4 给出携带理由', () => {
    const { rec, result } = scenario({ folding: { mechanism: 'x', foldedSize: 'x', carryScore: 5 } }, { fold: 'daily' })
    const texts = reasonsFor(rec, mkAnswers({ fold: 'daily' }), result).map((r) => r.text)
    expect(texts).toContain('折叠紧凑,适合每天携带')
  })
  it('rarely + carryScore<=3 给出“不常折叠”理由', () => {
    const { rec, result } = scenario({ folding: { mechanism: 'x', foldedSize: 'x', carryScore: 2 } }, { fold: 'rarely' })
    const texts = reasonsFor(rec, mkAnswers({ fold: 'rarely' }), result).map((r) => r.text)
    expect(texts).toContain('不常折叠的话,这款的配置更值')
  })
  it('travel + 重量<=10kg 给出轻量理由(含具体重量)', () => {
    const { rec, result } = scenario({ weightKg: 9.4, useCases: ['travel'] }, { useCase: 'travel' })
    const texts = reasonsFor(rec, mkAnswers({ useCase: 'travel' }), result).map((r) => r.text)
    expect(texts).toContain('仅 9.4kg,拎着走不费劲')
  })
  it('strict 模式内价格落在容差区间给出 stretch 理由(含价格)', () => {
    const { rec, result } = scenario({ priceCny: 4300 }, {})
    const texts = reasonsFor(rec, mkAnswers(), result).map((r) => r.text)
    expect(texts).toContain('价格略超预算上限,参考价 4300 元')
  })
  it('relaxed 预算放宽时给出超预算理由', () => {
    const { rec, result } = scenario({ priceCny: 9000, heightRangeCm: [150, 190] }, { height: '160-170' })
    const rs = reasonsFor(rec, mkAnswers({ height: '160-170' }), result)
    expect(rs.some((r) => r.kind === 'relaxed' && r.text.includes('超出你的预算区间'))).toBe(true)
  })
  it('relaxed 身高放宽时给出试骑建议', () => {
    const bike = mkBike({ slug: 'tall', heightRangeCm: [175, 195] })
    const result = recommend(mkAnswers({ height: '160-170' }), [bike])
    const rs = reasonsFor(result.recommendations[0], mkAnswers({ height: '160-170' }), result)
    expect(rs.some((r) => r.text.includes('试骑确认'))).toBe(true)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/reasons.test.ts`
Expected: FAIL,找不到模块 `../../src/lib/reasons`。

- [ ] **Step 3: 写 `src/lib/reasons.ts`**

```ts
import type { Bike } from './schema'
import { BUDGET_MAX, type Answers } from './answers'
import type { Recommendation, RankedResult } from './recommend'

export type ReasonKind = 'match' | 'stretch' | 'relaxed'

export interface Reason {
  kind: ReasonKind
  text: string
}

const USE_HIT: Record<Answers['useCase'], string> = {
  commute: '适合城市通勤的定位',
  sport: '变速和齿比适合运动骑行',
  travel: '适合旅行携车出行',
  casual: '轻松的骑行姿态适合休闲代步',
}

export function reasonsFor(rec: Recommendation, answers: Answers, result: RankedResult): Reason[] {
  const bike: Bike = rec.bike
  const rs: Reason[] = []

  if (bike.useCases.includes(answers.useCase)) {
    rs.push({ kind: 'match', text: USE_HIT[answers.useCase] })
  }
  if (answers.fold === 'daily' && bike.folding.carryScore >= 4) {
    rs.push({ kind: 'match', text: '折叠紧凑,适合每天携带' })
  }
  if (answers.fold === 'rarely' && bike.folding.carryScore <= 3) {
    rs.push({ kind: 'match', text: '不常折叠的话,这款的配置更值' })
  }
  if ((answers.useCase === 'sport' || answers.useCase === 'commute') && bike.drivetrain.climbScore >= 4) {
    rs.push({ kind: 'match', text: '齿比范围大,爬坡不吃力' })
  }
  if (answers.useCase === 'travel' && bike.weightKg <= 10) {
    rs.push({ kind: 'match', text: `仅 ${bike.weightKg}kg,拎着走不费劲` })
  }
  if (result.mode === 'strict' && bike.priceCny > BUDGET_MAX[answers.budget]) {
    rs.push({ kind: 'stretch', text: `价格略超预算上限,参考价 ${bike.priceCny} 元` })
  }
  if (result.mode === 'relaxed' && result.relaxedDimensions.includes('budget')) {
    rs.push({ kind: 'relaxed', text: `超出你的预算区间(参考价 ${bike.priceCny} 元),其余条件都匹配` })
  }
  if (result.mode === 'relaxed' && result.relaxedDimensions.includes('height')) {
    rs.push({ kind: 'relaxed', text: '身高适配区间与你略有出入,建议试骑确认' })
  }
  return rs
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/unit/reasons.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/lib/reasons.ts tests/unit/reasons.test.ts
git commit -m "feat: 推荐理由文案生成"
```

---

### Task 5: 百科筛选 filter.ts

**Files:**
- Create: `src/lib/filter.ts`
- Test: `tests/unit/filter.test.ts`

**Interfaces:**
- Consumes: `Bike`(Task 1)、`UseCase`(Task 2)
- Produces:
  - `interface BikeFilter { wheelSize?: number; priceMin?: number; priceMax?: number; useCase?: UseCase; minSpeeds?: number }`
  - `type SortKey = 'price-asc' | 'price-desc' | 'weight-asc'`
  - `filterBikes(bikes: Bike[], f: BikeFilter): Bike[]`(只返回在售)
  - `sortBikes(bikes: Bike[], key: SortKey): Bike[]`(稳定拷贝,不改入参)

- [ ] **Step 1: 写失败测试 `tests/unit/filter.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { filterBikes, sortBikes } from '../../src/lib/filter'
import { mkBike } from '../helpers'

const bikes = [
  mkBike({ slug: 'a', wheelSize: 16, priceCny: 3500, weightKg: 9.5, useCases: ['commute'] }),
  mkBike({ slug: 'b', wheelSize: 20, priceCny: 2000, weightKg: 12, useCases: ['casual'] }),
  mkBike({ slug: 'c', wheelSize: 20, priceCny: 6000, weightKg: 10.5, useCases: ['sport'] }),
  mkBike({ slug: 'old', status: 'discontinued', discontinuedInfo: { lastPriceCny: 1800, year: 2023 } }),
]

describe('filterBikes', () => {
  it('默认只返回在售', () => {
    expect(filterBikes(bikes, {}).map((b) => b.slug)).toEqual(['a', 'b', 'c'])
  })
  it('按轮径筛选', () => {
    expect(filterBikes(bikes, { wheelSize: 20 }).map((b) => b.slug)).toEqual(['b', 'c'])
  })
  it('按价格区间筛选(闭区间)', () => {
    expect(filterBikes(bikes, { priceMin: 2000, priceMax: 3500 }).map((b) => b.slug)).toEqual(['a', 'b'])
  })
  it('按用途筛选', () => {
    expect(filterBikes(bikes, { useCase: 'sport' }).map((b) => b.slug)).toEqual(['c'])
  })
  it('按最低变速数筛选', () => {
    expect(filterBikes(bikes, { minSpeeds: 8 }).map((b) => b.slug)).toEqual(['a', 'b', 'c'])
  })
})

describe('sortBikes', () => {
  it('价格升序/降序、重量升序', () => {
    expect(sortBikes(bikes, 'price-asc').map((b) => b.slug)).toEqual(['old', 'b', 'a', 'c'])
    expect(sortBikes(bikes, 'price-desc').map((b) => b.slug)).toEqual(['c', 'a', 'b', 'old'])
    expect(sortBikes(bikes, 'weight-asc').map((b) => b.slug)).toEqual(['a', 'c', 'b', 'old'])
  })
  it('不修改入参数组', () => {
    const before = [...bikes]
    sortBikes(bikes, 'price-asc')
    expect(bikes).toEqual(before)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/filter.test.ts`
Expected: FAIL,找不到模块 `../../src/lib/filter`。

- [ ] **Step 3: 写 `src/lib/filter.ts`**

```ts
import type { Bike } from './schema'
import type { UseCase } from './answers'

export interface BikeFilter {
  wheelSize?: number
  priceMin?: number
  priceMax?: number
  useCase?: UseCase
  minSpeeds?: number
}

export type SortKey = 'price-asc' | 'price-desc' | 'weight-asc'

export function filterBikes(bikes: Bike[], f: BikeFilter): Bike[] {
  return bikes.filter(
    (b) =>
      b.status === 'active' &&
      (f.wheelSize === undefined || b.wheelSize === f.wheelSize) &&
      (f.priceMin === undefined || b.priceCny >= f.priceMin) &&
      (f.priceMax === undefined || b.priceCny <= f.priceMax) &&
      (f.useCase === undefined || b.useCases.includes(f.useCase)) &&
      (f.minSpeeds === undefined || b.drivetrain.speeds >= f.minSpeeds),
  )
}

export function sortBikes(bikes: Bike[], key: SortKey): Bike[] {
  const copy = [...bikes]
  if (key === 'price-asc') copy.sort((a, b) => a.priceCny - b.priceCny)
  if (key === 'price-desc') copy.sort((a, b) => b.priceCny - a.priceCny)
  if (key === 'weight-asc') copy.sort((a, b) => a.weightKg - b.weightKg)
  return copy
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/unit/filter.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/lib/filter.ts tests/unit/filter.test.ts
git commit -m "feat: 型号百科筛选与排序"
```

---

### Task 6: 命名解读 decode.ts

**Files:**
- Create: `src/lib/decode.ts`
- Test: `tests/unit/decode.test.ts`

**Interfaces:**
- Consumes: `Bike`、`Naming`(Task 1)
- Produces:
  - `interface DecodeSegment { index: number; char: string; meaning: string | null; note?: string }`
  - `interface DecodeResult { input: string; matched: boolean; viaNickname: string | null; slug: string | null; segments: DecodeSegment[]; suggestions: string[] }`
  - `decodeModel(rawInput: string, naming: Naming, bikes: Bike[]): DecodeResult`(Task 13 详情页构建期、Task 15 解读器岛屿消费)

- [ ] **Step 1: 写失败测试 `tests/unit/decode.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { decodeModel } from '../../src/lib/decode'
import { mkBike } from '../helpers'
import type { Naming } from '../../src/lib/schema'

const naming: Naming = {
  positions: [
    { index: 0, dimension: '系列/轮径', map: { K: '16 寸便携系列', P: '20 寸均衡系列' } },
    { index: 1, dimension: '车架/材质', map: { A: '铝合金车架' } },
    { index: 2, dimension: '配置档位', map: { A: '入门配置', B: '进阶配置' } },
  ],
  nicknames: { K3: 'kaa084', P8: 'paa013' },
  uncertain: [{ note: '数字位官方未公开统一规则' }],
}

const bikes = [
  mkBike({ slug: 'kaa084', model: 'KAA084' }),
  mkBike({ slug: 'paa013', model: 'PAA013' }),
]

describe('decodeModel', () => {
  it('精确匹配官方代码,逐位给出含义', () => {
    const r = decodeModel('KAA084', naming, bikes)
    expect(r.matched).toBe(true)
    expect(r.slug).toBe('kaa084')
    expect(r.segments.map((s) => s.meaning)).toEqual(['16 寸便携系列', '铝合金车架', '入门配置', null, null, null])
  })
  it('市场俗称映射到官方型号', () => {
    const r = decodeModel('K3', naming, bikes)
    expect(r.matched).toBe(true)
    expect(r.viaNickname).toBe('K3')
    expect(r.slug).toBe('kaa084')
    expect(r.segments[0].char).toBe('K')
  })
  it('输入小写/带空格自动归一', () => {
    const r = decodeModel(' kaa084 ', naming, bikes)
    expect(r.matched).toBe(true)
  })
  it('未知输入且无相近项:suggestions 为空', () => {
    const r = decodeModel('ZZZZZZZZ', naming, bikes)
    expect(r.matched).toBe(false)
    expect(r.suggestions).toEqual([])
  })
  it('拼写相近给建议(编辑距离<=2)', () => {
    const r = decodeModel('KKA084', naming, bikes)
    expect(r.matched).toBe(false)
    expect(r.suggestions).toContain('KAA084')
  })
  it('规则缺失的位 meaning 为 null 并附 note', () => {
    const r = decodeModel('KAA084', naming, bikes)
    expect(r.segments[3].meaning).toBeNull()
    expect(r.segments[3].note).toContain('官方未公开')
  })
  it('nameDecodeOverride 优先于规则表', () => {
    const override = [
      { char: 'K', meaning: 'K 系列(特别版编号)' },
      { char: '0', meaning: '2020 年款' },
    ]
    const withOverride = [...bikes, mkBike({ slug: 'k-sp', model: 'KAA084', nameDecodeOverride: override })]
    const r = decodeModel('KAA084', naming, withOverride)
    expect(r.slug).toBe('kaa084')
    expect(r.segments[0].meaning).toBe('16 寸便携系列')
    const r2 = decodeModel('KAA084', naming, [
      mkBike({ slug: 'k-sp', model: 'KAA084', nameDecodeOverride: override }),
      ...bikes,
    ])
    expect(r2.slug).toBe('k-sp')
    expect(r2.segments[0].meaning).toBe('K 系列(特别版编号)')
    expect(r2.segments[3].meaning).toBe('2020 年款')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/decode.test.ts`
Expected: FAIL,找不到模块 `../../src/lib/decode`。

- [ ] **Step 3: 写 `src/lib/decode.ts`**

```ts
import type { Bike, Naming } from './schema'

export interface DecodeSegment {
  index: number
  char: string
  meaning: string | null
  note?: string
}

export interface DecodeResult {
  input: string
  matched: boolean
  viaNickname: string | null
  slug: string | null
  segments: DecodeSegment[]
  suggestions: string[]
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[n]
}

function resolveModel(
  input: string,
  naming: Naming,
  bikes: Bike[],
): { code: string; slug: string; viaNickname: string | null } | null {
  const direct = bikes.find((b) => b.model === input)
  if (direct) return { code: direct.model, slug: direct.slug, viaNickname: null }
  const nickSlug = naming.nicknames[input]
  if (nickSlug) {
    const b = bikes.find((x) => x.slug === nickSlug)
    if (b) return { code: b.model, slug: b.slug, viaNickname: input }
  }
  return null
}

export function decodeModel(rawInput: string, naming: Naming, bikes: Bike[]): DecodeResult {
  const input = rawInput.trim().toUpperCase()
  const resolved = resolveModel(input, naming, bikes)
  if (!resolved) {
    const known = [...bikes.map((b) => b.model), ...Object.keys(naming.nicknames)]
    const suggestions = [...new Set(known.filter((k) => levenshtein(input, k) <= 2))]
      .sort((a, b) => levenshtein(input, a) - levenshtein(input, b))
      .slice(0, 3)
    return { input: rawInput, matched: false, viaNickname: null, slug: null, segments: [], suggestions }
  }
  const bike = bikes.find((b) => b.slug === resolved.slug)
  const override = bike?.nameDecodeOverride ?? null
  const segments: DecodeSegment[] = resolved.code.split('').map((char, index) => {
    if (override) {
      const hit = override.find((o) => o.char === char)
      if (hit) return { index, char, meaning: hit.meaning }
    }
    const pos = naming.positions.find((p) => p.index === index)
    const meaning = pos && pos.map[char] ? pos.map[char] : null
    if (meaning === null) return { index, char, meaning, note: '未识别(官方未公开统一规则)' }
    return { index, char, meaning }
  })
  return { input: rawInput, matched: true, viaNickname: resolved.viaNickname, slug: resolved.slug, segments, suggestions: [] }
}
```

> 注:同 code 多车型(如同名特别版)时 `resolveModel` 取数组中第一个匹配;override 测试已覆盖该行为按 bikes 顺序优先。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/unit/decode.test.ts`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/lib/decode.ts tests/unit/decode.test.ts
git commit -m "feat: 型号命名解读(规则表+俗称+模糊建议)"
```

---

### Task 7: 完整车型数据收集(≥30 款在售)

**Files:**
- Modify: `src/data/bikes.json`(扩充到全量)
- Create: `docs/data-sources.md`(逐车型来源台账)
- Test: `tests/data/collection.test.ts`

**Interfaces:**
- Consumes: `bikeSchema`、`loadBikes`(Task 1)、carryScore/climbScore 评级规则(Task 1 Step 4)
- Produces: 全量在售数据集(≥30 款),后续页面任务的构建输入

这是一个**检索+考证任务**,没有代码实现,验收门是数据测试。不使用臆造数据:每个字段要么有来源,要么保守估计并在台账注明依据。

- [ ] **Step 1: 写失败测试 `tests/data/collection.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { loadBikes } from '../../src/lib/schema'

describe('数据集完整性', () => {
  it('在售车型不少于 30 款', () => {
    expect(loadBikes().filter((b) => b.status === 'active').length).toBeGreaterThanOrEqual(30)
  })
  it('官方代码唯一', () => {
    const models = loadBikes().map((b) => b.model)
    expect(new Set(models).size).toBe(models.length)
  })
  it('全部车型有价格更新日期且在合理范围', () => {
    for (const b of loadBikes()) {
      expect(b.priceCny).toBeGreaterThan(500)
      expect(b.priceUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
```

Run: `npx vitest run tests/data/collection.test.ts`
Expected: FAIL(当前只有 1 款,数量断言不过)。

- [ ] **Step 2: 检索收集车型清单**

用 WebSearch/WebFetch 从以下来源获取**国内在售**型号清单(以官网产品列表为主干,京东/天猫旗舰店的在售列表补充):

1. 大行官网产品页(dahon.com / dahon.com.cn 的产品/车型列表)
2. 京东"DAHON 大行"官方旗舰店/自营分类页
3. 天猫大行旗舰店
4. 评测/导购文章(自行车在线、美骑网等)用于校准系列定位与俗称

覆盖要求:16 寸(K 系列)、20 寸(P/D/Y/A 系列等)、其他在售轮径,入门到高端价格带都要有;预计 30-60 款。**收录判据:官网在列或官方电商旗舰店在售**;仅第三方店铺有售的老库存不收。

- [ ] **Step 3: 逐款考证并写入 bikes.json**

每款按 Task 1 Step 4 的 JSON 模板填写(字段说明与评级规则同 Task 1):

- 价格:官网价 + 电商旗舰店价交叉(取官方渠道常见价,取整);差异大时取官网价并台账注明
- 参数(重量/变速/折叠尺寸/材质):以官网为准;官网缺失用电商详情页,台账注明来源
- `heightRangeCm`:官网标注优先;无标注时按轮径+车架类型给保守区间(如 20 寸标准架 [150, 190],16 寸小架 [150, 180])并台账注明"推算"
- `useCases`/`pros`/`cons`/`highlights`:基于定位写人话,每款至少 1 亮点、2 优点、1 缺点(缺点必须真实,如"变速档位少,陡坡吃力")
- `sources`:至少 2 项,含 URL

- [ ] **Step 4: 建来源台账 `docs/data-sources.md`**

每款一行:slug | 官方代码 | 俗称 | 价格来源 URL ×2 | 参数来源 | 身高推算与否 | 评级依据备注。这份台账是后续数据更新的依据。

- [ ] **Step 5: 跑数据校验测试确认通过**

Run: `npm run validate`
Expected: schema/collection 全部 PASS(数量 ≥30、代码唯一、全字段合法)。

- [ ] **Step 6: Commit**

```bash
git add src/data/bikes.json docs/data-sources.md tests/data/collection.test.ts
git commit -m "feat: 收录国内在售大行车型数据(N 款,含来源台账)"
```

(提交信息里的 N 替换为实际数量。)

---

### Task 8: 命名规则考证 naming.json

**Files:**
- Modify: `src/data/naming.json`(真实规则)
- Test: `tests/data/naming.test.ts`

**Interfaces:**
- Consumes: `namingSchema`、`loadNaming`、`loadBikes`(Task 1)、`decodeModel`(Task 6)、数据集(Task 7)
- Produces: 真实命名规则表(Task 13 详情页、Task 15 解读器与长文页消费)

同样是检索+考证任务。**准确性是生命线**:查证不到的位次必须放 `uncertain`,不得臆造。

- [ ] **Step 1: 写失败测试 `tests/data/naming.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { loadBikes, loadNaming } from '../../src/lib/schema'
import { decodeModel } from '../../src/lib/decode'

describe('naming.json 规则表', () => {
  const naming = loadNaming()
  const bikes = loadBikes()

  it('全部在售车型的官方代码可被解读(字母位无 null,数字位或例外必须有覆盖)', () => {
    for (const b of bikes) {
      const r = decodeModel(b.model, naming, bikes)
    expect(r.matched).toBe(true)
      const nullLetters = r.segments.filter((s) => s.meaning === null && /[A-Z]/.test(s.char))
      expect(nullLetters, `${b.model} 存在未解读的字母位`).toHaveLength(0)
    }
  })
  it('俗称映射指向存在的 slug', () => {
    const slugs = new Set(bikes.map((b) => b.slug))
    for (const slug of Object.values(naming.nicknames)) {
      expect(slugs.has(slug), `nickname 指向不存在的 slug: ${slug}`).toBe(true)
    }
  })
  it('常见俗称已收录(K3/P8/D8 至少其二)', () => {
    const known = Object.keys(naming.nicknames)
    expect(['K3', 'P8', 'D8'].filter((k) => known.includes(k)).length).toBeGreaterThanOrEqual(2)
  })
})
```

Run: `npx vitest run tests/data/naming.test.ts`
Expected: FAIL(当前 naming.json 是占位结构)。

- [ ] **Step 2: 检索考证命名规则**

用 WebSearch/WebFetch 考证大行官方代码命名规则(如 KAA084、PAA013 的每一位含义)。来源优先级:大行官方说明(官网/官方公众号/产品手册)> 权威媒体评测 > 资深玩家社区(仅作旁证,需两个独立来源一致才收录)。

写入 `src/data/naming.json`:

- `positions`:逐位规则。大行常见结构为"字母位(系列/车架/配置)+ 数字位(型号编号)"——以实际考证为准,数字位若无公开规则,不放进 positions 的 map,自然落 `uncertain` 逻辑
- `nicknames`:K3、P8、D8、S18 等市场俗称 → slug 映射,覆盖数据集中有俗称的每一款
- `uncertain`:每一位"官方未公开/存在地区差异"的说明,展示给用户看

若某车型代码不符合通用规则(例外),在该车型的 `nameDecodeOverride` 字段手工覆盖(Task 6 已支持)。

- [ ] **Step 3: 跑校验测试确认通过**

Run: `npm run validate && npm test`
Expected: 全部 PASS(含 Task 7 的数据测试不回归)。

- [ ] **Step 4: Commit**

```bash
git add src/data/naming.json src/data/bikes.json tests/data/naming.test.ts
git commit -m "feat: 大行命名规则表与俗称映射(考证版)"
```

---

### Task 9: 视觉系统与全局布局完善

**Files:**
- Modify: `src/styles/tokens.css`(扩充)、`src/styles/global.css`(完整)
- Modify: `src/layouts/Base.astro`(导航 + noscript + 页脚)
- Test: `npm run build` + 人眼验收(dev server)

**Interfaces:**
- Consumes: 无新接口
- Produces: 全站 CSS 类名约定(`.card` `.chip` `.option-btn` `.btn` `.btn-ghost` `.seg` `.seg-list` `.alias` `.price` `.empty` `.hero` `.page` `.site-nav` 等),后续 Vue 岛屿与 Astro 页面直接使用,不得另起类名体系

样式任务无 TDD 循环,验收 = build 通过 + 关键页面 375 宽度人眼检查无破版。视觉方向(spec §6.4):编辑杂志感、数据为主角、衬线标题 + 无衬线正文、克制的绿色强调色。如执行环境可用 `frontend-design` 技能,可先调用获取参考,但下面给出的 tokens 与类名是**底线契约**,不得更改类名。

- [ ] **Step 1: 扩充 `src/styles/tokens.css`**

```css
:root {
  --color-bg: oklch(97.5% 0.005 95);
  --color-surface: oklch(100% 0 0);
  --color-ink: oklch(22% 0.02 250);
  --color-ink-soft: oklch(46% 0.02 250);
  --color-accent: oklch(52% 0.14 150);
  --color-accent-ink: oklch(98% 0.01 150);
  --color-accent-soft: oklch(94% 0.03 150);
  --color-warn-soft: oklch(95% 0.04 80);
  --color-line: oklch(88% 0.01 250);
  --text-base: clamp(1rem, 0.95rem + 0.3vw, 1.0625rem);
  --text-small: 0.875rem;
  --text-h1: clamp(1.75rem, 1.2rem + 2.5vw, 2.75rem);
  --text-h2: clamp(1.375rem, 1.1rem + 1.2vw, 1.75rem);
  --text-h3: 1.125rem;
  --space-block: clamp(1.5rem, 1.2rem + 1.5vw, 3rem);
  --space-inline: 1rem;
  --space-gutter: clamp(1rem, 0.8rem + 1.5vw, 2rem);
  --radius-card: 14px;
  --radius-pill: 999px;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --font-serif: 'Songti SC', 'Noto Serif SC', serif;
  --font-sans: system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
```

- [ ] **Step 2: 写完整 `src/styles/global.css`**

```css
@import './tokens.css';

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.65;
}

h1, h2, h3 { font-family: var(--font-serif); line-height: 1.25; margin: 0 0 0.5em; }
h1 { font-size: var(--text-h1); }
h2 { font-size: var(--text-h2); }
h3 { font-size: var(--text-h3); }
p { margin: 0 0 1em; }
a { color: var(--color-accent); text-underline-offset: 3px; }
a:hover { text-decoration: underline; }

:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; border-radius: 4px; }

.page { max-width: 44rem; margin: 0 auto; padding: var(--space-block) var(--space-gutter); }

.site-nav {
  display: flex; gap: var(--space-inline); align-items: baseline;
  max-width: 44rem; margin: 0 auto; padding: 1rem var(--space-gutter) 0;
  font-family: var(--font-serif); font-weight: 600;
}
.site-nav .brand { font-size: 1.05rem; color: var(--color-ink); text-decoration: none; }
.site-nav a:not(.brand) { color: var(--color-ink-soft); text-decoration: none; font-size: var(--text-small); }
.site-nav a:not(.brand):hover { color: var(--color-accent); text-decoration: underline; }

.hero h1 { margin-top: clamp(2rem, 10vw, 4rem); }
.hero p { color: var(--color-ink-soft); font-size: 1.05rem; }

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  padding: 1.25rem;
  margin-block-end: 1rem;
  transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
}
.card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px oklch(0% 0 0 / 0.06); }

.alias { color: var(--color-ink-soft); font-size: 0.85em; font-weight: 400; margin-inline-start: 0.5em; }
.price { font-variant-numeric: tabular-nums; font-weight: 600; }
.price small { color: var(--color-ink-soft); font-weight: 400; font-size: var(--text-small); }

.btn {
  appearance: none; border: 0; cursor: pointer;
  background: var(--color-accent); color: var(--color-accent-ink);
  border-radius: var(--radius-pill); padding: 0.65em 1.4em; font-size: 1rem;
  transition: transform var(--duration-fast) var(--ease-out);
}
.btn:hover { transform: translateY(-1px); }
.btn-ghost {
  appearance: none; cursor: pointer; background: transparent; color: var(--color-ink-soft);
  border: 1px solid var(--color-line); border-radius: var(--radius-pill); padding: 0.5em 1.2em;
}
.btn-ghost:hover { color: var(--color-ink); border-color: var(--color-ink-soft); }

.options { display: grid; gap: 0.75rem; margin-block: 1rem; }
.option-btn {
  appearance: none; cursor: pointer; text-align: left;
  background: var(--color-surface); color: var(--color-ink);
  border: 1.5px solid var(--color-line); border-radius: var(--radius-card);
  padding: 0.9em 1.1em; font-size: 1.05rem;
  transition: border-color var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out);
}
.option-btn:hover { border-color: var(--color-accent); transform: translateX(4px); }

.chip {
  display: inline-block; background: var(--color-accent-soft); color: var(--color-ink);
  border-radius: var(--radius-pill); padding: 0.25em 0.9em; margin: 0 0.4em 0.4em 0;
  font-size: var(--text-small);
}
.chip-stretch { background: var(--color-warn-soft); }
.chip-relaxed { background: var(--color-warn-soft); }

.seg-list { display: flex; flex-wrap: wrap; gap: 0.6rem; padding: 0; margin: 1rem 0; list-style: none; }
.seg {
  display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
  background: var(--color-surface); border: 1px solid var(--color-line); border-radius: 10px;
  padding: 0.6rem 0.8rem; min-width: 4.5rem;
}
.seg-char { font-family: var(--font-serif); font-size: 1.4rem; font-weight: 700; color: var(--color-accent); }
.seg-meaning { font-size: 0.75rem; color: var(--color-ink-soft); text-align: center; }

.empty { color: var(--color-ink-soft); background: var(--color-warn-soft); border-radius: var(--radius-card); padding: 1rem; }

.site-footer {
  max-width: 44rem; margin: 3rem auto 0; padding: 1.5rem var(--space-gutter);
  border-top: 1px solid var(--color-line); color: var(--color-ink-soft); font-size: var(--text-small);
}

.noscript-note { background: var(--color-warn-soft); padding: 0.75rem var(--space-gutter); text-align: center; }

dl.specs { display: grid; grid-template-columns: 1fr; gap: 0.5rem; }
dl.specs > div { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px dashed var(--color-line); padding-block: 0.4rem; }
dl.specs dt { color: var(--color-ink-soft); }
dl.specs dd { margin: 0; text-align: right; }

table.compare-table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
table.compare-table th, table.compare-table td { padding: 0.6rem 0.5rem; border-bottom: 1px solid var(--color-line); text-align: left; vertical-align: top; }
table.compare-table tr.diff th, table.compare-table tr.diff td { background: var(--color-accent-soft); }

select, input {
  font: inherit; color: inherit; background: var(--color-surface);
  border: 1px solid var(--color-line); border-radius: 8px; padding: 0.5em 0.7em;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

- [ ] **Step 3: 完善 `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css'
interface Props { title: string; description?: string }
const { title, description = '4 个问题,帮你选到合适的大行折叠车。' } = Astro.props
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <noscript><p class="noscript-note">本页部分功能需要 JavaScript;型号百科与详情页可直接浏览。</p></noscript>
    <nav class="site-nav" aria-label="主导航">
      <a class="brand" href="/">大行选购器</a>
      <a href="/bikes">型号百科</a>
      <a href="/decode">型号名解读</a>
    </nav>
    <main class="page">
      <slot />
    </main>
    <footer class="site-footer">
      <p>价格仅供参考,以实际渠道为准。各车型页面标注数据来源与更新日期。</p>
    </footer>
  </body>
</html>
```

- [ ] **Step 4: 验收**

Run: `npm run build && npm run dev`,浏览器(或让执行者用 Playwright MCP/chrome-devtools)打开 `http://localhost:4321/`,确认:导航可见、375 宽度无横向滚动、noscript 提示在禁 JS 时不破坏布局(可用 devtools 一眼确认即可)。

- [ ] **Step 5: Commit**

```bash
git add src/styles src/layouts
git commit -m "feat: 全站视觉系统(编辑杂志感 tokens 与组件类)"
```

---

### Task 10: 向导岛屿 WizardFlow.vue + 首页

**Files:**
- Create: `src/components/WizardFlow.vue`
- Modify: `src/pages/index.astro`(挂载岛屿 + 次级入口)
- Test: `tests/unit/WizardFlow.test.ts`

**Interfaces:**
- Consumes: `WIZARD_QUESTIONS`、`Answers`(Task 2)、`encodeAnswers`(Task 2)、`Bike`(Task 1)
- Produces:
  - `WizardFlow` 组件,props:`{ mode: 'quiz' | 'result'; bikes?: Bike[] }`(Task 11 在 /result 页以 `mode="result"` 复用)
  - 模板约定:选项按钮类名 `option-btn`,进度 `<progress>`

- [ ] **Step 1: 写失败测试 `tests/unit/WizardFlow.test.ts`**

```ts
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WizardFlow from '../../src/components/WizardFlow.vue'

const assign = vi.fn()
const replace = vi.fn()

describe('WizardFlow(quiz 模式)', () => {
  beforeEach(() => {
    assign.mockClear()
    replace.mockClear()
    vi.stubGlobal('location', { assign, replace, search: '', pathname: '/' })
  })

  it('逐题作答,答完第 4 题跳转 /result 并携带编码参数', async () => {
    const w = mount(WizardFlow, { props: { mode: 'quiz' } })
    const labels = ['2000-4000 元', '城市通勤', '每天都要折', '170-180cm']
    for (const label of labels) {
      const btn = w.findAll('button.option-btn').find((b) => b.text() === label)
      expect(btn, `找不到选项按钮:${label}`).toBeTruthy()
      await btn!.trigger('click')
    }
    expect(assign).toHaveBeenCalledWith('/result?b=2000-4000&u=commute&f=daily&h=170-180')
  })

  it('支持返回上一题', async () => {
    const w = mount(WizardFlow, { props: { mode: 'quiz' } })
    await w.findAll('button.option-btn')[0].trigger('click')
    expect(w.text()).toContain('主要用来做什么?')
    await w.find('button.btn-ghost').trigger('click')
    expect(w.text()).toContain('你的预算大概是?')
  })

  it('进度条随步骤前进', async () => {
    const w = mount(WizardFlow, { props: { mode: 'quiz' } })
    const progress = () => w.find('progress').element as HTMLProgressElement
    expect(Number(progress().value)).toBe(0)
    await w.findAll('button.option-btn')[0].trigger('click')
    expect(Number(progress().value)).toBe(1)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/WizardFlow.test.ts`
Expected: FAIL,找不到组件 `WizardFlow.vue`。

- [ ] **Step 3: 写 `src/components/WizardFlow.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { WIZARD_QUESTIONS, type Answers } from '../lib/answers'
import { encodeAnswers, parseAnswers } from '../lib/urlState'
import { recommend, type RankedResult } from '../lib/recommend'
import type { Bike } from '../lib/schema'
import ResultView from './ResultView.vue'

const props = withDefaults(defineProps<{ mode: 'quiz' | 'result'; bikes?: Bike[] }>(), {
  bikes: () => [],
})

const step = ref(0)
const partial = ref<Partial<Answers>>({})
const current = computed(() => WIZARD_QUESTIONS[step.value])

const answers = ref<Answers | null>(null)
const result = ref<RankedResult | null>(null)

onMounted(() => {
  if (props.mode !== 'result') return
  const parsed = parseAnswers(window.location.search)
  if (!parsed) {
    window.location.replace('/')
    return
  }
  answers.value = parsed
  result.value = recommend(parsed, props.bikes)
})

function choose(key: keyof Answers, value: string) {
  partial.value = { ...partial.value, [key]: value }
  if (step.value < WIZARD_QUESTIONS.length - 1) {
    step.value += 1
  } else {
    window.location.assign('/result?' + encodeAnswers({ ...partial.value } as Answers))
  }
}

function back() {
  if (step.value > 0) step.value -= 1
}
</script>

<template>
  <ResultView
    v-if="mode === 'result' && result && answers"
    :result="result"
    :answers="answers"
    @restart="() => window.location.assign('/')"
  />
  <p v-else-if="mode === 'result'" class="empty">正在生成推荐…</p>
  <div v-else class="wizard">
    <progress :value="step" :max="WIZARD_QUESTIONS.length" aria-label="答题进度" />
    <h2>{{ current.title }}</h2>
    <div class="options">
      <button
        v-for="opt in current.options"
        :key="opt.value"
        class="option-btn"
        type="button"
        @click="choose(current.key, opt.value)"
      >{{ opt.label }}</button>
    </div>
    <button v-if="step > 0" class="btn-ghost" type="button" @click="back">上一题</button>
  </div>
</template>
```

> `ResultView` 在 Task 11 创建;本任务先创建一个**最小占位版本**让本任务可编译测试,内容为:

```vue
<!-- src/components/ResultView.vue(本任务先建占位,Task 11 实现) -->
<script setup lang="ts">
defineProps<{ result: unknown; answers: unknown }>()
</script>
<template>
  <section class="result"><h1>推荐结果(Task 11 实现)</h1></section>
</template>
```

- [ ] **Step 4: 更新 `src/pages/index.astro` 挂载岛屿**

```astro
---
import Base from '../layouts/Base.astro'
import WizardFlow from '../components/WizardFlow.vue'
---
<Base title="大行折叠车选购器 · 4 个问题找到适合你的车">
  <section class="hero">
    <h1>大行折叠车,选哪款?</h1>
    <p>4 个问题,30 秒,给你 2-4 款具体型号和推荐理由。</p>
  </section>
  <WizardFlow client:load mode="quiz" />
  <section class="secondary-entries">
    <p><a href="/bikes">浏览全部型号 →</a></p>
    <p><a href="/decode">看不懂型号名?30 秒入门 →</a></p>
  </section>
</Base>
```

(/bikes、/decode 分别在 Task 12/15 落地,期间链接暂时 404 属预期,Task 16 E2E 前全部可用。)

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run tests/unit/WizardFlow.test.ts`
Expected: 全部 PASS。

- [ ] **Step 6: 构建验证 + Commit**

Run: `npm run build`
Expected: 成功。

```bash
git add src/components/WizardFlow.vue src/components/ResultView.vue src/pages/index.astro tests/unit/WizardFlow.test.ts
git commit -m "feat: 4 题选购向导岛屿与首页"
```

---

### Task 11: 结果页 /result + ResultView

**Files:**
- Create: `src/pages/result.astro`
- Modify: `src/components/ResultView.vue`(替换占位实现)
- Test: `tests/unit/ResultView.test.ts`、`tests/unit/resultPage.test.ts`(URL 校验路径)

**Interfaces:**
- Consumes: `recommend`、`RankedResult`、`Recommendation`(Task 3)、`reasonsFor`、`Reason`(Task 4)、`parseAnswers`(Task 2)、`WizardFlow`(Task 10)、`loadBikes`(Task 1)、`USE_CASE_LABEL`/`FOLD_LABEL`/`HEIGHT_LABEL`/`BUDGET_LABEL`(Task 2)
- Produces: `/result` 页面;`ResultView` props `{ result: RankedResult; answers: Answers }`、emit `restart`

- [ ] **Step 1: 写失败测试 `tests/unit/ResultView.test.ts`**

```ts
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultView from '../../src/components/ResultView.vue'
import { recommend } from '../../src/lib/recommend'
import { mkBike, mkAnswers } from '../helpers'

function mountedWith(bikes: Parameters<typeof recommend>[1], answers: Parameters<typeof recommend>[0]) {
  const result = recommend(answers, bikes)
  return mount(ResultView, { props: { result, answers } })
}

describe('ResultView', () => {
  const bikes = [
    mkBike({ slug: 'handy-16', model: 'KAA084', marketingName: 'K3', priceCny: 3500 }),
    mkBike({ slug: 'solid-20', model: 'PAA013', marketingName: 'P8', priceCny: 2800 }),
  ]

  it('渲染每款推荐的官方代码与俗称', () => {
    const w = mountedWith(bikes, mkAnswers())
    expect(w.text()).toContain('KAA084')
    expect(w.text()).toContain('K3')
    expect(w.text()).toContain('PAA013')
  })
  it('渲染理由 chip(用途命中)', () => {
    const w = mountedWith(bikes, mkAnswers())
    expect(w.text()).toContain('适合城市通勤的定位')
  })
  it('渲染参考价与更新年月', () => {
    const w = mountedWith(bikes, mkAnswers())
    expect(w.text()).toContain('¥3500')
    expect(w.text()).toContain('2026-09')
  })
  it('每款有详情与对比链接', () => {
    const w = mountedWith(bikes, mkAnswers())
    const hrefs = w.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/bikes/handy-16')
    expect(hrefs).toContain('/compare?ids=handy-16')
  })
  it('relaxed 模式显示放宽说明', () => {
    const pricey = [mkBike({ slug: 'rich', priceCny: 12000, heightRangeCm: [150, 195] })]
    const w = mountedWith(pricey, mkAnswers({ height: '160-170' }))
    expect(w.text()).toContain('完全匹配的组合暂时没有')
    expect(w.text()).toContain('价格超出了你的预算')
  })
  it('空推荐时显示兜底文案', () => {
    const w = mountedWith([], mkAnswers())
    expect(w.text()).toContain('暂时没有可推荐的车型')
  })
  it('点击重新答题触发 restart', async () => {
    const w = mountedWith(bikes, mkAnswers())
    await w.find('button.btn-ghost').trigger('click')
    expect(w.emitted('restart')).toHaveLength(1)
  })
})
```

再写 `tests/unit/resultPage.test.ts`(result 模式的 URL 分支,挂 WizardFlow):

```ts
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WizardFlow from '../../src/components/WizardFlow.vue'
import { mkBike, mkAnswers } from '../helpers'
import { encodeAnswers } from '../../src/lib/urlState'

const assign = vi.fn()
const replace = vi.fn()

describe('WizardFlow(result 模式)', () => {
  beforeEach(() => {
    assign.mockClear()
    replace.mockClear()
  })

  it('合法参数:渲染推荐结果', async () => {
    const search = '?' + encodeAnswers(mkAnswers())
    vi.stubGlobal('location', { assign, replace, search, pathname: '/result' })
    const w = mount(WizardFlow, { props: { mode: 'result', bikes: [mkBike()] } })
    await new Promise((r) => setTimeout(r))
    expect(w.text()).toContain('推荐')
  })
  it('非法参数:重定向回首页', async () => {
    vi.stubGlobal('location', { assign, replace, search: '?b=xxx', pathname: '/result' })
    mount(WizardFlow, { props: { mode: 'result', bikes: [mkBike()] } })
    await new Promise((r) => setTimeout(r))
    expect(replace).toHaveBeenCalledWith('/')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/ResultView.test.ts tests/unit/resultPage.test.ts`
Expected: FAIL(占位 ResultView 无对应渲染;result 模式分支未实现)。

- [ ] **Step 3: 实现 `src/components/ResultView.vue`(替换占位)**

```vue
<script setup lang="ts">
import { BUDGET_LABEL, FOLD_LABEL, HEIGHT_LABEL, USE_CASE_LABEL, type Answers } from '../lib/answers'
import type { RankedResult, Recommendation } from '../lib/recommend'
import { reasonsFor, type Reason } from '../lib/reasons'

const props = defineProps<{ result: RankedResult; answers: Answers }>()
const emit = defineEmits<{ restart: [] }>()

function reasons(rec: Recommendation): Reason[] {
  return reasonsFor(rec, props.answers, props.result)
}
</script>

<template>
  <section class="result">
    <h1>根据你的情况,推荐这几款</h1>
    <p class="summary">
      {{ BUDGET_LABEL[answers.budget] }} · {{ USE_CASE_LABEL[answers.useCase] }} ·
      {{ HEIGHT_LABEL[answers.height] }} · 折叠:{{ FOLD_LABEL[answers.fold] }}
    </p>
    <p v-if="result.mode === 'relaxed'" class="empty">
      完全匹配的组合暂时没有,以下是最接近的:
      {{ result.relaxedDimensions.includes('budget') ? '价格超出了你的预算;' : '' }}
      {{ result.relaxedDimensions.includes('height') ? '身高适配略有出入。' : '' }}
    </p>
    <ol class="rec-list" v-if="result.recommendations.length">
      <li v-for="rec in result.recommendations" :key="rec.bike.slug" class="card rec-card">
        <div class="rec-head">
          <h2>
            {{ rec.bike.model }}<span class="alias">{{ rec.bike.marketingName }}</span>
          </h2>
          <p class="price">
            参考价 ¥{{ rec.bike.priceCny }}
            <small>· 更新于 {{ rec.bike.priceUpdatedAt.slice(0, 7) }}</small>
          </p>
        </div>
        <ul class="reasons">
          <li v-for="(r, i) in reasons(rec)" :key="i" :class="['chip', `chip-${r.kind}`]">{{ r.text }}</li>
        </ul>
        <p class="rec-actions">
          <a :href="`/bikes/${rec.bike.slug}`">看详情 →</a>
          <a :href="`/compare?ids=${rec.bike.slug}`">加入对比 →</a>
        </p>
      </li>
    </ol>
    <p v-else class="empty">暂时没有可推荐的车型,去 <a href="/bikes">型号百科</a> 看看全部。</p>
    <button class="btn-ghost" type="button" @click="emit('restart')">重新答题</button>
  </section>
</template>
```

- [ ] **Step 4: 写 `src/pages/result.astro`**

```astro
---
import Base from '../layouts/Base.astro'
import WizardFlow from '../components/WizardFlow.vue'
import { loadBikes } from '../lib/schema'
const bikes = loadBikes()
---
<Base title="为你推荐 · 大行选购器">
  <WizardFlow client:load mode="result" :bikes="bikes" />
</Base>
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run tests/unit/ResultView.test.ts tests/unit/resultPage.test.ts`
Expected: 全部 PASS。

- [ ] **Step 6: 构建验证 + Commit**

Run: `npm run build`
Expected: 成功,`dist/result/index.html` 生成。

```bash
git add src/pages/result.astro src/components/ResultView.vue tests/unit/ResultView.test.ts tests/unit/resultPage.test.ts
git commit -m "feat: 结果页(推荐卡片+理由 chip+放宽说明+URL 分享)"
```

---

### Task 12: 型号百科 /bikes + BikeTable 岛屿

**Files:**
- Create: `src/pages/bikes/index.astro`
- Create: `src/components/BikeTable.vue`
- Test: `tests/unit/BikeTable.test.ts`

**Interfaces:**
- Consumes: `loadBikes`(Task 1)、`filterBikes`、`sortBikes`、`BikeFilter`、`SortKey`(Task 5)、`USE_CASES`、`USE_CASE_LABEL`(Task 2)
- Produces: `/bikes` 页面;列表项类名 `bike-list`、计数类名 `count`

- [ ] **Step 1: 写失败测试 `tests/unit/BikeTable.test.ts`**

```ts
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BikeTable from '../../src/components/BikeTable.vue'
import { mkBike } from '../helpers'

const bikes = [
  mkBike({ slug: 'k16', model: 'KAA084', marketingName: 'K3', wheelSize: 16, priceCny: 3500 }),
  mkBike({ slug: 'p20', model: 'PAA013', marketingName: 'P8', wheelSize: 20, priceCny: 2800 }),
  mkBike({ slug: 'd20', model: 'DAA063', marketingName: 'D8', wheelSize: 20, priceCny: 2200, useCases: ['casual'] }),
]

describe('BikeTable', () => {
  it('默认列出全部在售,默认价格升序', () => {
    const w = mount(BikeTable, { props: { bikes } })
    expect(w.findAll('.bike-list li')).toHaveLength(3)
    expect(w.text()).toContain('共 3 款')
    expect(w.findAll('.bike-list h2')[0].text()).toContain('DAA063')
  })
  it('轮径选项从数据推导并按选择过滤', async () => {
    const w = mount(BikeTable, { props: { bikes } })
    const wheelSelect = w.findAll('select')[0]
    expect(wheelSelect.findAll('option').length).toBeGreaterThanOrEqual(3) // 全部/16/20
    await wheelSelect.setValue('16')
    expect(w.text()).toContain('共 1 款')
    expect(w.text()).toContain('KAA084')
  })
  it('用途筛选生效', async () => {
    const w = mount(BikeTable, { props: { bikes } })
    await w.findAll('select')[1].setValue('casual')
    expect(w.text()).toContain('共 1 款')
    expect(w.text()).toContain('DAA063')
  })
  it('变速筛选:档位选项从数据推导,"8 速及以上"保留全部测试车', async () => {
    const w = mount(BikeTable, { props: { bikes } })
    const speedSelect = w.findAll('select')[3]
    // 测试车默认 8 速:数据推导出的第一个档位即 8
    await speedSelect.setValue('8')
    expect(w.text()).toContain('共 3 款')
    const tenOnly = [
      ...bikes,
      mkBike({ slug: 'fast', model: 'RAA002', marketingName: 'R10', priceCny: 5000, drivetrain: { speeds: 10, climbScore: 4 } }),
    ]
    const w2 = mount(BikeTable, { props: { bikes: tenOnly } })
    await w2.findAll('select')[3].setValue('10')
    expect(w2.text()).toContain('共 1 款')
    expect(w2.text()).toContain('RAA002')
  })
  it('筛选为空时显示兜底文案', async () => {
    const w = mount(BikeTable, { props: { bikes } })
    await w.findAll('select')[0].setValue('16')
    await w.findAll('select')[1].setValue('casual')
    expect(w.text()).toContain('没有符合条件的车型')
  })
  it('每款链接到详情页', () => {
    const w = mount(BikeTable, { props: { bikes } })
    const hrefs = w.findAll('.bike-list a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/bikes/k16')
    expect(hrefs).toContain('/bikes/p20')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/BikeTable.test.ts`
Expected: FAIL,找不到组件。

- [ ] **Step 3: 写 `src/components/BikeTable.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Bike } from '../lib/schema'
import { filterBikes, sortBikes, type BikeFilter, type SortKey } from '../lib/filter'
import { USE_CASES, USE_CASE_LABEL } from '../lib/answers'

const props = defineProps<{ bikes: Bike[] }>()

type PriceBand = '' | 'lt2000' | '2000-4000' | '4000-8000' | 'gt8000'
const PRICE_BANDS: Record<Exclude<PriceBand, ''>, [number, number]> = {
  lt2000: [0, 2000],
  '2000-4000': [2000, 4000],
  '4000-8000': [4000, 8000],
  gt8000: [8000, Number.POSITIVE_INFINITY],
}

const wheelSize = ref<number | undefined>(undefined)
const useCase = ref<BikeFilter['useCase']>(undefined)
const priceBand = ref<PriceBand>('')
const minSpeeds = ref<number | undefined>(undefined)
const sort = ref<SortKey>('price-asc')

const wheelOptions = computed(() => [...new Set(props.bikes.map((b) => b.wheelSize))].sort((a, b) => a - b))
const speedOptions = computed(() => [...new Set(props.bikes.map((b) => b.drivetrain.speeds))].sort((a, b) => a - b))

const rows = computed(() => {
  const band = priceBand.value ? PRICE_BANDS[priceBand.value] : undefined
  const f: BikeFilter = {
    wheelSize: wheelSize.value,
    useCase: useCase.value,
    priceMin: band?.[0],
    priceMax: band?.[1],
    minSpeeds: minSpeeds.value,
  }
  return sortBikes(filterBikes(props.bikes, f), sort.value)
})
</script>

<template>
  <div class="bike-table">
    <div class="filters">
      <label>轮径
        <select v-model.number="wheelSize">
          <option :value="undefined">全部</option>
          <option v-for="w in wheelOptions" :key="w" :value="w">{{ w }} 寸</option>
        </select>
      </label>
      <label>用途
        <select v-model="useCase">
          <option :value="undefined">全部</option>
          <option v-for="u in USE_CASES" :key="u" :value="u">{{ USE_CASE_LABEL[u] }}</option>
        </select>
      </label>
      <label>价格
        <select v-model="priceBand">
          <option value="">全部</option>
          <option value="lt2000">2000 以下</option>
          <option value="2000-4000">2000-4000</option>
          <option value="4000-8000">4000-8000</option>
          <option value="gt8000">8000 以上</option>
        </select>
      </label>
      <label>变速
        <select v-model.number="minSpeeds">
          <option :value="undefined">全部</option>
          <option v-for="s in speedOptions" :key="s" :value="s">{{ s }} 速及以上</option>
        </select>
      </label>
      <label>排序
        <select v-model="sort">
          <option value="price-asc">价格从低到高</option>
          <option value="price-desc">价格从高到低</option>
          <option value="weight-asc">重量从轻到重</option>
        </select>
      </label>
    </div>
    <p class="count">共 {{ rows.length }} 款</p>
    <ul class="bike-list">
      <li v-for="b in rows" :key="b.slug" class="card">
        <h2><a :href="`/bikes/${b.slug}`">{{ b.model }}</a><span class="alias">{{ b.marketingName }}</span></h2>
        <p>{{ b.wheelSize }} 寸 · {{ b.drivetrain.speeds }} 速 · {{ b.weightKg }}kg</p>
        <p class="price">参考价 ¥{{ b.priceCny }}<small> · 更新于 {{ b.priceUpdatedAt.slice(0, 7) }}</small></p>
      </li>
    </ul>
    <p v-if="rows.length === 0" class="empty">没有符合条件的车型,试试放宽筛选。</p>
  </div>
</template>
```

> 注意 `:value="undefined"` 的"全部"选项:Vue 对 `undefined` 值 select 的处理依赖该写法,测试已覆盖默认全部展示。

- [ ] **Step 4: 写 `src/pages/bikes/index.astro`**

```astro
---
import Base from '../../layouts/Base.astro'
import BikeTable from '../../components/BikeTable.vue'
import { loadBikes } from '../../lib/schema'
const bikes = loadBikes()
---
<Base title="型号百科 · 大行选购器" description="全部在售大行折叠车一览:按轮径、价格、用途筛选对比。">
  <h1>型号百科</h1>
  <p>国内在售大行折叠车,共 {{ bikes.filter(b => b.status === 'active').length }} 款。点进详情看参数与型号名解读。</p>
  <BikeTable client:load :bikes="bikes" />
</Base>
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run tests/unit/BikeTable.test.ts`
Expected: 全部 PASS。

- [ ] **Step 6: 构建验证 + Commit**

Run: `npm run build`
Expected: 成功,`dist/bikes/index.html` 生成。

```bash
git add src/pages/bikes src/components/BikeTable.vue tests/unit/BikeTable.test.ts
git commit -m "feat: 型号百科列表与筛选岛屿"
```

---

### Task 13: 型号详情页 /bikes/[slug](SSG,SEO 主力)

**Files:**
- Create: `src/pages/bikes/[slug].astro`

**Interfaces:**
- Consumes: `loadBikes`、`loadNaming`(Task 1)、`decodeModel`(Task 6)、CSS 类契约(Task 9)
- Produces: 每款收录车型一个静态详情页(零 JS)

纯 Astro 静态页,无岛屿、无单元测试;验收 = build 通过 + 页面数量与内容抽查。

- [ ] **Step 1: 写 `src/pages/bikes/[slug].astro`**

```astro
---
import Base from '../../layouts/Base.astro'
import { loadBikes, loadNaming } from '../../lib/schema'
import { decodeModel } from '../../lib/decode'

export function getStaticPaths() {
  const bikes = loadBikes()
  return bikes.map((bike) => ({ params: { slug: bike.slug }, props: { bike } }))
}

const { bike } = Astro.props
const naming = loadNaming()
const decode = decodeModel(bike.model, naming, loadBikes())
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)
---
<Base
  title={`${bike.model} ${bike.marketingName} · 参数与解读 | 大行选购器`}
  description={`${bike.marketingName}(${bike.model}):${bike.wheelSize} 寸 / ${bike.weightKg}kg / ${bike.drivetrain.speeds} 速,参考价 ¥${bike.priceCny}。优缺点、适配身高与型号名逐位解读。`}
>
  <article class="bike-detail">
    <header>
      <h1>{bike.model}<span class="alias">{bike.marketingName}</span></h1>
      <p class="price">
        参考价 ¥{bike.priceCny}
        <small>· 更新于 {bike.priceUpdatedAt.slice(0, 7)}</small>
      </p>
      {bike.status === 'discontinued' && (
        <p class="empty">
          这款已停售(最后年份约 {bike.discontinuedInfo?.year}),仅供参考对比。
        </p>
      )}
      <ul class="highlights">
        {bike.highlights.map((h) => <li class="chip">{h}</li>)}
      </ul>
    </header>

    <section aria-labelledby="decode-heading">
      <h2 id="decode-heading">型号名怎么读</h2>
      {decode.matched ? (
        <ol class="seg-list">
          {decode.segments.map((s) => (
            <li class="seg">
              <span class="seg-char">{s.char}</span>
              <span class="seg-meaning">{s.meaning ?? '—'}</span>
              {s.note && <span class="seg-meaning">({s.note})</span>}
            </li>
          ))}
        </ol>
      ) : (
        <p class="empty">这款的官方代码暂无完整解读规则。</p>
      )}
    </section>

    <section aria-labelledby="specs-heading">
      <h2 id="specs-heading">关键参数</h2>
      <dl class="specs">
        <div><dt>轮径</dt><dd>{bike.wheelSize} 寸</dd></div>
        <div><dt>重量</dt><dd>{bike.weightKg}kg</dd></div>
        <div><dt>变速</dt><dd>{bike.drivetrain.speeds} 速</dd></div>
        <div><dt>爬坡能力</dt><dd>{stars(bike.drivetrain.climbScore)}</dd></div>
        <div><dt>携带便利</dt><dd>{stars(bike.folding.carryScore)}</dd></div>
        <div><dt>折叠方式</dt><dd>{bike.folding.mechanism}</dd></div>
        <div><dt>折叠尺寸</dt><dd>{bike.folding.foldedSize}</dd></div>
        <div><dt>适配身高</dt><dd>{bike.heightRangeCm[0]}-{bike.heightRangeCm[1]}cm</dd></div>
        {Object.entries(bike.specs).map(([k, v]) => (
          <div><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
    </section>

    <section aria-labelledby="pros-cons-heading">
      <h2 id="pros-cons-heading">优点与缺点</h2>
      <h3>优点</h3>
      <ul>{bike.pros.map((p) => <li>{p}</li>)}</ul>
      <h3>缺点</h3>
      <ul>{bike.cons.map((c) => <li>{c}</li>)}</ul>
    </section>

    <footer>
      <p class="rec-actions">
        <a href={`/compare?ids=${bike.slug}`}>把这款加入对比 →</a>
        <a href="/bikes">← 返回型号百科</a>
      </p>
      <p class="sources">
        数据来源:{bike.sources.join(' · ')};更新于 {bike.updatedAt}。
      </p>
    </footer>
  </article>
</Base>
```

> 语法注意:这是纯 Astro 模板——插值用单花括号 `{expr}`(不是 Vue 的 `{{ }}`);条件渲染用 `{cond && (<p>…</p>)}`;列表不需要 `key`。照抄即可,不要往里混 Vue 语法。

- [ ] **Step 2: 构建并验证页面数量**

Run: `npm run build`
Expected: 成功;执行 `find dist/bikes -mindepth 2 -maxdepth 2 -name 'index.html' | wc -l`,数量 = `bikes.json` 车型总数;`dist/bikes/index.html` 同时存在。

- [ ] **Step 3: 内容抽查**

Run: `grep -l 'KAA084' dist/bikes/kaa084/index.html && grep -c 'seg-char' dist/bikes/kaa084/index.html`
Expected: 文件存在且逐位解读标签数量与代码位数一致(slug 以 Task 7 实际数据为准,抽查任一款在售车型)。

- [ ] **Step 4: Commit**

```bash
git add src/pages/bikes/[slug].astro
git commit -m "feat: 型号详情静态页(参数+逐位解读+优缺点+SEO)"
```

---

### Task 14: 对比页 /compare + CompareTable 岛屿

**Files:**
- Create: `src/pages/compare.astro`
- Create: `src/components/CompareTable.vue`
- Test: `tests/unit/CompareTable.test.ts`

**Interfaces:**
- Consumes: `loadBikes`(Task 1)、`parseIds`(Task 2)、CSS 类契约 `compare-table`/`diff`(Task 9)
- Produces: `/compare?ids=slug1,slug2[,slug3]` 页面;差异行类名 `diff`

- [ ] **Step 1: 写失败测试 `tests/unit/CompareTable.test.ts`**

```ts
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CompareTable from '../../src/components/CompareTable.vue'
import { mkBike } from '../helpers'

const assign = vi.fn()
const replace = vi.fn()

const bikes = [
  mkBike({ slug: 'a', model: 'KAA084', marketingName: 'K3', priceCny: 3500, weightKg: 9.5, wheelSize: 16 }),
  mkBike({ slug: 'b', model: 'PAA013', marketingName: 'P8', priceCny: 2800, weightKg: 11.2, wheelSize: 20 }),
  mkBike({ slug: 'c', model: 'DAA063', marketingName: 'D8', priceCny: 2800, weightKg: 11.2, wheelSize: 20 }),
]

function mountWith(search: string) {
  vi.stubGlobal('location', { assign, replace, search, pathname: '/compare' })
  return mount(CompareTable, { props: { bikes } })
}

describe('CompareTable', () => {
  beforeEach(() => {
    assign.mockClear()
    replace.mockClear()
  })

  it('按 URL ids 渲染对应车型列', () => {
    const w = mountWith('?ids=a,b')
    expect(w.text()).toContain('KAA084')
    expect(w.text()).toContain('PAA013')
    expect(w.text()).not.toContain('DAA063')
  })
  it('未知 slug 被忽略', () => {
    const w = mountWith('?ids=a,zzz')
    expect(w.text()).toContain('至少选择两款')
  })
  it('值不同的行加 diff 高亮,相同的行不加', () => {
    const w = mountWith('?ids=b,c') // b 与 c 价格/重量/轮径相同,代码不同
    const diffRows = w.findAll('tr.diff').map((r) => r.text())
    expect(diffRows.join('|')).not.toContain('参考价')
    const w2 = mountWith('?ids=a,b')
    expect(w2.findAll('tr.diff').map((r) => r.text()).join('|')).toContain('参考价')
  })
  it('无参数或少于 2 款时显示用法提示', () => {
    expect(mountWith('').text()).toContain('至少选择两款')
    expect(mountWith('?ids=a').text()).toContain('至少选择两款')
  })
  it('每列链接到详情页', () => {
    const w = mountWith('?ids=a,b')
    const hrefs = w.findAll('a').map((x) => x.attributes('href'))
    expect(hrefs).toContain('/bikes/a')
    expect(hrefs).toContain('/bikes/b')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/CompareTable.test.ts`
Expected: FAIL,找不到组件。

- [ ] **Step 3: 写 `src/components/CompareTable.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Bike } from '../lib/schema'
import { parseIds } from '../lib/urlState'

const props = defineProps<{ bikes: Bike[] }>()

const selected = ref<Bike[]>([])

onMounted(() => {
  const ids = parseIds(window.location.search)
  selected.value = ids
    .map((id) => props.bikes.find((b) => b.slug === id))
    .filter((b): b is Bike => Boolean(b))
})

interface DiffRow {
  label: string
  value: (b: Bike) => string
}

const DIFF_ROWS: DiffRow[] = [
  { label: '参考价', value: (b) => `¥${b.priceCny}` },
  { label: '轮径', value: (b) => `${b.wheelSize} 寸` },
  { label: '重量', value: (b) => `${b.weightKg}kg` },
  { label: '变速', value: (b) => `${b.drivetrain.speeds} 速` },
  { label: '爬坡能力', value: (b) => '★'.repeat(b.drivetrain.climbScore) },
  { label: '携带便利', value: (b) => '★'.repeat(b.folding.carryScore) },
  { label: '折叠尺寸', value: (b) => b.folding.foldedSize },
  { label: '适配身高', value: (b) => `${b.heightRangeCm[0]}-${b.heightRangeCm[1]}cm` },
]

const rows = computed(() =>
  DIFF_ROWS.map((r) => ({
    ...r,
    isDiff: selected.value.length > 1 && new Set(selected.value.map(r.value)).size > 1,
  })),
)
</script>

<template>
  <p v-if="selected.length < 2" class="empty">
    至少选择两款车型才能对比:去 <a href="/bikes">型号百科</a> 或
    <a href="/">答题获得推荐</a> 后,在车型上点「加入对比」。
  </p>
  <div v-else class="compare" aria-label="车型对比表">
    <table class="compare-table">
      <thead>
        <tr>
          <th scope="col">对比项</th>
          <th v-for="b in selected" :key="b.slug" scope="col">
            <a :href="`/bikes/${b.slug}`">{{ b.model }}</a>
            <span class="alias">{{ b.marketingName }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label" :class="{ diff: row.isDiff }">
          <th scope="row">{{ row.label }}</th>
          <td v-for="b in selected" :key="b.slug">{{ row.value(b) }}</td>
        </tr>
      </tbody>
    </table>
    <p>高亮行是这几款车有差异的地方。</p>
  </div>
</template>
```

- [ ] **Step 4: 写 `src/pages/compare.astro`**

```astro
---
import Base from '../layouts/Base.astro'
import CompareTable from '../components/CompareTable.vue'
import { loadBikes } from '../lib/schema'
const bikes = loadBikes()
---
<Base title="车型对比 · 大行选购器" description="任选 2-3 款大行折叠车横向对比,差异行高亮。">
  <h1>车型对比</h1>
  <CompareTable client:load :bikes="bikes" />
</Base>
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run tests/unit/CompareTable.test.ts`
Expected: 全部 PASS。

- [ ] **Step 6: 构建验证 + Commit**

Run: `npm run build`
Expected: 成功,`dist/compare/index.html` 生成。

```bash
git add src/pages/compare.astro src/components/CompareTable.vue tests/unit/CompareTable.test.ts
git commit -m "feat: 车型对比页(差异行高亮)"
```

---

### Task 15: 解读器 /decode + Decoder 岛屿 + 命名体系长文

**Files:**
- Create: `src/pages/decode.astro`
- Create: `src/components/Decoder.vue`
- Test: `tests/unit/Decoder.test.ts`

**Interfaces:**
- Consumes: `loadNaming`、`loadBikes`(Task 1)、`decodeModel`、`DecodeResult`(Task 6)、CSS 类契约 `seg`/`seg-list`/`chip`(Task 9)
- Produces: `/decode` 页面;Decoder props `{ naming: Naming; bikes: Bike[] }`

- [ ] **Step 1: 写失败测试 `tests/unit/Decoder.test.ts`**

```ts
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Decoder from '../../src/components/Decoder.vue'
import { mkBike } from '../helpers'
import type { Naming } from '../../src/lib/schema'

const naming: Naming = {
  positions: [
    { index: 0, dimension: '系列/轮径', map: { K: '16 寸便携系列' } },
    { index: 1, dimension: '车架/材质', map: { A: '铝合金车架' } },
  ],
  nicknames: { K3: 'kaa084' },
  uncertain: [{ note: '数字位官方未公开统一规则' }],
}

const bikes = [mkBike({ slug: 'kaa084', model: 'KAA084' })]

function mounted() {
  return mount(Decoder, { props: { naming, bikes } })
}

async function submit(w: ReturnType<typeof mounted>, text: string) {
  await w.find('input').setValue(text)
  await w.find('form').trigger('submit')
}

describe('Decoder', () => {
  it('输入官方代码,逐位渲染解读', async () => {
    const w = mounted()
    await submit(w, 'KAA084')
    expect(w.findAll('.seg').length).toBe(6)
    expect(w.text()).toContain('16 寸便携系列')
    expect(w.find('a[href="/bikes/kaa084"]').exists()).toBe(true)
  })
  it('输入小写自动归一', async () => {
    const w = mounted()
    await submit(w, 'kaa084')
    expect(w.findAll('.seg').length).toBe(6)
  })
  it('输入俗称,提示映射关系', async () => {
    const w = mounted()
    await submit(w, 'K3')
    expect(w.text()).toContain('K3 是 KAA084 的市场俗称')
    expect(w.find('a[href="/bikes/kaa084"]').exists()).toBe(true)
  })
  it('拼写相近给出建议 chip,点击重查', async () => {
    const w = mounted()
    await submit(w, 'KKA084')
    expect(w.text()).toContain('没找到')
    const chip = w.findAll('button.chip').find((c) => c.text() === 'KAA084')
    expect(chip).toBeTruthy()
    await chip!.trigger('click')
    expect(w.findAll('.seg').length).toBe(6)
  })
  it('完全未知输入明说未收录', async () => {
    const w = mounted()
    await submit(w, 'ZZZZZZ')
    expect(w.text()).toContain('未收录')
    expect(w.findAll('button.chip')).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/unit/Decoder.test.ts`
Expected: FAIL,找不到组件。

- [ ] **Step 3: 写 `src/components/Decoder.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Bike, Naming } from '../lib/schema'
import { decodeModel, type DecodeResult } from '../lib/decode'

const props = defineProps<{ naming: Naming; bikes: Bike[] }>()

const input = ref('')
const result = ref<DecodeResult | null>(null)

function run(text: string) {
  input.value = text
  result.value = decodeModel(text, props.naming, props.bikes)
}
</script>

<template>
  <div class="decoder">
    <form @submit.prevent="run(input)">
      <label for="decode-input">输入官方代码(如 KAA084)或市场俗称(如 K3)</label>
      <div class="decode-form-row">
        <input id="decode-input" v-model="input" placeholder="KAA084 / K3" autocomplete="off" />
        <button class="btn" type="submit">解读</button>
      </div>
    </form>

    <div v-if="result?.matched" class="decode-hit">
      <p v-if="result.viaNickname" class="via-nickname">
        {{ result.viaNickname }} 是 {{ result.segments.map((s) => s.char).join('') }} 的市场俗称。
      </p>
      <ol class="seg-list">
        <li v-for="s in result.segments" :key="s.index" class="seg">
          <span class="seg-char">{{ s.char }}</span>
          <span class="seg-meaning">{{ s.meaning ?? '—' }}</span>
          <span v-if="s.note" class="seg-meaning">({{ s.note }})</span>
        </li>
      </ol>
      <p v-if="result.slug"><a :href="`/bikes/${result.slug}`">看这款车详情 →</a></p>
    </div>

    <div v-else-if="result" class="decode-miss">
      <p class="empty">没找到「{{ result.input }}」——未收录或拼写有误。</p>
      <p v-if="result.suggestions.length">你想找的是:</p>
      <button
        v-for="s in result.suggestions"
        :key="s"
        class="chip"
        type="button"
        @click="run(s)"
      >{{ s }}</button>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 写 `src/pages/decode.astro`(岛屿 + 静态长文)**

```astro
---
import Base from '../layouts/Base.astro'
import Decoder from '../components/Decoder.vue'
import { loadBikes, loadNaming } from '../lib/schema'

const naming = loadNaming()
const bikes = loadBikes()
const bySlug = new Map(bikes.map((b) => [b.slug, b]))
const nicknameRows = Object.entries(naming.nicknames)
  .map(([nick, slug]) => ({ nick, bike: bySlug.get(slug) }))
  .filter((r): r is { nick: string; bike: (typeof bikes)[number] } => Boolean(r.bike))
const uncertainNotes = naming.uncertain.map((u) => u.note)
---
<Base
  title="大行型号名解读 · 官方代码与 K3/P8 俗称 | 大行选购器"
  description="大行官方代码逐位解读:KAA084 每一位什么意思?K3、P8、D8 对应哪个官方型号?在线查询 + 命名体系科普。"
>
  <h1>型号名解读</h1>
  <Decoder client:load :naming="naming" :bikes="bikes" />

  <article class="decode-article">
    <section aria-labelledby="why-messy">
      <h2 id="why-messy">为什么大行的型号看起来这么乱?</h2>
      <p>
        因为你同时在面对两套名字:一套是厂家的官方代码(如 KAA084),
        精确到具体配置,主要用于渠道和售后;另一套是玩家和商家口中的
        俗称(如 K3),好记好传播,但一款车改版后俗称可能不变、代码却变了。
        两套名字各有道理,叠在一起就让人晕。看懂其中规律,乱码就能变成信息。
      </p>
    </section>

    <section aria-labelledby="how-to-read">
      <h2 id="how-to-read">官方代码怎么读</h2>
      <p>大行官方代码是「字母 + 数字」的组合,字母位描述系列与配置,数字位是型号编号。目前已考证的规则:</p>
      {naming.positions.map((p) => (
        <div>
          <h3>第 {p.index + 1} 位:{p.dimension}</h3>
          <dl class="specs">
            {Object.entries(p.map).map(([char, meaning]) => (
              <div><dt>{char}</dt><dd>{meaning}</dd></div>
            ))}
          </dl>
        </div>
      ))}
      {uncertainNotes.length > 0 && (
        <div class="empty">
          <strong>诚实说明:</strong>
          <ul>{uncertainNotes.map((n) => <li>{n}</li>)}</ul>
        </div>
      )}
    </section>

    <section aria-labelledby="nicknames">
      <h2 id="nicknames">市场俗称对照表</h2>
      <p>商家和骑友嘴里的名字 → 官方代码:</p>
      <dl class="specs">
        {nicknameRows.map((r) => (
          <div>
            <dt>{r.nick}</dt>
            <dd><a href={`/bikes/${r.bike.slug}`}>{r.bike.model}</a>({r.bike.marketingName})</dd>
          </div>
        ))}
      </dl>
    </section>

    <section aria-labelledby="mistakes">
      <h2 id="mistakes">三个常见误区</h2>
      <ol>
        <li><strong>「K3 就是某一款车」</strong>——不一定。俗称跨年份、跨改版沿用,买配件或查参数时要落到官方代码。</li>
        <li><strong>「数字越大越高级」</strong>——数字位是编号不是等级,系列字母和配置位才决定档次。</li>
        <li><strong>「同名就是同款」</strong>——不同年份的同名车配置可能不同,以官方代码和当年参数页为准。</li>
      </ol>
    </section>

    <section aria-labelledby="faq">
      <h2 id="faq">常见问题</h2>
      <dl class="specs">
        <div><dt>为什么我搜到的代码这里查不到?</dt><dd>可能是海外款、停售老款或拼写错误。本站收录国内在售款,可先用相似建议纠正拼写。</dd></div>
        <div><dt>官方代码哪里看?</dt><dd>车架立管内侧或五通下方通常有钢印,购买页面标题里一般也会写全。</dd></div>
        <div><dt>这些解读规则权威吗?</dt><dd>整理自官方资料与多个公开渠道交叉验证;官方未公开的位次我们明确标注「未公开」,不猜。</dd></div>
      </dl>
    </section>
  </article>
</Base>
```

> 长文小节标题与文案为成品文案,执行时可直接使用;`naming.positions` 渲染的规则表内容由 Task 8 考证结果驱动,无需执行者再写。

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run tests/unit/Decoder.test.ts`
Expected: 全部 PASS。

- [ ] **Step 6: 构建验证 + Commit**

Run: `npm run build`
Expected: 成功,`dist/decode/index.html` 生成,页面含「市场俗称对照表」静态表格。

```bash
git add src/pages/decode.astro src/components/Decoder.vue tests/unit/Decoder.test.ts
git commit -m "feat: 命名解读器岛屿与命名体系长文"
```

---

### Task 16: Playwright E2E 主线测试 + 视觉回归

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/main.spec.ts`
- Create: `tests/e2e/visual.spec.ts`
- Modify: `.gitignore`(追加 `playwright-report/` 已有则跳过)

**Interfaces:**
- Consumes: 全部已上线页面(/、/result、/bikes、/bikes/[slug]、/compare、/decode)
- Produces: E2E 验收门(`npm run e2e`),CI 不跑(浏览器依赖重),本地与发版前必跑

- [ ] **Step 1: 安装 Playwright**

Run: `cd ~/projects/dahon-picker && npm i -D @playwright/test && npx playwright install chromium`
Expected: 安装成功(chromium 下载可能较慢,失败重试)。

- [ ] **Step 2: 写 `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: 0,
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run preview -- --port 4321',
    port: 4321,
    reuseExistingServer: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
```

- [ ] **Step 3: 写 `tests/e2e/main.spec.ts`**

```ts
import { expect, test } from '@playwright/test'

test('向导主线:4 题 → 结果页 URL → 详情页', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('大行折叠车,选哪款?')

  await page.getByRole('button', { name: '2000-4000 元' }).click()
  await page.getByRole('button', { name: '城市通勤' }).click()
  await page.getByRole('button', { name: '每天都要折' }).click()
  await page.getByRole('button', { name: '170-180cm' }).click()

  await expect(page).toHaveURL(/\/result\?b=2000-4000&u=commute&f=daily&h=170-180/)
  await expect(page.locator('.result h1')).toBeVisible()
  await expect(page.locator('.rec-list li').first()).toBeVisible()

  await page.locator('.rec-list a', { hasText: '看详情' }).first().click()
  await expect(page.locator('article.bike-detail h1')).toBeVisible()
})

test('结果页 URL 可分享还原', async ({ page }) => {
  await page.goto('/result?b=2000-4000&u=commute&f=daily&h=170-180')
  await expect(page.locator('.result h1')).toContainText('推荐')
  await expect(page.locator('.summary')).toContainText('2000-4000 元')
})

test('非法参数的结果页重定向回首答题页', async ({ page }) => {
  await page.goto('/result?b=xxx')
  await expect(page).toHaveURL(/\/$|\/\?/)
})

test('解读器:输入官方代码出逐位解读', async ({ page }) => {
  await page.goto('/decode')
  await page.locator('#decode-input').fill('KAA084')
  await page.getByRole('button', { name: '解读' }).click()
  const segs = page.locator('.decode-hit .seg')
  await expect(segs).toHaveCount(6)
  await expect(page.locator('.decode-hit a[href^="/bikes/"]')).toBeVisible()
})

test('百科:轮径筛选生效', async ({ page }) => {
  await page.goto('/bikes')
  const before = await page.locator('.bike-list li').count()
  expect(before).toBeGreaterThan(0)

  const wheelSelect = page.locator('.filters select').first()
  const optionCount = await wheelSelect.locator('option').count()
  test.skip(optionCount <= 1, '数据只有一种轮径,跳过')

  await wheelSelect.selectOption({ index: 1 })
  await expect(page.locator('.count')).toContainText('共')
  const after = await page.locator('.bike-list li').count()
  expect(after).toBeLessThanOrEqual(before)
})

test('对比页:从百科选两款对比并高亮差异', async ({ page }) => {
  await page.goto('/bikes')
  const hrefs = await page.locator('.bike-list a[href^="/bikes/"]').evaluateAll((els) =>
    [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute('href')!))]
      .filter((h) => h !== '/bikes')
      .slice(0, 2),
  )
  test.skip(hrefs.length < 2, '在售车型不足两款,跳过')

  const slugs = hrefs.map((h) => h.replace('/bikes/', ''))
  await page.goto(`/compare?ids=${slugs.join(',')}`)
  await expect(page.locator('table.compare-table')).toBeVisible()
  await expect(page.locator('tr.diff').first()).toBeVisible()
})
```

> 依赖真实数据:`KAA084` 必须在 Task 7 数据集中且代码 6 位;若实际考证后位数不同,把 `toHaveCount(6)` 调成实际位数(仅这一处)。

- [ ] **Step 4: 写 `tests/e2e/visual.spec.ts`**

```ts
import { expect, test } from '@playwright/test'

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'bikes', path: '/bikes' },
  { name: 'decode', path: '/decode' },
]
const VIEWPORTS = [320, 375, 768]

for (const p of PAGES) {
  for (const width of VIEWPORTS) {
    test(`visual ${p.name} @${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(p.path)
      await expect(page.locator('h1')).toBeVisible()
      await expect(page).toHaveScreenshot(`${p.name}-${width}.png`, { fullPage: true })
    })
  }
}
```

> 首次运行自动生成基线并"通过";此后任何视觉变化都会失败,需要 `npx playwright test --update-snapshots` 人为确认后更新。基线截图提交进仓库(`tests/e2e/*-snapshots/`,不要加进 .gitignore)。

- [ ] **Step 5: 构建并跑 E2E**

Run: `npm run build && npm run e2e`
Expected: main.spec 全部 PASS(数据不足触发的 skip 除外);visual 首轮生成基线。若向导按钮定位失败,先用 `npx playwright test --headed` 人眼排查是测试问题还是实现问题——修实现,不改测试断言(除非断言与真实数据冲突)。

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e package.json package-lock.json
git commit -m "test: E2E 主线与视觉回归(移动视口)"
```

---

### Task 17: 性能与可访问性验证

**Files:**
- Create: `tests/e2e/a11y.spec.ts`(键盘走查)
- Create: `docs/perf-report.md`(结果记录)

**Interfaces:**
- Consumes: build 产物(preview server)
- Produces: 性能报告 + a11y 测试;spec §10-3(LCP < 2.5s、CLS < 0.1)的验收证据

- [ ] **Step 1: 写键盘走查测试 `tests/e2e/a11y.spec.ts`**

```ts
import { expect, test } from '@playwright/test'

test('向导纯键盘可完成', async ({ page }) => {
  await page.goto('/')
  await page.locator('.option-btn').first().focus()
  await expect(page.locator('.option-btn').first()).toBeFocused()

  // 用 Tab + Enter 逐题作答(每题第一个选项)
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Enter')
    if (i < 3) await page.keyboard.press('Tab')
  }
  await expect(page).toHaveURL(/\/result\?/)
})

test('解读器输入框有可见焦点与关联标签', async ({ page }) => {
  await page.goto('/decode')
  const input = page.locator('#decode-input')
  await input.focus()
  await expect(input).toBeFocused()
  await expect(page.locator('label[for="decode-input"]')).toBeVisible()
})
```

- [ ] **Step 2: 跑键盘走查**

Run: `npx vitest run >/dev/null 2>&1; npm run e2e -- tests/e2e/a11y.spec.ts`
Expected: PASS。若 Tab 焦点顺序不合理,修组件的 DOM 顺序/焦点管理,不改测试。

- [ ] **Step 3: Lighthouse 移动端测量(首页与任一详情页)**

先确保 build 产物存在且 preview server 在跑(Task 16 的 `npm run e2e` 会自动拉起;也可手动 `npm run preview -- --port 4321 &`)。然后:

```bash
cd ~/projects/dahon-picker
npm run build
npm run preview -- --port 4321 &
sleep 2
DETAIL_SLUG=$(node -p "require('./src/data/bikes.json')[0].slug")
npx --yes lighthouse http://localhost:4321/ --preset=mobile --output=json \
  --output-path=docs/lighthouse-home.json --quiet
npx --yes lighthouse "http://localhost:4321/bikes/$DETAIL_SLUG" --preset=mobile --output=json \
  --output-path=docs/lighthouse-detail.json --quiet
node -e "for (const f of ['docs/lighthouse-home.json','docs/lighthouse-detail.json']) { const r = require('./' + f); const c = r.categories; console.log(f, 'LCP', r.audits['largest-contentful-paint'].displayValue, 'CLS', r.audits['cumulative-layout-shift'].displayValue, 'TBT', r.audits['total-blocking-time'].displayValue, 'a11y', Math.round(c.accessibility.score * 100)) }"
```

Expected: 两条记录打印出来,首页与详情页 LCP < 2.5s、CLS < 0.1、a11y ≥ 90。

- [ ] **Step 4: 记录与修复循环**

把两个页面的 LCP / CLS / TBT / a11y 分数写进 `docs/perf-report.md`:

```markdown
# 性能报告(2026-09-XX)

| 页面 | LCP | CLS | TBT | 可访问性分 |
|---|---|---|---|---|
| / | …s | … | …ms | … |
| /bikes/<slug> | …s | … | …ms | … |

测量工具:Lighthouse 移动端预设(preview 构建)。
结论:达标 / 不达标原因与修复。
```

不达标时的修复优先级:岛屿改 `client:idle`/`client:visible`(向导保持 `client:load`)→ 检查是否引入了外部字体/大资源 → 内联关键 CSS。a11y < 90 按审计项修(通常是对比度或缺失 label)。**修复后重测,直到达标,报告写最终数值。**

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/a11y.spec.ts docs/perf-report.md docs/lighthouse-*.json
git commit -m "test: 键盘走查与性能报告(Lighthouse 移动端)"
```

---

### Task 18: 覆盖率门禁、CI、README 与 Cloudflare Pages 部署

**Files:**
- Modify: `vitest.config.ts`(coverage 阈值 80%)
- Create: `.github/workflows/ci.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: 全部前序任务
- Produces: 公网可访问站点 + CI 门禁 + 维护文档

- [ ] **Step 1: vitest.config.ts 加覆盖率阈值**

在 `test` 字段中追加(`provider` 依赖已在 Task 1 装好):

```ts
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/components/**'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
```

Run: `npm run test:coverage`
Expected: 达标(≥80%);不达标就补测试(lib 纯函数应接近 100%,组件以交互分支为主)。**这一步不通过不进入部署。**

- [ ] **Step 2: 写 CI `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm run validate
      - run: npm run test:coverage
      - run: npm run build
```

- [ ] **Step 3: 写 `README.md`**

```markdown
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
```

- [ ] **Step 4: 建 GitHub 仓库并推送**

Run: `cd ~/projects/dahon-picker && gh auth status && git branch -M main && gh repo create dahon-picker --private --source . --push`
Expected: 分支统一为 main,私有仓库建立并推送,Actions 首次运行全绿。若 `gh` 未登录,停下来让用户执行 `! gh auth login` 后再继续。

- [ ] **Step 5: 部署 Cloudflare Pages**

需要用户交互式登录:提示用户执行 `! npx wrangler login`,完成后继续:

```bash
npx wrangler pages project create dahon-picker --production-branch main || true
npx wrangler pages deploy dist --project-name dahon-picker
```

(若用户倾向 Git 集成自动构建,替代方案:在 Cloudflare 控制台连接 GitHub 仓库,构建命令 `npm run build`,输出目录 `dist`,并在"环境变量"无需任何配置——二选一,以用户选择为准。)

- [ ] **Step 6: 线上验收 + 最终 Commit**

Run: `curl -s -o /dev/null -w '%{http_code}' https://dahon-picker.pages.dev/`(URL 以部署输出为准)
Expected: 200;手机实机打开走一遍向导主线。

对照 spec §10 成功标准逐条勾验:

1. 4 题 30 秒可完成,每款推荐有理由 chip ✓(Task 10/11)
2. 在售 ≥30 款、数据 100% 过校验 ✓(Task 7,`npm run validate`)
3. 关键页 LCP < 2.5s、CLS < 0.1 ✓(Task 17 报告)
4. 结果页 URL 分享还原 ✓(Task 16 E2E)
5. 解读器覆盖全部收录车型、无臆造 ✓(Task 8 数据测试)

```bash
git add .github/workflows/ci.yml README.md vitest.config.ts
git commit -m "chore: CI 门禁、README 与 Cloudflare Pages 部署"
git push
```

---

## 计划完成后的收尾

全部 Task 完成后:向用户汇报成功标准勾验结果与线上地址;把执行中发现的 spec 偏差记录为 v2 候选(spec §11)。
