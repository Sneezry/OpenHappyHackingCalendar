# Open Happy Hacking Calendar

This is the source code to build Happy Hacking Calender, original post: <https://www.v2ex.com/t/408428>.

Happy Hacking Calender published by Turing is also based on this project: <https://www.ituring.com.cn/book/2625>.

Calendar built from this project is different from the version Turing published, because sentences in the published version had been modified by the publishing house editor which is copyright content. This open source project fetches contents from Wikipedia, which is published under CC BY-SA 3.0 license.

## Prerequisite

To run this project, Node (<https://nodejs.org/en/download/>) is required.

## Get the code

```
git clone https://github.com/Sneezry/OpenHappyHackingCalendar.git
```

## Configuration

Edit `config.json` with your favourite editor, modify `year` to the target year.

Search for `var festivals` in `index.js` to add festivals.

## Build

### Windows

```
build.cmd
```

### macOS & Linux

```
./build.sh
```

The output file is named `out.html`.