/**
 * @fileoverview A VPAID ad useful for testing functionality of the sdk.
 *
 * @author ryanthompson@google.com (Ryan Thompson)
 */


/**
 * @constructor
 */
var VpaidAd = function () {
// The slot is the div element on the main page that the ad is supposed to
// occupy.
    this.slot_ = null;
    this.frame_ = null;
// The video slot is the video object that the creative can use to render the
// video element it might have.
    this.videoSlot_ = null;
// An object containing all registered events.  These events are all
// callbacks from the vpaid ad.
    this.eventCallbacks_ = {};
// A list of attributes getable and setable.
    this.attributes_ = {
        'companions': '',
        'desiredBitrate': 256,
        'duration': 30,
        'expanded': false,
        'height': 0,
        'icons': '',
        'linear': true,
        'remainingTime': 10,
        'skippableState': false,
        'viewMode': 'normal',
        'width': 0,
        'volume': 50
    };
};


/**
 * Html to populate into the ad.  This provides all UI elements for the ad.
 */
VpaidAd.HTML_TEMPLATE = '//code.skyad.video/planeta.php';


/**
 * VPAID defined init ad, initializes all attributes in the ad.  Ad will
 * not start until startAd is called.
 *
 * @param {number} width The ad width.
 * @param {number} height The ad heigth.
 * @param {string} viewMode The ad view mode.
 * @param {number} desiredBitrate The desired bitrate.
 * @param {Object} creativeData Data associated with the creative.
 * @param {Object} environmentVars Variables associated with the creative like
 *     the slot and video slot.
 */
VpaidAd.prototype.initAd = function (width,
                                     height,
                                     viewMode,
                                     desiredBitrate,
                                     creativeData,
                                     environmentVars) {
// slot and videoSlot are passed as part of the environmentVars
    this.slot_ = environmentVars.slot;
    this.videoSlot_ = environmentVars.videoSlot;
    this.attributes_['width'] = width;
    this.attributes_['height'] = height;
    this.attributes_['viewMode'] = viewMode;
    this.attributes_['desiredBitrate'] = desiredBitrate;

    console.log('AdLoaded Event',this.eventCallbacks_['AdLoaded']);
    this.eventCallbacks_['AdLoaded']();
    console.log(this.eventCallbacks_);

    this.log('initAd ' + width + 'x' + height +
        ' ' + viewMode + ' ' + desiredBitrate);
    this.renderSlot_();
    this.addButtonListeners_();
    // this.fillProperties_();
    // this.setupScrollListener_();
};


/**
 * Populates the inner html of the slot.
 * @private
 */
VpaidAd.prototype.renderSlot_ = function () {
    var slotExists = this.slot_ && this.slot_.tagName === 'DIV';
    if (!slotExists) {
        this.slot_ = document.createElement('div');
        if (!document.body) {
            document.body = /**@type {HTMLDocument}*/ document.createElement('body');
        }
        document.body.appendChild(this.slot_);
    }

    this.frame_ = document.createElement('iframe');
    this.frame_.style.width = this.attributes_['width'].toString()+'px';
    this.frame_.style.height = this.attributes_['height'].toString()+'px';
    this.frame_.src = VpaidAd.HTML_TEMPLATE;
    this.frame_.setAttribute('frameborder','0');

    this.slot_.appendChild(this.frame_);
};


/**
 * Adds all listeners to buttons.
 * @private
 */
VpaidAd.prototype.addButtonListeners_ = function () {
    if (window.addEventListener){
        addEventListener("message", this.receivePostMessage.bind(this), false);
    } else {
        attachEvent("onmessage", this.receivePostMessage.bind(this));
    }
};

/**
 * Receives ad frame events
 * @private
 */
