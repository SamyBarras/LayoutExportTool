bg_assets_templates = {
    /*
        "template": {                                      > this is type of bg
                name:"template"                      > same as previous entry : it will be used to build bg type list into UI
                bg_asset_type: 'type'               > in BGasset name GB400EPISODE_Sc000_TYPE_Location      [BGmatte,BG3Dstill,BG3Dmoving, BGAFX, BGfootage]
                task_templates:[...]                   > corresponding task_template. Can be an array. If array, task_template defined by location tag (see "location_tags.jsx")
                infos:''                                         > text to explain the specificity of this type of BG and files to provide. Will be shown into UI during asset creation
                buttons:[...]                                 > Array > number of the buttons for files download. Check "createBGAsset_tool.jsx"
                filesToRename:[...]                  > Array > the files script will rename when exporting bg asset (corrsponding to main PSD and JPEG files for example)
                resoltuion_opt:0/1                   > 0 = no resolution option      1 = activate resolution option (will let user define resolution of render)
     */
	"background re-use" : {
		name:"background re-use",
		bg_asset_type:"undefined",
		infos:"Re-use of an existing background asset.\n\
		If this asset has been created for previous episode, search the asset on Shotgun by giving his name.\n\
		If this asset is not already uploaded to Shotgun, provide the file  corresponding to this asset.",
		buttons:[0,1],
         resolution_opt:0
		},
	"new matte painting" : {
		name:"new matte painting",
		bg_asset_type:"BGmatte",
		infos:"Simple new background using stock images or photos.\n\
		Files to provide: \n- psd\n- jpg for preview",
		buttons:[2,3],
		previewFile:1,
         filesToRename:[0,1],
         resolution_opt:0
		},
	"new 3D still render": {
		name:"new 3D still render",
		bg_asset_type:"BG3Dstill",
		infos:"New 3d still render without matte painting.\n\
		Please refer to the wiki for the naming conventions of 3d camera\n\
		Files to provide:\n- maya file with render camera \n- jpg file matching the final framing and camera name\n\
         Please define higher resolution if needed!",
		buttons:[5],
		previewFile:0,
         filesToRename:[0],
         resolution_opt:1
		},
	"new 3D moving render": {
		name:"new 3D moving render",
		bg_asset_type:"BG3Dmoving",
		infos:"New 3d moving render without matte painting (not a cammap!).\n\
		Please refer to the wiki for the naming conventions of 3d camera\n\
		Files to provide: \n- maya file with render camera\n- a movie file (avi or QT) matching the final framings and camera name\n\
         Please define higher resolution if needed!",
		buttons:[6],
		previewFile:0,
         filesToRename:[0],
         resolution_opt:1
		},
	"new 3D render to matte" : {
		name:"new 3D render to matte",
		bg_asset_type:"BGmatte",
		infos:"New matte painting which use 3d elements (sets, part of sets or specific 3d models). It could be the combination of multiple 3d renders as well.\n\
		Please refer to the wiki for the naming conventions of 3d camera inside maya file\n\
		Files to provide:\n- maya file\n- one jpeg per camera to render (give him same name as camera)\n- the main psd file\n- the jpg corresponding to final bg (psd preview)\n\
         Please define higher resolution if needed!",
		buttons:[5,2,3],
		previewFile:2,
         filesToRename:[1,2],
         resolution_opt:1
		},
	"new AFX moving set" : {
		name:"new AFX moving set",
		bg_asset_type:"BGAFX",
		infos:"Layered composition in after effects, used as moving background (travelling in afx).\n\
		Files to provide: \n- the afx comp in current project (and all assets used)\n- a movie file (avi or QT) matching the final render.",
		buttons:[7,8],
		previewFile:1,
         filesToRename:[0,1],
         resolution_opt:0
		},
	"new Camera Map" : {
		name:"new Camera Map",
		bg_asset_type:"BG3Dmoving",
		infos:"Camera mapping - Generally a moving render using a specific scene made with background projection on rough meshes.\n\
		Please refer to the wiki for the naming conventions of 3d camera\n\
		Files to provide: \n- psd for the projetted matte painting\n- the maya file\n- a movie file (avi or QT) matching the final framings\n\
         Please define higher resolution if needed!",
		buttons:[2,8],
		previewFile:1,
         filesToRename:[0,1],
         resolution_opt:1
		},
	"new footage" : {
		name:"new footage",
		bg_asset_type:"BGfootage",
		infos:"Live action footage used as background.\n\
		Files to provide: \n- movie or images sequence for the footage\n- optional / afx project if needed (stabilized footage, etc)",
		buttons:[8],
		previewFile:0,
         filesToRename:[0],
         resolution_opt:0
		}
};
