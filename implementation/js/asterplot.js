// inspired by http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

AsterPlot = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}

AsterPlot.prototype.initVis = function() {
    var vis = this;

    vis.width = 750;
    vis.height = 750;
    vis.radius = Math.min(vis.width, vis.height) / 2;
    vis.innerRadius = 0.3 * vis.radius;

    vis.tip = d3.tip()
        .attr('class', 'd3-tip-padding')
        .offset([0, 0])
        .html(function(d, i) {
            return "<span style='color:#72ffff'>" + (i + 1) + ":00 </span>" +
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

    Object.keys(grouped).forEach(function(key, i) {
        var total = 0,
            controversiality = 0,
            score = 0;

        grouped[key].forEach(function(subreddit){
            total += subreddit["total"];
            controversiality += subreddit["controversiality"];
            score += subreddit["score"]
        });

        vis.byHour.push({
            "hour" : key,
            "total" : total,
            "controversiality" : controversiality,
            "score" : score,
            // temporary color scheme (built-in)
            "color" : d3.interpolateBlues(i/24)
        });
    });

    vis.updatePlotType();
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
        .on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide);

    var outerPath = vis.svg.selectAll(".outlineArc")
        .data(vis.pie(vis.byHour))
        .enter().append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("class", "outlineArc")
        .attr("d", vis.outlineArc);

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
        });
}
