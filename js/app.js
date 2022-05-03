/*
state:
0: idle, show PLAY icon
1: playing, show STOP icon

action:
0 -> 1 start()
1 -> 0 stop()
 */
var fsm = new StateMachine({
    transitions: [
        {name: 'init', from: 'none', to: 'idle'},
        {name: 'start', from: 'idle', to: 'playing'},
        {name: 'stop', from: 'playing', to: 'idle'},
    ],
    data: {
        debug: false,
        selector: null,
        iid: null,
    },
    methods: {
        onInit: function () {
            // A bug: this triggered after onIdle? no matter if I use `init: 'idle'` or transitions
        },
        onLeaveNone: function () {
            this.debug && console.log('onLeaveNone');
            this.selector = $('#dateSelector')[0];
            $('#playBtn').click(function(){
                fsm.start();
            });
            $('#stopBtn').click(function(){
                fsm.stop();
            });
        },
        onIdle: function () {
            this.debug && console.log('onIdle');
            $('#playBtn').show();
            $('#stopBtn').hide();
            this.selector.disabled = false;
        },
        onLeaveIdle: function () {
            this.debug && console.log('onLeaveIdle');
            // make selector readonly https://stackoverflow.com/a/368834/8175165
            this.selector.disabled = true;
        },
        onPlaying: function () {
            this.debug && console.log('onPlaying');
            $('#playBtn').hide();
            $('#stopBtn').show();

            // For resume and play
            let index = this.selector.selectedIndex;
            this.iid = setInterval(()=>{
                index = index - 1;
                if (index >= 0) {
                    this.selector.selectedIndex = index;
                    this.selector.dispatchEvent(new Event('change'));
                } else {
                    fsm.stop();
                }
            }, 1000);
        },
        onStop: function () {
            this.debug && console.log('onStop');
            this.iid && clearInterval(this.iid);
            this.iid = null;
        },
    }
});

var dailyData = null;
function fetchData(date, callback) {
    if (dailyData === null) {
        fetch(`data/daily.json`)
            .then(response => response.json())
            .then(json => {
                dailyData = json;
                callback(dailyData[date] || []);
            });
    } else {
        callback(dailyData[date] || []);
    }
}