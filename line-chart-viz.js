function lineChartViz(option) {
  const operationMeasures = ["sum", "avg", "count"];
  const paletteLines = ["full", "single", "extended"];
  const shapeLines = ["angle", "smooth"];
  const positionLegends = ["top", "bottom", "inline"];

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
    throw Error("Legend can only be top, bottom or inline.");
  }

  const colors = {
    full: [
      "#a4517b",
      "#d75a3b",
      "#47a9b2",
      "#FFE647",
      "#D3B90E",
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
    single: [
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
    extended: [
      "#D11141",
      "#00B159",
      "#00AEDB",
      "#F37735",
      "#FFC425",

      "#D93C63",
      "#2EBF77",
      "#2EBCE1",
      "#F58F59",
      "#FFCE4C",

      "#AC0E36",
      "#009149",
      "#008FB4",
      "#C7622C",
      "#D1A11F",

      "#860B2A",
      "#007139",
      "#006F8C",
      "#9B4C22",
      "#A37D18",

      "#5F081E",
      "#005129",
      "#005064",
      "#6F3719",
      "#745A11"
    ]
  };

  // Extract options
  const el = option.el;
  const columnTime = option.columnTime;
  const columnLines = option.columnLines;
  const columnMeasure = option.columnMeasure;
  const operationMeasure = option.operationMeasure || "avg";
  const paletteLine = option.paletteLine || "full";
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
  var margin = { top: 50, right: 75, bottom: 50, left: 50 };

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

    data.forEach(function(v) {
      container
        .append("path")
        .datum(v.datum)
        .attr("class", "line")
        .each(function(d) {
          d.key = v.key;
        })
        .attr("id", v.key.toLowerCase().replace(/ /g, "-"))
        .attr("stroke", colorScale(v.key))
        .each(function(d) {
          d.path0 = startLine(d);
          d.path1 = line(d);
        })
        .attr("d", function(d) {
          return d.path0;
        })
        .on("mouseover", lineMouseOver)
        .on("mouseout", lineMouseOut);

      v.datum.forEach(function(w, i) {
        container
          .append("circle")
          .datum(w)
          .attr("class", "tooltip-circle")
          .attr("id", v.key.toLowerCase().replace(/ /g, "-"))
          .attr("fill", "black")
          .attr("cx", function(d) {
            d.i = i;
            return xScale(i);
          })
          .attr("cy", function() {
            return yScale(0);
          })
          .attr("r", 10)
          .attr("opacity", 0)
          .on("mouseover", function(d) {
            revealTooltip(d, v, i);
          })
          .on("mouseout", removeTooltip);

        /* container
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
          .attr("opacity", 0); */
      });

      container
        .append("text")
        .datum(v.datum)
        .attr("class", "value-label")
        .attr("x", svg_width - margin.right - margin.left + 5)
        .attr("y", yScale(0))
        .attr("dy", "0.5em")
        .attr("fill", function() {
          return colorScale(v.key);
        })
        .text(function(d) {
          return formatNumber(d[n - 1]);
        })
        .attr("opacity", 0);

      container
        .append("text")
        .datum(v.datum)
        .attr("class", "inline-legend")
        .attr("x", svg_width - margin.right - margin.left + 5)
        .attr("y", yScale(0))
        .attr("dy", "-0.6em")
        .attr("fill", function() {
          return colorScale(v.key);
        })
        .text(function(d) {
          return v.key;
        })
        .attr("opacity", 0);
    });

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
      .text(labelXAxis);

    container
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (svg_height - margin.bottom - margin.top) / 2)
      .attr("dy", "1em")
      .attr("class", "y-axis axis-label")
      .text(labelYAxis);

    d3.selectAll(".y-axis line").style("stroke", colorAxis);
    d3.selectAll(".y-axis .domain").style("stroke", colorAxis);
    d3.selectAll(".y-axis text").style("fill", colorAxis);
    d3.selectAll(".x-axis line").style("stroke", colorAxis);
    d3.selectAll(".x-axis .domain").style("stroke", colorAxis);
    d3.selectAll(".x-axis text").style("fill", colorAxis);
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

    if (positionLegend === "inline") {
      chartContainer
        .selectAll(".inline-legend")
        .transition()
        .duration(1000)
        .delay(500)
        .attr("y", function(d) {
          return yScale(d[n - 1]);
        })
        .attr("opacity", 1);
    }
  }

  // Tooltip
  const tooltip = container.append("div").attr("class", "chart-tooltip");
  tooltip.append("div").attr("class", "tooltip-label");
  tooltip.append("div").attr("class", "tooltip-value");

  function revealTooltip(d, v, i) {
    d3.selectAll(".line").attr("stroke", function(d) {
      if (v.key !== d.key) {
        return "#D1D1D1";
      } else {
        return colorScale(d.key);
      }
    });

    d3.selectAll(".value-label").attr("fill", function(d) {
      if (v.key !== d.key) {
        return "#D1D1D1";
      } else {
        return colorScale(d.key);
      }
    });

    if (positionLegend === "inline") {
      d3.selectAll(".inline-legend").attr("fill", function(d) {
        if (v.key !== d.key) {
          return "#D1D1D1";
        } else {
          return colorScale(d.key);
        }
      });
    }

    var tooltip_html = "<table class='tooltip-table'>";
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
      v.values[i].key +
      "</td></tr>";
    tooltip_html +=
      "<tr style='color:" +
      colorScale(v.key) +
      "'><td>" +
      columnMeasure +
      ": </td><td>" +
      formatNumber(v.values[i].value) +
      "</td></tr>";

    tooltip_html += "</table>";

    tooltip
      .html(tooltip_html)
      .style("display", "block")
      .style("top", d3.event.pageY - 20 + "px")
      .style("left", d3.event.pageX + 20 + "px");
  }

  function removeTooltip() {
    tooltip.html("").style("display", "none");
    d3.selectAll(".line").attr("stroke", function(d) {
      return colorScale(d.key);
    });
    d3.selectAll(".value-label").attr("fill", function(d) {
      return colorScale(d.key);
    });
    if (positionLegend === "inline") {
      d3.selectAll(".inline-legend").attr("fill", function(d) {
        return colorScale(d.key);
      });
    }
  }

  function lineMouseOver(v) {
    d3.selectAll(".line").attr("stroke", function(d) {
      if (v.key !== d.key) {
        return "#D1D1D1";
      } else {
        return colorScale(d.key);
      }
    });

    d3.selectAll(".value-label").attr("fill", function(d) {
      if (v.key !== d.key) {
        return "#D1D1D1";
      } else {
        return colorScale(d.key);
      }
    });

    if (positionLegend === "inline") {
      d3.selectAll(".inline-legend").attr("fill", function(d) {
        if (v.key !== d.key) {
          return "#D1D1D1";
        } else {
          return colorScale(d.key);
        }
      });
    }
  }

  function lineMouseOut() {
    d3.selectAll(".line").attr("stroke", function(d) {
      return colorScale(d.key);
    });
    d3.selectAll(".value-label").attr("fill", function(d) {
      return colorScale(d.key);
    });

    if (positionLegend === "inline") {
      d3.selectAll(".inline-legend").attr("fill", function(d) {
        return colorScale(d.key);
      });
    }
  }

  // Render legend (either top or bottom)
  if (positionLegend === "top" || positionLegend === "bottom") {
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
  }

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
