
// Create SVG and set margins
var margin = {top: 10, right: 10, bottom: 10, left: 100},
    width = 900 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

// Append divs for tooltip
var divComments = d3.select("body").append("div")
    .attr("class", "tooltip-div")
    .style("position", "absolute")
    .style("z-index", "10")
    .attr("opacity", 0);

var divScore = d3.select("body").append("div")
    .attr("class", "tooltip-div")
    .style("position", "absolute")
    .style("z-index", "10")
    .attr("opacity", 0);

var divCont = d3.select("body").append("div")
    .attr("class", "tooltip-div")
    .style("position", "absolute")
    .style("z-index", "10")
    .attr("opacity", 0);

// Append svg
var svg = d3.select("#treemap").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var filteredData = [];
var root;
var currTree = "treemapSquarify";
var tooltip = svg.append("g")
    .attr("id", "tooltip");

// Tooltip body
tooltip.append("rect")
    .attr("x", 400)
    .attr("y", 2)
    .attr("rx", 4)
    .attr("width", 400)
    .attr("height", height - 4)
    .attr("fill", "#2D76B3")
    .attr("opacity", 0);

// Tooltip title text (will be subreddit name)
tooltip.append("text")
    .attr("id", "tooltip-text")
    .attr("x", 600)
    .attr("y", 40)
    .text("")
    .attr("font-size", "22px")
    .attr("font-weight", "bold")
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .attr("opacity", 0);

var treemapBtn = d3.select(".treemap-btn").style("visibility", "hidden");


// Load data
d3.json("data/top25Stats.json", function(error, jsonData){
    if (!error) {
        filteredData = jsonData;

        console.log(filteredData);

        wrangleData()
    }
});


function wrangleData() {
    // Cleaned data using this logic, saved important statistics for quicker load time
    // Group comments by subreddit
    // filteredData = d3.nest()
    //     .key(function (d) { return d.subreddit})
    //     .entries(allData);
    //
    // // Sort data by popularity of subreddit
    // filteredData.sort(function (a, b) {
    //     return b.values.length - a.values.length;
    // });
    //
    // console.log(filteredData);


    // Only look at the top X amount
    var top25 = filteredData;

    // Create hierarchy to implement treemap
    top25.push({ key:"ORIGIN", values: 0 });

    root = d3.stratify()
        .id(function (d) { return d.key })
        .parentId(function (d) {
            if (d.key != "ORIGIN") {
                return "ORIGIN";
            } else {
                return "";
            }
        })
        (top25);

    root.sum(function (d) { return d.values });

    createTreeLayout();
}


function createTreeLayout() {

    // Treemap sources: https://d3-wiki.readthedocs.io/zh_CN/master/Treemap-Layout/
    // https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap
    var treemapLayout = d3.treemap();

    // Which type of treemap to implement (slice will show tooltip)
    if (currTree === "treemapSquarify") {
        treemapLayout.tile(d3.treemapSquarify);
    } else {
        treemapLayout.tile(d3.treemapSlice);
    }

    treemapLayout
        .size([width, height])
        .padding(3)
        (root);

    updateVis();
}


function updateVis() {

    // Draw treemap to svg
    var rects = svg.selectAll(".subreddit-rect")
        .data(root.leaves());

    rects.enter()
        .append("rect")
        .attr("class", "subreddit-rect")
        .on("click", function (d) {
            if (currTree == "treemapSquarify") {
                currTree = "treemapSlice";
            } else {
                currTree = "treemapSlice";
            }

            clicked(d);
            createTreeLayout();
        })
        .merge(rects)
        .transition()
        .duration(600)
        .attr("x", function (d) {
            return d.x0;
        })
        .attr("y", function (d) {
            return d.y0;
        })
        .attr('width', function (d) {
            if (currTree === "treemapSlice") {
                return d.x1 - d.x0 - 300;
            } else {
                return d.x1 - d.x0;
            }
        })
        .attr('height', function (d) {
            return d.y1 - d.y0;
        })
        .attr("stroke", "black")
        .attr("fill", "#2D76B3")
        .attr("transform", function(d) {
            if (currTree == "treemapSlice") {
                return "translate(" + (-margin.left) + ", 0)"
            } else {
                return "translate(0, 0)"
            }
        });

    // Highlight selected subreddit
    var rectSelection = svg.selectAll(".subreddit-rect");
    rectSelection.on("mouseover", function () {
        rectSelection.attr("opacity", 0.85);
        d3.select(this).attr("opacity", 1);
    }).on("mouseout", function() {
        rectSelection.attr("opacity", 1);
    });

    rects.exit().remove();

    // Add labels to each block
    var labels = svg.selectAll(".subreddit-text")
        .data(root.leaves());

    labels.enter()
        .append("text")
        .attr("class", "subreddit-text")
        .merge(labels)
        .transition()
        .duration(600)
        .attr("x", function(d) {
            return d.x0 + 5
        })
        .attr("y", function(d) {
            return d.y0 + 15
        })
        .text(function (d) {
            var label = d.data.key;
            if (displayLabel(d.y1 - d.y0, d.x1 - d.x0, label)) {
                return label
            }
        })
        .attr("font-size", "12px")
        .attr("fill", "white")
        .attr("transform", function(d) {
            if (currTree === "treemapSlice") {
                return "translate(" + (-margin.left) + ", 0)"
            } else {
                return "translate(0, 0)"
            }
        });

    labels.exit().remove();
}


