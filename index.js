const fs = require('fs');
const solarLunar = require('solarLunar');
const lunarCalendar = require("lunar-calendar");
const request = require('sync-request');
const leftPad = require('left-pad');
const lang = require('./lang.json');
const config = require('./config.json');


const calTemplate = fs.readFileSync('cal.html', 'utf8');
const pageTemplate = fs.readFileSync('page.html', 'utf8');
const monthlyTemplate = fs.readFileSync('monthly.html', 'utf8');

const YEAR = config.year;
const LANG = config.lang;
const QR = config.qr;
const PUNCHED = config.punched;
const MONTHLY = config.monthly;

const HIGHLIGHT = ['markup', 'css', 'clike', 'javascript', 'abap', 'actionscript', 'ada',
'apacheconf', 'apl', 'applescript', 'arduino', 'asciidoc', 'aspnet', 'autohotkey', 'autoit',
'bash', 'basic', 'batch', 'bison', 'brainfuck', 'bro', 'c', 'csharp', 'cpp', 'coffeescript',
'crystal', 'css-extras', 'd', 'dart', 'django', 'diff', 'docker', 'eiffel', 'elixir', 'erlang',
'fsharp', 'flow', 'fortran', 'gherkin', 'git', 'glsl', 'go', 'graphql', 'groovy', 'haml',
'handlebars', 'haskell', 'haxe', 'http', 'icon', 'inform7', 'ini', 'j', 'java', 'jolie',
'json', 'julia', 'keyman', 'kotlin', 'latex', 'less', 'livescript', 'lolcode', 'lua',
'makefile', 'markdown', 'matlab', 'mel', 'mizar', 'monkey', 'n4js', 'nasm', 'nginx', 'nim',
'nix', 'nsis', 'objectivec', 'ocaml', 'opencl', 'oz', 'parigp', 'parser', 'pascal', 'perl',
'php', 'php-extras', 'powershell', 'processing', 'prolog', 'properties', 'protobuf', 'pug',
'puppet', 'pure', 'python', 'q', 'qore', 'r', 'jsx', 'renpy', 'reason', 'rest', 'rip',
'roboconf', 'ruby', 'rust', 'sas', 'sass', 'scss', 'scala', 'scheme', 'smalltalk', 'smarty',
'sql', 'stylus', 'swift', 'tcl', 'textile', 'twig', 'typescript', 'vbnet', 'verilog', 'vhdl',
'vim', 'wiki', 'xojo', 'yaml'];

var dates = [];

const longMonth = [1, 3, 5, 7, 8, 10, 12];
const shortMonth = [4, 6, 9, 11];
const longMonthLastDay = 31;
const shortMonthLastDay = 30;
const leapDay = 29;
const nonLeapYearFebLastDay = 28;

const monthLastDayMapping = {2: nonLeapYearFebLastDay};
longMonth.forEach(m => {
    monthLastDayMapping[m] = longMonthLastDay;
});
shortMonth.forEach(m => {
    monthLastDayMapping[m] = shortMonthLastDay;
});


function isLeapYear(year) {
    return (year % 100 === 0 && year % 400 === 0) || (year % 100 !== 0 && year % 4 === 0);
}

function isLastDayOfMonth(month, day) {
    if(month === 2 && isLeapYear(YEAR)) {
        return day === leapDay;
    }
    return day === monthLastDayMapping[month];
}

for (var month = 1; month <= 12; month++) {
    var lastDay = monthLastDayMapping[month];
    if(month === 2 && isLeapYear(YEAR)) {
        lastDay = leapDay;
    }

    for (var date = 1; date <= lastDay; date++) {
        dates.push(solarLunar.solar2lunar(YEAR, month, date));
    }
}

var festivals = {'1001': '国庆节'};

for (var monthIndex = 0; monthIndex < 12; monthIndex++) {
    var data = lunarCalendar.calendar(YEAR, monthIndex + 1, false);
    for (var dIndex = 0; dIndex < data.monthData.length; dIndex++) {
        var f = data.monthData[dIndex];
        var _f = f.lunarFestival || f.solarFestival
        if (_f && _f.length <= 3) {
            festivals[leftPad(f.month, 2, '0') + leftPad(f.day, 2, '0')] = f.lunarFestival || f.solarFestival;
        }
    }
}

