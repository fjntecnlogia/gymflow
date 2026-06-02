import { Resend } from 'resend'

/**
 * Serviço de e-mail via Resend.
 *
 * Tolerante a ausência de RESEND_API_KEY: se a chave não estiver setada,
 * faz console.warn e retorna false — nunca lança nem bloqueia o caller.
 *
 * Variáveis de ambiente:
 *   RESEND_API_KEY  → chave criada em https://resend.com/api-keys
 *   EMAIL_FROM      → ex: "GymFlow Gestor <noreply@gymflowgestor.com.br>"
 *                     (default: noreply@gymflowgestor.com.br)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'GymFlow Gestor <noreply@gymflowgestor.com.br>'

let _client: Resend | null = null
function client(): Resend | null {
  if (!RESEND_API_KEY) return null
  if (!_client) _client = new Resend(RESEND_API_KEY)
  return _client
}

interface EnviarEmailParams {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function enviarEmail(params: EnviarEmailParams): Promise<boolean> {
  const c = client()
  if (!c) {
    console.warn('[Email] RESEND_API_KEY não configurada — e-mail NÃO enviado:', params.subject)
    return false
  }

  try {
    const { error } = await c.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    })

    if (error) {
      console.error('[Email] Erro do Resend:', error)
      return false
    }
    return true
  } catch (err: any) {
    console.error('[Email] Falha ao enviar:', err?.message ?? err)
    return false
  }
}

// ────────────────────────────────────────────────────────────
// Templates HTML (inline, mobile-friendly, dark/light agnóstico)
// ────────────────────────────────────────────────────────────

const COR_PRIMARY = '#00E5FF'
const COR_TEXT = '#0B1340'
const COR_MUTED = '#6B7280'
const COR_BG = '#F5F7FA'
const COR_CARD = '#FFFFFF'

function wrap(corpoHtml: string, preheader?: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>GymFlow Gestor</title>
</head>
<body style="margin:0;padding:0;background:${COR_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COR_TEXT};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${COR_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:${COR_CARD};border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #E5E7EB;">
              <span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;">
                <span style="color:${COR_PRIMARY};">Gym</span><span style="color:${COR_TEXT};">Flow</span>
                <span style="color:${COR_MUTED};font-weight:500;">Gestor</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${corpoHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#FAFBFC;border-top:1px solid #E5E7EB;font-size:12px;color:${COR_MUTED};line-height:1.6;">
              <strong>FJN Tecnologia</strong> · gymflowgestor.com.br · (65) 99695-2828<br>
              Você está recebendo este e-mail porque solicitou contato no site.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Template: confirmação ao cliente que pediu demo.
 */
export function templateConfirmacaoCliente(nome: string, telefone: string): string {
  const primeiro = nome.split(' ')[0] || nome
  return wrap(
    `
    <p style="font-size:15px;margin:0 0 16px;">Olá, <strong>${primeiro}</strong>!</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
      Recebemos sua solicitação de demonstração do <strong>GymFlow Gestor</strong>.
      Nosso time vai entrar em contato em até <strong>1 hora útil</strong> pelo
      telefone <strong>${telefone}</strong>.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
      <tr>
        <td style="padding:20px;background:#F0FCFF;border:1px solid #B8F0FF;border-radius:12px;">
          <strong style="display:block;font-size:13px;color:${COR_TEXT};margin-bottom:12px;">O que esperar da nossa conversa:</strong>
          <ul style="margin:0;padding-left:18px;font-size:14px;color:${COR_MUTED};line-height:1.7;">
            <li>Demonstração ao vivo, com sistema real rodando</li>
            <li>Personalizada pra realidade da <em>sua</em> academia</li>
            <li>Resposta a todas as suas dúvidas (técnicas, comerciais, integrações)</li>
            <li>Proposta sob medida pelo seu volume de alunos</li>
          </ul>
        </td>
      </tr>
    </table>
    <p style="font-size:14px;color:${COR_MUTED};margin:0 0 8px;">Não vê a hora? Fala direto com a gente:</p>
    <p style="margin:0 0 24px;">
      <a href="https://wa.me/5565996952828" style="display:inline-block;background:${COR_PRIMARY};color:#0B1340;padding:12px 24px;border-radius:10px;font-weight:700;text-decoration:none;font-size:14px;">
        Abrir conversa no WhatsApp →
      </a>
    </p>
    <p style="font-size:12px;color:${COR_MUTED};margin:0;">
      Atenciosamente,<br>
      <strong>Equipe GymFlow Gestor</strong>
    </p>
  `,
    'Recebemos seu pedido de demonstração — retornamos em 1h útil.',
  )
}