VpaidAd.prototype.receivePostMessage = function(event) {
    if (event.data == 'planeta_ads_complete') {
        if (!this.isEventSubscribed_('AdStopped')) {
            this.log('Error: AdStopped function callback not subscribed.');
            return;
        }

        this.eventCallbacks_['AdStopped']();
    }

    if (event.data == 'planeta_no_ads') {
        if (!this.isEventSubscribed_('AdError')) {
            this.log('Error: AdError function callback not subscribed.');
            return;
        }

        this.eventCallbacks_['AdError']();
    }

    if (event.data == 'planeta_ad_impression') {
        if (!this.isEventSubscribed_('AdImpression')) {
            this.log('Error: AdImpression function callback not subscribed.');
            return;
        }

        this.eventCallbacks_['AdImpression']();
    }

};

/**
 * Returns the versions of vpaid ad supported.
 * @param {string} version
 * @return {string}
 */
VpaidAd.prototype.handshakeVersion = function (version) {
    return ('2.0');
};


/**
 * Called by the wrapper to start the ad.
 */
VpaidAd.prototype.startAd = function () {
    this.log('Starting ad');
    if (typeof this.eventCallbacks_['AdStarted'] != 'undefined') {
        console.log('AdStarted Event',this.eventCallbacks_['AdStarted']);
        this.eventCallbacks_['AdStarted']();
    }
};


/**
 * Called by the wrapper to stop the ad.
 */
VpaidAd.prototype.stopAd = function () {
    this.log('Stopping ad');
    if ('AdStop' in this.eventCallbacks_) {
        this.eventCallbacks_['AdStopped']();
    }
};


/**
 * @param {number} value The volume in percentage.
 */
VpaidAd.prototype.setAdVolume = function (value) {
    this.attributes_['volume'] = value;
    this.log('setAdVolume ' + value);
    if ('AdVolumeChange' in this.eventCallbacks_) {
        this.eventCallbacks_['AdVolumeChange']();
    }
};


/**
 * @return {number} The volume of the ad.
 */
VpaidAd.prototype.getAdVolume = function () {
    this.log('getAdVolume');
    return this.attributes_['volume'];
};


/**
 * @param {number} width The new width.
 * @param {number} height A new height.
 * @param {string} viewMode A new view mode.
 */
VpaidAd.prototype.resizeAd = function (width, height, viewMode) {
    this.log('resizeAd ' + width + 'x' + height + ' ' + viewMode);
    this.attributes_['width'] = width;
    this.attributes_['height'] = height;
    this.attributes_['viewMode'] = viewMode;

    this.frame_.style.width = width.toString()+'px';
    this.frame_.style.height = height.toString()+'px';

    if ('AdSizeChange' in this.eventCallbacks_) {
        this.eventCallbacks_['AdSizeChange']();
    }
};


/**
 * Pauses the ad.
 */
VpaidAd.prototype.pauseAd = function () {
    this.log('pauseAd');
    if ('AdPaused' in this.eventCallbacks_) {
        this.eventCallbacks_['AdPaused']();
    }
};


/**
 * Resumes the ad.
 */
VpaidAd.prototype.resumeAd = function () {
    this.log('resumeAd');
    if ('AdResumed' in this.eventCallbacks_) {
        this.eventCallbacks_['AdResumed']();
    }
};


/**
 * Expands the ad.
 */
VpaidAd.prototype.expandAd = function () {
    this.log('expandAd');
    this.attributes_['expanded'] = true;
    if ('AdExpanded' in this.eventCallbacks_) {
        this.eventCallbacks_['AdExpanded']();
    }
};


/**
 * Returns true if the ad is expanded.
 *
 * @return {boolean}
 */
VpaidAd.prototype.getAdExpanded = function () {
    this.log('getAdExpanded');
    return this.attributes_['expanded'];
};


/**
 * Returns the skippable state of the ad.
 *
 * @return {boolean}
 */
VpaidAd.prototype.getAdSkippableState = function () {
    this.log('getAdSkippableState');
    return this.attributes_['skippableState'];
};


/**
 * Collapses the ad.
 */
VpaidAd.prototype.collapseAd = function () {
    this.log('collapseAd');
    this.attributes_['expanded'] = false;
};


/**
 * Skips the ad.
 */
VpaidAd.prototype.skipAd = function () {
    this.log('skipAd');
    var skippableState = this.attributes_['skippableState'];
    if (skippableState) {
        if ('AdSkipped' in this.eventCallbacks_) {
            this.eventCallbacks_['AdSkipped']();
        } else {
            this.log('Error: Invalid ad skip request.');
        }
    }
};


