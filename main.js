'use strict'

var force = cola.d3adaptor();

(function() {

  var width = 860,
      height = 800,
      nodes = [], 
      links = [],
      prevLevel = 1,
      levelColors = {1: '#2b8cbe', 2: '#a6bddb', 3: '#ece7f2'},
      rootColor = '#e66101',
      linkWeights = {
        'postcode': 1,
        'birthdate': 2,
        'phone_number': 3,
        'ip_address': 4,
      };

  var svg = d3.select("#js-draw-area").append("svg")
      .attr("width", width)
      .attr("height", height);
  //var link = svg.selectAll(".link");
  var path = svg.selectAll("path");
  var node = svg.selectAll(".node"); 
  var linktext = svg.selectAll("g.linklabelholder");

  force
      .nodes(nodes)
      .links(links)
      .linkDistance(120)
      .flowLayout("x", 60)
      //.avoidOverlaps(true) // All goes wrong!!!
      //.symmetricDiffLinkLengths(20) // This creates weird stuff!
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

  function setupNodes(graphNodes, level, user) {
    if (level >= prevLevel) {
      graphNodes.forEach(function(node) {
        var isDuplicate = _.find(nodes, function(n) { return n.id === node.id; });
        if (!isDuplicate) {
          node.x = 0;
          node.y = 0;
          node.level = level;
          if (node.id === user) {
            node.root = true;
          }
          nodes.push(node);
        };
      });
    } else {
      _.remove(nodes, function(n) { return n.level === prevLevel; });
    }
  }

  function computeWeight(link) {
    var weight = 0;
    _.forEach(link.types, function(t) {
      if (linkWeights[t]) { weight += linkWeights[t] };
    });
    return weight;
  }

  function setupLinks(graphLinks, level) {
    graphLinks.forEach(function(link) {
      if (level >= prevLevel) {
        link.level = level;
        link.weight = computeWeight(link);
        links.push(link);
      } else {
        _.remove(links, function(l) { 
          return l.level === prevLevel; 
        });
      }
    });    
  }

  function start(level) {
    console.log(level);

    path = path.data(force.links(), function (d) { 
      return d.source.id + "-" + d.target.id; 
    });
    path.enter()
        .append("svg:path")
        .attr('stroke-width', function (d) {
          console.log('appending path');
          return d.weight;
        })
        .attr("class", "link")
        .attr('id', function(d) {
          return d.source.id + "-" + d.target.id;
        });
    path.exit().remove();

    node = node.data(force.nodes(), function (d) { 
      return d.id; 
    });
    node.enter()
      .append("circle")
        .attr("class", function (d) {
          console.log('appending node');
          return "node " + d.id;
        })
        .attr("r", 14)
        .attr('fill', function(d) {
          return d.root ? rootColor : levelColors[d.level];
        })
        .call(force.drag);
    node.exit().remove();

    linktext = linktext.data(force.links(), function (d) { 
      return d.source.id + "-" + d.target.id; 
    });
    linktext.enter().append("g").attr("class", "linklabelholder")
      .append("text")
        .attr("class", "linklabel")
        .attr("dx", 1)
        .attr("dy", "-.5em")
        .attr("text-anchor", "middle")
      .append('textPath')
        .attr("xlink:xlink:href", function(d) { 
          return '#' + d.source.id + "-" + d.target.id;
        })
        .attr("startOffset", '50%')
        .text(function(d) { 
          return d.types.join(' - '); 
        });
    linktext.exit().remove();

    force.start();
    prevLevel = +level;
  }

  function tick() {
    //link.attr("x1", function (d) { return d.source.x; })
    //    .attr("y1", function (d) { return d.source.y; })
    //    .attr("x2", function (d) { return d.target.x; })
    //    .attr("y2", function (d) { return d.target.y; });

    path.attr("d", function (d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0 1," + d.target.x + "," + d.target.y;
    });

    node.attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });

    //linktext.attr("xlink:xlink:href", function(d) {
    //  return '#' + d.id
    //});   
  }

  var processData = function(graph, level, user) {
    setupNodes(graph.nodes, +level, user);
    setupLinks(buildLinkObjs(nodes, graph.links, +level), +level);

    start(level);
  };

  var requestData = function(user, level, callback) {
    d3.json('data/'+user+'-'+level+'.json', function (error, graph) {
      return callback(graph, level, user);
    });
  };

  var requestDataMemoized = async.memoize(requestData, function(user, level) {
    return user+level});

  d3.select('#js-level-chooser').on('change', function() {
    requestDataMemoized('a', this.value, processData);
  });

  requestDataMemoized('a', 1, processData);

})();
