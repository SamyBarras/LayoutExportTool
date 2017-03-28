#!/usr/bin/python
#coding=utf-8
'''
--args						actions
-m							run multiple instance of after effects
-noui						do not show the UI
-s "script"					run "script" in current instance of after
-r \path\script.jsx			run script using given path (can be used with -noui)
-re							launch AE in Render Engine mode
-wf							launch AE as watch folder
'''

import sys
import subprocess
import os
import execjs
import json
import logging
import shutil
import re
import errno
import glob
import time
import pprint
from custom_options.py_glob_vars import *

# "%UserProfile%\Documents\script.jsx"
try:
	import execjs
	from shotgun_link import *
except ImportError,e:
	raise sys.exit(e)
	
debug = True
def makeDir (path):
	try:
		os.makedirs(path)
	except OSError, exc: # Python >2.5
		if exc.errno == errno.EEXIST and os.path.isdir(path):
			time.sleep(2)
			try:
				for root, dirs, files in os.walk(path):
					for file in files:
						if os.path.isfile(os.path.join(root, file)):
							os.remove(os.path.join(root, file))
						if os.path.isdir(os.path.join(root, file)):
							os.rmdir(os.path.join(root, file))
			except EnvironmentError,e:
				kestion = raw_input("%s\n\n Retry (1/1) ? [y/n]" %e)
				if str(kestion) == "y":
					time.sleep(2)
					makeDir(path,1)
				else:
					raise sys.exit(e)
		else: raise


''' paths variables '''
exportTask_temp_dir = os.path.expanduser("~\Documents\AdobeScripts\ExportTool\export_task")
collectFiles_temp_dir = os.path.expanduser("~\Documents\AdobeScripts\ExportTool\export_task\collect_files_datas")
logs_dir = os.path.expanduser('~\Documents\AdobeScripts\ExportTool\export_task\logs')
makeDir (collectFiles_temp_dir)	
makeDir (logs_dir)	
export_datas_file = os.path.join(exportTask_temp_dir ,"export.inf")
pprint.pprint(export_datas_file)
zeroindex = export_datas_file[0]
pprint.pprint(zeroindex)
export_temp_aepx = os.path.abspath(os.path.join(exportTask_temp_dir,"export_temp.aepx"))
# Added by J Hearn.  Path relative to location of this script to assist dev
scripts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir))
''' gen variables'''
toExport_ae = []
toExport_qt = []	
toExport_framing = []
toExport_maya = []
toExport_bg = []
toExport_bg_reuse = []
toUpload_bg = [] # the bgs which are re-use but not already on shotgun >> only upload them on shotgun
num_errors = 0
err_codes = {
	'1'  : "some random shit",
	'55' : "shot datas undefined",
	'65' : "can\'t find compItem for shot",
	# 10# > aepx build
	'12' : "Wrong name for final AEP project", #%aepx name
	'13' : "final aepx file already exists. Can't overwrite !", #%shot_infos[3]
	# 20# > renderQueue build
	'22' : "no layers with blue label",
	'23' : "renderQueue output template \"GUMBALL\" not existing !",
	'24' : "renderQueue output module template \"GUMBALL_LO_Screenshot\" not existing !"
	}
bg_asset_status = {
		0:'uploaded',
		1:'error while uploading',
		2:'already uploaded',
		3:'task assigned to BG',
		4:'error',
		5:'updated',
		}
video_file_extensions = [".mov",".mp4",".avi",".mpeg",".mpg"]
''' log file built '''
logging.basicConfig(
	filename = os.path.join(logs_dir,'export_task.log'),
	filemode ='w',
	format = "%(levelname) -10s %(lineno)s %(message)s", # %(lineno)s %(name)s 
	level = logging.DEBUG
)
''' FUNCTIONS '''
def log (type, txt):
	global num_errors
	if type is "err":
		print type,':', txt
		logging.warning (txt)
		num_errors += 1
	elif type is "debug" and debug == True:
		logging.debug (txt)
	elif type is "debug" and debug == False:
		return
	elif type is "info":
		print txt
		logging.info (txt)
	else:
		logging.warning (txt)
	return
		
def copyFootagefiles(source, dest):
	# source = file
	# dest = dir in appFolder
	if not os.path.exists(dest):
		os.makedirs(dest)
		log ('debug', "%s dir has been created" %dest)
	
	footage_dir = os.path.join("../AE/",os.path.split(os.path.abspath(dest))[1])
	destfile = os.path.join(os.path.abspath(dest),os.path.basename(source))
	result = False
	if not os.path.isfile(destfile):
		try:
			shutil.copy2(source, destfile)
		except EnvironmentError:
			log ('err', 'Error while copying %s to %s' %(source, footage_dir))
			result = False
		else:
			result = str('%s copied to %s' %(os.path.basename(source),footage_dir))
			log ('info', result)
			result = True
		finally:
			return result
	else:
		log ('info', '%s already exists in %s' %(os.path.basename(source),footage_dir))
		return True
		
def copyfiles(source, destfile):
	# source = file
	# dest = file
	result = False
	if source != destfile:
		if os.path.isfile(destfile):
			try:
				os.remove(destfile)
			except EnvironmentError, e:
				log ('err', 'Error while deleting old %s >> %s' %(os.path.basename(destfile),e))
				result = False
				raise sys.exit(e)
			else:
				log('debug','%s deleted before copying new version.' %os.path.basename(destfile))
		elif source is destfile:
			log ('info', source + " is already copied in the approved folder")
		if not os.path.isfile(destfile):
			try:
				shutil.copy2(source, destfile)
			except EnvironmentError:
				log ('err', 'Error while copying %s to %s' %(os.path.basename(source), os.path.dirname(destfile)))
				result = False
			else:
				result = str('%s copied to %s' %(os.path.basename(source),os.path.dirname(destfile)))
				log ('info', result)
				result = True
			finally:
				return result
		else:
			log ('info', '%s already exists in %s' %(os.path.basename(source),os.path.dirname(destfile)))
			return True
	else:
		log('info', os.path.basename(source) +" and " + os.path.basename(destfile) + " are same files  >> not copied")
		return True
			
def readFile (path,arg):
	try:
		file = open(path, 'r')
		if arg == 0:
			lines = file.readlines()
		else:
			lines = file.read()
		file.close()
		return lines
	except IOError:
		log('err', 'Can\'t read the file "%s"' %path)
		return undefined

