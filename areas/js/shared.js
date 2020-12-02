document.title = $('#debug-area').text();
console.log($('#debug-area').text())

// getting colors from the data file
fetch('/data/colors.json').then(res => {
  return res.json();
}).then(colors => {
  window.baseColors = colors;
})

// Helper Functions

window.showLoadingOverlay = (newEmotion) => {
  // newEmotion should be a string
  $('#loading-emotion').text(newEmotion);
  $('#loading').addClass('show');


  // Eventually this way of closing the loading
  // screen should be made opt-in, so in case
  // a page has to do a lot of setup that takes
  // longer than 2 seconds, it can use the 
  // `hideLoadingOverlay` function on its own
  setTimeout(hideLoadingOverlay, 2000);
}

window.hideLoadingOverlay =  () => {
  $('#loading').removeClass('show');
  $('#loading-emotion').empty();
}

// for hot reloading
if (module.hot) {
  module.hot.accept();
}