// style and js imports
import '../css/00-intro.scss';
import './shared.js';

let emotions;
let curEmotion;
const socket = io();
socket.on('emotion:update', updateEmotion);




function updateEmotion(msg) {
  if (!curEmotion || curEmotion.name !== msg.name) {
    curEmotion = msg;
    console.log('emotion has been updated to: ' + msg.name + ' (base: ' + msg.base + ', level: ' + msg.level + ')');

    showLoadingOverlay(curEmotion.name);
    updateInterface();
  }
}

function updateInterface() {
  $('#debug-info').text('CURRENT EMOTION: ' + curEmotion.name + ' (base: ' + curEmotion.base + ', level: ' + curEmotion.level + ')')
  setTimeout(function () { scrollThis(); }, 3000);

}

// window.scrollThis = () => {}


function scrollThis() {
  console.log("scrollThis")
  ////prints out scroll pos
  // setInterval(function(){ 
  //     console.log($('.text').scrollTop())
  //    }, 100);

  let scrollBottom = $(".text").prop("scrollHeight")
  console.log(scrollBottom)

  $(".text").animate({
    scrollTop: scrollBottom
  }, 95000, 'linear');

  $(".text").scroll(function () {
    // console.log("top",  $('.text').scrollTop())
    // console.log("bottom", scrollBottom)
    // console.log("scrollheight", $('.text')[0].scrollHeight)
    // console.log("scrolltop", $('.text')[0].scrollTop)
    // console.log("clientheight", $('.text')[0].clientHeight)

    if ($(".text").scrollTop() >= ($('.text')[0].scrollHeight - ($('.text')[0].clientHeight + 5))) {
      console.log("restart scroll!!")
      $(".text").stop();
      $(".text").scrollTop(0);

      $(".text").animate({
        scrollTop: scrollBottom
      }, 95000, 'linear');
    }
  });
}




