/* main JS file */

var sentimentBubbleCloud;

d3.json("data/sentiment.json", function(error, jsonData) {
    sentimentBubbleCloud = new SentimentBubbleCloud("#bubble-cloud", jsonData);
});