def exportBGFiles(bg_datas, dest_folder):
	'''this function to export BG files depending of the bg type'''
	bg_name = bg_datas['name']
	filesToRename = bg_datas['filesToRename'] # array of integers
	preview_file = bg_datas['previewFile'] # integer
	files_list = bg_datas['files'] # array of string/array
	satus = 'not exported'
	''' copy files of bg_asset to the approved folder '''
	if bg_datas['id'] == "new AFX moving set":
		# file 0 : array [aep source, compitem_id, compItem_name]
		# file 1 : path of preview video
		for i, item in enumerate(files_list):
			if i == 0:
				if collect_files_for_BGAFX == True:
					# open aep project item[0], reduce project and collect files for comp item[1|2]
					log ('warning', 'Script not ready to collect files for specific BGAFX !')
					log ('info', 'bg_asset\'s compItem is in the main aepx file of the shot...')
				else:
					log ('info', 'bg_asset\'s compItem is in the main aepx file of the shot...')
			else:
				approved_file_name = bg_name + os.path.splitext(item)[1]
				approved_file_path = os.path.join(dest_folder, approved_file_name)
				log('info', "copy %s to %s..." %(item,approved_file_path))
				copie = copyfiles(item,approved_file_path)
				if copie == True:
					# no error occured while copying files... we can rename files into the BG asset object
					bg_datas['files'][i] = approved_file_path
					bg_datas['status'] = 'exported'
				else:
					log ('err', "can't rename file [%s] in .asset list >> error occured while copying file to approved folder" %item)
				
	elif bg_datas['id'] == "new Camera Map":
		# file 0 : to be renamed as BGmatte
		# file 1 : use bg_name (BGType = BG3Dmoving)
		for i, item in enumerate(files_list):
			if i == 0:
				approved_file_name = bg_name.replace("BG3Dmoving", "BGmatte") + os.path.splitext(item)[1]				
				approved_file_path = os.path.join(dest_folder, approved_file_name)
			else:
				approved_file_name = bg_name + os.path.splitext(item)[1]
				approved_file_path = os.path.join(dest_folder, approved_file_name)
			log('info', "copy %s to %s..." %(item,approved_file_path))
			copie = copyfiles(item,approved_file_path)
			if copie == True:
				# no error occured while copying files... we can rename files into the BG asset object
				bg_datas['files'][i] = approved_file_path
				bg_datas['status'] = 'exported'
			else:
				log ('err', "can't rename file [%s] in .asset list >> error occured while copying file to approved folder" %item)
	else:
		# all other types which don't need specific actions
		# for each file, build final path, copy file to approved folder, and update path in bg_datas
		for i, item in enumerate(files_list):
			if i in filesToRename:
				#this file has to be renamed
				approved_file_name = bg_name + os.path.splitext(item)[1]
				approved_file_path = os.path.join(dest_folder, approved_file_name)
			else:
				# do not rename the file
				approved_file_path = os.path.join(dest_folder, os.path.split(item)[1])
			log('info', "copy %s to %s..." %(item,approved_file_path))
			copie = copyfiles(item,approved_file_path)
			if copie == True:
				# no error occured while copying files... we can rename files into the BG asset object
				bg_datas['files'][i] = approved_file_path
				bg_datas['status'] = 'exported'
			else:
				log ('err', "can't rename file [%s] in .asset list >> error occured while copying file to approved folder" %item)
				
	return bg_datas
	
