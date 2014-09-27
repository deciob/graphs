var force = cola.d3adaptor();

(function() {

  var width = 660,
      height = 500,
      color = d3.scale.category20(),
      nodes = [], 
      links = []
      prevLevel = 1;

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

  function buildLinkObjs(nodes, graphLinks, level) {
    if (level >= prevLevel) {
      return _.map(graphLinks, function(link) {
        link.target = _.find(nodes, function(node) {
          return link.target === node.id;
        }) || link.target;
  
        link.source = _.find(nodes, function(node) {
          return link.source === node.id;
        }) || link.source;
        
        return link;
      });
    } else {
      return graphLinks;
    }
  }

  function setupNodes(graphNodes, level) {
    if (level >= prevLevel) {
      graphNodes.forEach(function(node) {
        var isDuplicate = _.find(nodes, function(n) { return n.id === node.id; });
        if (!isDuplicate) {
          node.x = 0;
          node.y = 0;
          node.level = level;
          nodes.push(node);
        };
      });
    } else {
      _.remove(nodes, function(n) { return n.level === prevLevel; });
    }
  }

  function setupLinks(graphLinks, level) {
    graphLinks.forEach(function(link) {
      if (level >= prevLevel) {
        link.level = level;
        links.push(link);
      } else {
        _.remove(links, function(l) { return l.level === prevLevel; });
      }
    });    
  }

  function start(level) {
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
    prevLevel = +level;
  }

  function tick() {
    link.attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    node.attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });       
  }

  var processData = function(graph, level) {
    setupNodes(graph.nodes, +level);
    setupLinks(buildLinkObjs(nodes, graph.links, +level), +level);

    start(level);
  };

  var requestData = function(user, level, callback) {
    d3.json('data/'+user+'-'+level+'.json', function (error, graph) {
      return callback(graph, level);
    });
  };

  var requestDataMemoized = async.memoize(requestData, function(user, level) {
    return user+level});

  d3.select('#js-level-chooser').on('change', function() {
    requestDataMemoized('a', this.value, processData);
  });

  requestDataMemoized('a', 1, processData);

})();
