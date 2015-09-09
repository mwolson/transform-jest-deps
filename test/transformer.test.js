var expect = require('./lib/expect');
var transform = require('../lib/transform');

describe('transform-jest-deps module', function() {
  var expected, mappings, src;

  function replaceDep(dep) {
    return mappings[dep];
  }

  beforeEach(function() {
    mappings = {
      fs: 'fsx',
      path: './path',
      util: 'zxcqlw'
    };
    src = [
      "var x=5;",
      "function k() {require(\"util\");return 1;}",
      "var fs = require('fs');",
      "/* ehlo */",
      "require('path');",
      "var k = 3;"
    ].join("\n");
    expected = [
      "var x=5;",
      "function k() {require(\"zxcqlw\");return 1;}",
      "var fs = require('fsx');",
      "/* ehlo */",
      "require('./path');",
      "var k = 3;"
    ].join("\n");
  });

  describe('with valid mappings', function() {
    it('replaces deps', function() {
      var res = transform(src, replaceDep);
      expect(res).to.eq(expected);
    });

    it('works with newer API', function() {
      var res = transform(src, { requireTransform: replaceDep });
      expect(res).to.eq(expected);
    });
  });

  describe('with invalid mappings', function() {
    beforeEach(function() {
      mappings = {
        fs: null,
        path: undefined,
        util: function () {
          return;
        }
      };
    });

    it('ignores deps', function() {
      var res = transform(src, replaceDep);
      expect(res).to.eq(src);
    });
  });

  describe('in try/catch block with ignore_trycatch option enabled', function() {
    it('replaces outside of the try/catch', function() {
      src = "try { require('a') } catch (e) { require('b'); } require('c');";
      expected = "try { require('a') } catch (e) { require('b'); } require('x');";
      var res = transform(src, function() { return 'x'; }, true);
      expect(res).to.eq(expected);
    });
  });

  describe('with ES6 features', function() {
    it('replaces deps', function() {
      src = "var arr1 = ['val1'];\nvar arr2 = [...arr1, 'val2'];\nvar fs = require('fs');";
      expected = "var arr1 = ['val1'];\nvar arr2 = [...arr1, 'val2'];\nvar fs = require('fsx');";
      var res = transform(src, {
        ecmaVersion: 6,
        requireTransform: replaceDep
      });
      expect(res).to.eq(expected);
    });
  });
});
