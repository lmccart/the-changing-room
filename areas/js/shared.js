document.title = $('#debug-area').text();
console.log($('#debug-area').text())

// Helper Functions

window.showLoadingOverlay = (newEmotion) => {
  // newEmotion should be a string
  $('#loading-emotion').text(newEmotion);
  $('#loading').addClass('show');
}

window.hideLoadingOverlay =  () => {
  $('#loading').removeClass('show');
  $('#loading-emotion').empty();
}

// for hot reloading
if (module.hot) {
  module.hot.accept();
}