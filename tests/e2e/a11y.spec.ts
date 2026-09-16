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
