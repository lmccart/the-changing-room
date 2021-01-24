import os

directory = "./sounds-orig/"
out_directory = "./sounds/"

for filename in os.listdir(directory):
    if filename.endswith(".aif"):
        command = "sox " + os.path.join(directory, filename) + " " + os.path.join(directory, filename) + " " + os.path.join(out_directory, filename)
        print command
        os.system(command)
    else:
        continue