var force = cola.d3adaptor();

(function() {

  var width = 660,
      height = 500,
      color = d3.scale.category20(),
      nodes = [], 
      links = [];

  var svg = d3.select("#js-draw-area").append("svg")
      .attr("width", width)
      .attr("height", height);
  var link = svg.selectAll(".link");
  var node = svg.selectAll(".node"); 

  force
      .nodes(nodes)
      .links(links)
      .linkDistance(120)
      .size([width, height])
      .on("tick", tick);

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

  function start() {
    link = link.data(force.links(), function (d) { 
      return d.source.id + "-" + d.target.id; 
    });
    link.enter()
        .insert("line", ".node")
        .attr("class", "link");
    link.exit().remove();

    node = node.data(force.nodes(), function (d) { 
      return d.id; 
    });
    node.enter()
        .append("circle")
        .attr("class", function (d) { 
          return "node " + d.id; 
        })
        .attr("r", 8);
    node.exit().remove();

    force.start();
  }

  function tick() {
    link.attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node.attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });       
  }

  d3.json("data/a-1.json", function (error, graph) {
    
    graph.nodes.forEach(function(node) {
      nodes.push(node);
    });
    buildLinkObjs(nodes, graph.links).forEach(function(link) {
      links.push(link);
    });

    start();

  });

})();
