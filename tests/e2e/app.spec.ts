import { expect, test } from '@playwright/test'

test('carrega filtros, mapa e simulador recolhido', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Imoveis perto da Avenida Brasil/i })).toBeVisible()
  await expect(page.getByLabel('Filtros')).toBeVisible()
  await expect(page.getByLabel('Aluguel maximo')).toHaveValue('4500')
  await expect(page.getByRole('img', { name: /Mapa radial simplificado/i })).toBeVisible()

  await page.getByText('Simulador de financiamento para uma etapa futura').click()
  await expect(page.getByRole('heading', { name: /Simulador de financiamento/i })).toBeVisible()
  await page.getByLabel('Juros ao ano (%)').fill('10.5')
  await expect(page.getByText(/Comprometimento inicial/i)).toBeVisible()
})
