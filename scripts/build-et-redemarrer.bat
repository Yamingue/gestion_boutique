@echo off
title Global Shop — Build + Redemarrage
color 0E
cls

echo.
echo  ==========================================
echo   BUILD + REDEMARRAGE - Global Shop
echo  ==========================================
echo.

cd /d "%~dp0.."

echo [1/3] Construction du projet...
call npm run build
if errorlevel 1 (
    echo.
    echo [ERREUR] Build echoue. Serveur NON redémarre.
    pause
    exit /b 1
)

echo.
echo [2/3] Migration de la base de donnees...
call npx prisma migrate deploy
if errorlevel 1 (
    echo [AVERTISSEMENT] Migration echouee ou deja a jour.
)

echo.
echo [3/3] Redemarrage du serveur...
pm2 restart global-shop
if errorlevel 1 (
    pm2 start ecosystem.config.cjs --env production
)

echo.
echo  [OK] Mise a jour deployee avec succes !
echo.
pm2 list
echo.
pause
