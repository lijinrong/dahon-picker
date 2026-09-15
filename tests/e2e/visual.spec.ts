import { expect, test } from '@playwright/test'

const PAGES = [
  { name: 'home', path: '/', heading: '大行折叠车,选哪款?' },
  { name: 'bikes', path: '/bikes', heading: '型号百科' },
  { name: 'decode', path: '/decode', heading: '型号名解读' },
]
const VIEWPORTS = [320, 375, 768]

for (const p of PAGES) {
  for (const width of VIEWPORTS) {
    test(`visual ${p.name} @${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(p.path)
      await expect(page.getByRole('heading', { name: p.heading, level: 1 })).toBeVisible()
      await expect(page).toHaveScreenshot(`${p.name}-${width}.png`, { fullPage: true })
    })
  }
}
