'use strict'

var force = cola.d3adaptor();

(function() {

  var width = 860,
      height = 800,
      nodeData = [],
      linkData = [],
      prevLevel = 1,
      nodeLevelColors = {1: '#045a8d', 2: '#2b8cbe', 3: '#74a9cf', 4: '#bdc9e1', 5: '#f1eef6'},
      nodeRootColor = '#e66101',
      nodeLinkColor = '#333',
      linkColor = '#C9C9C9',
      linkWeights = {
        'postcode': 1,
        'birthdate': 2,
        'phone_number': 3,
        'ip_address': 4,
      };

  var zoom = d3.behavior.zoom()
     .scaleExtent([.5, 2])
     .on('zoom', zoomed);

  var root = d3.select('#js-draw-area').append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g')
      .call(zoom);

  var svg = root.append('g');
  var linkGroup = svg.append('g')
      .attr('class', '.linkGroup');
  var links = linkGroup.selectAll('.link');

  var nodeGroup = svg.append('g')
      .attr('class', '.nodeGroup');
  var nodes = nodeGroup.selectAll('.node');

  var nodeLabelGroup = svg.append('g')
      .attr('class', '.nodeTextGroup');
  var nodeLabels = nodeLabelGroup.selectAll('g.node-label');

  function zoomed() {
    svg.attr('transform', 'translate(' + d3.event.translate + ')scale(' +
     d3.event.scale + ')');
  }

  function slided(d){
    zoom.scale(d3.select(this).property('value'))
        .event(svg);
  }

  force
      .nodes(nodeData)
      .links(linkData)
      .linkDistance(70)
      .flowLayout('y', 30)
      //.avoidOverlaps(true) // All goes wrong!!!
      //.symmetricDiffLinkLengths(20) // This creates weird stuff!
      .size([width, height])
      .on('tick', tick);





  //################################################# Data setup

  var processData = function(graph, level, user) {
    // Important in order to not corrupt graph between exit/enter/update.
    var graphCln =  _.cloneDeep(graph);

    setupLinkNodes(graphCln, level, user);

    setupNodes(graphCln.nodes, +level, user);
    setupLinks(buildLinkObjs(nodeData, graphCln.links, +level), +level);

    start(level);
  };

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

  // group by source, then by type.
  function setupLinkGroups(graphLinks) {
    var linkGroupsSource = _.groupBy(graphLinks, function(l) { return l.source; });
    _.each(linkGroupsSource, function(group, source) {
      var linkGroupsType = {};
      group.forEach(function(link) {
        if (linkGroupsType[link.type] === undefined) {
          linkGroupsType[link.type] = [link];
        } else {
          linkGroupsType[link.type].push(link);
        }
      });
      linkGroupsSource[source] = linkGroupsType;
    });
    return d3.map(linkGroupsSource);
  }

  function setupLinkNodes(graph, level, user) {
    var linkGroupsSource = setupLinkGroups(graph.links);
    // reset graphLinks
    graph.links = [];
    linkGroupsSource.forEach(function(sourceId, linkGroups) {
      _.each(linkGroups, function(links, linkId) {
        if (links.length > 1) {
          var nodeId = links[0].source + '-' + linkId;
          // push new `link` node
          graph.nodes.push({'id': nodeId, 'name': linkId, 'type': 'link-node'});
          // push new pre links
          graph.links.push({
            'source': links[0].source,
            'target': nodeId,
            'type': links[0].type,
            'pre_link_node': true
          });
          links.forEach(function(link) {
            // push new post links
            graph.links.push({
              'source': nodeId,
              'target': link.target,
              'type': link.type
            });
          });
        } else {
          // push old link back in place
          graph.links.push({
            'source': links[0].source,
            'target': links[0].target,
            'type': links[0].type
          });
        }
      });
    });
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

  //#################################################//





  function computeWeight(link) {
    //var weight = 0;
    //_.forEach(link.types, function(t) {
    //  if (linkWeights[t]) { weight += linkWeights[t] };
    //});
    return linkWeights[link.type]*2;
  }

  function startNodes(level) {
    nodes = nodes.data(force.nodes(), function (d) {
      return d.id;
    });
    nodes
        .enter()
      .append('circle')
        .attr('title', function (d) {
          return d.id;
        })
        .attr('class', function (d) {
          var type = d.type || '';
          var c = 'node ' + d.id + ' ' + type;
          if (d.root) {
            c = c + ' root';
          }
          return c;
        })
        .attr('r', function (d) {
          if (d.type) {
            return 0;
          } else {
            return 9;
          }
        })
        .attr('fill', function(d) {
          if (d.root) {
            return nodeRootColor;
          } else if(d.type) {
            return nodeLinkColor;
          } else {
            return nodeLevelColors[d.level];
          }
        })
        .call(force.drag);
    nodes.exit().remove();
  }

  function startNodeLabels(level) {
    nodeLabels = nodeLabels.data(force.nodes(), function (d) {
      return d.id;
    });
    nodeLabels.enter()
      .append('text')
      .attr('class', 'node-label')
      .text( function (d) {
        return d.type ? '' : d.name;
      });
    nodeLabels.exit().remove();
    toggleNodeLabels.call(d3.select('#js-labels').node());
  }

  function startLinks(level) {
    links = links.data(force.links(), function (d) {
      return d.source.id + '-' + d.target.id;
    });
    links
        .enter()
      //.append('svg:path')
      .append('svg:line')
        .attr('stroke-width', function (d) {
          return d.weight;
        })
        .attr('class', 'link')
        .attr('id', function(d) {
          return d.source.id + '-' + d.target.id;
        });
    links.exit().remove();
  }

  function startLinksText(level) {
    linkstext = linkstext.data(force.links(), function (d) {
      return d.source.id + '-' + d.target.id;
    });
    linkstext
        .enter()
      .append('g')
        .attr('class', 'linklabelholder')
      .append('text')
        .attr('class', 'linklabel')
        .attr('dx', 1)
        .attr('dy', '1em')
        .attr('text-anchor', 'middle')
      .append('textPath')
        .attr('xlink:xlink:href', function(d) {
          return '#' + d.source.id + '-' + d.target.id;
        })
        .attr('startOffset', '50%')
        .text(function(d) {
          return d.pre_link_node ? d.type : '';
        });
    linkstext.exit().remove();
  }

  function start(level) {
    startNodes(level);
    startNodeLabels(level);
    startLinks(level);
    //startLinksText(level);

    force.start();
    prevLevel = +level;
  }

  function tick() {
    //links.attr('d', function (d) {
    //    var dx = d.target.x - d.source.x,
    //        dy = d.target.y - d.source.y,
    //        dr = Math.sqrt(dx * dx + dy * dy);
    //    return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr +
    //     ' 0 0 1,' + d.target.x + ',' + d.target.y;
    //});

    links.attr("x1", function (d) {
      return d.source.x;
    })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

    nodes.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; });

    nodeLabels.attr("transform", function(d) {
            return "translate(" + (d.x + 10) + "," + d.y + ")"; });
  }

  var requestData = function(user, level, callback) {
    d3.json('data/'+user+'-'+level+'.json', function (error, graph) {
      if (error) {
        console.error(error);
      } else {
        return callback(graph, level, user);
      }
    });
  };

  var requestDataMemoized = async.memoize(requestData, function(user, level) {
    return user+level});

  requestDataMemoized('a', 1, processData);




  //################################################# Actions

  function toggleNodeLabels() {
    if (this.checked) {
      d3.selectAll('.node-label').classed({'node-label': true, 'active': true});
    } else {
      d3.selectAll('.node-label').classed({'node-label': true, 'active': false});
    }
  }

  d3.selectAll('.controls > button').on('click', function() {
    d3.selectAll(d3.select(this).node().parentNode.children)
        .classed('active', false);
    d3.select(this)
        .classed('active', true);
    requestDataMemoized('a', this.value, processData);
  });

  d3.select('#js-level-chooser').on('input', slided);

  d3.select('#js-labels').on('click', function() {
    toggleNodeLabels.call(this);
  });

})();
