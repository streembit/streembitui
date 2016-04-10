#!/bin/bash
# Streembit Linux shell script

echo "Start creating Streembit binary"

cd "${0/*}"

CURR_DIR=$(pwd)
BUILD_DIR=$CURR_DIR/linux64
EXE_PATH=$CURR_DIR/linux64/nw
#set ICO_PATH=..\assets\icons\streembit64.png
#set RESOURCER_PATH=CUR_DIR\buildtools\Resourcer.exe
NWPACK_PATH=$CURR_DIR/linux64/package.nw
APPEXE_PATH=$CURR_DIR/linux64/streembit
ZIP_EXE="/usr/bin/7z"


echo "build directory: $BUILD_DIR"

echo "delete files from build directory"
rm -rf $BUILD_DIR

if [ -e "$BUILD_DIR/locales" ]; 
then 
rm -rf $BUILD_DIR/locales
echo "locales directory deleted"
fi

if [ -e "$BUILD_DIR/data" ];
then
rm -rf $BUILD_DIR/data
echo "data directory deleted"
fi

if [ -e "$BUILD_DIR/logs" ]; 
then
rm -rf $BUILD_DIR/logs
echo "logs directory deleted"
fi

if ! [ -e package.json ]; 
then
echo "error: package.json not exists"
exit 1
else 
echo "package.json was found"
fi

if ! [ -e "$CURR_DIR/buildtools/linux64" ]; 
then
echo "error: buildtools/linux64 not exists"
exit 1
else 
echo "buildtools/linux64 was found"
fi

echo "copy nw files"
cp -R $CURR_DIR/buildtools/linux64 $BUILD_DIR


if ! [ -e "$EXE_PATH" ]; 
then
echo "error: nw executable not exists, failed to copy from buildtools\linux64"
exit 1
else 
echo "nw executable exists"
fi

echo "create package.nw"


$ZIP_EXE a -tzip -y $NWPACK_PATH package.json ../index.html  ../assets ../node_modules

if ! [ -e "$NWPACK_PATH" ]; 
then
echo "error: failed to create package.nw"
exit 1
else 
echo "package.nw is created"
fi

cat $EXE_PATH $NWPACK_PATH > $APPEXE_PATH && chmod +x $APPEXE_PATH 

if ! [ -e "$APPEXE_PATH" ]; 
then
echo "error: failed to create streembit executable"
exit 1
else 
echo "streembit executable is created"
fi

rm $NWPACK_PATH
rm $EXE_PATH

echo "create zip file"

cd $BUILD_DIR
$ZIP_EXE a -tzip "streembit_linux64.zip" $BUILD_DIR/locales $BUILD_DIR/lib $BUILD_DIR/*.* $APPEXE_PATH

md5sum $BUILD_DIR/streembit_linux64.zip > $BUILD_DIR/streembit_linux64.md5

echo "creating Streembit binaries completed"











