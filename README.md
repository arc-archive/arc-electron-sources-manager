# ARC Electron sources manager

Resolves paths to application source files and themes based on theme.

## Usage

```
$ npm i @advanced-rest-client/electron-drive
```

In the main process:

```javascript
const {SourcesManager} = require('@advanced-rest-client/arc-electron-sources-manager/main');
const {ArcPreferences} = require('@advanced-rest-client/arc-electron-preferences');
const startupOptions = {}; // Application start up options.
const prefs = new ArcPreferences();
const manager = new SourcesManager(prefs, startupOptions);
manager.listen();
```

To get paths configuration for the renderer window

```javascript
prefs.getAppConfig()
.then((config) => {
  console.log(config);
  // {
  //  "appComponents": "Location to app component main directory",
  //  "importFile": "Location of the app sources import file"
  //  "themeFile": "Location of theme definition"
  // }
});
```

## Renderer process

```javascript
const {ThemeManager} = require('@advanced-rest-client/arc-electron-sources-manager/renderer');
const mgr = new ThemeManager();
mgr.listen();
```

The manager gives access to:

-   `listThemes()` - lists all installed themes
-   `readActiveThemeInfo()` - reads activated theme info
-   `activate(themeId)` - Activates new theme
-   `loadTheme(themeLocation)` - Loads theme file and activates it.

It listens for the following web custom events:

-   `themes-list` - calls `listThemes()`, adds call result to `detail.result`
-   `theme-active-info` - calls `readActiveThemeInfo()`, adds call result to `detail.result`
-   `theme-activate` - calls `activate(event.detail.theme)`, adds call result to `detail.result`
