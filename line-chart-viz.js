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
      "#FFDF11",
      "#58f3af",
      "#FF82AB",
      "#007693",
      "#ea9865",
      "#a4517b",
      "#d75a3b",
      "#47a9b2",
      "#D6D1B6",
      "#4cb8d5",
      "#58f3af",
      "#FF8CB2",
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
  const colorAxis = option.colorAxis || "#000000";
  const labelXAxis = option.labelXAxis || "X Axis";
  const labelYAxis = option.labelYAxis || "Y Axis";
  const height = option.height;

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

  const timeFormat = readTimeFormat(option.data[0][columnTime]);

  console.log(timeFormat);

  var timeValues = d3
    .nest()
    .key(function(d) {
      return d[columnTime];
    })
    .entries(option.data);

  if (timeFormat === "YYYYQN" || timeFormat === "YYYYWNN") {
    timeValues = timeValues
      .map(d => d.key)
      .sort(function(a, b) {
        a = +a.slice(0, 4) * 100 + +a.slice(5);
        b = +b.slice(0, 4) * 100 + +b.slice(5);
        return a - b;
      });
  } else {
    timeValues = timeValues.map(d => +d.key).sort();
  }

  console.log(timeValues);

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

  const colorDomain = Array.from(new Set(data.map(d => d.key)));

  const colorScale = d3
    .scaleOrdinal()
    .domain(colorDomain)
    .range(colors[paletteLine]);

  // Render chart
  const container = d3.select(el).classed("line-chart-viz", true);

  let legendContainer;
  if (positionLegend === "top") {
    legendContainer = container.insert("div", ".chart-container");
  }

  var chartContainer = container
    .append("svg")
    .attr("width", svg_width)
    .attr("height", svg_height)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  if (positionLegend === "bottom") {
    legendContainer = container.append("div");
  }

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
          (svg_height - margin.top) +
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
      container
        .append("path")
        .datum(v.datum)
        .attr("class", "line")
        .attr("stroke", colorScale(v.key))
        .each(function(d) {
          d.path0 = startLine(d);
          d.path1 = line(d);
        })
        .attr("d", function(d) {
          return d.path0;
        });

      v.datum.forEach(function(w, i) {
        container
          .append("circle")
          .datum(w)
          .attr("class", "tooltip-circle")
          .attr("fill", "white")
          .attr("stroke", colorScale(v.key))
          .attr("cx", function(d) {
            d.i = i;
            return xScale(i);
          })
          .attr("cy", function() {
            return yScale(0);
          })
          .attr("r", 4)
          .attr("opacity", 0);
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

    tipBox = container
      .append("rect")
      .attr("y", 0)
      .attr("x", 0)
      .attr("width", svg_width - margin.left - margin.right)
      .attr("height", svg_height - margin.top - margin.bottom)
      .attr("opacity", 0)
      .on("mousemove", showTooltip)
      .on("mouseout", hideTooltip);
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
      .selectAll(".tooltip-circle")
      .transition()
      .duration(1000)
      .delay(500)
      .attr("cy", function(d) {
        return yScale(d);
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

  function showTooltip() {
    const timeVal = Math.floor(
      xScale.invert(+d3.mouse(tipBox.node())[0]) + 0.5
    );

    d3.selectAll(".tooltip-circle").attr("opacity", function(d) {
      var index = xScale.invert(
        d3
          .select(this)
          .node()
          .getAttribute("cx")
      );

      if (index === timeVal) {
        return 1;
      } else {
        return 0;
      }
    });

    var tooltip_html = "<table class='tooltip-table'>";

    data.forEach(function(v) {
      tooltip_html +=
        "<tr style='color:" +
        colorScale(v.key) +
        "'><td>" +
        v.key +
        "</td><td></td></tr>";
      tooltip_html +=
        "<tr style='color:" +
        colorScale(v.key) +
        "'><td>" +
        columnTime +
        ": </td><td>" +
        v.values[timeVal].key +
        "</td></tr>";
      tooltip_html +=
        "<tr style='color:" +
        colorScale(v.key) +
        "'><td>" +
        columnMeasure +
        ": </td><td>" +
        formatNumber(v.values[timeVal].value) +
        "</td></tr>";
    });

    tooltip_html += "</table>";

    tooltip
      .html(tooltip_html)
      .style("display", "block")
      .style("top", d3.event.clientY - 20 + "px")
      .style("left", d3.event.clientX + 20 + "px");
  }

  function hideTooltip(d) {
    tooltip.html("").style("display", "none");
    d3.selectAll(".tooltip-circle").attr("opacity", 0);
  }

  // Render legend (either top or bottom)

  legendContainer
    .attr("class", "legend-container")
    .selectAll(".legend-item")
    .data(colorScale.domain())
    .join("div")
    .attr("class", "legend-item")
    .call(function(item) {
      item
        .append("div")
        .attr("class", "legend-swatch")
        .style("background", function(d) {
          return colorScale(d);
        });
    })
    .call(function(item) {
      item
        .append("div")
        .attr("class", "legend-label")
        .text(d => d);
    });

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

  function readTimeFormat(d) {
    if (d.length === 8) {
      var timeFormat = "YYYYMMDD";
      return timeFormat;
    }
    if (d.length === 4) {
      var timeFormat = "YYYY";
      return timeFormat;
    }
    if (d.includes("Q")) {
      var timeFormat = "YYYYQN";
    } else {
      if (d.includes("W")) {
        var timeFormat = "YYYYWNN";
      } else {
        var timeFormat = "YYYYMM";
      }
    }
    return timeFormat;
  }

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
