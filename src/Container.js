import { Bellhop } from 'bellhop-iframe';
import { Features } from './Features';
import { BasePlugin } from './plugins';

//private/static variables
const PLUGINS = [];

/**
 * The application container
 * @class Container
 * @property {Bellhop} client Communication layer between the container and application
 * @property {Boolean} loaded Check to see if a application is loaded
 * @property {Boolean} loading Check to see if a application is loading
 * @property {Element} dom The DOM object for the iframe
 * @property {HTMLElement} main The current iframe object
 * @property {Object} release The current release data
 * @property {object} options Optional parameteres
 * @property {string} options.captionsButton selector for captions button
 * @property {string} options.helpButton selector for help button
 * @property {string} options.musicButton selector for music button
 * @property {string} options.pauseButton selector for pause button
 * @property {string} options.pauseFocusSelector The class to pause
 * @property {string} options.sfxButton selector for sounf effects button
 * @property {string} options.soundButton selector for captions button
 * @property {string} options.voButton selector for vo button
 * @static @property {Array} plugins The collection of Container plugins
 * @static @property {String} version The current version of the library
 *
 * @constructor
 * @param {string} iframeSelector selector for application iframe container
 * @param {object} options Optional parameteres
 * @param {string} options.helpButton selector for help button
 * @param {string} options.captionsButton selector for captions button
 * @param {string} options.soundButton selector for captions button
 * @param {string} options.voButton selector for vo button
 * @param {string} options.sfxButton selector for sounf effects button
 * @param {string} options.musicButton selector for music button
 * @param {string} options.pauseButton selector for pause button
 * @param {string} options.pauseFocusSelector The class to pause
 *        the application when focused on. This is useful for form elements which
 *        require focus and play better with Application's keepFocus option.
 */
export class Container {
  /**
   *Creates an instance of Container.
   * @param {*} iframeSelector
   * @param {*} options
   * @memberof Container
   */
  constructor(iframeSelector, options = {}) {
    this.main = document.querySelector(iframeSelector);

    if (null === this.main) {
      throw new Error('No iframe was found with the provided selector');
    }

    this.client = new Bellhop();
    this.dom = this.main;
    this.loaded = false;
    this.loading = false;
    this.options = options;
    this.release = null;
    //Plugin init
    this.plugins = PLUGINS.map(plugin => new plugin(this));
  }

  /**
   * Removes the Bellhop communication layer altogether.
   * @memberof Container
   */
  destroyClient() {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
  }

  /**
   * The game is starting to load
   * @memberof Container
   */
  onLoading() {
    this.client.trigger('opening');
  }

  /**
   * The game preload is progressing
   * @memberof Container
   */
  onProgress() {
    this.client.trigger('progress');
  }

  /**
   * Reset the mutes for audio and captions
   * @memberof Container
   */
  onLoadDone() {
    this.loading = false;
    this.loaded = true;
    this.main.classList.remove('loading');

    this.plugins.forEach(plugin => plugin.opened(this));

    /**
     * Event when the application gives the load done signal
     * @event opened
     */
    this.client.trigger('opened');
  }

  /**
   * The application ended and destroyed itself
   * @memberof Container
   */
  onEndGame() {
    this.reset();
  }
  /**
   * Handle the local errors
   * @method onLocalError
   * @private
   * @param  {Event} $event Bellhop event
   */
  onLocalError($event) {
    this.client.trigger($event.type);
  }

  /**
   * Reset all the buttons back to their original setting
   * and clear the iframe.
   * @memberof Container
   */
  reset() {
    const wasLoaded = this.loaded || this.loading;

    // Destroy in the reverse priority order
    if (wasLoaded) {
      this.plugins
        .slice()
        .reverse()
        .forEach(plugin => plugin.closed(this));
    }

    if (wasLoaded) {
      this.client.trigger('closed');
    }

    // Remove bellhop instance
    this.destroyClient();

    // Reset state
    this.loaded = false;
    this.loading = false;

    // Clear the iframe src location
    this.main.setAttribute('src', '');
    this.main.classList.remove('loading');
  }

