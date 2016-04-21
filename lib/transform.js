var _ = require('lodash');
var acorn = require('acorn-jsx');
var falafel = require('falafel');

var defaultOptions = {
  ecmaVersion: 6,
  ignoreTryCatch: false,
  parser: acorn,
  plugins: { jsx: true },
  ranges: true
};

var jestFunctions = ['dontMock', 'genMockFromModule', 'mock', 'setMock', 'unmock'];
var requireFunctions = ['requireActual', 'requireMock', 'resolve'];

function parentsOf(node) {
  var arr = [];
  for (var p = node.parent; p; p = p.parent) {
    arr.push(p);
  }
  return arr;
}

function callExpressionsOf(node) {
  var arr = [];
  for (; _.get(node, 'type') === 'CallExpression'; node = _.get(node, 'callee.object')) {
    arr.push(node);
  }
  return arr;
}

function inTryCatch(node) {
  return parentsOf(node).some(function(parent) {
    return parent.type === 'TryStatement' || parent.type === 'CatchClause';
  });
}

function isJestStatement(node) {
  var callExprs = callExpressionsOf(node);

  return node.type === 'CallExpression' &&
    node.arguments &&
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    _.contains(jestFunctions, node.callee.property.name) &&
    callExprs.some(function(expr) {
      return expr.callee.object.type === 'Identifier' &&
             expr.callee.object.name === 'jest';
    });
}

function isRequireStatement(node) {
  return node.type === 'CallExpression' &&
    node.arguments &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require';
}

function isRequireExtensionStatement(node) {
  return node.type === 'CallExpression' &&
    node.arguments &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.name === 'require' &&
    node.callee.object.type === 'Identifier' &&
    _.contains(requireFunctions, node.callee.property.name) &&
    node.callee.property.type === 'Identifier';
}

function replaceFirstArg(node, update) {
  var firstArg = node.arguments[0];
  var firstArgSource = firstArg.source();
  var parts = [
    firstArgSource.substring(0, 1),
    update,
    firstArgSource.substring(firstArgSource.length - 1)
  ];
  var newValue = parts.join('');
  firstArg.update(newValue);
}

function processCallExpression(node, transformFn) {
  var firstArg = node.arguments[0];
  var newValue = transformFn(firstArg.value);
  if (newValue && typeof newValue === 'string') {
    replaceFirstArg(node, newValue);
  }
}

module.exports = function(src, options, transformFn) {
  if (typeof options === 'function') {
    transformFn = options;
    options = _.assign({}, defaultOptions);
  } else {
    options = _.assign({}, defaultOptions, options);
  }

  var ignoreTryCatch = options.ignoreTryCatch;
  delete options.ignoreTryCatch;

  return falafel(src, options, function(node) {
    if (isRequireStatement(node) ||
        isRequireExtensionStatement(node) ||
        isJestStatement(node)) {
      if (!(ignoreTryCatch && inTryCatch(node))) {
        processCallExpression(node, transformFn);
      }
    }
  }).toString();
};
