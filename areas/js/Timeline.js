import { nanoid } from 'nanoid';

/* 
 

USAGE
 
  let t = new Timeline({ loop: true, duration: 5000, interval: 100 });

  t.add({ time: 1000, event: function () { console.log('bliop'); } });
  t.add({ time: 2000, event: function () { console.log('boop'); } });
  t.add({ time: 4000, event: function () { console.log('bloooiop'); } });

  t.start({ callback: function() { console.log('we're done!!!');}  })

  t.stop();

  t.reset();


*/


class Timeline {

  constructor(opts) {
    // opts looks like:
    // { loop: true|false, duration: ms }
    this.timeline = {};
    this.completed_events = {};
    this.interval = opts.interval;
    this.loop = opts.loop;
    this.duration = opts.duration;
    this.status = 'stopped';
    this.startTime = null;
  }

  add(opts) {
    // opts looks like: 
    // { time: milliseconds_from_start, event: function }
    this.timeline[nanoid(10)] = opts;

  }

  clear() {
    this.timeline = {};
    this.completed_events = {};
    this.startTime = null;
  }

  setDuration(duration) {
    this.duration = duration;
  }

  reset() {
    this.completed_events = {};
    this.startTime = Date.now();
  }

  stop() {
    this.status = 'stopped';
  }

  _play_uncompleted() {
    let curtime = Date.now();

    for (const k in this.timeline) 
      if ((curtime >= Number(this.timeline[k].time) + this.startTime) && !(k in this.completed_events)) {
        this.timeline[k].event();
        this.completed_events[k] = true;
      }
    

  }

  update() {
    this._play_uncompleted();
  }

  start(opts) {
    // opts = { callback: fn() }
    var self = this;

    this.reset();
    this.status = 'playing';

    var loopUpdate = function() {
      setTimeout(function() {
        if (self.status === 'stopped')  return; 
        self.update();

        let msPastDuration = Date.now() - Number(self.startTime) - Number(self.duration);

        if (msPastDuration < 0) 
          // we're still within the timeline
          loopUpdate();
        else 
        // we're past timeline duration!
        if (self.loop) {
          self.completed_events = {};
          self.startTime = Date.now() - msPastDuration;
          loopUpdate();
        } else 
        // we're not looping and we're over
          opts.callback();
          
        

      }, self.interval);
    };
    loopUpdate();
  }

}

export default Timeline;