festivals['0101'] = '元旦';

var res, langs = [];

for (var langIndex = 0; langIndex < lang.length; langIndex++) {
    var _lang = lang[langIndex];
    try {
        var url = null, _desc;

        console.log(_lang.lang);

        if (LANG !== 'zh') {
            url = 'https://zh.wikipedia.org/w/api.php?format=json&action=query&prop=langlinks&lllimit=500&titles=' + encodeURIComponent(_lang.desc);
            res = request('GET', url, {
                socketTimeout: 5000,
                headers: {
                    'accept-language': 'zh-CN,zh'
                }
            });
            var wikiLinks = JSON.parse(res.getBody('utf8'));
            var linkPage = wikiLinks.query.pages;
            var links = linkPage[Object.keys(linkPage)[0]].langlinks;

            url = null;

            for (var linkIndex = 0; linkIndex < links.length; linkIndex++) {
                if (links[linkIndex].lang === LANG) {
                    _desc = links[linkIndex]['*'];
                    url = `https://${LANG}.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=${encodeURIComponent(links[linkIndex]['*'])}`;
                    break;
                }
            }
        } 
        
        if (!url) {
            url = 'https://zh.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=' + encodeURIComponent(_lang.desc);
        }
        
        res = request('GET', url, {
            socketTimeout: 5000,
            headers: {
                'accept-language': 'zh-CN,zh'
            }
        });
        var wiki = JSON.parse(res.getBody('utf8'));
        var page = wiki.query.pages;
        var desc = page[Object.keys(page)[0]].extract.split('\n')[0].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        desc = desc.substr(0, desc.lastIndexOf('。') + 1);
        _lang.descWiki = desc;

        if (_desc) {
            _lang.desc2 = _desc;
        }
    } catch(e) {
        langIndex--;
        continue;
    }

    _lang.code = fs.readFileSync('hacking-date/HackingDate.' + _lang.code, 'utf8').replace(/\$/g, '&#36;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    langs.push(_lang);
}

var pages = `<div class="${PUNCHED ? 'page punched' : 'page'}">
<h1 class="title">Happy Hacking ${YEAR}</h1>
</div>`;
var monthly = [];
var table = '';
var rows = '';
var weekly = [];
var page = '';
var weeks = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
langIndex = 0;

var newMonth = [];
var pageIndex = 0;
var calContent = '';

for (var dateIndex = 0; dateIndex < dates.length; dateIndex++) {
    var date = dates[dateIndex];

    if (date.cDay === 1) {
        newMonth.push(pageIndex);
    }

    if (MONTHLY) {
        var emptyWeek;

        if (date.cDay === 1) {
            if (PUNCHED) {
                table = monthlyTemplate.replace('{{pclass}}', 'page punched');
            } else {
                table = monthlyTemplate.replace('{{pclass}}', 'page');
            }
            table = table.replace('{{month}}', months[date.cMonth - 1]);
            rows = '<tr>';
            if (date.nWeek !== 7) {
                for (emptyWeek = 0; emptyWeek < date.nWeek; emptyWeek++) {
                    rows += '<td></td>';
                }
            }
        }

        if (date.nWeek === 7 && date.cDay !== 1) {
            rows += '<tr>'
        }

        var ld = festivals[leftPad(date.cMonth, 2, '0') + leftPad(date.cDay, 2, '0')] || date.term || (date.dayCn === '初一' ? date.monthCn : date.dayCn);
        var lc = festivals[leftPad(date.cMonth, 2, '0') + leftPad(date.cDay, 2, '0')] || date.term ? 'lunar red' : 'lunar';
        rows += `<td>
<div>${date.cDay}</div>
<div class="${lc}">${ld}</div>
</td>`;

        if (isLastDayOfMonth(date.cMonth, date.cDay)) {
            for (emptyWeek = date.nWeek; emptyWeek < 6; emptyWeek++) {
                rows += '<td></td>';
            }
            rows += '</tr>';
            monthly.push(table.replace('{{rows}}', rows));

        } else if (date.nWeek === 6) {
            rows += '</tr>';
        }
    }

    if (date.nWeek === 7 || !page) {
        if (PUNCHED) {
            page = pageTemplate.replace('{{pclass}}', 'page punched');
        } else {
            page = pageTemplate.replace('{{pclass}}', 'page');
        }

        if (QR) {
            page = page.replace('{{fclass}}', 'show_qr');
        } else {
            page = page.replace('{{fclass}}', 'hide_qr');
        }

        page = page.replace('{{main-date}}', `${date.cYear}-${leftPad(date.cMonth, 2, '0')}-${leftPad(date.cDay, 2, '0')}`);
        page = page.replace('{{main-week}}', weeks[date.nWeek - 1]);
        page = page.replace(`{{mwclass}}`, date.nWeek === 7 ? 'main-week red' : 'main-week');
        page = page.replace('{{main-ldata}}', festivals[leftPad(date.cMonth, 2, '0') + leftPad(date.cDay, 2, '0')] || date.term || (date.dayCn === '初一' ? date.monthCn : date.dayCn));
        page = page.replace(`{{mlclass}}`, festivals[leftPad(date.cMonth, 2, '0') + leftPad(date.cDay, 2, '0')] || date.term ? 'main-lunar red' : 'main-lunar');

        if (date.nWeek === 7) {
            page = page.replace('{{mclass}}', 'main-date red');
        } else {
            page = page.replace('{{mclass}}', 'main-date');
        }

        if (langIndex < lang.length) {
            var _code;
            if (lang[langIndex].lang === 'CSS') {
                page = page.replace('{{code}}', lang[langIndex].code.replace('2018-03-25', `${date.cYear}-${leftPad(date.cMonth, 2, '0')}-${leftPad(date.cDay, 2, '0')}`));
            } else {
                page = page.replace('{{code}}', lang[langIndex].code);
            }
            page = page.replace('{{lang}}', lang[langIndex].lang);
            if (HIGHLIGHT.indexOf(lang[langIndex].class) !== -1) {
                page = page.replace('{{class}}', 'language-' + lang[langIndex].class);
            } else {
                page = page.replace('{{class}}', lang[langIndex].class);
            }
            
            page = page.replace('{{desc}}', lang[langIndex].descWiki);
            page = page.replace('{{qr}}', QR ? `http://chart.apis.google.com/chart?chs=360x360&cht=qr&choe=UTF-8&chld=M|0&chl=${encodeURIComponent('https://' + (lang[langIndex].desc2 ? LANG : 'zh') + '.wikipedia.org/wiki/' + encodeURIComponent(lang[langIndex].desc2 || lang[langIndex].desc))}` : 'data:image/gif;base64,R0lGODlhAQABAAAAACw=');
            langIndex++;
        }
    } else {
        page = page.replace(`{{week${date.nWeek}}}`, weeks[date.nWeek - 1]);
        page = page.replace(`{{date${date.nWeek}}}`, `${leftPad(date.cMonth, 2, '0')}-${leftPad(date.cDay, 2, '0')}`);
        page = page.replace(`{{ldate${date.nWeek}}}`, festivals[leftPad(date.cMonth, 2, '0') + leftPad(date.cDay, 2, '0')] || date.term || (date.dayCn === '初一' ? date.monthCn : date.dayCn));
        page = page.replace(`{{lclass${date.nWeek}}}`, festivals[leftPad(date.cMonth, 2, '0') + leftPad(date.cDay, 2, '0')] || date.term ? 'lunar red' : 'lunar');
    }

    if (date.nWeek === 6 || dateIndex === dates.length - 1) {
        for (var i = 0; i < 6; i++) {
            page = page.replace(`{{week${i + 1}}}`, '');
            page = page.replace(`{{date${i + 1}}}`, '');
            page = page.replace(`{{ldate${i + 1}}}`, '');
        }

        weekly.push(page);
        pageIndex++;
    }
}

var monthlyIndex = 0;

for (var calContentPageIndex = 0; calContentPageIndex < weekly.length; calContentPageIndex++) {
    if (MONTHLY && newMonth.indexOf(calContentPageIndex) !== -1) {
        calContent += monthly[monthlyIndex];
        monthlyIndex++;
    }

    calContent += weekly[calContentPageIndex];
}

var cal = calTemplate.replace('{{page}}', calContent);

fs.writeFileSync('out.html', cal);
