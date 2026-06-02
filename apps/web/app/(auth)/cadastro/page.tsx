import { permanentRedirect } from 'next/navigation'

/**
 * /cadastro foi consolidado em /planos-saas (que já contém escolha de plano + checkout).
 * Mantemos este arquivo apenas como redirect 308 pra:
 *  - não dar 404 em links antigos compartilhados
 *  - preservar SEO se o Google já tinha indexado /cadastro
 *  - aceitar o histórico de digitação direta dos usuários
 *
 * Se um dia voltar a fazer sentido ter um form de captação de lead aqui,
 * basta substituir o permanentRedirect por um <form>.
 */
export default function CadastroRedirect() {
  permanentRedirect('/planos-saas')
}
