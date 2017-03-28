import os, shutil, sys, getopt
import execjs
# import glob vars for the project
from custom_options.py_glob_vars import *

# import var from bat File
def get_epFolder(argv):
	try:
		opts, args = getopt.getopt(argv,"hs:d:",["source=","destination="])
	except getopt.GetoptError:
		print 'test.py -s "source file" -d "destination path"'
		sys.exit(2)
	for opt, arg in opts:
		if opt == '-h':
			print 'test.py -s "source file" -d "destination path"'
			sys.exit()
		elif opt in ("-s", "--source"):
			sourceFile = os.path.expanduser(arg)
			print sourceFile, Path(sourceFile).exists()
		elif opt in ("-d", "--destination"):
			destFile = os.path.expanduser(arg)
			print destFile
	return sourceFile, destFile

filesToCopy = get_epFolder(sys.argv[1:])

if debug is False:
	shutil.copy2(filesToCopy[0], filesToCopy[1])
print '\"', Path(filesToCopy[1]), ' copied into approved folder\"'