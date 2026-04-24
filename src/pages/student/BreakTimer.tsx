import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, Coffee, Pause, Play, RotateCcw } from 'lucide-react'

const FOCUS_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

export default function BreakTimer() {
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [seconds, setSeconds] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)
  const [cycles, setCycles] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const accentColor = mode === 'focus' ? 'var(--student)' : 'var(--success)'
  const backgroundColor = mode === 'focus' ? 'var(--student-light)' : 'var(--success-light)'
  const totalSeconds = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS

  useEffect(() => {
    if (!running) return undefined

    intervalRef.current = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false)
          if (mode === 'focus') {
            setMode('break')
            setCycles((value) => value + 1)
            return BREAK_SECONDS
          }
          setMode('focus')
          return FOCUS_SECONDS
        }
        return current - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [mode, running])

  const timeLabel = useMemo(() => {
    const minutes = Math.floor(seconds / 60)
    const remainder = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }, [seconds])

  const progress = 1 - seconds / totalSeconds
  const circumference = 2 * Math.PI * 56
  const dashOffset = circumference * (1 - progress)

  function resetTimer() {
    setRunning(false)
    setMode('focus')
    setSeconds(FOCUS_SECONDS)
    setCycles(0)
  }

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>25-5 Break Timer</h2>
      <p style={{ marginBottom: 24 }}>
        Use the timer while working in AI-heavy sessions. The rule is simple: 25 minutes of focused work followed by a 5-minute break away from the screen.
      </p>

      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 36, marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              background: backgroundColor,
              color: accentColor,
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            {mode === 'focus' ? <Brain size={18} /> : <Coffee size={18} />}
            {mode === 'focus' ? 'Focus Block' : 'Break Block'}
          </div>

          <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto 24px' }}>
            <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="110" cy="110" r="56" fill="none" stroke="var(--brand-200)" strokeWidth="10" />
              <circle
                cx="110"
                cy="110"
                r="56"
                fill="none"
                stroke={accentColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <div>
                <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>{timeLabel}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  {mode === 'focus' ? 'Stay on task, then step away' : 'Look into the distance and stretch'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className={`btn ${running ? 'btn-secondary' : 'btn-primary'} btn-lg`} onClick={() => setRunning((value) => !value)}>
              {running ? (
                <>
                  <Pause size={18} /> Pause
                </>
              ) : (
                <>
                  <Play size={18} /> {seconds === totalSeconds ? 'Start' : 'Resume'}
                </>
              )}
            </button>
            <button className="btn btn-secondary btn-lg" onClick={resetTimer}>
              <RotateCcw size={18} /> Reset
            </button>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginBottom: 24 }}>
          <div className="card kpi-card">
            <div className="kpi-value" style={{ color: 'var(--student)', fontSize: '1.5rem' }}>{cycles}</div>
            <div className="kpi-label">Completed Focus Cycles</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-value" style={{ color: 'var(--success)', fontSize: '1.5rem' }}>{cycles * 25}</div>
            <div className="kpi-label">Focus Minutes</div>
          </div>
          <div className="card kpi-card">
            <div className="kpi-value" style={{ color: 'var(--warning)', fontSize: '1.5rem' }}>{cycles * 5}</div>
            <div className="kpi-label">Break Minutes</div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <h3 style={{ marginBottom: 8 }}>Why this matters</h3>
          <p style={{ fontSize: '0.86rem', margin: 0 }}>
            The Eastbrook platform tracks symptom scores after AI sessions, so this timer is here to help you build a healthier rhythm before long screen exposure becomes a problem. Use it alongside your session logs and compare the results in My Progress.
          </p>
        </div>
      </div>
    </div>
  )
}
