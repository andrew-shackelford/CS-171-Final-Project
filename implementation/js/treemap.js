
TreeMap = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}

TreeMap.prototype.initVis = function() {
    var vis = this;

    vis.margin = {top: 10, right: 10, bottom: 10, left: 100}
    vis.width = 1050 - vis.margin.left - vis.margin.right;
    vis.height = 650 - vis.margin.top - vis.margin.bottom;

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
        .attr("id", "tooltip-rect")
        .attr("x", 400)
        .attr("y", 2)
        .attr("rx", 4)
        .attr("width", 500)
        .attr("height", vis.height - 4)
        .attr("fill", "#2D76B3")
        .attr("opacity", 0);

    // Tooltip title text (will be subreddit name)
    vis.tooltip.append("text")
        .attr("id", "tooltip-text")
        .attr("x", 650)
        .attr("y", 40)
        .text("")
        .attr("font-size", "22px")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .attr("opacity", 0);

    // Append divs for tooltip through a foreign object
    vis.foTable = vis.tooltip.append('foreignObject')
        .attr("id", "tooltip-fo")
        .attr("x", 403)
        .attr("y", 50)
        .attr("width", 500)
        .attr("height", vis.height - 4)
        .style("visibility", "hidden");

    vis.divFoTable = vis.foTable.append('xhtml:div')
        .append('div')
        .attr("class", "tooltip-div")
        .style("position", "absolute")
        .style("z-index", "10")
        .attr("opacity", 0);

    vis.foScore = vis.tooltip.append('foreignObject')
        .attr("id", "tooltip-fo")
        .attr("x", 403)
        .attr("y", 210)
        .attr("width", 500)
        .attr("height", vis.height - 4)
        .style("visibility", "hidden");

    vis.divFoScore = vis.foScore.append('xhtml:div')
        .append("div")
        .attr("class", "tooltip-div")
        .style("position", "absolute")
        .style("z-index", "10")
        .attr("opacity", 0);


    vis.subredditStroke = ["black", "black", "black", "black", "black", "black", "black", "black",
        "black", "black", "black", "black", "black", "black", "black", "black", "black", "black",
        "black", "black", "black", "black", "black", "black", "black"];

    vis.clickedElement = [null, null, null];

    vis.treemapBtn = d3.select(".treemap-btn").style("visibility", "hidden");


    // Tooltip to display when hovering over treemap tile
    vis.nameTooltip = d3.tip()
        .attr("class", "d3-tip")
        .html(function (d) {
            var htmlStr = "<h6>" + d.data.key + "</h6>";

            if (vis.colorValue === "avg-score") {
                htmlStr += "<p style='font-size: 13px'>Average score: <b>" + Math.round(d.data.avg_score) +
                    "</b></p>"
            } else if (vis.colorValue === "top-score") {
                htmlStr += "<p style='font-size: 13px'>Top score: <b>" + (d.data.top_score).toLocaleString() +
                    "</b> </p>"
            } else if (vis.colorValue === "low-score") {
                htmlStr += "<p style='font-size: 13px'>Lowest score: <b>" + (d.data.low_score).toLocaleString() +
                    "</b> </p>"
            } else {
                htmlStr += "<p style='font-size: 13px'>Percent controversial: <b>" + d3.format(".1%")(d.data.percent_cont) +
                    "</b> </p>"
            }

            htmlStr += "<p style='font-size: 12px'>Click to learn more</p>";
            return htmlStr;
        });


    // Fill for rect
    vis.colorValue = "avg-score";

    vis.extentAvgScore = d3.extent(vis.data, function (d) {
        return d.avg_score;
    });

    vis.extentTopScore = d3.extent(vis.data, function (d) {
        return d.top_score;
    });

    vis.extentLowScore = d3.extent(vis.data, function (d) {
        return d.low_score;
    });

    vis.extentCont = d3.extent(vis.data, function (d) {
        return d.percent_cont;
    });

    // Set up sequential color scale and legend
    vis.colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain(vis.extentAvgScore);

    // Legend from https://d3-legend.susielu.com/#summary
    vis.legendSvg = d3.select("#treemap-legend");
    vis.legendSvg.append("g")
        .attr("class", "legendLinear")
        .attr("transform", "translate(0, 0)");
    vis.legendLinear = d3.legendColor()
        .shapeWidth(75)
        .orient("horizontal")
        .scale(vis.colorScale);

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
        // .on("click", function (d, i) {
        //     if (vis.currTree === "treemapSquarify") {
        //         vis.currTree = "treemapSlice";
        //     } else {
        //         vis.currTree = "treemapSlice";
        //     }
        //
        //     vis.nameTooltip.hide();
        //     vis.clicked(d, i);
        //     vis.createTreeLayout();
        // })
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
                return d.x1 - d.x0 - 450;
            } else {
                return d.x1 - d.x0;
            }
        })
        .attr('height', function (d) {
            return d.y1 - d.y0;
        })
        .attr("stroke", function (d, i) {
            return vis.subredditStroke[i]
        })
        .attr("stroke-width", function (d, i) {
            if (vis.subredditStroke[i] !== "black") {
                return 3
            } else {
                return 1
            }
        })
        .attr("fill", function (d) {
            if (vis.colorValue === "avg-score") {
                vis.colorScale.domain(vis.extentAvgScore);
                vis.colorScale.interpolator(d3.interpolateBlues);
                vis.legendLinear.labelFormat(d3.format(".2"));

                // return d3.interpolateBlues(vis.colorScale(d.data.avg_score))
                return vis.colorScale(d.data.avg_score)
            } else if (vis.colorValue === "top-score") {
                vis.colorScale.domain(vis.extentTopScore);
                vis.colorScale.interpolator(d3.interpolateBlues);
                vis.legendLinear.labelFormat(d3.format(",.4r"));

                // return d3.interpolateBlues(vis.colorScale(d.data.top_score))
                return vis.colorScale(d.data.top_score)
            } else if (vis.colorValue === "low-score") {
                vis.colorScale.domain(vis.extentLowScore);
                vis.colorScale.interpolator(d3.interpolateBlues);
                vis.legendLinear.labelFormat(d3.format(",.3r"));

                // return d3.interpolateBlues(vis.colorScale(d.data.low_score))
                return vis.colorScale(d.data.low_score)
            } else {
                vis.colorScale.domain(vis.extentCont);
                vis.colorScale.interpolator(d3.interpolateRdYlGn);
                vis.interpolator = vis.colorScale.interpolator();
                vis.mirror = function(t) {
                    return vis.interpolator(1 - t);
                };
                vis.colorScale.interpolator(vis.mirror);
                vis.legendLinear.labelFormat(d3.format(".0%"));

                // return d3.interpolateRdYlGn(0.9 - vis.colorScale(d.data.percent_cont))
                return vis.colorScale(d.data.percent_cont)
            }
        })
        .attr("opacity", 0.85)
        .attr("transform", function(d) {
            if (vis.currTree === "treemapSlice") {
                return "translate(" + (-vis.margin.left) + ", 0)"
            } else {
                return "translate(-10, 0)"
            }
        });


    vis.legendLinear.scale(vis.colorScale);
    vis.legendSvg.select(".legendLinear").call(vis.legendLinear);

    // show name tooltip on mouseover
    vis.svg.selectAll(".subreddit-rect").call(vis.nameTooltip);

    // Highlight selected subreddit
    var rectSelection = vis.svg.selectAll(".subreddit-rect");
    rectSelection.on("mouseover", function (d) {
        rectSelection.attr("opacity", 0.85);
        d3.select(this).attr("opacity", 1);
        vis.nameTooltip.show(d);
    }).on("mouseout", function(d) {
        rectSelection.attr("opacity", 0.85);
        vis.nameTooltip.hide(d);
    }).on("click", function (d, i) {
        if (vis.currTree === "treemapSquarify") {
            vis.currTree = "treemapSlice";
        } else {
            vis.currTree = "treemapSlice";
        }

        vis.nameTooltip.hide();
        vis.clicked(d, i, d3.select(this));
        vis.createTreeLayout();
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
        .attr("font-size", "11px")
        .attr("fill", "white")
        .attr("transform", function(d) {
            if (vis.currTree === "treemapSlice") {
                return "translate(" + (-vis.margin.left) + ", 0)"
            } else {
                return "translate(-10, 0)"
            }
        });

    labels.exit().remove();
}


TreeMap.prototype.displayLabel = function(height, width, label) {
    if (height >= 20 && label.length <= width / 5) {
        return true;
    } else {
        return false;
    }
}


TreeMap.prototype.clicked = function(d, index, rect) {
    var vis = this;
    // console.log(d.data.key + " was clicked")
    // console.log(d);

    // Update tooltip if needed
    if (vis.currTree === "treemapSlice") {
        // Update clicked element (save values for color scale change)
        vis.clickedElement = [d, index, rect];

        vis.subredditStroke = ["black", "black", "black", "black", "black", "black", "black", "black",
            "black", "black", "black", "black", "black", "black", "black", "black", "black", "black",
            "black", "black", "black", "black", "black", "black", "black"];
        vis.subredditStroke[index] = "#ff6314";
        rect.attr("stroke", "#ff6314");
        rect.attr("stroke-width", 5);

        d3.select("#tooltip").select("rect")
            .transition()
            .duration(600)
            .attr("opacity", 0.85)
            .attr("stroke-width", 2)
            .attr("stroke", "#ff6314")
            .attr("fill", function () {
                if (vis.colorValue === "avg-score") {
                    return vis.colorScale(d.data.avg_score)
                } else if (vis.colorValue === "top-score") {
                    return vis.colorScale(d.data.top_score)
                } else if (vis.colorValue === "low-score") {
                    return vis.colorScale(d.data.low_score)
                } else {
                    return vis.colorScale(d.data.percent_cont)
                }
            });


        d3.select("#tooltip").select("#tooltip-text")
            .transition()
            .duration(600)
            .attr("opacity", 1)
            .text(d.data.key);


        var htmlStr = "<div class='treemap-table-div'><table class='treemap-tooltip-table'><tr><th class='treemap-tooltip-header first'>Comments</th>" +
            "<th class='treemap-tooltip-header'>Controversiality</th></tr>" +
            "<tr><td class='treemap-tooltip-element'><b>" + (d.data.values).toLocaleString() + "</b> <br>comments</td>" +
            "<td class='treemap-tooltip-element'><b>" + (d.data.controversial).toLocaleString() + "</b> <br>controversial comments</td></tr>" +
            "<tr><td class='treemap-tooltip-element'><b>" + d3.format(".2%")(d.data.percentage) + "</b> <br>of all comments</td>" +
            "<td class='treemap-tooltip-element'><b>" + d3.format(".2%")(d.data.percent_cont) + "</b> <br>controversial</td></tr></table></div>";
        vis.divFoTable.html(htmlStr)
            .transition()
            .duration(600)
            .attr("opacity", 1);

        // htmlStr = "<h5 class='treemap-scores-header'>Scores</h5>";
        htmlStr = "<ul class='treemap-ul'><li><b>" + Math.round(d.data.avg_score) + "</b> average score</li>";
        htmlStr += "<li><b>" + (d.data.top_score).toLocaleString() + "</b> top score with comment:</li></ul>";
        htmlStr += "<p class='treemap-p'>\"" + d.data.top_comment + "\"</p>";
        htmlStr += "<ul class='treemap-ul'><li><b>" + (d.data.low_score).toLocaleString() + "</b> lowest score with comment:</li></ul>";
        htmlStr += "<p class='treemap-p'>\"" + d.data.low_comment + "\"</p>";
        vis.divFoScore.html(htmlStr)
            .transition()
            .duration(600)
            .attr("opacity", 1);

        var timer = d3.timer(function(elapsed) {
            vis.foTable.style("visibility", "visible");
            vis.foScore.style("visibility", "visible");
            vis.treemapBtn.style("visibility", "visible");
            timer.stop();
        }, 300)

    } else {
        vis.subredditStroke = ["black", "black", "black", "black", "black", "black", "black", "black",
            "black", "black", "black", "black", "black", "black", "black", "black", "black", "black",
            "black", "black", "black", "black", "black", "black", "black"];

        d3.select("#tooltip").select("rect")
            .transition()
            .duration(600)
            .attr("opacity", 0);

        d3.select("#tooltip").select("text")
            .transition()
            .duration(600)
            .attr("opacity", 0);

        vis.foTable.style("visibility", "hidden");

        vis.foScore.style("visibility", "hidden");

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

// Change the color of the treemap tiles based on score or controversiality
TreeMap.prototype.updateTreemapColor = function (btn) {
    var vis = this;

    vis.colorValue = btn.value;
    vis.updateVis();

    // If treemapSlice, update clicked/selected tooltip color
    if (vis.currTree === "treemapSlice") {
        vis.clicked(vis.clickedElement[0], vis.clickedElement[1], vis.clickedElement[2])
    }
}

