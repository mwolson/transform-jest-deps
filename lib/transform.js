var assign = require('lodash.assign');
var falafel = require('falafel');

function parents(node) {
  var parents = [];
  for (var p = node.parent; p; p = p.parent) {
    parents.push(p);
  }
  return parents;
}

var defaultOptions = {
  ignoreTryCatch: false,
  ranges: true
};

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
    if (node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' && node.arguments) {
      if (ignoreTryCatch) {
        var istrycatch = parents(node).some(function (s) {
          return s.type === 'TryStatement' || s.type === 'CatchClause';
        });
        if (istrycatch)
          return;
      }
      var arg0 = node.arguments[0];
      var value = src.substring(arg0.start + 1, arg0.end - 1);
      var update = fn(value);
      if (!update || typeof update !== 'string')
        return;
      var nodesrc = node.source();
      var parts = [
        nodesrc.substring(0, arg0.start - node.start + 1),
        update,
        nodesrc.substring(arg0.end - node.start - 1)
      ];
      node.update(parts.join(''));
    }
  }).toString();
};
