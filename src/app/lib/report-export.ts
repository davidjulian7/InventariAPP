import * as XLSX from 'xlsx'
import { formatCurrency } from './utils'
import { formatUTC6DateTime } from './dates'
import type { ReportSummary, SalesChartData, CategoryData, MonthlyData, TopProduct, CashFlow } from '../types'

export interface ReportData {
  periodLabel: string
  rangeLabel: string
  summary: ReportSummary
  trend: SalesChartData[]
  categories: CategoryData[]
  monthly: MonthlyData[]
  top: TopProduct[]
  cashFlow: CashFlow
}

export function buildShareText(r: ReportData): string {
  const { summary } = r
  const lines = [
    `REPORTE DE VENTAS - Abarrotes El Roble`,
    `Periodo: ${r.periodLabel} (${r.rangeLabel})`,
    `Generado: ${formatUTC6DateTime(new Date().toISOString())}`,
    '--------------------------------',
    `Ventas totales: ${formatCurrency(summary.ventas)}`,
    `Transacciones: ${summary.transacciones}`,
    `Ganancia neta: ${formatCurrency(summary.ganancia)}`,
    `Margen promedio: ${summary.margen.toFixed(1)}%`,
    `Ticket promedio: ${formatCurrency(summary.ticketPromedio)}`,
    '--------------------------------',
    'Productos más vendidos:',
    ...r.top.slice(0, 5).map(p => `  ${p.nombre} - ${p.ventas} uds / ${formatCurrency(p.ingresos)}`),
    '--------------------------------',
    'Flujo de efectivo:',
    `  Ingresos: ${formatCurrency(r.cashFlow.ingresos)}`,
    `  IVA: ${formatCurrency(r.cashFlow.iva)}`,
    `  Costo de lo vendido: ${formatCurrency(r.cashFlow.costoVendido)}`,
    `  Flujo neto: ${formatCurrency(r.cashFlow.flujoNeto)}`,
  ]
  return lines.join('\n')
}

export function reportFilename(r: ReportData): string {
  const slug = r.periodLabel.toLowerCase().replace(/\s+/g, '-')
  return `reporte-ventas-${slug}.pdf`
}

export async function generateReportsPdf(r: ReportData): Promise<{ doc: any; filename: string }> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const ml = 16
  const mr = pw - 16
  let y = 16

  const newPage = () => {
    doc.addPage()
    y = 16
  }
  const ensureSpace = (needed: number) => {
    if (y + needed > ph - 16) newPage()
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('REPORTE DE VENTAS', pw / 2, y, { align: 'center' })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Abarrotes El Roble · Calle Principal 45, CDMX', pw / 2, y, { align: 'center' })
  y += 5
  doc.text(`Periodo: ${r.periodLabel} (${r.rangeLabel})`, pw / 2, y, { align: 'center' })
  y += 5
  doc.text(`Generado: ${formatUTC6DateTime(new Date().toISOString())}`, pw / 2, y, { align: 'center' })
  y += 8

  doc.setDrawColor(180)
  doc.line(ml, y, mr, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Resumen del periodo', ml, y)
  y += 7

  const kpiRows: [string, string][] = [
    ['Ventas totales', formatCurrency(r.summary.ventas)],
    ['Transacciones', String(r.summary.transacciones)],
    ['Ganancia neta', formatCurrency(r.summary.ganancia)],
    ['Margen promedio', r.summary.margen.toFixed(1) + '%'],
    ['Ticket promedio', formatCurrency(r.summary.ticketPromedio)],
  ]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  for (const [label, value] of kpiRows) {
    doc.text(label, ml, y)
    doc.text(value, mr, y, { align: 'right' })
    y += 6
  }
  y += 6

  if (r.top.length > 0) {
    ensureSpace(40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Productos más vendidos', ml, y)
    y += 7

    const table = (data: string[][]) => {
      doc.setFontSize(8.5)
      for (const row of data) {
        const amount = row[0]
        if (amount === '__SEP__') {
          doc.line(ml, y, mr, y)
          y += 4
          continue
        }
        doc.text(amount, ml, y)
        doc.text(row[1], ml + 80, y)
        doc.text(row[2], mr, y, { align: 'right' })
        y += 5
      }
    }

    table([
      ['Producto', 'Unidades', 'Ingresos'],
      ...r.top.map(p => [p.nombre.length > 38 ? p.nombre.slice(0, 37) + '…' : p.nombre, String(p.ventas), formatCurrency(p.ingresos) + ' (' + p.margen + '%)']),
    ])
    y += 6
  }

  ensureSpace(60)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Flujo de efectivo', ml, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const flowRows: [string, string, boolean][] = [
    ['Ingresos por ventas', formatCurrency(r.cashFlow.ingresos), true],
    ['Impuestos (IVA)', '-' + formatCurrency(r.cashFlow.iva), false],
    ['Costo de lo vendido', '-' + formatCurrency(r.cashFlow.costoVendido), false],
    ['Flujo neto del periodo', formatCurrency(r.cashFlow.flujoNeto), true],
  ]
  for (const [label, value, bold] of flowRows) {
    if (bold) doc.setFont('helvetica', 'bold')
    else doc.setFont('helvetica', 'normal')
    doc.text(label, ml, y)
    doc.text(value, mr, y, { align: 'right' })
    y += 6
  }
  y += 6

  if (r.monthly.length > 0) {
    ensureSpace(50)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Ventas mensuales', ml, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    for (const m of r.monthly) {
      doc.text(m.mes, ml, y)
      doc.text(formatCurrency(m.ventas), mr, y, { align: 'right' })
      y += 6
    }
  }

  return { doc, filename: reportFilename(r) }
}

export function generateReportsXlsx(r: ReportData): void {
  const wb = XLSX.utils.book_new()

  const summaryRows: (string | number)[][] = [
    ['Abarrotes El Roble — Reporte de ventas'],
    [`Periodo: ${r.periodLabel} (${r.rangeLabel})`],
    [`Generado: ${formatUTC6DateTime(new Date().toISOString())}`],
    [],
    ['Indicador', 'Valor'],
    ['Ventas totales', r.summary.ventas],
    ['Transacciones', r.summary.transacciones],
    ['Ganancia neta', r.summary.ganancia],
    ['Margen promedio (%)', r.summary.margen],
    ['Ticket promedio', r.summary.ticketPromedio],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Resumen')

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Día', 'Ventas', 'Ganancia'],
      ...r.trend.map(t => [t.dia, t.ventas, t.ganancia]),
    ]),
    'Tendencia diaria'
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Categoría', 'Ventas'],
      ...r.categories.map(c => [c.name, c.value]),
    ]),
    'Categorías'
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Producto', 'Unidades vendidas', 'Ingresos', 'Margen (%)'],
      ...r.top.map(p => [p.nombre, p.ventas, p.ingresos, p.margen]),
    ]),
    'Productos'
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Mes', 'Ventas', 'Ganancia'],
      ...r.monthly.map(m => [m.mes, m.ventas, m.ganancia]),
    ]),
    'Mensual'
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Concepto', 'Monto'],
      ['Ingresos por ventas', r.cashFlow.ingresos],
      ['Impuestos (IVA)', r.cashFlow.iva],
      ['Costo de lo vendido', r.cashFlow.costoVendido],
      ['Flujo neto', r.cashFlow.flujoNeto],
    ]),
    'Flujo de efectivo'
  )

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte-ventas-${r.periodLabel.toLowerCase().replace(/\s+/g, '-')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}