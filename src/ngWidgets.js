(function (angular) {
    'use strict';

    var ngWidgets = angular.module('ngWidgets', []),

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

        pimp = function (model, node, childrenProp, dataProp) {
            model.$collapse = function () {
                traverse(model, childrenProp, function (node) {
                    delete node.$isOpen;
                });
            };

            model.$expand = function () {
                traverse(model, childrenProp, function (node) {
                    if (node.$isFolder) {
                        node.$isOpen = true;
                    }
                });
            };

            node.$label = function (emphasis) {
                if (node.hasOwnProperty(dataProp)) {
                    var data = this[dataProp], text;
                    if (angular.isArray(data)) {
                        data = data[0];
                    }
                    text = data; // TODO render(data);
                    text = highlight(text, emphasis, true);
                    if (text !== data) {
                        this.$isHighlighted = true;
                    } else {
                        delete this.$isHighlighted;
                    }
                    return text;
                }
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
                node.$children = node[childrenProp] || [];
                // DO NOT node.$label = node[dataProp];
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

            }(node));

            return node;
        };


    ngWidgets.directive('ngwRepeat', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            priority: 1000,
            terminal: true,
            transclude: 'element',
            scope: false,
            compile: function (tElement, tAttrs) {
                var nodeProp, modelProp, dataProp, childrenProp, clones,
                    expression = tAttrs.ngwRepeat,
                    match = expression.match(/([\w]+)\s+(in)\s+(([\w]+)(\.[\w]+)*)/);

                if (!match) {
                    throw 'invalid expression "' + expression + '"';
                }
                nodeProp = match[1];
                modelProp = match[3];
                dataProp = tAttrs.data || 'data';
                childrenProp = tAttrs.children || 'children';
                clones = [];

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
                                while (clones.length > 0) {
                                    clone = clones.pop();
                                    clone.scope().$destroy();
                                    clone.remove();
                                }

                                // (3) traverse the hierarchical model to pimp and transclude nodes
                                traverse(scope.model, childrenProp, function (node) {
                                    // pimp the node to enrich it with more properties
                                    pimp(scope.model, node, childrenProp, dataProp);

                                    // link the transcluded content to the right scope
                                    transcludeFn(function ngwRepeatTranscludeLink(clone, scope) {

                                        // save the clone element for later disposal
                                        clones.push(clone);

                                        // put current node in cloned scope
                                        scope[nodeProp] = node;

                                        // watch for some of their properties
                                        scope.$watch(nodeProp + '.$isVisible()', function (visible) {
                                            if (!visible) { clone.addClass('hidden'); } else { clone.removeClass('hidden'); }
                                        });

                                        scope.$watch(nodeProp + '.$isSelected', function (selected) {
                                            if (selected) { clone.addClass('selected'); } else { clone.removeClass('selected'); }
                                        });

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




    ngWidgets.directive('ngwTableTree', ['$compile', function ($compile) {
        return {
            restrict: 'EA',
            scope: {
                model: '=',
                children: '@',
                headersProp: '@headers',
                data: '@',
                highlight: '='
            },
            link: function (scope, iElement, iAttrs, controller, transcludeFn) {
                if (!scope.model) {
                    throw 'model not bound';
                }
                if (scope.children === undefined) {
                    scope.children = 'children';
                }
                if (scope.headersProp === undefined) {
                    scope.headersProp = 'headers';
                }
                if (scope.data === undefined) {
                    scope.data = 'data';
                }
                scope.headers = scope.$eval('model.' + scope.headersProp) || [];

                var k,
                    template = '<table class="table table-tree"><thead>';

                for (k = 0; k < scope.headers.length; k = k + 1) {
                    template += '<th>' + scope.headers[k] + '</th>';
                }

                template +=
                    '</thead><tbody>';
                template +=
                    '  <tr ngw:repeat="node in model" children="' + scope.children + '" data="' + scope.data + '">' +
                    '    <td ng-class="\'level\'+node.$level">' +
                    '      <div class="branch">' +
                    '        <icon ng-click="node.$toggle()" ng-class="{\'icon-leaf\': !node.$isFolder, \'icon-folder-close\': node.$isFolder && !node.$isOpen, \'icon-folder-open\': node.$isFolder && node.$isOpen}"></icon>' +
                    '        <span ng-click="node.$select()" class="clickable" ng-bind-html="node.$label(highlight)"></span>' +
                    '      </div>' +
                    '    </td>';
                for (k = 1; k < scope.headers.length; k = k + 1) {
                    template +=
                        '  <td>' +
                        '    <span>{{node.' + scope.data + '[' + k + ']}}</span>' +
                        '  </td>';
                }
                template +=
                    '</tr></tbody></table>';

                iElement.html('').append($compile(template)(scope));
            }
        };
    }]);



    ngWidgets.directive('ngwTree', function () {
        return {
            restrict: 'EA',
            scope: {
                model: '=',
                children: '@',
                data: '@',
                highlight: '='
            },
            template: '<ngw:table-tree model="model" children="{{children}}" data="{{data}}" highlight="highlight"></ngw:table-tree>'
        };
    });

}(angular));
