import { useMemo, useState } from 'react'
import { calculateFinancing, DEFAULT_FINANCING_INPUT } from '../domain/financing'
import { formatCurrencyPrecise } from '../domain/money'
import type { FinancingInput } from '../domain/types'

export function FinancingPanel({ suggestedPrice }: { suggestedPrice?: number }) {
  const [input, setInput] = useState<FinancingInput>(() =>
    suggestedPrice
      ? {
          ...DEFAULT_FINANCING_INPUT,
          propertyPrice: suggestedPrice,
          downPayment: Math.round(suggestedPrice * 0.2),
        }
      : DEFAULT_FINANCING_INPUT,
  )

  const result = useMemo(() => calculateFinancing(input), [input])
  const sampledSchedule = result.schedule.filter(
    (month) => month.month === 1 || month.month % 60 === 0 || month.month === input.termMonths,
  )

  return (
    <div className="financing-grid">
      <form className="financing-form">
        <NumberField label="Valor do imovel" value={input.propertyPrice} onChange={(value) => update('propertyPrice', value)} />
        <NumberField label="Entrada" value={input.downPayment} onChange={(value) => update('downPayment', value)} />
        <NumberField label="FGTS" value={input.fgts} onChange={(value) => update('fgts', value)} />
        <NumberField label="Juros ao ano (%)" value={input.annualInterestRate} step={0.1} onChange={(value) => update('annualInterestRate', value)} />
        <NumberField label="Prazo (meses)" value={input.termMonths} onChange={(value) => update('termMonths', value)} />
        <NumberField label="Renda bruta mensal" value={input.grossMonthlyIncome} onChange={(value) => update('grossMonthlyIncome', value)} />
        <NumberField label="Seguro MIP mensal" value={input.insuranceMipMonthlyRate} step={0.00001} onChange={(value) => update('insuranceMipMonthlyRate', value)} />
        <NumberField label="Seguro DFI mensal" value={input.insuranceDfiMonthlyRate} step={0.00001} onChange={(value) => update('insuranceDfiMonthlyRate', value)} />
        <NumberField label="Taxa administrativa" value={input.adminFeeMonthly} onChange={(value) => update('adminFeeMonthly', value)} />
        <label>
          Sistema
          <select
            value={input.amortization}
            onChange={(event) =>
              setInput((current) => ({ ...current, amortization: event.target.value as FinancingInput['amortization'] }))
            }
          >
            <option value="SAC">SAC</option>
            <option value="PRICE">Price</option>
          </select>
        </label>
      </form>

      <div className="financing-result">
        <div className="result-grid">
          <Result label="Valor financiado" value={formatCurrencyPrecise(result.financedAmount)} />
          <Result label="Primeira parcela" value={formatCurrencyPrecise(result.firstPayment)} />
          <Result label="Ultima parcela" value={formatCurrencyPrecise(result.lastPayment)} />
          <Result label="Total pago" value={formatCurrencyPrecise(result.totalPaid)} />
          <Result label="Juros totais" value={formatCurrencyPrecise(result.totalInterest)} />
          <Result label="Renda minima 30%" value={formatCurrencyPrecise(result.requiredIncomeAt30Percent)} />
        </div>

        <div className={result.eligibleByIncome ? 'income-ok' : 'income-alert'}>
          Comprometimento inicial: {(result.incomeCommitmentFirstPayment * 100).toFixed(1)}% da renda bruta informada.
        </div>

        <div className="schedule-table">
          <div className="schedule-head">
            <span>Mes</span>
            <span>Parcela</span>
            <span>Juros</span>
            <span>Saldo</span>
          </div>
          {sampledSchedule.map((month) => (
            <div className="schedule-row" key={month.month}>
              <span>{month.month}</span>
              <span>{formatCurrencyPrecise(month.payment)}</span>
              <span>{formatCurrencyPrecise(month.interest)}</span>
              <span>{formatCurrencyPrecise(month.balance)}</span>
            </div>
          ))}
        </div>

        <p className="muted">
          Simulacao educativa. Bancos podem alterar taxas, seguros, indexadores, avaliacao do imovel, renda aprovada e CET.
        </p>
      </div>
    </div>
  )

  function update(field: keyof FinancingInput, value: number) {
    setInput((current) => ({ ...current, [field]: value }))
  }
}

function NumberField({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label>
      {label}
      <input type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}