/**
 * Template: alerta interno ao admin de novo lead recebido.
 */
export function templateLeadAdmin(dados: {
  nome: string
  telefone: string
  email?: string | null
  academiaNome: string
  cidade: string
  numAlunos: string
  horarioPreferido: string
  observacao?: string | null
}): string {
  const faixa: Record<string, string> = {
    '0-50': 'Até 50 alunos',
    '50-200': '50 a 200 alunos',
    '200-500': '200 a 500 alunos',
    '500+': 'Mais de 500 alunos',
  }
  return wrap(
    `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 16px;">
      <tr><td style="padding:12px 16px;background:#FFF5E6;border:1px solid #FFD9A8;border-radius:10px;font-size:13px;color:#A66200;font-weight:600;">
        🚨 NOVO LEAD — responder em até 1h útil
      </td></tr>
    </table>
    <h2 style="font-size:20px;margin:0 0 4px;font-weight:700;">${dados.nome}</h2>
    <p style="font-size:14px;color:${COR_MUTED};margin:0 0 24px;">${dados.academiaNome} · ${dados.cidade}</p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:14px;">
      <tr><td style="padding:8px 0;color:${COR_MUTED};width:38%;">📱 Telefone</td><td style="padding:8px 0;color:${COR_TEXT};font-weight:600;"><a href="tel:+55${dados.telefone.replace(/\D/g, '')}" style="color:${COR_TEXT};text-decoration:none;">${dados.telefone}</a></td></tr>
      ${dados.email ? `<tr><td style="padding:8px 0;color:${COR_MUTED};">✉️ E-mail</td><td style="padding:8px 0;"><a href="mailto:${dados.email}" style="color:${COR_TEXT};">${dados.email}</a></td></tr>` : ''}
      <tr><td style="padding:8px 0;color:${COR_MUTED};">👥 Alunos</td><td style="padding:8px 0;">${faixa[dados.numAlunos] ?? dados.numAlunos}</td></tr>
      <tr><td style="padding:8px 0;color:${COR_MUTED};">🕐 Horário</td><td style="padding:8px 0;">${dados.horarioPreferido}</td></tr>
    </table>

    ${dados.observacao ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:20px 0 0;">
      <tr><td style="padding:14px 16px;background:#F5F7FA;border-left:3px solid ${COR_PRIMARY};border-radius:6px;font-size:14px;color:${COR_TEXT};font-style:italic;line-height:1.6;">
        "${dados.observacao}"
      </td></tr>
    </table>` : ''}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 16px;">
      <tr>
        <td style="padding-right:8px;">
          <a href="https://wa.me/55${dados.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${dados.nome.split(' ')[0]}! Aqui é da FJN Tecnologia / GymFlow Gestor. Recebemos seu pedido de demonstração para a academia ${dados.academiaNome}.`)}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 20px;border-radius:10px;font-weight:700;text-decoration:none;font-size:13px;">
            💬 Responder no WhatsApp
          </a>
        </td>
        <td>
          <a href="https://www.gymflowgestor.com.br/admin/agendamentos" style="display:inline-block;background:${COR_TEXT};color:#fff;padding:12px 20px;border-radius:10px;font-weight:700;text-decoration:none;font-size:13px;">
            Ver no painel
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:${COR_MUTED};margin:0;">
      Lead recebido em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Cuiaba' })}
    </p>
  `,
    `Novo lead: ${dados.nome} (${dados.academiaNome}, ${dados.cidade})`,
  )
}
