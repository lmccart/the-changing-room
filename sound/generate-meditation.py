import os
import csv
import json
from dotenv import load_dotenv 

load_dotenv()
LANG0 = os.getenv("LANG0")
LANG0_V = os.getenv("LANG0_VOICE")

translation_JSON = open(f"../areas/js/locales/{LANG0}/translation.json")
translation = json.load(translation_JSON)
translation_JSON.close()

mp3_source_path = "recordings/final"
mp3_dest_path = "sounds-reflection"

short_clip_dur = 10
long_clip_dur = 15
total_dur = 360

test_one = True # test one of each emotion first

def generate_script(row):
  base = row[0]
  emotion = row[1]
  n = 0
  # setup directories
  os.system("mkdir recordings")
  os.system("mkdir recordings/final")
  os.system("mkdir recordings/" + base)
  os.system("mkdir recordings/" + base + "/" + emotion)
  os.system("mkdir recordings/" + base + "/" + emotion + "/orig")
  pad_dir = "recordings/" + base + "/" + emotion + "/pad"
  os.system("mkdir " + pad_dir)
  # record phrases
  for phrase in phrases:
    clip_dur = short_clip_dur
    if ("[BODY AREA]" in phrase) or ("[PERSON]" in phrase):
      clip_dur = long_clip_dur
    if (emotion in translation):
      phrase = phrase.replace("[EMOTION]", translation[emotion])
    else:
      phrase = phrase.replace("[EMOTION]", emotion)
    phrase = phrase.replace("[BODY AREA]", row[2])
    phrase = phrase.replace("[PERSON]", row[3])
    phrase = phrase.replace("\r", "")
    if (len(phrase) > 0):
      record_phrase(phrase, base, emotion, n, clip_dur)
    n += 1
  # concat phrases
  output = concat_clips(pad_dir, base, emotion)
  # mix with base audio
  mix_clips(output, "sounds-longer/" + base + ".aif")
  cleanup_clips(base, emotion)


def record_phrase(phrase, base, emotion, n, clip_dur):
  orig_clip = "recordings/" + base + "/" + emotion + "/orig/" + str(n) + ".aac"
  pad_clip = "recordings/" + base + "/" + emotion + "/pad/" + str(n) + ".wav"
  # uses voice from .env file
  orig_command = "say \"" + phrase + f"\" -v {LANG0_V} -o " + orig_clip 
  print(orig_clip)
  print(orig_command)
  os.system(orig_command)
  # pad each clip to clip_dur
  pad_command = "ffmpeg -loglevel quiet -i " + orig_clip + " -af 'apad=whole_dur=" + str(clip_dur) + "' -vn -ar 44100 -ac 2 -b:a 192k " + pad_clip
  print(pad_command)
  os.system(pad_command)

def concat_clips(dir, base, emotion):
  print("\nCONCATENATING CLIPS\n")
  # assemble concat command
  i = 0
  command = "sox"
  output_concat = "recordings/final/" + base + "-" + emotion + "1.wav"
  while i < 18:
    command += " " + dir + "/" + str(i) + ".wav"
    i += 1
  command += " " + output_concat
  # concat
  os.system(command)
  # pad with ending silence
  output_pad = output_concat.replace("1.wav", "2.wav")
  pad_command = "ffmpeg -loglevel quiet -i " + output_concat + " -af 'apad=whole_dur=" + str(total_dur) + "' -vn -ar 44100 -ac 2 -b:a 192k " + output_pad
  os.system(pad_command)
  return output_pad

def mix_clips(meditation, base):
  print("\nMIXING CLIP\n")
  output_mix = meditation.replace("2.wav", "3.wav")
  command = "ffmpeg -loglevel quiet -i " + meditation + " -i " + base
  command += " -shortest -filter_complex '[0]adelay="+str(short_clip_dur * 1000)+"|"+str(short_clip_dur * 1000)+",volume=0.45[a]; [1]volume=1.0[b]; [a][b]amix=inputs=2[out]' -map '[out]' " + output_mix
  os.system(command)
  # trim
  output_trim = meditation.replace("2.wav", "4.wav")
  os.system("ffmpeg -loglevel quiet -i " + output_mix + " -ss 00:00:00 -t 00:06:00 -async 1 " + output_trim) # total dur update here, too!
  # fade - NOTE: OUTPUTS MP3 FILE
  output_final = meditation.replace("2.wav", ".mp3")
  os.system("ffmpeg -loglevel quiet -i " + output_trim + " -af afade=t=out:st=" + str(total_dur - 10) + ":d=10 " + output_final) 

def cleanup_clips(base, emotion):
  print("\nCLEANING CLIP\n")
  i = 1
  while i < 5:
    file = "recordings/final/" + base + "-" + emotion + str(i) + ".wav"
    os.system("rm " + file)
    i += 1
  # os.system("rm -rf recordings/" + base + "/" + emotion)

# move all files to the correct folder
def move_clips(source, destination):
  final_recordings = os.listdir(source)
  for r in final_recordings:
    source_path = os.path.join(source, r)
    dest_path = os.path.join(destination, r)
    os.rename(source_path, dest_path)

# read text from txt and tsv
contents = open(f"../static/data/{LANG0}/02_meditation_{LANG0}.txt", "r").read()
phrases =  contents.split("\n")
print(phrases)
tsv_file = open(f"../static/data/{LANG0}/02_meditation_emotion_specific_{LANG0}.tsv")
read_tsv = csv.reader(tsv_file, delimiter="\t")
k = 0

# generate audio file per row of tsv
last_base = "TESTING"
for row in read_tsv:
  if ("BASE" in row[0]):
    pass
  elif (test_one and row[0] and last_base in row[0]): # to test one for each emotion
    pass
  elif (row[1] and row[2] and row[3]):
    print("\n\nEMOTION "+row[1])
    last_base = row[0]
    generate_script(row)
  else:
    print("MISSING DATA")

move_clips(mp3_source_path, mp3_dest_path)
