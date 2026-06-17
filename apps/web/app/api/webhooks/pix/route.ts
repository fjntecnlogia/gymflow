import { NextRequest, NextResponse } from 'next/server'
import { api } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-webhook-signature')
    if (!signature && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Signature missing' }, { status: 401 })
    }

    const body = await req.json()
    const pixData = body?.pix?.[0]
    if (!pixData?.txid || typeof pixData.txid !== 'string') {
      return NextResponse.json({ ok: true })
    }

    await api.post('/pagamentos/confirmar-pix', { txid: pixData.txid })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
