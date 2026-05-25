import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import type { HandbookFormData } from '../generate/route'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST(req: NextRequest) {
  try {
    const body: HandbookFormData = await req.json()
    const { companyName, state, industry, numEmployees, workArrangement, benefits, email } = body

    if (!companyName || !state || !industry || !numEmployees || !email) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 9900,
            product_data: {
              name: 'Employee Handbook',
              description: `Custom employee handbook for ${companyName} (${state} • ${industry})`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        companyName,
        state,
        industry,
        numEmployees,
        workArrangement,
        benefits: JSON.stringify(benefits),
        email,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('Checkout error:', err)
    const message = err instanceof Error ? err.message : 'Failed to create checkout session.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
