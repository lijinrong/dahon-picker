# 性能报告(2026-09-15)

## Lighthouse 移动端测量(preview 构建)

| 页面 | LCP | CLS | TBT | FCP | SI | Performance | 可访问性 | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|---|
| / | 1.5 s | 0 | 0 ms | 1.0 s | 1.0 s | 100 | 100 | 96 | 100 |
| /bikes/kaa693 | 0.9 s | 0 | 0 ms | 0.8 s | 0.8 s | 100 | 100 | 96 | 100 |

测量工具: Lighthouse 13.4.1 移动端模拟(screenEmulation.mobile),preview 构建产物(astro preview --port 4321)。

## 与 spec 目标对比

| 指标 | 目标 | / 实测 | /bikes/kaa693 实测 | 达标 |
|---|---|---|---|---|
| LCP | < 2.5 s | 1.5 s | 0.9 s | PASS |
| CLS | < 0.1 | 0 | 0 | PASS |
| TBT | < 200 ms | 0 ms | 0 ms | PASS |
| 可访问性 | >= 90 | 100 | 100 | PASS |

所有核心指标均达标。

## 可访问性审计(a11y)

两个页面 a11y 分数均为 100,无审计项未通过。

键盘走查测试(Puppeteer/Playwright `tests/e2e/a11y.spec.ts`)通过:

- 向导纯键盘可完成: Tab + Enter 逐题作答,4 题后抵达 result 页 -- PASS
- 解读器输入框有可见焦点与关联标签(`label[for="decode-input"]`) -- PASS

## Best Practices 唯一扣分项

- `errors-in-console`: 缺少 `favicon.ico`(404)。不影响功能,添加 favicon 即可修复。

## 未达标修复记录

无需修复,首次测量即全部达标。

## 附:原始数据

- `docs/lighthouse-home.json` -- 首页完整 Lighthouse 报告
- `docs/lighthouse-detail.json` -- 详情页完整 Lighthouse 报告
