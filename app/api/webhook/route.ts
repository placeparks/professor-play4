import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Next.js App Router configuration
// Runtime: nodejs is required for Stripe webhook verification
// Dynamic: force-dynamic ensures the route is not statically optimized
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Update order in database after payment
async function updateOrderAfterPayment(session: Stripe.Checkout.Session) {
  try {
    // Retrieve the full session with line items
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'customer']
    })

    // Get order from database
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single()

    // Prepare order update data
    const orderUpdate: any = {
      payment_status: session.payment_status,
      status: session.payment_status === 'paid' ? 'paid' : 'pending',
      updated_at: new Date().toISOString()
    }

    // Only update these fields if they exist in the session
    if (session.customer_details?.email || session.customer_email) {
      orderUpdate.customer_email = session.customer_details?.email || session.customer_email
    }
    if (session.customer_details?.name) {
      orderUpdate.customer_name = session.customer_details?.name
    }
    if (session.customer_details?.phone) {
      orderUpdate.customer_phone = session.customer_details?.phone
    }
    if (session.shipping_details?.address) {
      orderUpdate.shipping_address = session.shipping_details.address
    }
    if (session.customer_details?.address) {
      orderUpdate.billing_address = session.customer_details.address
    }
    if (session.amount_total) {
      orderUpdate.total_amount_cents = session.amount_total
    }

    if (existingOrder) {
      // Update existing order
      const { data, error } = await supabase
        .from('orders')
        .update(orderUpdate)
        .eq('stripe_session_id', session.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating order:', error)
        throw error
      }

      return data
    } else {
      // Create new order if it doesn't exist
      const { data, error } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: session.id,
          ...orderUpdate,
          quantity: parseInt(session.metadata?.quantity || '0'),
          price_per_card: parseFloat(session.metadata?.pricePerCard || '0'),
          shipping_country: session.metadata?.shippingCountry || session.shipping_details?.address?.country,
          card_images: [],
          card_images_base64: [],
          card_data: [],
          image_storage_path: session.metadata?.imageStoragePath || null,
          metadata: session.metadata || {}
        } as any)
        .select()
        .single()

      if (error) {
        console.error('Error creating order:', error)
        throw error
      }

      return data
    }
  } catch (error) {
    console.error('Failed to update order after payment:', error)
    throw error
  }
}

export async function POST(req: NextRequest) {
  // Get raw body as text for Stripe signature verification
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      try {
        await updateOrderAfterPayment(session)
        console.log('✅ Order updated after payment:', session.id)
      } catch (error) {
        console.error('Error updating order:', error)
      }
      break

    case 'payment_intent.succeeded':
      // Payment intent success is already handled by checkout.session.completed
      break

    case 'payment_intent.payment_failed':
      console.warn('Payment failed:', event.data.object)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