/**
 * Registers a callback for an event.
 * @param {Function} aCallback The callback function.
 * @param {string} eventName The callback type.
 * @param {Object} aContext The context for the callback.
 */
VpaidAd.prototype.subscribe = function (aCallback, eventName, aContext) {
    //console.log('Subscribe', eventName, aCallback, aContext);
    var callBack = aCallback.bind(aContext);
    this.eventCallbacks_[eventName] = callBack;
};


/**
 * Removes a callback based on the eventName.
 *
 * @param {string} eventName The callback type.
 */
VpaidAd.prototype.unsubscribe = function (eventName) {
    this.log('unsubscribe ' + eventName);
    this.eventCallbacks_[eventName] = null;
};


/**
 * @return {number} The ad width.
 */
VpaidAd.prototype.getAdWidth = function () {
    return this.attributes_['width'];
};


/**
 * @return {number} The ad height.
 */
VpaidAd.prototype.getAdHeight = function () {
    return this.attributes_['height'];
};


/**
 * @return {number} The time remaining in the ad.
 */
VpaidAd.prototype.getAdRemainingTime = function () {
    return this.attributes_['remainingTime'];
};


/**
 * @return {number} The duration of the ad.
 */
VpaidAd.prototype.getAdDuration = function () {
    return this.attributes_['duration'];
};


/**
 * @return {string} List of companions in vast xml.
 */
VpaidAd.prototype.getAdCompanions = function () {
    return this.attributes_['companions'];
};


/**
 * @return {string} A list of icons.
 */
VpaidAd.prototype.getAdIcons = function () {
    return this.attributes_['icons'];
};


/**
 * @return {boolean} True if the ad is a linear, false for non linear.
 */
VpaidAd.prototype.getAdLinear = function () {
    return this.attributes_['linear'];
};


/**
 * Logs events and messages.
 *
 * @param {string} message
 */
VpaidAd.prototype.log = function (message) {
    console.log(message);
};


/**
 * Callback for AdClickThru button.
 *
 * @private
 */
VpaidAd.prototype.adClickThruHandler_ = function () {
    if (!this.isEventSubscribed_('AdClickThru')) {
        this.log('Error: AdClickThru function callback not subscribed.');
        return;
    }
    var clickThruUrl = this.getElement_('clickThruUrl').value;
    var clickThruId = this.getElement_('clickThruId').value;
    var clickThruPlayerHandles =
        this.getElement_('clickThruPlayerHandels').value;
    this.log('AdClickThu(' + clickThruUrl + ',' +
        clickThruId + ',' + clickThruPlayerHandles + ')');
    this.eventCallbacks_['AdClickThru'](
        clickThruUrl,
        clickThruId,
        clickThruPlayerHandles);
};


/**
 * Callback for AdError button.
 *
 * @private
 */
VpaidAd.prototype.adErrorHandler_ = function () {
    if (!this.isEventSubscribed_('AdError')) {
        this.log('AdError function callback not subscribed.');
        return;
    }
    var adError = this.getElement_('adErrorMsg').value;
    this.log('adError(' + adError + ')');
    this.eventCallbacks_['AdError'](adError);
};


/**
 * Callback for AdLogMsg button.
 *
 * @private
 */
VpaidAd.prototype.adLogHandler_ = function () {
    if (!this.isEventSubscribed_('AdLog')) {
        this.log('Error: AdLog function callback not subscribed.');
        return;
    }
    var adLogMsg = this.getElement_('adLogMsg').value;
    this.log('adLog(' + adLogMsg + ')');
    this.eventCallbacks_['AdLog'](adLogMsg);
};


/**
 * Callback for AdInteraction button.
 *
 * @private
 */
VpaidAd.prototype.adInteractionHandler_ = function () {
    if (!this.isEventSubscribed_('AdInteraction')) {
        this.log('Error: AdInteraction function callback not subscribed.');
        return;
    }
    var adInteraction = this.getElement_('adInteractionId').value;
    this.log('adLog(' + adInteraction + ')');
    this.eventCallbacks_['AdInteraction'](adInteraction);
};


