import { useEffect, useMemo, useState } from 'react'
import { Award, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch } from '../../lib/api'

interface TrainingQuestion {
  id: string
  order: number
  prompt: string
  options: string[]
}

interface TrainingModule {
  id: number
  slug: string
  title: string
  description: string
  icon: string
  accent_color: string
  duration_minutes: number
  slides_json: Array<{
    title: string
    body: string
    stat?: string
    statLabel?: string
    statColor?: string
    highlight?: string
  }>
  progress: {
    attempts: number
    latest_score: number
    best_score: number
    passed: boolean
  } | null
  questions: TrainingQuestion[]
}

interface TrainingResponse {
  modules: TrainingModule[]
}

interface AttemptResponse {
  moduleId: number
  score: number
  passed: boolean
  correctAnswers: number
  totalQuestions: number
}

export default function Training() {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [attemptResult, setAttemptResult] = useState<AttemptResponse | null>(null)

  useEffect(() => {
    let active = true

    async function loadModules() {
      try {
        const response = await apiFetch<TrainingResponse>('/api/student/training')
        if (!active) return
        setModules(response.modules)
        setSelectedModuleId(response.modules[0]?.id ?? null)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load training')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadModules()

    return () => {
      active = false
    }
  }, [])

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? null,
    [modules, selectedModuleId],
  )

  useEffect(() => {
    setCurrentSlideIndex(0)
    setAnswers({})
    setAttemptResult(null)
  }, [selectedModuleId])

  async function submitAttempt() {
    if (!selectedModule) return
    setSaving(true)
    setError('')

    try {
      const response = await apiFetch<AttemptResponse>(`/api/student/training/${selectedModule.id}/attempt`, {
        method: 'POST',
        body: { answers },
      })
      setAttemptResult(response)
      const refreshed = await apiFetch<TrainingResponse>('/api/student/training')
      setModules(refreshed.modules)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answers')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p>Loading training catalog...</p>
      </div>
    )
  }

  if (error && !modules.length) {
    return (
      <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <h2 style={{ marginBottom: 8 }}>AI Training</h2>
        <p style={{ marginBottom: 16 }}>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    )
  }

  const slide = selectedModule?.slides_json[currentSlideIndex]

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>AI Literacy Training</h2>
      <p style={{ marginBottom: 24 }}>
        These modules are seeded into PostgreSQL and scored on the server, so progress is shared across the live app.
      </p>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid" style={{ gridTemplateColumns: '320px 1fr', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Modules</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {modules.map((module) => (
              <button
                key={module.id}
                type="button"
                className="module-card"
                onClick={() => setSelectedModuleId(module.id)}
                style={{
                  textAlign: 'left',
                  padding: 16,
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${selectedModuleId === module.id ? module.accent_color : 'var(--card-border)'}`,
                  background: selectedModuleId === module.id ? 'var(--brand-50)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ fontSize: '1.3rem' }}>{module.icon}</div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{module.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{module.duration_minutes} minutes</span>
                    </div>
                  </div>
                  <span className={`badge ${module.progress?.passed ? 'badge-green' : 'badge-gray'}`}>
                    {module.progress?.passed ? 'Passed' : 'Pending'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', margin: '8px 0 0' }}>{module.description}</p>
                {module.progress && (
                  <div style={{ marginTop: 8, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Best score {module.progress.best_score}% across {module.progress.attempts} attempts
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          {selectedModule && slide && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '1.3rem' }}>{selectedModule.icon}</span>
                    <span className="badge badge-blue">Slide {currentSlideIndex + 1}/{selectedModule.slides_json.length}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 6 }}>{slide.title}</h3>
                  <p style={{ fontSize: '0.88rem', margin: 0 }}>{selectedModule.description}</p>
                </div>
                {slide.stat && (
                  <div style={{ minWidth: 120, textAlign: 'right' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: slide.statColor || selectedModule.accent_color }}>{slide.stat}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{slide.statLabel}</div>
                  </div>
                )}
              </div>

              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {slide.body}
              </div>

              {slide.highlight && (
                <div className="chart-insight" style={{ borderLeftColor: selectedModule.accent_color, marginTop: 18 }}>
                  {slide.highlight}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 18, marginBottom: 18 }}>
                {selectedModule.slides_json.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className="lesson-slide-bar"
                    onClick={() => setCurrentSlideIndex(index)}
                    style={{ background: index === currentSlideIndex ? selectedModule.accent_color : 'var(--brand-200)' }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentSlideIndex((index) => Math.max(0, index - 1))}
                  disabled={currentSlideIndex === 0}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setCurrentSlideIndex((index) => Math.min(selectedModule.slides_json.length - 1, index + 1))}
                  disabled={currentSlideIndex === selectedModule.slides_json.length - 1}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {selectedModule && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>Module Quiz</h3>
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>Submit this quiz to save progress on the backend.</p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: selectedModule.accent_color }}>
                  <BookOpen size={16} /> {selectedModule.questions.length} questions
                </div>
              </div>

              <div style={{ display: 'grid', gap: 14 }}>
                {selectedModule.questions.map((question) => (
                  <div key={question.id}>
                    <strong style={{ display: 'block', marginBottom: 10, fontSize: '0.88rem' }}>
                      {question.order}. {question.prompt}
                    </strong>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {question.options.map((option, index) => {
                        const selected = answers[question.id] === String(index)
                        return (
                          <button
                            key={option}
                            type="button"
                            className={`quiz-option ${selected ? 'selected' : ''}`}
                            onClick={() => setAnswers((current) => ({ ...current, [question.id]: String(index) }))}
                            style={{
                              borderColor: selected ? selectedModule.accent_color : undefined,
                              background: selected ? 'var(--brand-50)' : undefined,
                            }}
                          >
                            <span className="badge badge-gray">{String.fromCharCode(65 + index)}</span>
                            <span>{option}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <Award size={16} /> Pass mark: 70%
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving || selectedModule.questions.some((question) => answers[question.id] === undefined)}
                  onClick={submitAttempt}
                >
                  {saving ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>

              {attemptResult && attemptResult.moduleId === selectedModule.id && (
                <div
                  className="chart-insight"
                  style={{
                    marginTop: 18,
                    borderLeftColor: attemptResult.passed ? 'var(--success)' : 'var(--warning)',
                    background: attemptResult.passed ? 'var(--success-light)' : 'var(--warning-light)',
                  }}
                >
                  Score: {attemptResult.score}% ({attemptResult.correctAnswers}/{attemptResult.totalQuestions} correct)
                  {attemptResult.passed ? ' — module passed and progress saved.' : ' — try again to improve your score.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
