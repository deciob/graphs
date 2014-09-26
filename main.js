var cola = cola.d3adaptor();

(function() {

  var width = 660,
      height = 500;

  var color = d3.scale.category20();

  cola.size([width, height]);

  var svg = d3.select("#js-draw-area").append("svg")
      .attr("width", width)
      .attr("height", height);

  d3.json("a-1.json", function (error, graph) {
      cola
          .nodes(graph.nodes)
          .links(graph.links)
          //.flowLayout("x", 30)
          .symmetricDiffLinkLengths(16)
          .start(10,20,20);

      var link = svg.selectAll(".link")
          .data(graph.links)
        .enter().append("line")
          .attr("class", "link")
          .style("stroke-width", function (d) { return Math.sqrt(d.value); });

      var node = svg.selectAll(".node")
          .data(graph.nodes)
        .enter().append("circle")
          .attr("class", "node")
          .attr("r", 5)
          .style("fill", function (d) { return color(d.group); })
          .call(cola.drag);

      node.append("title")
          .text(function (d) { return d.name; });

      cola.on("tick", function () {
          link.attr("x1", function (d) { 
            //console.log(d.source)
            return d.source.x; })
              .attr("y1", function (d) { return d.source.y; })
              .attr("x2", function (d) { return d.target.x; })
              .attr("y2", function (d) { return d.target.y; });
          node.attr("cx", function (d) { return d.x; })
              .attr("cy", function (d) { return d.y; });
              
      });
  });

})();