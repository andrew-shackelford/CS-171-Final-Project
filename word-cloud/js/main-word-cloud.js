var wordData = [];
console.time("loading...");
// Start application by loading the data
loadData();
console.timeEnd("loading...");

function loadData() {
    d3.json("data/wordCountsAsJSON.json", function(d){
        wordData = d;
        updateVis("leagueoflegends")
    });
}