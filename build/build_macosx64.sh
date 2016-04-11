#!/bin/bash
# Streembit Mac OS X shell script

echo "Start creating Streembit binary"

cd "${0/*}"

CURR_DIR=$(pwd)
BUILD_DIR=$CURR_DIR/macosx64
EXE_PATH=$CURR_DIR/macosx64/nwjs.app
#set ICO_PATH=..\assets\icons\streembit64.png
#set RESOURCER_PATH=CUR_DIR\buildtools\Resourcer.exe
NWPACK_PATH=$CURR_DIR/macosx64/package.nw
APPEXE_PATH=$CURR_DIR/macosx64/streembit
ZIP_EXE="/usr/bin/7z"


echo "build directory: $BUILD_DIR"

echo "delete files from build directory"
rm -rf $BUILD_DIR


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

if ! [ -e "$CURR_DIR/buildtools/macosx64" ]; 
then
echo "error: buildtools/macosx64 not exists"
exit 1
else 
echo "buildtools/macosx64 was found"
fi

echo "copy nw files"
cp -R $CURR_DIR/buildtools/macosx64 $BUILD_DIR

if ! [ -e "$EXE_PATH" ]; 
then
echo "error: nw executable not exists, failed to copy from buildtools\macosx64"
exit 1
else 
echo "nw executable exists"
fi

echo "copy application files"

cp package.json $BUILD_DIR/package.json 

cp ../index.html $BUILD_DIR/index.html 

cp -R ../assets $BUILD_DIR/assets

cp -R ../node_modules $BUILD_DIR/node_modules 


echo "create zip file"

zip -r "streembit_macosx64.zip" $BUILD_DIR/*

md5 -r streembit_macosx64.zip

echo "creating Streembit zip completed"











