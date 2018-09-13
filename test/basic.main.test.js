const assert = require('chai').assert;
const fs = require('fs-extra');
const {SourcesManager} = require('../main');
const {ArcPreferences} = require('@advanced-rest-client/arc-electron-preferences');

describe('SourcesManager basic tests- main process', function() {
  const prefsFile = './test-prefs.json';
  const prefs = new ArcPreferences({
    file: prefsFile
  });
  const themes = [{
    _id: 'dd1b715f-af00-4ee8-8b0c-2a262b3cf0c8',
    path: 'default',
    main: 'default.html'
  }, {
    _id: '859e0c71-ce8b-44df-843b-bca602c13d06',
    path: 'anypoint',
    main: 'anypoint.html'
  }];

  after(() => fs.remove(prefsFile));

  describe('resolvePath()', function() {
    let instance;
    before(() => {
      instance = new SourcesManager(prefs, {});
    });

    it('Reads home path', function() {
      const result = instance.resolvePath('~/test');
      assert.equal(result.indexOf('~/'), -1);
    });
  });

  describe('_getAppComponentsLocation()', function() {
    let instance;
    before(() => {
      instance = new SourcesManager(prefs, {});
    });

    it('Returns startup option', function() {
      const so = {
        appComponents: 'test-path'
      };
      const result = instance._getAppComponentsLocation({}, so);
      assert.equal(result, so.appComponents);
    });

    it('Returns anypoint path', function() {
      const so = {};
      const result = instance._getAppComponentsLocation({
        theme: instance.anypointTheme
      }, so);
      assert.equal(result, 'components/anypoint');
    });

    it('Returns default path', function() {
      const so = {};
      const result = instance._getAppComponentsLocation({}, so);
      assert.equal(result, 'components/default');
    });
  });

  describe('_getImportFileLocation()', function() {
    let instance;
    before(() => {
      instance = new SourcesManager(prefs, {});
    });

    it('Returns startup option', function() {
      const so = {
        importFile: 'test-path'
      };
      const result = instance._getImportFileLocation({}, so);
      assert.equal(result, so.themeFile);
    });

    it('Returns anypoint path', function() {
      const result = instance._getImportFileLocation({
        theme: instance.anypointTheme
      }, {});
      assert.equal(result, 'components/anypoint/import.html');
    });

    it('Returns default path', function() {
      const result = instance._getImportFileLocation({}, {});
      assert.equal(result, 'components/default/import.html');
    });
  });

  describe('_getThemeFileLocation()', function() {
    let instance;
    before(() => {
      instance = new SourcesManager(prefs, {});
    });

    it('Returns startup option', function() {
      const so = {
        themeFile: 'test-path'
      };
      const result = instance._getThemeFileLocation({}, so, themes);
      assert.equal(result, so.themeFile);
    });

    it('Returns anypoint path', function() {
      const result = instance._getThemeFileLocation({
        theme: instance.anypointTheme
      }, {}, themes);
      assert.equal(result, 'anypoint/anypoint.html');
    });

    it('Returns default path', function() {
      const result = instance._getThemeFileLocation({}, {}, themes);
      assert.equal(result, 'default/default.html');
    });
  });

  describe('_getSearchFileLocation()', function() {
    let instance;
    before(() => {
      instance = new SourcesManager(prefs, {});
    });

    it('Returns startup option', function() {
      const so = {
        searchFile: 'test-path'
      };
      const result = instance._getSearchFileLocation({}, so, themes);
      assert.equal(result, so.searchFile);
    });

    it('Returns anypoint path', function() {
      const result = instance._getSearchFileLocation({
        theme: instance.anypointTheme
      }, {}, themes);
      assert.equal(result, 'components/anypoint/import-search-bar.html');
    });

    it('Returns default path', function() {
      const result = instance._getSearchFileLocation({}, {}, themes);
      assert.equal(result, 'components/default/import-search-bar.html');
    });
  });

  describe('getAppConfig()', function() {
    it('Reads default config', function() {
      const instance = new SourcesManager(prefs, {});
      return instance.getAppConfig()
      .then((info) => {
        assert.equal(info.appComponents, 'components/default');
        assert.equal(info.importFile, 'components/default/import.html');
        assert.equal(info.searchFile, 'components/default/import-search-bar.html');
        assert.notEqual(info.themeFile.indexOf('default-theme'), -1);
      });
    });

    it('Reads anypoint config', function() {
      const instance = new SourcesManager(prefs, {});
      instance.themeInfo.load = function() {
        return Promise.resolve(themes);
      };
      instance.prefsManager.load = function() {
        return Promise.resolve({
          theme: instance.anypointTheme
        });
      };
      return instance.getAppConfig()
      .then((info) => {
        assert.equal(info.appComponents, 'components/anypoint');
        assert.equal(info.importFile, 'components/anypoint/import.html');
        assert.notEqual(info.themeFile.indexOf('anypoint/anypoint.html'), -1);
      });
    });
  });
});
