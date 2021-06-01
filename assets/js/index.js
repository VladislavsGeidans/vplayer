
let player = VPlayer.init('myplayer', {
    volume: 0.1,
    width: '100%',
    height: '100%',
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
        "AdImpression": function (res){
            console.log('AdImpression in html')
        },
        "MainContentStarted": function (){
            console.log('MainContentStarted in html')
        },
    },
    ads: [
        {
          url: '/test/vpaid/preroll_vast.xml',
          type: 'preroll'
        },
        {
            url: '/test/vpaid/midroll_vast.xml',
            type: 'midroll',
            offset: 3
        },
        {
            url: '/test/vpaid/postroll_vast.xml',
            type: 'postroll'
        }
    ]
})
player.setVolume(0.5);
