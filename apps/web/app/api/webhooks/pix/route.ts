import { NextRequest, NextResponse } from 'next/server'
import { api } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const pixData = body?.pix?.[0]
    if (!pixData?.txid) return NextResponse.json({ ok: true })

    await api.post('/pagamentos/confirmar-pix', { txid: pixData.txid })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook PIX error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
