(function() {

  var raw_data = {},
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

    d3.json(user+'-'+args.level+'.json', function(error, json) {
      if (error) return console.warn(error);
      raw_data[args.level] = json;
      callback(args);
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
      l.source = nodes[link.source] || (nodes[link.source] = _.find(raw_data.all_nodes, function(o) {
        return o.id === link.source;
      }));
      l.target = nodes[link.target] || (nodes[link.target] = _.find(raw_data.all_nodes, function(o) {
        return o.id === link.target;
      }));
      ls.push(l);
    });
    return [nodes, ls];
  }

  function computeLinks(level) {
    var all_links = [];
    for (var i = level; i > 0; i--) {
      all_links = all_links.concat(raw_data[i].links);
    };
    return all_links;
  }

  function computeForce(args) {
    return d3.layout.force()
      .nodes(d3.values(args.nodes))
      .links(args.links)
      .size([args.width, args.height])
      .linkDistance(160)
      .charge(-30)
      .on("tick", args.tick)
      .start();
  }

  function draw(args) {
    var link,
        node,
        force,
        nodes_links;

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

    raw_data.all_nodes = [];
    for (var i = args.level; i > 0; i--) {
      raw_data.all_nodes = raw_data.all_nodes.concat(raw_data[i].nodes);
    }
    nodes_links = computeNodes(computeLinks(args.level));
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