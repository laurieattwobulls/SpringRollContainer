/**
 * @module Container
 * @namespace springroll
 */
(function()
{
	var SavedData = include('springroll.SavedData');

	/**
	 * @class Container
	 */
	var plugin = new springroll.ContainerPlugin(70);

	/**
	 * The name of the saved property for the captions styles
	 * @property {string} CAPTIONS_STYLES
	 * @static
	 * @private
	 * @final
	 */
	var CAPTIONS_STYLES = 'captionsStyles';

	/**
	 * The map of the default caption style settings
	 * @property {object} DEFAULT_CAPTIONS_STYLES
	 * @static
	 * @private
	 * @final
	 */
	var DEFAULT_CAPTIONS_STYLES = {
		size: 'md',
		background: 'black-semi',
		color: 'white',
		edge: 'none',
		font: 'arial',
		align: 'top'
	};

	/**
	 * The name of the saved property if the captions are muted or not
	 * @property {string} CAPTIONS_MUTED
	 * @static
	 * @private
	 * @final
	 */
	var CAPTIONS_MUTED = 'captionsMuted';

	plugin.setup = function()
	{
		/**
		 * The collection of captions styles
		 * @property {string} _captionsStyles
		 * @private
		 */
		this._captionsStyles = Object.merge(
			{},
			DEFAULT_CAPTIONS_STYLES,
			SavedData.read(CAPTIONS_STYLES) ||
			{}
		);

		/**
		 * Reference to the captions button
		 * @property {HTMLElement} captionsButton
		 */
		this.captionsButton = document.querySelector(this.options.captionsButton);

		if (null === this.captionsButton)
		{
			return;
		}

		this.captionsButtonClick = function()
		{
			this.captionsMuted = !this.captionsMuted;
		}.bind(this);

		this.captionsButton.addEventListener('click', this.captionsButtonClick);

		/**
		 * Set the captions are enabled or not
		 * @property {boolean} captionsMuted
		 * @default true
		 */
		Object.defineProperty(this, CAPTIONS_MUTED,
		{
			set: function(muted)
			{
				this._captionsMuted = muted;
				this._setMuteProp(CAPTIONS_MUTED, this.captionsButton, muted);
			},
			get: function()
			{
				return this._captionsMuted;
			}
		});

		/**
		 * Set the captions styles
		 * @method setCaptionsStyles
		 * @param {object|String} [styles] The style options or the name of the
		 * property (e.g., "color", "edge", "font", "background", "size")
		 * @param {string} [styles.color='white'] The text color, the default is white
		 * @param {string} [styles.edge='none'] The edge style, default is none
		 * @param {string} [styles.font='arial'] The font style, default is arial
		 * @param {string} [styles.background='black-semi'] The background style, black semi-transparent
		 * @param {string} [styles.size='md'] The font style default is medium
		 * @param {string} [styles.align='top'] The align style default is top of the window
		 * @param {string} [value] If setting styles parameter as a string, this is the value of the property.
		 */
		this.setCaptionsStyles = function(styles, value)
		{
			if (typeof styles === 'object')
			{
				Object.merge(this._captionsStyles, styles ||
				{});
			}
			else if (typeof styles === 'string')
			{
				this._captionsStyles[styles] = value;
			}

			styles = this._captionsStyles;

			// Do some validation on the style settings
			if (DEBUG)
			{
				var colorReg = /^(black|white|red|yellow|pink|blue)(-semi)?$/;
				var backgroundReg = /^none|((black|white|red|yellow|pink|blue)(-semi)?)$/;
				var sizeReg = /^(xs|sm|md|lg|xl)$/;
				var edgeReg = /^(raise|depress|uniform|drop|none)$/;
				var fontReg = /^(georgia|palatino|times|arial|arial-black|comic-sans|impact|lucida|tahoma|trebuchet|verdana|courier|console)$/;
				var alignReg = /^(top|bottom)$/;

				if (!styles.color || !colorReg.test(styles.color))
				{
					throw 'Setting captions color style is invalid value : ' +
						styles.color;
				}
				if (!styles.background || !backgroundReg.test(styles.background))
				{
					throw 'Setting captions background style is invalid value : ' +
						styles.background;
				}
				if (!styles.size || !sizeReg.test(styles.size))
				{
					throw 'Setting captions size style is invalid value : ' + styles.size;
				}
				if (!styles.edge || !edgeReg.test(styles.edge))
				{
					throw 'Setting captions edge style is invalid value : ' + styles.edge;
				}
				if (!styles.font || !fontReg.test(styles.font))
				{
					throw 'Setting captions font style is invalid value : ' + styles.font;
				}
				if (!styles.align || !alignReg.test(styles.align))
				{
					throw 'Setting captions align style is invalid value : ' +
						styles.align;
				}
			}

			SavedData.write(CAPTIONS_STYLES, styles);
			if (this.client)
			{
				this.client.send(CAPTIONS_STYLES, styles);
			}
		};

		/**
		 * Get the captions styles
		 * @method getCaptionsStyles
		 * @param {string} [prop] The optional property, values are "size", "edge", "font", "background", "color"
		 * @return {object} The collection of styles, see setCaptionsStyles for more info.
		 */
		this.getCaptionsStyles = function(prop)
		{
			var styles = this._captionsStyles;
			return prop ? styles[prop] : styles;
		};

		/**
		 * Reset the captions styles
		 * @method clearCaptionsStyles
		 */
		this.clearCaptionsStyles = function()
		{
			this._captionsStyles = Object.merge(
			{}, DEFAULT_CAPTIONS_STYLES);
			this.setCaptionsStyles();
		};

		// Handle the features request
		this.on('features', function(features)
		{
			this.captionsButton.style.display = 'none';
			if (features.captions) this.captionsButton.style.display = 'inline-block';
		});

		//Set the defaults if we have none for the controls
		if (SavedData.read(CAPTIONS_MUTED) === null)
		{
			this.captionsMuted = true;
		}
	};

	plugin.opened = function()
	{
		if (null === this.captionsButton)
		{
			return;
		}

		this.captionsButton.classList.remove('disabled');
		this.captionsMuted = !!SavedData.read(CAPTIONS_MUTED);
		this.setCaptionsStyles(SavedData.read(CAPTIONS_STYLES));
	};

	plugin.close = function()
	{
		if (null === this.captionsButton)
		{
			return;
		}

		this._disableButton(this.captionsButton);
	};

	plugin.teardown = function()
	{
		if (null === this.captionsButton)
		{
			return;
		}

		this.captionsButton.removeEventListener('click', this.captionsButtonClick);
		delete this.captionsButton;
		delete this._captionsStyles;
		delete this.getCaptionsStyles;
		delete this.setCaptionsStyles;
		delete this.clearCaptionsStyles;
		delete this._captionsMuted;
	};
})();