
var svg_width = $( window ).width();
var svg_height = $( window ).height();
var ratio = svg_width/svg_height;

var svg = d3.select("#cover").append("svg")
    .attr("class", "icons")
    .attr("width", svg_width)
    .attr("height", svg_height);

var tip = d3.tip()
    .attr("class", "cover-tip")
    .offset([30, 0])
    .html(function(d) {
        return "";
    });

svg.call(tip);

function gridData() {
    var data = new Array();
    var xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
    var ypos = 1;
    var dim = svg_width/16;

    // iterate for rows
    for (var row = 0; row < Math.ceil(16/ratio) -1; row++) {
        data.push( new Array() );
        // iterate over the columns
        for (var column = 0; column < 16; column++) {
            data[row].push({
                x: xpos,
                y: ypos,
                width: dim,
                height: dim
            })
            xpos += dim;
        }
        xpos = 1;
        ypos += dim;
    }
    return data;
}

var gridData = gridData();

var row = svg.selectAll(".row")
    .data(gridData)
    .enter().append("g")
    .attr("class", "row");

var column = row.selectAll("image")
    .data(function(d) { return d; })
    .enter().append("image")
    .attr("class", "icon")
    .attr('href', 'img/ws2kAA0.png')
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("width", function(d) { return d.width; })
    .attr("height", function(d) { return d.height; })
    .attr("opacity", "0.2")
    .on("mouseover", tip.show)
    .on("mouseout", tip.hide);

svg.append("text")
    .text("A 24 hour snapshot of Reddit")
    .attr("x", 70)
    .attr("y", 450)
    .style("font-family","Rubik, sans-serif")
    .style("font-size", "72px")
    .style("font-weight", "bold");

svg.append("text")
    .text("Visualizing the front page of the Internet")
    .attr("x", 70)
    .attr("y", 500)
    .style("font-family","Rubik, sans-serif")
    .style("font-size", "40px")
    .style("font-weight", "bold");

svg.append("text")
    .text("Hanna Kim, Jennifer Lee, Sarah Lucioni, and Andrew Shackelford")
    .attr("x", 70)
    .attr("y", 600)
    .style("font-family","Rubik, sans-serif")
    .style("font-size", "30px")
    .style("font-weight", "bold");

