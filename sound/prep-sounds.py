import os

directory = "./sounds/"
out_directory = "./sounds-long/"
os.system("mkdir " + out_directory)

for filename in os.listdir(directory):
    if filename.endswith(".aif"):
        command = "sox " + os.path.join(directory, filename) + " " + os.path.join(directory, filename) + " " + os.path.join(out_directory, filename)
        print command
        os.system(command)
    else:
        continue

directory = "./sounds-long/"
out_directory = "./sounds-longer/"
os.system("mkdir " + out_directory)

for filename in os.listdir(directory):
    if filename.endswith(".aif"):
        command = "sox " + os.path.join(directory, filename) + " " + os.path.join(directory, filename) + " " + os.path.join(out_directory, filename)
        print command
        os.system(command)
    else:
        continue

os.system("rm -rf " + directory)
