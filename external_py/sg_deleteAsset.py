import os, sys, re, getopt
import execjs
import logging
import json

logging.basicConfig(
    filename = os.path.expanduser('~\Documents\AdobeScripts\ExportTool\logs\deleteBGasset.log'),
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
    try:
        opts, args = getopt.getopt(argv,"ha:",["asset="])
    except getopt.GetoptError,e:
        logging.warning(e)
        logging.info('test.py -a <asset array>')
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            logging.info('test.py -a <asset array>')
            sys.exit()
        elif opt in ("-a", "--asset"): #it is an array
            asset = arg
    return asset
 
logging.info('start log')
if __name__ == "__main__":
    asset = arguments(sys.argv[1:])
    logging.info(asset)
    result = False
    if debug == False:
        result = sg.delete("Asset",int(asset))
        logging.info(result)
    else:
        result = False
        logging.info("debug mode is \"On\" !")
    print json.dumps(result)