  /**
   * Set up communication layer between site and application.
   * May be called from subclasses if they create/destroy Bellhop instances.
   * @memberof Container
   */
  initClient() {
    //Setup communication layer between site and application
    this.client = new Bellhop();
    this.client.connect(this.dom);

    //Handle bellhop events coming from the application
    this.client.on('loading', this.onLoading.bind(this));
    this.client.on('progress', this.onProgress.bind(this));
    this.client.on('loaded', this.onLoadDone.bind(this));
    this.client.on('endGame', this.onEndGame.bind(this));
    this.client.on('localError', this.onLocalError.bind(this));
  }

  /**
   * If there was an error when closing, reset the container
   * @memberof Container
   */
  _onCloseFailed() {
    this.reset(); // force close the app
  }

  /**
   * Open a application or path
   * @param {string} userPath The full path to the application to load
   * @param {Object} [userOptions] The open options
   * @param {Boolean} [userOptions.singlePlay=false] If we should play in single play mode
   * @param {Object | null} [userOptions.playOptions=null] The optional play options
   * @memberof Container
   */
  _internalOpen(userPath, { singlePlay = false, playOptions = null } = {}) {
    const options = { singlePlay, playOptions };
    this.reset();

    const err = Features.basic(); // TODO Features.basic()
    if (err) {
      return this.client.trigger('unsupported');
    }

    this.loading = true;

    this.initClient();

    this.plugins.forEach(plugin => plugin.open(this));

    let path = userPath;
    if (null !== options.playOptions) {
      const playOptionsQueryString =
        'playOptions=' +
        encodeURIComponent(JSON.stringify(options.playOptions));

      path =
        -1 === userPath.indexOf('?')
          ? `${userPath}?${playOptionsQueryString}`
          : `${userPath}&${playOptionsQueryString}`;
    }

    this.main.classList.add('loading');
    this.main.setAttribute('src', path);

    this.client.respond('singlePlay', options.singlePlay);
    this.client.respond('playOptions', options.playOptions);
    this.client.trigger('open');
  }

  /**
   *
   *
   * @param {*} path
   * @param {*} [options={}]
   * @param {*} [playOptions={}]
   * @memberof Container
   */
  openPath(path, options = {}, playOptions = {}) {
    // This should be deprecated, support for old function signature
    if ('boolean' === typeof options) {
      options = {
        singlePlay: false,
        playOptions: playOptions
      };
    }
    this._internalOpen(path, options);
  }

  /**
   * Destroy and don't use after this
   * @memberof Container
   */
  destroy() {
    this.reset();
    // Destroy in the reverse priority order
    this.plugins
      .slice()
      .reverse()
      .forEach(plugin => plugin.teardown(this));

    this.main = null;
    this.options = null;
    this.dom = null;
  }

  /**
   * Tell the application to start closing
   * @memberof Container
   */
  close() {
    if (this.loading || this.loaded) {
      this.plugins.forEach(plugin => plugin.close(this));
      this.client.trigger('close');
      // Start the close
      this.client.send('close');
    } else {
      this.reset();
    }
  }

  /**
   * The current version of SpringRollContainer
   * @readonly
   * @static
   * @memberof Container
   */
  static get version() {
    return 'CONTAINER_VERSION';
  }

  /**
   *
   *
   * @static
   * @param {object|function} plugin your plugin. This will be merged with a base plugin to make sure your plugin has certain functions
   * @memberof Container
   */
  static uses(plugin = BasePlugin) {
    //Merging with the base plugin to guarantee we will have certain functions
    const isConstructor = () =>
      !!plugin.prototype &&
      plugin.prototype.constructor &&
      /^class/.test(plugin.prototype.constructor);

    if ('function' !== typeof plugin && !isConstructor()) {
      return;
    }

    PLUGINS.push(plugin);
    PLUGINS.sort((a, b) => b.priority - a.priority);
  }

  /**
   *
   *
   * @readonly
   * @static
   * @memberof Container
   */
  static get plugins() {
    return PLUGINS;
  }

  /**
   *
   *
   * @static
   * @memberof Container
   */
  static clearPlugins() {
    PLUGINS.length = 0;
    return PLUGINS;
  }
}