def upload_asset_ToShotgun (assetObj,arg):
	''' this function get asset object as parameter
		return asset object (sg_id should be updated if asset uploaded on shotgun)
		
		if arg = 0  > do not upload files
		if arg = 1  > full upload
	'''
	result = [False]
	def buildDict (assetObj):
		# get target episode
		ep_fields = ['id', 'code']
		ep_filters = [ 
			['project','is',{'type':'Project','id':project_id}], 
			['code', 'is', assetObj['episode']] 
			]
		sg_episode = sg.find_one('Sequence', ep_filters, ep_fields)
		# get task template
		filters = [ ['code','is', assetObj['task_template'] ] ]
		taskTemplate = sg.find_one('TaskTemplate',filters)
		# try to get creator/user
		fields = ['name', 'id']
		filters = [
				#['name','contains', re.sub('^.','',assetObj['creator'])],
				['login','is', assetObj['creator']]
				]
		user = sg.find_one('HumanUser', filters, fields)
		# build dict
		data = {
			'project': {'type':'Project','id':project_id},
			'code':assetObj['name'],
			'sg_asset_type':assetObj['type'],
			'sg_background_type':assetObj['BGType'],
			'sequences':[sg_episode]
			}
		# add extra rules to dict
		if create_task_templates == True:
			#we create the task templates for BG directly here
			data['task_template'] = taskTemplate
		else:
			data['description'] = assetObj['task_template']
		if user:
			data['created_by'] = {'type':'HumanUser','id':user['id']}
			
		return data
	def findAsset (assetObj):
		fields = ['id', 'code', 'sg_asset_type', 'tag_list', 'image', 'sg_latest_file']
		filters = [
				['project','is',{'type':'Project','id':project_id}],
				['sg_asset_type','is', 'Background']
				]
		try:
			if assetObj['sg_id'] and str(assetObj['sg_id']).isdigit():
				# if asset as already been uploaded we use the id
				# so that we prevent creation of new asset if asset name changed
				filters.append(['id', 'is', assetObj['sg_id']])
			else:
				filters.append(['code', 'is', assetObj['name']])
		except:
			filters.append(['code', 'is', assetObj['name']])
				
		result = sg.find('Asset', filters, fields)
		return result

	def findTasks (sg_asset):
		filters = [
					['entity', 'is', sg_asset],
				]
		tasks = sg.find_one('Task',filters,['step','content','id'])
		return tasks
		
	data_dict = buildDict (assetObj)
	sg_assets = findAsset (assetObj)
	new_asset = None
	if len(sg_assets) == 1:
		# found one corresponding asset on shotgun...
		sg_asset = sg_assets[0]
		if overwrite_existing_BGasset == False:
			# option to overwrite existing assets is False, break and return err
			log ('err', 'found 1 assets with corresponding name on Shotgun >> can\'t upload the asset')
		else:
			log('info', 'found 1 asset with corresponding name found in Shotgun !')
			tasksCount = findTasks(sg_asset)
			if tasksCount:
				# at least one task on the asset
				log ('info', '%s task \"%s\" found for %s' %(tasksCount['step']['name'], tasksCount['content'], assetObj['name']))
				# we can't modify the BG asset
			else:
				# no task on the asset, it can be updated!
				log ('info', 'no task found for %s - update it...' %assetObj['name'])
				# Jonathan Hearn - remove 'created_by' field, as this fails when used with update()
				if 'created_by' in data_dict:
					del data_dict['created_by']
				new_asset = sg.update("Asset", sg_asset['id'], data_dict)
	elif len(sg_assets) == 0:
		# it is a brand new asset
		new_asset = sg.create("Asset", data_dict)
	else:
		#more than one corresponding asset on shotgun  or error
		log ('err', "%s assets with corresponding name found on Shotgun // can\'t upload !" %len(sg_assets))
	
	if new_asset and arg == 1:
		try:
			log ('debug', new_asset)
			# now update the tags
			new_asset = sg.update('Asset', new_asset['id'], {'tag_list' : [element.lower() for element in assetObj['tag_list'].split(',')]})
			log ('debug', new_asset)
			# set resolution
			if 'resolution' in assetObj:
				log('debug', 'resolution of %s for this asset' %assetObj['resolution'])
				new_asset = sg.update('Asset', new_asset['id'], {'sg_resolution' : assetObj['resolution']})
			else:
				log('info', 'resolution not set for this asset')
				new_asset = sg.update('Asset', new_asset['id'], {'sg_resolution' : ""})
				
			# get the asset object with latest infos
			fields =  ['id', 'code', 'sg_asset_type', 'sg_latest_file']
			filters = [
				['project','is',{'type':'Project','id':project_id}],
				['id','is',new_asset['id']] 
				]
			new_asset = sg.find_one('Asset', filters, fields)
			# now upload the thumbnail
			previewFile = assetObj['files'][assetObj['previewFile']]
			if os.path.splitext(previewFile)[1] not in video_file_extensions:
				# previewFile not a video >> upload thumbnail
				log('debug', "thumbnail file ==> %s" %previewFile)
				thumb = sg.upload_thumbnail('Asset', new_asset['id'], previewFile)
				log('info', 'thumbnail added to asset [%s]' %thumb)
			else:
				# to have video as thumbnail we need to convert video as filmstrip:
				# https://github.com/shotgunsoftware/python-api/wiki/Reference%3A-Methods#upload_filmstrip_thumbnail
				# maybe play with ffmpeg :
				# http://www.binpress.com/tutorial/how-to-generate-video-previews-with-ffmpeg/138
				# https://gist.github.com/martinsik/5237977560ea7d60ad11#file-video_preview-sh
				source_video = previewFile
				log('info', "creation of filmstrip for thumbnail...")
				# create the film_strip
				# first export all keyframes into a temp folder:
				temp_dir = os.path.abspath(os.path.join(exportTask_temp_dir,'temp'))
				makeDir (temp_dir)
				temp_files = os.path.abspath(os.path.join(temp_dir,"temp-%5d.jpeg"))
				log('debug',temp_files)
				# J Hearn - try another approach, if I-frame extraction yields no images
				for jh_count in range(2):
					if jh_count == 0:
						command_line = "%s -i \"%s\" -s hd480 -vf \"select=eq(pict_type\,I)\" \"%s\"" %(ffmpeg, source_video, temp_files)
					else:
						log('debug', "JH: I-frame approach yielded zero frames. Extracting every 10th frame..")
						command_line = "%s -i \"%s\" -s hd480 -r 2.5 \"%s\"" %(ffmpeg, source_video, temp_files)
					return_code = subprocess.call(command_line, shell=True)
					log ('debug', 'keyframes exported to temp dir')
					log ('debug', return_code)
					# get number of jpegs created
					files = [ f for f in os.listdir(temp_dir) if os.path.isfile(os.path.join(temp_dir,f))]
					if files:
						break # J Hearn - as soon as an approach yields files, stop
				log('debug',files)
				filmstrip_length = len(files)
				log ('debug', '%s keyframes exported to temp dir' %filmstrip_length)
				filmstrip_path = os.path.abspath(os.path.join(temp_dir,os.path.splitext(os.path.basename(previewFile))[0] + "_filmstrip.jpeg"))
				# make sure number of keyframes used for creation of filmstrip is not too high :
				max_length = 272 # 272 images of 240 pixel wide = 65280px	>>> max for ffmpeg is 65500px wide
				if filmstrip_length > max_length:
					n = filmstrip_length / max_length
					keyframes = [tuple(files[i:i+n]) for i in range(0, filmstrip_length, n)]
					while len(keyframes) * 240 > 65500:
						max_length = max_length-1
						n = filmstrip_length / max_length
						keyframes = [tuple(files[i:i+n]) for i in range(0, filmstrip_length, n)]
						res = ["max length set to %s" %max_length, "take frame every %s frames" %n, "total keyframes used : %s" %len(keyframes), "width of filmstrip :%spx" %(len(keyframes) * 240)]
						log('debug', '\n'.join(res))
					select_type = "select='not(mod(n\,%s))'" %n
					filmstrip_length = len(keyframes)
				else:
					select_type = "select=1"
				#command_line = "%s -i \"%s\" -frames 1 -q:v 1 -vf \"select=eq(pict_type\,I),setpts=N/(25*TB),scale=240:-1,tile=%sx1\" \"%s\"" %(ffmpeg, source_video, filmstrip_length, filmstrip_path)
				command_line = "%s -i \"%s\" -frames 1 -vf \"%s,scale=240:-1,tile=%sx1\" \"%s\"" %(ffmpeg, temp_files, select_type, filmstrip_length, filmstrip_path)
				return_code = subprocess.call(command_line, shell=True)
				log('debug', command_line)
				# create the thumbnail
				thumbnail_path = os.path.abspath(os.path.join(temp_dir,os.path.splitext(os.path.basename(previewFile))[0] + "_thumbnail.jpeg"))
				command_line = "%s -i \"%s\" -vf \"thumbnail,scale=1280:-1\" -frames:v 1 \"%s\"" %(ffmpeg, source_video, thumbnail_path)
				return_code = subprocess.call(command_line, shell=True)
				log('debug', command_line)
				# upload thumbnail and filmstrip to shotgun
				try:
					thumbnail_upload = sg.upload_thumbnail('Asset', new_asset['id'], thumbnail_path)
					filmstrip_upload = sg.upload_filmstrip_thumbnail('Asset', new_asset['id'], filmstrip_path)
				except shotgun_api3.shotgun.Fault,e:
					log('err',"an error has occured while uploading thumbnail or filmstrip_thumbnail to the asset ! >> %s" %e)
				else:
					log('info', 'thumbnails added to the asset [%s,%s]' %(thumbnail_upload,filmstrip_upload))
				
			# upload latest file
			latest_file = assetObj['files'][local_files[assetObj['id']]]
			log ('debug', latest_file)
			if latest_file:
				local_path = {
					'this_file': {
						'local_path': latest_file,
						'name': os.path.basename(latest_file),
						},
					'attachment_links': [{'type':'Asset','id':new_asset['id']}],
					'project': {'type':'Project','id':project_id}
					}
				# upload attachment file
				log('debug', local_path)
				attached_file = sg.create('Attachment', local_path)
				log ('info','File "%s" linked to the asset.' %os.path.basename(latest_file))
				sg.share_thumbnail([attached_file], source_entity={'type':'Asset', 'id': new_asset['id']})
				if os.path.splitext(previewFile)[1] in video_file_extensions:
					sg.share_thumbnail([attached_file], source_entity={'type':'Asset', 'id': new_asset['id']}, filmstrip_thumbnail=True)
				log ('info','File\'s thumbnail shared with the asset.')
			else:
				log('info','File "%s" already linked to the asset !' %os.path.basename(latest_file))
		except shotgun_api3.shotgun.Fault,e:
			log('err',"an error has occured while populate the asset description ! >> %s" %e)
		else:
			assetObj['sg_id'] = new_asset['id']
			# the asset has correctly been uploaded on shotgun
			log ('info', "BG asset has been uploaded to Shotgun [%s]" %new_asset['id'])
			
	elif new_asset and arg == 0:
		assetObj['sg_id'] = new_asset['id']
		# the asset has correctly been uploaded on shotgun
		log ('info', "BG asset has been uploaded to Shotgun [%s]" %new_asset['id'])
	else:
		log('err', 'error while creating or uploading the asset on shotgun')
	
	return assetObj
