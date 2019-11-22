
TreeMap = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}

TreeMap.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 10, right: 10, bottom: 10, left: 100}
    vis.width = 900 - vis.margin.left - vis.margin.right;
    vis.height = 700 - vis.margin.top - vis.margin.bottom;

    // Append divs for tooltip
    vis.divComments = d3.select(".treemap-container").append("div")
        .attr("class", "tooltip-div")
        .style("position", "absolute")
        .style("z-index", "10")
        .attr("opacity", 0);

    vis.divScore = d3.select(".treemap-container").append("div")
        .attr("class", "tooltip-div")
        .style("position", "absolute")
        .style("z-index", "10")
        .attr("opacity", 0);

    vis.divCont = d3.select(".treemap-container").append("div")
        .attr("class", "tooltip-div")
        .style("position", "absolute")
        .style("z-index", "10")
        .attr("opacity", 0);

    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.currTree = "treemapSquarify";
    vis.tooltip = vis.svg.append("g")
        .attr("id", "tooltip");

    // Tooltip body
    vis.tooltip.append("rect")
        .attr("x", 400)
        .attr("y", 2)
        .attr("rx", 4)
        .attr("width", 400)
        .attr("height", vis.height - 4)
        .attr("fill", "#2D76B3")
        .attr("opacity", 0);

    // Tooltip title text (will be subreddit name)
    vis.tooltip.append("text")
        .attr("id", "tooltip-text")
        .attr("x", 600)
        .attr("y", 40)
        .text("")
        .attr("font-size", "22px")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("opacity", 0);

    vis.treemapBtn = d3.select(".treemap-btn").style("visibility", "hidden");

    // Tooltip to display subreddit name
    vis.nameTooltip = d3.tip()
        .attr("class", "d3-tip")
        .html(function (d) {
            return "<h6>" + d.data.key + "</h6>";
        });

    vis.wrangleData()

}



TreeMap.prototype.wrangleData = function() {
    var vis = this;

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
    var top25 = vis.data;

    // Create hierarchy to implement treemap
    top25.push({ key:"ORIGIN", values: 0 });

    vis.root = d3.stratify()
        .id(function (d) { return d.key })
        .parentId(function (d) {
            if (d.key != "ORIGIN") {
                return "ORIGIN";
            } else {
                return "";
            }
        })
        (top25);

    vis.root.sum(function (d) { return d.values });

    vis.createTreeLayout();
}


TreeMap.prototype.createTreeLayout = function() {
    var vis = this;

    // Treemap sources: https://d3-wiki.readthedocs.io/zh_CN/master/Treemap-Layout/
    // https://github.com/d3/d3-hierarchy/blob/master/README.md#treemap
    var treemapLayout = d3.treemap();

    // Which type of treemap to implement (slice will show tooltip)
    if (vis.currTree === "treemapSquarify") {
        treemapLayout.tile(d3.treemapSquarify);
    } else {
        treemapLayout.tile(d3.treemapSlice);
    }

    treemapLayout
        .size([vis.width, vis.height])
        .padding(3)
        (vis.root);

    vis.updateVis();
}


