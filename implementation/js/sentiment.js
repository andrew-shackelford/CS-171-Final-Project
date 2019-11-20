
console.log("sentiment has loaded");

queue()
    .defer(d3.json,"data/sentiment.json")
    .await(createSentimentVis);

var margin = { top: 20, right: 20, bottom: 20, left: 20 };

var width = 1000 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var svg = d3.select("#sentiment")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

function filterData(data, hour) {
    hour_str = String(hour);
    while (hour_str.length < 2) {
        hour_str = "0" + hour_str;
    }
    return data.filter(function(d) {
        return d.hour == hour_str;
    })
}

var parser = d3.timeParse("%H");
var formatter = d3.timeFormat("%I %p");


var hour = -1;

var intervalId;


function createSentimentVis(error, sentimentData) {
    console.log("creating sentiment vis");
    console.log(sentimentData);

    intervalId = setInterval(step, 2000);

    // based on https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763

    var playButton = d3.select("#play-button");

    playButton
        .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                clearInterval(intervalId);
                button.text("Play");
            } else {
                step();
                intervalId = setInterval(step, 2000);
                button.text("Pause");
            }
        });

    var x = d3.scaleLinear()
        .domain([0, 23])
        .range([0, width])
        .clamp(true);

    var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + 20 + ")");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { slider.interrupt(); })
            .on("start drag", function() { update(Math.round(x.invert(d3.event.x)), sentimentData) }));
                //hue(x.invert(d3.event.x)); }));

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(x.ticks(24))
        .enter().append("text")
        .attr("x", x)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatter(parser(d)).replace(/^0+/, ''); });

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

    function step() {
        value = (hour >= 23) ? 0 : hour + 1;
        update(value, sentimentData);
    }

    function update(value, sentimentData) {

        handle.attr("cx", x(value));

        if (value == hour) {
            return;
        }

        hour = value;
        console.log(hour);
        filteredData = filterData(sentimentData, hour);

        drawSentimentVis(sentimentData, filteredData);
    }

    step();

}

var pastPos = {};

function drawSentimentVis(sentimentData, filteredData) {

    // based on https://github.com/vlandham/bubble_chart_v4/blob/master/src/bubble_chart.js

    var extent = d3.extent(sentimentData, function (d) {
        return d.total;
    });

    var center = {x: width / 2, y: height / 2};
    var forceStrength = 0.03;

    var simulation = d3.forceSimulation()
        .velocityDecay(0.2)
        .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);
    simulation.stop();

    var radiusScale = d3.scaleLog()
        .range([35, 75])
        .domain(extent)
    var colorScale = d3.scaleLog()
        .range([0, 0.8])
        .domain(extent);
    var polarityScale = d3.scaleLinear()
        .range([300, width-150])
        .domain(d3.extent(sentimentData, function(d) {
            return d.polarity / d.total;
        }));

    var nodes = filteredData.map(function (d) {
        return {
            id: d.subreddit,
            radius: radiusScale(d.total),
            value: d.total,
            name: d.subreddit,
            polarity: d.polarity,
            x: (d.subreddit in pastPos) ? pastPos[d.subreddit][0] : Math.random() * 900,
            y: (d.subreddit in pastPos) ? pastPos[d.subreddit][1] : Math.random() * 900
        };
    });
    nodes.sort(function (a, b) { return b.value - a.value; });

    var bubbles = svg.selectAll('.bubble')
        .data(nodes, function (d) { return d.id; });

    var bubblesE = bubbles.enter()
        .append("g")
        .attr("class", "bubble");
    bubblesE.append('circle')
        .classed('bubble-circle', true)
        .attr('r', 0)
        .attr('stroke', function (d) { return "black"; })
        .attr('stroke-width', 2);
    bubblesE.append("text")
        .style("font-size", "0px")
        .style("text-anchor", "middle")
        .text(function(d) {
            return d.name;
    });

    bubbles = bubbles.merge(bubblesE);
    bubbles.selectAll("circle")
        .transition()
        .duration(2000)
        .attr('r', function (d) { return d.radius; })
        .attr('fill', function (d) {
            return d3.interpolateBlues(colorScale(d.value));
        });
    bubbles.selectAll("text")
        .transition()
        .duration(2000)
        .style("font-size", "10px");

    simulation.nodes(nodes);
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodePosition));
    simulation.alpha(1).restart();

    function nodePosition(d) {
        console.log(polarityScale(d.polarity / d.value));
        return polarityScale(d.polarity / d.value);
    }

    function charge(d) {
        return -Math.pow(d.radius, 2.0) * forceStrength;
    }

    function ticked() {
        bubbles
            .attr('transform', function (d) {
                pastPos[d.id] = [d.x, d.y];
                return "translate(" + d.x + "," + d.y + ")";
            });
    }
}

