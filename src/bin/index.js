"use strict";
var request = require('request');
var cheerio = require('cheerio');
var blessed = require('blessed');
var chalk = require('chalk');

var currentIndex = 1;
var readMoreId = null;
var loadMore = false;
var index;

var content = '';
var paths = [
    '',
    '',
    'national',
    'business',
    'sports',
    'world',
    'politics',
    'technology',
    'startup',
    'entertainment',
    'miscellaneous',
    'hatke',
    'science',
    'automobile'
];

var screen = blessed.screen({
    smartCSR: true
});

screen.title = 'ISTV';

var container = blessed.box({
    parent: screen,
    padding: 1,
    scrollable: true,
    left: 'center',
    top: 'center',
    width: '100%',
    height: '100%',
    label: 'ISTV: Home',
    style: {
        bg: 'black'
    },
    content: "Loading..",
    border: 'line',
    keys: true,
    vi: true,
    mouse: true,
    alwaysScroll: true,
    scrollbar: {
        ch: ' ',
        inverse: true
    }
});


var table = blessed.listtable({
    parent: screen,
    top: 'center',
    left: 'center',
    data: [
        ['Categories'],
        ['All News'],
        ['India'],
        ['Business'],
        ['Sports'],
        ['World'],
        ['Politics'],
        ['Technology'],
        ['Startup'],
        ['Entertainment'],
        ['Miscellaneous'],
        ['Hatke'],
        ['Science'],
        ['Automobile']
    ],
    border: 'line',
    align: 'center',
    tags: true,
    keys: true,
    width: '50%',
    height: '70%',
    hidden: true,
    vi: true,
    mouse: true,
    style: {
        border: {
            fg: 'red'
        },
        header: {
            fg: 'blue',
            bold: true
        },
        cell: {
            fg: 'magenta',
            selected: {
                bg: 'blue'
            }
        }
    }
});

var exit = blessed.question({
    parent: screen,
    border: 'line',
    height: 'shrink',
    width: '60%',
    top: 'center',
    left: 'center',
    label: ' {blue-fg}Exit{/blue-fg} ',
    tags: true,
    keys: true,
    hidden: true,
    vi: true,
});

requestInshorts('', 'Home');

function requestInshorts(path, label) {
    request('https://www.inshorts.com/en/read/' + path,
        function(error, response, body) {
            if (!error) {
                loadData(body, label);
            }
        }
    );
}


function loadData(body, label) {
    var $ = cheerio.load(body);
    readMoreId = $("[type='text/javascript']").last().html().split('"')[1];
    index = 0;
    content = "";

    $('div.news-card').each(function(i, elem) {
        var card = cheerio.load(elem);
        var title = card('div.news-card-title span').html();
        var body = card('div[itemprop="articleBody"]').html();
        content = content + chalk.bold((index += 1) + '. ' + cleanText(title)) + '\n';
        content = content + cleanText(body) + '\n\n';
    });

    container.setLabel('ISTV:' + label.replace(/\s/g, ''));
    container.setContent(content);
    container.resetScroll();
    container.focus();
    screen.render();
}

function loadEvenMore() {
    request.post({
        url: "https://www.inshorts.com/en/ajax/more_news",
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        body: require('querystring').stringify({ news_offset: readMoreId, category: paths[currentIndex] })
    }, function(err, response, body) {
        readMoreId = (JSON.parse(body)).min_news_id;
        var more = cheerio.load((JSON.parse(body)).html);

        more('div.news-card').each(function(i, elem) {
            var card = cheerio.load(elem);
            var title = card('div.news-card-title span').html();
            var body = card('div[itemprop="articleBody"]').html();
            content = content + chalk.bold((index += 1) + '. ' + cleanText(title)) + '\n';
            content = content + cleanText(body) + '\n\n';
        });

        container.setContent(content);
        screen.render();
        loadMore = false;

    });
}

function cleanText(incoming) {
    if (incoming == null) {
        console.log("No value found");
        return false;
    }
    var text = incoming.replace(/<br>/g, '')
        .replace(/&quot;/g, '\"')
        .replace(/&lt;/g, '')
        .replace(/&gt;/g, '')
        .replace(/&apos;/g, '\'')
        .replace(/&#x20B9;/g, '')
        .replace(/&amp;/g, '&');

    return text;
}



container.on('scroll', function() {

    if (loadMore == false && container.getScrollPerc() > 90) {
        loadEvenMore();
        loadMore = true;
    }

});

screen.key('q', function() {
    exit.ask('Are You Sure You Want To Exit?(y/n)', function(err, value) {
        if (value === true) {
            return screen.destroy();
        } else {
            exit.hide();
            screen.render();
        }
    });
});


screen.key('c', function() {
    table.toggle();
    table.focus();
    table.on('select', function(el, selected_no) {
        currentIndex = selected_no;
        requestInshorts(paths[selected_no], el.getText());
        table.hide();
        screen.render();
    });
    screen.render();
});


container.focus();
screen.render();