(function() {

  var raw_data = {},
      //all_links = [],
      //all_links_nodes = [],
      all_nodes = {},
      width = 660,
      height = 500,
      force,
      viz,
      args = {}
      link_conf = {
        'postcode': {'arc_factor': 1.2},
        'birthdate': {'arc_factor': 1},
        'phone_number': {'arc_factor': 1.4},
        'ip_address': {'arc_factor': 1.6},
      };

  function getData(user, args, callback) {
    d3.csv(user+'-'+args.level+'.csv', function(d) {
      return {
        source: d.source,
        target: d.target,
        type: d.type
      };
    }, function(error, rows) {
      if(error) {
        console.log(error);
      } else {
        raw_data[args.level] = rows;
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
    var ls = [];
    // Compute the distinct nodes from the links.
    var nodes = {};
    links.forEach(function(link) {
      var l = {};
      l.type = link.type;
      l.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
      l.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
      ls.push(l);
    });
    //console.log(all_links_nodes);
    return [nodes, ls];
  }

  function computeLinks(level) {
    var all_links = [];
    for (var i = level; i > 0; i--) {
      all_links = all_links.concat(raw_data[i]);
    };
    return all_links;
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
        force,
        nodes;

    function tick(e) {

      link.attr("d", function(d) {

        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy) / link_conf[d.type].arc_factor;
        return "M" + d.source.x + "," + d.source.y + "A" + dr + ","
              + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
      });

      node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    }

    //all_links = computeLinks(args.level);
    var nodes_links = computeNodes(computeLinks(args.level));
    args.nodes = nodes_links[0];
    args.links = nodes_links[1];
    args.tick = tick;
    force = computeForce(args);
    force
      .drag()
      .on("dragstart", dragstart);

    viz.selectAll(".link").remove();
    viz.selectAll(".node").remove();

    link = viz.selectAll(".link")
        .data(force.links())
      .enter().append("path")
        .attr("class", "link");

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
  args.level = 1;
  getData('a', args, draw);

  d3.select('#js-level-chooser').on('change', function() {
    args.prev_level = args.prev_level || 1;
    args.level = this.value;
    getData('a', args, draw);
  });

})();