//  ___   __   __  _______  _______  _______    _______  __    _  ______     _______  _______  ___      _______  ______     
// |   | |  |_|  ||   _   ||       ||       |  |   _   ||  |  | ||      |   |       ||       ||   |    |       ||    _ |    
// |   | |       ||  |_|  ||    ___||    ___|  |  |_|  ||   |_| ||  _    |  |       ||   _   ||   |    |   _   ||   | ||    
// |   | |       ||       ||   | __ |   |___   |       ||       || | |   |  |       ||  | |  ||   |    |  | |  ||   |_||_   
// |   | |       ||       ||   ||  ||    ___|  |       ||  _    || |_|   |  |      _||  |_|  ||   |___ |  |_|  ||    __  |  
// |   | | ||_|| ||   _   ||   |_| ||   |___   |   _   || | |   ||       |  |     |_ |       ||       ||       ||   |  | |  
// |___| |_|   |_||__| |__||_______||_______|  |__| |__||_|  |__||______|   |_______||_______||_______||_______||___|  |_|  
//  __   __  _______  ___   ___      ___   _______  ___   _______  _______                                                  
// |  | |  ||       ||   | |   |    |   | |       ||   | |       ||       |                                                 
// |  | |  ||_     _||   | |   |    |   | |_     _||   | |    ___||  _____|                                                 
// |  |_|  |  |   |  |   | |   |    |   |   |   |  |   | |   |___ | |_____                                                  
// |       |  |   |  |   | |   |___ |   |   |   |  |   | |    ___||_____  |                                                 
// |       |  |   |  |   | |       ||   |   |   |  |   | |   |___  _____| |                                                 
// |_______|  |___|  |___| |_______||___|   |___|  |___| |_______||_______|    
//
// use in your scripts by importing the functions you want to use 
// for example: 
// import { getDimensions, getImgUrls } from './lib/imageColorUtils.js';



// returns promise that resolves to the width and height
// of an image url
// used like const imageDims = await getDimensions('/static/images/confused/image.jpeg');
// or getDimensions('/static/images/confused/image.jpeg').then(imageDims => {do whatever u want here})
export function getDimensions(url){   
    var img = new Image();
    const dimensionsPromise = new Promise((res, rej) => {
      img.addEventListener("load", () => {
          res([img.naturalWidth, img.naturalHeight]);
      });
    })
    img.src = url;
    return dimensionsPromise;
}

// returns array of image URLs for base emotion
// used like const imageURLs = await getImgUrls('angry');
// or getImgUrls('angry').then(imageURLs => {do whatever u want here})
export function getImgUrls (baseEmotion) {
  return fetch(`/images/${baseEmotion}/manifest`)
          .then(res => res.json());
} 

// returns rgb values from hex in either fractional or normal form
// to get fractional rgba values, pass in true as the second argument
export function hexToRgb(hex, returnFractionalValue) {
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

// returns 'white' or 'black' for a hexcolor, depending on the contrast
export function getTextColorForBackground(hexcolor){
  console.log(hexcolor)
    hexcolor = hexcolor.replace("#", "");
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    console.log(yiq)
    return (yiq >= 140) ? 'black' : 'white';
}


// this function adds an svg element to the document that
// has a multitone treatment, and sets css of the $imgEl 
// (which is a jquery element) to use it as a filter
// arrayOfColors must be an array of 2 or more hex colors:
// ["7c4242", "584794", "608942"] ('#' infront of the color is optional)
export function addSvgFilterForElement ($imgEl, arrayOfColors) {
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
    <svg id="${svgId}">
      <filter id="${filterId}">
          <!-- Grab the SourceGraphic (implicit) and convert it to grayscale -->
          <feColorMatrix type="matrix" values=".33 .33 .33 0 0
                .33 .33 .33 0 0
                .33 .33 .33 0 0
                0 0 0 1 0">
          </feColorMatrix>
          <feComponentTransfer color-interpolation-filters="sRGB">
            <feFuncR type="gamma" exponent="1.5" amplitude="1.3" offset="0"></feFuncR>
            <feFuncG type="gamma" exponent="1.5" amplitude="1.3" offset="0"></feFuncG>
            <feFuncB type="gamma" exponent="1.5" amplitude="1.3" offset="0"></feFuncB>
         </feComponentTransfer> 
  
          <!-- Map the grayscale result to the gradient map provided in tableValues -->
          <feComponentTransfer color-interpolation-filters="sRGB">
              <feFuncR type="table" tableValues="${redTableValue}"></feFuncR>
              <feFuncG type="table" tableValues="${greenTableValue}"></feFuncG>
              <feFuncB type="table" tableValues="${blueTableValue}"></feFuncB>
          </feComponentTransfer>
      </filter>
    </svg>`;

    // add avg filter to body
    $('body').append(svg);

    // add css filter to image element
    $imgEl.css('filter', `url(#${filterId})`)

    // remove svg filter when image element is removed
    // useful for pop up windows
    $imgEl.on("remove", () => {
      $(`#${svgId}`).remove();
    })
}
