Write-Host "`n🚀 GYMFLOW — Setup Inicial`n" -ForegroundColor Cyan

# 1. Copia .env
if (-not (Test-Path ".\.env")) {
  Copy-Item ".\.env.example" ".\.env"
  Write-Host "✅ .env criado — preencha as variáveis antes de continuar" -ForegroundColor Yellow
} else {
  Write-Host "ℹ️  .env já existe" -ForegroundColor Gray
}

Copy-Item ".\apps\web\.env.example"    ".\apps\web\.env.local"    -Force
Copy-Item ".\apps\mobile\.env.example" ".\apps\mobile\.env.local" -Force

# 2. Instala dependências
Write-Host "`n📦 Instalando dependências..." -ForegroundColor Cyan
npm install

# 3. Gera Prisma Client
Write-Host "`n🗄️  Gerando Prisma Client..." -ForegroundColor Cyan
Set-Location apps\api
npx prisma generate
Set-Location ..\..

Write-Host "`n✅ Setup concluído!`n" -ForegroundColor Green
Write-Host "Próximos passos:" -ForegroundColor White
Write-Host "  1. Preencha as variáveis em .env"
Write-Host "  2. Execute: npm run db:push"
Write-Host "  3. Execute: npm run dev"
Write-Host "  4. Acesse: http://localhost:3000`n"
