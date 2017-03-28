import os, sys, re, getopt
import execjs
import logging
import json

logging.basicConfig(
    filename = os.path.expanduser('~\Documents\AdobeScripts\ExportTool\logs\uploadBGasset.log'),
    filemode ='w',
    format = "%(levelname) -10sline %(lineno)s %(name)s %(message)s",
    level = logging.DEBUG
)

try:
    from custom_options.py_glob_vars import *
    from shotgun_link import *
except ImportError,e:
    logging.warning(e)
    


def arguments(argv):
    asset = ''
    episode = ''
    #[asset name, episodeFolder]
    try:
        opts, args = getopt.getopt(argv,"ha:e:u:",["asset=","episode=","upload_option="])
    except getopt.GetoptError,e:
        logging.warning(e)
        logging.info('test.py -a <asset array> -e <episode>')
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            logging.info('test.py -a <asset array> -t <task template> -e <episode>')
            sys.exit()
        elif opt in ("-a", "--asset"): #it is an array
            asset = arg.split(',')
        elif opt in ("-e", "--episode"):
            episode = arg
        elif opt in ("-u", "--upload_option"):
            overwrite_existing_BGasset = arg
    return asset, episode, overwrite_existing_BGasset
    
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
        }
    # add extra rules to dict
    if create_task_templates == True:
        #we create the task templates for BG directly here
        data['task_template'] = taskTemplate
    else:
        data['description'] = assetObj['task_template']
    if user:
        data['created_by'] = {'type':'HumanUser','id':user['id']}
    
    # finally create the asset
    try:
        logging.info('>>>' + assetObj['name'] + ' upload')
        logging.debug(json.dumps(data))
        newAsset = sg.create("Asset", data)
        logging.debug(str(newAsset))
        # add tags
        logging.info('>>> tags upload')
        up = sg.update('Asset', newAsset['id'], {'tag_list' : assetObj['tag_list'].split(',')})
        logging.debug(str(up))
        
        # upload new thumbnail
        logging.info('>>> thumbnail upload')
        previewNum = assetObj['previewFile']
        logging.info('source file : ' + assetObj['files'][previewNum])
        thumbnail = sg.upload_thumbnail('Asset', newAsset['id'], assetObj['files'][previewNum])
        logging.debug(str(thumbnail))
        
        #-- upload psd file --#
        # here we have issue with Local_path entry in shotgun > we need to create entry for "T:/" drive
        logging.info('>>> latest file linking')
        local_path = {
            'this_file': {
                    'local_path': assetObj['files'][0],
                    'name': assetObj['name'],
                    },
                'attachment_links': [{'type':'Asset','id':newAsset['id']}],
                'image': assetObj['files'][assetObj['previewFile']],
                'project': {'type':'Project','id':project_id}
            }
        #print 'Link asset to local path...'
        newLocalFile = sg.create('Attachment', local_path)
        logging.debug(str(newLocalFile))
        return newAsset
    except:
        err = sys.exc_info()#[0]
        logging.warning(err)
        return err
        
def updateAsset (assetObj,sg_asset):
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
        }
    # add extra rules to dict
    if create_task_templates == True:
        #we create the task templates for BG directly here
        data['task_template'] = taskTemplate
    else:
        data['description'] = assetObj['task_template']
    if user:
        data['created_by'] = {'type':'HumanUser','id':user['id']}
    
    # finally create the asset
    try:
        logging.info('>>>' + assetObj['name'] + ' update')
        logging.debug(json.dumps(data))
        newAsset = sg.update("Asset", sg_asset['id'], data)
        logging.debug(str(newAsset))
        # add tags
        logging.info('>>> tags upload')
        up = sg.update('Asset', sg_asset['id'], {'tag_list' : assetObj['tag_list'].split(',')})
        logging.debug(str(up))
        
        # upload new thumbnail
        logging.info('>>> thumbnail upload')
        previewNum = assetObj['previewFile']
        logging.info('source file : ' + assetObj['files'][previewNum])
        thumbnail = sg.upload_thumbnail('Asset', sg_asset['id'], assetObj['files'][previewNum])
        logging.debug('%s uploaded as thumbnail for %s', str(assetObj['files'][previewNum]), sg_asset['code'])
        
        #-- upload psd file --#
        # here we have issue with Local_path entry in shotgun > we need to create entry for "T:/" drive
        logging.info('>>> latest file linking')
        local_path = {
            'this_file': {
                    'local_path': assetObj['files'][0],
                    'name': assetObj['name'],
                    },
                'attachment_links': [{'type':'Asset','id':sg_asset['id']}],
                'image': assetObj['files'][assetObj['previewFile']],
                'project': {'type':'Project','id':project_id}
            }
        newLocalFile = sg.create('Attachment', local_path)
        logging.info('%s linked to %s', str(newLocalFile), sg_asset['code'])
        return sg_asset
        
    except:
        err = sys.exc_info()#[0]
        logging.warning(err)
        return err
        
