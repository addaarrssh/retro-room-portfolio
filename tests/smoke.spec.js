import { test, expect } from '@playwright/test'

test.use({ viewport: { width: 1440, height: 860 } })

test('smoke test - site loads and passes safety checks', async ({ page }) => {
  // 1. Load the site
  await page.goto('http://localhost:5180/')

  // 2. Assert no uncaught React errors
  const reactError = await page.evaluate(() => window.__reactError)
  expect(reactError).toBeUndefined()

  // 3. Page has rendered DOM
  const root = page.locator('#root')
  await expect(root).toBeVisible()

  // 4. Check if 3D scene canvas or FlatSite rendered
  const canvasCount = await page.locator('canvas').count()
  const flatSiteCount = await page.locator('text=Adarsh Sahu').count()

  expect(canvasCount + flatSiteCount).toBeGreaterThan(0)

  // 5. Verify window.__perf() or DOM content
  const perfMetrics = await page.evaluate(() => window.__perf?.())
  if (perfMetrics) {
    expect(perfMetrics.meshes).toBeGreaterThan(50)
  }
})
