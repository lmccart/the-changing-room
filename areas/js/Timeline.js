/* 
 

USAGE
 
  let t = new Timeline({ loop: true, duration: 5000 });

  t.add({ time: 1000, event: function () { console.log("bliop"); } });
  t.add({ time: 2000, event: function () { console.log("boop"); } });
  t.add({ time: 4000, event: function () { console.log("bloooiop"); } });

  t.start({ interval: 100, callback: function() { console.log("we're done!!!");}  })


*/


class Timeline {

  constructor(opts) {
    // opts looks like:
    // { loop: true|false, duration: ms }
    this.timeline = {};
    this.completed_events = {};
    this.status = "stopped";
    this.startTime = null;
    this.loop = opts.loop;
    this.duration = opts.duration;
  }

  add(opts) {
    // opts looks like: 
    // { time: milliseconds_from_start, event: function }
    this.timeline[opts.time] = { event: opts.event };
  }

  reset() {
    this.completed_events = {};
    this.startTime = Date.now();
  }

  play() {
    if(this.status == "stopped") {
      reset();
    }
    this.status = "playing";
  }

  _play_uncompleted() {
    let curtime = Date.now();

    for(const k in this.timeline) {
      if((curtime > Number(k) + this.startTime) && !(k in this.completed_events)) {
        this.timeline[k].event();
        this.completed_events[k] = true;
      }
    }

  }

  update() {
    this._play_uncompleted();
  }

  start(opts) {
    // opts = { interval: 50, callback: fn() }
    var self = this;
    this.reset();
    console.log("starting");
    var loopUpdate = function() {
      setTimeout(function() {
        self.update();

        let msPastDuration = Date.now() - Number(self.startTime) - Number(self.duration);
        if(msPastDuration < 0) {
          loopUpdate();
        } else {
          // we're past timeline duration!
          if(self.loop) {
            self.completed_events = {};
            self.startTime = Date.now() - msPastDuration
            loopUpdate();
          } else {
            // we're not looping and we're over
            opts.callback();
          }
        }

      }, opts.interval)
    };
    loopUpdate();
  }

}

export default Timeline;
