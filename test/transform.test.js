var _ = require('lodash');
var expect = require('./lib/expect');
var rewire = require('rewire');
var sinon = require('sinon');

describe('transform-jest-deps module', function() {
  var expected, falafel, mappings, src, transform;

  function replaceDep(dep) {
    return mappings[dep];
  }

  function verifyFalafel(options) {
    options = options ? _.clone(options) : {};
    _.assign(options, { ranges: true });
    if (options.hasOwnProperty('ignoreTryCatch')) {
      delete options.ignoreTryCatch;
    }

    expect(falafel).to.be.calledOnce;
    expect(falafel.args[0][0]).to.eq(src);
    expect(falafel.args[0][1]).to.eql(options);
    expect(falafel.args[0][2]).to.be.a('function');
  }

  beforeEach(function() {
    transform = rewire('../lib/transform');
    falafel = sinon.spy(transform.__get__('falafel'));
    transform.__set__('falafel', falafel);

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
      verifyFalafel();
      expect(res).to.eq(expected);
    });

    it('works with newer API', function() {
      var options = {};
      var res = transform(src, options, replaceDep);
      verifyFalafel(options);
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

  describe('in try/catch block', function() {
    beforeEach(function() {
      src = "try { require('a') } catch (e) { require('b'); } require('c');";
    });

    it('with ignore_trycatch option disabled, replaces all', function() {
      expected = "try { require('x') } catch (e) { require('x'); } require('x');";
      var options = {};

      var res = transform(src, options, function() { return 'x'; });
      verifyFalafel(options);
      expect(res).to.eq(expected);
    });

    it('with ignore_trycatch option enabled, replaces outside of the try/catch', function() {
      expected = "try { require('a') } catch (e) { require('b'); } require('x');";
      var options = { ignoreTryCatch: true };

      var res = transform(src, options, function() { return 'x'; });
      verifyFalafel(options);
      expect(res).to.eq(expected);
    });
  });

  describe('with ES6 features', function() {
    it('replaces deps', function() {
      src = [
        "var arr1 = ['val1'];",
        "var arr2 = [...arr1, 'val2'];",
        "var fs = require('fs');"
      ].join("\n");
      expected = [
        "var arr1 = ['val1'];",
        "var arr2 = [...arr1, 'val2'];",
        "var fs = require('fsx');"
      ].join("\n");
      var options = { ecmaVersion: 6 };

      var res = transform(src, options,  replaceDep);
      verifyFalafel(options);
      expect(res).to.eq(expected);
    });
  });

  describe('with jest statements that take a module', function() {
    it('replaces in simple statement', function() {
      src = "jest.dontMock('fs');";
      expected = "jest.dontMock('fsx');";
      var options = {};

      var res = transform(src, options,  replaceDep);
      verifyFalafel(options);
      expect(res).to.eq(expected);
    });

    it('replaces in compound statement', function() {
      src = "jest.dontMock('fs').dontMock('path').mock(\"util\");";
      expected = "jest.dontMock('fsx').dontMock('./path').mock(\"zxcqlw\");";
      var options = {};

      var res = transform(src, options,  replaceDep);
      verifyFalafel(options);
      expect(res).to.eq(expected);
    });

    it('replaces in genMockFromModule', function() {
      src = "jest.dontMock('fs').genMockFromModule('path');";
      expected = "jest.dontMock('fsx').genMockFromModule('./path');";
      var options = {};

      var res = transform(src, options,  replaceDep);
      verifyFalafel(options);
      expect(res).to.eq(expected);
    });

    it('replaces in setMock', function() {
      src = "jest.dontMock('fs').setMock('path', {});";
      expected = "jest.dontMock('fsx').setMock('./path', {});";
      var options = {};

      var res = transform(src, options,  replaceDep);
      verifyFalafel(options);
      expect(res).to.eq(expected);
    });

    it('replaces in require.requireActual', function() {
      src = "require.requireActual('fs');";
      expected = "require.requireActual('fsx');";
      var options = {};

      var res = transform(src, options,  replaceDep);
      verifyFalafel(options);
      expect(res).to.eq(expected);
    });
  });
});
