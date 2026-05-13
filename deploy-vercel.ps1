# GYMFLOW — Deploy Vercel
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "`n▲ GYMFLOW Vercel Deploy`n" -ForegroundColor Cyan

# Deploy web em produção
Write-Host "Fazendo deploy do Web App..." -ForegroundColor Yellow
Set-Location apps\web
vercel --prod --yes `
  -e NEXT_PUBLIC_API_URL=$env:API_URL `
  -e NEXT_PUBLIC_SUPABASE_URL=$env:SUPABASE_URL `
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=$env:SUPABASE_ANON_KEY `
  2>&1

Write-Host "`n✅ Web App implantado no Vercel!" -ForegroundColor Green