import { test, expect } from '@playwright/test';

test.describe('Visor Fontanillas 2.0 · regressió de navegador', () => {
  test('mapa prioritari al mòbil i control de pantalla ampliada', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/visor/analisi.html');
    await expect(page.locator('#map')).toBeVisible();
    const map = page.locator('#map-workspace');
    const controls = page.locator('.control-panel');
    const mapBox = await map.boundingBox(), controlsBox = await controls.boundingBox();
    expect(mapBox).toBeTruthy();
    expect(controlsBox).toBeTruthy();
    expect(mapBox.y).toBeLessThan(controlsBox.y);
    const expand = page.locator('#map-expand');
    for (const id of ['refresh', 'map-expand', 'prev', 'play', 'next']) {
      const box = await page.locator('#' + id).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await expand.click();
    await expect(map).toHaveClass(/is-expanded/);
    await expect(expand).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(map).not.toHaveClass(/is-expanded/);
    await expect(expand).toHaveAttribute('aria-pressed', 'false');
  });

  test('selectors del meteograma no alteren el nombre de models marcats', async ({ page }) => {
    await page.goto('/visor/analisi.html');
    await expect(page.locator('#meteogram-models input')).toHaveCount(8);
    const visible = page.locator('#meteogram-models input:checked');
    await expect(visible).toHaveCount(3);
    await page.locator('#chart-show-all').click();
    await expect(visible).toHaveCount(8);
    await page.locator('#chart-hide-all').click();
    await expect(visible).toHaveCount(0);
    await page.locator('[data-chart-variable="wind"]').click();
    await expect(page.locator('#model-variable')).toHaveValue('wind');
    await expect(page.locator('[data-chart-variable="wind"]')).toHaveAttribute('aria-pressed', 'true');
  });
});
