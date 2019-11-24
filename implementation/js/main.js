/* main JS file */

var sentimentBubbleCloud;
var treeMap;
var asterPlot;

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
})

function toTreemap() {
    treeMap.toTreemap();
}

function updatePlotType() {
    asterPlot.updatePlotType();
}