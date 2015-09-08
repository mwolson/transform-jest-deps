# transform-deps

parses the ast and transforms require() calls.

```js
var transform = require('transform-deps');
var src = "require('x'); require('y');"
src = transform(src, function (name) {
	if (name == 'x') return 'z';
});
console.log(src);
```

outputs:

```
require('z'); require('y')
```

[options can be passed to falafel](https://github.com/substack/node-falafel#custom-parser) by using an object as the
second argument.  if this is done, pass the transform function as the `requireTransform` key to the options object.

```js
var acorn = require('acorn-jsx');
var transform = require('transform-deps');
var src = [
    "require('x');",
    "function Thing() {}",
    "var foo = <Thing/>;",
    "var arr1 = [1]; var arr2 = [...arr1, 2]",
    "require('y');"
].join("\n");
src = transform(src, {
    ecmaVersion: 6,
    parser: acorn,
    plugins: {jsx: true},
    requireTransform: function(name) {
        if (name == 'x') return 'z';
    }
});
console.log(src);
```

# api

## var s = transform(src, options, ignore_trycatch=false)

## var s = transform(src, cb, ignore_trycatch=false)

# license

mit
