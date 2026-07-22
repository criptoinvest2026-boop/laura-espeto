@echo off
title Instalar ponte de impressao - Deus Proveu Espetos
setlocal enabledelayedexpansion

set "PASTA=%~dp0"
set "VBS=%PASTA%iniciar-impressora.vbs"
set "PASTASEMBARRA=%PASTA:~0,-1%"

echo ============================================================
echo   Instalacao da ponte de impressao - Deus Proveu Espetos
echo ============================================================
echo.

if not exist "%VBS%" (
  echo [ERRO] Nao encontrei "iniciar-impressora.vbs" nesta pasta.
  echo Deixe este .bat dentro da pasta print-helper e rode de novo.
  echo.
  pause
  exit /b 1
)

echo [1/3] Configurando inicio automatico com o Windows...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=New-Object -ComObject WScript.Shell; $dest=[IO.Path]::Combine($env:APPDATA,'Microsoft\Windows\Start Menu\Programs\Startup','Impressora Deus Proveu Espetos.lnk'); $l=$s.CreateShortcut($dest); $l.TargetPath='%VBS%'; $l.WorkingDirectory='%PASTASEMBARRA%'; $l.Description='Ponte de impressao Deus Proveu Espetos'; $l.Save()"
if errorlevel 1 (
  echo      [AVISO] Nao consegui criar o atalho de inicio automatico.
) else (
  echo      OK - a impressora vai ligar sozinha ao iniciar o PC.
)
echo.

echo [2/3] Iniciando a ponte de impressao agora...
start "" wscript "%VBS%"
echo      OK - ponte iniciada (roda invisivel, sem janela).
echo.

echo [3/3] Testando a conexao com a impressora...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; try { $r=Invoke-RestMethod -Uri 'http://localhost:9100/status' -TimeoutSec 5; if($r.printer){ Write-Host ('      OK - Ponte ativa. Impressora detectada: ' + $r.printer) -ForegroundColor Green } else { Write-Host '      Ponte ativa, mas nenhuma impressora foi detectada ainda.' -ForegroundColor Yellow } } catch { Write-Host '      [AVISO] A ponte nao respondeu. Se o driver da Knup ainda nao foi instalado, isso e normal.' -ForegroundColor Yellow }"
echo.

echo ============================================================
echo   CONCLUIDO
echo.
echo   Falta apenas UM passo manual (se ainda nao fez):
echo   - Instalar o driver da impressora Knup KP-IM607
echo     (passo a passo no arquivo SETUP.md, secao 2.1)
echo ============================================================
echo.
pause
endlocal
