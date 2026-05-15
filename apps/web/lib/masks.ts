// ─── Utilitários de máscara / formatação ───────────────────────────────────

/** Remove tudo que não é dígito */
export function apenasNumeros(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Máscara de telefone brasileiro
 * 10 dígitos → (XX) XXXX-XXXX  (fixo)
 * 11 dígitos → (XX) XXXXX-XXXX (celular)
 */
export function mascaraTelefone(valor: string): string {
  const nums = apenasNumeros(valor).slice(0, 11)
  if (nums.length === 0) return ''
  if (nums.length <= 2) return `(${nums}`
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
  if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
}

/**
 * Máscara de CPF: XXX.XXX.XXX-XX
 */
export function mascaraCPF(valor: string): string {
  const nums = apenasNumeros(valor).slice(0, 11)
  if (nums.length === 0) return ''
  if (nums.length <= 3) return nums
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`
}

/**
 * Máscara de CNPJ: XX.XXX.XXX/XXXX-XX
 */
export function mascaraCNPJ(valor: string): string {
  const nums = apenasNumeros(valor).slice(0, 14)
  if (nums.length === 0) return ''
  if (nums.length <= 2) return nums
  if (nums.length <= 5) return `${nums.slice(0, 2)}.${nums.slice(2)}`
  if (nums.length <= 8) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5)}`
  if (nums.length <= 12) return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8)}`
  return `${nums.slice(0, 2)}.${nums.slice(2, 5)}.${nums.slice(5, 8)}/${nums.slice(8, 12)}-${nums.slice(12)}`
}

/**
 * Retorna apenas os dígitos do telefone (para enviar à API)
 * Ex: "(65) 99595-9595" → "65995959595"
 */
export function telefoneSemMascara(valor: string): string {
  return apenasNumeros(valor)
}
