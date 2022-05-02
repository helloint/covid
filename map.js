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
        selector: document.getElementById('dateSelector'),
        iid: null,
    },
    methods: {
        onInit: function () {
            this.debug && console.log('onInit');
            $('#playBtn').click(function(){
                fsm.start();
            });
            $('#stopBtn').click(function(){
                fsm.stop();
            });
        },
        onIdle: function () {
            this.debug && console.log('onInit');
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