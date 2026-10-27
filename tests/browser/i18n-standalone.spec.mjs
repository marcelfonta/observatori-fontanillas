import { test, expect } from '@playwright/test';

test('les pàgines independents conserven idioma, metadades i etiquetes accessibles', async ({ page }) => {
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/fonta.html?lang=fr');
  const languages = page.locator('.standalone-languages');
  await expect(languages.getByRole('button')).toHaveCount(4);
  await expect(languages.getByRole('button', { name:'Français' })).toHaveAttribute('aria-pressed', 'true');
  await languages.getByRole('button', { name:'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(languages.getByRole('button', { name:'English' })).toHaveAttribute('aria-pressed', 'true');

  await page.evaluate(() => {
    const field = document.createElement('input');
    field.id = 'i18n-attribute-probe';
    field.placeholder = 'Dades obertes';
    field.setAttribute('aria-label', 'Idioma');
    field.title = 'Sobre l’Observatori';
    document.body.append(field);
  });
  const field = page.locator('#i18n-attribute-probe');
  await expect(field).toHaveAttribute('placeholder', 'Open data');
  await expect(field).toHaveAttribute('aria-label', 'Language');
  await expect(field).toHaveAttribute('title', 'About the Observatory');

  await field.evaluate(element => element.setAttribute('placeholder', 'Carregant dades'));
  await expect(field).toHaveAttribute('placeholder', 'Loading data');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr'); // URL parameter takes precedence over saved preference.
  await page.goto('/xarxes.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.standalone-languages button[aria-pressed="true"]')).toHaveText('English');
});

test('la fitxa d’aula manté els controls accessibles en mòbil i no els imprimeix', async ({ page }) => {
  await page.setViewportSize({ width:375, height:812 });
  await page.goto('/aula/analisi-aiguat-4-octubre-2026.html?lang=es');
  await expect(page.locator('.standalone-languages button[aria-pressed="true"]')).toHaveText('Español');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.emulateMedia({ media:'print' });
  await expect(page.locator('.standalone-languages')).toBeHidden();
});
