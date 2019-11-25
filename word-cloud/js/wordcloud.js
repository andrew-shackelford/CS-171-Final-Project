var margin = {top: 300, right: 10, bottom: 10, left: 700},
    width = 1400 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var svg = d3.select("#word-cloud").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var fill = d3.scaleOrdinal(d3.schemeCategory10);

var xScale = d3.scaleLinear()
    .range([10,100]);

function updateVis(key){
    var data = wordData[key];

    xScale.domain([0, d3.max(data, function(d) {
        return d.value;
    })]);

    console.time("layoutCloud");
    d3.layout.cloud().size([width, height])
        .timeInterval(20)
        .words(data)
        .fontSize(function(d) { return xScale(+d.value); })
        .text(function(d) { return d.key; })
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .on("end", draw)
        .start();
    console.timeEnd("layoutCloud")

    function draw(words) {
        console.time("drawing...");
        var cloud = svg.selectAll("text")
            .data(words, function(d) {
                return d.key;
            });
        cloud.exit().remove();
        cloud.enter().append("text")
            .merge(cloud)
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.key; })
            .style("font-size", function(d) { return xScale(d.value) + "px"; })
            .transition()
            .duration(5000)
            .style("fill", function(d, i) { return fill(i); })
        console.timeEnd("drawing...");
    }
    console.time("stopping...");
    d3.layout.cloud().stop();
    console.timeEnd("stopping...");

}