@echo off

set CUR_DIR="%CD%"
set BUILD_DIR=%CUR_DIR%\win64
set EXE_PATH=%CUR_DIR%\win64\nw.exe
set ICO_PATH=..\lib\images\streembit64.png
set RESOURCER_PATH=%CUR_DIR%\buildtools\Resourcer.exe
set NWPACK_PATH=%CUR_DIR%\win64\package.nw
set APPEXE_PATH=%CUR_DIR%\win64\streembit.exe
set ZIP_EXE="C:\Program Files\7-Zip\7z.exe"

SETLOCAL EnableDelayedExpansion
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "DEL=%%a"
)

echo.
call :ColorText 19 "Streembit v0.1.1"
echo.
call :ColorText 19 "---"
echo.

call :ColorText 19 "delete files from build directory"
echo.
del %BUILD_DIR%\*.* /S /Q

IF EXIST %BUILD_DIR%\locales (
rmdir /s /q %BUILD_DIR%\locales
call :ColorText 19 "locales directory deleted"
echo.
)

IF EXIST %BUILD_DIR%\data (
rmdir /s /q %BUILD_DIR%\data
call :ColorText 19 "data directory deleted"
echo.
)

IF EXIST %BUILD_DIR%\node_modules (
rmdir /s /q %BUILD_DIR%\node_modules
call :ColorText 19 "node_modules directory deleted"
echo.
)

IF EXIST %BUILD_DIR%\jspm_packages (
rmdir /s /q %BUILD_DIR%\jspm_packages
call :ColorText 19 "jspm_packages directory deleted"
echo.
)

IF EXIST %BUILD_DIR%\lib (
rmdir /s /q %BUILD_DIR%\lib
call :ColorText 19 "lib directory deleted"
echo.
)

IF NOT EXIST package.json (
call :ColorText 19 "package.json not exists"
echo.
Exit /b
) ELSE (
call :ColorText 0a "package.json was found"
echo.
)

IF EXIST %BUILD_DIR%\package.json (
del /s /q %BUILD_DIR%\package.json
call :ColorText 0a "package.json deleted"
echo.
)

call :ColorText 0a "copy files"
echo.

copy %CUR_DIR%\package.json %BUILD_DIR%\package.json

call :ColorText 19 "copy nw files"
echo.
xcopy buildtools\win64 %BUILD_DIR% /s /e /y

IF NOT EXIST %EXE_PATH% (
call :ColorText 19 "nw.exe not exists, failed to copy from buildtools\win64"
echo.
Exit /b
) ELSE (
call :ColorText 19 "nw.exe exists"
echo.
)

copy ..\config.js %BUILD_DIR%\config.js 
copy ..\index.html %BUILD_DIR%\index.html 

xcopy ..\lib %BUILD_DIR%\lib /s /e /y
xcopy ..\node_modules %BUILD_DIR%\node_modules /s /e /y
xcopy ..\jspm_packages %BUILD_DIR%\jspm_packages /s /e /y

call :ColorText 19 "renaming exe file"
echo.
ren %EXE_PATH% "streembit.exe

IF EXIST %RESOURCER_PATH% (
	call :ColorText 19 "Resourcer.exe exists, setting Streembit icon"
	echo.
	IF EXIST %ICO_PATH% (
		%RESOURCER_PATH% -op:upd -src:%APPEXE_PATH% -type:14 -name:IDR_MAINFRAME -file:%ICO_PATH%
		call :ColorText 0a "icon was set for executable"
		echo.
	)
)

call :ColorText 19 "create zip file"
echo.
cd %BUILD_DIR%
%ZIP_EXE% a -tzip "streembit_win64.zip" %BUILD_DIR%\locales %BUILD_DIR%\lib %BUILD_DIR%\node_modules %BUILD_DIR%\jspm_packages %BUILD_DIR%\*.*

goto :eof

:ColorText
echo off
<nul set /p ".=%DEL%" > "%~2"
findstr /v /a:%1 /R "^$" "%~2" nul
del "%~2" > nul 2>&1
goto :eof