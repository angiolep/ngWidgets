# ngWidgets
A collection of reusable UI widgets for AngularJS developers.

Most remarkable widgets are those displaying hierarchical data, such as table trees. For example:

```html
<ngw:table-tree model="model"></ngw:table-tree>
```

which assumes the following data model in scope:

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




## Usage

Have a look at [this repository wiki](https://github.com/angiolep/ngWidgets/wiki).

## Build
Tools required to build this project are:

* [NodeJS](https://nodejs.org/) as runtime environment for Javascript,
* and [NPM](https://www.npmjs.com/) as package manager for NodeJS.


Firstly download and install local packages via NPM:

```bash
> npm install
```

Then run [Grunt](http://gruntjs.com/) as the Javascript task runner:

```bash
> grunt
```

All source files will be compiled into the build directory and tests will run to generate a complete report.


