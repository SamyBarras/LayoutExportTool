import os, sys, re, getopt
# import glob vars for the project
from custom_options.py_glob_vars import *

# import var from bat File
def get_args(argv):
	try:
		opts, args = getopt.getopt(argv,"hf:",["file="])
	except getopt.GetoptError:
		print 'test.py -f "file"'
		sys.exit(2)
	for opt, arg in opts:
		if opt == '-h':
			print 'test.py -f "file"'
			sys.exit()
		elif opt in ("-f", "--file"):
			sourceFile = os.path.expanduser(arg)
			print sourceFile, Path(sourceFile).exists()
	return sourceFile, destFile

fileToRemove = get_args(sys.argv[1:])

if debug is False:
	os.remove(fileToRemove)
print "%s deleted from %s" %()