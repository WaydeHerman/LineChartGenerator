function lineChartViz(option) {
  const operationMeasures = ["sum", "avg", "count"];
  const paletteLines = ["full", "single", "extended"];
  const shapeLines = ["angle", "smooth"];
  const positionLegends = ["top", "bottom", "inline"];

  // Verify options
  // if (option.measuresLeft.constructor === Array) {
  //   option.measuresLeft.forEach(function(v) {
  //     if (!operationMeasures.includes(v.operation)) {
  //       throw Error("Calc can only be sum, avg, or count.");
  //     }
  //   });
  // } else {
  //   if (!operationMeasures.includes(option.measuresLeft.operation)) {
  //     throw Error("Calc can only be sum, avg, or count.");
  //   }
  // }
  // if (option.measuresRight) {
  //   if (option.measuresRight.constructor === Array) {
  //     option.measuresRight.forEach(function(v) {
  //       if (!operationMeasures.includes(v.operation)) {
  //         throw Error("Calc can only be sum, avg, or count.");
  //       }
  //     });
  //   } else {
  //     if (!operationMeasures.includes(option.measuresRight.operation)) {
  //       throw Error("Calc can only be sum, avg, or count.");
  //     }
  //   }
  // }
  if (!paletteLines.includes(option.paletteLine)) {
    throw Error("Lines' palette can only be a, b, or c.");
  }
  if (!shapeLines.includes(option.shapeLine)) {
    throw Error("Lines' shape can only be angle or smooth.");
  }
  if (!positionLegends.includes(option.positionLegend)) {
    throw Error("Legend can only be top, bottom or inline.");
  }
  if (!option.measuresLeft) {
    throw Error("Must include measuresLeft.");
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
  var measuresLeft = option.measuresLeft;
  var measuresRight = option.measuresRight;
  const paletteLine = option.paletteLine || "full";
  const shapeLine = option.shapeLine || "angle";
  const positionLegend = option.positionLegend || "top";
  const colorAxis = option.colorAxis || "#000000";
  const labelXAxis = option.labelXAxis || "X Axis";
  const labelYLeftAxis = option.labelYLeftAxis || "Y Axis";
  const labelYRightAxis = option.labelYRightAxis || "";
  const height = option.height;

  // Process data
  var isMultipleMeasure;
  var measureList = [];
  var measuresAll = [];
  if (measuresRight || option.measuresLeft.constructor === Array) {
    isMultipleMeasure = true;
    if (option.measuresLeft.constructor !== Array) {
      measuresAll = [JSON.parse(JSON.stringify(measuresLeft))];
      measuresLeft = [measuresLeft];
    } else {
      measuresAll = JSON.parse(JSON.stringify(measuresLeft));
    }
    measuresLeft.forEach(function(v) {
      measureList.push(v.measure);
    });

    if (measuresRight) {
      if (option.measuresRight.constructor === Array) {
        measuresRight.forEach(function(v) {
          measuresAll.push(v);
          measureList.push(v.measure);
        });
      } else {
        measuresRight = [measuresRight];
        measuresRight.forEach(function(v) {
          v.right = true;
          measuresAll.push(v);
          measureList.push(v.measure);
        });
      }
    }
    option.data.forEach(d => {
      measuresAll.forEach(function(v) {
        d[v.measure] = parseFloat(d[v.measure]);
      });
    });
  } else {
    option.data.forEach(d => {
      d[measuresLeft.measure] = parseFloat(d[measuresLeft.measure]);
      measureList.push(measuresLeft.measure);
    });
  }

  let allValuesLeft = [],
    allValuesRight = [],
    measuresRef = [];

  if (isMultipleMeasure) {
    var lineChartNest = d3
      .nest()
      .key(function(d) {
        return d[columnLines];
      })
      .entries(option.data);

    var keys = lineChartNest.map(function(d) {
      return d.key;
    });

    var data = d3
      .nest()
      .key(function(d) {
        return d[columnLines];
      })
      .key(function(d) {
        return d[columnTime];
      })
      .sortKeys(d3.ascending)
      .rollup(function(v) {
        let value = [];
        measuresLeft.forEach(function(w, i) {
          var val = aggregate(v, w.operation, w.measure);
          allValuesLeft.push(val);
          value.push(val);
          keys.forEach(function(w, index) {
            measuresRef.push(i + index * keys.length);
          });
        });
        measuresRight.forEach(function(w, i) {
          var val = aggregate(v, w.operation, w.measure);
          allValuesRight.push(val);
          value.push(val);
        });
        return value;
      })
      .entries(option.data);
  } else {
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
        const value = aggregate(
          v,
          measuresLeft.operation,
          measuresLeft.measure
        );
        allValues.push(value);
        return value;
      })
      .entries(option.data);
  }

  var timeRef = d3
    .nest()
    .key(function(d) {
      return d[columnTime];
    })
    .sortKeys(d3.ascending)
    .entries(option.data);

  let maxValueRight = d3.max(allValuesLeft);
  if (isMultipleMeasure) {
    maxValueRight = d3.max(allValuesRight);
  }
  const maxValueLeft = d3.max(allValuesLeft);

  const timeFormat = readTimeFormat(option.data[0][columnTime]);

  var timeValues = d3
    .nest()
    .key(function(d) {
      return d[columnTime];
    })
    .entries(option.data);

  const mmmList = {
    Jan: 0,
    January: 0,
    Feb: 1,
    February: 1,
    Mar: 2,
    March: 2,
    Apr: 3,
    April: 3,
    May: 4,
    June: 5,
    Jun: 5,
    Jul: 6,
    July: 6,
    Aug: 7,
    August: 7,
    Sept: 8,
    Sep: 8,
    September: 8,
    Oct: 9,
    October: 9,
    Nov: 10,
    November: 10,
    Dec: 11,
    December: 11
  };

  if (timeFormat === "YYYYQN" || timeFormat === "YYYYWNN") {
    timeValues = timeValues
      .map(d => d.key)
      .sort(function(a, b) {
        a = +a.slice(0, 4) * 100 + +a.slice(5);
        b = +b.slice(0, 4) * 100 + +b.slice(5);
        return a - b;
      });
  } else {
    if (timeFormat === "YYYY-YYYY") {
      timeValues = timeValues
        .map(function(d) {
          return d.key;
        })
        .sort(function(a, b) {
          return d3.ascending(a.slice(0, 4), b.slice(0, 4));
        });
    } else {
      if (
        timeFormat === "mmm-mmm" ||
        timeFormat === "mmm" ||
        timeFormat === "yyyy"
      ) {
        timeValues = timeValues
          .map(function(d) {
            return d.key;
          })
          .sort(function(a, b) {
            var valA = mmmList[a.split("-")[0].replace(/ /g, "")];
            var valB = mmmList[b.split("-")[0].replace(/ /g, "")];

            return d3.ascending(valA, valB);
          });

        timeRef = d3
          .nest()
          .key(function(d) {
            return d[columnTime];
          })
          .sortKeys(function(a, b) {
            var valA = mmmList[a.split("-")[0].replace(/ /g, "")];
            var valB = mmmList[b.split("-")[0].replace(/ /g, "")];

            return d3.ascending(valA, valB);
          })
          .entries(option.data);
      } else {
        timeValues = timeValues.map(d => +d.key).sort();
      }
    }
  }

  function getXTicks(d, i) {
    return timeValues[i];
  }

  data.forEach(function(v) {
    v.datum = [];
    timeValues.forEach(function(w) {
      v.values.forEach(function(u) {
        if (u.key == w) {
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
  var margin = { top: 50, right: 100, bottom: 50, left: 50 };

  if (!isMultipleMeasure) {
    var maxLabelWidth = d3.max(
      data.map(function(v) {
        return getLegendWidth(v.key);
      })
    );
    maxLabelWidth = Math.round((maxLabelWidth * 1.1) / 10) * 10;

    if (margin.right < maxLabelWidth) {
      margin.right = maxLabelWidth;
    }
  }

  // Set up
  var xScale = d3
    .scaleLinear()
    .domain([0, n - 1])
    .range([margin.left, svg_width - margin.right]);

  var yScaleLeft = d3
    .scaleLinear()
    .domain([0, maxValueLeft])
    .range([svg_height - margin.bottom, margin.top]);

  let yScaleRight = null;
  if (isMultipleMeasure) {
    yScaleRight = d3
      .scaleLinear()
      .domain([0, maxValueRight])
      .range([svg_height - margin.bottom, margin.top]);
  }

  let colorScale = null;
  if (isMultipleMeasure) {
    colorScale = d3
      .scaleOrdinal()
      .domain(measureList)
      .range(colors[paletteLine]);
  } else {
    const colorDomain = Array.from(new Set(data.map(d => d.key)));
    colorScale = d3
      .scaleOrdinal()
      .domain(colorDomain)
      .range(colors[paletteLine]);
  }

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
    .attr("transform", "translate(" + 0 + "," + 0 + ")");

  if (positionLegend === "bottom") {
    legendContainer = container.append("div");
  }

  render(chartContainer, data);

  function render(container, data) {
    var startLine = d3
      .line()
      .x(function(d, i) {
        return xScale(i);
      })
      .y(function(d) {
        return yScaleLeft(0);
      });

    var lineLeft = d3
      .line()
      .x(function(d, i) {
        return xScale(i);
      })
      .y(function(d) {
        return yScaleLeft(d);
      });

    if (isMultipleMeasure) {
      var lineRight = d3
        .line()
        .x(function(d, i) {
          return xScale(i);
        })
        .y(function(d) {
          return yScaleRight(d);
        });
    }

    if (shapeLine === "smooth") {
      lineLeft.curve(d3.curveBasis);
      if (isMultipleMeasure) {
        lineRight.curve(d3.curveBasis);
      }
    }

    if (isMultipleMeasure) {
      data.forEach(function(v) {
        measuresAll.forEach(function(u, index) {
          let side;
          if (u.right) {
            side = "right";
          } else {
            side = "left";
          }
          var lineData = {
            key: v.key,
            measure: u.measure,
            side: side,
            xkey: [],
            data: []
          };
          v.datum.forEach(function(o) {
            lineData.data.push(o[index]);
          });
          v.values.forEach(function(o) {
            lineData.xkey.push(o.key);
          });

          container
            .append("path")
            .datum(lineData)
            .attr("class", function(d) {
              if (d.side === "left") {
                return "line-left";
              } else {
                return "line-right";
              }
            })
            .attr("id", function(d) {
              return d.side + "-" + v.key.toLowerCase().replace(/ /g, "-");
            })
            .attr("stroke", function(d) {
              return colorScale(d.key);
            })
            .each(function(d) {
              d.path0 = startLine(d.data);
              if (d.side === "left") {
                d.path1 = lineLeft(d.data);
              } else {
                d.path1 = lineRight(d.data);
              }
            })
            .attr("transform", function(d) {
              var xOffset;
              if (timeFormat === "mmm-mmm" || timeFormat === "mmm" || timeFormat === "yyyy") {
                var minX = d3.min(v.values, function(u) {
                  return mmmList[u.key.split("-")[0].replace(/ /g, "")];
                });
                minX = minX;
                timeRef.forEach(function(u, index) {
                  if (mmmList[u.key.split("-")[0].replace(/ /g, "")] === minX) {
                    xOffset = xScale(index) - margin.left;
                  }
                });
              } else {
                var minX = d3.min(v.values, function(u) {
                  return +u.key;
                });
                timeRef.forEach(function(u, index) {
                  if (+u.key === minX) {
                    xOffset = xScale(index) - margin.left;
                  }
                });
              }
              return "translate(" + xOffset + ",0)";
            })
            .attr("d", function(d) {
              return d.path0;
            })
            .on("mouseover", lineMouseOver)
            .on("mouseout", lineMouseOut);

          lineData.data.forEach(function(w, i) {
            container
              .append("circle")
              .datum(w)
              .attr("class", function(d) {
                if (lineData.side === "left") {
                  return "tooltip-circle-left";
                } else {
                  return "tooltip-circle-right";
                }
              })
              .attr("fill", "black")
              .attr("cx", function(d) {
                var xOffset;
                if (timeFormat === "mmm-mmm" || timeFormat === "mmm"  || timeFormat === "yyyy") {
                  var minX = d3.min(v.values, function(u) {
                    return mmmList[u.key.split("-")[0].replace(/ /g, "")];
                  });
                  minX = minX;
                  timeRef.forEach(function(u, index) {
                    if (
                      mmmList[u.key.split("-")[0].replace(/ /g, "")] === minX
                    ) {
                      xOffset = xScale(index) - margin.left;
                    }
                  });
                } else {
                  var minX = d3.min(v.values, function(u) {
                    return +u.key;
                  });
                  timeRef.forEach(function(u, index) {
                    if (+u.key === minX) {
                      xOffset = xScale(index) - margin.left;
                    }
                  });
                }
                d.i = i;
                return xScale(i) + xOffset;
              })
              .attr("cy", function() {
                return yScaleLeft(0);
              })
              .attr("r", 10)
              .attr("opacity", 0)
              .on("mouseover", function(d) {
                revealTooltip(d, lineData, i);
              })
              .on("mouseout", removeTooltip);
          });
        });
      });
    } else {
      data.forEach(function(v) {
        container
          .append("path")
          .datum(v.datum)
          .attr("class", "line-left")
          .each(function(d) {
            d.key = v.key;
          })
          .attr("id", "left-" + v.key.toLowerCase().replace(/ /g, "-"))
          .attr("stroke", colorScale(v.key))
          .each(function(d) {
            d.path0 = startLine(d);
            d.path1 = lineLeft(d);
          })
          .attr("transform", function(d) {
            var xOffset;
            if (timeFormat === "mmm-mmm" || timeFormat === "mmm"  || timeFormat === "yyyy") {
              var minX = d3.min(v.values, function(u) {
                return mmmList[u.key.split("-")[0].replace(/ /g, "")];
              });
              minX = minX;
              timeRef.forEach(function(u, index) {
                if (mmmList[u.key.split("-")[0].replace(/ /g, "")] === minX) {
                  xOffset = xScale(index) - margin.left;
                }
              });
            } else {
              var minX = d3.min(v.values, function(u) {
                return +u.key;
              });
              timeRef.forEach(function(u, index) {
                if (+u.key === minX) {
                  xOffset = xScale(index) - margin.left;
                }
              });
            }
            return "translate(" + xOffset + ",0)";
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
            .attr("class", "tooltip-circle-left")
            .attr("id", v.key.toLowerCase().replace(/ /g, "-"))
            .attr("fill", "black")
            .attr("cx", function(d) {
              var xOffset;
              if (timeFormat === "mmm-mmm" || timeFormat === "mmm"  || timeFormat === "yyyy") {
                var minX = d3.min(v.values, function(u) {
                  return mmmList[u.key.split("-")[0].replace(/ /g, "")];
                });
                minX = minX;
                timeRef.forEach(function(u, index) {
                  if (mmmList[u.key.split("-")[0].replace(/ /g, "")] === minX) {
                    xOffset = xScale(index) - margin.left;
                  }
                });
              } else {
                var minX = d3.min(v.values, function(u) {
                  return +u.key;
                });
                timeRef.forEach(function(u, index) {
                  if (+u.key === minX) {
                    xOffset = xScale(index) - margin.left;
                  }
                });
              }
              d.i = i;
              return xScale(i) + xOffset;
            })
            .attr("cy", function() {
              return yScaleLeft(0);
            })
            .attr("r", 10)
            .attr("opacity", 0)
            .on("mouseover", function(d) {
              revealTooltip(d, v, i);
            })
            .on("mouseout", removeTooltip);
        });

        container
          .append("text")
          .datum(v.datum)
          .attr("class", "value-label")
          .attr("x", svg_width - margin.right + 5)
          .attr("y", yScale(0))
          .attr("dy", "0.5em")
          .attr("fill", function() {
            return colorScale(v.key);
          })
          .text(function(d) {
            return formatNumber(d[d.length - 1]);
          })
          .attr("opacity", 0);

        container
          .append("text")
          .datum(v.datum)
          .attr("class", "inline-legend")
          .attr("x", svg_width - margin.right + 5)
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
    }

    container
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScaleLeft))
      .attr("transform", "translate(" + margin.left + ",0)");

    if (isMultipleMeasure) {
      container
        .append("g")
        .attr("class", "y-axis")
        .call(d3.axisRight(yScaleRight))
        .attr("transform", "translate(" + (svg_width - margin.right) + ",0)");

      container
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", svg_width - margin.left - margin.right / 2 + 50)
        .attr("x", 0 - (svg_height - margin.top) / 2)
        .attr("dy", "1em")
        .attr("class", "y-axis axis-label")
        .text(labelYRightAxis);
    }

    container
      .append("g")
      .attr("class", "x-axis")
      .call(
        d3
          .axisBottom(xScale)
          .ticks(n - 1)
          .tickFormat(getXTicks)
      )
      .attr("transform", "translate(0," + (svg_height - margin.bottom) + ")");

    container
      .append("text")
      .attr(
        "transform",
        "translate(" +
          (svg_width - margin.right + margin.left) / 2 +
          " ," +
          (svg_height - margin.bottom + margin.top - 5) +
          ")"
      )
      .attr("class", "x-axis axis-label")
      .text(labelXAxis);

    container
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("x", 0 - (svg_height - margin.top) / 2)
      .attr("dy", "1em")
      .attr("class", "y-axis axis-label")
      .text(labelYLeftAxis);

    d3.selectAll(".y-axis line").style("stroke", colorAxis);
    d3.selectAll(".y-axis .domain").style("stroke", colorAxis);
    d3.selectAll(".y-axis text").style("fill", colorAxis);
    d3.selectAll(".x-axis line").style("stroke", colorAxis);
    d3.selectAll(".x-axis .domain").style("stroke", colorAxis);
    d3.selectAll(".x-axis text").style("fill", colorAxis);
  }

  init();

  function init() {
    var lineLeft = d3
      .line()
      .x(function(d, i) {
        return xScale(i);
      })
      .y(function(d) {
        return yScaleLeft(d);
      });

    if (isMultipleMeasure) {
      var lineRight = d3
        .line()
        .x(function(d, i) {
          return xScale(i);
        })
        .y(function(d) {
          return yScaleRight(d);
        });
    }

    if (shapeLine === "smooth") {
      lineLeft.curve(d3.curveBasis);
      if (isMultipleMeasure) {
        lineRight.curve(d3.curveBasis);
      }
    }

    chartContainer
      .selectAll(".line-left")
      .transition()
      .duration(1000)
      .delay(500)
      .attrTween("d", function(d) {
        var previous = d.path0;
        var current = d.path1;
        return d3.interpolatePath(previous, current);
      });

    chartContainer
      .selectAll(".tooltip-circle-left")
      .transition()
      .duration(1000)
      .delay(500)
      .attr("cy", function(d) {
        return yScaleLeft(d);
      });

    if (isMultipleMeasure) {
      chartContainer
        .selectAll(".line-right")
        .transition()
        .duration(1000)
        .delay(500)
        .attrTween("d", function(d) {
          var previous = d.path0;
          var current = d.path1;
          return d3.interpolatePath(previous, current);
        });

      chartContainer
        .selectAll(".tooltip-circle-right")
        .transition()
        .duration(1000)
        .delay(500)
        .attr("cy", function(d) {
          return yScaleRight(d);
        });
    }

    if (positionLegend === "inline") {
      chartContainer
        .selectAll(".inline-legend")
        .transition()
        .duration(1000)
        .delay(500)
        .attr("y", function(d) {
          return yScale(d[d.length - 1]);
        })
        .attr("opacity", 1);
    }
  }

  // Tooltip
  const tooltip = container.append("div").attr("class", "chart-tooltip");
  tooltip.append("div").attr("class", "tooltip-label");
  tooltip.append("div").attr("class", "tooltip-value");

  function revealTooltip(d, v, i) {
    d3.selectAll(".line-left").attr("stroke", function(d) {
      if (v.key !== d.key) {
        return "#D1D1D1";
      } else {
        return colorScale(d.key);
      }
    });

    if (isMultipleMeasure) {
      d3.selectAll(".line-right").attr("stroke", function(d) {
        if (v.key !== d.key) {
          return "#D1D1D1";
        } else {
          return colorScale(d.key);
        }
      });
    }

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

    var leftPad = 20;
    if (!isMultipleMeasure) {
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
        measuresLeft +
        ": </td><td>" +
        formatNumber(v.values[i].value) +
        "</td></tr>";

      tooltip_html += "</table>";

      tooltip.html(tooltip_html).style("display", "block");

      v.data.forEach(function(u, ind) {
        if (u.value === d && u.key === timeRef.slice(-1)[0].key) {
          leftPad = -20 - tooltip.node().getBoundingClientRect().width;
        }
      });
    } else {
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
        v.xkey[i] +
        "</td></tr>";

      tooltip_html +=
        "<tr style='color:" +
        colorScale(v.key) +
        "'><td>" +
        v.measure +
        ": </td><td>" +
        formatNumber(v.data[i]) +
        "</td></tr>";

      tooltip_html += "</table>";

      tooltip.html(tooltip_html).style("display", "block");

      v.data.forEach(function(u, ind) {
        if (u === d && v.xkey[ind] === timeRef.slice(-1)[0].key) {
          leftPad = -20 - tooltip.node().getBoundingClientRect().width;
        }
      });
    }

    tooltip
      .style("top", d3.event.pageY - 20 + "px")
      .style("left", d3.event.pageX + leftPad + "px");
  }

  function removeTooltip() {
    tooltip.html("").style("display", "none");
    d3.selectAll(".line-left").attr("stroke", function(d) {
      return colorScale(d.key);
    });
    d3.selectAll(".line-right").attr("stroke", function(d) {
      return colorScale(d.key);
    });

    if (positionLegend === "inline") {
      d3.selectAll(".inline-legend").attr("fill", function(d) {
        return colorScale(d.key);
      });
    }
  }

  function lineMouseOver(v) {
    d3.selectAll(".line-left").attr("stroke", function(d) {
      if (v.key !== d.key) {
        return "#D1D1D1";
      } else {
        return colorScale(d.key);
      }
    });

    d3.selectAll(".line-right").attr("stroke", function(d) {
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
        if (d.includes("-")) {
          if (d.replace(/ /g, "").length === 9) {
            var timeFormat = "YYYY-YYYY";
          } else {
            var timeFormat = "mmm-mmm";
          }
        } else {
          if (d.length === 3 || d.length === 4) {
            var timeFormat = "mmm";
          } else {
            if (isNaN(d)) {
              var timeFormat = "yyyy";
            } else {
              var timeFormat = "YYYYMM";
            }
          }
        }
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

  function getLegendWidth(string) {
    var dummy = d3
      .select(el)
      .append("text")
      .text(string)
      .attr("class", "inline-legend");

    var result = dummy.node().getBoundingClientRect().width;

    dummy.remove();
    return result;
  }
}
