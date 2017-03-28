###################################################
#          Python CollectFiles for AFX
# 
# INFOS #
#	#the .bat file used to run this script is
#	supposed to pass as first argument (%PATH%)
#	the direct path for the .aepx file you want
#	to process
#	#in the same folder a 'temp' file should be
#	stored, and containing all infos for each 
#	file to collect, following this template :
#	[code, source file path, dest file path]
#	where path are in window uri (c:\\dir\\file)
#
###################################################

import os, os.path, re, sys, shutil
from os import access, R_OK

# import glob vars for the project
from custom_options.py_glob_vars import *

# VARIABLES ##
AEPXFile = sys.argv[1] 
AEFolder = os.path.dirname(AEPXFile)
tempFile = os.path.join(AEFolder, r'temp')

# PROCESS ##
if os.path.isfile(tempFile):
	temp = open(tempFile, 'r')
	itemsToCollect = temp.readlines()
	temp.close()
	#os.remove(tempFile)
	
if os.path.isfile(AEPXFile):
	temp = open(AEPXFile, 'r')
	AEPXLines = temp.readlines() # store AEPX file by lines // to process
	temp.close()
	shutil.copy2(AEPXFile, AEPXFile+'.temp') #make a copy of AEPX file to temp file

# FUNCTIONS ##
def copyfiles(source, dest):
	# source = file
	# dest = dir
	if not os.path.exists(dest):
		os.makedirs(dest)
		#print dest, 'created'
		
	destfile = os.path.join(os.path.abspath(dest),os.path.basename(source))
	if not os.path.isfile(destfile):
		#print source, 'copy'
		shutil.copy2(source, destfile)
		#print os.path.basename(destfile), 'copied'
		
def updateAEPX (filecode, source, dest):
	# variables
	newLines = ''
	filepath = source.replace("\'", "&apos;")
	destpath = os.path.abspath(dest).replace("\'", "&apos;")
	# read content last version of aepx and delete the file
	oldAEPX = open(AEPXFile+'.temp', 'r')
	newLines = oldAEPX.read()
	oldAEPX.close()
	os.remove(AEPXFile+'.temp')
	#process lines and overwrite file
	for line in AEPXLines:
			fileLine = re.search ('(fileReference filetype=\"(' + filecode +')\")', line, re.I) # filecode could be remove but it's more secure/strict now
			if fileLine:
				oldPath = re.search (filepath, line, re.I)
				if oldPath:
					#print oldPath.group()  # the pattern asked
					newLine = line.replace(oldPath.group(), destpath)
					#print newLine
					newLines = newLines.replace(line, newLine)
	# re-write the AEPX temp file
	#print newLines
	tempAEPX = open(AEPXFile+'.temp', 'w')
	tempAEPX.write(newLines)
	tempAEPX.close()

	
for item in itemsToCollect:
	itemLine = item.strip() # will remove the "\n" at the end of the line
	itemInfos = itemLine.split(',')
	filecode = itemInfos[0]
	sourcepath = itemInfos[1]
	destpath = itemInfos[2]
	if (len(itemInfos) > 3): #it's a sequence file
		#print itemInfos[3]
		# Copy all files of the sequence to destpath
		filename = itemInfos[3] # example : GB###_Sc[###-###]_name.jpg
		seqBreaks = [] # all files not exisitng in seq file
		fileseqNum = re.search ('\[[0-9]*-[0-9]*\]', filename, re.I)
		if fileseqNum and os.path.isdir(destpath):
			pattern = fileseqNum.group()
			startNum = pattern[1:pattern.find(r'-')]
			endNum = pattern[pattern.find(r'-')+1:len(pattern)-1]
			num = int(startNum)
			while (num <= int(endNum)):
				filenum = str(num).zfill(len(startNum)) # 000
				supposedFileName = filename.replace(pattern,filenum)
				supposedFile = os.path.join(os.path.abspath(sourcepath), supposedFileName)
				if os.path.isfile(supposedFile):
					copyfiles(supposedFile, destpath)
				else:
					seqBreaks.append(supposedFileName)
				num = num + 1
		# uncomment next line to print list of all missing files of the sequence
		#print seqBreaks
		# Update AEPX file
		updateAEPX (filecode, sourcepath, destpath)
		
	else: # file not part of sequence
		# Copy the file to dest dir
		destdir = os.path.dirname(destpath)
		copyfiles(sourcepath, destdir)
		# Update AEPX file
		updateAEPX (filecode, sourcepath, destpath)
	
	

if os.path.isfile(AEPXFile+'.temp'):
	shutil.copy2((AEPXFile+'.temp'), AEPXFile)
	os.remove(AEPXFile+'.temp')

print '\"files collected\"'
