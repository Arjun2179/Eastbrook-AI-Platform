import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { apiFetch } from '../lib/api'

interface Comparison {
  key: string
  label: string
  asIs: number
  toBe: number
  unit: string
  delta: number
}
interface DailyPoint {
  day: number
  label: string
  asIsVerification: number | null
  toBeVerification: number | null
  asIsScreenTime: number | null
  toBeScreenTime: number | null
}
interface KpiCard {
  key: string
  title: string
  description: string
  asIs: number
  toBe: number
  unit: string
  delta: number
}
interface ApiResponse {
  comparison: {
    comparisons: Comparison[]
    dailyComparison: DailyPoint[]
    overview: {
      asIs: { avgVerificationRate: number; avgScreenTime: number; avgEyeDryness: number; totalDailyPrompts: number }
      toBe: { avgVerificationRate: number; avgScreenTime: number; avgEyeDryness: number; totalDailyPrompts: number }
    }
  }
  kpis: { cards: KpiCard[] }
}

function deltaColor(delta: number, lowerIsBetter = false) {
  if (delta === 0) return '#6B7280'
  const positive = lowerIsBetter ? delta < 0 : delta > 0
  return positive ? '#059669' : '#DC2626'
}
function deltaSymbol(delta: number, lowerIsBetter = false) {
  if (delta === 0) return '→'
  const positive = lowerIsBetter ? delta < 0 : delta > 0
  return positive ? '▲' : '▼'
}

const LOWER_BETTER = new Set(['screenTime', 'eyeDryness', 'automationBias', 'automationBiasRate', 'digitalPhysicalStrainIndex'])

