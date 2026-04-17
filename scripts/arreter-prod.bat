@echo off
title Global Shop — Arret
color 0C
echo.
echo  Arret de Global Shop...
cd /d "%~dp0.."
pm2 stop global-shop
pm2 delete global-shop
echo.
echo  [OK] Application arretee.
echo.
pause
