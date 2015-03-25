/*jslint unparam: true, todo: true, indent: 4 */
(function () {
  'use strict';

  var evaluate = function (context, expr) {
      var recurse = function (context, splitted) {
        if (splitted.length > 0) {
          var path = splitted[0];
          if (context.hasOwnProperty(path)) {
            return recurse(context[path], splitted.slice(1));
          }
        } else {
          return context;
        }
      };
      return recurse(context, expr.split('.'));
    },

    highlight = function (text, emphasis, caseSensitive) {
      var result = text;
      if (text && (emphasis || angular.isNumber(emphasis))) {
        text = text.toString();
        emphasis = emphasis.toString();
        if (caseSensitive) {
          result = text.split(emphasis).join('<span class="emphasis">' + emphasis + '</span>');
        } else {
          result = text.replace(new RegExp(emphasis, 'gi'), '<span class="emphasis">$&</span>');
        }
      }
      return result;
    },

    walk = function (model, childrenProp, visitFn) {
      var nodes, stack, root, node, children, child, k,
        childrenOf = function (node) {
          if (node.hasOwnProperty(childrenProp)) {
            return node[childrenProp];
          }
        };
      nodes = childrenOf(model);
      if (nodes) {
        root = nodes[0];
        if (root) {
          stack = [];
          stack.push(root);
          while (stack.length > 0) {
            node = stack.pop();
            visitFn(node);
            children = childrenOf(node);
            if (children) {
              for (k = children.length - 1; k >= 0; k -= 1) {
                child = children[k];
                // it pimps the children with their parent reference
                child.$parent = node;
                stack.push(child);
              }
            }
          }
        }
      }
    },

    pimp = function (model, node, childrenProp, nameProp, dataProp, valueProp) {
      (function pimpModel() {
        if (!model.$pimped) {
          model.$maxdepth = 0;
          model.$children = model[childrenProp]; // TODO check if
          model.$root = model[childrenProp] ? model[childrenProp][0] : undefined;

          model.$select = function (path) {
            var route = function (node, path) {
                var k, result,
                  children = node.$children,
                  p = path[0];
                if (p) {
                  for (k = 0; k < children.length; k = k + 1) {
                    if (children[k].$name === p.$name) {
                      result = children[k];
                      return route(result, path.slice(1));
                    }
                  }
                } else {
                  return node;
                }
              },
              n = route(model, path);
            if (n) {
              n.$select();
            }
          };

          model.$pathString = function (node) {
            if (node) {
              return '/' + node.$path.map(function (n) { return n.$name; }).join('/');
            }
          };

          model.$collapse = function () {
            walk(model, childrenProp, function (node) {
              delete node.$isOpen;
            });
          };

          model.$expand = function (level) {
            walk(model, childrenProp, function (node) {
              delete node.$isOpen;

              if (node.$isFolder && node.$level < level) {
                node.$isOpen = true;
              }
            });
          };

          model.$pimped = true;
        }
      }());

      (function pimpNode() {
        if (!node.$pimped) {
          node.$highlight = function () {
            var name = this.$name,
              text = highlight(name, model.$highlight, true);
            if (text !== name) {
              this.$isHighlighted = true;
            } else {
              delete this.$isHighlighted;
            }
            return text;
          };

          node.$toggle = function () {
            // TODO update the toolbar.level accordingly
            if (this.$isFolder) {
              if (this.$isOpen) {
                delete this.$isOpen;
              } else {
                this.$isOpen = true;
              }
            }
          };

          node.$isVisible = function () {
            var boolean = true;
            angular.forEach(this.$path.slice(0, -1), function (node) {
              boolean = boolean && node.$isFolder && node.$isOpen;
            });
            return boolean;
          };

          node.$select = function () {
            if (model.$selected) {
              delete model.$selected.$isSelected;
            }
            this.$isSelected = true;
            model.$selected = this;
          };

          (function (node) {
            node.$children = node[childrenProp] || [];
            node.$name = node[nameProp];
            node.$value = node[valueProp];
            node.$isRoot = (node.$parent === undefined);
            var level = 0,
              path = [node],
              n = node;
            while (!n.$isRoot) {
              level += 1;
              n = n.$parent;
              path.push(n);
            }
            node.$path = path.reverse();
            node.$level = level;
            if (model.$maxdepth < level) {
              model.$maxdepth = level;
            }
            node.$isFolder = node.$children && node.$children.length > 0;
            if (node.$isFolder && node.$isRoot) {
              node.$isOpen = true;
            }
            if (dataProp) {
              node.$data = evaluate(node, dataProp);
            }
            node.$pimped = true;
          }(node));
        }
      }());
      return node;
    },

    ngWidgets = angular.module('ngWidgets', [])
      .directive('ngwTreeWalker', [function () {
        return {
          restrict: 'A',
          priority: 1000,
          terminal: true,
          transclude: 'element',
          scope: false,
          compile: function (tElement, tAttrs) {
            var nodeProp, modelProp, childrenProp, nameProp, valueProp, oldClones,
              expression = tAttrs.ngwTreeWalker,
              match = expression.match(/([\w]+)\s+(in)\s+(([\w]+)(\.[\w]+)*)/);

            if (!match) {
              throw 'invalid expression "' + expression + '"';
            }
            nodeProp = match[1];
            modelProp = match[3];
            childrenProp = tAttrs.children || 'children';
            nameProp = tAttrs.name || 'name';
            valueProp = tAttrs.value || 'value';
            oldClones = [];

            // return postLink function
            return function (scope, iElement, iAttrs, controller, transcludeFn) {
              scope.$watch(function (scope) { return scope[modelProp]; }, function (newModel) {
                if (newModel) {
                  // (1) hold the new model
                  scope.model = newModel;

                  // (2) dispose previous transcluded clones and their scopes
                  var clone;
                  while (oldClones.length > 0) {
                    clone = oldClones.pop();
                    clone.scope().$destroy();
                    clone.remove();
                  }

                  // (3) traverse the hierarchical model to pimp and transclude its nodes
                  walk(scope.model, childrenProp, function (node) {
                    pimp(scope.model, node, childrenProp, nameProp, valueProp);

                    // link the transcluded content to the right scope
                    transcludeFn(function ngwRepeatTranscludeLink(clone, scope) {

                      // save the clone element for later disposal
                      oldClones.push(clone);

                      // put current node in cloned scope
                      scope[nodeProp] = node;

                      // finally append the cloned element to the DOM
                      iElement.parent().append(clone);
                    });
                  });
                }
              });
            };
          }
        };
      }])


      .directive('ngwTreeTable', ['$parse', '$compile', function ($parse, $compile) {
        return {
          restrict: 'A',
          scope: {
            model: '=',
            cellStyle: '&',
            cellClass: '&',
            cellContent: '&'
          },
          compile: function ngwTreeTableCompile(tElement, tAttrs) {
            var headersProp = tAttrs.headers || 'headers',
              childrenProp = tAttrs.children || 'children',
              nameProp = tAttrs.name || 'name',
              dataProp = tAttrs.data  || 'data',
              valueProp = tAttrs.value  || 'value',
              maybeLeaf = function (node) {
                return !node.$isFolder ? 'ngw-icon-leaf' : '';
              },
              orMaybeFolder = function (node) {
                return node.$isFolder ? 'ng-click="node.$toggle()" ng-class="{\'ngw-icon-leaf\': !node.$isFolder, \'ngw-icon-folder-close\': node.$isFolder && !node.$isOpen, \'ngw-icon-folder-open\': node.$isFolder && node.$isOpen}"' : '';
              };

            // return the postLink function where the model will be watched for changes and
            // the tBody updated accordingly and children scopes created (and destroyed)
            return function ngwTreeTablePostLink(scope, iElement, iAttrs) {
              var k, table, thead, tbody,
                oldScopes = [],
                cellClassOf = function (node, index) {
                  return iAttrs.cellClass ? scope.cellClass({node: node, index: index}) : 'cell-default';
                },
                cellStyleOf = function (node, index) {
                  return iAttrs.cellStyle ? scope.cellStyle({node: node, index: index}) : '';
                },
                cellContentOf = function (node, index) {
                  return iAttrs.cellContent ? scope.cellContent({node: node, index: index}) : node.$data[index];
                };

              table = angular.element('<table class="ngw-table ngw-tree-table">' +
                ' <thead></thead><tbody></tbody>' +
                '</table>'
                );
              thead = table.find('thead');
              tbody = table.find('tbody');

              scope.$watch(function (scope) { return scope.model; }, function (newModel, oldModel) {
                var headers, th;
                if (newModel) {
                  // dispose old scopes
                  while (oldScopes.length > 0) {
                    oldScopes.pop().$destroy();
                  }
                  // remove old elements and append a new linked one
                  iElement.html('');
                  thead.html('');
                  tbody.html('');


                  // append both the toolbar and table once they're linked to a new child scope
                  // iElement.append($compile(toolbar)(scope));
                  iElement.append($compile(table)(scope));

                  // get the headers array and create the thead template contents
                  headers = scope.$eval('model.' + headersProp) || [];
                  if (headers.length > 0) {
                    th = '<th>' + nameProp + '</th>';
                    // th += '<th>' + valueProp + '</th>';
                    for (k = 0; k < headers.length; k = k + 1) {
                      th += '<th>' + headers[k] + '</th>';
                    }
                    thead.append(th);
                  }

                  // walk the hierachical data to visit each node
                  walk(newModel, childrenProp, function visit(node) {
                    pimp(newModel, node, childrenProp, nameProp, dataProp, valueProp);
                    var template, tr, trScope;

                    template =
                      '  <tr>' +
                      '    <td class="level level-' + node.$level + '">' +
                      '      <i class="ngw-icon ' + maybeLeaf(node) + '" ' + orMaybeFolder(node) + '></i>' +
                      '      <span ng-click="node.$select()" ng-bind-html="node.$highlight()" title="' + node.$name + '"></span>' +
                      '    </td>';
                    /*template +=
                     '  <td class="cell">' +
                     '    <span ng-bind="node.$value"></span>' +
                     '  </td>';*/
                    for (k = 0; k < headers.length; k = k + 1) {
                      template +=
                          '<td class="cell ' + cellClassOf(node, k) + '" style="' + cellStyleOf(node, k) + '">' +
                            cellContentOf(node, k) +
                          '</td>';
                    }
                    template += '</tr>';

                    tr = angular.element(template.trim());
                    trScope = scope.$new();
                    trScope.node = node;

                    // store the newly created scope for later disposal
                    // (this will prevent memory leaks)
                    oldScopes.push(trScope);

                    // watch for some node properties change
                    trScope.$watch('node.$isVisible()', function (visible) {
                      if (!visible) { tr.addClass('hidden'); } else { tr.removeClass('hidden'); }
                    });
                    trScope.$watch('node.$isSelected', function (selected) {
                      if (selected) { tr.addClass('selected'); } else { tr.removeClass('selected'); }
                    });

                    // finally link and append the row element
                    tbody.append($compile(tr)(trScope));
                  });
                }
              });
            };
          }
        };
      }])


      .directive('ngwToolbar', ['$compile', function ($compile) {
        return {
          restrict: 'A',
          scope: {
            widget: '@'
          },
          link: function (scope, iElement, iAttrs) {
            var el, tableTree, modelProp, template;
            if (scope.widget) {
              el = document.querySelector('#' + scope.widget);
              if (el) {
                tableTree = angular.element(el);
                modelProp = tableTree.attr('model');
                if (modelProp) {
                  scope.$watch(function () {
                    return tableTree.scope().$eval(modelProp);
                  }, function (newModel) {
                    if (newModel) {
                      scope.toolbar = {
                        level: 1,
                        expand: function () {
                          this.level = this.level + 1;
                          // cap this.level to model depth
                          if (this.level > newModel.$maxdepth) {
                            this.level = newModel.$maxdepth;
                          }
                          newModel.$expand(this.level);
                        },
                        collapse: function () {
                          this.level = this.level - 1;
                          // cap this.level to 1
                          if (this.level < 1) {
                            this.level = 1;
                          }
                          newModel.$expand(this.level);
                        },
                        filter: {
                          // text
                          textChange: function () {
                            newModel.$highlight = this.text;
                          },
                          apply: function () {
                            this.state = !this.state;
                            // TODO implement me somehow!
                          }
                        }
                      };

                      template = '<div class="ngw-toolbar">' +

                        '  <button ng-click="toolbar.filter.apply(toolbar.filter.text)" class="ngw-tool ngw-tool-default" ' +
                         '    ng-class="{\'ngw-tool-selected\': toolbar.filter.state}"' +
                         '    title="Filter by the supplied text">' +
                         '    <i class="ngw-icon ngw-icon-filter"></i></button>' +
                         '  <input type="text" ng-model="toolbar.filter.text" ng-change="toolbar.filter.textChange()">' +

                        '  <button ng-click="toolbar.collapse()" class="ngw-tool ngw-tool-default" title="Collapse">' +
                        '    <i class="ngw-icon ngw-icon-collapse"></i></button>' +
                        '  <label class="ngw-tool">{{toolbar.level}}</label>' +

                        '  <button ng-click="toolbar.expand()" class="ngw-tool ngw-tool-default" title="Expand">' +
                        '    <i class="ngw-icon ngw-icon-expand"></i></button>' +
                        '</div>';

                      iElement.html('').append($compile(template)(scope));
                    }
                  });
                }
              }
            }
          }
        };
      }])


      .directive('ngwTreeMap', function ($timeout) {
        return {
          restrict: 'A',
          scope: {
            model: '='
          },
          compile: function ngwTreeMapCompile(tElement, tAttrs) {
            var childrenProp = tAttrs.children || 'children',
              nameProp = tAttrs.name || 'name',
              dataProp = tAttrs.data || 'data',
              valueProp = tAttrs.value || 'value';

            return function ngwTreeMapPostLink(scope, iElement, iAttrs) {
              var parent, treemap, svg, margin, width, height, head;

              parent = d3.select(iElement[0]);
              width = parent.node().offsetWidth;
              height = 500; // TODO d3.select(iElement[0]).node().offsetHeight;

              // see http://bl.ocks.org/mbostock/3019563
              margin = {top: 20, right: 0, bottom: 0, left: 0};
              width = width - margin.left - margin.right;
              height = height - margin.top - margin.bottom;

              svg = parent.append('svg')
                .attr('class', 'ngw-tree-map')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                  .style('shape-rendering', 'crispEdges');

              treemap = d3.layout.treemap()
                .children(function (d, depth) {
                  return depth ? null : d.natus;
                })
                .sort(function (a, b) { return a.value - b.value; })
                .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
                .round(false);

              head = svg.append('g')
                .attr('class', 'head');

              head.append('rect')
                .attr('y', -margin.top)
                .attr('width', width)
                .attr('height', margin.top);

              head.append('text')
                .attr('x', 6)
                .attr('y', 4 - margin.top)
                .attr('dy', '.75em');

              scope.$watch(function (scope) { return scope.model; }, function (newModel) {
                if (newModel) {
                  // traverse the hierarchical model to pimp its nodes with additional properties
                  walk(newModel, childrenProp, function (node) {
                    pimp(newModel, node, childrenProp, nameProp, dataProp, valueProp);
                  });
                  // then render the pimped model
                  scope.render(newModel);
                }
              });

              // TODO couldn't the render function be added to somewhere else rather than to scope?
              scope.render = function (model) {
                // remove all previous items before render
                svg.select('.body').remove();

                // initialize the root node
                // TODO can we prefix with a $ char the properties being added here (x, y, dx, dy, depth, parent)?
                var root = model.$root;
                root.x = root.y = 0;
                root.dx = width;
                root.dy = height;
                root.depth = 0;

                // TODO pimp() function could calculate the missing values rather than accumulate

                // Aggregate the values for internal nodes. This is normally done by the
                // treemap layout, but not here because of our custom implementation.
                // We also take a snapshot of the original children (natus) to avoid
                // the children being overwritten when when layout is computed.
                function accumulate(d) {
                  var result, init;
                  // TODO pimp(model, d, nameProp, childrenProp);
                  d.natus = d.children;
                  if (d.children && d.children.length > 0) {
                    init = 0;
                    result = d.value = d.children.reduce(function (prev, curr) {
                      return prev + accumulate(curr);
                    }, init);
                  } else {
                    result = d.value;
                  }
                  return result;
                }
                accumulate(root);


                // Compute the treemap layout recursively such that each group of siblings
                // uses the same size (1×1) rather than the dimensions of the parent cell.
                // This optimizes the layout for the current zoom state. Note that a wrapper
                // object is created for the parent node for each group of siblings so that
                // the parent’s dimensions are not discarded as we recurse. Since each group
                // of sibling was laid out in 1×1, we must rescale to fit using absolute
                // coordinates. This lets us use a viewport to zoom.
                function layout(d) {
                  if (d.natus) {
                    treemap.nodes({natus: d.natus});
                    d.natus.forEach(function (c) {
                      c.x = d.x + c.x * d.dx;
                      c.y = d.y + c.y * d.dy;
                      c.dx *= d.dx;
                      c.dy *= d.dy;
                      c.parent = d;
                      layout(c);
                    });
                  }
                }
                layout(root);

                function display(d) {
                  var g, g1, transition, transitioning,
                    x = d3.scale.linear().domain([0, width]).range([0, width]),
                    y = d3.scale.linear().domain([0, height]).range([0, height]);

                  function rect(r) {
                    r.attr('x', function (d) { return x(d.x); })
                      .attr('y', function (d) { return y(d.y); })
                      .attr('width', function (d) { return x(d.x + d.dx) - x(d.x); })
                      .attr('height', function (d) { return y(d.y + d.dy) - y(d.y); });
                  }

                  function text(t) {
                    t.attr('x', function (d) { return x(d.x) + 6; })
                      .attr('y', function (d) { return y(d.y) + 6; });
                  }

                  g1 = svg.insert('g', '.head')
                    .datum(d)
                    .attr('class', 'body');

                  transition = function (d) {
                    if (transitioning || !d) {
                      return;
                    }
                    transitioning = true;
                    var g2 = display(d),
                      t1 = g1.transition().duration(750),
                      t2 = g2.transition().duration(750);

                    // Update the domain only after entering new elements.
                    x.domain([d.x, d.x + d.dx]);
                    y.domain([d.y, d.y + d.dy]);

                    // Enable anti-aliasing during the transition.
                    svg.style('shape-rendering', null);

                    // Draw child nodes on top of parent nodes.
                    svg.selectAll('.body').sort(function (a, b) {
                      return a.depth - b.depth;
                    });

                    // Fade-in entering text.
                    g2.selectAll('text').style('fill-opacity', 0);

                    // Transition to the new view.
                    t1.selectAll('text').call(text).style('fill-opacity', 0);
                    t2.selectAll('text').call(text).style('fill-opacity', 1);
                    t1.selectAll('rect').call(rect);
                    t2.selectAll('rect').call(rect);

                    // Remove the old node when the transition is finished.
                    t1.remove().each('end', function () {
                      svg.style('shape-rendering', 'crispEdges');
                      transitioning = false;
                    });
                  };

                  head
                    .datum(d.parent)
                    .on('click', transition)
                    .select('text')
                    .text(model.$pathString(d));

                  g = g1.selectAll('g')
                    .data(d.natus)
                    .enter().append('g');

                  // Add class 'children' and on click event handler
                  // to those cells which have children
                  g.filter(function (d) { return d.natus; })
                    .classed('children', true)
                    .on('click', transition);

                  // TODO add click everywhere!!!

                  // Append an SVG rect for each nephew
                  g.selectAll('.nephew')
                    .data(function (d) {
                      return d.natus || [d];
                    })
                    .enter().append('rect')
                    .attr('class', 'nephew')
                    .call(rect);

                  g.append('rect')
                    .attr('class', 'child')
                    .call(rect);

                  // Finally append parent name
                  g.append('text')
                    .attr('dy', '.75em')
                    .text(function (d) { return d.name; })
                    .call(text);

                  $timeout(function () {
                    scope.$apply(function () {
                      model.$select(d.$path);
                    });
                  });

                  return g;
                }

                display(root);
              };
            };
          }
        };
      });

  return ngWidgets;
}());
