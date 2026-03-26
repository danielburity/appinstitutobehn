
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Webhook function initialized")

serve(async (req: Request) => {
  try {
    const body = await req.json()
    const eventType = body.type
    console.log(`[WEBHOOK] Evento: ${eventType} | ID: ${body.id}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // DEBUG: Salvar payload para análise
    try {
      await supabase.from('webhook_debug').insert({
        event_type: eventType,
        payload: body
      })
    } catch (debugErr) {
      console.error("Falha ao salvar debug:", debugErr)
    }

    // Pagar.me V5: O objeto principal está em body.data
    const data = body.data || {}

    // Função para buscar user_id em qualquer lugar do objeto (metadata pode estar no pedido ou na assinatura)
    const findUserId = (obj: any): string | null => {
      if (!obj || typeof obj !== 'object') return null
      if (obj.user_id) return obj.user_id
      if (obj.metadata?.user_id) return obj.metadata.user_id
      if (obj.data?.metadata?.user_id) return obj.data.metadata.user_id

      // Busca em sub-objetos comuns (subscription, order, etc)
      for (const key of ['subscription', 'order', 'charge', 'object', 'data', 'customer']) {
        if (obj[key]) {
          const res = findUserId(obj[key])
          if (res) return res
        }
      }
      return null
    }

    const findEmail = (obj: any): string | null => {
      if (!obj || typeof obj !== 'object') return null

      // Checagem direta
      if (obj.customer_email) return obj.customer_email
      if (obj.customer?.email) return obj.customer.email
      if (obj.email) return obj.email

      // Checagem em metadados
      if (obj.metadata?.customer_email) return obj.metadata.customer_email
      if (obj.metadata?.email) return obj.metadata.email

      // Caminhos comuns do Pagar.me V5
      if (obj.data?.customer?.email) return obj.data.customer.email
      if (obj.data?.email) return obj.data.email
      if (obj.subscription?.customer?.email) return obj.subscription.customer.email
      if (obj.order?.customer?.email) return obj.order.customer.email
      if (obj.charge?.customer?.email) return obj.charge.customer.email

      // Busca recursiva limitada para evitar loop infinito
      for (const key of ['subscription', 'order', 'charge', 'object', 'data', 'customer', 'last_transaction']) {
        if (obj[key] && typeof obj[key] === 'object') {
          const res = findEmail(obj[key])
          if (res) return res
        }
      }
      return null
    }

    const userId = findUserId(body)

    const successTypes = [
      'order.paid',
      'subscription.paid',
      'subscription.created',
      'subscription.activated',
      'invoice.paid',
      'charge.paid',
      'pix.received',
      'transaction.paid'
    ]

    let finalUserId = userId
    const customerEmail = findEmail(body)

    if (!finalUserId && customerEmail) {
      console.log(`[WEBHOOK] user_id ausente. Buscando perfil pelo e-mail: ${customerEmail}`)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customerEmail.toLowerCase())
        .single()

      if (profile) {
        finalUserId = profile.id
        console.log(`[WEBHOOK] Perfil encontrado! ID: ${finalUserId}`)
      }
    }

    if (successTypes.includes(eventType)) {
      if (!finalUserId) {
        console.warn(`[WEBHOOK] [PENDENTE] Pagamento recebido para ${customerEmail}, mas usuário ainda não tem conta ou ID não foi encontrado no payload.`)
        return new Response(JSON.stringify({ message: 'Payment ignored: No user found', email: customerEmail }), { status: 200 })
      }

      console.log(`[WEBHOOK] [SUCESSO] Tentando ativar usuário: ${finalUserId} (${customerEmail || 'N/A'}) via evento ${eventType}`)

      const { data: updateData, error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_id: data.id || data.subscription?.id || data.order?.id || body.id,
          role: 'member' // Garante que o role seja member ao ativar
        })
        .eq('id', finalUserId)
        .select()

      if (error) {
        console.error(`[WEBHOOK] [ERRO DB] Falha ao atualizar ${finalUserId}:`, error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }

      console.log(`[WEBHOOK] [OK] Usuário ${finalUserId} ativado com sucesso.`, updateData)
      return new Response(JSON.stringify({ message: 'Success', user_id: finalUserId }), { status: 200 })
    }

    const failureTypes = ['order.payment_failed', 'subscription.canceled', 'invoice.payment_failed', 'subscription.deleted']
    if (failureTypes.includes(eventType) && finalUserId) {
      await supabase.from('profiles').update({ subscription_status: 'inactive' }).eq('id', finalUserId)
      console.log(`[WEBHOOK] [FALHA] Usuário ${finalUserId} marcado como inativo.`)
    }

    return new Response(JSON.stringify({ message: 'Event ignored or processed' }), { status: 200, headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error(`[WEBHOOK] [ERRO CRÍTICO]`, err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
})
