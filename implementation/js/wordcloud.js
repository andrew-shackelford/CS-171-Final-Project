
WordCloud = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
};

WordCloud.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 350, right: 200, bottom: 10, left: 550};
    vis.width = 1000 - vis.margin.left - vis.margin.right;
    vis.height = 700 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.fill = d3.scaleOrdinal(d3.schemeCategory10);

    vis.xScale = d3.scaleLinear()
        .range([30,120]);

    vis.updateVis("leagueoflegends");
}


WordCloud.prototype.updateVis = function(key) {
    var vis = this;

    var filteredData = this.data[key];

    vis.xScale.domain([0, d3.max(filteredData, function(d) {
        return d.value;
    })]);

    d3.layout.cloud().size([vis.width * 5, vis.height * 3])
        .timeInterval(20)
        .words(filteredData)
        .fontSize(function(d) { return vis.xScale(+d.value); })
        .text(function(d) { return d.key; })
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .on("end", draw)
        .start();

    function draw(words) {
        var cloud = vis.svg.selectAll("text")
            .data(words, function(d) {
                return d.key;
            });

        cloud
            .attr("text-anchor", "middle")
            .text(function(d) { return d.key; })
            .style("fill", function(d, i) { return vis.fill(d.key); })
            .transition()
            .duration(750)
            .style("font-size", function(d) { return vis.xScale(d.value) + "px";})
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            });

        cloud.exit()
            .transition()
            .duration(750)
            .style("opacity", 0)
            .remove();

        cloud.enter().append("text")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.key; })
            .style("font-size", function(d) { return vis.xScale(d.value) + "px"; })
            .style("fill", function(d, i) { return vis.fill(d.key); })
            .style("opacity", 0)
            .transition()
            .duration(750)
            .style("opacity", 1);
    }

    d3.layout.cloud().stop();

}