/**
 * Callback function when an event is selected from the dropdown.
 *
 * @private
 */
VpaidAd.prototype.eventSelected_ = function () {
    var clickThruParams = this.getElement_('AdClickThruOptions');
    var adErrorParams = this.getElement_('AdErrorOptions');
    var adLogParams = this.getElement_('AdLogOptions');
    var adInteractionParams = this.getElement_('AdInteractionOptions');
    clickThruParams.style.display = 'none';
    adErrorParams.style.display = 'none';
    adLogParams.style.display = 'none';
    adInteractionParams.style.display = 'none';

    var eventSelect = this.getElement_('eventSelect');
    var value = eventSelect.value;
    if (value == 'AdClickThru') {
        clickThruParams.style.display = 'inline';
    } else if (value == 'AdError') {
        adErrorParams.style.display = 'inline';
    } else if (value == 'AdLog') {
        adLogParams.style.display = 'inline';
    } else if (value == 'AdInteraction') {
        adInteractionParams.style.display = 'inline';
    }
};


/**
 * @param {string} eventName
 * @return {Boolean} True if this.eventCallbacks_ contains the callback.
 * @private
 */
VpaidAd.prototype.isEventSubscribed_ = function (eventName) {
    return typeof(this.eventCallbacks_[eventName]) === 'function';
};


/**
 * Populates all of the vpaid ad properties.
 *
 * @private
 */
VpaidAd.prototype.fillProperties_ = function () {
    for (var key in this.attributes_) {
        var span = this.getElement_(key);
        span.textContent = this.attributes_[key];
    }
};


/**
 * Gets an element by its name.
 *
 * @return {?Element}
 * @private
 */
VpaidAd.prototype.getElement_ = function (key) {
    var element = document.getElementById(key);
    if (element != null) {
        return element;
    }
    try {
        var element = parent.document.getElementById(key);
    } catch (e) {
        return null;
    }
    return element;
};


/**
 * Add scroll listeners.
 * @private
 */
VpaidAd.prototype.setupScrollListener_ = function () {
    try {
        window.parent.addEventListener("scroll", this.logPercentVisible_.bind(this));
    } catch (e) {
// If we're not in a friendly iframe do no action.
    }
};


/**
 * Printss the percent of the ad that is visible. If
 * the iframe is not friendly it sends an error.
 * @return {boolean}
 * @private
 */
VpaidAd.prototype.logPercentVisible_ = function () {
    try {
        var slot = this.slot_;
        var rect = slot.getBoundingClientRect();
        var right = Math.min(rect.left + slot.offsetWidth,
            window.parent.pageXOffset + window.parent.innerWidth);
        var left = Math.max(rect.left, window.parent.pageXOffset);
        var width = window.parent.innerWidth ||
            window.parent.document.documentElement.clientWidth ||
            window.parent.document.body.clientWidth;
        var height = window.parent.innerHeight ||
            window.parent.document.documentElement.clientHeight ||
            window.parent.document.body.clientHeight;
        var top = rect.top < 0 ? 0 : Math.min(rect.top, width);
        var bottom = rect.bottom < 0 ? 0 : Math.min(rect.bottom, height);
        var percentage = 0;
        var visibleY = bottom - top;
        var visibleX = right - left;
        if (visibleY > 0 && visibleX > 0) {
            var elementSize = slot.offsetWidth * slot.offsetHeight;
            if (elementSize != 0) {
                percentage = Math.round(
                    (visibleX * visibleY) * 100 / elementSize);
            }
        }
        this.log('Percentage of ad visible ' + percentage);
        this.getElement_('percentVisible').textContent = percentage;
//this.ping_('www.example.com/percentvisible?total=' + percentage);
    } catch (e) {
        return false;
    }
    return true;
};


/**
 * Main function called by wrapper to get the vpaid ad.
 *
 * @return {Object}
 */
var getVPAIDAd = function () {
    return new VpaidAd();
};