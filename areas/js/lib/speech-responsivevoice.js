

// SPEECH STUFF

const voiceType = 'US English Female';

export function speak(msg, vol) {
  if (arguments.length === 1) {
    vol = 1;
  }
  responsiveVoice.speak(msg, voiceType, {volume: vol});
}

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