import type { FinancingInput, FinancingMonth, FinancingResult } from './types'

export const DEFAULT_FINANCING_INPUT: FinancingInput = {
  propertyPrice: 850000,
  downPayment: 170000,
  fgts: 0,
  annualInterestRate: 11.5,
  termMonths: 360,
  grossMonthlyIncome: 25000,
  insuranceMipMonthlyRate: 0.00028,
  insuranceDfiMonthlyRate: 0.00004,
  adminFeeMonthly: 35,
  amortization: 'SAC',
}

export function annualToMonthlyRate(annualRatePercent: number): number {
  if (annualRatePercent <= 0) {
    return 0
  }

  return (1 + annualRatePercent / 100) ** (1 / 12) - 1
}

export function calculateFinancing(input: FinancingInput): FinancingResult {
  const termMonths = Math.max(1, Math.round(input.termMonths))
  const financedAmount = Math.max(0, input.propertyPrice - input.downPayment - input.fgts)
  const monthlyRate = annualToMonthlyRate(input.annualInterestRate)
  const schedule =
    input.amortization === 'PRICE'
      ? buildPriceSchedule(input, financedAmount, monthlyRate, termMonths)
      : buildSacSchedule(input, financedAmount, monthlyRate, termMonths)

  const firstPayment = schedule[0]?.payment ?? 0
  const lastPayment = schedule.at(-1)?.payment ?? 0
  const totalPaid = schedule.reduce((total, month) => total + month.payment, 0)
  const totalInterest = schedule.reduce((total, month) => total + month.interest, 0)
  const totalInsuranceAndFees = schedule.reduce(
    (total, month) => total + month.insurance + month.adminFee,
    0,
  )
  const requiredIncomeAt30Percent = firstPayment / 0.3
  const incomeCommitmentFirstPayment =
    input.grossMonthlyIncome > 0 ? firstPayment / input.grossMonthlyIncome : 0

  return {
    financedAmount,
    firstPayment,
    lastPayment,
    totalPaid,
    totalInterest,
    totalInsuranceAndFees,
    requiredIncomeAt30Percent,
    incomeCommitmentFirstPayment,
    eligibleByIncome: input.grossMonthlyIncome > 0 && incomeCommitmentFirstPayment <= 0.3,
    schedule,
  }
}

function buildSacSchedule(
  input: FinancingInput,
  financedAmount: number,
  monthlyRate: number,
  termMonths: number,
): FinancingMonth[] {
  let balance = financedAmount
  const principal = financedAmount / termMonths
  const schedule: FinancingMonth[] = []

  for (let month = 1; month <= termMonths; month += 1) {
    const interest = balance * monthlyRate
    const insurance = calculateInsurance(input, balance)
    const payment = principal + interest + insurance + input.adminFeeMonthly
    balance = Math.max(0, balance - principal)

    schedule.push({
      month,
      payment,
      principal,
      interest,
      insurance,
      adminFee: input.adminFeeMonthly,
      balance,
    })
  }

  return schedule
}

function buildPriceSchedule(
  input: FinancingInput,
  financedAmount: number,
  monthlyRate: number,
  termMonths: number,
): FinancingMonth[] {
  let balance = financedAmount
  const fixedPrincipalAndInterest =
    monthlyRate === 0
      ? financedAmount / termMonths
      : (financedAmount * monthlyRate) / (1 - (1 + monthlyRate) ** -termMonths)
  const schedule: FinancingMonth[] = []

  for (let month = 1; month <= termMonths; month += 1) {
    const interest = balance * monthlyRate
    const principal = Math.min(balance, fixedPrincipalAndInterest - interest)
    const insurance = calculateInsurance(input, balance)
    const payment = fixedPrincipalAndInterest + insurance + input.adminFeeMonthly
    balance = Math.max(0, balance - principal)

    schedule.push({
      month,
      payment,
      principal,
      interest,
      insurance,
      adminFee: input.adminFeeMonthly,
      balance,
    })
  }

  return schedule
}

function calculateInsurance(input: FinancingInput, balance: number): number {
  const mip = balance * input.insuranceMipMonthlyRate
  const dfi = input.propertyPrice * input.insuranceDfiMonthlyRate
  return mip + dfi
}
