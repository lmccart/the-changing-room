document.title = $('#debug-area').text();
console.log($('#debug-area').text())

// for hot reloading
if (module.hot) {
  module.hot.accept();
}