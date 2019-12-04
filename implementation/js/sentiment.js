
SentimentBubbleCloud = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}


SentimentBubbleCloud.prototype.initVis = function(){
    var vis = this;

    var playButton = d3.select("#play-button");

    playButton
        .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                clearInterval(vis.intervalId);
                button.text("Play");
            } else {
                vis.step();
                vis.intervalId = setInterval(function(){vis.step();}, 600);
                button.text("Pause");
            }
        });

    vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };

    vis.width = 1000 - vis.margin.left - vis.margin.right;
    vis.height = 700 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select(vis.parentElement)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

    vis.hour = -1;

    vis.parser = d3.timeParse("%H");
    vis.formatter = d3.timeFormat("%I %p");

    vis.pastPos = {};

    // based on https://bl.ocks.org/officeofjane/47d2b0bfeecfcb41d2212d06d095c763

    vis.x = d3.scaleLinear()
        .domain([0, 23])
        .range([0, vis.width])
        .clamp(true);

    var slider = vis.svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + vis.margin.left + "," + 20 + ")");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", vis.x.range()[0])
        .attr("x2", vis.x.range()[1])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { slider.interrupt(); })
            .on("start drag", function() { vis.update(Math.round(vis.x.invert(d3.event.x))) }));

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(vis.x.ticks(24))
        .enter().append("text")
        .attr("x", vis.x)
        .attr("text-anchor", "middle")
        .text(function(d) { return vis.formatter(vis.parser(d)).replace(/^0+/, ''); });

    vis.handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);
    
    vis.comment_extent = d3.extent(vis.data, function (d) {
        return d.total;
    });

    vis.polarity_extent = d3.extent(vis.data, function (d) {
        return d.polarity / d.total;
    })

    vis.radiusScale = d3.scaleLog()
        .range([35, 75])
        .domain(vis.comment_extent);
    vis.colorScale = d3.scaleLinear()
        .range([0, 0.8])
        .domain(vis.polarity_extent);
    vis.polarityScale = d3.scaleLinear()
        .range([300, vis.width-150])
        .domain(vis.polarity_extent);

    // create legend
    var legend_array = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map(function (d) {
        return vis.colorScale.invert(d);
    });
    var legend_rects = vis.svg.selectAll(".legend-rect")
        .data(legend_array);

    legend_rects.enter()
        .append("rect")
        .merge(legend_rects)
        .attr("fill", function(d) { return (d3.interpolateBlues(vis.colorScale(d))); } )
        .attr("x", function(d, i) { return (i+1) * 25 + 740} )
        .attr("y", "100" )
        .attr("width", "25")
        .attr("height", "25")
        .attr("stroke", "black")
        .attr("class", "legend-rect");

    // create legend labels
    var legend_labels = vis.svg.selectAll(".legend-label")
        .data(legend_array);
    legend_labels.enter()
        .append("text")
        .merge(legend_labels)
        .attr("x", function(d, i) { return (i+1) * 25 + 740 + 12.5} )
        .attr("y", "143")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "top")
        .attr("class", "legend-label")
        .text(function(d, i) {
            if (i % 2 == 0) {
                return Math.round(d * 100) / 100;
            }});

    vis.svg.append("text")
        .attr("x", 740 + 12.5 + 5 * 25)
        .attr("y", "160")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "top")
        .attr("class", "legend-unit")
        .style("font-style", "oblique")
        .text("avg. comment polarity");

    var arrowX = 75;
    var arrowY = 60;
    var arrowWidth = 875;
    var arrowHeight = 3;
    var triangleSize = 10;

    vis.svg.append("path")
        .attr("id", "sentiment-arrow")
        .attr("fill", "black")
        .attr("d", "M " + (arrowX - triangleSize) + " " + arrowY +
                          " L " + arrowX + " " + (arrowY - triangleSize) +
                          " L " + arrowX + " " + (arrowY - arrowHeight) +
                          " L " + (arrowX + arrowWidth) + " " + (arrowY - arrowHeight) +
                          " L " + (arrowX + arrowWidth) + " " + (arrowY - triangleSize) +
                          " L " + (arrowX + arrowWidth + triangleSize) + " " + arrowY +
                          " L " + (arrowX + arrowWidth) + " " + (arrowY + triangleSize) +
                          " L " + (arrowX + arrowWidth) + " " + (arrowY + arrowHeight) +
                          " L " + arrowX + " " + (arrowY + arrowHeight) +
                          " L " + arrowX + " " + (arrowY + triangleSize) +
                          " Z");

    vis.svg.append("text")
        .attr("class", "sentiment-arrow-label")
        .attr("x", arrowX)
        .attr("y", arrowY + 30)
        .attr("text-anchor", "begin")
        .attr("alignment-baseline", "top")
        .style("font-style", "oblique")
        .text("More Negative");

    vis.svg.append("text")
        .attr("class", "sentiment-arrow-label")
        .attr("x", arrowX + arrowWidth)
        .attr("y", arrowY + 30)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "top")
        .style("font-style", "oblique")
        .text("More Positive");

    vis.tip = d3.tip()
        .attr("class", "d3-tip-padding")
        .offset([0, 0])
        .html(function(d) {return "<b>" + d.id + "</b>" + "<br>" +
                                      "Comments per hour: " + d.value + "<br>" +
                                      "Average polarity of comment: " + Math.round((d.polarity / d.value) * 1000) / 1000});
    vis.svg.call(vis.tip);

    vis.step();
}