TreeMap.prototype.updateVis = function() {
    var vis = this;

    // Draw treemap to svg
    var rects = vis.svg.selectAll(".subreddit-rect")
        .data(vis.root.leaves());

    rects.enter()
        .append("rect")
        .attr("class", "subreddit-rect")
        .on("click", function (d) {
            if (vis.currTree == "treemapSquarify") {
                vis.currTree = "treemapSlice";
            } else {
                vis.currTree = "treemapSlice";
            }

            vis.nameTooltip.hide();
            vis.clicked(d);
            vis.createTreeLayout();
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
            if (vis.currTree === "treemapSlice") {
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
            if (vis.currTree == "treemapSlice") {
                return "translate(" + (-vis.margin.left) + ", 0)"
            } else {
                return "translate(0, 0)"
            }
        });

    // show name tooltip on mouseover
    vis.svg.selectAll(".subreddit-rect").call(vis.nameTooltip);

    // Highlight selected subreddit
    var rectSelection = vis.svg.selectAll(".subreddit-rect");
    rectSelection.on("mouseover", function (d) {
        rectSelection.attr("opacity", 0.85);
        d3.select(this).attr("opacity", 1);
        vis.nameTooltip.show(d);
    }).on("mouseout", function(d) {
        rectSelection.attr("opacity", 1);
        vis.nameTooltip.hide(d);
    });

    rects.exit().remove();

    // Add labels to each block
    var labels = vis.svg.selectAll(".subreddit-text")
        .data(vis.root.leaves());

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
            if (vis.displayLabel(d.y1 - d.y0, d.x1 - d.x0, label)) {
                return label
            }
        })
        .attr("font-size", "12px")
        .attr("fill", "white")
        .attr("transform", function(d) {
            if (vis.currTree === "treemapSlice") {
                return "translate(" + (-vis.margin.left) + ", 0)"
            } else {
                return "translate(0, 0)"
            }
        });

    labels.exit().remove();
}


TreeMap.prototype.displayLabel = function(height, width, label) {
    if (height >= 20 && label.length <= width / 6) {
        return true;
    } else {
        return false;
    }
}


TreeMap.prototype.clicked = function(d) {
    var vis = this;
    // console.log(d.data.key + " was clicked")
    console.log(d);

    // Update tooltip if needed
    if (vis.currTree === "treemapSlice") {
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
        vis.divCont.html(htmlStr)
            .transition()
            .duration(600)
            .style("left", 510 + "px")
            .style("top", 105 + "px")
            .attr("opacity", 1);

        var htmlStr = "<h5>Comments</h5>";
        htmlStr += "<ul class='treemap-ul'><li><b>" + (d.data.values).toLocaleString() + "</b> comments</li>";
        htmlStr += "<li><b>" + d3.format(".2%")(d.data.percentage) + "</b> of all comments</li></ul>";
        vis.divComments.html(htmlStr)
            .transition()
            .duration(600)
            .style("left", 510 + "px")
            .style("top", 205 + "px")
            .attr("opacity", 1);

        htmlStr = "<h5>Scores</h5>";
        htmlStr += "<ul class='treemap-ul'><li><b>" + Math.round(d.data.avg_score) + "</b> average score</li>";
        htmlStr += "<li><b>" + (d.data.top_score).toLocaleString() + "</b> top score</li>";
        htmlStr += "<li>top comment:</li></ul>";
        htmlStr += "<p class='treemap-p'>\"" + d.data.top_comment + "\"</p>";
        htmlStr += "<ul class='treemap-ul'><li><b>" + (d.data.low_score).toLocaleString() + "</b> lowest score</li>";
        htmlStr += "<li>lowest comment:</li></ul>";
        htmlStr += "<p class='treemap-p'>\"" + d.data.low_comment + "\"</p>";
        vis.divScore.html(htmlStr)
            .transition()
            .duration(600)
            .style("left", 510 + "px")
            .style("top", 305 + "px")
            .attr("opacity", 1);

        var timer = d3.timer(function(elapsed) {
            vis.divCont.style("visibility", "visible");
            vis.divComments.style("visibility", "visible");
            vis.divScore.style("visibility", "visible");
            vis.treemapBtn.style("visibility", "visible");
            timer.stop();
        }, 400)

        console.log("hello")
        console.log(htmlStr);

    } else {
        d3.select("#tooltip").select("rect")
            .transition()
            .duration(600)
            .attr("opacity", 0);

        d3.select("#tooltip").select("text")
            .transition()
            .duration(600)
            .attr("opacity", 0);

        vis.divCont.style("visibility", "hidden");

        vis.divComments.style("visibility", "hidden");

        vis.divScore.style("visibility", "hidden");

        vis.treemapBtn.style("visibility", "hidden");

        vis.createTreeLayout();
    }
}

// If button is clicked, return to square treemap display
TreeMap.prototype.toTreemap = function () {
    var vis = this;

    vis.currTree = "treemapSquarify";
    vis.clicked(null);
}

