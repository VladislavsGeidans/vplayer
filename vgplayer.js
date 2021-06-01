var VPlayer;
var VPlayer = (function () {
    "use strict";
    var _g = {};
    var PLUGIN_NAME = 'vplayer',
        PLUGIN_VERSION = '0.1',
        PLUGIN_OPTIONS = {};
    var VPlayer = function (id, options) {
        this.id = id;
        this.name = PLUGIN_NAME;
        this.version = PLUGIN_VERSION;
        this.settings = PLUGIN_OPTIONS;
        this.content_video = null;
        this.ads_video = null;
        this.ifFullscreen = false;

        //default values
        this.options = {
            volume: 1,
            width: '800px',
            height: '600px',
            playlist: [],
            ads: [],
            callbacks: {
                AdsStarted: this._callbackAdsStarted,
                AdsEnded: this._callbackAdsEnded,
                MainContentStarted: this._callbackMainContentStarted,
                AdImpression: this._callbackAdImpression,
                NoAds: this._callbackNoAds,
                VideoError: this._callbackVideoError,
            }
        };
        this._setOptions(options);//merge options
        this.volume = this.options.volume
        this.makeVideo();
        this.setVolume(this.volume);
    };

    VPlayer.init = function (id, options) {

        var rollbarLoader = document.createElement('script');
        rollbarLoader.src = "https://cdnjs.cloudflare.com/ajax/libs/rollbar.js/2.2.10/rollbar.min.js";
        document.getElementById(id).appendChild(rollbarLoader);

        _g.sp = new VPlayer(id, options);

        if (document.getElementById(id)) {
            document.getElementById(id).style.backgroundColor = 'black';
        }

        if (_g.sp.options.autoplay) {
            if (UTILS.isMobile()) {
                triggerEvent(_g.sp.content_video.controls.dynamic, 'click');
            }
            triggerEvent(_g.sp.content_video.controls.playpausecenter, 'click');
        }
        return _g.sp;
    };

    VPlayer.prototype = {
        _callbackAdsStarted: function () {
        },
        _callbackAdsEnded: function () {
        },
        _callbackMainContentStarted: function () {
            console.log("MainContentStarted")
        },
        _callbackAdImpression: function () {
            console.log("Ad Impression Player");
        },
        _callbackNoAds: function () {
        },
        _callbackVideoError: function () {
            console.log("Video Error");
        },
        options: {
            autoplay: false,
            playlist: []
        },
        setVolume: function (volume) {
            this.volume = volume;
            this.content_video.setVolume(this.volume);
            this.ads_video.setVolume(this.volume);
        },
        makeVideo: function () {
            var self = this;
            this.content_video = new ContentVideo({sp: this, playlist: this.options.playlist});
            this.ads_video = new AdsVideo({sp: this, ads: this.options.ads});
        },
        _setOptions: function (options) {
            var default_option = this.options;
            this.options = {
                autoplay: options.autoplay ? options.autoplay : default_option.autoplay,
                volume: options.volume ? options.volume : default_option.volume,
                width: options.width ? options.width : default_option.width,
                height: options.height ? options.height : default_option.height,
                playlist: options.playlist ? options.playlist : default_option.playlist,
                ads: options.ads ? options.ads : default_option.ads,
                callbacks: {
                    AdsStarted: options.callbacks && options.callbacks.AdsStarted ? options.callbacks.AdsStarted : default_option.callbacks.AdsStarted,
                    AdsEnded: options.callbacks && options.callbacks.AdsEnded ? options.callbacks.AdsEnded : default_option.callbacks.AdsEnded,
                    MainContentStarted: options.callbacks && options.callbacks.MainContentStarted ? options.callbacks.MainContentStarted : default_option.callbacks.MainContentStarted,
                    AdImpression: options.callbacks && options.callbacks.AdImpression ? options.callbacks.AdImpression : default_option.callbacks.AdImpression,
                    NoAds: options.callbacks && options.callbacks.NoAds ? options.callbacks.NoAds : default_option.callbacks.NoAds,
                    VideoError: options.callbacks && options.callbacks.VideoError ? options.callbacks.VideoError : default_option.callbacks.VideoError,
                }
            };
        },
        getMainBlock: function () {
            return document.getElementById(this.id);
        },
    };

    //ContentVideo
    function ContentVideo(options) {
        console.log('test');
        this.controls = {};
        this.sp = options.sp;
        this.playlist = options.playlist;
        this.init();
    }

    ContentVideo.prototype = {
        video: null,
        fullscreen_div: null,
        playlist: [],
        current_video_index: 0,
        controls: {
            duration: null,
            buffered: null,
            dynamic: null,
            progress: null,
            total: null,
            currentTime: null,
            playpause: null,
            playpausecenter: null,
            next: null,
            fullscreen: null,
            volume_bar: null,
            volume_bar_span: null,
            volume_span: null,
            ads_link: null,
        },
        _can_play_video: false,
        _can_play_preroll: null,
        init: function () {
            this.makeControls();
            this.bind();
        },
        hide: function () {
            this.video.pause();
            document.getElementById('sp-content-player').style.display = 'none';
        },
        show: function () {
            document.getElementById('sp-content-player').style.display = 'block';
            // this.togglePlayback();
        },
        stop: function () {
            let self = this;
            this.controls.playpause.classList.add("play_icon");
            this.controls.playpause.classList.remove("pause_icon");
            document.getElementById('play_center_div').style.display = 'block';
        },
        nextVideo: function () {
            let play_center_div = document.getElementById('play_center_div');
            UTILS.removeElement(this.video);
            //video
            this.load_ads = false;
            this.current_video_index++;
            this.makeControls();
            this.bind();
            let fs = this.fullscreen_div;

            if (!this.load_ads) {
                this.load_ads = true;
                if (this.sp.ads_video.havePrepoll()) {
                    this.sp.ads_video.loadData();
                } else {
                    this.togglePlayback();
                }
            } else {
                this.togglePlayback();
            }

            // this.video.play();
        },
        setVolume: function (volume) {
            console.log('set volume', volume)
            this.video.volume = parseFloat(volume).toFixed(1);
            var percentage = volume * 100;
            this.controls.volume_bar_span.style.width = percentage + '%';
        },
        play: function () {
            this.controls.playpause.classList.remove("play_icon");
            this.controls.playpause.classList.add("pause_icon");
            document.getElementById('play_center_div').style.display = 'none';
        },
        togglePlayback: function () {
            (this.video.paused) ? this.video.play() : this.video.pause();
        },
        makeControls: function () {
            var self = this;
            //var ifFS = document.getElementById('sp-content-player');
            var ifFS = false;

            if ((window.fullScreen) || (window.innerWidth == screen.width && window.innerHeight == screen.height)) {
                ifFS = true;
            }

            if (document.getElementById('sp-content-player')) {
                var block = document.getElementById('sp-content-player');
                UTILS.removeElement(this.fullscreen_div);
                this.fullscreen_div = null;
            } else {

                var block = document.createElement("div");
                block.setAttribute('id', 'sp-content-player');
                block.style.width = self.sp.options.width;
                block.style.height = self.sp.options.height;
            }

            //console.log(self.sp.options.width);
            //console.log(self.sp.options.height);

            var block_holder = createElement('div', {class: 'holder2'});

            /*if((window.fullScreen) || (window.innerWidth == screen.width && window.innerHeight == screen.height)) {
             if (block_holder.requestFullscreen) {
             block_holder.requestFullscreen();
             }
             console.log('fullScreen');
             }
             else {
             if (block_holder.requestFullscreen) {
             block_holder.requestFullscreen();
             }
             }*/

            //video
            var videlem = document.createElement("video");
            videlem.style.backgroundColor = 'black';
            videlem.controls = false;

            // videlem.setAttribute("width", controls.video.width());
            // videlem.setAttribute("height", controls.video.height());
//            videlem.setAttribute("width", 800);
//            videlem.setAttribute("height", 600);

            videlem.style.width = '100%';
            videlem.style.height = '88%';


            videlem.setAttribute('id', 'video_player');
            videlem.setAttribute('autoplay', 'true');
            /// ... some setup like poster image, size, position etc. goes here...
            /// now, add sources:
            var sourceMP4 = document.createElement("source", {class: 'source'});
            sourceMP4.type = "video/mp4";
            if (typeof this.playlist === 'string') {
                sourceMP4.src = this.playlist;
            } else if (Array.isArray(this.playlist)) {
                //sourceMP4.src = this.playlist[this.current_video_index];
                var video_data = this.playlist[this.current_video_index];
                if (video_data)
                    sourceMP4.src = video_data.sources;
            }
            videlem.appendChild(sourceMP4);


            var play_center_div = createElement('div');
            play_center_div.setAttribute('id', 'play_center_div');
            block_holder.appendChild(play_center_div);
            var play_center_div_btn = createElement('div', {class: 'play_center'});
            var play_center_circle = createElement('div', {class: 'play_center_circle'});

            play_center_div.appendChild(play_center_div_btn);
            play_center_div_btn.appendChild(play_center_circle);

            //controls
            var control_holder = createElement('div', {class: 'holder'});


            //GENERAL DIV
            var controls = createElement('div', {class: 'controls controls_content_player'});
            var control_div = createElement('div', {class: 'controls_div'});
            var control_2div = createElement('div', {class: 'controls_2div'});
            var control_div_playpause = createElement('div', {class: 'controls_playpause'});
            var control_div_others = createElement('div', {class: 'controls_others'});
            var control_div_vol = createElement('div', {class: 'controls_volume_div'});
            var control_div_time = createElement('div', {class: 'controls_time_div'});
            var control_div_full = createElement('div', {class: 'controls_fs_div'});

            //playpause
            var control_playpause = createElement('i', {class: 'playpause play_icon'});

            //SEPERATOR
            var control_separator = createElement('div', {class: 'separators'});

            //var control_next = createElement('i', {class: 'next fa fa-step-forward'});
            //controls.appendChild(control_next);
            this.controls.playpause = control_playpause;
            this.controls.playpausecenter = play_center_div_btn;
            //this.controls.next = control_next;


            //progress
            var control_progress = createElement('span', {class: 'progress'});
            var control_progress_el_total = createElement('span', {class: 'total'});
            var control_progress_el_current = createElement('span', {class: 'current'});
            var control_progress_el_current_circle = createElement('span', {class: 'current_circle'});
            var control_progress_el_load = createElement('span', {class: 'load'});

            control_progress_el_current.appendChild(control_progress_el_current_circle);

            control_progress.appendChild(control_progress_el_total);
            control_progress.appendChild(control_progress_el_current);
            control_progress.appendChild(control_progress_el_load);


            //VOLUME
            var control_other_1_separator = createElement('div', {class: 'separators'});
            var control_other_2_separator = createElement('div', {class: 'separators'});

            var control_current_time = document.createElement("span");


            //dynamic
            var control_dynamic = createElement('span', {class: 'dynamic volume_icon'});
            var control_volume_percent = createElement('div', {class: 'control_volume_percent'});
            var control_volume_span = createElement('span', {class: 'control_volumeBar volume_icon_select'});
            control_volume_percent.appendChild(control_volume_span);
            //var control_dynamic_icon = createElement('i', {class: 'alt volume_icon'});
            //control_dynamic.appendChild(control_dynamic_icon);
            control_div_vol.appendChild(control_dynamic);
            control_div_vol.appendChild(control_volume_percent);


            //time
            var control_current_time = createElement('span', {class: 'time'});
            control_current_time.appendChild(document.createTextNode('00:00'));
            var control_time_separation = createElement('span', {class: 'separator'});
            control_time_separation.appendChild(document.createTextNode('/'));
            var control_total_time = createElement('span', {class: 'time-duration'});
            control_total_time.appendChild(document.createTextNode('00:00'));

            control_div_time.appendChild(control_current_time);
            control_div_time.appendChild(control_time_separation);
            control_div_time.appendChild(control_total_time);


            //seting & fullscreen
            var control_fullscreen = createElement('i', {class: 'alt fullscreen'});
            control_div_full.appendChild(control_fullscreen);

            controls.appendChild(control_div);
            controls.appendChild(control_2div);


            control_div.appendChild(control_progress);
            control_2div.appendChild(control_div_playpause);
            control_2div.appendChild(control_div_others);
            control_div_others.appendChild(control_div_vol);
            control_div_others.appendChild(control_other_1_separator);
            control_div_others.appendChild(control_div_time);
            control_div_others.appendChild(control_other_2_separator);
            control_div_others.appendChild(control_div_full);

            control_div_playpause.appendChild(control_playpause);
            control_div_playpause.appendChild(control_separator);

            control_holder.appendChild(controls);
            block_holder.appendChild(videlem);
            block_holder.appendChild(control_holder);
            block.appendChild(block_holder);
            // this.blocks.main_block.appendChild(block);
            this.video = videlem;
            this.fullscreen_div = block_holder;
            this.controls.dynamic = control_dynamic;
            this.controls.volume_bar = control_volume_percent;
            this.controls.volume_bar_span = control_volume_span;
            this.controls.duration = control_total_time;
            this.controls.progress = control_progress_el_current;
            this.controls.total = control_progress_el_total;
            this.controls.buffered = control_progress_el_load;
            this.controls.currentTime = control_current_time;
            this.controls.fullscreen = control_fullscreen;
            // this.blocks.content_player = block;

            this.sp.getMainBlock().appendChild(block);
            this.setVolume(this.sp.volume)
        },
        bindControl: function () {
            var self = this;

            this.controls.playpause.addEventListener("click", function () {
                if (!self.load_ads) {
                    self.load_ads = true;
                    if (self.sp.ads_video.havePrepoll()) {
                        self.sp.ads_video.loadData();
                    } else {
                        self.togglePlayback();
                    }
                } else {
                    self.togglePlayback();
                }
            }, false);
            this.controls.playpausecenter.addEventListener('click', function () {
                if (!self.load_ads) {
                    self.load_ads = true;
                    if (self.sp.ads_video.havePrepoll()) {
                        self.sp.ads_video.loadData();
                    } else {
                        self.togglePlayback();
                    }
                } else {
                    self.togglePlayback();
                }
            }, false);
            this.controls.fullscreen.addEventListener("click", function () {
                self.fullscreen();
            }, false);
            //change time
            this.controls.total.addEventListener("click", function (e) {
                var offset = offsetEl(this);
                var x = (e.pageX - offset.left) / this.clientWidth;
                self.video.currentTime = x * self.video.duration;
            });

            //change volume
            this.controls.volume_bar.addEventListener("click", function (e) {
                var offset = offsetEl(this);
                var x = (e.pageX - offset.left) / this.clientWidth;
                self.sp.setVolume(x);

                if (self.video.muted = true) {
                    self.video.muted = false;//unmuted
                }
            });

            //mute/unmute
            this.controls.dynamic.addEventListener("click", function () {
                var classes = this.getAttribute("class");
                var enable = true;
                var videos_volume = self.video.volume * 100;
                if (new RegExp('\\mute_icon\\b').test(classes)) {
                    classes = classes.replace(" mute_icon", " volume_icon");
                    enable = true;
                    self.controls.volume_bar_span.style.width = videos_volume + '%';
                } else {
                    classes = classes.replace(" volume_icon", " mute_icon");
                    enable = false;
                    self.controls.volume_bar_span.style.width = '0%';
                }

                this.setAttribute("class", classes);

                self.video.muted = !self.video.muted;
            }, false);
        },
        bindVideo: function () {
            var self = this;
            this.video.addEventListener("click", function () {
                self.togglePlayback();
            }, false);
            this.video.addEventListener("play", function () {
                self.play();
                if (self.sp.options.callbacks["MainContentStarted"]) {
                    self.sp.options.callbacks["MainContentStarted"]();
                }
            });

            this.video.onerror = function () {
                if (self.sp.options.callbacks["VideoError"]) {
                    self.sp.options.callbacks["VideoError"]('Content', self.video.error.code);
                }
            };

            this.video.addEventListener("pause", function () {
                self.stop();
            });
            this.video.addEventListener("canplay", function () {
                self.controls.duration.textContent = formatTime(self.video.duration);
                self.controls.currentTime.textContent = (formatTime(0));
            }, false);
            this.video.addEventListener("progress", function () {
                if (self.video.buffered.length > 0) {
                    var buffered = Math.floor(self.video.buffered.end(0)) / Math.floor(self.video.duration);
                    self.controls.buffered.style.width = Math.floor(buffered * self.controls.total.clientWidth) + "px";
                }
            }, false);
            //update progress line
            this.video.addEventListener("timeupdate", function () {
                self.controls.currentTime.textContent = formatTime(self.video.currentTime);
                var progress = Math.floor(self.video.currentTime) / Math.floor(self.video.duration);
                self.controls.progress.style.width = Math.floor(progress * self.controls.total.clientWidth) + "px";

                if (self.sp.ads_video.inlines.length > 0) {
                    self.sp.ads_video.inlines.forEach(function (item, i, arr) {
                        if (!item.opened && item.params.offset <= self.video.currentTime) {
                            self.sp.ads_video.inlines[i].opened = true;
                            self.sp.ads_video.openInline(item);
                        }
                    })
                }
                if (self.sp.ads_video.ads.length > 0) {
                    self.sp.ads_video.ads.forEach(function (item, i, arr) {
                        if (!item.opened && item.offset <= self.video.currentTime) {
                            self.sp.ads_video.ads[i].opened = true;
                            self.sp.ads_video.current_vast = new VAST();

                            var video_data = self.playlist[self.current_video_index];
                            var url = item.url;
                            var maxAds = item.maxAds;
                            self.sp.ads_video.maxAds = maxAds;

                            url = url.replace("[id]", video_data.id);
                            url = url.replace("[title]", video_data.title);
                            url = url.replace("[perma_link]", video_data.perma_link);

                            self.sp.ads_video.current_vast.loadData(url, function () {
                                self.sp.ads_video.startAds('midroll');
                                console.log('Midroll max ads:', self.sp.ads_video.maxAds);
                                if (!self.sp.ads_video.maxAds || self.sp.ads_video.maxAds == 0) {
                                    var allAds = self.sp.ads_video.current_vast.getCountAD();
                                    document.getElementById('sp-total-ads').textContent = allAds;
                                } else {
                                    document.getElementById('sp-total-ads').textContent = maxAds;
                                }
                            });
                        }
                    })
                }
            }, false);

            //on video end
            this.video.addEventListener("ended", function () {
                var postroll_url;
                var curr_item;
                var maxAds;
                self.sp.ads_video.ads.forEach(function (item, i, arr) {
                    if (item.type == 'postroll') {
                        postroll_url = item.url;
                        maxAds = item.maxAds;
                        self.sp.ads_video.maxAds = maxAds;
                    }
                });


                if (postroll_url) {
                    self.current_ads_options = curr_item;
                    self.sp.ads_video.current_vast = new VAST();

                    var video_data = self.playlist[self.current_video_index];
                    var url = postroll_url;
                    url = url.replace("[id]", video_data.id);
                    url = url.replace("[title]", video_data.title);
                    url = url.replace("[perma_link]", video_data.perma_link);

                    self.sp.ads_video.current_vast.loadData(url, function () {
                        self.sp.content_video.hide();
                        console.log('Postroll max ads:', self.sp.ads_video.maxAds);
                        if (!self.sp.ads_video.maxAds || self.sp.ads_video.maxAds == 0) {
                            var allAds = self.sp.ads_video.current_vast.getCountAD();
                            document.getElementById('sp-total-ads').textContent = allAds;
                        } else {
                            document.getElementById('sp-total-ads').textContent = maxAds;
                        }
                        self.sp.ads_video.startAds('postroll');
                    });
                } else {
                    if (self.current_video_index < self.playlist.length - 1) {
                        self.nextVideo();
                    }
                }


                /*self.ads_controls.playpause.classList.remove("fa-play");
                 self.ads_controls.playpause.classList.add("fa-pause");
                 //fix only first click
                 if (!self.disable_start_ads) {
                 triggerEvent(self.video, 'start_ads', {});
                 self.third_start_ads = true;
                 }
                 //fix first click
                 triggerEvent(self.video, 'resume_ads', {});
                 */
            });
        },
        bind: function () {
            var self = this;
            self.bindControl();
            self.bindVideo();
        },
        fullscreen: function () {
            var video = this.video;
            var fs = this.fullscreen_div;
            var isFullscreen = this.openFullscreen;
            if (!isFullscreen) {
                if (fs.requestFullscreen) {
                    fs.requestFullscreen();
                }
                else if (video.mozRequestFullScreen) {
                    fs.mozRequestFullScreen(); // Firefox
                }
                else if (video.webkitRequestFullscreen) {
                    fs.webkitRequestFullscreen(); // Chrome and Safari
                }
                else if (fs.msRequestFullscreen) {
                    fs.msRequestFullscreen();
                }
                this.openFullscreen = true;
                this.ifFullscreen = true;
            }
            else {

                if (document.cancelFullScreen) {
                    document.cancelFullScreen();
                }
                else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                }
                else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                }
                else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                else if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
                this.openFullscreen = false;
                this.ifFullscreen = false;
            }
        },
        /*ifFullscreen: function() {
         var full = document.getElementsByClassName('holder2');
         if (typeof(full) != 'undefined' && full != null)
         {
         if (!window.screenTop && !window.screenY) {
         }
         else {
         if (full.requestFullscreen) {
         full.requestFullscreen();
         }
         }
         }
         else {
         console.log('no');
         }
         },*/
    };


    //AdsVideo
    function AdsVideo(options) {
        this.sp = options.sp;
        this.ads_controls = {
            playpause: null,
            dynamic: null,
        };
        this.ads = options.ads;
        this.init();
    }

    AdsVideo.prototype = {
        ads: null,
        video: null,
        fullscreen_div: null,
        video_player_block: null,
        vpaid_frame: null,
        vpaid_video: null,
        preroll_data: null,
        postroll_data: null,
        current_ads_option: null,
        сurrent_ads_numer: 0,
        inlines: [],
        ads_controls: {
            playpause: null,
            total: null,
            currentTime: null,
            duration: null,
            progress_total: null,
            progress_current: null,
            progress_load: null,
            dynamic: null,
            ads_btn: null,
            ads_skip: null,
            ads_timer: null,
            volume_bar: null,
            volume_bar_span: null,
            ads_play_center_btn: null,
            ads_controls_time_duration: null,
        },
        current_ad: null,
        init: function () {
            this.makeControls();
            this.bind();
        },
        stop: function () {
            var self = this;
        },
        togglePlayback: function () {
            (this.video.paused) ? this.video.play() : this.video.pause();
        },
        setVolume: function (volume) {
            this.video.volume = volume;
            var percentage = volume * 100;
            this.ads_controls.volume_bar_span.style.width = percentage + '%';
        },
        openInline: function (item) {
            var block = document.getElementById('sp-content-player').querySelector('.holder2');
            var img_block = createElement('div', {class: 'img'});
            var link = createElement('a', {href: item.creative.click_url, 'target': '_blank'});
            var img = createElement('img', {src: item.creative.source.trim()});
            var close_link = createElement('a', {href: '#'});
            var close_i = createElement('i', {title: 'Закрыть', class: 'fa fa-times-circle close'});

            close_link.addEventListener("click", function (e) {
                UTILS.removeElement(document.getElementsByClassName('img')[0]);
                e.preventDefault();
            }, false);

            close_link.appendChild(close_i);
            link.appendChild(img);
            img_block.appendChild(link);
            img_block.appendChild(close_link);
            block.appendChild(img_block);

            setInterval(function () {
                UTILS.removeElement(img_block);
            }, 10000);

        },
        fullscreen: function () {
            var video = this.video;
            var fs = this.fullscreen_div;
            var isFullscreen = this.openFullscreen;
            if (!isFullscreen) {
                if (fs.requestFullscreen) {
                    fs.requestFullscreen();
                }
                else if (fs.mozRequestFullScreen) {
                    fs.mozRequestFullScreen(); // Firefox
                }
                else if (fs.webkitRequestFullscreen) {
                    fs.webkitRequestFullscreen(); // Chrome and Safari
                }
                else if (fs.msRequestFullscreen) {
                    fs.msRequestFullscreen();
                }
                this.openFullscreen = true;
                this.ifFullscreen = true;
            }
            else {

                if (document.cancelFullScreen) {
                    document.cancelFullScreen();
                }
                else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                }
                else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                }
                else if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
                else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                this.openFullscreen = false;
                this.ifFullscreen = false;
            }
        },
        havePrepoll: function () {
            var result = false;
            this.ads.forEach(function (item, i, arr) {
                if (item.type == 'preroll') {
                    result = true;
                }
            });
            return result;
        },
        havePostroll: function () {
            var result = false;
            this.ads.forEach(function (item, i, arr) {
                if (item.type == 'postroll') {
                    result = true;
                }
            });
            return result;
        },
        prepareRequestUrl: function(url) {
            var self = this;
            var video_data = self.sp.content_video.playlist[self.sp.content_video.current_video_index];
            if (video_data) {
                if (typeof url == 'string') {
                    url = url.replace("[id]", video_data.id);
                    url = url.replace("[title]", video_data.title);
                    url = url.replace("[perma_link]", video_data.perma_link);
                } else if (typeof url == 'object') {
                    var newArr = [];

                    url.forEach(function (value) {
                        value = value.replace("[id]", video_data.id);
                        value = value.replace("[title]", video_data.title);
                        value = value.replace("[perma_link]", video_data.perma_link);

                        newArr.push(value);
                    });

                    url = newArr;
                }
            }
            return url;
        },
        tryNextAd: function() {
            var self = this;
            var have_next = self.current_vast.nextAD();
            var type = self.current_vast.getCurrentMediaType();
            self.third_start_ads = null;
            if (have_next) {
                if (!self.sp.ads_video.maxAds || self.sp.ads_video.maxAds == 0) {
                    if (type === 'VPAID') {
                        self.video.pause();
                        self.hide();
                        self.startAds(self.current_roll);
                    } else {
                        self.hide_vpaid();
                        self.startAds(self.current_roll);
                    }
                } else {
                    if (self.sp.ads_video.maxAds > self.sp.ads_video.сurrent_ads_numer) {
                        if (type === 'VPAID') {
                            self.video.pause();
                            self.hide();
                            self.startAds(self.current_roll);
                        } else {
                            self.hide_vpaid();
                            self.startAds(self.current_roll);
                        }
                    } else {
                        self.sp.ads_video.сurrent_ads_numer = 0;
                        self.video.pause();
                        self.hide();
                        self.hide_vpaid();
                        self.sp.content_video.show();
                        if (self.sp.options.callbacks["AdsEnded"]) {
                            self.sp.options.callbacks["AdsEnded"]();
                        }
                        if (self.current_roll != 'postroll') {
                            self.sp.content_video.video.play();
                        }
                        self.all_ads_roll_started = null;
                    }
                }
            } else {
                if (self.current_vast.linkQueue.length > 0) {
                    self.tryVastLinks(self.current_vast.linkQueue);
                } else {
                    self.video.pause();
                    self.hide();
                    self.hide_vpaid();
                    self.sp.content_video.show();
                    self.sp.content_video.show();
                    if (self.sp.options.callbacks["AdsEnded"]) {
                        self.sp.options.callbacks["AdsEnded"]();
                    }
                    if (self.current_roll != 'postroll') {
                        self.sp.content_video.video.play();
                    }
                    self.all_ads_roll_started = null;
                    self.sp.ads_video.сurrent_ads_numer = 0;
                }
            }
        },
        tryVastLinks: function(preroll_url) {
            var self = this;
            self.current_vast.loadData(preroll_url, function () {
                self.startAds('preroll');
                if (!self.sp.ads_video.maxAds) {
                    var allAds = self.current_vast.getCountAD();
                    document.getElementById('sp-total-ads').textContent = allAds;
                } else {
                    document.getElementById('sp-total-ads').textContent = self.sp.ads_video.maxAds;
                }
            });
        },
        loadData: function () {
            var self = this;
            var preroll_url = null;
            var postroll_url = null;
            var inlines = [];
            var curr_item;
            var maxAds;
            self.ads.forEach(function (item, i, arr) {
                if (item.type == 'preroll') {
                    preroll_url = item.url;
                    curr_item = item;
                    maxAds = item.maxAds;
                    self.sp.ads_video.maxAds = maxAds;
                } else if (item.type == 'postroll') {
                    postroll_url = item.url;
                    curr_item = item;
                } else if (item.type == 'nonlinear') {
                    inlines.push(item);
                }
            });

            if (preroll_url) {
                self.current_ads_option = curr_item;
                self.sp.content_video._can_play_preroll = false;
                self.current_vast = new VAST();

                preroll_url = self.prepareRequestUrl(preroll_url);
                self.tryVastLinks(preroll_url);
            }

            if (inlines.length > 0) {
                inlines.forEach(function (item, i, arr) {
                    UTILS.sendRequest(item.url, {}, function (response) {
                        if (!response) {
                            return;
                        }
                        self.readVast(response, 'noninline');
                        var inline_data = {};
                        inline_data.version = response.querySelector("VAST").getAttribute("version");
                        inline_data.imp = response.querySelector("Impression").textContent;
                        inline_data.params = item;
                        var creative = new NonlineCreative();
                        creative.loadFromXML(response);
                        inline_data.creative = creative;
                        self.inlines.push(inline_data)
                    }, 'GET', 'xml');
                })
            }
        },
        readVast: function (response, type) {
            var self = this;
            self.ads_data = UTILS.parse(response);
            console.log(self.ads_data);
            var ads = response.querySelector("Ad");
            // preroll_data.version = response.querySelector("VAST").getAttribute("version");
            // preroll_data.imp = response.querySelector("Impression").textContent;
            response.querySelector("Creatives").childNodes.forEach(function (item_cr, i_cr, arr_cr) {
                if (item_cr.nodeName != "Creative") {
                    return;
                }
                var creative = new InlineCreative();
                creative.loadFromXML(item_cr);
                // preroll_data.creative = creative;
            });
            if (type == 'preroll') {
                self.preroll_data = UTILS.parse(response);
            } else {
                self.postroll_data = UTILS.parse(response);
            }
        },
        startAds: function (type) {
            var self = this;
            self.current_roll = type;
            self.сurrent_ads_numer++;

            console.log('Current ad:', self.сurrent_ads_numer);
            document.getElementById('play_center_div').style.display = 'none';
            if (type == 'preroll') {
                this.current_ad = this.current_vast.getCurrentAD();
                if (!this.current_ad) {
                    this.nextAD();
                    return;
                }
                var video_url = null;
                var ads_parameters = null;
                document.getElementById('current-ads').textContent = this.current_vast.sequence;
                this.current_creative = this.current_vast.getCurrentCreative();
                video_url = this.current_vast.getCurrentMedia();
                ads_parameters = this.current_vast.getCurrentAdParameters();

                var vpaidVideoBlock = self.video_player_block;
                var vpaidVideoEl = self.vpaid_video;

                var type = this.current_vast.getCurrentMediaType();
                if (type === 'VPAID') {
                    var vpaidFrame = document.createElement('iframe');
                    // vpaidFrame.style.display = 'none';
                    vpaidFrame.setAttribute('scrolling', 'no');
                    vpaidFrame.setAttribute('frameBorder', '0');
//                    vpaidFrame.width = 800;
//                    vpaidFrame.height = 600;
                    vpaidFrame.style.width = '100%';
                    vpaidFrame.style.height = '100%';

                    vpaidVideoBlock = document.createElement('div');
                    var vpaid_video = document.createElement('video', {id: 'vpaid_ads_video'});
                    vpaid_video.setAttribute('class', 'vpaid_video');
                    vpaidVideoBlock.appendChild(vpaid_video);

                    vpaidFrame.onload = function () {


                        var vpaidLoader = vpaidFrame.contentWindow.document.createElement('script');
                        vpaidLoader.src = video_url;

                        vpaidLoader.onload = function () {
                            var LiveRailVPAID = vpaidFrame.contentWindow.getVPAIDAd();
                            var vpaid_wrapper = new VPAIDWrapper(LiveRailVPAID, self.current_creative.event_links);
                            var mode = "normal" // “normal”, “thumbnail”, or “fullscreen”
                            var bitreit = 512;
                            var creativeData = {'AdParameters': ads_parameters};
                            var environmentVars = {};

                            environmentVars.slot = vpaidVideoBlock;
                            environmentVars.videoSlot = vpaid_video; /// Not used in this ad
                            // vpaid_video.style.display = 'none';
                            vpaid_wrapper.initAd(800, 600, mode, bitreit, creativeData, environmentVars);

                        };

                        var css = 'body { margin: 0; width: 100%; height: 100% } iframe { width: 100% !important; height: 100% !important; }',
                            style = document.createElement('style');
                        style.type = 'text/css';
                        if (style.styleSheet) {
                            style.styleSheet.cssText = css;
                        } else {
                            style.appendChild(document.createTextNode(css));
                        }

                        vpaidFrame.contentWindow.document.body.appendChild(style);
                        vpaidFrame.contentWindow.document.body.appendChild(vpaidVideoBlock);
                        vpaidFrame.contentWindow.document.body.appendChild(vpaidLoader);
                    };
                    //Hide content player
                    this.sp.content_video.video.pause();
                    // this.sp.content_video.hide();
                    // this.show_vpaid();
                    self.video_player_block.appendChild(vpaidFrame);
                    self.vpaid_frame = vpaidFrame;
                } else {
                    if (!video_url) {
                        this.nextAD();
                    }
                    var sourceMP4 = createElement('source', {src: video_url, type: "video/mp4"});
                    this.video.pause();
                    if (this.video.firstChild) {
                        this.video.removeChild(this.video.firstChild);
                    }
                    this.video.appendChild(sourceMP4);
                    this.sp.content_video.video.pause();
                    this.sp.content_video.hide();
                    this.show();
                    this.video.load();
                    this.video.play();
                }
            } else if (type == 'postroll') {
                this.current_ad = this.current_vast.getCurrentAD();
                if (!this.current_ad) {
                    this.nextAD();
                    return;
                }
                var video_url = null;
                document.getElementById('current-ads').textContent = this.current_vast.sequence;
                this.current_creative = this.current_vast.getCurrentCreative();
                video_url = this.current_vast.getCurrentMedia();
                ads_parameters = this.current_vast.getCurrentAdParameters();


                var vpaidVideoBlock = self.video_player_block;
                var vpaidVideoEl = self.vpaid_video;

                var type = this.current_vast.getCurrentMediaType();
                if (type === 'VPAID') {

                    var vpaidFrame = document.createElement('iframe');
                    // vpaidFrame.style.display = 'none';
                    vpaidFrame.style.overflow = 'hidden';
                    vpaidFrame.setAttribute('scrolling', 'no');
                    vpaidFrame.setAttribute('frameBorder', '0');
//                    vpaidFrame.width = 800;
//                    vpaidFrame.height = 600;

                    vpaidFrame.style.width = self.sp.options.width;
                    vpaidFrame.style.height = self.sp.options.height;

                    vpaidVideoBlock = document.createElement('div');
                    var vpaid_video = document.createElement('video', {id: 'vpaid_ads_video'});
                    vpaid_video.setAttribute('class', 'vpaid_video');
                    vpaidVideoBlock.appendChild(vpaid_video);

                    vpaidFrame.onload = function () {
                        var vpaidLoader = vpaidFrame.contentWindow.document.createElement('script');
                        vpaidLoader.src = video_url;
                        vpaidLoader.onload = function () {
                            var LiveRailVPAID = vpaidFrame.contentWindow.getVPAIDAd();
                            var vpaid_wrapper = new VPAIDWrapper(LiveRailVPAID, self.current_creative.event_links);
                            var mode = "normal" // “normal”, “thumbnail”, or “fullscreen”
                            var bitreit = 512;
                            var creativeData = {'AdParameters': ads_parameters};
                            var environmentVars = {};

                            environmentVars.slot = vpaidVideoBlock;
                            environmentVars.videoSlot = vpaid_video; /// Not used in this ad
                            // vpaid_video.style.display = 'none';
                            vpaid_wrapper.initAd(800, 600, mode, bitreit, creativeData, environmentVars);

                        };

                        var css = 'body { margin: 0; width: 100%; height: 100% } iframe { width: 100% !important; height: 100% !important; }',
                            style = document.createElement('style');
                        style.type = 'text/css';
                        if (style.styleSheet) {
                            style.styleSheet.cssText = css;
                        } else {
                            style.appendChild(document.createTextNode(css));
                        }

                        vpaidFrame.contentWindow.document.body.appendChild(style);
                        vpaidFrame.contentWindow.document.body.appendChild(vpaidVideoBlock);
                        vpaidFrame.contentWindow.document.body.appendChild(vpaidLoader);
                    };
                    this.sp.content_video.video.pause();
                    // this.sp.content_video.hide();
                    // this.show_vpaid();
                    self.video_player_block.appendChild(vpaidFrame);
                    self.vpaid_frame = vpaidFrame;
                } else {
                    var sourceMP4 = createElement('source', {src: video_url, type: "video/mp4"});
                    this.video.pause();
                    if (this.video.firstChild) {
                        this.video.removeChild(this.video.firstChild);
                    }
                    this.video.appendChild(sourceMP4);
                    this.sp.content_video.video.pause();
                    this.sp.content_video.hide();
                    this.show();
                    this.video.load();
                    this.video.play();
                }
            } else if (type == 'midroll') {
                this.current_ad = this.current_vast.getCurrentAD();
                if (!this.current_ad) {
                    this.nextAD();
                    return;
                }
                var video_url = null;
                document.getElementById('current-ads').textContent = this.current_vast.sequence;
                this.current_creative = this.current_vast.getCurrentCreative();
                video_url = this.current_vast.getCurrentMedia();

                ads_parameters = this.current_vast.getCurrentAdParameters();
                var vpaidVideoBlock = self.video_player_block;
                var vpaidVideoEl = self.vpaid_video;
                var type = this.current_vast.getCurrentMediaType();
                if (type === 'VPAID') {
                    var vpaidFrame = document.createElement('iframe');
                    // vpaidFrame.style.display = 'none';
                    vpaidFrame.style.overflow = 'hidden';
                    vpaidFrame.setAttribute('scrolling', 'no');
                    vpaidFrame.setAttribute('frameBorder', '0');
//                    vpaidFrame.width = 800;
//                    vpaidFrame.height = 600;

                    vpaidFrame.style.width = self.sp.options.width;
                    vpaidFrame.style.height = self.sp.options.height;


                    vpaidVideoBlock = document.createElement('div');
                    var vpaid_video = document.createElement('video', {id: 'vpaid_ads_video'});
                    vpaid_video.setAttribute('class', 'vpaid_video');
                    vpaidVideoBlock.appendChild(vpaid_video);

                    vpaidFrame.onload = function () {

                        var vpaidLoader = vpaidFrame.contentWindow.document.createElement('script');
                        vpaidLoader.src = video_url;
                        vpaidLoader.onload = function () {
                            var LiveRailVPAID = vpaidFrame.contentWindow.getVPAIDAd();
                            var vpaid_wrapper = new VPAIDWrapper(LiveRailVPAID, self.current_creative.event_links);
                            var mode = "normal" // “normal”, “thumbnail”, or “fullscreen”
                            var bitreit = 512;
                            var creativeData = {'AdParameters': ads_parameters};
                            var environmentVars = {};

                            environmentVars.slot = vpaidVideoBlock;
                            environmentVars.videoSlot = vpaid_video; /// Not used in this ad
                            // vpaid_video.style.display = 'none';
                            vpaid_wrapper.initAd(800, 600, mode, bitreit, creativeData, environmentVars);

                        };
                        vpaidFrame.contentWindow.document.body.appendChild(vpaidLoader);

                        var css = 'body { margin: 0; width: 100%; height: 100% } iframe { width: 100% !important; height: 100% !important; }',
                            style = document.createElement('style');
                        style.type = 'text/css';
                        if (style.styleSheet) {
                            style.styleSheet.cssText = css;
                        } else {
                            style.appendChild(document.createTextNode(css));
                        }

                        vpaidFrame.contentWindow.document.body.appendChild(style);
                        vpaidFrame.contentWindow.document.body.appendChild(vpaidVideoBlock);
                        vpaidFrame.contentWindow.document.body.appendChild(vpaidLoader);
                    };
                    this.sp.content_video.video.pause();
                    // this.sp.content_video.hide();
                    // this.show_vpaid();
                    self.video_player_block.appendChild(vpaidFrame);
                    self.vpaid_frame = vpaidFrame;
                } else {
                    var sourceMP4 = createElement('source', {src: video_url, type: "video/mp4"});
                    this.video.pause();
                    if (this.video.firstChild) {
                        this.video.removeChild(this.video.firstChild);
                    }
                    this.video.appendChild(sourceMP4);
                    this.sp.content_video.video.pause();
                    this.sp.content_video.hide();
                    this.show();
                    this.video.load();
                    this.video.play();
                }
            }
        },
        showSkipBtn: function () {
            this.ads_controls.ads_skip.style.display = "block";
            this.ads_controls.ads_btn.style.display = "none";
            // this.ads_controls.ads_timer.innerHTML = "5";
        },
        showIntervalBtn: function () {
            this.ads_controls.ads_skip.style.display = "none";
            this.ads_controls.ads_btn.style.display = "block";
        },
        tracking: function (src) {
            var tracking = document.createElement('img');
            tracking.src = src;
            tracking.width = 1;
            tracking.height = 1;
            tracking.style.display = 'none';
            tracking.onload = function () {
                document.body.removeChild(this);
            };
            document.body.appendChild(tracking);
        },
        bind: function () {
            var self = this;
            var ad_duration_timer;

            // Add an event listener.
            addEventListener(self.video, 'start_ads', function (e) {
                if (self.current_creative.event_links.start) {
                    self.tracking(self.current_creative.event_links.start);
                }

                self.first_quartile_ads = null;
                self.disable_midpoint_ads = null;
                self.third_quartile_ads = null;

                console.log("Start Ad..");
                //removeEvent(self.video, 'start_ads', false);
                //e.target.removeEventListener(e.type, false);

                //self.ads_controls.ads_timer.textContent = skipTimeFormat(self.current_vast.getCurrentSkipTime(), false);
                self.ads_controls.ads_timer.textContent = skipTimeFormat(self.current_vast.getCurrentSkipTime(), false);


                if (!self.current_vast.getCurrentVideoLink()) {
                    self.ads_controls.ads_link.href = '#';
                } else {
                    self.ads_controls.ads_link.setAttribute('target', '_blank');
                    self.ads_controls.ads_link.href = self.current_vast.getCurrentVideoLink();
                }

                self.ads_controls.duration.textContent = AdDurationFormat(self.current_vast.getCurrentDuration());
                self.showIntervalBtn();
                var timer = setInterval(function () {
                    if (!self.video.paused) {
                        if (self.ads_controls.ads_timer.innerHTML == "0") {
                            self.showSkipBtn();
                            clearInterval(timer);
                        }
                        else {
                            self.ads_controls.ads_timer.innerHTML--;
                        }
                    }
                    else {
                        clearInterval(timer);
                    }
                }, 1000);

                if (self.ads_controls.ads_timer.innerHTML == "0") {
                    clearInterval(timer);
                }
                document.getElementById('ads_play_center_div').style.display = 'none';
            }, false);
            addEventListener(self.video, 'first_quartile_ads', function (e) {
                if (self.current_creative.event_links.firstQuartile) {
                    self.tracking(self.current_creative.event_links.firstQuartile);
                }
                log("View first quartile ads video..")
                // removeEvent(self.video, 'first_quartile_ads', false);
                // e.target.removeEventListener(e.type, false);
            }, false);
            addEventListener(self.video, 'midpoint_ads', function (e) {
                if (self.current_creative.event_links.midpoint) {
                    self.tracking(self.current_creative.event_links.midpoint);
                }
                console.log("View midpoint ads video..")
                // removeEvent(self.video, 'midpoint_ads', false);
                // e.target.removeEventListener(e.type, false);
            }, false);
            addEventListener(self.video, 'third_quartile_ads', function (e) {
                if (self.current_creative.event_links.thirdQuartile) {
                    self.tracking(self.current_creative.event_links.thirdQuartile);
                }
                log("View third quartile ads video..")
                // removeEvent(self.video, 'midpoint_ads', false);
                // e.target.removeEventListener(e.type, false);
            }, false);
            addEventListener(self.video, 'complete_ads', function (e) {
                if (self.current_creative.event_links.complete) {
                    self.tracking(self.current_creative.event_links.complete);
                }
                log("Ad Ended..")
            }, false);
            addEventListener(self.video, 'mute_ads', function (e) {
                if (self.current_creative.event_links.mute) {
                    self.tracking(self.current_creative.event_links.mute);
                }
                log("Ad muted..")
            }, false);
            addEventListener(self.video, 'unmute_ads', function (e) {
                if (self.current_creative.event_links.unmute) {
                    self.tracking(self.current_creative.event_links.unmute);
                }
                log("Ad unmuted..")
            }, false);
            addEventListener(self.video, 'pause_ads', function (e) {
                if (self.current_creative.event_links.pause) {
                    self.tracking(self.current_creative.event_links.pause);
                }
                log("Ad pause..");
                document.getElementById('ads_play_center_div').style.display = 'block';
                clearInterval(ad_duration_timer);
            }, false);
            addEventListener(self.video, 'resume_ads', function (e) {
                if (self.current_creative.event_links.resume) {
                    self.tracking(self.current_creative.event_links.resume);
                }
                log("Ad resume..");
                document.getElementById('ads_play_center_div').style.display = 'none';
            }, false);
            addEventListener(self.video, 'skip', function (e) {
                self.third_start_ads = null;
                if (self.current_creative.event_links.skip)
                    self.tracking(self.current_creative.event_links.skip)
                log("Ad skip..");
                clearInterval(ad_duration_timer);
            }, false);
            addEventListener(self.video, 'imp_ads', function (e) {
                if (self.current_ad.imp)
                    self.tracking(self.current_ad.imp);
                if (self.sp.options.callbacks["AdImpression"]) {
                    self.sp.options.callbacks["AdImpression"]();
                }
                log("Ads video canplay & send imp..");
                ad_duration_timer = setInterval(function () {
                    if (!self.video.paused) {
                        self.ads_controls.ads_controls_time_duration.innerHTML--;
                    }
                }, 1000);
            }, false);

            //bind controls
            self.video.addEventListener("timeupdate", function () {
                self.ads_controls.currentTime.textContent = formatTime(self.video.currentTime);
                var progress = Math.floor(self.video.currentTime) / Math.floor(self.video.duration);
                var ads_current = self.ads_controls.progress_current;
                var ads_total = self.ads_controls.progress_total;
                ads_current.style.width = Math.floor(progress * ads_total.clientWidth) + "px";

                var event_time;
                self.current_creative.event_links_progress.forEach( function (item, i, arr) {
                    if (item.offset.indexOf('%') >= 0) {
                        var time = item.offset.split('%');
                        var event_time = time[0] * Math.floor(self.video.duration) / 100;
                        if (event_time <= self.video.currentTime) {
                            self.tracking(item.url);
                            self.current_creative.event_links_progress.splice(item, 1);
                        }
                    } else {
                        event_time = AdProgressEventOffsetTimeFormat(item.offset);
                        if (event_time <= self.video.currentTime) {
                            self.tracking(item.url);
                            self.current_creative.event_links_progress.splice(item, 1);
                        }
                    }
                });

                if (progress >= 0.25 && !self.first_quartile_ads) {
                    triggerEvent(self.video, 'first_quartile_ads', {});
                    self.first_quartile_ads = true;
                    //removeEvent(self.video, 'first_quartile_ads', {});
                }
                if (progress >= 0.5 && !self.disable_midpoint_ads) {
                    triggerEvent(self.video, 'midpoint_ads', {});
                    self.disable_midpoint_ads = true;
                }
                if (progress >= 0.75 && !self.third_quartile_ads) {
                    triggerEvent(self.video, 'third_quartile_ads', {});
                    self.third_quartile_ads = true;
                }
            }, false);

            self.video.onerror = function () {
                if (self.sp.options.callbacks["VideoError"]) {
                    self.sp.options.callbacks["VideoError"]('Ad', self.video.error.code);
                }
            };

            //Реклама закончилась
            self.video.addEventListener("ended", function () {
                triggerEvent(self.video, 'complete_ads', {});
                console.log(self.current_creative.event_links_progress);
                clearInterval(ad_duration_timer);
                self.third_start_ads = null;
                console.log('MAXADS:', self.sp.ads_video.maxAds);

                self.tryNextAd();

            }, false);

            //Реклама началась
            self.video.addEventListener("play", function () {
                self.sp.content_video.hide();

                self.ads_controls.playpause.classList.remove("play_icon");
                self.ads_controls.playpause.classList.add("pause_icon");
                //fix only first click
                if (!self.third_start_ads) {
                    triggerEvent(self.video, 'start_ads', {});
                    if (_g.sp.options.callbacks["AdsStarted"] && !self.all_ads_roll_started) {
                        _g.sp.options.callbacks["AdsStarted"]();
                        self.all_ads_roll_started = true;
                    }
                    self.third_start_ads = true;
                }
                //fix first click
                triggerEvent(self.video, 'resume_ads', {});
            }, false);

            //Реклама может воспроизводиться
            self.video.addEventListener("canplay", function () {
                if (UTILS.isMobile()) {
                    triggerEvent(self.ads_controls.dynamic, 'click');
                    self.video.play();
                }
                triggerEvent(self.video, 'imp_ads', {});
            }, false);

            //Реклама приостановлена
            self.video.addEventListener("pause", function () {
                self.ads_controls.playpause.classList.add("play_icon");
                self.ads_controls.playpause.classList.remove("pause_icon");
            }, false);

            //fullscreen
            this.ads_controls.fullscreen.addEventListener("click", function () {
                self.fullscreen();
            }, false);
            //play/pause
            this.ads_controls.playpause.addEventListener("click", function () {
                self.togglePlayback();
                if (self.video.paused) {
                    triggerEvent(self.video, 'pause_ads', {});
                }
            }, false);

            this.ads_controls.ads_play_center_btn.addEventListener("click", function () {
                self.togglePlayback();
                if (self.video.paused) {
                    triggerEvent(self.video, 'pause_ads', {});
                }
            }, false);
            //mute/unmute
            this.ads_controls.dynamic.addEventListener("click", function () {
                var classes = this.getAttribute("class");
                var enable = true;
                var videos_volume = self.video.volume * 100;
                if (new RegExp('\\mute_icon\\b').test(classes)) {
                    classes = classes.replace(" mute_icon", " volume_icon");
                    enable = true;
                    //document.getElementsByClassName("control_volumeBar")[1].style.width = videos_volume + '%';
                } else {
                    classes = classes.replace(" volume_icon", " mute_icon");
                    enable = false;
                    //document.getElementsByClassName("control_volumeBar")[1].style.width = '0%';
                }

                this.setAttribute("class", classes);

                if (!enable) {
                    triggerEvent(self.video, 'mute_ads', {});
                } else {
                    triggerEvent(self.video, 'unmute_ads', {});
                }

                self.video.muted = !self.video.muted;
            }, false);

            this.video.addEventListener('click', function () {
                if (self.current_vast.getCurrentVideoLink()) {
                    window.open(self.current_vast.getCurrentVideoLink());
                }
                if (self.current_vast.getCurrentVideoTrackingLink()) {
                    self.tracking(self.current_vast.getCurrentVideoTrackingLink());
                }
                log('Video cliсked..');
            }, false);


            this.ads_controls.ads_skip.addEventListener("click", function () {
                triggerEvent(self.video, 'skip', {});

                self.tryNextAd()

            }, false);

            this.ads_controls.volume_bar.addEventListener("click", function (e) {
                var offset = offsetEl(this);
                var x = (e.pageX - offset.left) / this.clientWidth;
                self.sp.setVolume(x);

                if (self.video.muted = true) {
                    self.video.muted = false;//unmuted
                    //self.ads_controls.volume_bar_span.classList.remove('mute_icon');
                    //self.ads_controls.volume_bar_span.classList.add('volume_icon');
                }

            }, false);

        },
        nextAD: function () {
            var self = this;
            var have_next = this.current_vast.nextAD();
            var type = this.current_vast.getCurrentMediaType();
            if (have_next) {
                if (!self.sp.ads_video.maxAds) {
                    if (type === 'VPAID') {
                        self.video.pause();
                        self.hide();
                        self.startAds(self.current_roll);
                    } else {
                        self.hide_vpaid();
                        self.startAds(self.current_roll);
                    }
                } else {
                    if (self.sp.ads_video.maxAds > self.sp.ads_video.сurrent_ads_numer) {
                        if (type === 'VPAID') {
                            self.video.pause();
                            self.hide();
                            self.startAds(self.current_roll);
                        } else {
                            self.hide_vpaid();
                            self.startAds(self.current_roll);
                        }
                    } else {
                        self.sp.ads_video.сurrent_ads_numer = 0;
                        this.video.pause();
                        this.hide();
                        this.hide_vpaid();
                        this.sp.content_video.show();
                        if (this.current_roll != 'postroll') {
                            this.sp.content_video.video.play();
                        }
                    }
                }
            } else {
                this.video.pause();
                this.hide();
                this.hide_vpaid();
                this.sp.content_video.show();
                if (this.current_roll != 'postroll') {
                    this.sp.content_video.video.play();
                }
                self.sp.ads_video.сurrent_ads_numer = 0;
            }
        },
        //SHOW ADS PLAYER
        show: function () {
            document.getElementById('ads-player').style.display = 'block';
        },
        //HIDE ADS PLAYER
        hide: function () {
            document.getElementById('ads-player').style.display = 'none';
        },
        show_vpaid: function () {
            document.getElementById('vpaid-player').style.display = 'block';
        },
        hide_vpaid: function () {
            document.getElementById('vpaid-player').style.display = 'none';
        },
        nextADVPAID: function () {
            var self = this;
            if (!self.vpaid_frame) {
                return; //УЖЕ УБРАН
            }
            UTILS.removeElement(self.vpaid_frame);

            self.tryNextAd();
        },
        //GENERATE ADS PLAYER
        makeControls: function () {
            var self = this;

            var ads_block = createElement('div', {id: 'ads-player'});
            ads_block.style.display = 'none';

            ads_block.style.width = self.sp.options.width;
            ads_block.style.height = self.sp.options.height;

            var block_holder = createElement('div', {class: 'holder2'});

            //VPAID PLAYER init
            var vpaid_ads_block = createElement('div', {id: 'vpaid-player'});
            vpaid_ads_block.style.display = 'none';

            vpaid_ads_block.style.width = self.sp.options.width;
            vpaid_ads_block.style.height = self.sp.options.height;

            var vpaid_block = createElement('div', {class: 'holder2'});
            var vpaid_video = document.createElement('video', {id: 'vpaid_ads_video'});
            vpaid_video.setAttribute('class', 'vpaid_video');
            vpaid_video.setAttribute('autoplay', 'true');


            vpaid_block.appendChild(vpaid_video);
            vpaid_ads_block.appendChild(vpaid_block);
            //****************

            //video
            var videlem = createElement('video');
            videlem.style.backgroundColor = 'black';
            videlem.setAttribute('autoplay', 'true');

            videlem.style.width = '100%';
            videlem.style.height = '100%';

//            videlem.setAttribute("width", 800);
//            videlem.setAttribute("height", 600);

            /// ... some setup like poster image, size, position etc. goes here...
            /// now, add sources:
            // var sourceMP4 = createElement('source', {type: "video/mp4"});//src: null,
            // videlem.appendChild(sourceMP4);
            //controls

            var play_center_div = createElement('div');
            play_center_div.setAttribute('id', 'ads_play_center_div');

            block_holder.appendChild(play_center_div);
            var play_center_div_btn = createElement('div', {class: 'play_center'});
            var ads_play_center_circle = createElement('div', {class: 'play_center_circle'});

            play_center_div.appendChild(play_center_div_btn);
            play_center_div_btn.appendChild(ads_play_center_circle);

            var ads_top_div = createElement('div', {class: 'ads_top_div'});
            block_holder.appendChild(ads_top_div);

            var ads_logo_div = createElement('div', {class: 'ads_logo_div'});

            var ads_time_div = createElement('div', {class: 'ads_time_div'});
            var ads_time_span = createElement('span', {class: 'ads_time_span'});
            ads_time_span.innerHTML = 'Реклама:';
            var ads_controls_time_duration = createElement('span', {class: 'time-duration'});
            ads_controls_time_duration.innerHTML = '00:00';
            var ads_controls_time_duration_text = createElement('span');
            ads_controls_time_duration_text.innerHTML = 'секунд';
            ads_time_span.appendChild(ads_controls_time_duration);
            ads_time_span.appendChild(ads_controls_time_duration_text);

            ads_top_div.appendChild(ads_logo_div);
            ads_time_div.appendChild(ads_time_span);
            var ads_logo_a = createElement('a');
            ads_logo_a.href = "#";
            var ads_logo_icon = createElement('div', {class: 'ads_logo_icon'});
            ads_logo_div.appendChild(ads_logo_a);
            ads_logo_a.appendChild(ads_logo_icon);
            ads_logo_div.appendChild(ads_time_div);


            var ads_share_div = createElement('div', {class: 'ads_share_div'});
            ads_top_div.appendChild(ads_share_div);
            // var ads_share_icon = createElement('div', {class: 'ads_share_icon'});
            // ads_share_div.appendChild(ads_share_icon);


            var ads_reklama = createElement('div', {class: 'reklama'});
            var ads_time = createElement('div', {class: 'time-reklama'});

            var ads_mute_box = createElement('div', {class: 'ads_mute_box'});
            var ads_controls_volume_div = createElement('div', {class: 'controls_volume_div'});
            var ads_control_dynamic = createElement('span', {class: 'dynamic volume_icon'});
            ads_mute_box.appendChild(ads_controls_volume_div);
            ads_controls_volume_div.appendChild(ads_control_dynamic);
            ads_reklama.appendChild(ads_mute_box);

            var ads_link = createElement('div', {class: 'ads-link-box'});
            var ads_link_a = createElement('a');
            ads_link_a.href = "#";
            ads_link_a.innerHTML = "Перейти на сайт рекламодателя";
            ads_link.appendChild(ads_link_a);


            var ads_time_span = createElement('span');
            ads_time_span.innerHTML = 'Ads <i id="current-ads">1</i> of <i id="sp-total-ads">1</i>';//Ads 1 of 3 - 0:00
            //var ads_progress = createElement('span', {class: 'progress-reklama'});
            var ads_total_bar = createElement('span', {class: 'total-bar'});
            var ads_current_bar = createElement('span', {class: 'current-bar'});
            var ads_img_reklama = createElement('div', {class: 'img-reklama'});
            var ads_btn = createElement('div', {class: 'wraper-reklama'});
            var ads_skip = createElement('div', {class: 'skip'});


            //Class 'wraper-reklama' elements

            var ads_h2_wrapper = createElement('span', {class: 'text'});
            ads_h2_wrapper.innerHTML = 'Пропустить через:  ';

            var ads_timer_wrapper = createElement('span', {class: 'timer_inp'});
            ads_timer_wrapper.innerHTML = '0';

            var ads_span_wrapper = createElement('span');
            ads_span_wrapper.innerHTML = ' секунд';

            ads_h2_wrapper.appendChild(ads_timer_wrapper);
            ads_h2_wrapper.appendChild(ads_span_wrapper);

            var ads_skip_link = createElement('a');
            // ads_skip_link.innerHTML = '<img src="/img/iab_tech_lab.jpg">';

            //********

            //Class 'skip' elements

            var ads_skipdiv_link = createElement('a');
            ads_skipdiv_link.innerHTML = 'Пропустить';

            //*********************

            var ads_controls = createElement('div', {class: 'controls'});
            var progress_div_ads = createElement('div', {class: 'controls_div'});
            //var ads_controls_buttons_div = createElement('div', {class: 'controls_2div'});
            ads_controls.appendChild(progress_div_ads);
            //ads_controls.appendChild(ads_controls_buttons_div);


            //Create PLAY/PAUSE & CONTROLS OTHERS
            var ads_controls_playpause = createElement('div', {class: 'controls_playpause'});
            var ads_controls_others = createElement('div', {class: 'controls_others'});

            //CHIELS PLAY/PAUSE & CONTROLS OTHERS TO CONTROLS_2DIV
            //ads_controls_buttons_div.appendChild(ads_controls_playpause);
            //ads_controls_buttons_div.appendChild(ads_controls_others);


            var ads_control_playpause_icon = createElement('i', {class: 'playpause play_icon'});
            ads_controls_playpause.appendChild(ads_control_playpause_icon);
            var ads_separator_one = createElement('div', {class: 'separators'});
            ads_controls_playpause.appendChild(ads_separator_one);


            var ads_controls_volume_div = createElement('div', {class: 'controls_volume_div'});
            //var ads_control_dynamic = createElement('span', {class: 'dynamic volume_icon'});
            var ads_control_volume_percent = createElement('div', {class: 'control_volume_percent'});
            var ads_control_volume_bar_span = createElement('span', {class: 'control_volumeBar volume_icon_select'});
            //ads_controls_volume_div.appendChild(ads_control_dynamic);
            ads_controls_volume_div.appendChild(ads_control_volume_percent);
            ads_control_volume_percent.appendChild(ads_control_volume_bar_span);
            ads_controls_others.appendChild(ads_controls_volume_div);

            var ads_controls_others_separators_one = createElement('div', {class: 'separators'});
            ads_controls_others.appendChild(ads_controls_others_separators_one);


            var ads_controls_time_div = createElement('div', {class: 'controls_time_div'});
            ads_controls_others.appendChild(ads_controls_time_div);
            var ads_controls_time_span = createElement('span', {class: 'time'});
            ads_controls_time_span.innerHTML = "00:00";
            var ads_controls_time_separator = createElement('span', {class: 'separator'});
            ads_controls_time_separator.innerHTML = '/';
            //var ads_controls_time_duration = createElement('span', {class: 'time-duration'});
            //ads_controls_time_duration.innerHTML = '00:00';
            ads_controls_time_div.appendChild(ads_controls_time_span);
            ads_controls_time_div.appendChild(ads_controls_time_separator);
            //ads_controls_time_div.appendChild(ads_controls_time_duration);

            var ads_controls_others_separators_two = createElement('div', {class: 'separators'});
            ads_controls_others.appendChild(ads_controls_others_separators_two);


            var ads_controls_fs_div = createElement('div', {class: 'controls_fs_div'});
            ads_controls_others.appendChild(ads_controls_fs_div);

            var ads_fullscreen_btn = createElement('i', {class: 'alt fullscreen'});
            ads_controls_fs_div.appendChild(ads_fullscreen_btn);


            /*ads_controls.appendChild(progress_div_ads);
             ads_controls.appendChild(ads_controls_buttons_div);*/

            //var playpause_ads_div = createElement('div', {class: 'controls_playpause'});
            //ads_controls_buttons_div.appendChild(playpause_ads_div);

            //var volume_ads_div = createElement('div', {class: 'controls_volume_div_ads'});
            //ads_controls_buttons_div.appendChild(volume_ads_div);


            //progress
            var ads_control_progress = createElement('span', {class: 'progress'});
            var ads_control_progress_el_total = createElement('span', {class: 'total'});
            var ads_control_progress_el_current = createElement('span', {class: 'current'});
            var ads_control_progress_el_load = createElement('span', {class: 'load'});
            progress_div_ads.appendChild(ads_control_progress);
            progress_div_ads.appendChild(ads_control_progress_el_total);
            progress_div_ads.appendChild(ads_control_progress_el_current);
            progress_div_ads.appendChild(ads_control_progress_el_load);


            var ads_control_progress_el_current_circle = createElement('span', {class: 'current_circle'});
            ads_control_progress_el_current.appendChild(ads_control_progress_el_current_circle);

            //playpause

            //playpause_ads_div.appendChild(ads_control_playpause);
            //progress
            /*var ads_control_progress = createElement('span', {class: 'progress'});
             var ads_control_progress_el_total = createElement('span', {class: 'total'});
             var ads_control_progress_el_current = createElement('span', {class: 'current'});
             var ads_control_progress_el_load = createElement('span', {class: 'load'});*/
            //dynamic


            //ads_control_progress.appendChild(ads_control_progress_el_total);
            //ads_control_progress.appendChild(ads_control_progress_el_current);
            //ads_control_progress.appendChild(ads_control_progress_el_load);

            //ads_controls.appendChild(ads_control_playpause);
            //ads_controls.appendChild(ads_control_progress);
            //volume_ads_div.appendChild(ads_control_dynamic);


            //Ads block appendChild
            block_holder.appendChild(ads_reklama);
            //ads_reklama.appendChild(ads_time);
            ads_reklama.appendChild(ads_link);
            ads_time.appendChild(ads_time_span);
            ads_mute_box.appendChild(ads_time);
            //ads_reklama.appendChild(ads_progress);
            //ads_progress.appendChild(ads_total_bar);
            //ads_progress.appendChild(ads_current_bar);
            ads_reklama.appendChild(ads_img_reklama);
            ads_img_reklama.appendChild(ads_btn);
            ads_img_reklama.appendChild(ads_skip);

            //Class 'wrapper-reklama' appendChild

            ads_btn.appendChild(ads_h2_wrapper);
            //ads_btn.appendChild(ads_timer_wrapper);
            //ads_btn.appendChild(ads_span_wrapper);
            ads_btn.appendChild(ads_skip_link);

            //***********************************

            //Class 'skip' appendChild

            ads_skip.appendChild(ads_skipdiv_link);

            //************************

            this.ads_controls.playpause = ads_control_playpause_icon;
            this.ads_controls.ads_play_center_btn = play_center_div_btn;
            this.ads_controls.progress_total = ads_control_progress_el_total;
            this.ads_controls.progress_current = ads_control_progress_el_current;
            this.ads_controls.progress_load = ads_control_progress_el_load;
            this.ads_controls.dynamic = ads_control_dynamic;
            this.ads_controls.fullscreen = ads_controls_fs_div;
            this.ads_controls.volume_bar = ads_control_volume_percent;
            this.ads_controls.volume_bar_span = ads_control_volume_bar_span;
            this.ads_controls.ads_btn = ads_btn;
            this.ads_controls.ads_skip = ads_skip;
            this.ads_controls.ads_timer = ads_timer_wrapper;
            this.ads_controls.currentTime = ads_controls_time_span;
            this.ads_controls.duration = ads_controls_time_duration;
            this.ads_controls.ads_link = ads_link_a;
            this.ads_controls.ads_controls_time_duration = ads_controls_time_duration;

            if (false) {//self._ads_data.creative_preroll.click_url
                var link = createElement('a', {href: this._ads_data.creative_preroll.click_url, target: '_blank'})
                link.appendChild(videlem);
                block_holder.appendChild(link);
            } else {
                block_holder.appendChild(videlem);
            }
            block_holder.appendChild(ads_controls);
            ads_block.appendChild(block_holder);

            this.sp.getMainBlock().appendChild(ads_block);
            this.sp.getMainBlock().appendChild(vpaid_ads_block);
            self.ads_controls.playpause = ads_control_playpause_icon;
            self.ads_controls.dynamic = ads_control_dynamic;
            self.video = videlem;
            self.video_player_block = vpaid_block;
            self.vpaid_video = vpaid_video;

            this.fullscreen_div = block_holder;
        }
    };

    function offsetEl(el) {
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return {top: rect.top + scrollTop, left: rect.left + scrollLeft}
    }

    var InlineCreative = function () {
        this.creative_video_url = null;
        this.click_url = null;
        this.event_links = {
            creativeView: null,
            start: null,
            midpoint: null,
            firstQuartile: null,
            thirdQuartile: null,
            complete: null,
            mute: null,
            unmute: null,
            pause: null,
            rewind: null,
            resume: null,
            fullscreen: null,
            expand: null,
            collapse: null,
            acceptInvitation: null,
            close: null,
            //v3
            closeLinear: null,
            skip: null,
            progress: null
        };
        return this;
    };
    InlineCreative.prototype.loadFromXML = function (item_cr) {
        var self = this;
        item_cr.querySelector("MediaFiles").childNodes.forEach(function (item_media, i_media, arr_media) {
            if (item_media.nodeName != "MediaFile") {
                return;
            }
            //определить подходящий для устройства, типа плеера, ширины канала элемент и ссылку на креатив.
            self.creative_video_url = item_media.textContent;
        });
        item_cr.querySelector("TrackingEvents").childNodes.forEach(function (item_ev, i_ev, arr_ev) {
            if (item_ev.nodeName != "Tracking") {
                return;
            }
            var event_name = item_ev.getAttribute('event');
            for (var propertyName in self.event_links) {
                if (propertyName == event_name)
                    self.event_links[propertyName] = item_ev.textContent;
            }
        });
        self.click_url = item_cr.querySelector("ClickThrough").textContent;
    };

    var PodsCreative = {
        creative_list: []
    }

    var NonlineCreative = function () {
        this.source = null;
        this.click_url = null;
        this.click_track = null;
    };
    NonlineCreative.prototype.loadFromXML = function (response) {
        this.source = response.querySelector("StaticResource").textContent.trim();
        this.click_url = response.querySelector("NonLinearClickThrough").textContent.trim();
        this.click_track = response.querySelector("NonLinearClickTracking").textContent.trim();
    };

    function flatten(object) {
        var check = _.isPlainObject(object) && _.size(object) === 1;
        return check ? flatten(_.values(object)[0]) : object;
    }


    var UTILS = {
        isMobile: function () {
            var isMobile = false; //initiate as false
// device detection
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
                || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) isMobile = true;
            return isMobile;
        },
        removeElement: function (element) {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        },
        insertAfter: function (referenceNode, newNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        },
        getRequest: function () {
            if (window.XMLHttpRequest) {
                return new XMLHttpRequest();
            } else {
                return new ActiveXObject("Microsoft.XMLHTTP");
            }
        },
        sendRequest: function (url, params, callback, method, dataType, errorCallback) {
            //console.log(url);
            try {
                var x = UTILS.getRequest();

                x.open(method ? method : 'POST', url, 1);
                x.withCredentials = true;
                // x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                if (dataType == 'xml') {
                    // Если указано, responseType должен быть пустой строкой или "document"
                    x.responseType = 'document';
                    // overrideMimeType() может быть использован, чтобы заставить ответ обрабатываться как XML
                    x.overrideMimeType('text/xml');
                }
                x.onreadystatechange = function () {
                    if (x.readyState == 4) {
                        if (x.status === 200 && callback) {
                            callback(x.responseXML, x);
                        } else {
                            var x2 = UTILS.getRequest();
                            x2.open(method ? method : 'POST', url, 1);
                            // x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                            x2.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                            if (dataType == 'xml') {
                                // Если указано, responseType должен быть пустой строкой или "document"
                                x2.responseType = 'document';
                                // overrideMimeType() может быть использован, чтобы заставить ответ обрабатываться как XML
                                x2.overrideMimeType('text/xml');
                            }
                            x2.onreadystatechange = function () {
                                if (x2.readyState > 3) {
                                    if (x2.status === 200 && callback) {
                                        callback(x2.responseXML, x2);
                                    } else if (errorCallback) {
                                        errorCallback(x2.responseXML, x2);
                                    }
                                }
                            };
                            x2.send(params);
                        }
                    } else {
                        console.log('Status:', x.status);
                    }
                };
                x.send(params);
            } catch (e) {
                window.console && console.log(e);
            }
        },
        parse: function (xml) {
            // Create the return object
            var obj = {};

            if (xml.nodeType == 1) { // element
                // do attributes
                if (xml.attributes.length > 0) {
                    obj["@attributes"] = {};
                    for (var j = 0; j < xml.attributes.length; j++) {
                        var attribute = xml.attributes.item(j);
                        obj["@attributes"][attribute.nodeName] = attribute.nodeValue.trim();
                    }
                }
            } else if (xml.nodeType == 3) { // text
                obj = xml.nodeValue.trim();
            } else if (xml.nodeType == 4) { // text
                obj = xml.textContent.trim();
            }

            // do children
            if (xml.hasChildNodes()) {
                for (var i = 0; i < xml.childNodes.length; i++) {
                    var item = xml.childNodes.item(i);
                    var nodeName = item.nodeName;
                    if (nodeName == '#text' && !item.textContent.trim()) {
                        continue;
                    }
                    if (typeof(obj[nodeName]) == "undefined") {
                        if (item.nodeName == '#cdata-section') {
                            obj['VALUE'] = UTILS.parse(item);
                        } else {
                            obj[nodeName] = UTILS.parse(item);
                        }
                    } else {
                        if (typeof(obj[nodeName].push) == "undefined") {
                            var old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(UTILS.parse(item));
                    }
                }
            }
            return obj;
        }
    };

    var VAST = function () {
        this.version = null;
        this._xml = null;
        this.ads = [];
        this._data = null;
        this._data_current_ad = null;
        this.sequence = 1;
        this.requests = 0;
        this.event_link_progress = [];
        this.linkQueue = [];
    };
    VAST.prototype = {
        version: null,
        _xml: null,
        ads: [],
        _data: null,
        _data_current_ad: null,
        // _data_current_creative: [],
        sequence: 1,
        requests: 0
    };
    /* получаем данные васт */
    VAST.prototype.loadData = function (url, callback) {
        var self = this;
        self.requests++;

        var targetUrl = url;

        if (typeof url == 'object') {
            self.linkQueue = url;
            targetUrl = self.linkQueue.shift();
        }

        UTILS.sendRequest(targetUrl, {}, function (response) {
            self.requests--;
            self._xml = response;
            if (response) {
                var data_json = UTILS.parse(response);
                if (data_json && data_json.VAST) {

                    var ads = [];
                    if (Array.isArray(data_json.VAST.Ad)) {
                        ads = data_json.VAST.Ad;
                    } else {
                        ads = [data_json.VAST.Ad];
                    }
                    ads.forEach(function (item, i, arr) {
                        if (item) {
                            if (item.Wrapper) {
                                var url = item.Wrapper.VASTAdTagURI.VALUE;
                                self.loadData(url, function () {
                                    if (self.requests === 0) {
                                        callback();
                                    }
                                });
                            } else {
                                item.vast_version = response.querySelector("VAST").getAttribute("version");
                                self.ads.push(item);
                            }
                        }
                    });
                }
            }
            //console.log(self.requests);
            if (self.requests === 0) {
                if (self.ads.length === 0 && self.linkQueue.length === 0) {
                    if (_g.sp.options.callbacks["NoAds"]) {
                        _g.sp.options.callbacks["NoAds"]();
                    }
                    callback();
                } else if (self.ads.length === 0 && self.linkQueue.length > 0) {
                    self.tryVastLinks(self.linkQueue);
                } else {
                    callback();
                }
            }
        }, 'GET', 'xml');
    };
    /* получает текущий AD */
    VAST.prototype.getCurrentAD = function () {
        return this.getAD(this.sequence);
    };

    VAST.prototype.getCurrentVASTVersion = function () {
        var ad = this.getCurrentAD();
        var result = ad.vast_version;
        return result;
    };
    /* инициализирует следующий AD
     * return false - если следующего нету
     */
    VAST.prototype.nextAD = function () {
        this.sequence++;
        this._data_current_ad = this.getAD(this.sequence);
        if (!this._data_current_ad) {
            return false;
        } else {
            return true;
        }
    };
    /* получаем AD по номеру */
    VAST.prototype._getADBySequense = function (sequense) {
        var self = this;
        var ad = null;
        if (Array.isArray(this._data.VAST.Ad)) {
            this._data.VAST.Ad.forEach(function (item, i, arr) {
                if (item['@attributes'].sequence == sequense) {
                    ad = item
                }
            });
        }
        return ad;
    };
    VAST.prototype.getADList = function () {
        return this.ads ? this.ads : [];
    };
    VAST.prototype.getAD = function (sequense) {
        var s = sequense - 1;
        if (s in this.getADList()) {
            return this.getADList()[s];
        }
        return null;
    };
    /** получаем количество креативов (например количество (AD) видео для проигрывания)*/
    VAST.prototype.getCountCreatives = function (sequense) {
        var self = this;
        var count = 0;
        if (Array.isArray(this._data.VAST.Ad)) {
            this._data.VAST.Ad.forEach(function (item, i, arr) {
                count++;
            });
        } else if (this._data.VAST.Ad) {
            count++;
        }
        return count;
    };
    /** получаем количество креативов (например количество (AD) видео для проигрывания)*/
    VAST.prototype.getCountAD = function (sequense) {
        return this.ads.length;
    };
    /** возвращает текущий креатив */
    VAST.prototype.getCurrentCreative = function () {
        var ad = this.getCurrentAD();
        if (!ad) {
            return;
        }

        var creative = ad.InLine.Creatives.Creative;
        if (Array.isArray(creative)) {
            creative = creative[0];
        }
        creative.event_links = {};
        creative.event_links_progress = [];
        if (creative.Linear.TrackingEvents && creative.Linear.TrackingEvents.Tracking) {

            var ic = new InlineCreative();
            creative.Linear.TrackingEvents.Tracking.forEach(function (item, i, ar) {
                var event_name = item['@attributes'].event;
                for (var propertyName in ic.event_links) {
                    if (propertyName == event_name) {
                        if (propertyName == "progress") {
                            var event_progress_object = {
                                url: null,
                                offset: null
                            };
                            event_progress_object.url = item.VALUE ? item.VALUE : item['#text'];
                            event_progress_object.offset = item['@attributes'].offset;
                            creative.event_links_progress.push(event_progress_object);
                        }
                        creative.event_links[propertyName] = item.VALUE ? item.VALUE : item['#text'];
                    }
                }
            });

        }
        return creative;
    };

    VAST.prototype.getCurrentSkipTime = function () {
        var ad = this.getCurrentAD();
        var skipOffSet = null;
        if (!ad) {
            return;
        }

        var vast_version = this.getCurrentVASTVersion();
        if (vast_version == "2.0") {
            var extensions = ad.InLine.Extensions.Extension;
            extensions.forEach(function (item, i, ar) {
                var ex_type = item['@attributes'].type;
                if (ex_type == 'skipTime') {
                    skipOffSet = item.VALUE;
                }
            });
        } else {
            var creative = this.getCurrentCreative();
            skipOffSet = creative.Linear['@attributes'].skipoffset;
        }
        return skipOffSet;

    };


    VAST.prototype.getCurrentDuration = function () {
        var creative = this.getCurrentCreative();
        var duration = null;
        duration = creative.Linear.Duration['#text'];
        return duration;
    };

    /** возвращает текущие параметры */
    VAST.prototype.getCurrentAdParameters = function () {
        var ad = this.getCurrentAD();
        if (!ad) {
            return;
        }
        var current_creative = this.getCurrentCreative();
        var Parameters = null;
        if (current_creative) {
            if (Array.isArray(current_creative.Linear.AdParameters)) {
                Parameters = current_creative.Linear.AdParameters[0];
            } else {
                Parameters = current_creative.Linear.AdParameters;
            }
            if (Parameters && Parameters.VALUE) {
                return Parameters.VALUE;
            } else if (Parameters && Parameters['#text']) {
                return Parameters['#text'];
            }
            return null;
        }
    };
    /** возвращает текущий media */
    VAST.prototype.getCurrentMedia = function () {
        var creative = this.getCurrentCreative();
        var mediaFile = null;
        if (creative) {
            if (Array.isArray(creative.Linear.MediaFiles.MediaFile)) {
                creative.Linear.MediaFiles.MediaFile.forEach(function (item, i, arr) {
                    if (item['@attributes'].apiFramework == 'VPAID' && item['@attributes'].type === 'application/javascript') {
                        mediaFile = item;
                    }
                });
            } else {
                mediaFile = creative.Linear.MediaFiles.MediaFile;
            }
            if (mediaFile && mediaFile.VALUE) {
                return mediaFile.VALUE;
            } else if (mediaFile && mediaFile['#text']) {
                return mediaFile['#text'];
            }
            return null;
        }
    };
    /** возвращает тип текущего media */
    VAST.prototype.getCurrentMediaType = function () {
        var creative = this.getCurrentCreative();
        var mediaFile = null;
        if (creative) {
            if (Array.isArray(creative.Linear.MediaFiles.MediaFile)) {
                mediaFile = creative.Linear.MediaFiles.MediaFile[0];
            } else {
                mediaFile = creative.Linear.MediaFiles.MediaFile;
            }
        }
        if (mediaFile && mediaFile['@attributes']) {
            return mediaFile['@attributes'].apiFramework
        }
        return null;
    };

    VAST.prototype.getCurrentVideoLink = function () {
        var creative = this.getCurrentCreative();
        var adLink = null;
        if (creative) {
            if (creative.Linear.VideoClicks) {
                adLink = creative.Linear.VideoClicks.ClickThrough;
            }
        }
        if (adLink && adLink.VALUE) {
            return adLink.VALUE;
        } else if (adLink && adLink['#text']) {
            return adLink['#text'];
        }
        return null;
    };

    VAST.prototype.getCurrentVideoTrackingLink = function () {
        var creative = this.getCurrentCreative();
        var trackingVideoLink = null;
        if (creative) {
            if (creative.Linear.VideoClicks) {
                if (creative.Linear.ClickTracking) {
                    trackingVideoLink = creative.Linear.VideoClicks.ClickTracking;
                }
            }
        }
        if (trackingVideoLink && trackingVideoLink.VALUE) {
            return trackingVideoLink.VALUE;
        } else if (trackingVideoLink && trackingVideoLink['#text']) {
            return trackingVideoLink['#text'];
        }
        return null;
    };

    function addEventListener(el, eventName, handler) {
        if (el.addEventListener) {
            el.addEventListener(eventName, handler, false);
        } else {
            el.attachEvent('on' + eventName, function () {
                handler.call(el);
            });
        }
        //el.addEventListener(eventName, handler);
    }

    function removeEvent(obj, type, fn) {
        if (obj.detachEvent) {
            obj.detachEvent('on' + type, obj[type + fn]);
            obj[type + fn] = null;
        } else {
            obj.removeEventListener(type, false);
        }
    }

    function triggerEvent(el, eventName, options) {
        var event = null;
        if (document.createEventObject) {
            //IE
            event = document.createEventObject();
            el.fireEvent(eventName, event);
        }
        else {
            //others
            event = document.createEvent('CustomEvent');
            event.initEvent(eventName, true, true);
            el.dispatchEvent(event);
        }
    }

    function formatTime(seconds) {
        var h, m, s, result = '';
        // HOURs
        h = Math.floor(seconds / 3600);
        seconds -= h * 3600;
        if (h) {
            result = h < 10 ? '0' + h + ':' : h + ':';
        }
        // MINUTEs
        m = Math.floor(seconds / 60);
        seconds -= m * 60;
        result += m < 10 ? '0' + m + ':' : m + ':';
        // SECONDs
        s = Math.floor(seconds % 60);
        result += s < 10 ? '0' + s : s;
        return result;
    }

    function skipTimeFormat(hms, with_milliseconds) {
        var a = hms.split(':');
        if (with_milliseconds) {
            a = a.slice(0, -1)
        }
        if (a.length == 3) {
            //with hours
            return (+parseInt(a[0])) * 60 * 60 + (+parseInt(a[1])) * 60 + (+parseInt(a[2]));
        } else {
            return (+parseInt(a[0])) * 60 + (+parseInt(a[1]));
        }
    }

    function AdDurationFormat(hms) {
        var a = hms.split(':');
        if (a.length == 3) {
            return (+parseInt(a[0])) * 60 * 60 + (+parseInt(a[1])) * 60 + (+parseInt(a[2]));
        } else {
            return (+parseInt(a[0])) * 60 + (+parseInt(a[1]));
        }
    }

    function AdProgressEventOffsetTimeFormat(hms) {
        var time = hms.split('.');
        var a = time[0].split(':');
        if (a.length == 3) {
            return (+parseInt(a[0])) * 60 * 60 + (+parseInt(a[1])) * 60 + (+parseInt(a[2]));
        } else {
            return (+parseInt(a[0])) * 60 + (+parseInt(a[1]));
        }
    }

    function log(data) {
        var isIE = false || !!document.documentMode;
        if (isIE == true) {
            window.console.log(data);
            window.console.dir();
        }
        console.trace();
        console.log(data);
    }

    function createElement(tag, params) {
        params = params ? params : {};
        var el = document.createElement(tag);

        for (var propertyName in params) {
            if (propertyName == 'class') {
                if (typeof params.class === 'string') {
                    el.setAttribute('class', params.class);
                }
            } else {
                el.setAttribute(propertyName, params[propertyName]);
            }
        }
        return el;
    }

    var VPAIDWrapper = function (VPAIDCreative, event_links) {
        this.current_ad_time = '0';
        this.played = false;
        this.timer;

        this.event_links = event_links;
        this.checkVPAIDInterface = function (VPAIDCreative) {
            if (
                VPAIDCreative.handshakeVersion && typeof
                    VPAIDCreative.handshakeVersion == "function" && VPAIDCreative.initAd && typeof
                    VPAIDCreative.initAd == "function" &&
                VPAIDCreative.startAd && typeof VPAIDCreative.startAd == "function" &&
                VPAIDCreative.stopAd && typeof VPAIDCreative.stopAd == "function" &&
                VPAIDCreative.skipAd && typeof VPAIDCreative.skipAd == "function" &&
                VPAIDCreative.resizeAd && typeof VPAIDCreative.resizeAd == "function" &&
                VPAIDCreative.pauseAd && typeof VPAIDCreative.pauseAd == "function" &&
                VPAIDCreative.resumeAd && typeof VPAIDCreative.resumeAd == "function"
                &&
                VPAIDCreative.expandAd && typeof VPAIDCreative.expandAd == "function"
                &&
                VPAIDCreative.collapseAd && typeof VPAIDCreative.collapseAd == "function"
                &&
                VPAIDCreative.subscribe && typeof VPAIDCreative.subscribe == "function" &&
                VPAIDCreative.unsubscribe && typeof VPAIDCreative.unsubscribe ==
                "function") {
                return true;
            }
            return false;
        };
        this._creative = VPAIDCreative;
        if (!this.checkVPAIDInterface(VPAIDCreative)) {
            //The VPAIDCreative doesn't conform to the VPAID spec
            return;
        }
        this.setCallbacksForCreative();
        // This function registers the callbacks of each of the events
    }
    VPAIDWrapper.prototype.setCallbacksForCreative = function () {

        //The key of the object is the event name and the value is a reference to the

        var callbacks = {
            AdStarted: this.onStartAd,
            AdStopped: this.onStopAd,
            AdSkipped: this.onSkipAd,
            AdLoaded: this.onAdLoaded,
            AdLinearChange: this.onAdLinearChange,
            AdSizeChange: this.onAdSizeChange,
            AdExpandedChange: this.onAdExpandedChange,
            AdSkippableStateChange: this.onAdSkippableStateChange,
            AdDurationChange: this.onAdDurationChange,
            AdRemainingTimeChange: this.onAdRemainingTimeChange,
            AdVolumeChange: this.onAdVolumeChange,
            AdImpression: this.onAdImpression,
            AdClickThru: this.onAdClickThru,
            AdInteraction: this.onAdInteraction,
            AdVideoStart: this.onAdVideoStart,
            AdVideoFirstQuartile: this.onAdVideoFirstQuartile,
            AdVideoMidpoint: this.onAdVideoMidpoint,
            AdVideoThirdQuartile: this.onAdVideoThirdQuartile,
            AdVideoComplete: this.onAdVideoComplete,
            AdUserAcceptInvitation: this.onAdUserAcceptInvitation,
            AdUserMinimize: this.onAdUserMinimize,
            AdUserClose: this.onAdUserClose,
            AdPaused: this.onAdPaused,
            AdPlaying: this.onAdPlaying,
            AdError: this.onAdError,
            AdLog: this.onAdLog
        };
        // Looping through the object and registering each of the callbacks with the creative
        for (var eventName in callbacks) {
            this._creative.subscribe(callbacks[eventName],
                eventName, this);
        }
    };
    // Pass through for initAd - when the video player wants to call the ad
    VPAIDWrapper.prototype.initAd = function (width, height, viewMode, desiredBitrate, creativeData, environmentVars) {
        this._creative.initAd(width, height, viewMode, desiredBitrate, creativeData, environmentVars);
    };
    // Callback for AdPaused
    VPAIDWrapper.prototype.onAdPaused = function () {
        var self = this;
        self.played = false;
        clearInterval(self.timer);

        console.log("onAdPaused");
    };
    // Callback for AdPlaying
    VPAIDWrapper.prototype.onAdPlaying = function () {
        var self = this;
        self.played = true;
        console.log("onAdPlaying");
    };
    // Callback for AdError
    VPAIDWrapper.prototype.onAdError = function (message) {
        if (_g.sp.options.callbacks["AdsEnded"]) {
            _g.sp.options.callbacks["AdsEnded"]('vpaid');
        }
        console.log("onAdError: " + message);
        _g.sp.ads_video.nextADVPAID();
    };
    // Callback for AdLog
    VPAIDWrapper.prototype.onAdLog = function (message) {
        console.log("onAdLog: " + message);
    };
    // Callback for AdUserAcceptInvitation
    VPAIDWrapper.prototype.onAdUserAcceptInvitation = function () {
        console.log("onAdUserAcceptInvitation");
    };
    // Callback for AdUserMinimize
    VPAIDWrapper.prototype.onAdUserMinimize = function () {
        console.log("onAdUserMinimize");
    };
    // Callback for AdUserClose
    VPAIDWrapper.prototype.onAdUserClose = function () {
        console.log("onAdUserClose");
    };
    // Callback for AdUserClose
    VPAIDWrapper.prototype.onAdSkippableStateChange = function () {
        console.log("Ad Skippable State Changed to: " + this._creative.getAdSkippableState());
    };
    // Callback for AdUserClose
    VPAIDWrapper.prototype.onAdExpandedChange = function () {
        console.log("Ad Expanded Changed to: " + this._creative.getAdExpanded());
    };
    // Pass through for getAdExpanded
    VPAIDWrapper.prototype.getAdExpanded = function () {
        console.log("getAdExpanded");
        return this._creative.getAdExpanded();
    };
    // Pass through for getAdSkippableState
    VPAIDWrapper.prototype.getAdSkippableState = function () {
        console.log("getAdSkippableState");
        return this._creative.getAdSkippableState();
    };
    // Callback for AdSizeChange
    VPAIDWrapper.prototype.onAdSizeChange = function () {
        console.log("Ad size changed to: w=" + this._creative.getAdWidth() + " h=" + this._creative.getAdHeight());
    };
    // Callback for AdDurationChange
    VPAIDWrapper.prototype.onAdDurationChange = function () {
        // console.log("Ad Duration Changed to: " + this._creative.getAdDuration());
    };
    // Callback for AdRemainingTimeChange
    VPAIDWrapper.prototype.onAdRemainingTimeChange = function () {
        console.log("Ad Remaining Time Changed to: " + this._creative.getAdRemainingTime());
    };
    // Pass through for getAdRemainingTime
    VPAIDWrapper.prototype.getAdRemainingTime = function () {
        console.log("getAdRemainingTime");
        return this._creative.getAdRemainingTime();
    };
    // Callback for AdImpression
    VPAIDWrapper.prototype.onAdImpression = function () {
        if (this.event_links.impression) {
            _g.sp.ads_video.tracking(this.event_links.impression);
        }
        if (_g.sp.options.callbacks["AdImpression"]) {
            _g.sp.options.callbacks["AdImpression"]('vpaid');
        }
        console.log("Ad Impression");
    };
    // Callback for AdClickThru
    VPAIDWrapper.prototype.onAdClickThru = function (url, id, playerHandles) {
        console.log("Clickthrough portion of the ad was clicked");
    };
    // Callback for AdInteraction
    VPAIDWrapper.prototype.onAdInteraction = function (id) {
        console.log("A non-clickthrough event has occured");
    };
    // Callback for AdUserClose
    VPAIDWrapper.prototype.onAdVideoStart = function () {
        if (this.event_links.start) {
            _g.sp.ads_video.tracking(this.event_links.start);
        }
        console.log("Video 0% completed");
        var ads_lenght = VAST.prototype.getCountAD();
        console.log(ads_lenght);
    };
    // Callback for AdUserClose
    VPAIDWrapper.prototype.onAdVideoFirstQuartile = function () {
        if (this.event_links.firstQuartile) {
            _g.sp.ads_video.tracking(this.event_links.firstQuartile);
        }
        console.log("Video 25% completed");
    };
    // Callback for AdUserClose
    VPAIDWrapper.prototype.onAdVideoMidpoint = function () {
        if (this.event_links.midpoint) {
            _g.sp.ads_video.tracking(this.event_links.midpoint);
        }
        console.log("Video 50% completed");
    };
    // Callback for AdUserClose
    VPAIDWrapper.prototype.onAdVideoThirdQuartile = function () {
        if (this.event_links.thirdQuartile) {
            _g.sp.ads_video.tracking(this.event_links.thirdQuartile);
        }
        console.log("Video 75% completed");
    };
    // Callback for AdVideoComplete
    VPAIDWrapper.prototype.onAdVideoComplete = function () {
        if (this.event_links.complete) {
            _g.sp.ads_video.tracking(this.event_links.complete);
        }
        console.log("Video 100% completed");
    };
    // Callback for AdLinearChange
    VPAIDWrapper.prototype.onAdLinearChange = function () {
        console.log("Ad linear has changed: " + this._creative.getAdLinear())
    };
    // Pass through for getAdLinear
    VPAIDWrapper.prototype.getAdLinear = function () {
        console.log("getAdLinear");
        return this._creative.getAdLinear();
    };


    // Pass through for startAd()
    VPAIDWrapper.prototype.startAd = function () {
        console.log("startAd");
        if (UTILS.isMobile()) {
            _g.sp.ads_video.video.muted = true;
        }
        this._creative.startAd();
    };
    // Callback for AdLoaded
    VPAIDWrapper.prototype.onAdLoaded = function () {
        console.log("ad has been loaded");
        return this._creative.startAd();
    };
    // Callback for StartAd()
    VPAIDWrapper.prototype.onStartAd = function () {
        var self = this;

        console.log(_g.sp.ads_video.current_creative);

        if (this.event_links.creativeView) {
            _g.sp.ads_video.tracking(this.event_links.creativeView);
        }
        if (_g.sp.options.callbacks["AdsStarted"]) {
            _g.sp.options.callbacks["AdsStarted"]('vpaid');
        }
        _g.sp.ads_video.show_vpaid();
        _g.sp.content_video.hide();
        console.log("Ad has started");

        self.played = true;
        var event_time;

        self.timer = setInterval( function () {
            self.current_ad_time++;
            _g.sp.ads_video.current_creative.event_links_progress.forEach( function (item, i, arr) {
                if (item.offset.indexOf('%') >= 0) {
                    var time = item.offset.split('%');
                    event_time = time[0] * Math.floor(self._creative.getAdDuration()) / 100;
                    if (event_time <= self.current_ad_time) {
                        _g.sp.ads_video.tracking(item.url);
                        _g.sp.ads_video.current_creative.event_links_progress.splice(item, 1);
                    }
                } else {
                    event_time = AdProgressEventOffsetTimeFormat(item.offset);
                    if (event_time <= self.current_ad_time) {
                        _g.sp.ads_video.tracking(item.url);
                        _g.sp.ads_video.current_creative.event_links_progress.splice(item, 1);
                    }
                }
            });
        }, 1000);
    };
    //Pass through for stopAd()
    VPAIDWrapper.prototype.stopAd = function () {
        this._creative.stopAd();
    };

    // Callback for AdUserClose
    VPAIDWrapper.prototype.onStopAd = function () {
        var self = this;

        if (_g.sp.options.callbacks["AdsStarted"]) {
            _g.sp.options.callbacks["AdsStarted"]('vpaid');
        }
        console.log("Ad has stopped");
        _g.sp.ads_video.nextADVPAID();
        self.played = false;
        clearInterval(self.timer);
        self.current_ad_time = 0;
    };

    // Callback for AdUserClose
    VPAIDWrapper.prototype.onSkipAd = function () {
        var self = this;

        if (_g.sp.options.callbacks["AdsEnded"]) {
            _g.sp.options.callbacks["AdsEnded"]('vpaid');
        }
        console.log("Ad was skipped");
        _g.sp.ads_video.nextADVPAID();
        self.played = false;
        clearInterval(self.timer);
        self.current_ad_time = 0;
    };
    //Passthrough for setAdVolume
    VPAIDWrapper.prototype.setAdVolume = function (val) {
        this._creative.setAdVolume(val);
    };

    //Passthrough for getAdVolume
    VPAIDWrapper.prototype.getAdVolume = function () {
        return this._creative.getAdVolume();
    };

    // Callback for AdVolumeChange
    VPAIDWrapper.prototype.onAdVolumeChange = function () {
        console.log("Ad Volume has changed to - " + this._creative.getAdVolume());
    };


    //Passthrough for resizeAd
    VPAIDWrapper.prototype.resizeAd = function (width, height, viewMode) {
        this._creative.resizeAd();
    };
    //Passthrough for pauseAd()
    VPAIDWrapper.prototype.pauseAd = function () {
        this._creative.pauseAd();
    };
    //Passthrough for resumeAd()
    VPAIDWrapper.prototype.resumeAd = function () {
        this._creative.resumeAd();
    };
    //Passthrough for expandAd()
    VPAIDWrapper.prototype.expandAd = function () {
        this._creative.expandAd();
    };
    //Passthrough for collapseAd()
    VPAIDWrapper.prototype.collapseAd = function () {
        this._creative.collapseAd();
    };


    var _rollbarConfig = {
        accessToken: "9d4035c1d8564aa6a55eb4c6c49d719f",
        verbose: true,
        captureUncaught: true,
        payload: {
            environment: "production"
        }
    };
    !function(r){function o(n){if(e[n])return e[n].exports;var t=e[n]={exports:{},id:n,loaded:!1};return r[n].call(t.exports,t,t.exports,o),t.loaded=!0,t.exports}var e={};return o.m=r,o.c=e,o.p="",o(0)}([function(r,o,e){"use strict";var n=e(1),t=e(4);_rollbarConfig=_rollbarConfig||{},_rollbarConfig.rollbarJsUrl=_rollbarConfig.rollbarJsUrl||"https://cdnjs.cloudflare.com/ajax/libs/rollbar.js/2.3.1/rollbar.min.js",_rollbarConfig.async=void 0===_rollbarConfig.async||_rollbarConfig.async;var a=n.setupShim(window,_rollbarConfig),l=t(_rollbarConfig);window.rollbar=n.Rollbar,a.loadFull(window,document,!_rollbarConfig.async,_rollbarConfig,l)},function(r,o,e){"use strict";function n(r){return function(){try{return r.apply(this,arguments)}catch(r){try{console.error("[Rollbar]: Internal error",r)}catch(r){}}}}function t(r,o){this.options=r,this._rollbarOldOnError=null;var e=s++;this.shimId=function(){return e},window&&window._rollbarShims&&(window._rollbarShims[e]={handler:o,messages:[]})}function a(r,o){var e=o.globalAlias||"Rollbar";if("object"==typeof r[e])return r[e];r._rollbarShims={},r._rollbarWrappedError=null;var t=new p(o);return n(function(){o.captureUncaught&&(t._rollbarOldOnError=r.onerror,i.captureUncaughtExceptions(r,t,!0),i.wrapGlobals(r,t,!0)),o.captureUnhandledRejections&&i.captureUnhandledRejections(r,t,!0);var n=o.autoInstrument;return(void 0===n||n===!0||"object"==typeof n&&n.network)&&r.addEventListener&&(r.addEventListener("load",t.captureLoad.bind(t)),r.addEventListener("DOMContentLoaded",t.captureDomContentLoaded.bind(t))),r[e]=t,t})()}function l(r){return n(function(){var o=this,e=Array.prototype.slice.call(arguments,0),n={shim:o,method:r,args:e,ts:new Date};window._rollbarShims[this.shimId()].messages.push(n)})}var i=e(2),s=0,d=e(3),c=function(r,o){return new t(r,o)},p=d.bind(null,c);t.prototype.loadFull=function(r,o,e,t,a){var l=function(){var o;if(void 0===r._rollbarDidLoad){o=new Error("rollbar.js did not load");for(var e,n,t,l,i=0;e=r._rollbarShims[i++];)for(e=e.messages||[];n=e.shift();)for(t=n.args||[],i=0;i<t.length;++i)if(l=t[i],"function"==typeof l){l(o);break}}"function"==typeof a&&a(o)},i=!1,s=o.createElement("script"),d=o.getElementsByTagName("script")[0],c=d.parentNode;s.crossOrigin="",s.src=t.rollbarJsUrl,e||(s.async=!0),s.onload=s.onreadystatechange=n(function(){if(!(i||this.readyState&&"loaded"!==this.readyState&&"complete"!==this.readyState)){s.onload=s.onreadystatechange=null;try{c.removeChild(s)}catch(r){}i=!0,l()}}),c.insertBefore(s,d)},t.prototype.wrap=function(r,o,e){try{var n;if(n="function"==typeof o?o:function(){return o||{}},"function"!=typeof r)return r;if(r._isWrap)return r;if(!r._rollbar_wrapped&&(r._rollbar_wrapped=function(){e&&"function"==typeof e&&e.apply(this,arguments);try{return r.apply(this,arguments)}catch(e){var o=e;throw"string"==typeof o&&(o=new String(o)),o._rollbarContext=n()||{},o._rollbarContext._wrappedSource=r.toString(),window._rollbarWrappedError=o,o}},r._rollbar_wrapped._isWrap=!0,r.hasOwnProperty))for(var t in r)r.hasOwnProperty(t)&&(r._rollbar_wrapped[t]=r[t]);return r._rollbar_wrapped}catch(o){return r}};for(var u="log,debug,info,warn,warning,error,critical,global,configure,handleUncaughtException,handleUnhandledRejection,captureDomContentLoaded,captureLoad".split(","),f=0;f<u.length;++f)t.prototype[u[f]]=l(u[f]);r.exports={setupShim:a,Rollbar:p}},function(r,o){"use strict";function e(r,o,e){if(r){var t;"function"==typeof o._rollbarOldOnError?t=o._rollbarOldOnError:r.onerror&&!r.onerror.belongsToShim&&(t=r.onerror,o._rollbarOldOnError=t);var a=function(){var e=Array.prototype.slice.call(arguments,0);n(r,o,t,e)};a.belongsToShim=e,r.onerror=a}}function n(r,o,e,n){r._rollbarWrappedError&&(n[4]||(n[4]=r._rollbarWrappedError),n[5]||(n[5]=r._rollbarWrappedError._rollbarContext),r._rollbarWrappedError=null),o.handleUncaughtException.apply(o,n),e&&e.apply(r,n)}function t(r,o,e){if(r){"function"==typeof r._rollbarURH&&r._rollbarURH.belongsToShim&&r.removeEventListener("unhandledrejection",r._rollbarURH);var n=function(r){var e=r.reason,n=r.promise,t=r.detail;!e&&t&&(e=t.reason,n=t.promise),o&&o.handleUnhandledRejection&&o.handleUnhandledRejection(e,n)};n.belongsToShim=e,r._rollbarURH=n,r.addEventListener("unhandledrejection",n)}}function a(r,o,e){if(r){var n,t,a="EventTarget,Window,Node,ApplicationCache,AudioTrackList,ChannelMergerNode,CryptoOperation,EventSource,FileReader,HTMLUnknownElement,IDBDatabase,IDBRequest,IDBTransaction,KeyOperation,MediaController,MessagePort,ModalWindow,Notification,SVGElementInstance,Screen,TextTrack,TextTrackCue,TextTrackList,WebSocket,WebSocketWorker,Worker,XMLHttpRequest,XMLHttpRequestEventTarget,XMLHttpRequestUpload".split(",");for(n=0;n<a.length;++n)t=a[n],r[t]&&r[t].prototype&&l(o,r[t].prototype,e)}}function l(r,o,e){if(o.hasOwnProperty&&o.hasOwnProperty("addEventListener")){for(var n=o.addEventListener;n._rollbarOldAdd&&n.belongsToShim;)n=n._rollbarOldAdd;var t=function(o,e,t){n.call(this,o,r.wrap(e),t)};t._rollbarOldAdd=n,t.belongsToShim=e,o.addEventListener=t;for(var a=o.removeEventListener;a._rollbarOldRemove&&a.belongsToShim;)a=a._rollbarOldRemove;var l=function(r,o,e){a.call(this,r,o&&o._rollbar_wrapped||o,e)};l._rollbarOldRemove=a,l.belongsToShim=e,o.removeEventListener=l}}r.exports={captureUncaughtExceptions:e,captureUnhandledRejections:t,wrapGlobals:a}},function(r,o){"use strict";function e(r,o){this.impl=r(o,this),this.options=o,n(e.prototype)}function n(r){for(var o=function(r){return function(){var o=Array.prototype.slice.call(arguments,0);if(this.impl[r])return this.impl[r].apply(this.impl,o)}},e="log,debug,info,warn,warning,error,critical,global,configure,handleUncaughtException,handleUnhandledRejection,_createItem,wrap,loadFull,shimId,captureDomContentLoaded,captureLoad".split(","),n=0;n<e.length;n++)r[e[n]]=o(e[n])}e.prototype._swapAndProcessMessages=function(r,o){this.impl=r(this.options);for(var e,n,t;e=o.shift();)n=e.method,t=e.args,this[n]&&"function"==typeof this[n]&&("captureDomContentLoaded"===n||"captureLoad"===n?this[n].apply(this,[t[0],e.ts]):this[n].apply(this,t));return this},r.exports=e},function(r,o){"use strict";r.exports=function(r){return function(o){if(!o&&!window._rollbarInitialized){r=r||{};for(var e,n,t=r.globalAlias||"Rollbar",a=window.rollbar,l=function(r){return new a(r)},i=0;e=window._rollbarShims[i++];)n||(n=e.handler),e.handler._swapAndProcessMessages(l,e.messages);window[t]=n,window._rollbarInitialized=!0}}}}]);

    Rollbar.configure({reportLevel: 'error', enabled: false});
    //Rollbar.configure({reportLevel: 'error', enabled: true});

    return VPlayer;
}());