WordCloud = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
};

WordCloud.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 0, right: 125, bottom: 10, left: 0};
    vis.width = 800 - vis.margin.left - vis.margin.right;
    vis.height = 700 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(400,350)");

    vis.svg2 = d3.select("#wordcloud-scale").append("svg")
        .attr("width", 170)
        .attr("height", 700);

    vis.fill = d3.scaleOrdinal(d3.schemeCategory10);

    vis.fill2 = d3.scaleQuantize()
        .range(['#E21F20', "#D27D21", '#E8D65D', '#8CE079', '#41BE24']);

    vis.xScale = d3.scaleLinear()
     .range([30,100]);

    vis.updateVis("AmItheAsshole");
    }


WordCloud.prototype.updateVis = function(key) {
    var vis = this;
    var filteredData = this.data[key];

    /* Scales */

    vis.fill2.domain(d3.extent(filteredData, function(d){
        return d.sentiment;
    }));

    vis.xScale.domain([0, d3.max(filteredData, function(d) {
     return d.value;
    })]);

    /* Legend */
    vis.svg2.append("g")
        .attr("class", "legendQuant")
        .attr("transform", "translate(20,20)");;

    vis.legend = d3.legendColor()
        .labelFormat(d3.format(".2f"))
        .title("Sentiment Color Legend")
        .titleWidth(100)
        .scale(vis.fill2);

    vis.svg2.select(".legendQuant")
        .call(vis.legend);


    /* Word Cloud */
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
         .style("fill", function(d, i) { return vis.fill2(d.sentiment); })
         .transition()
         .duration(750)
         .attr('font-family', 'Rubik, sans-serif')
         .style("font-size", function(d) { return vis.xScale(d.value)-10 + "px";})
         .style("text-shadow", "-.5px -.5px 0 #000, .5px -.5px 0 #000, -.5px .5px 0 #000, .5px .5px 0 #000")
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
             return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
         })
         .text(function(d) { return d.key; })
         .style("font-size", function(d) { return vis.xScale(d.value) + "px"; })
         .style("paint-order", "stroke")
         .style("text-shadow", "-.5px -.5px 0 #000, .5px -.5px 0 #000, -.5px .5px 0 #000, .5px .5px 0 #000")
         .style("fill", function(d, i) { return vis.fill2(d.sentiment); })
         .style("opacity", 0)
         .transition()
         .duration(750)
         .attr('font-family', 'Rubik, sans-serif')
         .style("opacity", 1);
    }

    d3.layout.cloud().stop();

}