export default function PublicComparison() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<ApiResponse>('/api/public/comparison', { auth: false })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTop: '3px solid #1D4ED8', animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#F9FAFB' }}>
        <div style={{ color: '#DC2626', fontWeight: 700 }}>Failed to load comparison data</div>
        <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>{error ?? 'Unknown error'}</div>
        <Link to="/" style={{ color: '#1D4ED8', fontSize: '0.85rem' }}>← Back to home</Link>
      </div>
    )
  }

  const { comparisons, dailyComparison } = data.comparison
  const kpiCards = data.kpis.cards

  const barData = comparisons.map(c => ({
    name: c.label,
    'AS-IS': c.asIs,
    'TO-BE': c.toBe,
    unit: c.unit,
  }))

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1E3A5F', padding: '20px clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#93C5FD', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
            Assignment 3.2 · Part 3
          </div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1rem,2vw,1.5rem)' }}>
            Eastbrook AI Well-Being — AS-IS vs TO-BE Comparison
          </div>
          <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.78rem', marginTop: 4 }}>
            KPI improvements after implementing the AI monitoring platform · Saint Louis University MIF 2026
          </div>
        </div>
        <Link to="/" style={{ color: '#93C5FD', fontSize: '0.8rem', textDecoration: 'none', border: '1px solid #3B5F8A', padding: '6px 14px', borderRadius: 8, flexShrink: 0 }}>
          ← Home
        </Link>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px,2vw,36px) clamp(16px,3vw,48px)' }}>

        {/* KPI Delta Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          {comparisons.map(c => {
            const lb = LOWER_BETTER.has(c.key)
            const color = deltaColor(c.delta, lb)
            const symbol = deltaSymbol(c.delta, lb)
            const improved = lb ? c.delta < 0 : c.delta > 0
            return (
              <div key={c.key} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px', borderTop: `3px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{c.label}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.63rem', color: '#9CA3AF', marginBottom: 2 }}>AS-IS</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#374151' }}>{c.asIs}{c.unit}</div>
                  </div>
                  <div style={{ color: color, fontSize: '1.1rem', fontWeight: 700, paddingBottom: 3 }}>→</div>
                  <div>
                    <div style={{ fontSize: '0.63rem', color: '#9CA3AF', marginBottom: 2 }}>TO-BE</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#374151' }}>{c.toBe}{c.unit}</div>
                  </div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: improved ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${improved ? '#6EE7B7' : '#FECACA'}` }}>
                  <span style={{ color, fontWeight: 700, fontSize: '0.8rem' }}>{symbol} {Math.abs(c.delta)}{c.unit}</span>
                  <span style={{ color: '#6B7280', fontSize: '0.68rem' }}>{improved ? 'improvement' : 'increase'}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bar Chart — AS-IS vs TO-BE */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 4 }}>Key Metric Comparison: AS-IS vs TO-BE</div>
          <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: 16 }}>Side-by-side comparison across all four core KPIs</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 4, right: 16, left: 8, bottom: 22 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }}
                label={{ value: 'KPI Metric', position: 'insideBottom', offset: -8, fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }}
                label={{ value: 'Metric Value', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10, dx: -4 }} />
              <Tooltip formatter={(v: unknown, name: unknown) => [`${v}`, name as string]} labelFormatter={l => `Metric: ${l}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="AS-IS" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="TO-BE" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily verification trend */}
        {dailyComparison.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 4 }}>Daily Verification Rate: AS-IS vs TO-BE</div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: 16 }}>Student verification behavior before and after the platform intervention</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyComparison} margin={{ top: 4, right: 16, left: 8, bottom: 22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} interval={2}
                  label={{ value: 'Observation Day', position: 'insideBottom', offset: -8, fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={v => `${v}%`}
                  label={{ value: 'Verification Rate (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 10, dx: -4 }} />
                <Tooltip formatter={(v: unknown, name: unknown) => [`${v}%`, String(name)]} labelFormatter={l => `Day ${l}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="asIsVerification" stroke="#94A3B8" strokeWidth={2} name="AS-IS Verification" dot={false} connectNulls />
                <Line type="monotone" dataKey="toBeVerification" stroke="#1D4ED8" strokeWidth={2} name="TO-BE Verification" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Advanced KPI Cards */}
        {kpiCards.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 14 }}>Advanced Intervention KPIs</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {kpiCards.map(card => {
                const lb = LOWER_BETTER.has(card.key)
                const color = deltaColor(card.delta, lb)
                const improved = lb ? card.delta < 0 : card.delta > 0
                return (
                  <div key={card.key} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827', marginBottom: 4 }}>{card.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: 12, lineHeight: 1.5 }}>{card.description}</div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>AS-IS</div>
                        <div style={{ fontWeight: 800, color: '#374151' }}>{card.asIs}{card.unit}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>TO-BE</div>
                        <div style={{ fontWeight: 800, color: '#374151' }}>{card.toBe}{card.unit}</div>
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', gap: 4, padding: '2px 10px', borderRadius: 20, background: improved ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${improved ? '#6EE7B7' : '#FECACA'}`, fontSize: '0.75rem', fontWeight: 700, color }}>
                      {deltaSymbol(card.delta, lb)} {card.delta > 0 ? '+' : ''}{card.delta}{card.unit}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Data story */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '20px 24px', borderLeft: '4px solid #1D4ED8' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E40AF', marginBottom: 10 }}>Data Story: What Changed and Why</div>
          <div style={{ fontSize: '0.82rem', color: '#1E40AF', lineHeight: 1.75 }}>
            After deploying the Eastbrook AI monitoring platform, students who received real-time verification nudges
            showed measurably improved behavior. Verification rates increased while automation bias declined —
            directly validating the platform's core hypothesis: surfacing AI usage patterns to both students and educators
            creates behavioral accountability. Physical strain metrics (eye dryness, screen time) improved as session-limit
            alerts encouraged more frequent breaks. Over-reliant students showed the largest improvement gains,
            confirming that targeted intervention reaches the highest-risk cohort most effectively.
          </div>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', fontSize: '0.65rem', color: '#9CA3AF', lineHeight: 1.8 }}>
          Eastbrook Youth AI Well-Being Study · AS-IS vs TO-BE Comparison · Saint Louis University MIF 2026 · Dr. Tatiana Cardona<br />
          Team: Tejaswini (PM) · Pavani (BA) · Vardhan (Data Analyst) · Vinay (Technical Lead) · Arjun (Documentation Lead)
        </div>
      </div>
    </div>
  )
}