function displayLabel(height, width, label) {
    if (height >= 20 && label.length <= width / 6) {
        return true;
    } else {
        return false;
    }
}


function clicked(d) {
    // console.log(d.data.key + " was clicked")
    console.log(d);

    // Update tooltip if needed
    if (currTree === "treemapSlice") {
        d3.select("#tooltip").select("rect")
            .transition()
            .duration(600)
            .attr("opacity", 0.5);

        d3.select("#tooltip").select("#tooltip-text")
            .transition()
            .duration(600)
            .attr("opacity", 1)
            .text(d.data.key);

        d3.select("#tooltip").select("#tooltip-text-comments")
            .transition()
            .duration(600)
            .attr("opacity", 1)
            .text((d.data.values).toLocaleString());


        var htmlStr = "<h5>Controversiality</h5>";
        htmlStr += "<ul class='treemap-ul'><li><b>" + (d.data.controversial).toLocaleString() + "</b> controversial comments</li>";
        htmlStr += "<li><b>" + d3.format(".2%")(d.data.percent_cont) + "</b> controversial</li></ul>";
        divCont.html(htmlStr)
            .transition()
            .duration(600)
            .style("left", 530 + "px")
            .style("top", 120 + "px")
            .attr("opacity", 1);

        var htmlStr = "<h5>Comments</h5>";
        htmlStr += "<ul class='treemap-ul'><li><b>" + (d.data.values).toLocaleString() + "</b> comments</li>";
        htmlStr += "<li><b>" + d3.format(".2%")(d.data.percentage) + "</b> of all comments</li></ul>";
        divComments.html(htmlStr)
            .transition()
            .duration(600)
            .style("left", 530 + "px")
            .style("top", 220 + "px")
            .attr("opacity", 1);

        htmlStr = "<h5>Scores</h5>";
        htmlStr += "<ul class='treemap-ul'><li><b>" + Math.round(d.data.avg_score) + "</b> average score</li>";
        htmlStr += "<li><b>" + (d.data.top_score).toLocaleString() + "</b> top score</li>";
        htmlStr += "<li>top comment:</li></ul>";
        htmlStr += "<p class='treemap-p'>\"" + d.data.top_comment + "\"</p>";
        htmlStr += "<ul class='treemap-ul'><li><b>" + (d.data.low_score).toLocaleString() + "</b> lowest score</li>";
        htmlStr += "<li>lowest comment:</li></ul>";
        htmlStr += "<p class='treemap-p'>\"" + d.data.low_comment + "\"</p>";
        divScore.html(htmlStr)
            .transition()
            .duration(600)
            .style("left", 530 + "px")
            .style("top", 320 + "px")
            .attr("opacity", 1);

        var timer = d3.timer(function(elapsed) {
            divCont.style("visibility", "visible");
            divComments.style("visibility", "visible");
            divScore.style("visibility", "visible");
            treemapBtn.style("visibility", "visible");
            timer.stop();
        }, 400)

    } else {
        d3.select("#tooltip").select("rect")
            .transition()
            .duration(600)
            .attr("opacity", 0);

        d3.select("#tooltip").select("text")
            .transition()
            .duration(600)
            .attr("opacity", 0);

        divCont.style("visibility", "hidden");

        divComments.style("visibility", "hidden");

        divScore.style("visibility", "hidden");

        treemapBtn.style("visibility", "hidden");

        createTreeLayout();
    }
}

// If button is clicked, return to square treemap display
function toTreemap() {
    currTree = "treemapSquarify";
    clicked(null);
}

