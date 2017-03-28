import os, sys, re, getopt
import json

# import glob vars for the project
try:
    from custom_options.py_glob_vars import *
except ImportError,e:
    raise sys.exit(e)

images = []

def get_epFolder(argv):
	episode = None
	try:
		opts, args = getopt.getopt(argv,"he:",["episode="])
	except getopt.GetoptError:
		print 'test.py -e "episodeFolder"'
		sys.exit(2)
	for opt, arg in opts:
		if opt == '-h':
			print 'test.py -e "episodeFolder"'
			sys.exit()
		elif opt in ("-e", "--episode"):
			episode = (arg)
	return episode

episodeToFind = get_epFolder(sys.argv[1:])

for dirs in os.listdir(episodes_dir):
	if os.path.isdir(os.path.join(episodes_dir, dirs )):
		images.append(dirs)

mainpattern = "("+episodeToFind.split("_")[0]+")_(The)?("+episodeToFind.split("_")[1]+")"
namePattern = episodeToFind.split("_")[1]
numPattern = episodeToFind.split("_")[0]

guessedEpisode = None
for dir in images:
	if re.search(mainpattern, dir, re.I):
		guessedEpisode = dir
		break

# return the episode folder found in episodes_dir (glob var)
# it will be used to build app folder path in javascript script
print json.dumps(guessedEpisode)