SentimentBubbleCloud.prototype.filterData = function() {
    var vis = this;

    hour_str = String(vis.hour);
    while (hour_str.length < 2) {
        hour_str = "0" + hour_str;
    }
    vis.displayData = vis.data.filter(function(d) {
        return d.hour == hour_str;
    })
};

SentimentBubbleCloud.prototype.step = function() {
    var vis = this;

    value = (vis.hour >= 23) ? 0 : vis.hour + 1;
    vis.update(value);
};

SentimentBubbleCloud.prototype.update = function(value) {
    var vis = this;

    vis.handle.attr("cx", vis.x(value));

    if (value == vis.hour) {
        return;
    }

    vis.hour = value;
    vis.filterData();

    vis.drawSentimentVis();
};



SentimentBubbleCloud.prototype.drawSentimentVis = function() {
    var vis = this;

    // based on https://github.com/vlandham/bubble_chart_v4/blob/master/src/bubble_chart.js

    var center = {x: vis.width / 2, y: (vis.height / 2) + 50};
    var forceStrength = 0.03;

    var simulation = d3.forceSimulation()
        .velocityDecay(0.3)
        .force('x', d3.forceX().strength(forceStrength).x(center.x))
        .force('y', d3.forceY().strength(forceStrength).y(center.y))
        .force('charge', d3.forceManyBody().strength(charge))
        .on('tick', ticked);
    simulation.stop();

    var nodes = vis.displayData.map(function (d) {
        return {
            id: d.subreddit,
            radius: vis.radiusScale(d.total),
            value: d.total,
            name: d.subreddit,
            polarity: d.polarity,
            x: (d.subreddit in vis.pastPos) ? vis.pastPos[d.subreddit][0] : Math.random() * 900,
            y: (d.subreddit in vis.pastPos) ? vis.pastPos[d.subreddit][1] : Math.random() * 900
        };
    });
    nodes.sort(function (a, b) { return b.value - a.value; });

    var bubbles = vis.svg.selectAll('.bubble')
        .data(nodes, function (d) { return d.id; });

    var bubblesE = bubbles.enter()
        .append("g")
        .on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide)
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
        .duration(600)
        .attr('r', function (d) { return d.radius; })
        .attr('fill', function (d) {
            return d3.interpolateBlues(vis.colorScale(d.polarity/d.value));
        });
    bubbles.selectAll("text")
        .transition()
        .duration(600)
        .style("font-size", "10px");

    vis.svg.selectAll(".bubble").data(nodes, function(d) { return d.id; })
        .select("circle")
        .transition()
        .duration(600)
        .attr('r', function (d) { return d.radius; })
        .attr('fill', function (d) {
            return d3.interpolateBlues(vis.colorScale(d.polarity/d.value));
        });

    simulation.nodes(nodes);
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodePosition));
    simulation.alpha(1).restart();

    function nodePosition(d) {
        return vis.polarityScale(d.polarity / d.value);
    }

    function charge(d) {
        return -Math.pow(d.radius, 2.0) * forceStrength;
    }

    function ticked() {
        bubbles
            .attr('transform', function (d) {
                vis.pastPos[d.id] = [d.x, d.y];
                return "translate(" + d.x + "," + d.y + ")";
            });
    }
};

