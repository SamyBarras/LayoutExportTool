/* need to define before calling this script :
    
thisObj = This
shotObj = object for shot
episodeFolder = var defined at the beginning, it is the path folder for correpsonding episode
compItem is the compItem corresponding to current shot
assetToUpdate = if call from "update asset2, this var is not undefined and correspond to the asset to Update

*/

function bgassettool (thisObj, shotObj, episodeFolder, compItem, assetToUpdate)
{
    try {
     /* EXTERNAL FUNCTIONS & VARIABLES */
     current_folder = app.project.file.path;
     var asset_obj = undefined;
    // BUTTONS FUNCTIONS TO LOAD FILES //
            function getFiles (type, prefFolder)
                {
                    // type = "*.psd,*.psb,*.tif" ||
                    // prefFolder = string path
                    sourcesFolder = new Folder (prefFolder);
                    selectedFiles = sourcesFolder.openDlg("Select file", type, false);
                    if (selectedFiles >=1)
                        {
                            selectedFiles.sort();
                        };
                    return selectedFiles;
                }

            function getShotgunObj(evt)
                {
                    compObj = evt.target[0];
                    // evt = compItem
                    // FUNCTIONS
                    function askShotgun (keywords)
                        {
                            //this script python will check if the bg asset exists on shotgun using bg (layer) name
                            ext_py_script = localize (py_scripts_path, "getBGassets.py");
                            pythonScript = system.callSystem (python_path + ' \"' + ext_py_script + '\" -k \"' + String(keywords) + '\"');
                            // uncomment next line to debug python script
                            result = eval (pythonScript);
                            return result ;
                        }
                    //UI BUILD
                    //panel_UI = new Window("dialog", "Find Shotgun Object Tool"); // activate this line to create new window...
                    for (var e= files_panel.children.length-1; e >= 0; e--) { files_panel.remove(e); };
                    sg_search_panel = files_panel.add("panel", undefined,"Get background asset from Shotgun");
                        sg_search_panel.orientation = "column";
                        sg_search_panel.alignment= ['fill','top'];
                        sg_search_panel.alignChildren= ['fill','top'];
                        files_panel.visible = true;
                    // one side for guessed assets to search
                    sg_info_text = sg_search_panel.add("statictext", undefined, "",{multiline:true});
                        sg_info_text.text = "Define the bg re-use:\n\t\t-select BG layer in the list\n\t\t-or give BG re-use name or id in the text field\n\nThen press \"Get Shotgun Object !\" button and select one of the results shown in the list below\n";
                        sg_info_text.preferredSize = [350,80];
                     sg_bg_lists =  sg_search_panel.add("listbox", undefined, "BG layers list", {multiselect:false});
                        sg_bg_lists.preferredSize = [350,80];
                    sg_text_field =  sg_search_panel.add("edittext", undefined);
                        //sg_text_field.size = [350,25];
                    sg_askShotgun_bttn = sg_search_panel.add("button", undefined, "Get Shotgun Object !");
                       // sg_askShotgun_bttn.size = [350,25];
                    sg_arrow_text = sg_search_panel.add("statictext", undefined,"\u25BC");
                       sg_arrow_text.alignment = ['center','top'];
                    // one side for results
                    sg_results_list = sg_search_panel.add("listbox", undefined, "BG layers list", {multiselect:false});
                     sg_results_list.preferredSize = [350,50];
                    sg_bttns_grp = sg_search_panel.add("group");
                        sg_bttns_grp.alignChildren = ['right','middle'];
                    sg_search_confirm_bttn = sg_bttns_grp.add("button", undefined, "Use this background!");
                    //panel_UI.defaultElement = confirm_bttn;
                   // panel_UI.cancelElement = cancel_bttn;
                    
                    // UI ACTIONS
                    sg_bg_lists.onChange = sg_bg_lists.onClick = function () { sg_text_field.text = sg_bg_lists.selection;};
                    sg_askShotgun_bttn.onClick = function ()
                        {
                            to_search = sg_text_field.text;
                            cleaned = to_search.match(/(\w|\d|,)+/gi);
                            result = askShotgun (cleaned);
                            
                            // result = array of asset objects
                            if (result.length == 0)
                                { 
                                    log('err', [$.line, decodeURI(File($.fileName).name)], "Can't find a corresponding asset on Shotgun !\nTry with the shotgun id of the asset.");
                                    for (var e= sg_results_list.children.length-1; e >= 0; e--) { sg_results_list.remove(e); };
                                }
                            else
                                {
                                    for (obj in result)
                                        {
                                            new_sg_item = sg_results_list.add("item", result[obj]['code']);
                                            new_sg_item.id = result[obj]['id'];
                                        }
                                    sg_results_list.selection = sg_results_list[0];
                                }
                        };
                    sg_search_confirm_bttn.onClick = function ()
                        {
                            if (sg_results_list.selection)
                                {
                                    choosen_bg = sg_results_list.selection;
                                    
                                    asset_obj.name = choosen_bg.text;
                                    asset_obj.sg_id = choosen_bg.id;
                                    assetName_field.text = asset_obj.name;
                                    
                                    log('debug', [$.line, decodeURI(File($.fileName).name)], asset_obj.toSource());
                                }
                            else
                                {
                                    alert("You have to select a BG asset in the list of results!");
                                 }
                         };
                    
                    // SCRIPT //
                    // populate the bg list with bg layers 
                    BGlayers = new Array ();
                    for (var lyr=1; lyr <= compObj.layers.length; lyr++)
                        {
                            layer = compObj.layers[lyr];
                            if (layer.label == 8 && layer.name.match(/GB([0-9]{3}|XXX)/gi))
                                {
                                    // clean the name
                                    cleanedName = layer.name.replace(/(\.[a-z0-9]*)/gi, "");
                                    BGlayers.push(cleanedName);
                                }
                        }
                    for (layer in BGlayers)
                        {
                            sg_bg_lists.add("item", BGlayers[layer]);
                            sg_bg_lists.selection = sg_bg_lists[0];
                        }
                    // 
                    bgassettool_UI.layout.layout(true);
                    //panel_UI.show();
                }
            function loadcurrentEpisodeAsset (evt)
                {
                    episodeFolder = evt.target[0];
                    // get list of bg assets already exported for the current episode
                    episode_assets_list = readFile (episodeFolder, 'asset');
                    //UI BUILD
                    for (var e= files_panel.children.length-1; e >= 0; e--) { files_panel.remove(e); };
                    bg_search_panel = files_panel.add("panel", undefined,"Get episode's background assets");
                        bg_search_panel.orientation = "column";
                        bg_search_panel.alignment= ['fill','top'];
                        bg_search_panel.alignChildren= ['fill','top'];
                        files_panel.visible = true;
                    // one side for guessed assets to search
                    bg_info_text = bg_search_panel.add("statictext", undefined, "",{multiline:true});
                        bg_info_text.text = "Choose in the list of BG asset already exported for the current episode the BG you want to re-use for this shot.";
                        bg_info_text.preferredSize = [350,40];
                    bg_list =  bg_search_panel.add("listbox", undefined, "BG layers list", {multiselect:false});
                        bg_list.preferredSize = [350,80];
                    
                    // script
                    // populate bg_list
                    for (obj in episode_assets_list)
                        {
                            item = bg_list.add("item", episode_assets_list[obj].name);
                            item.sg_id = episode_assets_list[obj]['sg_id'];
                            item.parent_shots =  episode_assets_list[obj]['parentShot'];
                        }
                    if (bg_list.numChildren == 0)
                        {
                            alert("There is no BG asset already exported for the current episode!");
                        }
                    //  ACTIONS UI
                    bg_list.onChange = bg_list.onClick = function () 
                        {
                            if (bg_list.selection)
                                {
                                    choosen_bg = bg_list.selection;
                                    
                                    asset_obj.name = choosen_bg.text;
                                    asset_obj.sg_id = choosen_bg.sg_id;
                                    asset_obj.parent_shots = choosen_bg.parent_shots;
                                    assetName_field.text = asset_obj.name;
                                }
                        }
                    //update ui
                    bgassettool_UI.layout.layout(true);
                }
            function loadPSDFile ()
                {
                    //.psd psb
                    prefFolder = current_folder + "/BG/";
                    if (!prefFolder.exists) prefFolder = current_folder;
                    selectedFile = getFiles ("*.psd;*.psb;*.tif" , prefFolder);
                    if (selectedFile) { addFileItem (this.fileType, selectedFile.fsName, this.id, asset_obj); };
                }
            function loadJPEGFile ()
                {
                    //.jpg
                    prefFolder = current_folder + "/BG/";
                    if (!prefFolder.exists) prefFolder = current_folder;
                    selectedFile = getFiles ("*.jpg;*.jpeg" , prefFolder);
                    if (selectedFile) { addFileItem(this.fileType, selectedFile.fsName, this.id, asset_obj); };
                }
            function loadMayaFile ()
                {
                    // .ma
                    prefFolder = current_folder + "/3D";
                    if (!prefFolder.exists) prefFolder = current_folder;
                    selectedFile = getFiles ("*.ma;*.mb", prefFolder);
                    if (selectedFile) { addFileItem(this.fileType, selectedFile.fsName, this.id, asset_obj); };
                }
            function loadCameraPreview ()
                {
                    // .jpg or .avi/.qt
                    if ( bgtype.name == "new 3D moving render")
                        {
                            prefFolder = current_folder + "/3D/Playblast/";
                            if (!prefFolder.exists) prefFolder = current_folder;
                            selectedFile = getFiles ("*.avi;*.mov;*.mp4;*.mpeg", prefFolder);
                        }
                    else
                        {
                            prefFolder = current_folder + "/3D/";
                            if (!prefFolder.exists) prefFolder = current_folder;
                            selectedFile = getFiles ("*.jpg;*.jpeg;*.png", prefFolder);
                        };
                    
                    if (selectedFile) { addFileItem(this.fileType, selectedFile.fsName, this.id, asset_obj); };
                }
            function loadAFXComp (evt)
                {
                    // after effect comp or file
                    compObj = evt.target[0];
                    file_id = this.id;
                    // evt = compItem
                    //UI BUILD
                    //panel_UI = new Window("dialog", "Find Shotgun Object Tool"); // activate this line to create new window...
                        files_panel.visible = true;
                    comp_search_panel = files_panel.add("panel", undefined,"Get BG pre-composition from shot");
                        comp_search_panel.orientation = "column";
                        comp_search_panel.alignment= ['fill','top'];
                        comp_search_panel.alignChildren= ['fill','top'];
                    // one side for guessed assets to search
                    comp_info_text = comp_search_panel.add("statictext", undefined, "",{multiline:true});
                        comp_info_text.text = "Select target BG pre-comp in the list.\nIf the pre-comp of BG asset is not found, please check the pre-comp is loaded in shot composition and has the blue label.";
                        comp_info_text.preferredSize = [350,40];
                     comp_bg_lists =  comp_search_panel.add("listbox", undefined, "BG layers list", {multiselect:false});
                        comp_bg_lists.preferredSize = [350,80];
                    text_field =  comp_search_panel.add("statictext", undefined,"composition to export as BG asset:");
                        text_field.alignment =['left','top'];
                    comp_text_field =  comp_search_panel.add("statictext", undefined);
                        comp_text_field.alignment =['center','top'];
                        //comp_text_field.size = [350,25];
                    
                    // UI ACTIONS
                    comp_bg_lists.onChange = comp_bg_lists.onClick = function ()
                        {
                            projectPath = app.project.file.fsName;
                            target_compItem_id = comp_bg_lists.selection.id;
                            target_compItem_name = comp_bg_lists.selection.text;
                            
                            asset_obj.files[file_id] = [projectPath, target_compItem_id, target_compItem_name];
                            //alert(asset_obj.toSource());
                            comp_text_field.text = comp_bg_lists.selection;
                            comp_text_field.compItem = comp_bg_lists.selection.id;
                            
                        };
                    
                    // SCRIPT //
                    // populate the bg list with bg layers 
                    BGlayers = new Array ();
                    for (var lyr=1; lyr <= compObj.layers.length; lyr++)
                        {
                            layer = compObj.layers[lyr];
                            if (layer.label == 8 && layer.source instanceof CompItem) //layer.name.match(/GB([0-9]{3}|XXX)/gi))
                                {
                                    // clean the name
                                    cleanedName = layer.name.replace(/(\.[a-z0-9]*)/gi, "");
                                    BGlayers.push([cleanedName,layer.source.id]);
                                }
                        }
                    for (layer in BGlayers)
                        {
                            new_precompObj = comp_bg_lists.add("item", BGlayers[layer][0]);
                            new_precompObj.id = BGlayers[layer][1];
                            comp_bg_lists.selection = comp_bg_lists[0];
                        }
                    // 
                    bgassettool_UI.layout.layout(true);
                    //panel_UI.show();
                    
                }
            function loadMOVFile ()
                {
                    //.mov/avi
                    prefFolder = current_folder + "/QT/";
                    if (!prefFolder.exists) prefFolder = current_folder;
                    selectedFile = getFiles ("*.mov;*.avi;*.mp4;*.mpeg", prefFolder);
                    if (selectedFile) { addFileItem(this.fileType, selectedFile.fsName, this.id, asset_obj); };
                }

        
            bttns = [
     /*0*/          {text:'Find an existing asset on Shotgun', image:"shotgun.png", action:getShotgunObj, params:[compItem], fileType:'Shotgun BG Asset'},
     /*1*/          {text:'Find an asset from current episode', image:"current.png", action:loadcurrentEpisodeAsset, params:[episodeFolder], fileType:''},
     /*2*/          {text:'Load PSD file', image:"psd.png", action:loadPSDFile, params:[], fileType:'PSD file'},
     /*3*/          {text:'Load JPG File', image:"jpg.png", action:loadJPEGFile, params:[], fileType:'JPEG file'},
     /*4*/          {text:'Load Maya file', image: "maya.png", action:loadMayaFile, params:[], fileType:'Maya file'},
     /*5*/          {text:'Load 3D camera preview (image)', image: "preview.png", action:loadCameraPreview, params:[], fileType:'Render preview (still)'},
     /*6*/          {text:'Load 3D camera preview (playblast)', image: "preview_video.png", action:loadCameraPreview, params:[], fileType:'Render preview (playblast)'},
     /*7*/          {text:'Load AFX comp', image:"afx.png", action: loadAFXComp, params:[compItem], fileType:'After Effects Composition'},
     /*8*/          {text:'Load video/footage file' ,image:"preview_video.png", action:loadMOVFile, params:[], fileType:'Movie/Footage Preview file'},
                ];
             
    // UI BUILD //
    function build_bgassettool_UI(thisObj) 
        {
            var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("dialog", "Background asset creation tool", [100, 100, 300, 300], {closeButton:false});
            res="Group {orientation:'row', alignment:['fill', 'top'],preferredSize:[600,300],\
                                    leftBar: Group {orientation:'column', alignment:['left', 'fill'],preferredSize:[200,300],\
                                            bg_type_list: DropDownList {alignment:['fill', 'top'], preferredSize:[200,25]},\
                                            bttn_grp: Panel {orientation:'row', alignment:['fill','top'], minimumSize:[300,55], alignChildren:['center','middle']},\
                                            AddTag_bttn : Button {text:'Add tags to asset name', alignment:['fill','top'], visible:true, enabled:false},\
                                            res_bar: Group {orientation:'row', alignment:['fill','top'],\
                                                reso : StaticText{text:'Resolution: ', alignment:['left','top']},\
                                                resolution_list: DropDownList {alignment:['fill','top'], enabled:false},\
                                                },\
                                            infos_panel: Panel {text:'infos', alignment:['fill', 'fill'],\
                                                        infotext: StaticText {text:'', alignment:['fill', 'fill'],preferredSize:[200,200], properties:{multiline:true}}\
                                                   }\
                                        },\
                                    separator: Panel {preferredSize:[0,300],alignment:['fill','fill'], visible:false},\
                                    rightBar: Group {orientation:'column', alignment:['right', 'fill'], preferredSize:[400,300],\
                                            assetGrp: Panel {orientation:'column', alignment:['fill', 'fill']\
                                                    end_grp: Panel {visible:true,orientation:'row',alignment:['fill','top']\
                                                        assetName : StaticText{text:'Asset name: ', alignment:['left','center'], minimumSize:[50,25]},\
                                                        assetNameField : StaticText{alignment:['left','center'], minimumSize:[350,25]},\
                                                        },\
                                                    files_panel: Group {orientation:'column',visible:false,alignment:['fill','top']},\
                                                },\
                                            end_grp: Group {visible:true, alignment:['right', 'bottom']\
                                                    goBttn : Button{text:'Create'},\
                                                    cancelBttn : Button{text:'Cancel'}\
                                                },\
                                        }\
                            }";
                 
            //Add resource string to panel
            myPanel.grp = myPanel.add(res);
            //Setup panel sizing and make panel resizable
            myPanel.layout.layout(true);
            myPanel.grp.minimumSize = myPanel.grp.size;
            myPanel.layout.resize();
            myPanel.onResizing = myPanel.onResize = function () {this.layout.resize();};
            return myPanel;
        }
    /* FUNCTIONS */
    function updateTagsInAssetName (tags, asset_obj)
        {
            assetName = asset_obj.name.split("_");
            // remove old tags
            if (assetName.length > 2)
                {
                    for (t = assetName.length-1; t > 2; t--)
                        {
                            assetName.splice(t,1);
                        }
                }
            
            if (tags instanceof Array) tagList = tags.join("_");
            else tagList = tags;
            
            assetName.push(tagList);
            assetName = assetName.join("_");
            
            return assetName;
        }
    function buildBGTypeList ()
        {
            if (bg_type_list.children.length < 1)
                {
                     bg_type_list.add('item', "Choose the background type");
                }
            for (obj in bg_assets_templates)
                {
                    bg_type_list.add('item', bg_assets_templates[obj].name);
                }
            bg_type_list.selection = bg_type_list[0];
        }
    function changeBGType ()
        {
            // when change the type of BG in the list
            bgtype =bg_assets_templates[bg_type_list.selection];
            if (bgtype.name != "background re-use")
                {
                    asset_obj = new new_BGAssetObj (shotObj);
                    // update the name
                    asset_obj.name = parseNamingConv (shotObj);
                    // update the BG type in asset object
                    asset_obj.BGType = bgtype.bg_asset_type;
                }
            else
                {
                    asset_obj = new reuse_BGAssetObj ();
                 };
            // update the UI for the changes
            updateUI (shotObj, compItem, asset_obj);
            
        }
    function buildResolutionsList ()
        {
            for (obj in resolutions_templates)
                {
                    resolution_list.add('item', resolutions_templates[obj]);
                }
            resolution_list.selection = resolution_list[0];
        }
    function parseNamingConv (shotObj, oldName)
        {
            // episode and shot 
            if (oldName == undefined)
                {
                    assetName =  naming_convention.replace(/GB([0-9]{3}|###)[a-zA-Z]*_/gi, shotObj.episodeCode.replace("_","")+"_");
                    assetName = assetName.replace(/Sc(###|[0-9]{3}[a-zA-Z]?)/gi, shotObj.name);
                }
            else
                {
                    assetName = oldName;
                }
            // bg type
           assetName = assetName.replace("bgtype", bgtype.bg_asset_type);
           
           return assetName;
        }
    function addFileItem (type, file_path, file_ID, asset_obj)
        {
                    // file_ID is the position of the file in the array of files of the BG asset object
                    if (files_panel.visible == false) files_panel.visible = true;
                    newfilePanel = undefined;
                    for (var p=0; p < files_panel.children.length; p++)
                        {
                            if (files_panel.children[p].text == type)
                                {
                                    newfilePanel = files_panel.children[p];
                                 }
                        }
                    if (newfilePanel == undefined)
                        {
                            // no file uploaded before
                            newfilePanel = files_panel.add("panel", undefined, type);
                                newfilePanel.orientation = 'row';
                                newfilePanel.alignment = ['fill','top'];
                            newfileItem = newfilePanel.add("statictext", undefined, file_path);
                            newfilePanel.text.onClick = function () { deleteFileItem (newfilePanel, file_path); };
                            // add file to files_list at the corresponding position
                            asset_obj.files[file_ID] = file_path;
                        }
                    else
                        {
                            // a file of same type already uploaded
                            // need to clean asset_obj.files list and UI
                            // remove old file in asset_obj.files and then replace with new path
                            oldfileItem = newfilePanel.children[0]; // get old file name
                            for (var p = 0; p < asset_obj.files.length; p++)
                                {
                                    if (asset_obj.files[p] == oldfileItem.text)
                                        {
                                            // if old path found in files list of the asset, replace it by new file path
                                            asset_obj.files[p] = file_path;
                                        }
                                }
                            // then update path in UI
                            newfileItem.text = file_path;
                            newfileItem.text.onClick = function () { deleteFileItem (newfilePanel, file_path); };
                        }
                    
                    bgassettool_UI.layout.layout(true);
                }
    function deleteFileItem (panel, file_path)
        {
                    for (var e=0; e < asset_obj.files.length; e++)
                        {
                            if (asset_obj.files[e] == file_path) { asset_obj.files.splice(e,1);};
                        }
                    files_panel.remove(panel);
                    bgassettool_UI.layout.layout(true);
                }
    function updateUI (shotObj, compItem, asset_obj)
        {
            /* ui panel to update with files : files_panel */
            // variables //
            var file_ID = undefined;  //// make sure it has to be stored there !!!!!
            /* main script */
            // clean infos panel
            for (var e= bttns_bar.children.length-1; e >= 0; e--) { bttns_bar.remove(e); };
            for (var e= files_panel.children.length-1; e >= 0; e--) { files_panel.remove(e); };
            // update new infos and buttons
            if (bg_type_list.selection == bg_type_list.items[0])
                {
                    // get back to "choose background type" >> clean all the window
                    infos_panel.text = '';
                    addTag_bttn.visible = false;
                }
            else
                { 
                    // fill up the Infos Box
                    infos_panel.text = (bgtype.infos.replace(/\t/gi,''));
                    // create buttons bar for files upload
                    for (var e=0; e < bgtype.buttons.length; e++)
                        {
                            newBttn = bttns[bgtype.buttons[e]];
                            // create button
                            bttn_obj = bttns_bar.add("image {helpTip: '"+newBttn.text+"', image: \""+(icons_folder+newBttn.image)+"\", id:\""+e+"\", fileType:\""+newBttn.fileType+"\"}");
                            
                            // link parameters for called function to the button object
                            // then we can access to this parameter by calling the target of event
                            /*
                                            bttn_obj.addEventListener ("click", myFunction, false);
                                            bttn_obj.param = parameter;
                                            function myFunction (event)
                                                {
                                                    myParamater = event.target['param'];
                                                }
                                    */
                            for (param in newBttn.params)
                                {
                                    bttn_obj[param] = newBttn.params[param];
                                };
                            // create addEventListener to call the corresponding function
                            bttn_obj.addEventListener ("click", newBttn.action, false);
                        };
                    
                    if (bgtype != bg_assets_templates["background re-use"])
                        {
                            /*==========> <================*/
                            // build an empty list for files array. this list will be checked before sending the object to main script
                            // if the list contain an "undefined" entry, it will means a file is missing
                            // the order of files stored in the array will help to find the preview file to send as thumbnail on Shotgun later on
                            execute_bttn.text = "Create";
                            asset_obj.files = new Array ();
                            for (var e=0; e < bgtype.buttons.length; e++)
                                {
                                    asset_obj.files.push(undefined);
                                }
                            
                            asset_obj.previewFile = bgtype.previewFile;
                            asset_obj.filesToRename = bgtype.filesToRename;
                            asset_obj.id = String(bg_type_list.selection);
                            // update UI
                            assetName_field.text = asset_obj.name;
                            addTag_bttn.visible = true;
                            addTag_bttn.enabled = true;
                            
                            if (bgtype.resolution_opt == 1)
                                {
                                    resolution_list.enabled = true; 
                                    resolution_list.parent.visible = true;
                                    asset_obj.resolution = String(resolution_list.selection.text);
                                    resolution_list.onChange = function () { asset_obj.resolution = String(resolution_list.selection.text);};
                                }
                            else
                                {
                                    resolution_list.enabled = false;
                                    resolution_list.parent.visible = false; 
                                };
                        }
                    else  // bg re-use
                        {
                            // UI build
                            execute_bttn.text = "Link";
                            assetName_field.text = "";
                            addTag_bttn.enabled = false;
                            resolution_list.enabled = false;
                            resolution_list.parent.visible = false; 
                        };
                    
                    // show asset name and buttons
                    if (ActionBttns_bar.visible == false) ActionBttns_bar.visible = true;
                };
            
            // rebuild the UI
            bgassettool_UI.layout.layout(true);
        }
    /* final functions */
    function send_asset (asset_obj)
        {
            // functions
            function checkMissingFiles (asset_obj)
                {
                    missingFilesCount = 0;
                    for (var e=0; e < asset_obj.files.length; e++)
                        {
                            if (asset_obj.files[e] == undefined) { missingFilesCount++; }
                        }
                    if (missingFilesCount > 0)  {  return true; }
                    else return false;
                }
            function check_exists_inShotList (asset_obj)
                {
                    temp = false;
                    if (execute_bttn.text == "Create" && shotObj.background_asset instanceof Array)
                        {   
                            // it is a list, we are on good way
                            // check if asset name is in the list of bg_assets linked to the shot
                            for (var e=0; e < shotObj.background_asset.length; e++)
                                {
                                    if (String(shotObj.background_asset[e][0]) == String(asset_obj.name))
                                        {
                                            ask = confirm(asset_obj.name + '\nalready linked to ' + shotObj.shotCode + '.\n Do you want to overwrite?');
                                            if (ask == false) { temp = true; }
                                            else { temp = false; };
                                        };
                                }
                        };
                    // if temp = false, the BG asset can be added to the shot bg list
                    // if temp = true, the BG already exists in the shot's bgs list and the user does not want to overwrite it
                    return temp;
                }
            // basic checks
            readytoExport = false;
             if (asset_obj.name == undefined)
                {
                    alert('Can\'t create current BG asset:\n name is undefined !');
                    readytoExport = false;
                }
            else if (asset_obj.BGType == undefined)
                {
                    alert('Can\'t create current BG asset.\nPlease choose a valid BG type !');
                    readytoExport = false;
                }
            else
                {
                    if (asset_obj.BGType == 're-use')
                        {
                            // we return the asset_objas it is
                            readytoExport = true;
                        }
                    else
                        {
                            /* we need to do some checks :
                                                # missing files
                                                # missing tags in name
                                                # asset is not already existing in both .shot and .asset lists
                                     */
                            // check if files are missing
                            try {
                            missingFiles =checkMissingFiles (asset_obj);
                            bg_exists = check_exists_inShotList (asset_obj);
                            asset_check = check_exists_inAssetList (episodeFolder, asset_obj);
                            bgtype = bg_assets_templates[asset_obj["id"]];
                                }
                            catch (err) { 
                                    log('err', [$.line, decodeURI(File($.fileName).name)], "send " + asset_obj.name + " >> error :\n" + err.message);
                                    };
                            // get values of checks and define if asset ready to export
                            if (!asset_obj.task_template)
                                {
                                         log('err', [$.line, decodeURI(File($.fileName).name)],"BG name is not complete.\nPlease add tag(s) before creating asset\n");
                                        readytoExport = false;
                                }
                            else if(missingFiles == true)
                                {
                                        log('err', [$.line, decodeURI(File($.fileName).name)],"Not enough files provided ("+asset_obj.files.length+"/"+bgtype.buttons.length+")!\nPlease check the infos box corresponding to asset type and upload corresponding files before finish.\n");
                                        readytoExport = false;
                                 }
                            else if (bg_exists == true)
                                {
                                        readytoExport = false;
                                }
                            else if (execute_bttn.text == "Create" && asset_check == true)
                                {
                                        log('err', [$.line, decodeURI(File($.fileName).name)], "This asset name is already used !\nPlease change asset name!");
                                        readytoExport = false;
                                 }
                             else readytoExport = true;
                        }
                }
            // all checks have been done, we can send the asset_obj if everything is fine
            if (readytoExport == true)
                {
                    // everything if fine now...
                    // close UI
                    bgassettool_UI.close();
                    //return asset_obj
                    return asset_obj;
                }
        }
    function cancel (asset_obj)
        {
            asset_obj = null;
            bgassettool_UI.close();
            return asset_obj;
        }
     /* SCRIPT MAIN */
    bgassettool_UI = build_bgassettool_UI(thisObj);
    if ((bgassettool_UI != null))
        {
                /* variable for UI */
                bg_type_list = bgassettool_UI.grp.children[0].children[0];
                bttns_bar = bgassettool_UI.grp.children[0].children[1];
                addTag_bttn = bgassettool_UI.grp.children[0].children[2];
                resolution_list = bgassettool_UI.grp.children[0].children[3].children[1];
                infos_panel = bgassettool_UI.grp.children[0].children[4].children[0];
                assetPanel = bgassettool_UI.grp.children[2].children[0];
                assetPanel.alignment = ['fill','fill'];
                    assetName_field =  assetPanel.children[0].children[1];
                    files_panel =  assetPanel.children[1];
                    files_panel.alignment = ['fill','fill'];
                ActionBttns_bar = bgassettool_UI.grp.children[2].children[1];
                    execute_bttn = ActionBttns_bar.children[0];
                    bgassettool_UI.defaultElement = execute_bttn;
                    cancel_bttn = ActionBttns_bar.children[1];
                    bgassettool_UI.cancelElement = cancel_bttn;
            
            /* UI build functions */
            buildBGTypeList ();
            buildResolutionsList ();
            
            cancel_bttn.onClick = function () { asset_obj = cancel (asset_obj); };
            execute_bttn.onClick = function () { asset_obj = send_asset (asset_obj); };
            addTag_bttn.onClick = function ()
			{
				function add_tag (asset_obj)
				{
					try
					{
						var tag_items = TaggerTool_buildUI  (bg_type_list.selection);
						// [tags, task_template]
						log('debug', [$.line, decodeURI(File($.fileName).name)], 'boop');
						if (tag_items != undefined)
						{
							log('debug', [$.line, decodeURI(File($.fileName).name)], 'boop');
							asset_obj.task_template = tag_items[0];
							log('debug', [$.line, decodeURI(File($.fileName).name)], 'boop');
							asset_obj.name = updateTagsInAssetName (tag_items[1], asset_obj);
							log('debug', [$.line, decodeURI(File($.fileName).name)], 'boop');
							assetName_field.text = asset_obj.name;
							log('debug', [$.line, decodeURI(File($.fileName).name)], 'boop');
							asset_obj.tag_list = tag_items[1].replace("_",",");
						}
					}
					catch (err) { log('err', [$.line, decodeURI(File($.fileName).name)], 'tagger tool error >>>\n' + err.message); }
				}
				add_tag (asset_obj);
			 };
            bg_type_list.onChange = changeBGType;
            resolution_list.onChange = function () { asset_obj.resolution = String(resolution_list.selection.text);};
            
            /* NEW ASSET OR UPDATE ?? */
            // define if we are building a new asset or updating existing one
            // build the UI consequently
            try
            {
                if (assetToUpdate && assetToUpdate instanceof Object)
                    {
                        // we create new object corresponding to assetToUpdate
                        // all modifications will be done on this one and the object "assetToUpdate" will keep old infos
                        // the old asset will be deleted if we return a valid object when clicking "done"
                       var asset_obj = new new_BGAssetObj (shotObj);
                        for (var e= 0; e < bg_type_list.items.length; e++)
                            {
                                if (String(bg_type_list.items[e]) == "background re-use")
                                    {
                                        bg_type_list.remove(bg_type_list.items[e]);
                                    }
                                if (String(bg_type_list.items[e]) == assetToUpdate.id)
                                    {
                                        // we select corresponding BG type in dropdown list
                                        bg_type_list.selection = bg_type_list.items[e];
                                        //bg_type_list.notify();
                                    }
                            }
                        for (param in assetToUpdate)
                            {
                                asset_obj[param] = assetToUpdate[param];
                            }
                        old_files = assetToUpdate.files;
                        old_name = assetToUpdate.name;
                        old_res = assetToUpdate.resolution;
                        old_res = assetToUpdate.resolution;
                        // change asset_name textfield and get back
                        assetName_field.text = old_name;
                        // load file panels
                        for (obj in old_files)
                            {
                                oldFile = new File (old_files[obj]).fsName;
                                addFileItem(bttns_bar.children[obj].fileType, oldFile, obj, asset_obj);
                            }
                        // check if resolution arg and update
                        if (assetToUpdate.resolution)
                            {
                                for (var i= 0; i < resolution_list.items.length; i++)
                                    {
                                        if (String(resolution_list.items[i]).match(assetToUpdate.resolution))
                                            {
                                                // we select corresponding resolution in the list
                                                resolution_list.selection = resolution_list.items[e];
                                            }
                                    }
                            }
                        else
                            {
                                resolution_list.enabled = false;
                                resolution_list.parent.visible = false; 
                            };
                        // change button execute name
                        execute_bttn.text = "Update";
                        log('debug', [$.line, decodeURI(File($.fileName).name)], "UI built for asset to update");
                    }
                else
                    {
                    // create a new BG Asset object
                    // bg asset object creation (overwritted each time the dropdown list selection change
                    //updateUI (shotObj, compItem);
                    var asset_obj = new new_BGAssetObj (shotObj);
                        log('debug', [$.line, decodeURI(File($.fileName).name)], "UI built for new asset");
                 }
             }
            catch (err) { log('err', [$.line, decodeURI(File($.fileName).name)], err.message); }
            
            // update UI and show the UI
            bgassettool_UI.layout.layout(true);
            bgassettool_UI.show();
            
            // at the end, return the obj;
            return asset_obj;
        }
     else
        {
            // impossible to build the UI
            log('err', [$.line, decodeURI(File($.fileName).name)], "Impossible to build the BGAssetTool UI.");
            return undefined;
        }
    }
    catch(err) { log('err', [$.line, decodeURI(File($.fileName).name)],err.message)};
}