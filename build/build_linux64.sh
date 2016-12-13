#!/bin/bash
# Streembit Linux shell script

echo "Start creating Streembit binary"

cd "${0/*}"

CURR_DIR=$(pwd)
BUILD_DIR=$CURR_DIR/linux64
EXE_PATH=$CURR_DIR/linux64/nw
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

if [ -e "$BUILD_DIR/node_modules" ]; 
then
rm -rf $BUILD_DIR/node_modules
echo "node_modules directory deleted"
fi

if [ -e "$BUILD_DIR/jspm_packages" ]; 
then
rm -rf $BUILD_DIR/jspm_packages
echo "jspm_packages directory deleted"
fi

if [ -e "$BUILD_DIR/lib" ]; 
then
rm -rf $BUILD_DIR/lib
echo "lib directory deleted"
fi

if ! [ -e package.json ]; 
then
echo "error: package.json not exists"
exit 1
else 
echo "package.json was found"
fi

if [ -e "$BUILD_DIR/package.json" ]; 
then
rm -rf $BUILD_DIR/package.json
echo "package.json file deleted"
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

echo "copy config.js"
cp -f ../config.js $BUILD_DIR/config.js 

echo "copy index.html"
cp -f ../index.html $BUILD_DIR/index.html

echo "copy lib directory"
cp -R ../lib $BUILD_DIR/lib 

echo "copy node_modules directory"
cp -R ../node_modules $BUILD_DIR/node_modules 

echo "copy jspm_packages directory"
cp -R ../jspm_packages $BUILD_DIR/jspm_packages 

echo "renaming nw to streembit"
mv $EXE_PATH $APPEXE_PATH

if ! [ -e "$APPEXE_PATH" ]; 
then
echo "error: failed to create streembit executable"
exit 1
else 
echo "streembit executable is created"
fi

echo "create zip file"

cd $BUILD_DIR
$ZIP_EXE a -tzip "streembit_linux64.zip" $BUILD_DIR/locales $BUILD_DIR/lib $BUILD_DIR/node_modules $BUILD_DIR/jspm_packages $BUILD_DIR/*.* $APPEXE_PATH

md5sum $BUILD_DIR/streembit_linux64.zip > $BUILD_DIR/streembit_linux64.md5

echo "creating Streembit binaries completed"











