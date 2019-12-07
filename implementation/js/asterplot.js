// inspired by http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

AsterPlot = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
};

AsterPlot.prototype.initVis = function() {
    var vis = this;

    vis.parser = d3.timeParse("%H");
    vis.formatter = d3.timeFormat("%I %p");

    vis.data.forEach(function(d) { // convert to EDT
        d.hour = +d.hour < 4 ? +d.hour + 20 : +d.hour - 4;
        d.prettyHour = vis.formatter(vis.parser(d.hour)).replace(/^0+/, '');
    });

    vis.width = 600;
    vis.height = 600;
    vis.radius = Math.min(vis.width, vis.height) / 2 - 50;
    vis.innerRadius = 0;

    vis.tip = d3.select("#asterplot").append("div")
        .attr("class", "d3-tip-aster")
        .style("display", "none");

    vis.pie = d3.pie()
        .sort(null)
        .value(1);

    vis.arc = d3.arc()
        .innerRadius(vis.innerRadius);

    vis.outlineArc = d3.arc()
        .innerRadius(vis.innerRadius)
        .outerRadius(vis.radius);

    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width)
        .attr("height", vis.height)
        .append("g")
        .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")");

    vis.colorScale = d3.scaleSequential(d3.interpolateBlues);

    // aggregate all data associated with an hour in the day
    vis.byHour = [];

    var grouped = _.groupBy(vis.data, function(d) {
        return d.hour;
    });

    (Object.values(grouped)).forEach(function(hour) {
        hour.sort(vis.compareTotal)
    });

    Object.keys(grouped).forEach(function(key, i) {
        var total = 0,
            controversiality = 0,
            score = 0,
            top5 = [],
            byHourObj = grouped[key];

        // for some reason using a for loop broke everything, so using bad code for now
        top5.push({"subreddit" : byHourObj[0]["subreddit"], "count" : (byHourObj[0]["total"]).toLocaleString()});
        top5.push({"subreddit" : byHourObj[1]["subreddit"], "count" : (byHourObj[1]["total"]).toLocaleString()});
        top5.push({"subreddit" : byHourObj[2]["subreddit"], "count" : (byHourObj[2]["total"]).toLocaleString()});
        top5.push({"subreddit" : byHourObj[3]["subreddit"], "count" : (byHourObj[3]["total"]).toLocaleString()});
        top5.push({"subreddit" : byHourObj[4]["subreddit"], "count" : (byHourObj[4]["total"]).toLocaleString()});

        byHourObj.forEach(function(subreddit){
            total += subreddit["total"];
            controversiality += subreddit["controversiality"];
            score += subreddit["score"]
        });
        var hourInt = parseInt(key);
        vis.byHour.push({
            "hour" : hourInt,
            "prettyHour" : vis.formatter(vis.parser(hourInt)).replace(/^0+/, ''),
            "top5" : top5,
            "total" : total,
            "controversiality" : controversiality,
            "score" : score,
        });
    });

    vis.byHour.sort(vis.compareHour);

    vis.updatePlotType();

    d3.select("#asterplot-pie-0").dispatch('click');
};

