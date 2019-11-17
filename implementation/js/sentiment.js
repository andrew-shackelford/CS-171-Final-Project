
console.log("sentiment has loaded");

queue()
    .defer(d3.json,"data/sentiment.json")
    .await(createSentimentVis);

var margin = { top: 20, right: 20, bottom: 20, left: 20 };

var width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

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

var hour = 0;

function createSentimentVis(error, sentimentData) {
    console.log("creating sentiment vis");
    console.log(sentimentData);

    setInterval(function() {
        step(sentimentData)
    }, 5000);

}

function step(sentimentData) {
    filteredData = filterData(sentimentData, hour);

    hour++;

    drawSentimentVis(sentimentData, filteredData);

    if (hour > 23) {
        hour = 0;
    }
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

    var radiusScale = d3.scalePow()
        .exponent(0.5)
        .range([35, 75])
        .domain(extent);
    var polarityScale = d3.scaleLinear()
        .range([200, width-200])
        .domain(d3.extent(sentimentData, function(d) {
            return d.polarity / d.total;
        }));

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

    var radiusScale = d3.scalePow()
        .exponent(0.5)
        .range([35, 75])
        .domain(extent);
    var polarityScale = d3.scaleLinear()
        .range([200, width-200])
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
        .attr('fill', function (d) { return "red"; })
        .attr('stroke', function (d) { return "blue"; })
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
        .attr('r', function (d) { return d.radius; });
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

