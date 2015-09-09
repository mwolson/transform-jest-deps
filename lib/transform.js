var assign = require('lodash.assign');
var falafel = require('falafel');

var defaultOptions = {
  ignoreTryCatch: false,
  ranges: true
};

function parents(node) {
  var arr = [];
  for (var p = node.parent; p; p = p.parent) {
    arr.push(p);
  }
  return arr;
}

function inTryCatch(node) {
  return parents(node).some(function(parent) {
    return parent.type === 'TryStatement' || parent.type === 'CatchClause';
  });
}

function isJestStatement(node) {
  return node.type === 'CallExpression' &&
    node.arguments &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'jest' &&
    node.callee.property.type === 'Identifier' &&
    ~['dontMock', 'mock'].indexOf(node.callee.property.name);
}

function isRequireStatement(node) {
  return node.type === 'CallExpression' &&
    node.arguments &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require';
}

function getFirstArgValue(node) {
  var firstArg = node.arguments[0];
  var value = node.source().substring(firstArg.start - node.start + 1, firstArg.end - node.start - 1);
  return value;
}

function replaceFirstArg(node, update) {
  var firstArg = node.arguments[0];
  var nodesrc = node.source();
  var parts = [
    nodesrc.substring(0, firstArg.start - node.start + 1),
    update,
    nodesrc.substring(firstArg.end - node.start - 1)
  ];
  var newValue = parts.join('');
  node.update(newValue);
}

function processRequireStatement(node, fn) {
  var newValue = fn(getFirstArgValue(node));
  if (newValue && typeof newValue === 'string') {
    replaceFirstArg(node, newValue);
  }
}

function processJestStatement(node, fn) {
  var newValue = fn(getFirstArgValue(node));
  if (newValue && typeof newValue === 'string') {
    replaceFirstArg(node, newValue);
  }
}

module.exports = function(src, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = assign({}, defaultOptions);
  } else {
    options = assign({}, defaultOptions, options);
  }

  var ignoreTryCatch = options.ignoreTryCatch;
  delete options.ignoreTryCatch;

  return falafel(src, options, function(node) {
    if (isRequireStatement(node)) {
      if (!(ignoreTryCatch && inTryCatch(node))) {
        processRequireStatement(node, fn);
      }
    } else if (isJestStatement(node)) {
      if (!(ignoreTryCatch && inTryCatch(node))) {
        processJestStatement(node, fn);
      }
    }
  }).toString();
};
