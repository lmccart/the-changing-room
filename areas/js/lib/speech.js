

// SPEECH STUFF

let selectedVoiceIndex = 9999;
let selectedVoice;

window.speechSynthesis.onvoiceschanged = function() {
  let voiceOptions = ['Ava', 'Allison', 'Samantha', 'Susan', 'Vicki', 'Kathy', 'Victoria'];
  let voices = window.speechSynthesis.getVoices();
  console.log('voice');
  for (let v in voices) {
    let ind = voiceOptions.indexOf(voices[v].voiceURI);
    if (ind !== -1 && ind < selectedVoiceIndex) {
      selectedVoice = voices[v];
      selectedVoiceIndex = ind;
    }
  }
};

export function speak(msg, vol) {
  if (arguments.length === 1) {
    vol = 1;
  }
  const utterance = new SpeechSynthesisUtterance(msg);
  utterance.volume = vol;
  utterance.rate = 0.8;
  if (selectedVoice) utterance.voice = selectedVoice;
  speechSynthesis.speak(utterance);
}


// function for making sure text to speech is available on iOS Safari
export function enableAutoTTS() {
  if (typeof window === 'undefined') {
    return; 
  }
  
  const simulateSpeech = () => {
    speak('Hello', 0);
    document.removeEventListener('click', simulateSpeech);
  };

  document.addEventListener('click', simulateSpeech);
}