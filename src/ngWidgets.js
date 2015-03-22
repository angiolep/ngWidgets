/*jslint unparam: true, todo: true, indent: 4 */
(function () {
    'use strict';

    var ngWidgets = angular.module('ngWidgets', []),

        evaluate = function (context, expr) {
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

        traverse = function (model, childrenProp, visitFn) {
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


        pimp = function (model, node, nameProp, childrenProp, dataProp, rendererProp) {

            if (typeof model.$collapse !== 'function') {
                model.$collapse = function () {
                    traverse(model, childrenProp, function (node) {
                        delete node.$isOpen;
                    });
                };
            }

            if (typeof model.$expand !== 'function') {
                model.$expand = function () {
                    traverse(model, childrenProp, function (node) {
                        if (node.$isFolder) {
                            node.$isOpen = true;
                        }
                    });
                };
            }

            if (typeof model.$render !== 'function') {
                // default renderer
                model.$render = function (data, index) {
                    if (data) {
                        if (data.constructor === Array) {
                            data = data[index || 0];
                        }
                        if (data) {
                            // TODO output some HTML which better display the data according to its type
                            return '<span>' + data + '</span>';
                        }
                    }
                };
                try {
                    var renderer = evaluate(model, rendererProp);
                    if (typeof renderer === 'function') {
                        model.$render = renderer;
                    }
                } catch (ignore) {}
            }


            node.$highlight = function (emphasis) {
                var name = this.$name,
                    text = highlight(name, emphasis, true);
                if (text !== name) {
                    this.$isHighlighted = true;
                } else {
                    delete this.$isHighlighted;
                }
                return text;
            };


            node.$render = function (index, emphasis) {
                return model.$render(this.$data, index) || '';
            };

            node.$toggle = function () {
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
                node.$isRoot = (node.$parent === undefined);
                node.$name = node[nameProp];
                node.$children = node[childrenProp] || [];
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
                node.$isFolder = node.$children && node.$children.length > 0;
                if (node.$isFolder) { node.$isOpen = true; }
                if (dataProp) {
                    node.$data = evaluate(node, dataProp);
                }

            }(node));

            return node;
        };


    ngWidgets.directive('ngwTreeWalker', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            priority: 1000,
            terminal: true,
            transclude: 'element',
            scope: false,
            compile: function (tElement, tAttrs) {
                var nodeProp, modelProp, nameProp, childrenProp, oldClones,
                    expression = tAttrs.ngwTreeWalker,
                    match = expression.match(/([\w]+)\s+(in)\s+(([\w]+)(\.[\w]+)*)/);

                if (!match) {
                    throw 'invalid expression "' + expression + '"';
                }
                nodeProp = match[1];
                modelProp = match[3];
                nameProp = tAttrs.name || 'name';
                childrenProp = tAttrs.children || 'children';
                oldClones = [];

                // return postLink function
                return function (scope, iElement, iAttrs, controller, transcludeFn) {
                    scope.$watch(
                        function (scope) {
                            return scope[modelProp];
                        },
                        function (newModel) {
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

                                // (3) traverse the hierarchical model to pimp and transclude nodes
                                traverse(scope.model, childrenProp, function (node) {
                                    // pimp the node to enrich it with more properties
                                    pimp(scope.model, node, nameProp, childrenProp);

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
                        }
                    );
                };
            }
        };
    }]);



    ngWidgets.directive('ngwTreeTable', ['$parse', '$compile', function ($parse, $compile) {
        return {
            restrict: 'A',
            scope: {
                model: '=',
                highlight: '='
            },
            compile: function ngwTableTreeCompile(tElement, tAttrs) {
                var t, template, tBody,
                    nameProp = tAttrs.name || 'name',
                    headers = tAttrs.headers ? tAttrs.headers.split(',') : [],
                    childrenProp = tAttrs.children || 'children',
                    dataProp = tAttrs.data  || 'data',
                    rendererProp = tAttrs.renderer  || 'renderer';

                template =
                    '<table class="table table-tree"><thead>';

                if (headers.length > 0) {
                    template += '<th>' + nameProp + '</th>';
                    for (t = 0; t < headers.length; t = t + 1) {
                        template += '<th>' + headers[t] + '</th>';
                    }
                }

                template +=
                    '</thead><tbody></tbody></table>';

                tElement.html(template);

                // hold the tBody reference in this closure to avoid
                // calling find(), which traverses the DOM, repeatedly
                tBody = tElement.find('tbody');

                // return the postLink function where
                // the model will be watched for changes and
                // the tBody updated accordingly and
                // children scopes created (and destroyed)
                return function ngwTreeTablePostLink(scope) {
                    var i, oldScopes = [], iRowTemplate =
                        '  <tr>' +
                        '    <td ng-class="\'level\'+node.$level">' +
                        '      <div class="branch">' +
                        '        <icon ng-click="node.$toggle()" ng-class="{\'icon-leaf\': !node.$isFolder, \'icon-folder-close\': node.$isFolder && !node.$isOpen, \'icon-folder-open\': node.$isFolder && node.$isOpen}"></icon>' +
                        '        <span ng-click="node.$select()" class="clickable" ng-bind-html="node.$highlight(highlight)"></span>' +
                        '      </div>' +
                        '    </td>';
                    for (i = 0; i < headers.length; i = i + 1) {
                        iRowTemplate +=
                            '  <td>' +
                            '    <span ng-bind-html="node.$render(' + i + ')"></span>' +
                            '  </td>';
                    }
                    iRowTemplate +=
                        '</tr>';

                    scope.$watch(
                        function (scope) {
                            return scope.model;
                        },
                        function (newModel, oldVal) {
                            if (newModel) {
                                // dispose the oldScopes
                                while (oldScopes.length > 0) {
                                    oldScopes.pop().$destroy();
                                }
                                // remove the tRows
                                tBody.html('');

                                traverse(newModel, childrenProp, function visit(node) {
                                    var iRowElement = angular.element(iRowTemplate),
                                        iRowLink = $compile(iRowElement),
                                        newScope = scope.$new();

                                    // enrich both the model and the current node
                                    // with additional properties (for example: $isFolder, $level, etc.)
                                    pimp(newModel, node, nameProp, childrenProp, dataProp, rendererProp);
                                    newScope.node = node;

                                    // watch for some node properties change
                                    newScope.$watch('node.$isVisible()', function (visible) {
                                        if (!visible) { iRowElement.addClass('hidden'); } else { iRowElement.removeClass('hidden'); }
                                    });
                                    newScope.$watch('node.$isSelected', function (selected) {
                                        if (selected) { iRowElement.addClass('selected'); } else { iRowElement.removeClass('selected'); }
                                    });

                                    // store the newly created scope for later disposal
                                    // (this will prevent memory leaks)
                                    oldScopes.push(newScope);

                                    tBody.append(iRowLink(newScope));
                                });
                            }
                        }
                    );
                };
            }
        };
    }]);


    /*ngWidgets.directive('ngwTree', function ($compile) {
        return {
            restrict: 'A',
            scope: {
                model: '=',
                name: '@',
                children: '@',
                // TODO hideHeaders: '@',
                // TODO maxDepth: '@',
                highlight: '='
            },
            link: function (scope, element, attrs) {
                var template = '<div ngw:tree-table model="model" name="' + scope.name + '" children="' + scope.children + '" highlight="highlight"></div>';
                element.html('').append(template);
                $compile(template)(scope);
            }
        };
    });*/


    ngWidgets.directive('ngwTreeMap', function () {
        return {
            restrict: 'A',
            scope: {
                children: '='
            },
            link: function (scope, element, attrs) {
                var treemap, svg, margin, width, height, grandparent;

                width = d3.select(element[0]).node().offsetWidth;
                height = 500; // d3.select(element[0]).node().offsetHeight;

                // see http://bl.ocks.org/mbostock/3019563
                margin = {top: 20, right: 0, bottom: 0, left: 0};
                width = width - margin.left - margin.right;
                height = height - margin.top - margin.bottom;

                svg = d3.select(element[0]).append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.top + margin.bottom)
                    .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                    .style('shape-rendering', 'crispEdges');

                treemap = d3.layout.treemap()
                    .children(function (d, depth) { return depth ? null : d.natus; })
                    .sort(function (a, b) { return a.value - b.value; })
                    .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
                    .round(false);

                grandparent = svg.append('g')
                    .attr('class', 'grandparent');

                grandparent.append('rect')
                    .attr('y', -margin.top)
                    .attr('width', width)
                    .attr('height', margin.top);

                grandparent.append('text')
                    .attr('x', 6)
                    .attr('y', 4 - margin.top)
                    .attr('dy', '.75em');

                scope.$watch('children', function (newChildren) {
                    if (newChildren) {
                        return scope.render(newChildren);
                    }
                });

                scope.render = function (root) {
                    // remove all previous items before render
                    svg.select('.depth').remove();

                    // initialize
                    root.x = root.y = 0;
                    root.dx = width;
                    root.dy = height;
                    root.depth = 0;

                    // Aggregate the values for internal nodes. This is normally done by the
                    // treemap layout, but not here because of our custom implementation.
                    // We also take a snapshot of the original children (natus) to avoid
                    // the children being overwritten when when layout is computed.
                    function accumulate(d) {
                        var result, init;
                        d.natus = d.children;
                        if (d.children) {
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

                    function path(d) {
                        return d.parent
                            ? path(d.parent) + ' > ' + d.name
                            : d.name;
                    }


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

                        g1 = svg.insert('g', '.grandparent')
                            .datum(d)
                            .attr('class', 'depth');

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
                            svg.style("shape-rendering", null);

                            // Draw child nodes on top of parent nodes.
                            svg.selectAll(".depth").sort(function (a, b) { return a.depth - b.depth; });

                            // Fade-in entering text.
                            g2.selectAll("text").style("fill-opacity", 0);

                            // Transition to the new view.
                            t1.selectAll("text").call(text).style("fill-opacity", 0);
                            t2.selectAll("text").call(text).style("fill-opacity", 1);
                            t1.selectAll("rect").call(rect);
                            t2.selectAll("rect").call(rect);

                            // Remove the old node when the transition is finished.
                            t1.remove().each("end", function () {
                                svg.style("shape-rendering", "crispEdges");
                                transitioning = false;
                            });
                        };

                        grandparent
                            .datum(d.parent)
                            .on('click', transition)
                            .select('text')
                            .text(path(d));

                        g = g1.selectAll('g')
                            .data(d.natus)
                            .enter().append('g');

                        // Add class 'children' and on click event handler
                        // to those cells which have children
                        g.filter(function (d) { return d.natus; })
                            .classed('children', true)
                            .on('click', transition);

                        // Append an SVG rect for each child
                        g.selectAll('.child')
                            .data(function (d) {
                                return d.natus || [d];
                            })
                            .enter().append('rect')
                            .attr('class', 'child')
                            .call(rect);

                        g.append('rect')
                            .attr('class', 'parent')
                            .call(rect);
                        //.append('title')
                        //.text(function (d) { return d.value; });

                        // Finally append parent name
                        g.append('text')
                            .attr('dy', '.75em')
                            .text(function (d) { return d.name; })
                            .call(text);

                        return g;
                    }

                    display(root);
                };
            }
        };
    });
}());
