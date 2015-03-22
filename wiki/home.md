ngWidgets is a collection of reusable UI widgets for AngularJS developers. It comes with a Javascript and a CSS stylesheet you'll have to load in your application:

```html
<html ng-app="myApp">
    <head>
        <!-- link to fontawesome.css -->
        <link rel="stylesheet" href="ngWidgets.min.css" />
    </head>
    <body>
        <!-- load angular.js -->
        <script src="ngWidgets.min.js"></script>
    </body>
</html>
```

It depends on [FontAwesome](http://fortawesome.github.io/Font-Awesome/) and [AngularJS](https://angularjs.org/) and provides the following widgets:

* ngwTable
* ngwTree
* ngwTreeTable


## Hierarchical widgets
Hierarchical widgets are those widgets which display hierarchical data such as ngwTree and ngwTreeTable. They're all based on a special ngwTreeWalker directive which, as the [AngularJS ngRepeat directive](https://docs.angularjs.org/api/ng/directive/ngRepeat), instantiates a template once per item from a supplied model.

```html
<table>
    <tr ngw-repeat="node in model">
        <td>{{node.$render()}}</td>
    </tr>
</table>
```

ngwTreeWalker assumes that the supplied model represents hierachical data having a ``children`` property owned by each node as an array of children nodes. For example:

```javascript
$scope.model = {
    children: [
        {   data: 'A',
            children: [
                {   data: 'B' },
                {   data: 'C' }
]}]}
```

ngwTreeWalker traverses the whole hierarchy using a _depth-first_ traversal algorithm and, at each visit, it transcludes the element on which the directive itself is matched. The cloned element is linked to a new sibling scope which holds the current _"pimped"_ node (enriched with some additional properties as explained below).


ngwTreeWalker accepts the following attributes:

* ``children``  
  the property name of the children array (default is _"children"_)
* ``data``  
  the property name of the data being rendered by the ``$render()`` function when invoked on the _"pimped"_ node (default is _"data"_)
  

Following is an example with a model having property names in _"latin language"_ :

```html
<table>
    <tr ngw-repeat="nodus in lignum" children="natus" data="nomen">
        <td>{{nodus.$render()}}</td>
    </tr>
</table>
```

```javascript
$scope.lignum = {
    natus: [
        {   nomen: 'A',
            natus: [
                {   nomen: 'B' },
                {   nomen: 'C' }
]}]}
```


As side effects, ngwTreeWalker _"pimps"_ (enriches) the supplied model with additional properties. Pimped properties are all prefixed with ``$`` and they will be added on both:

* the model
  * ``$selected`` - the selected node
  * ``$expand()`` - turn all folder nodes open
  * ``$collapse()`` - turn all folder nodes close
  * ``$highlights `` - the array of highlighted nodes
  * ``$scrollTo(node)`` - scroll to the supplied node
* and the nodes
  * ``$level`` - the level of this node
  * ``$parent`` - the parent of this node.
  * ``$isRoot`` - true if this node is the root
  * ``$path`` - the array of ancestor nodes of this node
  * ``$isFolder`` - true if this node is a folder node
  * ``$isOpen`` -  true if this node is open
  * ``$isSelected`` - true if this node is selected
  * ``$isHighlighted`` - true if this node is highlighted
  * ``$toggle()`` - make this node open if it is currently close (and viceversa)
  * ``$select()`` - make this node selected (so that it will be returned as result of ``model.$selected``)
  

Following is a complete example:

```html
<label>model</label>
<button ng-click="lignum = lignum1">Lignum1</button>
<button ng-click="lignum = lignum2">Lignum2</button>
<button ng-click="lignum = lignum3">Lignum3</button>
<label>emphasis</label>
<input ng-model="lignum.emphasis" >
<p>Selected data is: {{lignum.$selected.$data[0]}}</p>
<table class="table table-tree">
  <tr>
    <th></th>
    <th></th>
    <th>$render()</th>
    <th>$parent</th>
    <th>$isRoot</th>
    <th>$level</th>
    <th>$path</th>
    <th>$isFolder</th>
    <th>$isOpen</th>
    <th>$isSelected</th>
    <th>$isHighlighted</th>
  </tr>
  <tr ngw:tree-walker="nodus in lignum" children="natus" data="nomen">
    <th class="clickable"><span ng-show="nodus.$isFolder" ng-click="nodus.$toggle()">$toggle()</span></th>
    <th class="clickable" ng-click="nodus.$select()">$select()</th>
    <td ng-class="'level'+nodus.$level" ng-bind-html="nodus.$render(0, lignum.emphasis)"></td>
    <td>{{nodus.$parent.$data[0]}}</td>
    <td>{{nodus.$isRoot}}</td>
    <td>{{nodus.$level}}</td>
    <td><span ng-repeat="node in nodus.$path">/{{node.$data[0]}}</span></td>
    <td>{{nodus.$isFolder}}</td>
    <td>{{nodus.$isOpen}}</td>
    <td>{{nodus.$isSelected}}</td>
    <td>{{nodus.$isHighlighted}}</td>
  </tr>
</table>
<button ng-click="lignum.$expand()">lignum.$expand()</button>
<button ng-click="lignum.$collapse()">lignum.$collapse()</button>
```

> If you want to display hierarchical data DO NOT use the ngwTreeWalker directive. Rather, make use of either ngwTree or ngwTreeTable since they provide a good HTML structure and customizable CSS styles.


# ngwTable
TBD

# ngwTree
This directive will display a tree representation from a supplied data model.

```html
<ngw:tree model="model"></ngw:tree>
```

It assumes the provided model object represents hierachical data having 

* an optional ``children`` property as the array of _"level one"_ nodes,

and, recursively, on each of its nodes:

* an optional ``children`` property as the array child nodes further down the hierarchy,
* and an optional ``data`` property as the string text to be rendered.

 
For example:

```javascript
$scope.model = {
    children: [
        {   data: 'Arthur',
            children: [
                {   data: 'John' /*, no-children */ },
                {   /*no-data*/, children: [] }
]}]};
```

The directive expects the following attributes

* ``model``  
  (mandatory) The hirarchical data model.
* ``children``  
  (optional) The name of the children property (default is 'children').
* ``data``  
  (optional) The name of the data property (default is 'data')
* ``highlight``  
  (optional) A string bound in scope as the text fragment to display as highlighted

Here it follows a complete example:

```html
<input ng-model="bratus.emphasis">
<ngw:tree 
    model="bratus" 
    children="natus"
    data="nomen" 
    highlight="bratus.emphasis"></ngw:tree>
```

```javascript
$scope.bratus = {
    natus: [
        {   nomen: 'Arthur',
            natus: [
                {   nomen: 'John' },
                {   nomen: 'Paul', natus: [] }
]}]};                
```

# ngwTreeTable
This directive will display a table tree representation from a supplied data model. A table tree representation is a table having a browsable tree in its first column.

```html
<ngw:tree-table model="model"></ngw:tree-table>
```

It assumes the provided model object represents hierachical data having

* an optional ``headers`` property as the array of table header names,
* and an optional ``children`` property as the array of _"level one"_ nodes,

and, recursively, on each of its nodes:

* a ``data`` property as the array of values to be displayed in the table cells,
* and an optional ``children`` property as the array child nodes further down the hierarchy,
* and an optional ``data`` property as the array of values be displayed.

 
For example:

```javascript
$scope.model = {
    headers: ['name', 'surname', 'dob'],
    children: [
        {   data: ['Arthur', 'Doyle', '2014-12-31'],
            children: [
                {   data: ['John', 'Brown', '1970-01-01'] },
                {   data: ['Paolo', 'Angioletti', null], children: []}
]}]}
```

> NOTE: since this widget displays as a table having a tree in its first column then the first value of the data arrays will be used as the string text rendered on the tree nodes.






