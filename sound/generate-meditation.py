import os
import csv

clip_dur = 5;


def generate_script(row):
  base = row[0]
  emotion = row[1]
  n = 0
  # setup directories
  os.system("mkdir recordings/final")
  os.system("mkdir recordings/" + base)
  os.system("mkdir recordings/" + base + "/" + emotion)
  os.system("mkdir recordings/" + base + "/" + emotion + "/orig")
  pad_dir = "recordings/" + base + "/" + emotion + "/pad"
  os.system("mkdir " + pad_dir)
  # record phrases
  for phrase in phrases:
    phrase = phrase.replace("[EMOTION]", emotion)
    phrase = phrase.replace("[BODY AREA]", row[2])
    phrase = phrase.replace("[PERSON]", row[3])
    phrase = phrase.replace("\r", "")
    if (len(phrase) > 0):
      record_phrase(phrase, base, emotion, n)
    n += 1
  # concat phrases
  output = concat_clips(pad_dir, base, emotion)
  # mix with base audio
  mix_clips(output, "sounds/" + base + ".aif")


  #pad end

def record_phrase(phrase, base, emotion, n):
  orig_clip = "recordings/" + base + "/" + emotion + "/orig/" + str(n) + ".aac"
  pad_clip = "recordings/" + base + "/" + emotion + "/pad/" + str(n) + ".wav"
  # record say command
  orig_command = "say '" + phrase + "' -v Ava -o " + orig_clip
  print(orig_clip)
  print(orig_command)
  os.system(orig_command)
  # pad each clip to clip_dur
  pad_command = "ffmpeg -i " + orig_clip + " -af 'apad=whole_dur=" + str(clip_dur) + "' -vn -ar 44100 -ac 2 -b:a 192k " + pad_clip
  os.system(pad_command)

def concat_clips(dir, base, emotion):
  # assemble concat command
  i = 0
  command = "sox"
  output = "recordings/final/" + base + "-" + emotion + ".wav"
  while i < 17:
    command += " " + dir + "/" + str(i) + ".wav"
    i += 1
  command += " " + output
  # concat
  os.system(command)
  # pad with ending silence
  output_pad = output.replace(".wav", "P.wav")
  pad_command = "ffmpeg -i " + output + " -af 'apad=whole_dur=" + str(120) + "' -vn -ar 44100 -ac 2 -b:a 192k " + output_pad
  os.system(pad_command)
  return output_pad

def mix_clips(meditation, base):
  output = meditation.replace("P.wav", "F.wav")
  command = "ffmpeg -i " + meditation + " -i " + base;
  # command += " -filter_complex amix=inputs=2:duration=shortest " + output
  command += " -shortest -filter_complex '[0]adelay=5000|5000,volume=1.0[a]; [1]volume=1.0[b]; [a][b]amix=inputs=2[out]' -map '[out]' "
  command += output
  os.system(command)



# read text from txt and tsv
contents = open("../data/02_meditation.txt", "r").read()
phrases =  contents.split("\n")
print(phrases)
tsv_file = open("../data/02_meditation_emotion_specific.tsv")
read_tsv = csv.reader(tsv_file, delimiter="\t")
k = 0

# generate audio file per row of tsv
for row in read_tsv:
  if (k == 1):
    print("\n\nEMOTION "+row[1])
    if (row[1] and row[2] and row[3]):
      generate_script(row)
    else:
      print("MISSING DATA");
  k += 1

