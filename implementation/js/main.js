/* main JS file */

var sentimentBubbleCloud;
var treeMap;

d3.json("data/sentiment.json", function(error, jsonData) {
    if (!error) {
        sentimentBubbleCloud = new SentimentBubbleCloud("#bubble-cloud", jsonData);
    }
});

d3.json("data/top25Stats.json", function(error, jsonData){
    if (!error) {
        treeMap = new TreeMap("#treemap", jsonData)
    }
});

function toTreemap() {
    treeMap.toTreemap();
}