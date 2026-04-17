@echo off
title Global Shop — Installation demarrage automatique Windows
color 0B
cls

echo.
echo  Installation du demarrage automatique au boot Windows...
echo.

cd /d "%~dp0.."

:: PM2 génère un script de démarrage Windows (Task Scheduler)
pm2 startup windows --no-daemon

:: Sauvegarder l'état actuel de PM2 (l'app doit tourner avant)
pm2 save

echo.
echo  [OK] Global Shop demarrera automatiquement au prochain boot Windows.
echo.
echo  IMPORTANT : L'application doit etre demarree au moins une fois
echo  avec demarrer-prod.bat avant d'utiliser ce script.
echo.
pause
