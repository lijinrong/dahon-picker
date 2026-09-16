import { expect, test } from '@playwright/test'

test('向导主线:4 题 → 结果页 URL → 详情页', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('.wizard .options')).toBeVisible()

  await page.getByRole('button', { name: '2000-4000 元' }).click()
  await expect(page.locator('.wizard h2')).toContainText('主要用来做什么')

  await page.getByRole('button', { name: '城市通勤' }).click()
  await expect(page.locator('.wizard h2')).toContainText('多久折叠')

  await page.getByRole('button', { name: '每天都要折' }).click()
  await expect(page.locator('.wizard h2')).toContainText('你的身高')

  await page.getByRole('button', { name: '170-180cm' }).click()

  await expect(page).toHaveURL(/\/result\?b=2000-4000&u=commute&f=daily&h=170-180/)
  await expect(page.locator('.result h1')).toBeVisible()
  await expect(page.locator('.rec-list li').first()).toBeVisible()

  await page.locator('.rec-list a', { hasText: '看详情' }).first().click()
  await expect(page.locator('article.bike-detail h1')).toBeVisible()
})

test('结果页 URL 可分享还原', async ({ page }) => {
  await page.goto('result?b=2000-4000&u=commute&f=daily&h=170-180')
  await expect(page.locator('.result h1')).toContainText('推荐')
  await expect(page.locator('.summary')).toContainText('2000-4000 元')
})

test('非法参数的结果页重定向回首答题页', async ({ page }) => {
  await page.goto('result?b=xxx')
  await expect(page).toHaveURL(/\/dahon-picker\/$/)
})

test('解读器:输入官方代码出逐位解读', async ({ page }) => {
  await page.goto('decode')
  await page.locator('#decode-input').fill('KAA693')
  await page.getByRole('button', { name: '解读' }).click()
  const segs = page.locator('.decode-hit .seg')
  await expect(segs).toHaveCount(6)
  await expect(page.locator('.decode-hit a[href*="/bikes/"]')).toBeVisible()
})

test('百科:轮径筛选生效', async ({ page }) => {
  await page.goto('bikes')
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
  await page.goto('bikes')
  const hrefs = await page.locator('.bike-list a[href*="/bikes/"]').evaluateAll((els) =>
    [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute('href')!))]
      .filter((h) => !h.endsWith('/bikes'))
      .slice(0, 2),
  )
  test.skip(hrefs.length < 2, '在售车型不足两款,跳过')

  const slugs = hrefs.map((h) => h.match(/\/bikes\/([^/]+)$/)?.[1] ?? '')
    .filter((s) => s !== '')
  await page.goto(`compare?ids=${slugs.join(',')}`)
  await expect(page.locator('table.compare-table')).toBeVisible()
  await expect(page.locator('tr.diff').first()).toBeVisible()
})
