# Sounds for *The Changing Room*

## Creating sound files

1. Place audio files for each *base* in `sound/sounds` (e.g. *afraid.aif* and *afraid.mp3*) – there should be .aif and .mp3 files for each base. AIF files are used to create meditations and MP3 files are played directly.

2. Run `python prep-sounds.py` to generate longer versions of audio files in `sound/sounds-longer/`. The script creates `sound/sounds-long` along the way, but it should remove this folder by the end.

3. Run `python generate-meditation.py` to create meditation tracks for each emotion (e.g. *afraid-anxious.mp3*). Make sure you have both `ffmpeg` and `sox` packages installed; both can be installed with Homebrew. Missing Python packages can be installed with `pip install`.

4. The script should move the created meditation tracks from `sound/recordings/final` to `sound/sounds-reflection`. If this does not happen, you will need to do it manually. You may delete the `sound/recordings` folder after this.

Your overall sound directory should look like this:

```
sound
│   README.md
│   generate-meditation.py, prep-sounds.py
│   server-sound-*.js
│
└───sounds
│   │   base.mp3
│   │   base.aif
│   │   ^ for each base
│
└───sounds-longer
│   │   base.aif
│   │   ^ for each base
│
└───sounds-reflection
    │   base-emotion.mp3
    │   ^ for each emotion
```

## Playing sounds

Sound can be played via `server-sound-node.js`, `server-sound-browser.js` or `server-sound-sonos.js` by switching include at top of `server.js`.

* server-sound-node plays via node.js using aplay

* server-sound-browser plays through browser audio. Add param into url of window to indicate type of sound (ex: `?sound=environment` or `?sound=reflection`)

* When using browser sound, the browser blocks audio autoplay without user interaction by default. You can add flag to `multibrowser-source/__init__.py` to enable: `--autoplay-policy=no-user-gesture-required`. Or you can run the following command in Terminal to open a new Chrome window with enabled autoplay (you may need to close other windows): `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --autoplay-policy=no-user-gesture-required`

* server-sound-sonos plays through sonos speakers

## Foreign language meditation and the `say` command

Meditations are generated using the language and voice as specified in the `.env` file: `LANG0` and `LANG0_VOICE`.

If you encounter trouble in `generate-meditation.py`, it may be a problem with missing voices (e.g. *Voice 'Name' not found.*). You can add and manage new voices in System Settings -> Accessibility -> Spoken Content -> System Voice -> **Manage Voices** (MacOS Sonoma 14.0). You can view a list of each voice and languages by `running say -v \?` in Terminal.

You may use different voices by editing the chosen voice in `.env` or manually editing the `say` command in `generate-meditation.py` following the `-v` tag. (The former is recommended.)

### Enhanced Voices

Some voices offer 1-2 enhanced versions. As far as I (Wylie) can tell, the `say` command will use the best (and largest) version of the voice you have downloaded.

### Voices with Multiple Languages

Some voices have multiple language offerings, meaning you will see their names under multiple languages in the Manage Voices window. If you decide to use one of these voices, you must make sure to change your **System Speech Language** (found in the same menu as System Voice) to match the language of the text your using when you run the script. For example, you must change your System Speech Language to French if you want to speechify French text with the French version of that voice. Unfortunately, you can no longer change this in the Terminal (MacOS Sonoma 14.0).

This does not apply to voices that only have one language offering. You can avoid these setting changes – though you still may need to download the voices – by using voices that only offer one language.

After creating audio files in other languages, remember to reset System Speech Language back to your home language.

## References

* https://github.com/audiojs/audio-play

* https://github.com/audiojs/audio-loader

* https://github.com/Hugo22O/chrome-autoplay

* https://developer.chrome.com/blog/autoplay/#developer-switches
