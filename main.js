var force = cola.d3adaptor();

(function() {

  var width = 660,
      height = 500,
      link_conf = {
        'postcode': {'arc_factor': 1.2},
        'birthdate': {'arc_factor': 1},
        'phone_number': {'arc_factor': 1.4},
        'ip_address': {'arc_factor': 1.6},
      };

  var color = d3.scale.category20();

  force.size([width, height]);

  //function buildLinkObjs(links) {
  //  return _.map(links, function(link) {
  //    link.target = {id: link.target};
  //    link.source = {id: link.source};
  //    return link;
  //  });
  //}

  function buildLinkObjs(nodes, links) {
    return _.map(links, function(link) {
      link.target = _.find(nodes, function(node) {
        return link.target === node.id;
      });
      link.source = _.find(nodes, function(node) {
        return link.source === node.id;
      });
      return link;
    });
  }

  var svg = d3.select("#js-draw-area").append("svg")
      .attr("width", width)
      .attr("height", height);

  d3.json("data/a-1.json", function (error, graph) {
    var nodes = [], links = [];
    force
        .nodes(nodes)
        .links(links)
        .linkDistance(120)
        .size([width, height])
        .on("tick", tick);

    graph.nodes.forEach(function(node) {
      nodes.push(node);
    });
    buildLinkObjs(nodes, graph.links).forEach(function(link) {
      links.push(link);
    });

    var link = svg.selectAll(".link");
  //        .data(graph.links)
  //      .enter().append("line")
  //        .attr("class", "link")
  //        .style("stroke-width", function (d) { return Math.sqrt(d.value); });
//
    var node = svg.selectAll(".node");
  //        .data(graph.nodes)
  //      .enter().append("circle")
  //        .attr("class", "node")
  //        .attr("r", 5)
  //        .style("fill", function (d) { 
  //          if (d.name === 'a' || d.name === 'm') {
  //            return 'red'; 
  //          } else {
  //            return color(d.group); 
  //          };
  //          
  //        })
  //        .call(force.drag);


    function start() {
      link = link.data(force.links(), function (d) { 
        return d.source.id + "-" + d.target.id; 
      });
      link.enter().insert("line", ".node").attr("class", "link");
      link.exit().remove();
      node = node.data(force.nodes(), function (d) { return d.id; });
      node.enter().append("circle").attr("class", function (d) { 
        return "node " + d.id; 
      }).attr("r", 8);
      node.exit().remove();
      force.start();
    }

      //node.append("title")
      //    .text(function (d) { return d.name; });

    function tick() {
      link.attr("x1", function (d) { return d.source.x; })
          .attr("y1", function (d) { return d.source.y; })
          .attr("x2", function (d) { return d.target.x; })
          .attr("y2", function (d) { return d.target.y; });
      node.attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; });       
    }

    start();

  });

})();