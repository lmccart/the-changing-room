fetch('/static/data/data.json')
.then(res => res.json())
.then(data => {
  console.log(data.colors);
  renderColors(data.colors);
});

function renderColors(data) {
  for (let e in data) {
    let emotionDiv = $(`<div id='${e}-colors' class='emotion-div'></div>`);
    $('#colors').append(emotionDiv);
    $(emotionDiv).append(`<h1>${e}</h1>`);
    for (let p in data[e]) {
      let pair = data[e][p];
      let gradient = generateGradient(e, p, pair);
      emotionDiv.append(gradient);
      let image = generateImage(e, p, pair);
      emotionDiv.append(image);
    }
  }
}

function generateGradient(e, p, pair) {
  let elt = $(`<div id='${e}-${p}-gradient' class='gradient'></div>`);
  elt.css('background', `linear-gradient(${pair[0]},${pair[1]})`);
  return elt;
}

function generateImage(e, p, pair) {
  let elt = $(`<div id='${e}-${p}-image' class='image'></div>`);
  elt.css('background-image', 'url(image1.png)');
  addSvgFilterForElement(elt, pair);
  return elt;

}

$(window).on('keypress', e => {
  if (e.key === '1' || e.key === '2' || e.key === '3') {
    $('.image').css('background-image', `url(image${e.key}.png)`);
  }
});

// returns rgb values from hex in either fractional or normal form
// to get fractional rgba values, pass in true as the second argument
function hexToRgb(hex, returnFractionalValue) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return result ? {
    r: returnFractionalValue ? (r / 255) : r,
    g: returnFractionalValue ? (g / 255) : g,
    b: returnFractionalValue ? (b / 255) : b
  } : null;
}

// this function adds an svg element to the document that
// has a multitone treatment, and sets css of the $imgEl 
// (which is a jquery element) to use it as a filter
// arrayOfColors must be an array of 2 or more hex colors:
// ['7c4242', '584794', '608942'] ('#' infront of the color is optional)
function addSvgFilterForElement($imgEl, arrayOfColors) {
  const filterId = 'filter' + (Math.floor(Math.random() * 1000000)).toString();
  const svgId = 'svg' + (Math.floor(Math.random() * 1000000)).toString();
  let redTableValue = '';
  let greenTableValue = '';
  let blueTableValue = '';

  // convert each hex color to separate, fractional r, b, and g values
  for (var i = 0; i < arrayOfColors.length; i++) {
    const color = arrayOfColors[i];
    const {r, g, b} = hexToRgb(color, true);

    // adds color fraction to existing string with a space
    redTableValue += ` ${r}`;
    greenTableValue += ` ${g}`;
    blueTableValue += ` ${b}`;
  }

  const svg = `
    <svg id='${svgId}'>
      <filter id='${filterId}'>
          <!-- Grab the SourceGraphic (implicit) and convert it to grayscale -->
          <feColorMatrix type='matrix' values='.33 .33 .33 0 0
                .33 .33 .33 0 0
                .33 .33 .33 0 0
                0 0 0 1 0'>
          </feColorMatrix>
          <feComponentTransfer color-interpolation-filters='sRGB'>
            <feFuncR type='gamma' exponent='1.5' amplitude='1.3' offset='0'></feFuncR>
            <feFuncG type='gamma' exponent='1.5' amplitude='1.3' offset='0'></feFuncG>
            <feFuncB type='gamma' exponent='1.5' amplitude='1.3' offset='0'></feFuncB>
         </feComponentTransfer> 
  
          <!-- Map the grayscale result to the gradient map provided in tableValues -->
          <feComponentTransfer color-interpolation-filters='sRGB'>
              <feFuncR type='table' tableValues='${redTableValue}'></feFuncR>
              <feFuncG type='table' tableValues='${greenTableValue}'></feFuncG>
              <feFuncB type='table' tableValues='${blueTableValue}'></feFuncB>
          </feComponentTransfer>
      </filter>
    </svg>`;

  // add avg filter to body
  $('body').append(svg);

  // add css filter to image element
  $imgEl.css('filter', `url(#${filterId})`);

  // remove svg filter when image element is removed
  // useful for pop up windows
  $imgEl.on('remove', () => {
    $(`#${svgId}`).remove();
  });
  return svgId;
}
