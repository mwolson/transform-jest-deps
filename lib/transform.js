var assign = require('lodash.assign');
var falafel = require('falafel');

var defaultOptions = {
  ignoreTryCatch: false,
  ranges: true
};

function parents(node) {
  var parents = [];
  for (var p = node.parent; p; p = p.parent) {
    parents.push(p);
  }
  return parents;
}

function inTryCatch(node) {
  return parents(node).some(function (s) {
    return s.type === 'TryStatement' || s.type === 'CatchClause';
  });
}

function isRequireStatement(node) {
  return node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments;
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

module.exports = function (src, options, fn) {
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
      if (ignoreTryCatch && inTryCatch(node)) {
        return;
      }
      var update = fn(getFirstArgValue(node));
      if (!update || typeof update !== 'string') {
        return;
      }
      replaceFirstArg(node, update);
    }
  }).toString();
};
