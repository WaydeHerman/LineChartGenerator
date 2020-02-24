function lineChartViz(option) {
  const operationMeasures = ["sum", "avg", "count"];
  const paletteLines = ["a", "b", "c"];
  const shapeLines = ["angle", "smooth"];
  const positionLegends = ["top", "bottom"];

  // Verify options
  if (!operationMeasures.includes(option.operationMeasure)) {
    throw Error("Calc can only be sum, avg, or count.");
  }
  if (!paletteLines.includes(option.paletteLine)) {
    throw Error("Lines' palette can only be a, b, or c.");
  }
  if (!shapeLines.includes(option.shapeLine)) {
    throw Error("Lines' shape can only be angle or smooth.");
  }
  if (!positionLegends.includes(option.positionLegend)) {
    throw Error("Legend can only be top or bottom.");
  }

  // check color is in correct format.

  const colors = {
    a: [
      "#a4517b",
      "#d75a3b",
      "#47a9b2",
      "#fffad9",
      "#4cb8d5",
      "#58f3af",
      "#feb8cf",
      "#007693",
      "#ea9865",
      "#a4517b",
      "#d75a3b",
      "#47a9b2",
      "#fffad9",
      "#4cb8d5",
      "#58f3af",
      "#feb8cf",
      "#007693",
      "#ea9865"
    ],
    b: [
      "#e5f4f7",
      "#b0dfe8",
      "#7bc9d8",
      "#46b4c9",
      "#119eb9",
      "#0d8ca7",
      "#097996",
      "#046784",
      "#005472"
    ],
    c: [
      "#e5f4f7",
      "#b0dfe8",
      "#7bc9d8",
      "#46b4c9",
      "#119eb9",
      "#0d8ca7",
      "#097996",
      "#046784",
      "#005472"
    ]
  };

  // Extract options
  const el = option.el;
  const columnTime = option.columnTime;
  const columnLines = option.columnLines;
  const columnMeasure = option.columnMeasure;
  const operationMeasure = option.operationMeasure || "avg";
  const paletteLine = option.paletteLines || "a";
  const shapeLine = option.shapeLine || "angle";
  const positionLegend = option.positionLegend || "top";
  const colorAxis = option.colorAxis || "#A4517B";
  const labelXAxis = option.labelXAxis || "X Axis";
  const labelYAxis = option.labelYAxis || "Y Axis";
  const height = option.height;

  console.log(option.data);

  // Process data
  option.data.forEach(d => {
    d[columnMeasure] = parseFloat(d[columnMeasure]);
  });

  const allValues = [];
  var data = d3
    .nest()
    .key(function(d) {
      return d[columnLines];
    })
    .key(function(d) {
      return d[columnTime];
    })
    .rollup(function(v) {
      const value = aggregate(v, operationMeasure, columnMeasure);
      allValues.push(value);
      return value;
    })
    .entries(option.data);

  const maxValue = d3.max(allValues);

  var timeValues = d3
    .nest()
    .key(function(d) {
      return d[columnTime];
    })
    .entries(option.data)
    .map(d => +d.key)
    .sort();

  function getXTicks(d, i) {
    return timeValues[i];
  }

  data.forEach(function(v) {
    v.datum = [];
    timeValues.forEach(function(w) {
      v.values.forEach(function(u) {
        if (+u.key === w) {
          v.datum.push(u.value);
        }
      });
    });
  });

  const n = timeValues.length;

  const svg_width = d3
    .select(el)
    .node()
    .getBoundingClientRect().width;

  const svg_height = height;
  var margin = { top: 50, right: 50, bottom: 50, left: 50 };

  // Need to flesh this out more once parameters are explained.

  // Set up
  var xScale = d3
    .scaleLinear()
    .domain([0, n - 1]) // input
    .range([0, svg_width - margin.right - margin.left]); // output

  var yScale = d3
    .scaleLinear()
    .domain([0, maxValue]) // input
    .range([svg_height - margin.top - margin.bottom, 0]); // output

  const colorDomain = Array.from(new Set(data.map(d => d[columnLines])));

  const colorScale = d3
    .scaleOrdinal()
    .domain(colorDomain)
    .range(colors[paletteLine]);

  // Render chart
  const container = d3.select(el).classed("line-chart-viz", true);

  var chartContainer = container
    .append("svg")
    .attr("width", svg_width)
    .attr("height", svg_height)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  render(chartContainer, data);

  function render(container, data) {
    // draw lines
    // change lines based on shape
    // draw axis
    // color axis
    // label axis

    var startLine = d3
      .line()
      .x(function(d, i) {
        return xScale(i);
      })
      .y(function(d) {
        return yScale(0);
      });

    var line = d3
      .line()
      .x(function(d, i) {
        return xScale(i);
      })
      .y(function(d) {
        return yScale(d);
      });

    if (shapeLine === "smooth") {
      line.curve(d3.curveBasis);
    }

    container
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale));

    container
      .append("g")
      .attr("class", "x-axis")
      .call(
        d3
          .axisBottom(xScale)
          .ticks(n - 1)
          .tickFormat(getXTicks)
      )
      .attr(
        "transform",
        "translate(0," + (svg_height - margin.top - margin.bottom) + ")"
      );

    container
      .append("text")
      .attr(
        "transform",
        "translate(" +
          (svg_width - margin.left - margin.right) / 2 +
          " ," +
          (svg_height / 2 + margin.top + margin.bottom) +
          ")"
      )
      .attr("class", "x-axis axis-label")
      .text(columnTime);

    container
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (svg_height - margin.bottom - margin.top) / 2)
      .attr("dy", "1em")
      .attr("class", "y-axis axis-label")
      .text(columnMeasure);

    d3.selectAll(".y-axis line").style("stroke", colorAxis);
    d3.selectAll(".y-axis .domain").style("stroke", colorAxis);
    d3.selectAll(".y-axis text").style("fill", colorAxis);
    d3.selectAll(".x-axis line").style("stroke", colorAxis);
    d3.selectAll(".x-axis .domain").style("stroke", colorAxis);
    d3.selectAll(".x-axis text").style("fill", colorAxis);

    data.forEach(function(v) {
      //console.log(v.values);
      container
        .append("path")
        .datum(v.datum)
        .attr("class", "line")
        .attr("stroke", colorScale)
        .each(function(d) {
          d.path0 = startLine(d);
          d.path1 = line(d);
        })
        .attr("d", function(d) {
          return d.path0;
        });

      container
        .append("text")
        .datum(v.datum)
        .attr("class", "value-label")
        .attr("x", svg_width - margin.right - margin.left + 5)
        .attr("y", yScale(0))
        .text(function(d) {
          return formatNumber(d[n - 1]);
        })
        .attr("opacity", 0);
    });
  }

  init();

  function init() {
    var line = d3
      .line()
      .x(function(d, i) {
        return xScale(i);
      })
      .y(function(d) {
        return yScale(d);
      });

    if (shapeLine === "smooth") {
      line.curve(d3.curveBasis);
    }
    // animate lines drawn.
    chartContainer
      .selectAll(".line")
      .transition()
      .duration(1000)
      .delay(500)
      .attrTween("d", function(d) {
        var previous = d.path0;
        var current = d.path1;
        return d3.interpolatePath(previous, current);
      });
    chartContainer
      .selectAll(".value-label")
      .transition()
      .duration(1000)
      .delay(500)
      .attr("y", function(d) {
        return yScale(d[n - 1]);
      })
      .attr("opacity", 1);
  }

  // Tooltip
  const tooltip = container.append("div").attr("class", "chart-tooltip");
  tooltip.append("div").attr("class", "tooltip-label");
  tooltip.append("div").attr("class", "tooltip-value");

  function showTooltip(d) {}

  function hideTooltip(d) {}

  // Render legend (either top or bottom)

  // Utilities
  function aggregate(v, op, col) {
    switch (op) {
      case "sum":
        return d3.sum(v, d => d[col]);
      case "avg":
        return d3.mean(v, d => d[col]);
      case "count":
        return v.length;
      default:
        break;
    }
  }

  function readTime(d) {}

  // Format number
  function formatNumber(d) {
    if (d < 1e3) {
      return d3.format(".3s")(d);
    } else if (d < 1e5) {
      return `${(d / 1e3).toFixed(1)}K`;
    } else if (d < 1e6) {
      return `${(d / 1e3).toFixed(0)}K`;
    } else if (d < 1e8) {
      return `${(d / 1e6).toFixed(1)}M`;
    } else if (d < 1e9) {
      return `${(d / 1e6).toFixed(0)}M`;
    } else if (d < 1e11) {
      return `${(d / 1e9).toFixed(1)}B`;
    } else if (d < 1e12) {
      return `${(d / 1e9).toFixed(0)}B`;
    } else if (d < 1e14) {
      return `${(d / 1e12).toFixed(1)}T`;
    } else {
      return `${(d / 1e12).toFixed(1)}T`;
    }
  }
}
