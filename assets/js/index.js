let player = VPlayer.init('myplayer', {
    volume: 0.1,
    width: '100%',
    height: '100%',
    autoplay: false,
    playlist : [
        {
            sources: '/test/sample1.mp4',
            title: 'test video',
            poster: 'test video',
            id: 'test video',
            perma_link: 'test video',
        },
        {
            title: 'test video2',
            sources: '/test/bi2-1.mp4',
        }
    ],
    callbacks: {
        "AdImpression": function (res){ //res = undefined or 'vpaid' if wrapper vpaid
            console.log('AdImpression in html')
        },
        "MainContentStarted": function (){
            console.log('MainContentStarted in html')
        },
        "AdsStarted": function (res){ //res = undefined or 'vpaid' if wrapper vpaid
            console.log('AdsStarted in html')
        },
        "AdsEnded": function (res){ //res = undefined or 'vpaid' if wrapper vpaid
            console.log('AdsEnded in html')
        },
        "NoAds": function (res){ //res = undefined or 'vpaid' if wrapper vpaid
            console.log('NoAds in html')
        },
        "VideoError": function (video_type, res){
            console.log(video_type + ' error: ' + res);
        },
    },
    ads: [
        // {
        //   url: '/wrapper_creative2.xml',
        //   type: 'preroll'
        // },
        // {
        //     url: '/wrapper_creative2.xml',
        //     type: 'midroll',
        //     offset: 2
        // },
        // {
        //     url: '/wrapper_creative2.xml',
        //     type: 'postroll'
        // }
    ]
})
player.setVolume(0.5);