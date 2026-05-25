'use client'

import { useState } from 'react'

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
]

const BENEFITS = [
  { id: 'health_insurance', label: 'Health Insurance' },
  { id: 'dental', label: 'Dental' },
  { id: 'vision', label: 'Vision' },
  { id: 'retirement_401k', label: '401(k)' },
  { id: 'pto', label: 'PTO (Paid Time Off)' },
]

interface FormData {
  companyName: string
  state: string
  industry: string
  numEmployees: string
  workArrangement: 'remote' | 'in-office' | 'hybrid'
  benefits: string[]
  email: string
}

export default function Home() {
  const [form, setForm] = useState<FormData>({
    companyName: '',
    state: '',
    industry: '',
    numEmployees: '',
    workArrangement: 'hybrid',
    benefits: [],
    email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleBenefitToggle(id: string) {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.includes(id)
        ? prev.benefits.filter(b => b !== id)
        : [...prev.benefits, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.companyName || !form.state || !form.industry || !form.numEmployees || !form.email) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session.')
      window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Employee Handbook Builder</h1>
          <p style={styles.subtitle}>
            Get a custom, AI-generated employee handbook tailored to your company — delivered to your inbox as a Word document.
          </p>
          <div style={styles.priceBadge}>$99 one-time</div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Company Name <span style={styles.required}>*</span>
            </label>
            <input
              style={styles.input}
              type="text"
              placeholder="Acme Corp"
              value={form.companyName}
              onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
              required
            />
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                State <span style={styles.required}>*</span>
              </label>
              <select
                style={styles.select}
                value={form.state}
                onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                required
              >
                <option value="">Select a state…</option>
                {US_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Industry <span style={styles.required}>*</span>
              </label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. Technology, Healthcare…"
                value={form.industry}
                onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                required
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Number of Employees <span style={styles.required}>*</span>
              </label>
              <input
                style={styles.input}
                type="number"
                min="1"
                placeholder="e.g. 25"
                value={form.numEmployees}
                onChange={e => setForm(p => ({ ...p, numEmployees: e.target.value }))}
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Work Arrangement</label>
              <div style={styles.radioGroup}>
                {(['remote', 'in-office', 'hybrid'] as const).map(opt => (
                  <label key={opt} style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="workArrangement"
                      value={opt}
                      checked={form.workArrangement === opt}
                      onChange={() => setForm(p => ({ ...p, workArrangement: opt }))}
                      style={styles.radio}
                    />
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Benefits Offered</label>
            <div style={styles.checkboxGrid}>
              {BENEFITS.map(b => (
                <label key={b.id} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.benefits.includes(b.id)}
                    onChange={() => handleBenefitToggle(b.id)}
                    style={styles.checkbox}
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Your Email <span style={styles.required}>*</span>
            </label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
            <p style={styles.hint}>We&apos;ll send your handbook download link here after purchase.</p>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Redirecting to checkout…' : 'Generate My Handbook — $99'}
          </button>
        </form>

        <p style={styles.footer}>
          Your handbook will be delivered as a .docx file within minutes of purchase.
        </p>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #f0fdf4 100%)',
    padding: '40px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  container: {
    maxWidth: 680,
    width: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 800,
    color: '#111827',
    marginBottom: 12,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 17,
    color: '#4b5563',
    maxWidth: 520,
    margin: '0 auto 16px',
    lineHeight: 1.6,
  },
  priceBadge: {
    display: 'inline-block',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    padding: '6px 18px',
    borderRadius: 100,
  },
  form: {
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e5e7eb',
    padding: 32,
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  },
  required: {
    color: '#dc2626',
  },
  input: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 15,
    background: '#fff',
    outline: 'none',
  },
  radioGroup: {
    display: 'flex',
    gap: 20,
    paddingTop: 8,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 15,
    cursor: 'pointer',
    color: '#374151',
  },
  radio: {
    accentColor: '#2563eb',
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 10,
    paddingTop: 4,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 15,
    cursor: 'pointer',
    color: '#374151',
  },
  checkbox: {
    accentColor: '#2563eb',
    width: 16,
    height: 16,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '10px 14px',
  },
  button: {
    padding: '14px 24px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  footer: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 13,
    color: '#9ca3af',
  },
}