AsterPlot.prototype.updatePlotType = function() {
    var vis = this;

    var asterType = d3.select("#aster-type").node().value;

    var extent = d3.extent(vis.byHour, function (d) {
        return d[asterType.toString()];
    });

    vis.colorScale.domain(extent);

    vis.arc.outerRadius(function (d) {
        if (asterType === "controversiality") {
            return (vis.radius - vis.innerRadius) * (d.data.controversiality * 1.21) + vis.innerRadius;
        }
        if (asterType === "total") {
            return (vis.radius - vis.innerRadius) * (d.data.total / 56000) + vis.innerRadius;
        }
        if (asterType === "score") {
            return (vis.radius - vis.innerRadius) * (d.data.score / 350) + vis.innerRadius;
        }
    });

    vis.svg.selectAll('.solidArc')
        .data([])
        .exit().remove();

    vis.svg.selectAll('.center-text')
        .text("")
        .exit().remove();

    vis.path = vis.svg.selectAll(".solidArc")
        .data(vis.pie(vis.byHour))
        .enter().append("path")
        .attr("fill", function(d) {
                return vis.colorScale(d.data[asterType.toString()])
        })
        .attr("class", "solidArc")
        .attr("stroke", "black")
        .attr("d", vis.arc)
        .attr("id", function(d) {
            return "asterplot-pie-" + d.data["hour"];
        })
        .style('opacity', 0);

    vis.path.transition()
        .duration(300)
        .delay(function(d,i){ return i * 25; })
        .style('opacity', 1);

    vis.xOffset = 0;

    vis.path.on('mouseover', function(d) {
            vis.xOffset = d3.select("#aster-container").node().getBoundingClientRect().x;
            vis.tip.style("display", "inline");
            vis.tip.html("<span style='color:#72ffff'>" + d.data.prettyHour + "</span>" +
                "<br>" + (d.data.total).toLocaleString() + " comments" +
                "<br>" + "Avg. controversiality: " + d.data.controversiality.toFixed(2) +
                "<br>" + "Avg. score: " + d.data.score.toFixed(2));
        })
        .on('mousemove', function (d) {
            vis.tip
                .style("left", (d3.event.x - vis.xOffset - 67) + "px")
                .style("top", (d3.event.y - 182) + "px");
        })
        .on('mouseout', function() { vis.tip.style("display", "none"); })
        .on("click", function(d){
            vis.tableCreate(d)
        });

    // do not remove code, even though var outerPath is not being used
    var outerPath = vis.svg.selectAll(".outlineArc")
        .data(vis.pie(vis.byHour))
        .enter().append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("class", "outlineArc")
        .attr("d", vis.outlineArc);

    // appending hour markers to plot
    vis.svg.append("text")
        .attr("x", "0")
        .attr("y", "-260")
        .attr("text-anchor", "middle")
        .attr("class", "hourText")
        .text("12 AM");

    vis.svg.append("text")
        .attr("x", "0")
        .attr("y", "270")
        .attr("text-anchor", "middle")
        .attr("class", "hourText")
        .text("12 PM");

    vis.svg.append("text")
        .attr("x", "275")
        .attr("y", "30")
        .attr("y", "5")
        .attr("text-anchor", "middle")
        .attr("class", "hourText")
        .text("6 AM");

    vis.svg.append("text")
        .attr("x", "-275")
        .attr("y", "5")
        .attr("text-anchor", "middle")
        .attr("class", "hourText")
        .text("6 PM");

};

AsterPlot.prototype.tableCreate = function(d){
    var tableHolder =  document.getElementById("aster-table");
    tableHolder.innerHTML = "";
    var tbl  = document.createElement('table');
    tbl.className = "table table-bordered";
    tbl.style.width  = '100px';

    var tableTitle = document.createElement('h3');
    tableTitle.appendChild(document.createTextNode("Top 5 Most Active Subreddits at " + (d.data["prettyHour"])))

    var thr = tbl.insertRow();

    var thd1 = thr.insertCell();
    thd1.innerHTML = "Subreddit";

    var thd2 = thr.insertCell();
    thd2.appendChild(document.createTextNode("# of Comments"));

    for (var i = 0; i < 5; i++){
        var tr = tbl.insertRow();

        var td1 = tr.insertCell();
        td1.appendChild(document.createTextNode("r/" + d.data["top5"][i]["subreddit"]));

        var td2 = tr.insertCell();
        td2.appendChild(document.createTextNode(d.data["top5"][i]["count"]));
    }
    tableHolder.appendChild(tableTitle);
    tableHolder.appendChild(tbl);
};

//https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
AsterPlot.prototype.compareTotal = function(a, b, cat) {
    var totalA = a.total;
    var totalB = b.total;

    var comparison = 0;
    if (totalA >= totalB) {
        comparison = -1;
    } else if (totalA <= totalB) {
        comparison = 1;
    }
    return comparison;
};


AsterPlot.prototype.compareHour = function(a, b) {
    var totalA = a.hour;
    var totalB = b.hour;

    var comparison = 0;
    if (totalA <= totalB) {
        comparison = -1;
    } else if (totalA >= totalB) {
        comparison = 1;
    }
    return comparison;
};


AsterPlot.prototype.changeSelectBox = function (id) {
    var vis = this;

    document.getElementById("aster-type").selectedIndex = id;

    vis.updatePlotType();
};

AsterPlot.prototype.showTrend = function(idx) {
    var vis = this;

    if (idx == 0) {
        vis.changeSelectBox(0);

        d3.select("#asterplot-pie-16")
            .attr("stroke", "#ff6314")
            .attr("stroke-width", "5")
    } else if (idx == 2) {
        vis.changeSelectBox(2);

        d3.select("#asterplot-pie-9")
            .attr("stroke", "#ff6314")
            .attr("stroke-width", "5")
    }


    // vis.updatePlotType();
}