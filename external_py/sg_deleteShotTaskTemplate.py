import os, sys, re, getopt
import execjs
import logging
import json

logging.basicConfig(
    filename = os.path.expanduser(r'~\Documents\AdobeScripts\ExportTool\logs\remove_shotsTaskTemplate.log'),
    filemode ='w',
    format = "%(levelname) -10sline %(lineno)s %(name)s %(message)s",
    level = logging.DEBUG
)
try:
    from custom_options.py_glob_vars import *
    from shotgun_link import *
except ImportError,e:
    logging.warning(e)

######
def arguments(argv):
    shot = ''
    episode = ''
    #[shot name, episodeFolder]
    try:
        opts, args = getopt.getopt(argv,"hs:",["shot="])
    except getopt.GetoptError,e:
        logging.warning(e)
        logging.info('test.py -s <shot array>')
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            logging.info('test.py -s <shot array>')
            sys.exit()
        elif opt in ("-s", "--shot"):
            shotfile = os.path.expanduser(arg)
    return shotfile
    
def findshot (shotObj):
    # get target episode
    ep_fields = ['id', 'code']
    ep_filters = [ 
        ['project','is',{'type':'Project','id':project_id}], 
        ['code', 'is', shotObj['episodeCode']] 
        ]
    sg_episode = sg.find_one('Sequence', ep_filters, ep_fields)
    logging.info(sg_episode)  
    fields = ['id', 'code']
    filters = [
        ['project','is',{'type':'Project','id':project_id}],
        ['sg_sequence','is',{'type':'Sequence','id':sg_episode['id']}],
        ['code', 'is', shotObj['shotCode']],
        ]
    result = sg.find_one('Shot', filters, fields)
    return result

def findTasks (sg_shot):
    #task:
    filters = [
        ['entity', 'is', sg_shot],
        ['content', 'is', "Animate 3D cam"],
        #['step','is', "3D Animation"]
        ]
    shotTasks = sg.find("Task", filters, fields= ['code','content'])
    logging.info(shotTasks)                     
    return shotTasks

if __name__ == "__main__":
    #tempFile = arguments(sys.argv[1:])
    tempFile = os.path.expanduser(r'F:\Team\Season 3\GB000_TEST\05_LAYOUT\02_APPROVED\Sc011\.shot')
    library = open(tempFile).read()
    shot_obj = execjs.eval(library)
    logging.info(shot_obj)
    
    sg_shot = findshot(shot_obj)
    logging.info(sg_shot)
    if sg_shot:
        # 0 > error
        # 1 > success
        checkCam_task = findTasks (sg_shot) # array : [task  template found, tasks found]
        logging.info(checkCam_task)
        if len(checkCam_task) == 1:
            # one task for 3D anim found : delete it!
            result = 4
            try:
                sg.delete("Task", checkCam_task[0]['id'])
                filters = [ ['code','is', "Layout" ] ]
                taskTemplate = sg.find_one('TaskTemplate', filters)
                sg.update('Shot', sg_shot['id'], {'task_template':taskTemplate})
            except shotgun_api3.shotgun.Fault,e:
                logging.warning("error occured while deleting task \"Animate 3D cam\" on shot entity")
                logging.warning(e)
                result = 1
            else:
                logging.info("Task \"Animate 3D cam\" removed from shot entity \"%s\"" %sg_shot['code'])
                result = 0
            finally:
                print result
        elif len(checkCam_task) > 1:
            result = "more than one task \"Animate 3D cam\" found for this shot !"
            logging.warning(result)
            print 2
        else:
            result = "no task \"Animate 3D cam\" found for this shot !"
            logging.info(result)
            print 3
    else:
        # 2 > can't find shot entity > aborded
        print 5
    

