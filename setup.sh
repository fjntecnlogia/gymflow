#!/bin/bash
echo ""
echo "🚀 GYMFLOW — Setup Inicial"
echo ""

[ ! -f .env ] && cp .env.example .env && echo "✅ .env criado — preencha as variáveis"
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local

echo "📦 Instalando dependências..."
npm install

echo "🗄️  Gerando Prisma Client..."
cd apps/api && npx prisma generate && cd ../..

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Próximos passos:"
echo "  1. Preencha as variáveis em .env"
echo "  2. npm run db:push"
echo "  3. npm run dev"
echo "  4. Acesse http://localhost:3000"
echo ""
