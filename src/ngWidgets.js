(function (angular) {
    'use strict';

    var ngWidgets = angular.module('ngWidgets', []),
        traverse = function (model, childrenProp, visitFn) {
            var nodes = model[childrenProp],
                stack = [],
                node,
                children,
                child,
                k = 0;
            if (nodes) {
                stack.push(nodes[0]);
                while (stack.length > 0) {
                    node = stack.pop();
                    visitFn(node);
                    children = node[childrenProp];
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
        },
        pimp = function (model, node, childrenProp, labelProp) {
            model.$collapse = function () {
                traverse(model, childrenProp, function (n) {
                    n.$isOpen = false;
                });
            };

            model.$expand = function () {
                traverse(model, childrenProp, function (n) {
                    n.$isOpen = true;
                });
            };

            node.$isLeaf = function () {
                return !this.$isFolder;
            };

            node.$isFolderOpen = function () {
                return this.$isFolder && this.$isOpen;
            };

            node.$isFolderClose = function () {
                return this.$isFolder && !this.$isOpen;
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
                angular.forEach(this.$path.slice(0, -1), function (p) {
                    boolean = boolean && p.$isFolderOpen();
                });
                return boolean;
            };

            node.$select = function () {
                if (model.$selected) {
                    delete model.$selected.$isSelected;
                }
                node.$isSelected = true;
                model.$selected = node;
            };

            (function (node) {
                node.$isRoot = (node.$parent === undefined);
                node.$children = node[childrenProp] || [];
                node.$label = node[labelProp] || '?';
                var level = 0,
                    path = [node],
                    n = node;
                while (n.$parent) {
                    level += 1;
                    n = n.$parent;
                    path.push(n);
                }
                node.$path = path.reverse();
                node.$level = level;
                node.$isFolder = node.$children.length > 0;
                if (node.$isFolder) { node.$isOpen = true; }

            }(node));

            return node;
        };


    ngWidgets.directive('ngwRepeat', ['$compile', function ngwRepeatFactory($compile) {
        var ngwRepeatDefinition = {
            restrict: 'A',
            priority: 1000,
            terminal: true,
            transclude: 'element',
            compile: function ngwRepeatCompile(tElement, tAttrs) {
                var expression = tAttrs.ngwRepeat,
                    match = expression.match(/([\w]+)\s+(in)\s+(([\w]+)(\.[\w]+)*)/),
                    nodeProp = match[1],
                    modelProp = match[3],
                    labelProp = tAttrs.label || 'label',
                    childrenProp = tAttrs.children || 'children',
                    clones = [];

                if (!match) {
                    throw 'invalid expression "' + expression + '"';
                }

                return function ngwRepeatPostLink(scope, iElement, iAttrs, controller, transcludeFn) {

                    var pimpAndTransclude = function (node) {
                        // pimp the node to enrich it with more properties
                        pimp(scope[modelProp], node, childrenProp, labelProp);

                        // link the transcluded content to the right scope
                        transcludeFn(function ngwRepeatTranscludeLink(clone, scope) {
                            // save clone for later disposal
                            clones.push(clone);
                            // put node in scope
                            scope[nodeProp] = node;
                            // watch for some of their properties
                            scope.$watch('node.$isVisible()', function (visible) {
                                if (!visible) { clone.addClass('hidden'); } else { clone.removeClass('hidden'); }
                            });
                            scope.$watch('node.$isSelected', function (selected) {
                                if (selected) { clone.addClass('selected'); } else { clone.removeClass('selected'); }
                            });
                            // finally append it to the DOM
                            iElement.parent().append(clone);
                        });
                    };

                    scope.$watch(modelProp + '.' + childrenProp, function ngwRepeatAction(newNodes) {
                        if (newNodes) {
                            // (1) dispose previous transcluded clones and their scopes
                            var clone;
                            while (clones.length > 0) {
                                clone = clones.pop();
                                clone.scope().$destroy();
                                clone.remove();
                            }
                            // (2) traverse the hierarchical model to pimp and transclude nodes
                            traverse(scope[modelProp], childrenProp, pimpAndTransclude);
                        }
                    });
                };
            }
        };
        return ngwRepeatDefinition;
    }]);




    ngWidgets.directive('ngwTableTree', ['$compile', function ($compile) {
        var ngwTableTreeDefinition = {
            restrict: 'EA',
            scope: false,
            compile: function ngwTableTreeCompile(tElement, tAttrs, transcludeFn) {

                return function ngwTableTreePostLink(scope, iElement, iAttrs, controller, transcludeFn) {
                    if (iAttrs.model) {
                        scope.modelProp = iAttrs.model;
                    } else {
                        throw 'model attribute is missing';
                    }
                    scope.childrenProp = iAttrs.children || 'children';
                    scope.labelProp = iAttrs.label || 'label';
                    scope.headersProp = iAttrs.headers || 'headers';
                    scope.headers = scope.$eval(scope.modelProp + '.' + scope.headersProp) || [];
                    scope.dataProp = iAttrs.data || 'data';
                    scope.diffProp = iAttrs.diff || 'diff';

                    var template =
                        '<table class="table table-tree">' +
                        '<thead>' +
                        '  <th>' + scope.labelProp + '</th>';

                    angular.forEach(scope.headers, function (header) {
                        template +=
                            '  <th>' + header + '</th>';
                    });

                    template +=
                        '</thead>' +
                        '<tbody>';

                    template +=
                        '  <tr ngw:repeat="node in ' + scope.modelProp + '" children="' + scope.childrenProp + '">' +
                        '    <td ng-class="\'level\'+node.$level">' +
                        '      <div class="branch">' +
                        '        <icon ng-click="node.$toggle()" ng-class="{\'icon-leaf\': node.$isLeaf(), \'icon-folder-close\': node.$isFolderClose(), \'icon-folder-open\': node.$isFolderOpen()}"></icon>' +
                        '        <span ng-click="node.$select()" class="clickable">{{node.' + scope.labelProp + '}}</span>' +
                        '      </div>' +
                        '    </td>';

                    angular.forEach(scope.headers, function (header, index) {
                        template +=
                            '  <td>' +
                            '    <span>{{node.' + scope.dataProp + '[' + index + ']}}</span>' +
                            '  </td>';
                    });

                    template +=
                        '  </tr>' +
                        '</tbody>' +
                        '</table>';

                    iElement.html('').append($compile(template)(scope));
                };
            }
        };
        return ngwTableTreeDefinition;
    }]);




    ngWidgets.directive('ngwTree', ['$compile', function ($compile) {
        var ngwTreeDefinition = {
            restrict: 'EA',
            scope: {
                model: '=',
                childrenProp: '@children',
                labelProp: '@label',
                parent: '=',
                recursee: '='
            },
            compile: function ngwTableTreeCompile(tElement, tAttrs, transcludeFn) {

                return function ngwTableTreePostLink(scope, iElement, iAttrs, controller, transcludeFn) {
                    scope.$watch(function (scope) { return scope.model; }, function ngwRepeatAction(newNodes, oldNodes) {

                        if (newNodes) {
                            if (scope.recursee) {
                                scope.nodes = scope.recursee;
                            } else {
                                // linking root node
                                scope.nodes = scope.model[scope.childrenProp];
                            }

                            angular.forEach(scope.nodes, function (node) {
                                node.$parent = scope.parent;
                                pimp(scope.model, node, scope.childrenProp, scope.labelProp);
                            });

                            var template =
                                '<ul class="tree">' +
                                '  <li ng-repeat="node in nodes" class="branch">' +
                                    //'  <span>' +
                                '      <icon ng-click="node.$toggle()" ng-class="{\'icon-leaf\': node.$isLeaf(), \'icon-folder-close\': node.$isFolderClose(), \'icon-folder-open\': node.$isFolderOpen()}"></icon>' +
                                '      <span ng-click="node.$select()" class="clickable" ng-class="{selected: node.$isSelected}">{{node.' + scope.labelProp + '}}</span>' +
                                    //'  </span>' +
                                '    <div ng-if="node.$isFolder" ngw:tree model="model" parent="node" recursee="node.$children" label="' + scope.labelProp + '" children="' + scope.childrenProp + '" ng-show="node.$isOpen"></div>' +
                                '  </li>' +
                                '</ul>';

                            if (scope.nodes) {
                                // render template
                                iElement.html('').append($compile(template)(scope));
                            }
                            // else
                            //    stop recursion
                        }
                    });
                };
            }
        };
        return ngwTreeDefinition;
    }]);

}(angular));