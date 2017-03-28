import os, sys, re, getopt
import execjs

try:
    from custom_options.py_glob_vars import *
    from shotgun_link import *
except ImportError,e:
    raise sys.exit(e)

def arguments(argv):
    asset = ''
    episode = ''
    #[asset name, episodeFolder]
    try:
        opts, args = getopt.getopt(argv,"ha:e:",["asset=","episode="])
    except getopt.GetoptError:
        print 'test.py -a <asset array> -e <episode>'
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print 'test.py -a <asset array> -t <task template> -e <episode>'
            sys.exit()
        elif opt in ("-a", "--asset"):
            asset = arg
        elif opt in ("-e", "--episode"):
            episode = arg
            
    return asset, episode

# get arguments passed from after effect
# 0 > asset name
# 2 > episode name
passedArgs = arguments(sys.argv[1:])

# get assets list (where our asset obj is stored)
file_template = "T:/Team/Season 3/%s/05_LAYOUT/00_TEMP/processing/.asset" % (passedArgs[1])
library = open(file_template).read()
assetsList = execjs.eval(library) # we use execjs to eval javascript oriented objects

assetObj = assetsList[passedArgs[0]]
# check if asset already exists on shotgun
# if not, create it
# build filters base [without shotCode]
def createAsset (assetObj):
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
    
    # try to find creator/user
    fields = ['name', 'id']
    filters = [
            #['name','contains', re.sub('^.','',assetObj['creator'])],
            ['login','is', assetObj['creator']]
            ]
    user = sg.find_one('HumanUser', filters, fields)
    if user:
        data = {
        'project': {'type':'Project','id':project_id},
        'code':assetObj['name'],
        'sg_asset_type':assetObj['type'],
        'sg_background_type':assetObj['BGType'],
        'description':assetObj['task_template'],
        #'task_template': taskTemplate, # uncomment this line to create task_template when creating the asset
        'created_by':{'type':'HumanUser','id':user['id']},
        }
    else:
        data = {
        'project': {'type':'Project','id':project_id},
        'code':assetObj['name'],
        'sg_asset_type':assetObj['type'],
        'sg_background_type':assetObj['BGType'],
        'description':assetObj['task_template'], # this will put task_template into the description field
        #'task_template': taskTemplate, # uncomment this line to create task_template when creating the asset
        }
        
    # finally create the asset
    print 'Create new Asset...'
    newAsset = sg.create("Asset", data)
    print '\tcreated'
    ## add tags
    print 'Tags update...'
    sg.update('Asset', newAsset['id'], {'tag_list' : assetObj['tag_list'].split(',')})
    # upload new thumbnail
    print 'Thumbnail upload...'
    thumbnail = sg.upload_thumbnail('Asset', newAsset['id'], assetObj['files'][assetObj['previewFile']])
    print 'uploaded'
    #-- upload psd file --#
    ## here we have issue with Local_path entry in shotgun > we need to create entry for "T:/" drive
    local_path = {
        'this_file': {
                'local_path': assetObj['files'][0],
                'name': assetObj['name'],
                },
            'attachment_links': [{'type':'Asset','id':newAsset['id']}],
            'image': assetObj['files'][assetObj['previewFile']],
            'project': {'type':'Project','id':project_id}
        }
    print 'Link asset to local path...'
    newLocalFile = sg.create('Attachment', local_path)
    print 'PSD file linked to the asset'
    
def findAsset (assetObj):
    print '### ', assetObj['name'], ' >> UPLOAD ON SHOTGUN ###'
    fields = ['id', 'code', 'sg_asset_type', 'sg_thumbnail_from_version', 'tag_list', 'image', 'sg_latest_file']
    filters = [
            ['project','is',{'type':'Project','id':project_id}],
            ['sg_asset_type','is', 'Background'],
            ['code', 'is', assetObj['name']],
            ['sg_background_type', 'is', assetObj['BGType']]
            ]
    result = sg.find('Asset', filters, fields)
    if result:
        #print 'asset found'
        updated_asset = None
    else:
        #print 'no asset found'
        createAsset (assetObj)
        print 'asset created on Shotgun'
findAsset (assetObj)



