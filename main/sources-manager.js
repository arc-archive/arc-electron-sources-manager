const {ipcMain: ipc, app} = require('electron');
const path = require('path');
const log = require('electron-log');
const {ThemeInfo} = require('./theme-info');
/**
 * This is main process interface.
 *
 * Manages themes state for ARC application. It tells the application where
 * the application sources are.
 *
 * For most cases ARC uses the default web components path which is located
 * in application config directory (this is different depending on the OS).
 * This class tells the main application where the sources
 * are and which theme to load.
 */
class SourcesManager {
  /**
   * @param {PreferencesManager} pm ARC preferences manager module instance
   * @param {Object} so Applicartion startup options. It supports the following
   * keys:
   * - themeFile (String) - Location of the theme file
   * - importFile (String) - Location of the imports file for web components
   * - appComponents (String) - Location to the directory where application
   * web components are located. This path must contain `bower_components`
   * directory.
   */
  constructor(pm, so) {
    this.prefsManager = pm;
    this.startupOptions = so || {};
    /**
     * Base path to the themes folder.
     * @type {String}
     */
    this.themesBasePath = path.join(app.getPath('userData'), 'themes');
    /**
     * A base path to the application sources components.
     * @type {String}
     */
    this.sourcesBasePath = 'components';
    /**
     * Location of the installed themes info file.
     * @type {String}
     */
    this.infoFilePath = path.join(this.themesBasePath, 'themes-info.json');
    /**
     * ARC default theme ID
     * @type {String}
     */
    this.defaultTheme = 'advanced-rest-client/arc-electron-default-theme';
    /**
     * Name of the default application import file.
     * @type {String}
     */
    this.importFileName = 'import.html';
    /**
     * Name of application search page import file.
     * @type {String}
     */
    this.searchFileName = 'import-search-bar.html';
    /**
     * Instance of ThemeInfo class.
     * @type {ThemeInfo}
     */
    this.themeInfo = new ThemeInfo(this.infoFilePath);
    /**
     * Main module (ARC's) path location to generate absolute URL
     * @type {String}
     */
    this.root = path.dirname(require.main.filename);

    this._listThemesHandler = this._listThemesHandler.bind(this);
    this._themeInfoHandler = this._themeInfoHandler.bind(this);
    this._activateHandler = this._activateHandler.bind(this);
  }
  /**
   * Listens for the ipc events to suppot theme changes
   */
  listen() {
    ipc.on('theme-manager-list-themes', this._listThemesHandler);
    ipc.on('theme-manager-active-theme-info', this._themeInfoHandler);
    ipc.on('theme-manager-activate-theme', this._activateHandler);
  }
  /**
   * Removes event listeners
   */
  unlisten() {
    ipc.removeListener('theme-manager-list-themes', this._listThemesHandler);
    ipc.removeListener('theme-manager-active-theme-info', this._themeInfoHandler);
    ipc.removeListener('theme-manager-activate-theme', this._activateHandler);
  }
  /**
   * Resolves file path to correct path if it's starts with `~`.
   *
   * @param {String} file Settings file path
   * @return {String} Path to the file.
   */
  resolvePath(file) {
    if (file && file[0] === '~') {
      file = app.getPath('home') + file.substr(1);
    }
    return file;
  }
  /**
   * Returns application basic paths configuration.
   * @return {Object} Path to:
   * - appComponents - Where the web components are located
   * - importFile - Where main web components import file is located
   * - themeFile - A theme file to load.
   */
  getAppConfig() {
    return Promise.all([
      this.prefsManager.load(),
      this.themeInfo.load()
    ])
    .then((result) => this._getAppConfig(...result));
  }

