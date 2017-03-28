import os, sys, re

try:
    from custom_options.py_glob_vars import *
    from shotgun_link import *
except ImportError,e:
    raise sys.exit(e)

# functions
def get_entity(id, code):
	fields = ['id', 'code', 'sg_asset_type', 'sg_thumbnail_from_version', 'tag_list', 'image', 'sg_latest_file']
	filters = [
		['project','is',{'type':'Project','id':project_id}],
		['sg_asset_type','is', 'Background'],
		['id', 'is', id],
		['code', 'is', code],
		]
	result = sg.find('Asset', filters, fields)
	return result

# get asset object from log created by javascript
log_file = open("C:/temp/updated_BGAsset.log","r")
content = log_file.read()
bg_asset = eval(content)
log_file.close()

# main script
def main ():
	sg_asset = get_entity(bg_asset['id'], bg_asset['code'])[0]
	print sg_asset['code'], '- background asset found in Shotgun ! [', sg_asset['id'], ']'
	# upload new thumbnail
	print 'Thumbnail upload...'
	thumbnail = sg.upload_thumbnail('Asset', sg_asset['id'], bg_asset['thumbnail'])
	print 'uploaded'
	#-- upload psd file --#
	local_path = {
		'this_file': {
				'local_path': bg_asset['psd_path'],
				'name': bg_asset['code'],
				},
			'attachment_links': [{'type':'Asset','id':sg_asset['id']}],
			'image': bg_asset['thumbnail'],
			'project': {'type':'Project','id':project_id}
		}
	print 'Link asset to local path...'
	newLocalFile = sg.create('Attachment', local_path)
	print 'linked to: ', str(bg_asset['psd_path'])
	# update tags
	print 'Tag list update...'
	tags = []
	if len(sg_asset['tag_list']) > 0:
		tags = sg_asset['tag_list']
	for tag in bg_asset['tag_list']:
		tag = re.sub(r'^(\W|\s|(0[1-9]))', '', tag)
		if tag not in tags:
			tags.append(tag)
			print tag, ' added to tag list'
	if len(tags) > 0:
		sg.update('Asset', sg_asset['id'], {'tag_list' : tags})
	print 'python script execution finished'
main()