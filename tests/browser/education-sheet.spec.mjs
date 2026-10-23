import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});

for (const width of [390, 1280]) {
  test(`fitxa educativa accessible i sense desbordament · ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/aula/analisi-aiguat-4-octubre-2026.html');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quan va ploure més?');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Descarrega el CSV' })).toHaveAttribute('download', '');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
