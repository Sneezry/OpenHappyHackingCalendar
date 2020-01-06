@ECHO OFF
PUSHD %~dp0
IF EXIST hacking-date RMDIR /Q /S hacking-date
CMD /C git clone https://github.com/Sneezry/hacking-date.git
CMD /C npm install
CMD /C node index.js