def upload_shot_ToShotgun (shotObj,backgrounds_list):
	''' 
		this function get shot object as parameter
		return shot object at the end with "uploaded" status
	'''
	def update_shot (shotObj,sg_shot, backgrounds_list):
		# build dict
		# get task template
		taskTemplate = None
		if 'task_template' in shotObj:
			filters = [ ['code','is', shotObj['task_template'] ] ]
			taskTemplate = sg.find_one('TaskTemplate',filters)
			tt = sg.update('Shot', sg_shot['id'], {'task_template':taskTemplate})
			log('info', 'Task template "%s" added to the shot' %shotObj['task_template'])
		else:
			''' if  no task tempalte for this shot, make sure '''
		# add extra rules to dict
		bgs_list = []
		for bg in backgrounds_list:
			obj = {'type':'Asset', 'id':bg[1], 'code':bg[0]}
			bgs_list.append(obj)
		log('debug', bgs_list)
		sgbg = sg.update('Shot', sg_shot['id'], {'sg_background_asset_1':bgs_list})
		if  isinstance(sgbg, dict):
			log('info', 'shot entity "%s" correctly updated on Shotgun.' %sg_shot['code'])
		else:
			log('err', 'An error has occured while updating shot entity "%s" on Shotgun' %sg_shot['code'])
		
	def findShot (shotObj):
		# get target episode
		ep_fields = ['id', 'code']
		ep_filters = [ 
			['project','is',{'type':'Project','id':project_id}], 
			['code', 'is', shotObj['episodeCode']] 
			]
		sg_episode = sg.find_one('Sequence', ep_filters, ep_fields)
		fields = ['id', 'code']
		filters = [
				['project','is',{'type':'Project','id':project_id}],
				['sg_sequence','is',{'type':'Sequence','id':sg_episode['id']}],
				['code', 'is', shotObj['shotCode']],
				]
		result = sg.find('Shot', filters, fields)
		return result

	sg_shots = findShot (shotObj)
	new_Shot = None
	if len(sg_shots) == 1:
		# found one corresponding asset on shotgun...
		log('info', 'Entity \"%s\" [Shot] found on Shotgun.' %sg_shots[0]['code'])
		try:
			sg_shot = sg_shots[0]
			update_shot(shotObj, sg_shot, backgrounds_list)
		except shotgun_api3.shotgun.Fault,e:
			log('err',"an error has occured while updating the shot entity [%s] ! >> %s" %(sg_shot['code'],e))
		else:
			shotObj['status'] = "uploaded"
	elif len(sg_shots) == 0:
		# none corresponding asset on shotgun  or error
		log ('err', "Entity \"%s\" [Shot] not found on Shotgun// can\'t upload latest infos!" %shotObj['shotCode'])
	else:
		log('err', 'error occured while upadting shot \"%s\" on shotgun' %shotObj['shotCode'])
	return shotObj
#main
'''
# build huge list of shots_infos (for each shot, get .shot file and append to huge list)
	- define which one need framing, qt and ae and build lists
	- build list of maya files
	- build list of new bg assets
# in main aepx file (temp):
- build aepx files for each shot + list of footages to collect
- build renderQueue for all framings + save as new file + run aerender as command line
# copy files for aepx
# collect file into aepx
# copy maya files
# copy qt files
# use list of new bg assets to export
- for each bg asset:
	~ get bg object in .assets list
	~ copy files to the approved folder
	~ update paths with approved ones
	~ upload asset to shotgun

# upload shot objects to shotgun
'''
#make a copy of AEPX file to temp file
try:
	archive = os.path.splitext(export_datas_file)[0] + '.temp'
	shutil.copy2(export_datas_file, archive)
except EnvironmentError:
	log ('err', 'Error while creating temp file "%s"' %archive)
	
