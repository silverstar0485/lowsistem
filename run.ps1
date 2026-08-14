# PowerShell Launcher for Busan Ordinance Monitoring System
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " 부산광역시의회 입법정책 지원 [타시도 조례 모니터링 & 신규 조례 발굴 시스템]" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Clear Port 8000 & 3000
Write-Host "[1/3] 포트(8000/3000) 기존 프로세스 정리 중..." -ForegroundColor Gray
$p8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($p8000) { Stop-Process -Id $p8000.OwningProcess -Force -ErrorAction SilentlyContinue }

$p3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($p3000) { Stop-Process -Id $p3000.OwningProcess -Force -ErrorAction SilentlyContinue }

# 2. Run Backend Seeder
Write-Host "[2/3] 백엔드 SQLite 시드 데이터 초기화 중..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\backend"
python app/seeder.py

# 3. Start Backend FastAPI
Write-Host "[3/3] 백엔드(FastAPI :8000) 및 프론트엔드(Next.js :3000) 서버 구동 중..." -ForegroundColor Green
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -Command Set-Location '$PSScriptRoot\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WindowStyle Minimized

Start-Sleep -Seconds 3

# 4. Start Frontend Next.js
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -Command Set-Location '$PSScriptRoot\frontend'; npm run dev"

Start-Sleep -Seconds 4

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " 시스템 구동이 완료되었습니다! 웹 브라우저를 접속합니다." -ForegroundColor Yellow
Write-Host " 주소: http://localhost:3000" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan

Start-Process "http://localhost:3000"
