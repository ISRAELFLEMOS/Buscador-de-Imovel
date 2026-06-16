import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { annualToMonthlyRate, calculateFinancing } from '../../src/domain/financing'
import type { FinancingInput } from '../../src/domain/types'

const baseInput: FinancingInput = {
  propertyPrice: 500000,
  downPayment: 100000,
  fgts: 0,
  annualInterestRate: 12,
  termMonths: 360,
  grossMonthlyIncome: 18000,
  insuranceMipMonthlyRate: 0.0002,
  insuranceDfiMonthlyRate: 0.00003,
  adminFeeMonthly: 25,
  amortization: 'SAC',
}

describe('financiamento', () => {
  it('converte taxa anual em taxa mensal efetiva', () => {
    assert.equal(Number(annualToMonthlyRate(12).toFixed(4)), 0.0095)
  })

  it('calcula SAC com parcela inicial maior que final', () => {
    const result = calculateFinancing(baseInput)

    assert.equal(result.financedAmount, 400000)
    assert.ok(result.firstPayment > result.lastPayment)
    assert.ok(result.totalInterest > 0)
  })

  it('calcula Price quitando o saldo no fim', () => {
    const result = calculateFinancing({ ...baseInput, amortization: 'PRICE' })

    assert.ok(result.firstPayment > 0)
    assert.ok((result.schedule.at(-1)?.balance ?? 1) < 1)
  })
})
