@echo off

set CUR_DIR="%CD%"
set BUILD_DIR=%CUR_DIR%\build\win64
set EXE_PATH=%CUR_DIR%\build\win64\nw.exe
set ICO_PATH=%CUR_DIR%\assets\icons\streemio32.png
set NWPACK_PATH=%CUR_DIR%\build\win64\package.nw
set APPEXE_PATH=%CUR_DIR%\build\win64\streemio.exe
set ZIP_EXE="C:\Program Files\7-Zip\7z.exe"

SETLOCAL EnableDelayedExpansion
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
)

echo.
call :ColorText 0C "Streemo v0.1.1"
echo.
call :ColorText 0C "---"
echo.
echo.

REM call :ColorText 19 "blue"
REM echo.
REM call :ColorText 0a "green"
REM echo.
REM call :ColorText 0C "red"
REM echo.

call :ColorText 0C "delete files from build directory"
echo.
del %BUILD_DIR%\*.* /S /Q

rmdir /s /q %BUILD_DIR%\locales
rmdir /s /q %BUILD_DIR%\data
rmdir /s /q %BUILD_DIR%\logs

REM goto :eof

call :ColorText 0C "copy nw files"
echo.
xcopy build\buildtools\win64 %BUILD_DIR% /s /e /y

REM goto :eof

call :ColorText 0C "create package.nw"
echo.

%ZIP_EXE% a -tzip %NWPACK_PATH% package.json index.html assets node_modules libs


call :ColorText 0C "copy streemio.conf"
echo.

copy streemio_release.conf %BUILD_DIR%\streemio.conf

REM goto :eof

call :ColorText 0C "setting Streemio icon"
echo.
if exist %ICO_PATH% build\buildtools\Resourcer -op:upd -src:%EXE_PATH% -type:14 -name:IDR_MAINFRAME -file:%ICO_PATH%

call :ColorText 0C "create Streemio executable"
echo.
copy /b /y %EXE_PATH% + %NWPACK_PATH% %APPEXE_PATH% 

del %NWPACK_PATH% /S /Q
del %EXE_PATH% /S /Q

call :ColorText 0C "create zip file"
echo.
cd %BUILD_DIR%
%ZIP_EXE% a -tzip "streemo_win64.zip" %BUILD_DIR%\locales %BUILD_DIR%\*.*

goto :eof


:ColorText
echo off
<nul set /p ".=%DEL%" > "%~2"
findstr /v /a:%1 /R "^$" "%~2" nul
del "%~2" > nul 2>&1
goto :eof
