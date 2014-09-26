(function() {

  var links,
      nodes,
      width = 960,
      height = 500,
      force,
      viz,
      args = {}
      link_conf = {
        'postcode': {'arc_factor': 1.2},
        'birthdate': {'arc_factor': 1},
        'phone_number': {'arc_factor': 1.4},
      };

  function getData(user, level, args, callback) {
    d3.csv(user+'-'+level+'.csv', function(d) {
      return {
        source: d.source,
        target: d.target,
        type: d.type
      };
    }, function(error, rows) {
      if(error) {
        console.log(error);
      } else {
        args.links = rows;
        callback(args);
      }
    });
  }

  function dragstart(d) {
    d3.select(this).classed("fixed", d.fixed = true);
  }

  function mouseover() {
    d3.select(this).select("circle").transition()
        .duration(750)
        .attr("r", 16);
  }

  function mouseout() {
    d3.select(this).select("circle").transition()
        .duration(750)
        .attr("r", 8);
  }

  function computeNodes(links) {
    // Compute the distinct nodes from the links.
    var nodes = {};
    links.forEach(function(link) {
      link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
      link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });
    return nodes;
  }

  function computeForce(args) {
    return d3.layout.force()
      .nodes(d3.values(args.nodes))
      .links(args.links)
      .size([args.width, args.height])
      .linkDistance(160)
      .charge(-300)
      .on("tick", args.tick)
      .start();
  }

  function draw(args) {
    var link,
        linktext,
        node,
        force;

    function tick() {

      link.attr("d", function(d) {

        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy) / link_conf[d.type].arc_factor;
        return "M" + d.source.x + "," + d.source.y + "A" + dr + ","
              + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
      });

      // link label
      //linktext.attr("transform", function(d) {
      //  return "translate(" + (d.source.x + d.target.x) / 2 + ","
      //    + (d.source.y + d.target.y) / 2 + ")";
      //});

      node
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

    args.nodes = computeNodes(args.links);
    args.tick = tick;
    force = computeForce(args);
    force
      .drag()
      .on("dragstart", dragstart);

    link = viz.selectAll(".link")
        .data(force.links())
      .enter().append("path")
        .attr("class", "link");


    //linktext = viz.selectAll("g.linklabelholder").data(args.links);
    //linktext.enter().append("g").attr("class", "linklabelholder")
    //  .append("text")
    //  .attr("class", "linklabel")
    //  .attr("dx", 1)
    //  .attr("dy", ".35em")
    //  .attr("text-anchor", "middle")
    //  .text(function(d) {
    //    return d.type;
    //  });


    node = viz.selectAll(".node")
        .data(force.nodes())
      .enter().append("g")
        .attr("class", "node")
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .call(force.drag);

    node.append("circle")
        .attr("r", 8);

    node.append("text")
        .attr("x", 12)
        .attr("dy", ".35em")
        .text(function(d) {
          return d.name;
        });
  }

  viz = d3.select("#js-draw-area").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g");

  args.width = width;
  args.height = height;
  getData('a', 1, args, draw);

})();