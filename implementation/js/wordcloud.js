WordCloud = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
};

WordCloud.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 0, right: 0, bottom: 10, left: 0};
    vis.width = 800 - vis.margin.left - vis.margin.right;
    vis.height = 700 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(350,350)");

    vis.fill = d3.scaleOrdinal(d3.schemeCategory10);

    /*vis.fill2 = d3.scaleSequential(d3.interpolateRdYlGn)
        .domain([-5, 5]);
    console.log(vis.fill2(5));*/

    vis.xScale = d3.scaleLinear()
        .range([30,100]);

    vis.updateVis("AmItheAsshole");
}


WordCloud.prototype.updateVis = function(key) {
    var vis = this;

    var filteredData = this.data[key];

    vis.xScale.domain([0, d3.max(filteredData, function(d) {
        return d.value;
    })]);

    d3.layout.cloud().size([vis.width, vis.height])
        .timeInterval(20)
        .words(filteredData)
        .padding(3)
        .font('Rubik')
        .fontSize(function(d) {return vis.xScale(+d.value); })
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
            .attr('font-family', 'Rubik, sans-serif')
            .style("font-size", function(d) { return vis.xScale(d.value)-10 + "px";})
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            });

        cloud.exit()
            .transition()
            .duration(750)
            .style("opacity", 0)
            .remove();

        cloud.enter().append("text")
            .on("mouseover", function(d) {
                document.getElementById("word-info").innerHTML =
                    "<b> \"" + d.key + "\" </b>" + " was mentioned " + d.value + " times."
            })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x+20, d.y+20] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.key; })
            .style("font-size", function(d) { return vis.xScale(d.value) + "px"; })
            .style("fill", function(d, i) { return vis.fill(d.key); })
            .style("opacity", 0)
            .transition()
            .duration(750)
            .attr('font-family', 'Rubik, sans-serif')
            .style("opacity", 1);
    }

    d3.layout.cloud().stop();

}