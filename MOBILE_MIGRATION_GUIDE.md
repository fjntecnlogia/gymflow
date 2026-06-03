# 📱 GymFlow Mobile — Migração de Auth (Supabase → JWT próprio)

> Documento pra o time mobile do app GymFlow.
> Última atualização: 2026-06-03

---

## 🚨 O QUE MUDOU (resumo executivo)

### Antes
- Owners de academia (donos) e alunos logavam via **Supabase Auth**
- App mobile usava `@supabase/supabase-js` pra autenticar alunos
- Tabela `Aluno` tinha `supabaseId` (UUID do user no Supabase)

### Agora
- **Owners migraram pra auth próprio** (Postgres + bcrypt + JWT do backend Fastify)
- **Alunos AINDA usam Supabase Auth** (não foram migrados ainda)
- **Supabase está pausado** (free tier expirou em 25/ago/2026)

### Impacto pro mobile
- 🔴 **Login de aluno via Supabase pode parar de funcionar a qualquer momento** (quando o Supabase apagar o projeto)
- 🟡 Por enquanto continua respondendo, mas é fallback frágil
- ✅ Backend mantém compatibilidade via `authMiddleware` que aceita JWT próprio E JWT Supabase

---

## 📋 O Que o Time Mobile Precisa Fazer

### Curto prazo (próximas 2 semanas)

#### 1. Não desenvolver features de NOVOS USUÁRIOS via Supabase
- O endpoint `POST /auth/registrar-aluno` ainda existe mas é **legacy**
- Se precisar registrar alunos novos, **espera a gente liberar `/auth/aluno/primeiro-acesso`** (em planejamento)

#### 2. Adicionar fallback de erro no app
Hoje o app provavelmente trata erro 401 do backend assumindo "token expirado".
Adiciona um caso extra: **erro Supabase Auth indisponível** (vai começar a acontecer):

```typescript
// pseudo-código
async function login(email, senha) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    return { token: data.session.access_token };
  } catch (err) {
    if (err.code === 'AUTH_UNAVAILABLE' || err.message?.includes('paused')) {
      // mostra mensagem clara pro user
      throw new Error('Sistema em manutenção. Entre em contato com sua academia.');
    }
    throw err;
  }
}
```

#### 3. Versão do app que detecta API down
Add health-check pra `/health` do backend antes de tentar login:
```typescript
const res = await fetch('https://api.gymflowgestor.com.br/health');
if (!res.ok) showOfflineMessage();
```

### Médio prazo (próximo mês)

#### Migrar auth de aluno pra mesmo padrão dos owners

Quando isso for liberado, o app vai precisar:

1. **Remover dependência** `@supabase/supabase-js`
2. **Substituir login** por chamada direta:
   ```typescript
   const res = await fetch('https://api.gymflowgestor.com.br/auth/aluno/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, senha })
   });
   const { token, aluno } = await res.json();
   // salvar token (AsyncStorage / SecureStore)
   ```

3. **Trocar requests autenticadas** pra usar JWT próprio:
   ```typescript
   fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
   ```

4. **Forçar fluxo de "primeiro acesso"** pra alunos antigos:
   - Detectar 401 ou 403 com código `SENHA_NAO_DEFINIDA`
   - Levar usuário pra tela "Esqueci minha senha" → ele recebe email com link
   - Link abre o app via Deep Link `gymflow://criar-senha?token=XXX`
   - Aluno define senha e fica logado

---

## 🆕 Endpoints Backend Disponíveis HOJE

### Auth de OWNER (já implementado — mas mobile não usa)
```
POST /auth/login                  → {token, usuario}
POST /auth/primeiro-acesso        → {token, usuario}
POST /auth/esqueci-senha          → {ok: true}
POST /auth/redefinir-senha        → {ok: true}
```

### Auth de ALUNO (LEGACY — usa Supabase)
```
POST /auth/registrar-aluno        → cria via Supabase (deprecated)
```

