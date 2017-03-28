import os, sys, re
from custom_options.py_glob_vars import *

try: 
    os.makedirs(logs_dir)
except OSError:
    if not os.path.isdir(logs_dir):
        raise
		

## log file :
f = sys._current_frames().values()[0]
print f.f_back.f_globals['__file__']

def normalHandling (arg):
	pass
def errorHandling (err):
	log = re.sub('\..*$', '', os.path.basename(f.f_back.f_globals['__file__'])) + ".log"
	logFile = open(os.path.join(logs_dir,log), "a")
	logFile.write(str(err[1]) + "\n")
	logFile.close()
	logFile.execute()
