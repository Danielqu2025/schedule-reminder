# 邮件设置检查脚本
# 用于检查邀请邮件功能的配置状态

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ProjectFlow 邮件设置检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Supabase CLI 是否安装
Write-Host "1. 检查 Supabase CLI..." -ForegroundColor Yellow
$supabaseCheck = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseCheck) {
    try {
        $supabaseVersion = supabase --version 2>&1
        Write-Host "   ✅ Supabase CLI 已安装: $supabaseVersion" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Supabase CLI 已安装但无法获取版本" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Supabase CLI 未安装" -ForegroundColor Red
    Write-Host "   安装命令: npm install -g supabase" -ForegroundColor Yellow
}

Write-Host ""

# 检查环境变量
Write-Host "2. 检查环境变量..." -ForegroundColor Yellow
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "   ✅ .env 文件存在" -ForegroundColor Green
    
    $envContent = Get-Content $envFile
    $hasSupabaseUrl = $envContent | Select-String -Pattern "^VITE_SUPABASE_URL"
    $hasSupabaseKey = $envContent | Select-String -Pattern "^VITE_SUPABASE_ANON_KEY"
    
    if ($hasSupabaseUrl) {
        Write-Host "   ✅ VITE_SUPABASE_URL 已配置" -ForegroundColor Green
    } else {
        Write-Host "   ❌ VITE_SUPABASE_URL 未配置" -ForegroundColor Red
    }
    
    if ($hasSupabaseKey) {
        Write-Host "   ✅ VITE_SUPABASE_ANON_KEY 已配置" -ForegroundColor Green
    } else {
        Write-Host "   ❌ VITE_SUPABASE_ANON_KEY 未配置" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .env 文件不存在" -ForegroundColor Red
}

Write-Host ""

# 检查 Edge Function 文件
Write-Host "3. 检查 Edge Function 文件..." -ForegroundColor Yellow
$edgeFunctionPath = "supabase\functions\send-invitation-email\index.ts"
if (Test-Path $edgeFunctionPath) {
    Write-Host "   ✅ Edge Function 文件存在" -ForegroundColor Green
} else {
    Write-Host "   ❌ Edge Function 文件不存在: $edgeFunctionPath" -ForegroundColor Red
}

Write-Host ""

# 检查 Supabase 项目链接
Write-Host "4. 检查 Supabase 项目链接..." -ForegroundColor Yellow
$supabaseCheck = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseCheck) {
    Write-Host "   ⚠️  请运行以下命令检查项目链接:" -ForegroundColor Yellow
    Write-Host "   supabase projects list" -ForegroundColor White
    Write-Host "   如果未链接，运行: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor White
} else {
    Write-Host "   ⚠️  请先安装 Supabase CLI" -ForegroundColor Yellow
}

Write-Host ""

# 显示下一步操作
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "下一步操作：" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 部署 Edge Function:" -ForegroundColor Yellow
Write-Host "   supabase functions deploy send-invitation-email" -ForegroundColor White
Write-Host ""
Write-Host "2. 配置 SMTP（Supabase Dashboard）:" -ForegroundColor Yellow
Write-Host "   Authentication > SMTP" -ForegroundColor White
Write-Host ""
Write-Host "3. 查看详细设置指南:" -ForegroundColor Yellow
Write-Host "   docs\QUICK_EMAIL_SETUP.md" -ForegroundColor White
Write-Host ""
