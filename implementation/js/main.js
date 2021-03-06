/* main JS file */

var sentimentBubbleCloud;
var treeMap;
var asterPlot;
var wordCloud;


d3.json("data/sentiment.json", function(error, jsonData) {
    if (!error) {
        sentimentBubbleCloud = new SentimentBubbleCloud("#bubble-cloud", jsonData);
    }
});

d3.json("data/top25Stats.json", function(error, jsonData) {
    if (!error) {
        treeMap = new TreeMap("#treemap", jsonData);
    }
});

d3.json("data/hourly_stats.json", function(error, jsonData) {
    if (!error) {
        asterPlot = new AsterPlot("#asterplot", jsonData);
    }
});

d3.json("data/word_counts_sentiment.json", function(error, jsonData) {
    if (!error) {
        wordCloud = new WordCloud("#wordcloud", jsonData);
    }
});

function toTreemap() {
    treeMap.toTreemap();
}

function updateTreemapColor(btn) {
    treeMap.updateTreemapColor(btn);
}

function highlightTile(i) {
    treeMap.highlightTile(i);
}

function selectRadioBtn(id) {
    treeMap.selectRadioBtn(id);
}

function updatePlotType() {
    asterPlot.updatePlotType();
}

function changeSelectBox(id) {
    asterPlot.changeSelectBox(id);
}

function updateWordCloud(value) {
    wordCloud.updateVis(value);
}

function showSentimentTrend() {
    sentimentBubbleCloud.showTrend();
}

function showAsterTrend(idx) {
    asterPlot.showTrend(idx);
}

$(document).ready(function() {
    $('#pagepiling').pagepiling({
        anchors: ['frontPage', 'infoPage', 'snapshotPage', 'commentPage', 'asterDescriptionPage', 'asterVisPage',
            'treemapDescriptionPage', 'treemapVisPage', 'sentimentDescriptionPage', 'sentimentVisPage',
            'wordsDescriptionPage', 'wordsVisPage', 'wordsAfterPage', 'conclusionPage'],
    });
});