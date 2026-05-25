import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { put } from '@vercel/blob'
import { Resend } from 'resend'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'
import type { HandbookFormData } from '../generate/route'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const resend = new Resend(process.env.RESEND_API_KEY)

export const config = { api: { bodyParser: false } }

function parseHandbookToDocx(text: string): Document {
  const lines = text.split('\n')
  const children: Paragraph[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      children.push(new Paragraph({ text: '' }))
      continue
    }

    // Detect markdown-style headings
    if (/^#{1}\s/.test(trimmed)) {
      children.push(
        new Paragraph({
          text: trimmed.replace(/^#+\s/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 320, after: 160 },
        }),
      )
    } else if (/^#{2}\s/.test(trimmed)) {
      children.push(
        new Paragraph({
          text: trimmed.replace(/^#+\s/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        }),
      )
    } else if (/^#{3,}\s/.test(trimmed)) {
      children.push(
        new Paragraph({
          text: trimmed.replace(/^#+\s/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
        }),
      )
    } else if (/^[-*]\s/.test(trimmed)) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: trimmed.replace(/^[-*]\s/, ''), size: 24 })],
        }),
      )
    } else {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: trimmed, size: 24 })],
          spacing: { after: 120 },
        }),
      )
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  })
}

async function generateHandbook(formData: HandbookFormData): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Generation failed.')
  }
  const { handbook } = await res.json()
  return handbook
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed.'
    console.error('Webhook error:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta = session.metadata ?? {}
  const email = meta.email || session.customer_email

  if (!email) {
    console.error('No customer email found on session:', session.id)
    return NextResponse.json({ error: 'No customer email.' }, { status: 400 })
  }

  try {
    const formData: HandbookFormData = {
      companyName: meta.companyName ?? '',
      state: meta.state ?? '',
      industry: meta.industry ?? '',
      numEmployees: meta.numEmployees ?? '',
      workArrangement: (meta.workArrangement as HandbookFormData['workArrangement']) ?? 'hybrid',
      benefits: meta.benefits ? (JSON.parse(meta.benefits) as string[]) : [],
      email,
    }

    // 1. Generate handbook text via Anthropic
    const handbookText = await generateHandbook(formData)

    // 2. Convert to .docx
    const doc = parseHandbookToDocx(handbookText)
    const docxBuffer = await Packer.toBuffer(doc)

    // 3. Upload to Vercel Blob
    const fileName = `handbooks/${session.id}-${formData.companyName.replace(/\s+/g, '-').toLowerCase()}.docx`
    const blob = await put(fileName, docxBuffer, {
      access: 'public',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    // 4. Email download link via Resend
    await resend.emails.send({
      from: 'Handbook Builder <handbooks@yourdomain.com>',
      to: email,
      subject: `Your Employee Handbook for ${formData.companyName} is Ready`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #111827; font-size: 24px; margin-bottom: 8px;">Your handbook is ready!</h1>
          <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
            Hi there! Your custom employee handbook for <strong>${formData.companyName}</strong> has been generated and is ready to download.
          </p>
          <a
            href="${blob.url}"
            style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 16px; padding: 14px 28px; border-radius: 8px; text-decoration: none;"
          >
            Download Your Handbook (.docx)
          </a>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
            This link will remain active. If you have any questions, reply to this email.
          </p>
        </div>
      `,
    })

    console.log(`Handbook delivered to ${email} for session ${session.id}`)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Webhook processing error:', err)
    const message = err instanceof Error ? err.message : 'Internal error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