  _getAppConfig(settings, themeInfo) {
    if (!themeInfo) {
      themeInfo = [];
    }
    if (!settings) {
      settings = {};
    }
    const so = this.startupOptions;
    const result = {
      appComponents: this._getAppComponentsLocation(settings, so),
      importDir: this._getImportDirLocation(settings),
      importFile: this._getImportFileLocation(settings, so),
      searchFile: this._getSearchFileLocation(settings, so),
      theme: settings.theme || this.defaultTheme
    };
    return result;
  }
  /**
   * Returns name for the main theme location.
   * @return {String} Path component to the theme main folder.
   */
  _getThemePathComponent() {
    return 'default';
  }
  /**
   * Reads application web components location.
   * Startup options are tested first for appComponents path.
   * Then it checks which theme is loaded and based on this information
   * it creates a path.
   * @param {Object} settings Current application settings.
   * @param {Object} so Startup options
   * @return {String} Path to application component.
   */
  _getAppComponentsLocation(settings, so) {
    if (so.appComponents) {
      return this.resolvePath(so.appComponents);
    }
    const theme = this._getThemePathComponent(settings);
    return path.join(this.sourcesBasePath, theme);
  }
  /**
   * Reads folder location with import files.
   * @param {Object} settings Current application settings.
   * @return {String}
   */
  _getImportDirLocation(settings) {
    const theme = this._getThemePathComponent(settings);
    return path.join(this.root, this.sourcesBasePath, theme);
  }
  /**
   * Reads web components import file location.
   * @param {Object} settings Current application settings.
   * @param {Object} so Startup options
   * @return {String} Path to web component import file
   */
  _getImportFileLocation(settings, so) {
    if (so.importFile) {
      return this.resolvePath(so.importFile);
    }
    const theme = this._getThemePathComponent(settings);
    return path.join(this.root, this.sourcesBasePath, theme, this.importFileName);
  }
  /**
   * Reads web components import file location for search window.
   * @param {Object} settings Current application settings.
   * @param {Object} so Startup options
   * @return {String} Path to web component import file for search window
   */
  _getSearchFileLocation(settings, so) {
    if (so.searchFile) {
      return this.resolvePath(so.searchFile);
    }
    const theme = this._getThemePathComponent(settings);
    return path.join(this.root, this.sourcesBasePath, theme, this.searchFileName);
  }

  _findThemeInfo(id, themes) {
    if (!themes || !themes.length) {
      return;
    }
    return themes.find((item) => item._id === id);
  }
  /**
   * A handler for the `theme-manager-list-themes` event from the renderer
   * process.
   * @param {Object} e
   * @param {String} id
   */
  _listThemesHandler(e, id) {
    this.themeInfo.load()
    .then((list) => {
      e.sender.send('theme-manager-themes-list', id, list);
    })
    .then((cause) => {
      if (cause instanceof Error) {
        cause = {
          message: cause.message
        };
      }
      e.sender.send('theme-manager-error', id, cause);
    });
  }
  /**
   * A handler for the `theme-manager-active-theme-info` event from the renderer
   * process.
   * @param {Object} e
   * @param {String} id
   */
  _themeInfoHandler(e, id) {
    Promise.all([
      this.prefsManager.load(),
      this.themeInfo.load()
    ])
    .then((result) => {
      const [settings, themes] = result;
      const id = settings.theme || this.defaultTheme;
      const theme = this._findThemeInfo(id, themes);
      e.sender.send('theme-manager-active-theme-info', id, theme);
    })
    .then((cause) => {
      if (cause instanceof Error) {
        cause = {
          message: cause.message
        };
      }
      e.sender.send('theme-manager-error', id, cause);
    });
  }
  /**
   * A handler for the `theme-manager-activate-theme` event from the renderer
   * process.
   * @param {Object} e
   * @param {String} id
   * @param {String} themeId
   */
  _activateHandler(e, id, themeId) {
    this.prefsManager.load()
    .then((settings) => {
      settings.theme = themeId;
      return this.prefsManager.store();
    })
    .then(() => this.getAppConfig())
    .then((config) => {
      e.sender.send('theme-manager-theme-activated', id, config);
    })
    .then((cause) => {
      if (cause instanceof Error) {
        cause = {
          message: cause.message
        };
      }
      e.sender.send('theme-manager-error', id, cause);
    });
  }
}

module.exports.SourcesManager = SourcesManager;
