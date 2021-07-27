1. Place audio files in `sounds/`
2. `python prep-sounds.py` generates longer versions of audio files in `sounds-longer/`
3. `python generate-meditation.py` creates meditation tracks
4. Sound can be played via `server-sound-node.js`, `server-sound-browser.js` or `server-sound-sonos.js` by switching include at top of `server.js`.
   * server-sound-node plays via node.js using aplay
   * server-sound-browser plays through browser audio. Add param into url of window to indicate type of sound (ex: `?sound=environment` or `?sound=reflection`)
     * When using browser sound, the browser blocks audio autoplay without user interaction by default.
     * You can add flag to `multibrowser-source/__init__.py` to enable: `--autoplay-policy=no-user-gesture-required`.
   * server-sound-sonos plays through sonos speakers



## References
* https://github.com/audiojs/audio-play
* https://github.com/audiojs/audio-loader 