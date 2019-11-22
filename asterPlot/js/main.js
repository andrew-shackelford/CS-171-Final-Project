// inspired by http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

var width = 750,
    height = 750,
    radius = Math.min(width, height) / 2,
    innerRadius = 0.3 * radius;

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0, 0])
    .html(function(d, i) {
        return i + 1 + ":00" + ": <span>" + d.data.total + " comments" + "</span>" +
            "<br>" + "Avg. controversiality: " + d.data.controversiality.toFixed(2) +
            "<br>" + "Avg. score: " + d.data.score.toFixed(2);
    });

var pie = d3.pie()
    .sort(null)
    .value(1);

var arc = d3.arc()
    .innerRadius(innerRadius);

var outlineArc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(radius);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.call(tip);

// aggregate all data associated with an hour in the day
var byHour = [];

d3.json("data/hourly_stats.json", function(error, data) {
    // https://cdn.jsdelivr.net/lodash/4.17.2/lodash.min.js
    var grouped = _.groupBy(data, function(d) {
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

        byHour.push({
            "hour" : key,
            "total" : total,
            "controversiality" : controversiality,
            "score" : score,
            // temporary color scheme (built-in)
            "color" : d3.interpolateBlues(i/24)
        });
    });

    updatePlotType();
});

function updatePlotType() {
    var asterType = d3.select("#aster-type").node().value;

    arc.outerRadius(function (d) {
        if (asterType === "controversiality") {
            return (radius - innerRadius) * (d.data.controversiality * 1.21) + innerRadius;
        }
        if (asterType === "comments") {
            return (radius - innerRadius) * (d.data.total / 56000) + innerRadius;
        }
        if (asterType === "score") {
            return (radius - innerRadius) * (d.data.score / 350) + innerRadius;
        }
    });

    svg.selectAll('.solidArc')
        .data([])
        .exit().remove();

    svg.selectAll('.center-text')
        .text("")
        .exit().remove();

    var path = svg.selectAll(".solidArc")
        .data(pie(byHour))
        .enter().append("path")
        .attr("fill", function(d) {
            return d.data.color;
        })
        .attr("class", "solidArc")
        .attr("stroke", "black")
        .attr("d", arc)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    var outerPath = svg.selectAll(".outlineArc")
        .data(pie(byHour))
        .enter().append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("class", "outlineArc")
        .attr("d", outlineArc);

    var centerText = svg.append("svg:text")
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
