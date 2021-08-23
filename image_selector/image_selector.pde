
String dir = "/Volumes/LMCCART18/PROJECTS/TCR/all-media/FINAL-images/OPEN/2/";


import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.io.BufferedWriter;
BufferedWriter output = null;


int curImage = 0;

PImage photo;
String selects_dir = "00_selects/";
String[] blends = {"OVERLAY", "PINLIGHT"};
int numImages = 6;
PImage[] images = new PImage[numImages];
String[] files = new String[numImages];
String emotion;
String texture;
int gutter = 30;
int totalImages;
Boolean skipHover = false;
int skipW = 0;
int skipH = 0;

void setup() {
  size(displayWidth, displayHeight);
  fill(0);
  totalImages = floor(new File(dir).list().length / numImages);
  println(totalImages);
  String[] parts = split(dir, "/");
  println(parts);
  emotion = parts[parts.length - 3];
  texture = parts[parts.length - 2];
  println(emotion, texture);
  skipW = width - gutter - 60;
  skipH = height - gutter - 85;
  setupImages();
}

void draw() {
  background(255);
  text(emotion + " " + curImage, gutter, 20);

  float h = (height - 4 * gutter - 100) * 0.4;
  int max_w = (width - 4 * gutter) / 3;

  int a = 0;
  for (int i=0; i<blends.length; i++) {
    float y = gutter + (gutter + h) * i;
    for (int j=0; j<3; j++) {
      int x = gutter + (gutter + max_w) * j;
      image(images[a], x, y, h * images[a].width/images[a].height, h);
      a++;
    }
  }

  File directory = new File(dir + selects_dir);
  if (! directory.exists()) {
    directory.mkdir();
  }
  
  if (skipHover) {
    fill(255, 0, 0);
  } else {
    fill(0);
  }
  textSize(20);
  text("SKIP", skipW + 30, skipH + 40);
}

void nextImages() {
  curImage++;
  println("curImage " + curImage);
  if (curImage >= totalImages) {
    exit();
  } else {
    setupImages();
  }
}

void setupImages() {
  int i = 0;
  for (int b=0; b<blends.length; b++) {
    for (int v=0; v<3; v++) {
      files[i] = emotion.toUpperCase() + "_IMG" + curImage + "_" + blends[b] + "_V" + v + ".jpg";
      images[i] = loadImage(dir + files[i]);
      i++;
    }
  }
}

void mousePressed() {
  if (mouseX > skipW && mouseY > skipH) {
    nextImages();
  } else {
    int a, b;
    if (mouseY < height/3) {
      a = 0;
    } else if (mouseY < 2* height/3) {
      a = 1;
    } else {
      a = 2;
    }
    
    if (mouseX < width/3) {
      b = 0;
    } else if (mouseX < 2 * width/3) {
      b = 1;
    } else {
      b = 2;
    }
    int ind = 3 * a + b;
    if (ind < numImages){
      selectImage(ind);
    }
  }
}

void mouseMoved() {
  
  if (mouseX > skipW && mouseY > skipH) {
    skipHover = true;
  } else {
    skipHover = false;
  }
}

void selectImage(int ind) {
  println("selected " + ind);

  Path oldFile = Paths.get(dir + files[ind]);
  Path newFile = Paths.get(dir + selects_dir + files[ind]);
  try {
    Files.copy(oldFile, newFile);
    nextImages();
  } 
  catch (IOException e) {
    println(e);
  }
}
