import os

directory = "./sounds-long/"
out_directory = "./sounds-longer/"

for filename in os.listdir(directory):
    if filename.endswith(".aif"):
        command = "sox " + os.path.join(directory, filename) + " " + os.path.join(directory, filename) + " " + os.path.join(out_directory, filename)
        print command
        os.system(command)
    else:
        continue