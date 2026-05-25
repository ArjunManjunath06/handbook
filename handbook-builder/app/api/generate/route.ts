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

    const prompt = `You are an expert HR consultant and employment attorney. Create a comprehensive, professional employee handbook for the following company:

Company Details:
- Company Name: ${companyName}
- State: ${state} (ensure all policies comply with ${state} state law)
- Industry: ${industry}
- Number of Employees: ${numEmployees}
- Work Arrangement: ${workArrangementLabel}
- Benefits Offered: ${benefitsList}

Generate a complete employee handbook that includes the following sections:

1. Welcome Letter from Leadership
2. Company Overview & Mission
3. Employment Policies
   - At-will employment statement (if applicable under ${state} law)
   - Equal Employment Opportunity (EEO) policy
   - Anti-harassment and anti-discrimination policy
   - Background check policy
4. Compensation & Pay Practices
   - Pay schedules
   - Overtime policy (compliant with ${state} and federal FLSA)
   - Performance reviews
5. Work Hours & Schedules
   - Standard work hours appropriate for ${workArrangementLabel} arrangement
   - Attendance and punctuality expectations
   - Remote work / hybrid work guidelines (if applicable)
6. Benefits
   - Detailed description of each benefit: ${benefitsList}
   - Eligibility requirements
   - How to enroll
7. Time Off Policies
   - Vacation/PTO accrual (if PTO offered)
   - Sick leave (compliant with ${state} sick leave laws)
   - Holidays
   - Leave of absence policies (FMLA, parental leave, etc.)
8. Code of Conduct
   - Professional standards
   - Dress code appropriate for ${workArrangementLabel} environment
   - Conflict of interest policy
   - Confidentiality and data protection
9. Technology & Equipment Use
   - Acceptable use policy
   - Social media guidelines
   - Company equipment responsibility
10. Health & Safety
    - Workplace safety (OSHA compliance)
    - Emergency procedures
    - Workers' compensation
11. Disciplinary Procedures
    - Progressive discipline policy
    - Grievance procedures
12. Termination & Separation
    - Voluntary resignation process
    - Involuntary termination
    - Final paycheck requirements under ${state} law
13. Acknowledgment of Receipt (signature page)

Make the handbook specific to ${companyName}, professional, legally sound for ${state}, and appropriately detailed for a ${numEmployees}-person ${industry} company. Use clear, accessible language. Format with proper headings and subheadings.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
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