### Auth de ALUNO (FUTURO — aguardando spec)
```
POST /auth/aluno/login            → ainda não existe
POST /auth/aluno/primeiro-acesso  → ainda não existe
POST /auth/aluno/esqueci-senha    → ainda não existe
POST /auth/aluno/redefinir-senha  → ainda não existe
```

---

## 📊 Tabela `Aluno` no Prisma (precisará evoluir)

```prisma
model Aluno {
  id           String   @id @default(cuid())
  academiaId   String
  supabaseId   String?  @unique  // ← vai virar nullable também
  nome         String
  email        String?
  telefone     String

  // CAMPOS QUE SERÃO ADICIONADOS na próxima migração:
  // senhaHash                 String?
  // tokenPrimeiroAcesso       String? @unique
  // tokenPrimeiroAcessoExpira DateTime?
  // tokenResetSenha           String? @unique
  // tokenResetSenhaExpira     DateTime?
  // ultimoLoginEm             DateTime?

  // ... resto dos campos
}
```

---

## 🔗 Deep Links Necessários no App

Quando migrarmos, o backend vai mandar e-mails com links. O app mobile precisa suportar:

| Link e-mail | Deep Link no app | Ação |
|---|---|---|
| `https://www.gymflowgestor.com.br/aluno/criar-senha?token=XXX` | `gymflow://aluno/criar-senha?token=XXX` | Tela de criar senha |
| `https://www.gymflowgestor.com.br/aluno/redefinir-senha?token=XXX` | `gymflow://aluno/redefinir-senha?token=XXX` | Tela de redefinir senha |

**Setup React Native:**
```javascript
// app.json (Expo)
{
  "expo": {
    "scheme": "gymflow",
    "ios": { "bundleIdentifier": "br.com.gymflowgestor.app" },
    "android": { "package": "br.com.gymflowgestor.app" }
  }
}

// usar expo-linking ou react-navigation linking
```

---

## ⚠️ Cuidados Imediatos

### 1. Cadastro de aluno via mobile pode falhar
Se o time SaaS cadastrar novos alunos via painel web (`/alunos`) e tentar criar credenciais Supabase, pode falhar porque o Supabase está pausado.

**Solução temporária:** o backend está retornando os dados do aluno sem senha Supabase. O aluno ainda não consegue logar no mobile, mas o cadastro funciona pro controle de acesso via QR Code.

### 2. Token Supabase expira em ~1h
Alunos que abriram o app HOJE continuam logados até o token expirar (~1h). Depois disso, refresh vai falhar e ele será desconectado.

**Solução:** preparar mensagem clara "Sessão expirou — peça nova senha pra sua academia" enquanto o auth próprio de aluno não está pronto.

### 3. App mobile NÃO PODE assumir que Supabase volta
Não fica esperando "vai voltar" — planeja como se ele NUNCA voltasse.

---

## 📞 Pra Sincronizar com o Backend

Quando o time mobile estiver pronto pra migrar, alinha com o time backend pra:

1. Criar os endpoints `/auth/aluno/*`
2. Adicionar campos `senhaHash`, `tokenPrimeiroAcesso*` na tabela `Aluno`
3. Disparar email de primeiro acesso pra TODOS os alunos existentes (massivo)
4. Definir janela de migração coordenada (frontend + backend liberados juntos)

---

## 🆘 Suporte / Dúvidas

- WhatsApp do time: (65) 99695-2828
- Email admin: `fjntecnologia2022@gmail.com`
- Repo: github.com/fjntecnlogia/gymflow

---

## ✅ Checklist Resumido pro Time Mobile

- [ ] Ler este documento completo
- [ ] Verificar versão do app no Play Store / App Store
- [ ] Adicionar fallback de erro pra "Supabase pausado"
- [ ] Adicionar health-check no startup do app
- [ ] Não desenvolver NOVAS features de cadastro/login que dependam de Supabase
- [ ] Agendar reunião com time backend pra alinhar timeline da migração de aluno
- [ ] Implementar deep links `gymflow://aluno/*` no app
- [ ] Quando backend liberar endpoints `/auth/aluno/*`, planejar release coordenado