if os.path.isfile(export_datas_file):
	log('debug', "Get datas from:\n%s" %export_datas_file)
	temp = open(export_datas_file).read()
	datas_obj = execjs.eval(temp)
	#log ('info', "Datas exported from:\n%s" %datas_obj['path'])
	#log ('info', "%s shots to export:" %(len(datas_obj['shots'])))
	assets_list_path = datas_obj['assets_list_path']
	assets_list_file = open(assets_list_path).read()
	assets_list = execjs.eval(assets_list_file)
	# fill up lists with datas from .shot files
	for shot in datas_obj['shots']:
		shot_num = shot['shot_infos'][0]
		shot_compItem = shot['shot_infos'][1]
		shot_appFolder = shot['shot_infos'][2]
		shot_final_aepx = shot['shot_infos'][3]
		log ('info', ">> Sc%s" %shot_num)
		# open .shot file to get parameters
		shot_file = readFile(os.path.join(shot_appFolder,'.shot'),1)
		shot_datas = execjs.eval(shot_file)
		for obj in shot_datas:
			log ('debug', '%s : %s' %(obj, shot_datas[obj]))
		# ae / qt / framing ?
		log('info', 'Export AE : %s' %shot_datas['exportAE'])
		if shot_datas['exportAE'] == True:
			toExport_ae.append(shot_num)
			ae_dir = os.path.join(shot_appFolder,'AE')
			if os.path.isdir(ae_dir):
				command_line = "rd /s /q \"%s\"" %os.path.normpath(ae_dir)
				return_code = subprocess.call(command_line, shell=True)
				makeDir (ae_dir)
			else:
				makeDir (ae_dir)
		
		log('info', 'Export QT : %s' %shot_datas['exportQT'])
		if shot_datas['exportQT'] == True:
			toExport_qt.append(shot_num)
			
		log('info', 'Export Framing : %s' %shot_datas['exportFraming'])
		if shot_datas['exportFraming'] == True:
			toExport_framing.append(shot_num)
			
		shot_datas['exportMultiFraming'] = 'exportMultiFraming' in shot_datas and shot_datas['exportMultiFraming']
		log('info', 'Export Multi-Framing : %s' % shot_datas['exportMultiFraming'])
		while len(shot['shot_infos']) < 5:
			shot['shot_infos'].append(False)
		shot['shot_infos'][4] = shot_datas['exportMultiFraming']
			
		#maya file ?
		if 'maFile' in shot_datas:
			if shot_datas['maFile'][0] and os.path.isfile(shot_datas['maFile'][0]):
				log('info', 'Export Maya file : %s' %'True')
				toExport_maya.append([shot_num,shot_datas['maFile']])
			elif not shot_datas['maFile'][0]:
				log ('err', '%s is not a valid file' %shot_datas['maFile'][0])
				break
			else:
				log('info', 'Export Maya file : %s' %'False')
		else:
			log('info', 'Export Maya file : %s' %'False')
		# bg asset(s) ?
		if 'background_asset' in shot_datas and len(shot_datas['background_asset']) >= 1:
			log ('info', '%s background(s) linked to the shot:' %len(shot_datas['background_asset']))
			for bg in shot_datas['background_asset']:
				bg_name = bg[0]
				bg_type = bg[1]
				bg_sg_id = bg[2]
				if re.search('re-use', bg_type, re.I):
					if bg_sg_id and str(bg_sg_id).isdigit:
						# it is a re-use from shotgun...
						toExport_bg_reuse.append(bg)
						log('info', '%s is a BG re-use [%s]' %(bg_name, bg_sg_id))
					elif bg_name in assets_list and always_upload_ifReuse == True:
						# re-use of episode's asset
						# if not already uploaded or locked, we want to create asset on shotgun
						# files won't be copied
						if assets_list[bg_name]['status'] not in ['locked','uploaded']:
							toUpload_bg.append(assets_list[bg_name])
							log('info', '%s is a BG re-use from current episode [added to export list]' %(bg_name))
				else:
					if overwrite_existing_BGasset == True:
						temp = ['locked']
					else:
						temp = ['locked','uploaded']
					if assets_list[bg_name]['status'] not in temp:
						if bg_sg_id == True:
							bg.append(shot_appFolder)
							toExport_bg.append(bg)
							log('info', '%s [added to export list]' %bg_name)
						else:
							log('info', '%s [not added to export list]' %bg_name)
					else:
						log('info', '%s [not added to export list: %s]' %(bg_name,assets_list[bg_name]['status']))
		else:
			log('info', 'no bg asset to export for this shot')
	
	# now lists are filled up
	# write the export.inf with these new informations...
	# write file to be read by afx script
	datas_obj['toExport_ae'] = toExport_ae
	datas_obj['toExport_qt'] = toExport_qt
	datas_obj['toExport_framing'] = toExport_framing
	datas_obj['toExport_maya'] = toExport_maya
	datas_obj['toExport_bg'] = toExport_bg
	datas_obj['toExport_bg_reuse'] = toExport_bg_reuse
	datas_obj['toUpload_bg'] = toUpload_bg
	shot_log = open(export_datas_file, 'w')
	shot_log.write("(" + json.dumps(datas_obj)+")")
	shot_log.close()
	''' ready to go back to after effect '''
	log ('info', "=== Exporting AE Projects === ")
	if len(datas_obj['toExport_ae']) > 0:
		# build aepx file for each shot and collect list of footages
		log('info', "Reduce project and build aepx files in approved folders...")
		# call afx script
		# command_line = "\"C:\Program Files\Adobe\Adobe After Effects CC 2014\Support Files\AfterFX.com\" -s \"alert(0);\""
		command_line = "\"C:\Program Files\Adobe\Adobe After Effects CC 2014\Support Files\AfterFX.com\" -r \"%s/(external_js)/export_task/reduce_project_CC2014.jsx\"" % scripts_dir.replace("\\", "/")
		log('debug', command_line)
		return_code = subprocess.call(command_line, shell=False)
		log('debug', return_code)
		if return_code != 0:
			#an error has been handled
			error = err_codes[str(return_code)[:2]]
			pprint.pprint(error)
			pprint.pprint(command_line)
			pprint.pprint(return_code)
			pprint.pprint(debug)
			pprint.pprint(datas_obj)
			#shot_num = datas_obj['shots'][int(str(return_code)[2:])]['shot_infos'][0]
			log('err',"[Sc%s] %s" %(shot_num,error))
		# export ae projects / collec files
		for obj in datas_obj['toExport_ae']:
			shot_num = obj
			collect_files_datas_file_path = os.path.join(collectFiles_temp_dir, "%s.temp" %obj)
			collect_files_datas_file = open(collect_files_datas_file_path).read()
			shot_object = execjs.eval(collect_files_datas_file)
			shot_infos = shot_object['shot_infos']
			files_to_collect = shot_object['files_to_collect']
			# colect files from list
			log('info', "collecting files for Sc%s [%s]..." %(obj,len(files_to_collect)))
			shot_num = shot_infos[0]
			afx_compItem = shot_infos[1]
			appFolder = str(shot_infos[2])
			final_aepx_name = str(shot_infos[3])
			final_aep_file = os.path.join(appFolder,"AE",final_aepx_name)
			# collect files process : copy files, update lines in the *.aepx file
			log('info', "Copy footages [%s]..." %len(files_to_collect))
			paths_to_update=[]
			for footage in files_to_collect:
				filecode = footage[0]
				sourcepath = os.path.normpath(footage[1])		# file path
				destpath = os.path.normpath(footage[2])		# dir path
				if (len(footage) > 3): #it's a sequence file
					filename = footage[3]
					seqBreaks = [] # all files not exisitng in seq file
					fileseqNum = re.search ('\[[0-9]*-[0-9]*\]', filename, re.I)
					if fileseqNum and os.path.isdir(sourcepath):
						pattern = fileseqNum.group()
						startNum = pattern[1:pattern.find(r'-')]
						endNum = pattern[pattern.find(r'-')+1:len(pattern)-1]
						num = int(startNum)
						while (num <= int(endNum)):
							filenum = str(num).zfill(len(startNum)) # 000
							supposedFileName = filename.replace(pattern,filenum)
							supposedFile = os.path.join(os.path.abspath(sourcepath), supposedFileName)
							if os.path.isfile(supposedFile):
								copyFootagefiles(supposedFile, destpath)
							else:
								seqBreaks.append(supposedFileName)
							num = num + 1
					else:
						log ('err', 'can\'t collect images sequence >> numbers or source dir not valid')
					if len(seqBreaks) > 0:
						log ('info', "there are %s files missing for the image sequence" %len(seqBreaks))
					paths_to_update.append([filecode, sourcepath, destpath])
				else:
					copyFootagefiles(sourcepath, destpath)
					paths_to_update.append([filecode, sourcepath, destpath])
			# re-write aepx file with updated paths
			log('info', "Update paths in aepx project [%s]..." %len(paths_to_update))
			#make a copy of AEPX file to temp file
			try:
				temp_aepx = os.path.splitext(final_aep_file)[0] + '.temp'
				shutil.copy2(final_aep_file, temp_aepx)
				log('debug', os.path.isfile(temp_aepx))
			except EnvironmentError:
				log ('err', 'Error while creating temp file')
				break
			# read lines of aepx
			temp_aepx_file = open(temp_aepx, 'r')
			temp_aepx_lines = temp_aepx_file.readlines()
			temp_aepx_file.close()
			
			temp_aepx_file = open(temp_aepx, 'r')
			new_aepx_lines = temp_aepx_file.read().decode('utf-8')
			temp_aepx_file.close()
			
			# make changes into new_aepx_lines
			numLines = 0
			numFootages = 0
			for footage in paths_to_update:
				filecode = footage[0]
				sourcepath = os.path.normpath(footage[1])
				if os.path.isfile(sourcepath):
					sourcepath = os.path.dirname(sourcepath)
				destpath = os.path.normpath(footage[2])
				footage_found = False
				for line in temp_aepx_lines:
					cline = line.decode("utf-8")
					# J Hearn - altered this regex, as 'filetype' isn't present in the aepx
					fileLine = re.search(r"<fileReference\s", cline, re.I)
					#fileLine = re.search ('(fileReference filetype=\"(' + filecode +')\")', cline, re.I)
					if fileLine:
						if sourcepath in cline:
							newLine = cline.replace(sourcepath, destpath)
							new_aepx_lines = new_aepx_lines.replace(cline, newLine)
							numLines += 1
							footage_found = True
							
				if footage_found == True:
					numFootages += 1
				else:
					log('err', "can't update path for \"%s\" in final aepx file !" %sourcepath)
							
			# re-write the AEPX temp file
			if numFootages == len(paths_to_update):
				tempAEPX = open(temp_aepx, 'w')
				encoded_newLines = new_aepx_lines.encode('utf-8')
				tempAEPX.write(encoded_newLines)
				tempAEPX.close()
				log('info', "%s/%s footages have been collected (%s lines updated in apex file)" %(numFootages,len(paths_to_update),numLines))
				try:
					shutil.copy2(temp_aepx, final_aep_file)
					log('debug',os.path.isfile(temp_aepx))
					os.remove(temp_aepx)
					os.remove(collect_files_datas_file_path)
				except EnvironmentError, e:
					log ('err', 'Error while saving final aepx file and deleting temp files >> %s' %e)
					break
			else:
				log('err', "%s/%s footages have been collected (%s lines updated)" %(numFootages,len(paths_to_update),numLines))
	else:
		log ('infos', 'there is no after effects file to export !')
	# export framings
	log ('info', "=== Exporting Framing files === ")
	pprint.pprint(os.listdir(appFolder))
	if len(datas_obj['toExport_framing']) > 0:	
		linelength = len(datas_obj['toExport_framing'])
		pprint.pprint("TOEXPORT_FRAMING")
		pprint.pprint(toExport_framing)
		pprint.pprint("LINELENGTH")
		pprint.pprint(linelength)
		log ('info', 'Launching aerender for framing\'s batch render [%s to render]...' %len(datas_obj['toExport_framing']))
		command_line = "%s -project %s" %(aerender_path,"\"" + export_temp_aepx +"\"" + " -v ERRORS_AND_PROGRESS")
		pprint.pprint("COMMANDLINE TO RENDER FRAMING")
		pprint.pprint(command_line)
		pprint.pprint("SHOT_INFOS")
		pprint.pprint(shot_infos)
		return_code = subprocess.call(command_line, shell=True)
		if return_code != 0:
			error = 'error occured while rendering framing jpegs'
			log('err',error)
			sys.exit(error)
		else:
			# framing export is good
			#need to clean up framings file name
			for obj in datas_obj['toExport_framing']:
				shot_object = [x for x in datas_obj['shots'] if x['shot_infos'][0] == obj][0]
				shot_infos = shot_object['shot_infos']
				shot_num = shot_infos[0]
				afx_compItem = shot_infos[1]
				appFolder = str(shot_infos[2])
				pprint.pprint("APPFOLDER")
				pprint.pprint(appFolder)
				final_aepx_name = str(shot_infos[3])
				is_multi_frame = shot_infos[4]
				
				file_name_base = final_aepx_name.replace('AE.aepx', '')
				suffixes = {
					'framing': not is_multi_frame,
					'framingA': is_multi_frame,
					'framingB': is_multi_frame,
					'framingWide': is_multi_frame,
				}
				files = os.listdir(appFolder)
				for suffix, is_req in suffixes.iteritems():
					match_files = sorted([os.path.join(appFolder, x) for x in files if re.search("%s[0-9.]" % re.escape(suffix), x, re.I)], key=os.path.getctime)
					for f in (match_files[:-1] if is_req else match_files):
						try:
							log('info', 'removing %s' % f)
							os.remove(f)
						except EnvironmentError:
							log('err', 'Error while deleting %s' % f)
						else:
							log('debug', '%s deleted' % f)
					if is_req:
						if match_files:
							framing_file = os.path.join(appFolder, "%s%s.jpg" % (file_name_base, suffix))
							try:
								log('info', 'renaming %s to %s' % (match_files[-1], framing_file))
								os.rename(match_files[-1], framing_file)
							except EnvironmentError:
								log('err', 'Error while renaming framing jpeg of Sc%s' % shot_num)
							else:
								log('info', 'Framing jpeg for Sc%s renamed' % shot_num)
						else:
							log('err', 'no framing file found for Sc%s' % shot_num)
								
				# # build template name ofr framing file
				# framing_name = final_aepx_name.replace('AE.aepx', 'framing.jpg')
				# framing_file = os.path.join(appFolder, framing_name)
				# #get files in appFolder delete old, rename new
				# framing_files = []
				# pprint.pprint("appfolder contents;")
				# pprint.pprint(os.listdir(appFolder))
				# for item in os.listdir(appFolder):
					# if os.path.isfile(os.path.join(appFolder, item)) and re.search('framing',item,re.I):
						# framing_files.append(os.path.join(appFolder, item))
						# framervar = os.path.join(appFolder, item)
						# pprint.pprint("appfolder contents;")
						# pprint.pprint(framervar)
				# if len(framing_files) == 1:
					# try:
						# os.rename(framing_files[0],framing_file)
					# except EnvironmentError:
						# log ('err', 'Error while renaming framing jpeg of Sc%s' %shot_num)
					# else:
						# log ('info', 'Framing jpeg for Sc%s renamed' %shot_num)
				# elif len(framing_files) > 1:
					# files = sorted(framing_files, key=os.path.getctime)
					# for i in range(len(files)-1):
						# try:
							# os.remove(files[i])
						# except EnvironmentError:
							# log ('err', 'Error while deleting %s' %(files[i]))
						# else:
							# log ('debug', '%s deleted' %(files[i]))
					# try:
						# os.rename(files[-1],framing_file)
					# except EnvironmentError:
						# log ('err', 'Error while renaming framing jpeg of Sc%s' %shot_num)
					# else:
						# log ('info', 'Framing jpeg for Sc%s renamed' %shot_num)
				# else:
					# pprint.pprint(framing_files)
					# log ('err', 'no framing file found for Sc%s' %shot_num)
	else:
		log ('infos', 'there is no framing to export !')
	# export maya files
	log ('info', "=== Exporting maya files === ")
	if len(datas_obj['toExport_maya']) > 0: 
		for obj in datas_obj['toExport_maya']:
			shot_object = [x for x in datas_obj['shots'] if x['shot_infos'][0] == obj[0]][0]
			shot_infos = shot_object['shot_infos']
			shot_num = shot_infos[0]
			appFolder = str(shot_infos[2])
			maya_source_file = obj[1][0]
			maya_dest_file_name = obj[1][1]
			# build path for approved maya file
			maya_dest_file = os.path.join(appFolder, maya_dest_file_name)
			# copy files
			copy = copyfiles(maya_source_file, maya_dest_file)
			if copy == False:
				error = "[Sc%s] error while copying \"%s\" to %s" %(shot_num, os.path.basename(maya_source_file), appFolder)
				log ('err', error)
				raise sys.exit(error)
			else:
				log('info','maya file has been exported to approved folder')
				# update the shot object
				shot_file_path = os.path.join(appFolder,'.shot')
				pprint.pprint(shot_file_path)
				shot_file = readFile(os.path.join(appFolder,'.shot'),1)
				pprint.pprint(shot_file)
				shot_datas = execjs.eval(shot_file)
				pprint.pprint(shot_datas)
				shot_datas['maFile'] = [maya_dest_file,maya_dest_file_name]
				# update the .shot file
				temp_shot_path = shot_file_path + ".temp"
				temp_shot_file = open(temp_shot_path, 'w')
				temp_shot_file.write("(" + json.dumps(shot_datas)+")")
				temp_shot_file.close()
				# the temp list has been created, we copy old list
				success = False
				def updatelist (retries, success):
					while retries < 2 and success == False:
						try:
							shutil.copy2(temp_shot_path, shot_file_path)
							success = True
						except EnvironmentError, e:
							log ('err', 'Error while updating %s' %shot_file_path)
							time.sleep(1)
							retries += 1
							updatelist (retries, success)
					if success == True:
						log('debug', 'the .asset list has been correctly updated')
						os.remove(temp_shot_path)
				updatelist (0, success)
	else:
		log ('infos', 'there is no maya file to export !')		
	# export QT files
	log ('info', "=== Exporting quicktime files === ")
	# J Hearn - replaced below condition, as seems like a typo - should be checking toExport_qt
	# if len(datas_obj['toExport_maya']) > 0:
	if len(datas_obj['toExport_qt']) > 0:
		for obj in datas_obj['toExport_qt']:
			rushes_dir = datas_obj['rushesFolder']
			shot_object = [x for x in datas_obj['shots'] if x['shot_infos'][0] == obj][0]
			shot_infos = shot_object['shot_infos']
			shot_num = shot_infos[0]
			appFolder = shot_infos[2]
			# build path for approved qt file
			final_aepx_name = str(shot_infos[3])
			qt_name = final_aepx_name.replace('AE.aepx', 'QT.mov')
			dest_qt_file = os.path.join(appFolder,qt_name)
			if os.path.isfile(dest_qt_file):
				os.remove(dest_qt_file)
			# get source file in rushes folder:
			if len(os.listdir(rushes_dir)) > 0:
				source_qt_files = [os.path.join(rushes_dir,x) for x in os.listdir(rushes_dir) if re.match(shot_num + '.mov', x, re.I)]
				if len(source_qt_files) > 0 and os.path.isfile(source_qt_files[0]):
					# copy files
					source_qt_file = source_qt_files[0]
					log ('debug', source_qt_file)
					copy = copyfiles(source_qt_file, dest_qt_file)
					if copy == False:
						error = "[Sc%s] error while copying \"%s\" to %s" %(shot_num, os.path.basename(source_qt_file), appFolder)
						log ('err', error)
				else:
					error = "[Sc%s] can\'t find the quitcktime in the rushes folder !" %(shot_num)
					log ('err', error)
			else:
				error = "no file found in rushes folder [%s] !" %rushes_dir
				log ('err', error)
				raise sys.exit(error)
	else:
		log ('infos', 'there is no QT file to export !')
	# export BG files
	'''
	for not re-use
		get status of BG asset [not exported, exported, uploaded, locked]
		if locked: nothing
		if export/uploaded:
			to_export = true >> delete old files, re-export the asset (as not exported)
			to_export = false >> do nothing
		if export not exported:
			copy bg files
			update paths
			upload to shotgun
	'''
	log ('info', "=== Exporting background assets === ")
	log ('info', "== Copying background files == ")
	assets_list_path = datas_obj['assets_list_path']
	assets_list_file = open(assets_list_path).read()
	assets_list = execjs.eval(assets_list_file)
	for obj in datas_obj['toExport_bg']:
		bg_name = obj[0]
		bg_type = obj[1]
		bg_export_auth = obj[2]
		appFolder = obj[3]
		log ('info', "=== %s === " %bg_name)
		# open .asset files
		bg_asset_datas = assets_list[bg_name]
		for param in bg_asset_datas:
			log('debug', "\t%s : %s" %(param, assets_list[bg_name][param]))
		if bg_asset_datas['status'] != 'locked':
			if bg_asset_datas['status'] in ['exported','uploaded'] and bg_export_auth == True:
				log('info', "artist asked to re-export %s [was %s]" %(bg_name,bg_asset_datas['status']))
				updated = exportBGFiles(bg_asset_datas, appFolder)
				assets_list[bg_name] = updated
			elif bg_asset_datas['status'] == 'not exported':
				log('debug', "new bg to export")
				updated = exportBGFiles(bg_asset_datas, appFolder)
				assets_list[bg_name] = updated
			else:
				log('debug', "%s already %s >> no change to do" %(bg_name,bg_asset_datas['status']))
		else:
			log('err', "%s is locked on Shotgun (BG tasks assigned)" %bg_name)
		# the asset has been updated in the assets list
		for obj in assets_list[bg_name]:
			log('debug', "%s : %s" %(obj,assets_list[bg_name][obj]))
		   
	# we can write the .asset file to get last status of bg_assets
	temp_assets_list_file = assets_list_path + ".temp"
	assets_list_file = open(temp_assets_list_file, 'w')
	assets_list_file.write("(" + json.dumps(assets_list)+")")
	assets_list_file.close()
	# the temp list has been created, we copy old list
	success = False
	def updatelist (retries, success):
		while retries < 2 and success == False:
			try:
				shutil.copy2(temp_assets_list_file, assets_list_path)
				success = True
			except EnvironmentError, e:
				log ('err', 'Error while updating %s' %assets_list_path)
				time.sleep(1)
				retries += 1
				updatelist (retries, success)
		if success == True:
			os.remove(temp_assets_list_file)
	updatelist (0, success)
	
	log ('info', "== Uploading background assets on Shotgun == ")
	# now we can upload BG assets to Shotgun !
	for obj in datas_obj['toUpload_bg']:
		try:
			new_bg_asset = upload_asset_ToShotgun (bg_asset_datas,0)
		except Exception,e:
			log ('err', "error occured while uploading asset on Shotgun >> %s" % e)
			raise Exception (e)
		else:
			if new_bg_asset['sg_id']:
				new_bg_asset['status'] = 'uploaded'
				assets_list[bg_name] = new_bg_asset
	num_uploaded = 0
	for obj in datas_obj['toExport_bg']:
		bg_name = obj[0]
		bg_type = obj[1]
		bg_export_auth = obj[2]
		appFolder = obj[3]
		log ('info', "=== %s === " %bg_name)
		# open .asset files
		bg_asset_datas = assets_list[bg_name]
		for param in bg_asset_datas:
			log('debug', "\t%s : %s" %(param, assets_list[bg_name][param]))
		if bg_asset_datas['status'] in ['exported','uploaded']:
			# bg asset has been exported, we can uplaod it to shotgun
			log('info', "%s is ready for upload on Shotgun" %(bg_name))
			try:
				new_bg_asset = upload_asset_ToShotgun (bg_asset_datas, 1)
			except Exception,e:
				log ('err', "error occured while uploading asset on Shotgun >> %s" %e)
				raise Exception (e)
			else:
				if new_bg_asset['sg_id']:
					new_bg_asset['status'] = 'uploaded'
					assets_list[bg_name] = new_bg_asset
					num_uploaded += 1
					
	temp_assets_list_file = assets_list_path + ".temp"
	assets_list_file = open(temp_assets_list_file, 'w')
	assets_list_file.write("(" + json.dumps(assets_list)+")")
	assets_list_file.close()
	# the temp list has been created, we copy old list
	success = False
	def updatelist (retries, success):
		while retries < 2 and success == False:
			try:
				shutil.copy2(temp_assets_list_file, assets_list_path)
				success = True
			except EnvironmentError, e:
				log ('err', 'Error while updating %s' %assets_list_path)
				time.sleep(1)
				retries += 1
				updatelist (retries, success)
		if success == True:
			os.remove(temp_assets_list_file)
	updatelist (0, success)
	if len(datas_obj['toExport_bg']) > 0:
		log('info', "%s/%s BG assets have been succesfully uploaded to Shotgun !" %(num_uploaded,len(datas_obj['toExport_bg'])))
	else:
		log('info', "there is no BG asset to upload on Shotgun !")

	# now process shot datas now and upload shot on shotgun
	'''
		update shot on shotgun >>
		- get shot_obj
		- find the shot on shotgun
		- update the sg_bg_asset field with list of background assets
		- update task template if "Check camera"
		update status of the shot in .shot file to uploaded
		
	'''
	log ('info', "=== Updating shots entities on Shotgun === ")
	for shot in datas_obj['shots']:
		shot_appFolder = shot['shot_infos'][2]
		shot_file_path = os.path.join(shot_appFolder,'.shot')
		# open .shot file to get parameters
		shot_file = readFile(shot_file_path,1)
		shot_datas = execjs.eval(shot_file)
		# update shot entity on Shotgun
		if upload_entities_onShotgun == True and 'background_asset' in shot_datas:
			# build the list of background_assets using uploaded ones only !
			bgs_to_link = []
			for bg in shot_datas['background_asset']:
				bg_name = bg[0]
				bg_type = bg[1]
				bg_sg_id = bg[2]
				if bg_type == 're-use':
					if bg_sg_id and str(bg_sg_id).isdigit:
						# it is a re-use from shotgun...
						bgs_to_link.append([bg_name,bg_sg_id])
					elif bg_name in assets_list:
						if assets_list[bg_name]['status'] == 'uploaded':
							# asset uploaded already >> link possible
							bgs_to_link.append([assets_list[bg_name]['name'],assets_list[bg_name]['sg_id']])
						else:
							log('err', "%s status [%s] is not valid for link to shot" %(assets_list[bg_name]['name'],assets_list[bg_name]['status']))
					else:
						log('err', "%s is not a valid bg asset" %bg)
						log('debug', assets_list[bg_name])
				elif bg_name in assets_list:
					# bg found in the .assets list
					if assets_list[bg_name]['status'] == 'uploaded':
						bgs_to_link.append([assets_list[bg_name]['name'],assets_list[bg_name]['sg_id']])
					else:
						log('err', "status [%s] is not a valid status for linking the asset to the shot" %assets_list[bg_name]['status'])
				else:
					log('err', "%s is not a valid bg asset" %assets_list[bg_name]['name'])
					log('debug', assets_list[bg_name])
			
			# upload the shot on shotgun
			updated_shot = upload_shot_ToShotgun (shot_datas, bgs_to_link)
		else:
			shot_datas['status'] = "exported"
			
		# update the .shot file
		temp_shot_path = shot_file_path + ".temp"
		temp_shot_file = open(temp_shot_path, 'w')
		temp_shot_file.write("(" + json.dumps(shot_datas)+")")
		temp_shot_file.close()
		# the temp list has been created, we copy old list
		success = False
		def updatelist (retries, success):
			while retries < 2 and success == False:
				try:
					shutil.copy2(temp_shot_path, shot_file_path)
					success = True
				except EnvironmentError, e:
					log ('err', 'Error while updating %s' %shot_file_path)
					time.sleep(1)
					retries += 1
					updatelist (retries, success)
				else:
					retries = 2
					log('info', 'the .shot file has been correctly updated')
			if success == True:
				os.remove(temp_shot_path)
		updatelist (0, success)

	# J Hearn
	log ('info', "=== Adding notes to shotgun === ")
	for shot in datas_obj['shots']:
		shot_appFolder = shot['shot_infos'][2]
		shot_file_path = os.path.join(shot_appFolder,'.shot')
		# open .shot file to get parameters
		shot_file = readFile(shot_file_path,1)
		shot_datas = execjs.eval(shot_file)
		if (
			all(map(lambda x: x in shot_datas, ('notes', 'notesTo', 'notesDepts')))
			and shot_datas['notes'].strip()
		):
			log('info', "Creating note for %s" % shot_datas['name'])
			# get shot from shotgun
			sg_episode = sg.find_one(
				'Sequence',
				[ 
					['project', 'is', {'type':'Project','id': project_id}], 
					['code', 'is', shot_datas['episodeCode']],
				],
				['id', 'code'],
			)
			sg_shots = sg.find(
				'Shot',
				[
					['project', 'is', {'type':'Project','id': project_id}],
					['sg_sequence', 'is', {'type':'Sequence','id': sg_episode['id']}],
					['code', 'is', shot_datas['shotCode']],
				],
				['id', 'code'],
			)
			if len(sg_shots) == 1:
				sg_shot = sg_shots[0]
				# get users
				addressings_to = sg.find('HumanUser', [['login', 'in', shot_datas['notesTo']]])
				print addressings_to
				sg_departments = sg.find('Department', [['code', 'in', shot_datas['notesDepts']]])
				print sg_departments
				sg.create(
					'Note',
					{
						'project': {'type': 'Project', 'id': project_id},
						'note_links': [sg_shot],
						'addressings_to': addressings_to,
						'sg_departments': sg_departments,
						'subject': "Layout Export Note",
						'content': shot_datas['notes'],
					},
				)
			elif not len(sg_shots):
				log('error', "Shot %s not found in shotgun" % shot_datas['name'])
			else:
				log('error', "Multiple shots returned from shotgun for %s" % shot_datas['name'])
		else:
			log('info', "No note for %s" % shot_datas['name'])
		
	
	# call afx script
	command_line = "\"C:\Program Files\Adobe\Adobe After Effects CC 2014\Support Files\AfterFX.com\" -s \"alert('Export task complete. Please check cmd or log file for errors !')\""
	return_code = subprocess.call(command_line, shell=False)
		
else:
	log('err', " !! unable to read file \"%s\" ---> export aborted!" %export_datas_file)
	raise sys.exit("error - check log file")