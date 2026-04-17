@echo off
title Global Shop — Demarrage Production
color 0A
cls

echo.
echo  ==========================================
echo   GLOBAL SHOP - Tching's Fils Multiservices
echo   Demarrage en mode PRODUCTION
echo  ==========================================
echo.

:: Aller dans le dossier du projet
cd /d "%~dp0.."

:: Vérifier que Node est dispo
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js introuvable. Verifiez que Laragon est bien demarre.
    pause
    exit /b 1
)

:: Vérifier que le build existe
if not exist ".next" (
    echo [INFO] Aucun build trouve. Lancement du build...
    echo.
    call npm run build
    if errorlevel 1 (
        echo [ERREUR] Le build a echoue.
        pause
        exit /b 1
    )
)

:: Créer le dossier de logs si besoin
if not exist "logs" mkdir logs

:: Vérifier si l'app tourne déjà
pm2 describe global-shop >nul 2>&1
if not errorlevel 1 (
    echo [INFO] L'application tourne deja. Redemarrage...
    pm2 restart global-shop
) else (
    echo [INFO] Demarrage de l'application...
    pm2 start ecosystem.config.cjs --env production
)

echo.
echo [OK] Global Shop demarre sur http://localhost:3000
echo.
pm2 list
echo.
echo  Pour voir les logs : pm2 logs global-shop
echo  Pour arreter      : pm2 stop global-shop
echo  Pour monitoring   : pm2 monit
echo.
pause
