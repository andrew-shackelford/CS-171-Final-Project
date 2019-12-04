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

d3.json("data/word_counts.json", function(error, jsonData) {
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

function updatePlotType() {
    asterPlot.updatePlotType();

}

function updateWordCloud(value) {
    wordCloud.updateVis(value);
}

$(document).ready(function() {
    $('#pagepiling').pagepiling();
});