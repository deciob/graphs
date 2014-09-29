'use strict'

var force = cola.d3adaptor();

(function() {

  var width = 860,
      height = 800,
      nodeData = [],
      linkData = [],
      prevLevel = 1,
      levelColors = {1: '#2b8cbe', 2: '#a6bddb', 3: '#ece7f2'},
      rootColor = '#e66101',
      linkWeights = {
        'postcode': 1,
        'birthdate': 2,
        'phone_number': 3,
        'ip_address': 4,
      };

  var zoom = d3.behavior.zoom()
    .scaleExtent([.5, 2])
    .on("zoom", zoomed);

  var root = d3.select("#js-draw-area").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append('g')
      .call(zoom);

  var svg = root.append("g");
  var linkGroup = svg.append("g")
      .attr("class", ".linkGroup");
  var links = linkGroup.selectAll(".link");
  var nodeGroup = svg.append("g")
      .attr("class", ".nodeGroup");
  var nodes = nodeGroup.selectAll(".node");
  var textGroup = svg.append("g")
      .attr("class", ".textGroup");
  var linkstext = textGroup.selectAll("g.linklabelholder");

  function zoomed() {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" +
     d3.event.scale + ")");
  }

  function slided(d){
    zoom.scale(d3.select(this).property("value"))
      .event(svg);
  }

  force
      .nodes(nodeData)
      .links(linkData)
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
        var isDuplicate = _.find(nodeData, function(n) {
          return n.id === node.id;
        });
        if (!isDuplicate) {
          node.x = 0;
          node.y = 0;
          node.level = level;
          if (node.id === user) {
            node.root = true;
          }
          nodeData.push(node);
        };
      });
    } else {
      _.remove(nodeData, function(n) { return n.level === prevLevel; });
    }
  }

  function setupLinks(graphLinks, level) {
    graphLinks.forEach(function(link) {
      if (level >= prevLevel) {
        link.level = level;
        link.weight = computeWeight(link);
        linkData.push(link);
      } else {
        _.remove(linkData, function(l) {
          return l.level === prevLevel;
        });
      }
    });
  }

  function computeWeight(link) {
    var weight = 0;
    _.forEach(link.types, function(t) {
      if (linkWeights[t]) { weight += linkWeights[t] };
    });
    return weight;
  }

  function startNodes(level) {
    nodes = nodes.data(force.nodes(), function (d) {
      return d.id;
    });
    nodes.enter()
      .append("circle")
        .attr("class", function (d) {
          return "node " + d.id;
        })
        .attr("r", 14)
        .attr('fill', function(d) {
          return d.root ? rootColor : levelColors[d.level];
        })
        .call(force.drag);
    nodes.exit().remove();
  }

  function startLinks(level) {
    links = links.data(force.links(), function (d) {
      return d.source.id + "-" + d.target.id;
    });
    links.enter()
        .append("svg:path")
        .attr('stroke-width', function (d) {
          return d.weight;
        })
        .attr("class", "link")
        .attr('id', function(d) {
          return d.source.id + "-" + d.target.id;
        });
    links.exit().remove();
  }

  function startLinksText(level) {
    linkstext = linkstext.data(force.links(), function (d) {
      return d.source.id + "-" + d.target.id;
    });
    linkstext.enter().append("g").attr("class", "linklabelholder")
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
    linkstext.exit().remove();
  }

  function start(level) {
    startNodes(level);
    startLinks(level);
    startLinksText(level);

    force.start();
    prevLevel = +level;
  }

  function tick() {
    links.attr("d", function (d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr +
         " 0 0 1," + d.target.x + "," + d.target.y;
    });

    nodes.attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });
  }

  var processData = function(graph, level, user) {
    setupNodes(graph.nodes, +level, user);
    setupLinks(buildLinkObjs(nodeData, graph.links, +level), +level);

    start(level);
  };

  var requestData = function(user, level, callback) {
    d3.json('data/'+user+'-'+level+'.json', function (error, graph) {
      return callback(graph, level, user);
    });
  };

  var requestDataMemoized = async.memoize(requestData, function(user, level) {
    return user+level});

  d3.selectAll('.controls > button').on('click', function() {
    d3.selectAll(d3.select(this).node().parentNode.children)
        .classed('active', false);
    d3.select(this)
        .classed('active', true);
    requestDataMemoized('a', this.value, processData);
  });

  d3.select('#js-level-chooser').on("input", slided);

  requestDataMemoized('a', 1, processData);

})();
