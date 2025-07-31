@echo off
echo Starting Job Portal System...
echo.

echo Installing server dependencies...
npm install

echo.
echo Installing client dependencies...
cd client
npm install
cd ..

echo.
echo Starting development server...
npm run dev

pause 