import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface HandbookFormData {
  companyName: string
  state: string
  industry: string
  numEmployees: string
  workArrangement: 'remote' | 'in-office' | 'hybrid'
  benefits: string[]
  email: string
}

const BENEFIT_LABELS: Record<string, string> = {
  health_insurance: 'Health Insurance',
  dental: 'Dental Insurance',
  vision: 'Vision Insurance',
  retirement_401k: '401(k) Retirement Plan',
  pto: 'Paid Time Off (PTO)',
}

export async function POST(req: NextRequest) {
  try {
    const body: HandbookFormData = await req.json()
    const { companyName, state, industry, numEmployees, workArrangement, benefits } = body

    if (!companyName || !state || !industry || !numEmployees) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const benefitsList = benefits.length > 0
      ? benefits.map(b => BENEFIT_LABELS[b] ?? b).join(', ')
      : 'No specific benefits specified'

    const workArrangementLabel = {
      remote: 'fully remote',
      'in-office': 'fully in-office',
      hybrid: 'hybrid (mix of remote and in-office)',
    }[workArrangement]

    const systemPrompt = `You are an expert HR attorney and compliance specialist. Generate a complete, professional employee handbook for a US-based small business. The handbook must be legally compliant for the specified state. Include these sections: Welcome & Company Overview, At-Will Employment Statement, Equal Opportunity Employment, Anti-Harassment & Anti-Discrimination Policy (include state-specific requirements), Work Hours & Attendance, Compensation & Pay Periods, Benefits Overview, PTO & Leave Policy (include state-specific sick leave laws), Code of Conduct, Confidentiality Policy, Technology & Social Media Policy, Safety Policy, Discipline & Termination Procedures, and Acknowledgment Signature Page. Write in clear professional language a non-lawyer can understand. Customize every section for the company details provided.`

    const userPrompt = `Generate a complete employee handbook for the following company:

Company Name: ${companyName}
State: ${state}
Industry: ${industry}
Number of Employees: ${numEmployees}
Work Arrangement: ${workArrangementLabel}
Benefits Offered: ${benefitsList}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const handbookText = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n')

    return NextResponse.json({ handbook: handbookText })
  } catch (err: unknown) {
    console.error('Generate error:', err)
    const message = err instanceof Error ? err.message : 'Failed to generate handbook.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