def findAsset (assetObj):
    #print '### ', assetObj['name'], ' >> UPLOAD ON SHOTGUN ###'
    fields = ['id', 'code', 'sg_asset_type', 'sg_thumbnail_from_version', 'tag_list', 'image', 'sg_latest_file']
    filters = [
            ['project','is',{'type':'Project','id':project_id}],
            ['sg_asset_type','is', 'Background'],
            ['code', 'is', assetObj['name']],
            ['sg_background_type', 'is', assetObj['BGType']]
            ]
    result = sg.find('Asset', filters, fields)
    return result

def findTasks (sg_asset):
    filters = [
                ['entity', 'is', sg_asset],
            ]
    tasks = sg.find_one('Task',filters,['step','content','id'])
    return tasks

if __name__ == "__main__":
    bg_asset_status = {
        0:'uploaded',
        1:'error while uploading',
        2:'already uploaded',
        3:'task assigned to BG',
        4:'error',
        5:'updated',
        }
    try:
        # get arguments passed from after effect
        # 0 > assets name [array]
        # 2 > episode name >> used to get .asset file
        passedArgs = arguments(sys.argv[1:])

        # get assets list (where our asset obj is stored)
        file_template = asset_list_template_path % (passedArgs[1])
        library = open(file_template).read()
        assetsList = execjs.eval(library) # we use execjs to eval javascript oriented objects
        
        results = []
        for obj in passedArgs[0]:
            assetObj = assetsList[obj]
            result = findAsset (assetObj)
            if len(result) == 1:
                # found one corresponding asset on shotgun...
                sg_asset = result[0]
                if overwrite_existing_BGasset == 1:
                    # overwrite_existing_BGasset variable set to false 
                    # do not overwrite the asset
                    # return status
                    logging.error(str(len(result)) + ' assets with corresponding name found in Shotgun')
                    results.append(str('\"' + assetObj['name'] +'\":\"'+ bg_asset_status[2] +'\"'))
                else:
                    logging.info(str(len(result)) + ' assets with corresponding name found in Shotgun')
                    #here we need code to update the existing asset on shotgun
                    # but need first to check if there there are tasks on the asset
                    tasksCount = findTasks(sg_asset)
                    if tasksCount:
                        # at least one task on the asset
                        logging.info('%s task \"%s\" found for %s', tasksCount['step']['name'], tasksCount['content'], assetObj['name'])
                        # we can't modify the BG asset
                        results.append(str('\"' + assetObj['name'] +'\":\"'+ bg_asset_status[3] +'\"'))
                        raise Exception (str('\"' + assetObj['name'] +'\":\"'+ bg_asset_status[3] +'\"'))
                    else:
                        # no task on the asset, it can be updated!
                        logging.info('no task found for %s', assetObj['name'])
                        updated_asset = updateAsset (assetObj, sg_asset)
                        if updated_asset:
                            logging.info('\"%s\" asset updated on shotgun - [%s]', updated_asset['code'], updated_asset['id'])
                            results.append(str('\"' + assetObj['name'] +'\":\"'+ bg_asset_status[5] +'\"'))
                        else:
                            raise Exception ('%s can\'t be updated', assetObj['name'])
                    
            elif len(result) == 0:
                # asset is not on shotgun, create it
                new_asset = createAsset (assetObj)
                logging.info(json.dumps(new_asset))
                results.append(str('\"' + assetObj['name'] +'\":\"'+ bg_asset_status[0] +'\"'))
                
            else:
                #more than one corresponding asset on shotgun  or error
                raise Exception (result)
                results.append(str('\"' + assetObj['name'] +'\":\"'+bg_asset_status[1]+'\"'))
                
    except: # catch *all* exceptions
        err = sys.exc_info()#[0]
        logging.warning(err)
        results.append(str('\"' + assetObj['name'] +'\":\"'+bg_asset_status[4]+'\"'))
    else:
        print json.dumps('({'+','.join(results)+'})')