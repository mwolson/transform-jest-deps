# transform-jest-deps

Parse the AST, transforming paths in require() calls and other jest-specific calls.

[![NPM](https://nodei.co/npm/transform-jest-deps.png)](https://nodei.co/npm/transform-jest-deps/)

Based on [the transform-deps module](https://github.com/tetsuo/transform-deps).

## Install

```sh
npm install --save-dev transform-jest-deps
```

## Features

- Supports ES6 and JSX acorn plugins out-of-the-box.
- Other plugins can be enabled using [falafel options](https://github.com/substack/node-falafel#custom-parser).

## Examples

```js
var transform = require('transform-jest-deps');
var src = "require('x'); require('y');"
src = transform(src, function(name) {
  if (name == 'x') return 'z';
});
console.log(src);
```

outputs:

```
require('z'); require('y')
```

[Options can be passed to falafel](https://github.com/substack/node-falafel#custom-parser) by using an object as the
second argument.  if this is done, pass the transform function as the 3rd argument.

```js
var acorn = require('acorn-jsx');
var transform = require('transform-jest-deps');
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
  plugins: {jsx: true}
}, function(name) {
  if (name == 'x') return 'z';
});
```

## License

MIT
