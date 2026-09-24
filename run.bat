@echo off
title Medroute Healthcare Super-App
echo ========================================================
echo   Launching Medroute Healthcare Platform (MediBuddy Alt)
echo   Local Address: http://localhost:8000
echo ========================================================
start http://localhost:8000/index.html
python server.py
pause
