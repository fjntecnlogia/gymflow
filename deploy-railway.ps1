# GYMFLOW — Deploy Railway Completo
# Uso: .\deploy-railway.ps1 -Token "seu_token_aqui"
param([string]$Token)

if (-not $Token) {
  Write-Host "Uso: .\deploy-railway.ps1 -Token 'seu_token'" -ForegroundColor Red
  exit 1
}

$env:RAILWAY_TOKEN = $Token
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n🚂 GYMFLOW Railway Deploy`n" -ForegroundColor Cyan

# 1. Criar projeto
Write-Host "1/5 Criando projeto Railway..." -ForegroundColor Yellow
Set-Location $root
railway init --name gymflow 2>&1

# 2. Adicionar PostgreSQL
Write-Host "2/5 Adicionando PostgreSQL..." -ForegroundColor Yellow
railway add --database postgresql 2>&1

# 3. Adicionar Redis
Write-Host "3/5 Adicionando Redis..." -ForegroundColor Yellow
railway add --database redis 2>&1

# 4. Configurar variáveis de ambiente
Write-Host "4/5 Configurando variáveis..." -ForegroundColor Yellow
$vars = @{
  NODE_ENV              = "production"
  PORT                  = "3001"
  JWT_SECRET            = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
  EFI_SANDBOX           = "false"
}
foreach ($k in $vars.Keys) {
  railway variables set "$k=$($vars[$k])" 2>&1
}

# 5. Deploy da API
Write-Host "5/5 Fazendo deploy da API..." -ForegroundColor Yellow
Set-Location "$root\apps\api"
railway up --detach 2>&1

Write-Host "`n✅ Deploy iniciado!" -ForegroundColor Green
Write-Host "Acompanhe em: https://railway.app/dashboard" -ForegroundColor Cyan

# Mostrar URL da API
$url = railway domain 2>&1
Write-Host "`nAPI URL: $url" -ForegroundColor Green