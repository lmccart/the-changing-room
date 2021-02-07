var imagesRoot = '/Users/lmccart/Documents/TCR/FINAL-IMAGES/FINAL-Images-Prefilter/'
var texturesRoot = '/Users/lmccart/Documents/TCR/FINAL-IMAGES/FINAL-Textures/'
var searchMask = '*.???';
var images, textures;
var blends = ['PINLIGHT', 'OVERLAY'];

var jpegOptions = new JPEGSaveOptions();
jpegOptions.quality = 6;

var emotions = [
    // 'afraid',
    // 'alive',
    // 'angry',
    // 'confused',
    // 'depressed',
    // 'envious',
    // 'happy',
    // 'helpless',
    // 'hurt',
    // 'indifferent',
    // 'interested',
    // 'judgemental',
    // 'loving',
    // 'peaceful',
    // 'positive',
    // 'open',
    // 'sad',*
    'strong'
]

for (var e=0; e<emotions.length; e++) {
    processEmotion(emotions[e].toUpperCase());
}


function processEmotion(emotion) {
    var imagesDir = new Folder(imagesRoot + emotion + '/');
    var texturesDir = new Folder(texturesRoot + emotion + '/');
    
    images = imagesDir.getFiles(searchMask);
    textures = texturesDir.getFiles(searchMask);
    
    
    // for (var i=0;i<2;i++){ 
    for (var i=0;i<images.length;i++){
        processImage(emotion, i);
    }
}


function processImage(emotion, i) {
    var doc = open(images[i]);
    doc.resizeImage(2000);
    try {
        doc.activeLayer.desaturate();
    } catch (e) {}

    for (var t=2; t<3; t++) {//textures.length; t++) {
        for (var b=0; b<blends.length; b++) {
            for (var v=0; v<3; v++) {
                textureImage(doc, emotion, i, t, b, v);
            }
        }
    }
    doc.close(SaveOptions.DONOTSAVECHANGES);
    app.purge(PurgeTarget.ALLCACHES);
}

function textureImage(doc, emotion, i, t, b, v) {
    placeFile(textures[t]);
    // if (b ===0 && v === 1) doc.activeLayer.blendMode = BlendMode.MULTIPLY;
    // else if (b ===0) doc.activeLayer.blendMode = BlendMode.SOFTLIGHT;
    // else if (b ===1) doc.activeLayer.blendMode = BlendMode.OVERLAY;
    doc.activeLayer.blendMode = BlendMode[blends[b]];

    if (b === 0) {
        // doc.activeLayer.opacity = 80;
    }
    // doc.activeLayer.rotate(Math.random() * 360 - 180);
    // doc.activeLayer.rotate(Math.random() * 90 - 45);
    if (Math.random() < 0.5) {
        doc.activeLayer.rotate(90);
    }
    var scale = Math.random()*300 + 100; // 150-450%;
    var x = Math.random() * -400;
    var y = Math.random() * -400;

    doc.activeLayer.resize(scale, scale);
    doc.activeLayer.translate(x, y);
    var saveFolder = new Folder('/Users/lmccart/Documents/TCR/FINAL-IMAGES/FINAL-Images-Textured/' + emotion + '/' + (t+1) + '/');
    if (!saveFolder.exists) {
        saveFolder.create()
    }
    doc.saveAs (new File(saveFolder + '/' + emotion.toUpperCase() + '_IMG' + i + '_' + blends[b] + '_V' + v + '.jpg'), jpegOptions, true);
    doc.activeLayer.remove();
}

function placeFile(file, scale){
    try{
        var idPlc = charIDToTypeID( "Plc " );
            var desc2 = new ActionDescriptor();
            var idnull = charIDToTypeID( "null" );
            desc2.putPath( idnull, new File( file ) );
            var idFTcs = charIDToTypeID( "FTcs" );
            var idQCSt = charIDToTypeID( "QCSt" );
            var idQcsa = charIDToTypeID( "Qcsa" );
            desc2.putEnumerated( idFTcs, idQCSt, idQcsa );
            var idOfst = charIDToTypeID( "Ofst" );
                var desc3 = new ActionDescriptor();
                var idHrzn = charIDToTypeID( "Hrzn" );
                var idPxl = charIDToTypeID( "#Pxl" );
                desc3.putUnitDouble( idHrzn, idPxl, 0 );
                var idVrtc = charIDToTypeID( "Vrtc" );
                var idPxl = charIDToTypeID( "#Pxl" );
                desc3.putUnitDouble( idVrtc, idPxl, 0);
            var idOfst = charIDToTypeID( "Ofst" );
            desc2.putObject( idOfst, idOfst, desc3 );
            var idWdth = charIDToTypeID( "Wdth" );
            var idPrc = charIDToTypeID( "#Prc" );
            desc2.putUnitDouble( idWdth, idPrc, 100 );
            var idHght = charIDToTypeID( "Hght" );
            var idPrc = charIDToTypeID( "#Prc" );
            desc2.putUnitDouble( idHght, idPrc, 100 );
            var idAntA = charIDToTypeID( "AntA" );
            desc2.putBoolean( idAntA, true );
        executeAction( idPlc, desc2, DialogModes.NO );
        
        }
    catch(e){}
}