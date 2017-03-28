import os, sys, re, getopt
import execjs
import logging
import json

logging.basicConfig(
    filename = os.path.expanduser('~\Documents\AdobeScripts\ExportTool\logs\check_AssetStatus.log'),
    filemode ='w',
    format = "%(levelname) -10sline %(lineno)s %(name)s %(message)s",
    level = logging.DEBUG
)
try:
    from custom_options.py_glob_vars import *
    from shotgun_link import *
except ImportError,e:
    raise sys.exit(e)

######
def arguments(argv):
    asset = ''
    episode = ''
    #[asset name, episodeFolder]
    try:
        opts, args = getopt.getopt(argv,"ha:",["asset="])
    except getopt.GetoptError,e:
        logging.warning(e)
        logging.info('test.py -a <asset array> -e <episode>')
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            logging.info('test.py -a <asset array> -t <task template> -e <episode>')
            sys.exit()
        elif opt in ("-a", "--asset"):
            asset = os.path.expanduser(arg)
    return asset
    
def findAsset (assetObj):
    #print '### ', assetObj['name'], ' >> UPLOAD ON SHOTGUN ###'
    fields = ['id', 'code', 'sg_asset_type']
    filters = [
            ['project','is',{'type':'Project','id':project_id}],
            ['sg_asset_type','is', 'Background'],
            ['code', 'is', assetObj['name']]
            ]
    logging.info(filters)
    if str(assetObj['sg_id']).isdigit():
        filters.append(['id', 'is', int(assetObj['sg_id'])])
        logging.info(filters)
        
    result = sg.find_one('Asset', filters, fields)
    return result

def findTasks (sg_asset):
    filters = [
                ['entity', 'is', sg_asset],
            ]
    tasks = sg.find('Task',filters,['step','content','id'])
    return tasks

if __name__ == "__main__":
    tempFile = arguments(sys.argv[1:])
    library = open(tempFile).read()
    asset_obj = execjs.eval(library)
    logging.info(asset_obj)
    
    sg_asset = findAsset(asset_obj)
    logging.info(sg_asset)
    if sg_asset:
        logging.info(sg_asset['code'])
        tasks = findTasks(sg_asset)
        if tasks:
            logging.info('%s tasks found for %s', len(tasks), sg_asset['code'])
            print '["%s","%s","%s"]' %( sg_asset['code'], 'locked', str(sg_asset['id']))
        else:
            logging.info('0 tasks found for %s', sg_asset['code'])
            print '["%s","%s","%s"]' %( sg_asset['code'], 'uploaded', str(sg_asset['id']))
    else:
        logging.error('cannot find a corresponding bg asset')
        print '["%s","%s","%s"]' %( asset_obj, 'undefined', 'undefined')

