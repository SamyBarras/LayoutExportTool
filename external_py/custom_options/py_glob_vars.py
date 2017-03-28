# gen variables
episodes_dir = r'T:\Team\Season6'
asset_list_template_path = r'T:/Team/Season6/%s/05_LAYOUT/00_TEMP/processing/.asset'
upload_entities_onShotgun = True # if not Shotgun won't be updated with new assets and infos on shot
''' create_task_templates
- define when the task tempaltes for BG will be done:
True >> while uploading bg_asset on Shotgun, script will create the task templates
False >> task tempaltes will be written in the "description" column on shotgun. This give hand to BG supervisor to double check the task templates before assignment
'''
create_task_templates = False
''' collect_files_for_BGAFX
True >> collect files for BGAFX comp and create specific aepx file for the bg asset
False >> do not collect files, BG artists will use main aepx project for the shot
!!! this option is WIP >> the collect files is not working yet...
'''
collect_files_for_BGAFX = False # do not turn ON, it is not written yet!
''' overwrite uploaded bg assets '''
overwrite_existing_BGasset = True
''' force the upload of an asset if it is re-used by another shot and not already uploaded on Shotgun >> files won't be copied, only creation of asset on shotgun'''
always_upload_ifReuse = True
'''to upload video previews as filmstrip (thumbnail)  or version (create a "layout version")'''
upload_video_preview_as_version = False
''' which file of files list we want to uplaod as "latest file" for the asset on shotgun '''
local_files = {
    "new matte painting" :  0, #psd
    "new 3D still render" : 0, #jpg
    "new 3D moving render" : 0, #movie
    "new 3D render to matte" : 1, #psd
    "new AFX moving set" : 1, #movie
    "new Camera Map" : 0, #psd
    "new footage" : 0 # movie
    }
# shotgun connexion #
server_path = "https://turneruk.shotgunstudio.com"
script_name = "layout_export_task"
script_key = "f95f2f26e955a5dd3199ece491b4374ee173cbf76f6c0d5363ee300ab92a33f7"
project_id = 72 # 72 for real Gumball project

# script variables
debug = False# False = Off / True = On
aerender_path = "\"C:\\Program Files\\Adobe\\Adobe After Effects CC 2014\\Support Files\\aerender.exe\""
ffmpeg = r"T:\Team\02_MISC\I-T\Moving_Renders_Gallery\Tools\ffmpeg-20160310-git-66edd86-win32-static\bin\ffmpeg.exe" # J Hearn - common network path
#ffmpeg = r"C:\Python27\Lib\site-packages\ffmpeg-20141107-git-b1c99f4-win64-static\bin\ffmpeg.exe"
