@echo off

set CUR_DIR="%CD%"
set BUILD_DIR=%CUR_DIR%\win64
set EXE_PATH=%CUR_DIR%\win64\nw.exe
set ICO_PATH=..\assets\icons\streemio64.png
set NWPACK_PATH=%CUR_DIR%\win64\package.nw
set APPEXE_PATH=%CUR_DIR%\win64\streemio.exe
set ZIP_EXE="C:\Program Files\7-Zip\7z.exe"

SETLOCAL EnableDelayedExpansion
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
)

echo.
call :ColorText 19 "Streemio v0.1.1"
echo.
call :ColorText 19 "---"
echo.
echo.

REM call :ColorText 19 "blue"
REM echo.
REM call :ColorText 0a "green"
REM echo.
REM call :ColorText 0C "red"
REM echo.

call :ColorText 19 "delete files from build directory"
echo.
del %BUILD_DIR%\*.* /S /Q

IF EXIST %BUILD_DIR%\locales (
rmdir /s /q %BUILD_DIR%\locales
call :ColorText 0a "locales directory deleted"
echo.
)

IF EXIST %BUILD_DIR%\data (
rmdir /s /q %BUILD_DIR%\data
call :ColorText 0a "data directory deleted"
echo.
)

IF EXIST %BUILD_DIR%\logs (
rmdir /s /q %BUILD_DIR%\logs
call :ColorText 0a "logs directory deleted"
echo.
)

IF NOT EXIST package.json (
call :ColorText 0C "package.json not exists"
echo.
Exit /b
) ELSE (
call :ColorText 0a "package.json was found"
echo.
)

REM goto :eof

call :ColorText 0a "copy nw files"
echo.
xcopy buildtools\win64 %BUILD_DIR% /s /e /y

IF NOT EXIST %EXE_PATH% (
call :ColorText 0C "nw.exe not exists, failed to copy from buildtools\win64"
echo.
Exit /b
) ELSE (
call :ColorText 0a "nw.exe exists"
echo.
)

REM goto :eof

call :ColorText 0C "create package.nw"
echo.

%ZIP_EXE% a -tzip %NWPACK_PATH% package.json ..\index.html  ..\assets ..\node_modules


call :ColorText 19 "setting Streemio icon"
echo.
IF EXIST %ICO_PATH% (
	buildtools\Resourcer -op:upd -src:%EXE_PATH% -type:14 -name:IDR_MAINFRAME -file:%ICO_PATH%
	call :ColorText 0a "icon was set for executable"
	echo.
)

call :ColorText 19 "create Streemio executable"
echo.
copy /b /y %EXE_PATH% %APPEXE_PATH% 

REM del %NWPACK_PATH% /S /Q
del %EXE_PATH% /S /Q

call :ColorText 19 "create zip file"
echo.
cd %BUILD_DIR%
%ZIP_EXE% a -tzip "streemio_win64.zip" %BUILD_DIR%\locales %BUILD_DIR%\*.*

goto :eof


:ColorText
echo off
<nul set /p ".=%DEL%" > "%~2"
findstr /v /a:%1 /R "^$" "%~2" nul
del "%~2" > nul 2>&1
goto :eof

