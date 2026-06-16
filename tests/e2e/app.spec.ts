import { expect, test } from '@playwright/test'

test('carrega filtros, mapa e simulador', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Apartamentos ate 3,5 km/i })).toBeVisible()
  await expect(page.getByLabel('Filtros')).toBeVisible()
  await expect(page.getByRole('img', { name: /Mapa radial simplificado/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Simulador de financiamento/i })).toBeVisible()

  await page.getByLabel('Juros ao ano (%)').fill('10.5')
  await expect(page.getByText(/Comprometimento inicial/i)).toBeVisible()
})
