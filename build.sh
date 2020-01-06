if [ -d ./hacking-date ]; then
    rm -rf ./hacking-date
fi
git clone git@github.com:Sneezry/hacking-date.git
npm install
node index.js