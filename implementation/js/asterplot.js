// inspired by http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

AsterPlot = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}

AsterPlot.prototype.initVis = function() {
    var vis = this;

    vis.width = 600;
    vis.height = 600;
    vis.radius = Math.min(vis.width, vis.height) / 2 - 50;
    vis.innerRadius = 0;//0.3 * vis.radius;

    vis.tip = d3.tip()
        .attr('class', 'd3-tip-padding')
        .offset([0, 0])
        .html(function(d, i) {
            return "<span style='color:#72ffff'>" + i + ":00 </span>" +
                "<br>" + (d.data.total).toLocaleString() + " comments" +
                "<br>" + "Avg. controversiality: " + d.data.controversiality.toFixed(2) +
                "<br>" + "Avg. score: " + d.data.score.toFixed(2);
    });

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

    vis.svg.call(vis.tip);

    // aggregate all data associated with an hour in the day
    vis.byHour = [];

    var grouped = _.groupBy(vis.data, function(d) {
        return d.hour;
    });

    (Object.values(grouped)).forEach(function(hour) {
        hour.sort(vis.compareTotal)
    });

    console.log(grouped)

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
            "top5" : top5,
            "total" : total,
            "controversiality" : controversiality,
            "score" : score,
            // temporary color scheme (built-in)
            "color" : d3.interpolateBlues(hourInt/24)
        });
    });

    vis.byHour.sort(vis.compareHour);

    console.log(vis.byHour)

    vis.updatePlotType();

    d3.select("#asterplot-pie-0").dispatch('click');
}

AsterPlot.prototype.updatePlotType = function() {
    var vis = this;

    var asterType = d3.select("#aster-type").node().value;

    vis.arc.outerRadius(function (d) {
        if (asterType === "controversiality") {
            return (vis.radius - vis.innerRadius) * (d.data.controversiality * 1.21) + vis.innerRadius;
        }
        if (asterType === "comments") {
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
            return d.data.color;
        })
        .attr("class", "solidArc")
        .attr("stroke", "black")
        .attr("d", vis.arc)
        .attr("id", function(d) {
            return "asterplot-pie-" + d.data["hour"];
        })
        .on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide)
        .on("click", function(d){
            console.log(d);
            vis.tableCreate(d)
        });

    var outerPath = vis.svg.selectAll(".outlineArc")
        .data(vis.pie(vis.byHour))
        .enter().append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("class", "outlineArc")
        .attr("d", vis.outlineArc);

    /*
    var centerText = vis.svg.append("svg:text")
        .attr("class", "center-text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle") // text-align: right
        .text(function(d){
            if (asterType === "controversiality") {
                return "Avg. Controversiality";
            }
            if (asterType === "comments") {
                return "# of Comments";
            }
            if (asterType === "score") {
                return "Avg. Score";
            }
        });*/
}

AsterPlot.prototype.tableCreate = function(d){
    var tableHolder =  document.getElementById("aster-table");
    tableHolder.innerHTML = "";
    var tbl  = document.createElement('table');
    tbl.className = "table table-bordered";
    tbl.style.width  = '100px';
    // tbl.style.border = '1px solid black';

    var tableTitle = document.createElement('h3');
    tableTitle.appendChild(document.createTextNode("Top 5 Most Active Subreddits at " + (d.data["hour"]) + ":00"))

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
}

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
}


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
}


AsterPlot.prototype.changeSelectBox = function (id) {
    var vis = this;

    document.getElementById("aster-type").selectedIndex = id;

    vis.updatePlotType();
}
