try
    {
// includes for external scripts
#includepath "./(external_js)/;./(external_js)/templates/;./(custom_options)/;./(external_js)/controls/"

        // include glob vars
        #include "glob_vars.jsx"
        #include "objects_template.jsx"
        // CUSTOM OPTIONS FILES
        #include "ui_custom_options.jsx"
        #include "project_custom_options.jsx"
        // create BG assets Tool
        #include "createBGAsset_tool.jsx"
        #include "bg_asset_params.jsx"
        #include "TaggerTool.jsx"
        #include "location_tags.jsx"
        // include external scripts
        #include "processLists.jsx"
        #include "shot_export_task.jsx"
		// J Hearn - custom control
		#include "TagEditor.jsx";
        
// define which version of afterEffects to use
//by default After Effects CS5.5
#target aftereffects-13.0

        var log_dir = new Folder ("~/Documents/AdobeScripts/ExportTool/logs");
        log_dir.create();
        var logFile = new File ("~/Documents/AdobeScripts/ExportTool/logs/exportTool.log");
        logFile.open("w","Text","UTF-8");
        logFile.write("==== LayoutExportTool Debug ====\n");
         
        function log(type, line, arg1, arg2)
            {
                logFile.open("a","Text","UTF-8");
                
                if (type == 'err')
                    {
                        logFile.write(localize("ERROR\t%1[line %2] >\t%3\n", line[1], line[0], arg1));
                        alert(localize("%1 %2[line %3]", arg1, line[1], line[0]), 'ERROR !');
                    }
                else if (type == 'debug')
                    {
                        if (debug == true)
                            {
                                logFile.write(localize("DEBUG\t%1[line %2] >\t%3\n", line[1], line[0], arg1));
                            }
                    }
                else
                    {
                         logFile.write(localize("INFO\t >> \t%3\n", line[1], line[0], arg1));
                    }
                
                logFile.close();
            }
        
// script
function CleaningNotBoring (thisObj)
    {
        
        //--- VARIABLES ---//
        version = "3.0";
        author = "Samy Barras\nsamy.barras@gmail.com"; 
        //--- GLOBAL FUNCTIONS ---//
        function loadScript (script)
            {
                var scriptFile = new File(script);
                if (scriptFile.exists) { $.evalFile(scriptFile);}
                else
                    {
                        log('err', [$.line, decodeURI(File($.fileName).name)], decodeURI(scriptFile) + "\n is missing", "name");
                    }
            }
        function getEpisodeFolders (arg)
            {
                ScriptPath = localize(py_scripts_path, "getEpiFolder.py");
                pythonScript = system.callSystem (python_path + ' \"' + ScriptPath + '\" -e \"' + arg + '\"');
                result = eval (pythonScript);
                if (result.match(/GB[0-9]{3}_[a-zA-Z]*/)) { return result; }
                else { throw new Error("Cannot find the episode folder\n" + arg);}
            }
		// J Hearn
		function getUsersAndDepts()
		{
			ScriptPath = localize(py_scripts_path, "getUsersAndDepts.py");
			pythonScript = system.callSystem (python_path + ' \"' + ScriptPath + '\"');
			return eval("(" + pythonScript + ")");
		}
        function ShotsToExport_ListBuilder ()
            {
                /*
                        This function check the number of compositions in the project and build the UI Panel with list of shots to allow
                        user to choose which shots will be exported
                        
                        when "done" or "cancel" buttons are called:
                        > main window (ShotsCollectiondlg) is closed
                        > if cancelFn, nothing returned
                        > if doneFn
                                # build a list of compItem used in shotPanel_builder function to create panels for each shot
                                # close the dialog
                    */
                ShotsToExport = undefined; // this var will be returned when dialog will be closed
                if (app.project.file != null)
                    {
                        /* UI FUNCTIONS */
                        function addShotsfn ()
                            {
                                if (listA.selection)
                                    {
                                        listB.itemSize = [100,20];
                                        var ShotsAlreadyChoosen = new Array (); 
                                        var lookup = {};
                                        
                                        for (var e=0; e < listB.items.length; e++)
                                            {
                                                ShotsAlreadyChoosen.push(listB.items[e]);
                                            }
                                        for (var j in ShotsAlreadyChoosen)
                                            {
                                                lookup[ShotsAlreadyChoosen[j]] = ShotsAlreadyChoosen[j];
                                            }
                                        for (var e=0; e <listA.selection.length; e++)
                                            {
                                                if (typeof lookup[listA.selection[e].text] == "undefined")
                                                    {
                                                        newItem = listB.add("item", listA.selection[e].text);
                                                    };
                                            }
                                    }
                                //else { writeLn('no shot selected'); };
                            }
                        function addAllShotsfn ()
                            {
                                // add all shots of the list which are not already selected
                                var ShotsAlreadyChoosen = new Array (); 
                                var lookup = {};
                                for (var e=0; e < listB.items.length; e++)
                                    {
                                        ShotsAlreadyChoosen.push(listB.items[e]);
                                    }
                                for (var j in ShotsAlreadyChoosen)
                                    {
                                        lookup[ShotsAlreadyChoosen[j]] = ShotsAlreadyChoosen[j];
                                    }
                                for (var e=0; e <listA.items.length; e++)
                                    {
                                        if (typeof lookup[listA.items[e].text] == "undefined")
                                            {
                                                newItem = listB.add("item", listA.items[e].text);
                                            };
                                    }
                            }
                        
                        function delShotfn ()
                            {
                                if (listB.items.length > 0)
                                    {
                                        for (var i=0; i < listB.items.length; i++)
                                            {
                                                if (listB.items[i].selected == true) { listB.remove(i); };
                                            }
                                    }
                                else
                                    {
                                        writeLn ('no shot is selected list');
                                    };
                            }
                        function delAllShotsfn ()
                            {
                                listB.removeAll();
                            }
                       
                        /* OTHER FUNCTIONS */
                        function cancelFn ()
                            {
                                ShotsToExport = undefined;
                                ShotsCollectiondlg.close();
                                return undefined;
                            }
                        function doneFn ()
                            {
                                function  build_shotsarr_list ()
                                    {
                                        var ShotsSelected = new Array (); 
                                        var lookup = {};
                                        var shotsarr = new Array ();  // shotsarr will store all shots selected by the artist. These shots will be process in later function.
                                        for (var e=0; e < listB.items.length; e++)
                                            {
                                                ShotsSelected.push(listB.items[e]);
                                            }
                                        for (var j in ShotsSelected)
                                            {
                                                lookup[ShotsSelected[j]] = ShotsSelected[j];
                                            }
                                        for (var i in CompCollection)
                                            {
                                                comp = CompCollection[i];
                                                if (typeof lookup[comp.name] != "undefined")
                                                    {
                                                        shotsarr.push(CompCollection[i]);
                                                    }
                                            }
                                        return shotsarr;
                                    }
                                /**/
                                ShotsToExport = build_shotsarr_list ();
								TabbedPanel.layout.layout(true);
                                ShotsCollectiondlg.close();
                                return ShotsToExport;
                            }
                        /* SCRIPT */
                        var CompCollection = new Array();
                        // get all compItems of the project matching shot param
                        for (var i = 1; i <= app.project.numItems; i++)
                            {
                                var temp = false;
                                if (app.project.item(i) instanceof CompItem && app.project.item(i).name.match(/^[0-9]{3}([a-zA-Z]{1})?$/g) && app.project.item(i).parentFolder == app.project.rootFolder)
                                    {
                                        for (var e=0; e < TabbedPanel.children.length; e++)
                                            {
                                                compname = TabbedPanel.children[e].text.substring(2);
                                                if (app.project.item(i).name.match(compname)) { temp = true; };
                                            }
                                        if (temp == false) CompCollection.push(app.project.item(i));
                                    };
                            }
                        // read the list
                        if (CompCollection.length > 1)
                            {
                                /* BUILD WINDOW LIST*/
                                ShotsCollectiondlg = new Window("dialog", "Shots to Export");
                                    ShotsCollectiondlg.add("statictext", undefined, "Please select in the list the composition(s)\nyou want to add to Export Queue :\n", {multiline:true});
                                    grp = ShotsCollectiondlg.add("group");
                                        grp.orientation = "row";
                                        grp.alignChildren = "left";
                                    listA = grp.add("listbox", undefined, "Shots List", {multiselect:true});
                                        listA.size = [80,700];
                                            for (e=0; e < CompCollection.length; e++)
                                                {
                                                    newItem = listA.add("item", CompCollection[e].name);
                                                }
                                        bttngrp = grp.add("group");
                                            bttngrp.orientation = "column";
                                            bttngrp.alignChildren = "center";
                                        addAllShots = bttngrp.add("button", undefined, "+ ALL");
                                            addAllShots.size = [40,40];
                                        addShots = bttngrp.add("button", undefined, "+");
                                            addShots.size = [40,40];
                                        removeShots = bttngrp.add("button", undefined, "-");
                                            removeShots.size = [40,40];
                                        removeAllShots = bttngrp.add("button", undefined, "- ALL");
                                            removeAllShots.size = [40,40];
                                        listB = grp.add("listbox", undefined, "Shots to Export", {multiselect:true});
                                            listB.size = [80,700];
                                        endgrp = ShotsCollectiondlg.add("group");
                                            endgrp.orientation = "row";
                                            endgrp.alignChildren = "right";
                                        LoadShots = endgrp.add("button", undefined, "ok");
                                            LoadShots.text = "Done!";
                                            ShotsCollectiondlg.defaultElement = LoadShots;
                                        cancel = endgrp.add("button", undefined, "Cancel");
                                            cancel .text = "Cancel";
                                            ShotsCollectiondlg.cancelElement = cancel;
                                /* ACTIONS BUTTONS */
                                cancel.onClick = cancelFn;
                                LoadShots.onClick = doneFn;
                                addShots.onClick =  addShotsfn;
                                addAllShots.onClick =  addAllShotsfn;
                                removeShots.onClick =  delShotfn;
                                removeAllShots.onClick =  delAllShotsfn;
                                /* create the window */
                                ShotsCollectiondlg.frameLocation = [100,100];
                                ShotsCollectiondlg.show();
                            }
                        else if (CompCollection.length == 1) // if only one composition in current project
                            {
                                ShotsToExport = [CompCollection[0]];
                            }
                        else
                            {
                                alert("All shots have already been added the Export Tool !");
                                ShotsToExport = undefined;
                            };
                    }
                else
                    {
                        log('err', [$.line, decodeURI(File($.fileName).name)], "You haven't opened a project!");
                    }
               return ShotsToExport;
            }

        function endScript ()
            {
                try
                {
                    logFile.close();
                }
                catch (err) {return;};
                $.gc();
            }
/* UI BUILD FUNCTIONS */
        function exportToolUI_builder (thisObj)
            {
                var Exportdlg = (thisObj instanceof Panel) ? thisObj : new Window ("palette", "Layout Export CC EDITION "+version, undefined, {resizeable:true});        
                if (Exportdlg != null)
                    {
                        Exportdlg.orientation = "column";
                        Exportdlg.alignChildren = ["fill","fill"];
                        // master group options buttons
                        Exportdlg.grpa = Exportdlg.add("group");
                            Exportdlg.grpa.orientation = "row";
                            Exportdlg.grpa.alignment = ["fill","top"];
                            Exportdlg.grpa.alignChildren = ["fill","top"];
                            
                            ListBttnGrp = Exportdlg.grpa.add("group");
                                ListBttnGrp.orientation = "row";
                                ListBttnGrp.alignment = ["fill","top"];
                                ListBttnGrp.alignChildren = "top";
                                AddShotsList = ListBttnGrp.add("button", undefined, "Add shots to queue");
                                    AddShotsList.alignment = "left";
                                EmptyBttn = ListBttnGrp.add("button", undefined, "Empty Export Queue");
                                    EmptyBttn.alignment = "left";
                                HelpButton =  ListBttnGrp.add("image {helpTip:\"Help\", image: \""+(icons_folder+"help.png")+"\"}");
                                    HelpButton.alignment = ['right','middle'];
                        /* this group will receive panels for each shots */
                        Exportdlg.grp = Exportdlg.add("tabbedpanel");
                            Exportdlg.grp.minimumSize = [1250,700];
                           
                             
                        // then button to export shots
                        ExportBttn = Exportdlg.add("button",undefined,"Export");
                            ExportBttn.alignment = ["right","bottom"];
                            Exportdlg.defaultElement = ExportBttn;
                            
                         // debug button
                        debugBttn = Exportdlg.add("button",undefined,"debug");
                            debugBttn.alignment = ["right","bottom"];
                             debugBttn.enabled = true;
                             debugBttn.visible = true;
                                           
                        Exportdlg.layout.layout(true);
                        Exportdlg.minimumSize = [(Exportdlg.grp.minimumSize.width), (Exportdlg.grp.size.height + Exportdlg.grpa.size.height + ExportBttn.size.height + 20)];
                        Exportdlg.layout.resize();
                        Exportdlg.onResizing = Exportdlg.onResize = function () {this.layout.resize();}
                    }
                return Exportdlg;
            }
        function shotPanel_builder (compItem)
            {
                /*
                       shotItem = compItem
                    */
                //--- FUNCTIONS ---//
                function check_shotItem (appFolder, shotObject)
                    {
                        /*
                                    this function will define the status of the shot : new / exported / uploaded
                                    depending on this status:
                                        > ".shot" list will be created or updated
                                        > UI will be built using ".shot" values
                                */
                        status = undefined; // 
                        if (appFolder.exists)
                            {
                                // read ".shot" file and get status
                                var appFolder_Files = appFolder.getFiles();
                                if (appFolder_Files.length > 0)
                                    {
                                        for (var i=0; i <appFolder_Files.length ; i++)
                                            {
                                                if (appFolder_Files[i].name == '.shot')
                                                    {
                                                        var shotObject = readFile (appFolder, 'shot');
                                                        var tmp_status = shotObject['status'];
                                                        if (use_realShotStatus == false)
                                                            {
                                                                if (tmp_status.match(/uploaded/))  { status = "exported"; }
                                                                else { status = tmp_status; }
                                                            }
                                                        else
                                                            {
                                                                status = tmp_status;
                                                            }
                                                        break;
                                                    }
                                            }
                                        if (status == undefined) { status = 'new'; };
                                    }
                                else
                                    {
                                        status = 'new';
                                    }
                            }
                        else
                            {
                                // folder doesn't exist, we have to create it ¬
                                appFolder.create ();
                                status = 'new';
                            }
                        return status;  
                    }
                // UI FUNCTIONS  >> Build a shot panel
                function build_newShotPanel (shotObj, compItem, stat)
                    {
                        // define UI panel specifities
                        // title for shot panel
                        var title = undefined;
                        if (showShotStatus_inPanelName == true) var title =  shotObj.name + " [" + stat +"]";
                        else title = shotObj.name;
                        var compPanel =  TabbedPanel.add("tab");
                        compPanel.text = title ;
                        compPanel.comp = compItem; // extra argument passed through panel object 
                        compPanel.appFolder = shotObj.appFolder; // extra argument passed through panel object 
                        compPanel.orientation = "column";
                        compPanel.margins = [10,5,10,5];
                        compPanel.grp = compPanel.add("group");
                            compPanel.grp.alignment = ['fill','fill'];
                         /* Export Option Master Group */
                            compPanel.ExportOptionsGrp = compPanel.grp.add("group", undefined, undefined, {name: 'ExportOptionsGrp'});
                            compPanel.ExportOptionsGrp.orientation = "row";
                            compPanel.ExportOptionsGrp.alignment = ['fill','middle'];
                            compPanel.ExportOptionsGrp.alignChildren = ['center','middle'];
                                compPanel.AECheck = compPanel.ExportOptionsGrp.add("checkbox", undefined, "AE", {name: 'AECheck'}); // 0
                                compPanel.AECheck.value = shotObj.exportAE;
                                compPanel.AECheck.helpTip = "Export After Effect project for this shot if checked";
                                compPanel.QTCheck = compPanel.ExportOptionsGrp.add("checkbox", undefined, "QT", {name: 'QTCheck'}); // 1
                                compPanel.QTCheck.value = shotObj.exportQT;
                                compPanel.QTCheck.helpTip = "Export Quicktime file for this shot if checked";
                                compPanel.FramingCheck = compPanel.ExportOptionsGrp.add("checkbox", undefined, "Framing", {name: 'FramingCheck'});  // 2
                                compPanel.FramingCheck.value = shotObj.exportFraming;
                                compPanel.FramingCheck.helpTip = "Export framing of this shot for animators if checked";
                                compPanel.MultiFramingCheck = compPanel.ExportOptionsGrp.add("checkbox", undefined, "Multi-Framing", {name: 'MultiFramingCheck'});  // 2
                                compPanel.MultiFramingCheck.value = (shotObj.exportMultiFraming == true);
                                compPanel.MultiFramingCheck.helpTip = "Export start frame, end frame and wide";
                                compPanel.MACheck = compPanel.ExportOptionsGrp.add("checkbox", undefined, "3D Anim", {name: 'MACheck'});  // 3
                                compPanel.MACheck.value = false;
                                compPanel.MACheck.helpTip = "Export maya file for 3D anim if checked";
                            compPanel.export_status  =  compPanel.grp.add("group", undefined, undefined, {name: 'export_status'});  // 4
                                compPanel.export_status.alignment = ['right','middle'];
                                compPanel.AddBGAssetBttn =  compPanel.export_status.add("button", undefined, "Add BG asset", {name: 'AddBGAssetBttn'});
                                compPanel.appFolder_bttn_obj = compPanel.export_status.add("image {name: \"appFolder_bttn_obj\", helpTip:\"Open approved folder\", image: \""+(icons_folder+"folder_icon_3.png")+"\"}");
                                
                        /* This grp will contains assets and files to export */
                       compPanel.assets_grp = compPanel.add("group", undefined, "assets_group", {name: 'assets_grp'});
                            compPanel.assets_grp.orientation = "column";
                            compPanel.assets_grp.margins = [0,10,0,10];
                            compPanel.assets_grp.id = 1;
                            compPanel.assets_grp.alignment = ['fill','top'];
					
						// J Hearn - this panel contains notes
						compPanel.notes_panel = compPanel.add("panel", undefined, "Notes");
                            compPanel.notes_panel.orientation = "column";
                            compPanel.notes_panel.margins = [0,5,0,5];
                            compPanel.notes_panel.id = 2;
							compPanel.notes_panel.alignment = ['fill','top'];
							compPanel.notes_panel.alignChildren = ['fill','fill'];
						compPanel.notes_to_grp = compPanel.notes_panel.add("group");
							compPanel.notes_to_grp.orientation = "row";
							compPanel.notes_to_grp.alignment = ['fill','top'];
						compPanel.notes_to_grp.add("statictext", undefined, "To:");
						
						compPanel.notes_to = new TagEditor(compPanel.notes_to_grp, usersAndDepts.users.sort(), shotObj.notesTo);
						compPanel.notes_depts_grp = compPanel.notes_panel.add("group");
							compPanel.notes_depts_grp.orientation = "row";
							compPanel.notes_depts_grp.alignment = ['fill','top'];
						compPanel.notes_depts_grp.add("statictext", undefined, "Departments:");
						compPanel.notes_depts = new TagEditor(compPanel.notes_depts_grp, usersAndDepts.departments.sort(), shotObj.notesDepts);
						compPanel.notes_edit = compPanel.notes_panel.add("edittext", undefined, shotObj.notes, {multiline: true});
                            
                        // ACTIONS
                        compPanel.AddBGAssetBttn.onClick = function ()
                            { 
                                // create BGcreationPanel
                                newAsset = bgassettool (this, shotObj, episodeFolder, compItem, undefined);
                                if (newAsset instanceof Object)
                                    { 
                                        // build ui panel for this new asset
                                        new_panel = build_bg_asset_panel (this.parent.parent.parent.children[1], newAsset, shotObj);
                                        // update assets Lists!
                                        if (newAsset.status.match(/re-use|locked/gi))
                                            {
                                                assets_list = readFile (episodeFolder, 'asset');
                                                if (newAsset.name in assets_list)
                                                    {
                                                        bg_reuse = assets_list[newAsset.name];
                                                        // it is a bg re-use of an asset of the episode.
                                                        newAsset.sg_id = bg_reuse['sg_id'];
                                                        // add the actual shot to list of parent shots of the asset
                                                        bg_reuse['parentShot'].push(shotObj.name);
                                                        addAssetToFile (episodeFolder, bg_reuse);
                                                    }
                                                // add the bg-asset to the .shots List
                                                updateAssetInShotFile (appFolder, newAsset, 'add', newAsset['sg_id']);
                                            }
                                        else
                                            {
                                                // get export status checkbox's value
                                                queueStatus = new_panel.children[2].children[2].value;
                                                // add the bg-asset to the .asset List
                                                addAssetToFile (episodeFolder, newAsset);
                                                // add the bg-asset to the .shots List
                                                updateAssetInShotFile (appFolder, newAsset, 'add', queueStatus);
                                             }
                                        // update the ui
                                        new_panel.parent.parent.layout.layout(true);
                                         // make sure there is a maya file for 3D BGs
                                        if (newAsset.id.match(/3D|camera/gi))
                                            {
                                                //we need 3D for this BG
                                                if (compPanel.MACheck.value == false) compPanel.MACheck.notify();
                                            }
                                     }
                            };
                        compPanel.appFolder_bttn_obj.onClick = function ()
                            { 
                               appDir = new Folder(shotObj.appFolder);
                               appDir.execute();
                               getExportedFiles (this, shotObj);
                            };
                               
                        compPanel.MACheck.onClick =  function () {
                            maya_file = shotObj.maFile;
                            if (maya_file) { build_maya_file_panel (compPanel.assets_grp, this, maya_file, appFolder); }
                            else { build_maya_file_panel (compPanel.assets_grp, this, undefined, appFolder); };
                            
                            };
                        compPanel.AECheck.onClick =  function ()  { updateEntryInShotFile (appFolder, this.value, "AE"); };
                        compPanel.QTCheck.onClick =  function ()  { updateEntryInShotFile (appFolder, this.value, "QT"); };
                        compPanel.FramingCheck.onClick =  function ()
						{
							compPanel.MultiFramingCheck.enabled = this.value;
							if (!this.value && compPanel.MultiFramingCheck.value)
							{
								compPanel.MultiFramingCheck.value = false;
								updateEntryInShotFile (appFolder, compPanel.MultiFramingCheck.value, "MultiFraming");
							}
							updateEntryInShotFile (appFolder, this.value, "Framing");
						};
						compPanel.MultiFramingCheck.onClick =  function ()  { updateEntryInShotFile (appFolder, this.value, "MultiFraming"); };
						
						compPanel.notes_to.onChange = function () { updateEntryInShotFile(appFolder, compPanel.notes_to.tags, "NotesTo");};
						compPanel.notes_depts.onChange = function () { updateEntryInShotFile(appFolder, compPanel.notes_depts.tags, "NotesDepts");};
						compPanel.notes_edit.onChange = function () { updateEntryInShotFile(appFolder, compPanel.notes_edit.text, "Notes");};
						
                        // 
                        // re build the panel
                        TabbedPanel.layout.layout(true);
                        return compPanel;
                    }
                // UI FUNCTIONS  >> Build asset panel
                function getExportedFiles (icon, shotObj)
                    {
                        icon.image = icons_folder + "folder_icon_0.png";
                        //
                        destArray = [];
                        function FindAllFolders (srcFolderStr, destArray)
                            {  
                                var fileFolderArray = Folder( srcFolderStr ).getFiles();  
                                for ( var i = 0; i < fileFolderArray.length; i++ )
                                    {  
                                        var fileFoldObj = fileFolderArray[i];  
                                        if ( fileFoldObj instanceof File )
                                        {  
                                           destArray.push( Folder(fileFoldObj) ); 
                                        }
                                        else
                                        {  
                                            destArray.push( Folder(fileFoldObj) );  
                                            FindAllFolders( fileFoldObj.toString(), destArray );  
                                        }  
                                    }  
                                return destArray;  
                            };  
                        var appFolder_Files = FindAllFolders (shotObj['appFolder'],destArray);
                        var filesToFind = [];
                        for (obj in appFilesToCheck)
                            {
                                cleanName = localize(appFileName_template, shotObj['episodeCode'].replace("_", ''), shotObj['name'], appFilesToCheck[obj]);
                                filesToFind.push(cleanName);
                            }
                        files_found = 0;
                        if (appFolder_Files.length > 0)
                            {
                                for (obj in filesToFind)
                                    {
                                        file_found = false;
                                        for (var i=0; i <appFolder_Files.length ; i++)
                                            {
                                                file_name = appFolder_Files[i].name;
                                                if (file_name.search(filesToFind[obj],"gi") != -1)
                                                    {
                                                        file_found = true;
                                                    };
                                            }
                                        if (file_found == true) files_found++;
                                     }
                            }
                        if (files_found < 1) icon.image = icons_folder + "folder_icon_3.png";
                        else if (files_found > 2) icon.image = icons_folder + "folder_icon_4.png";
                        else icon.image = icons_folder + "folder_icon_1.png";
                    }
                function build_bg_asset_panel (obj, bg_asset, shotObj)
                    {
                        // obj = parent panel
                        // bg_asset = [asset name, asset id] or object
                        // compItem = compItem
                        //alert ([$.line, decodeURI(File($.fileName).name)] + "\n" + bg_asset.toSource());
                        // FUNCTIONS PROCESS//
                        function check_assetItem (obj, call_shotgun)
                            {
                                // define if obj is an object (and dict entry) or an array (coming from shotObj.background_assets)
                                // check obj status according to Shotgun and/or assets_list
                                // update the obj using asset_item
                                // return updated asset_item >> this has to be an OBJECT !
                                assets_list = readFile(episodeFolder, 'asset');
                                // if it is an array process to transform to obj
                                if (obj instanceof Array)
                                    {
                                        if (obj[1].match(/re-use/gi))
                                            {
                                                obj = new reuse_BGAssetObj (obj[2],obj[0]);
                                            }
                                        else if (!obj[1].match(/re-use|undefined/gi))
                                            {
                                                bgasset_name = obj[0];
                                                if (bgasset_name in assets_list)
                                                    {
                                                        // get the obj from the list
                                                        obj = assets_list[bgasset_name];
                                                    };
                                            }
                                        else
                                            {
                                                log('err', [$.line, decodeURI(File($.fileName).name)], obj.toSource() + "\nis not a valid BG object !");
                                            };
                                    }
                                if (obj instanceof Object && obj.BGType != 're-use')  // new asset  and not BG reuse
                                    {
                                        if (call_shotgun == true)
                                            {
                                                // this part will ask shotgun if asset is uploaded or not
                                                // and if asset has task assigned
                                                // then change asset.status and asset.sg_id accordingly
                                                // first create temp file in local dir containing asset_obj
                                                tmp_path = "~/Documents/AdobeScripts/ExportTool/.temp";
                                                tmpFile = new File (tmp_path);
                                                tmpFile.open("w","TEXT","????");
                                                tmpFile.write (obj.toSource());
                                                tmpFile.close();
                                                // then call python script to check the asset
                                                ext_py_script = localize (py_scripts_path, "sg_checkAssetStatus.py");
                                                pythonScript = system.callSystem (python_path + ' \"' + ext_py_script + '\" -a \"' + tmp_path + '\"');
                                                result = eval(pythonScript);
                                                
                                                log('debug', [$.line, decodeURI(File($.fileName).name)], "Shotgun call result:\n"+ obj['name']  + "\n" + String(result));
                                                if (result[0] == obj['name'] && result[1] != 'undefined')
                                                    {
                                                        // asset found on shotgun
                                                        // if asset has tasks assigned, status = locked, else status = uploaded
                                                        // sg_id updated with id of corresponding asset
                                                        obj.status = result[1];
                                                        obj.sg_id = result[2];
                                                        return obj;
                                                    }
                                                else
                                                    {
                                                        // cannot find an asset on shotgun
                                                        return obj;
                                                    }
                                            }
                                        else
                                            {
                                                // keep obj as it is, and do not update asset.status
                                                return obj;
                                            }
                                    }
                                else if (obj instanceof Object && obj.BGType == 're-use')
                                    {
                                        // keep obj as it is, and do not update asset.status
                                        return obj;
                                    }
                                else
                                    {
                                        log('err', [$.line, decodeURI(File($.fileName).name)], (typeof obj) + "\nis not valid type of asset !\n["+obj+"]");
                                        return;
                                    };
                            }
                        function updateBGItem (Bttn, bg_asset)
                            {
                                    var bg_panel = Bttn.parent.parent;
                                    var asset_name_field = Bttn.parent.parent.children[0];
                                    var asset_BGtype_field = Bttn.parent.parent.children[1];
                                    var asset_queueStatus = Bttn.parent.children[2].value;
                                    var status_bar = Bttn.parent.parent.children[3];
                                    
                                // gassetToUpdate === object
                                var assets_list = readFile (episodeFolder, 'asset');
                                // open dialog to update the bg asset
                                // when done by user, kill old asset and reconnect to the new one
                                oldAsset = assets_list[asset_name_field.text];
                                parented_shots = oldAsset['parentShot'];
                                var updatedAsset = bgassettool (this, shotObj, episodeFolder, compItem, oldAsset);
                                if (updatedAsset != undefined)
                                    {
                                        /* UPDATE .asset FILE */
                                        // the asset has been updated by user, we can update the list files
                                        // remove old datas
                                        remAssetToFile(episodeFolder, oldAsset.name);
                                        // get sg_id of previous asset in case he was already uploaded
                                        updatedAsset['sg_id'] = oldAsset.sg_id;
                                        updatedAsset['status'] = "not exported";
                                        // now add new datas
                                        addAssetToFile (episodeFolder, updatedAsset);
                                        
                                        /* UPDATE .shot FILE(S) */
                                        for (var s=0; s < parented_shots.length; s++)
                                            {
                                                // build .shot file path
                                                var shot_appFolder = localize (LO_APPFolder_template, episodeFolder, parented_shots[s].substring(2));
                                                updateAssetInShotFile (decodeURI(shot_appFolder), updatedAsset, 'update', [true, oldAsset]);
                                            }
                                        
                                        // then update the BGAsset panel :
                                        asset_name_field.text = updatedAsset.name;
                                            asset_name_field.helpTip =  asset_obj.name;
                                            asset_name_field.alignment = ['fill','middle'];
                                        asset_BGtype_field.text = updatedAsset.id;
                                            asset_BGtype_field.alignment = ['right','middle'];
                                        // bttn bar update
                                        Bttn.parent.minimumSize = [90,40];
                                        Bttn.parent.alignment = ['right','middle'];
                                        Bttn.parent.alignChildren = ['right','middle'];
                                        Bttn.parent.children[2].value = true;
                                        colorizeUI (updatedAsset, status_bar);
                                        // and update BG asset panels for opened shots which re-use
                                        for (var x = 0; x < TabbedPanel.children.length; x++)
                                            {
                                                panel = TabbedPanel.children[x];
                                                panel_title = TabbedPanel.children[x].text;
                                                for (var s=0; s < oldAsset.parentShot.length; s++)
                                                    {
                                                        var shotName = oldAsset.parentShot[s];
                                                        var regEx = new RegExp(shotName + "(\\s\\[.*\\])?");
                                                         if (regEx.test(panel_title) && shotName != shotObj.name)
                                                            {
                                                                // the panel where there is a reuse
                                                                assets_grp = panel.children[1];
                                                                for (var l=0; l <  assets_grp.children.length; l++)
                                                                    {
                                                                        if (assets_grp.children[l].children[0].text == oldAsset.name && assets_grp.children[l].children[1].text == "re-use")
                                                                            {
                                                                                assets_grp.children[l].children[0].text = updatedAsset.name;
                                                                                assets_grp.layout.layout(true);
                                                                                break;
                                                                            }
                                                                    }
                                                            }
                                                    }
                                            }
                                        Bttn.parent.alignment = ['right','middle'];
                                        // update UI
                                        bg_panel.parent.layout.layout(true);
                                    }
                                else
                                    {
                                        // update has been cancelled by user
                                        return;
                                     }
                                 
                                       
                            }
                        
                        // buttons panels functions
                        function delete_BG_panel (ui_obj)
                            {                                
                                assets_grp_obj = ui_obj.parent;
                                assets_grp_obj.remove(ui_obj);
                                assets_grp_obj.parent.layout.layout(true);                                
                            }
                        function delete_BG_links (shotObj, assetObj)
                            {
                                // we only need the asset name for deletion !
                                log('info', [$.line, decodeURI(File($.fileName).name)], "Delete links :\n" + shotObj.shotCode + " >> " + assetObj.name + " removed of .shot list");
                                 // remove asset from shot.backgrounds list
                                updateAssetInShotFile (shotObj.appFolder, assetObj, 'del');
                                 if (assetObj.BGType != 're-use')
                                    {
                                        // remove asset into the .asset list (for everything apart of re-uses
                                        remAssetToFile (episodeFolder, assetObj.name);
                                        // if asset is a BG3Dmoving, we need to remove the "Check camera" task template on the shot entity (".shot" file)
                                        if (asset_obj.BGType.match(/BG3Dmoving/gi))
                                            {
                                               updateEntryInShotFile (shotObj.appFolder, undefined, 'task_template')
                                            }
                                    }
                                else
                                    {
                                        // it is a reuse of a bg of the episode
                                        // if we remove this re-use we have to update the "parentShot" list of the asset in ".asset" file
                                        var epi_assets = readFile (episodeFolder, 'asset');
                                        if (assetObj.name in epi_assets)
                                            {
                                                asset_to_update = epi_assets[assetObj.name];
                                                for (var s=0; s< asset_to_update['parentShot'].length; s++)
                                                    {
                                                        shot = asset_to_update['parentShot'][s];
                                                        if (shot == shotObj.name)
                                                            {
                                                                asset_to_update['parentShot'].splice(s,1);
                                                                break;
                                                            }
                                                    }
                                                addAssetToFile (episodeFolder, asset_to_update);
                                            }
                                    }
                            }
                        function delete_BG_files (shotObj, assetObj)
                            {
                                // delete the files in approved folder
                                // ask user first !!!
                                files_to_delete = [];
                                files_to_delete_list = [];
                                for (var f=0; f < assetObj['files'].length; f++)
                                    {
                                        if (assetObj['files'][f] instanceof Array)
                                            {
                                                // aepx file for BGAFX comp  >> never delete !!
                                            }
                                        else
                                            {
                                                file_to_test = new File (assetObj['files'][f]);
                                                if (file_to_test.exists)
                                                    {
                                                        if (file_to_test.parent.fsName == shotObj.appFolder)
                                                            {
                                                                files_to_delete.push(file_to_test);
                                                                files_to_delete_list.push(file_to_test.name);
                                                            }
                                                    }
                                                else
                                                    {
                                                        
                                                        log('err', [$.line, decodeURI(File($.fileName).name)], file_to_test.fsName + " is not a valid file.\n Can\'t delete it !");
                                                    }
                                                if (files_to_delete.length > 0)
                                                    {
                                                        info_text = "%1 has already been exported !\nDo you want to delete following files stored in approved folder?\n\n%2";
                                                        ask_user = confirm (localize(info_text, assetObj.name, files_to_delete_list.join("\n")));
                                                        if (ask_user == true)
                                                            {
                                                                // user want to delete the files in approved folder
                                                                for (file in files_to_delete)
                                                                    {
                                                                        log('info', [$.line, decodeURI(File($.fileName).name)], files_to_delete[file].fsName);
                                                                        deletion = files_to_delete[file].remove();
                                                                        if (deletion == false) 
                                                                            {
                                                                                log('err', [$.line, decodeURI(File($.fileName).name)], localize("Cannot remove \"%1\" from\n%2", files_to_delete[file].name,shotObj.appFolder));
                                                                            }
                                                                        else
                                                                            {
                                                                                 log('info', [$.line, decodeURI(File($.fileName).name)], "... deleted");
                                                                            }
                                                            }
                                                            }
                                                        else
                                                            {
                                                                return;
                                                            };
                                                    }
                                            }
                                    }
                            }
                        function delete_BG_onShotgun (shotObj, assetObj)
                            {
                                // delete the asset on Shotgun
                                // ask user first !!!
                                ask = "This will delete the asset %1 [%2] on Shotgun !\nDo you want to continue ?";
                                ask_user = confirm (localize(ask, assetObj.name, assetObj.sg_id))
                                if (ask_user == true)
                                    {
                                        // we check again the status of bg_asset on Shotgun to avoid any issue !
                                        assetObj = check_assetItem (assetObj, true);
                                        if (!assetObj.status.match(/locked|undefined/))
                                            {
                                                // deleteasset on shotgun
                                                arg = assetObj.sg_id;
                                                ScriptPath = localize(py_scripts_path, "sg_deleteAsset.py");
                                                pythonScript = system.callSystem (python_path + ' \"' + ScriptPath + '\" -a \"' + arg + '\"');
                                                result = eval(pythonScript);
                                                err = "Error while deleting %1 [%2] from Shotgun...\n\n%3";
                                                if (result != true)
                                                    {
                                                        log('err', [$.line, decodeURI(File($.fileName).name)], localize(err,assetObj.name,assetObj.sg_id,pythonScript));
                                                   }
                                                else 
                                                    {
                                                        log('info', [$.line, decodeURI(File($.fileName).name)],localize("%1 [%2] deleted from Shotgun\n%3",assetObj.name,assetObj.sg_id, result));
                                                        // remove "Check camera" task template if it is a BG3Dmoving
                                                        if (asset_obj.BGType.match(/BG3Dmoving/gi))
                                                            {
                                                                arg = Folder (shotObj.appFolder + "/.shot");
                                                                ScriptPath = localize(py_scripts_path, "sg_deleteShotTaskTemplate.py");
                                                                pythonScript = system.callSystem (python_path + ' \"' + ScriptPath + '\" -s \"' + arg.fsName + '\"');
                                                                result = eval(pythonScript);
                                                                switch(result) {
                                                                    case 0:
                                                                        // no error
                                                                        log('info', [$.line, decodeURI(File($.fileName).name)], localize("Task template \"Check camera\" deleted on shot entity %1", shotObj.code));
                                                                        break;
                                                                    case 1:
                                                                        // shotgun error
                                                                        log('err', [$.line, decodeURI(File($.fileName).name)], "Error occured while deleting task template \"Check camera\" on shot entity !\n\nCheck log file and ask IT or supervisor!");
                                                                        break;
                                                                    case 2:
                                                                        // no shot entity found
                                                                        log('err', [$.line, decodeURI(File($.fileName).name)], "Error occured while deleting task template \"Check camera\" on shot entity :\nmore than one task \"Animate 3D cam\" found for this shot !\n\nCheck log file and ask IT or supervisor!");
                                                                        break;
                                                                    case 3:
                                                                        // undefined error
                                                                        log('err', [$.line, decodeURI(File($.fileName).name)], "Error occured while deleting task template \"Check camera\" on shot entity :\ntask not found for this shot !\n\nCheck log file and ask IT or supervisor!");
                                                                        break;
                                                                    case 4:
                                                                        // undefined error
                                                                        log('err', [$.line, decodeURI(File($.fileName).name)], "Error occured while deleting task template \"Check camera\" on shot entity :\nshot entity not found on shotgun!\n\nCheck log file and ask IT or supervisor!");
                                                                        break;
                                                                    default:
                                                                        return;
                                                                }
                                                        }
                                                    }
                                            }
                                        else if (assetObj.status.match(/locked/))
                                            {
                                                err = "This asset %1 [%2] as task(s) assigned on Shotgun or do not exists !\nCannot delete it !";
                                                log('err', [$.line, decodeURI(File($.fileName).name)], localize(err,assetObj.name,assetObj.sg_id));
                                                return;
                                            }
                                        else
                                            {
                                                err = "This asset %1 [%2] as task(s) assigned on Shotgun or do not exists !\nCannot delete it !";
                                                log('err', [$.line, decodeURI(File($.fileName).name)], localize(err, assetObj.name, assetObj.sg_id));
                                                return;
                                            }
                                        
                                    }
                                else return;
                            }
                        function delete_BG_asset (obj)
                            {
                                // obj is the button
                                // get asset using name
                                bg_panel = obj.parent.parent;
                                asset_name = obj.parent.parent.children[0].text;
                                asset_id = obj.parent.parent.children[1].text;
                                asset_status = obj.parent.parent.status;
                                
                                if ( asset_status.match(/re-use/))
                                    {
                                         // remove BG_panel
                                        delete_BG_panel (bg_panel);
                                        // remove links in list files
                                        delete_BG_links (shotObj, asset_obj); // to be done at the end !!
                                    }
                                else if (asset_status.match(/^not exported/))
                                    {
                                        // get latest asset_obj params
                                        var assets_list = readFile (episodeFolder, 'asset');
                                        var asset_object = assets_list[asset_name];
                                        if (asset_object['parentShot'].length == 1)
                                            {
                                                // remove BG_panel
                                                delete_BG_panel (bg_panel);
                                                // remove links in list files
                                                delete_BG_links (shotObj, asset_object); // to be done at the end !!
                                            }
                                        else
                                            {
                                                log('err', [$.line, decodeURI(File($.fileName).name)],"You do not have permission to delete this BG asset. The asset is re-used in following shots:\n" + asset_obj['parentShot'].join("\n"));
                                            }
                                    }
                                else if (asset_status.match(/^exported/))
                                    {
                                        var assets_list = readFile (episodeFolder, 'asset');
                                        var asset_object = assets_list[asset_name];
                                        if (asset_object['parentShot'].length == 1)
                                            {
                                                // remove BG_panel
                                                delete_BG_panel (bg_panel);
                                                // tremove existing files
                                                delete_BG_files (shotObj, asset_object);
                                                // remove links in list files
                                                delete_BG_links (shotObj, asset_object); // to be done at the end !!
                                            }
                                        else
                                            {
                                                log('err', [$.line, decodeURI(File($.fileName).name)],"You do not have permission to delete this BG asset. The asset is re-used in following shots:\n" + asset_obj['parentShot'].join("\n"));
                                            }
                                    }
                                else if (asset_status.match(/^uploaded/))
                                    {
                                        var assets_list = readFile (episodeFolder, 'asset');
                                        var asset_object = assets_list[asset_name];
                                        if (asset_object['parentShot'].length == 1)
                                            {
                                                // remove BG_panel
                                                delete_BG_panel (bg_panel);
                                                // tremove existing files
                                                delete_BG_files (shotObj, asset_object);
                                                // remove links in list files
                                                delete_BG_links (shotObj, asset_object); // to be done at the end !!
                                                // remove links in list files
                                               delete_BG_onShotgun (shotObj, asset_object); // to be done at the end !!
                                            }
                                        else
                                            {
                                                log('err', [$.line, decodeURI(File($.fileName).name)],"You do not have permission to delete this BG asset. The asset is re-used in following shots:\n" + asset_obj['parentShot'].join("\n"));
                                            }
                                    }
                            }
                       function open_sg_page (assetObj)
                            {
                                // function to open page of asset on shotgun
                                asset_url = localize (url_asset_page, assetObj.sg_id);
                                pythonScript = system.callSystem ("explorer " + asset_url);
                            }
                        // UI FUNCTIONS //
                        // shared objects
                        function add_delBttn (obj, text)
                            {
                                bttn = obj.add("button", undefined, "X");
                                //bttn = obj.add("image {helpTip:\"Remove asset\", image: \""+(icons_folder+"delete_asset.png")+"\"}");
                                    bttn.preferredSize = [20,20];
                                    bttn.helpTip = text;
                               // give onClick
                               bttn.onClick = function () { delete_BG_asset (this); };
                               return bttn;
                            }
                        function add_updateBttn (obj, bg_asset)
                            {
                                bttn = obj.add("button", undefined, "^");
                                    bttn.preferredSize = [20,20];
                                    bttn.helpTip = "Open BG Creation Tool to update this asset";
                                bttn.onClick = function () 
                                    {
                                        updateBGItem (this,  bg_asset);
                                    }
                                
                                return bttn;
                            }
                        function add_exportBttn (obj, text, bg_asset)
                            {
                                bttn = obj.add("checkbox", undefined, '');
                                    //bttn.text = text;
                                    bttn.size = [20,20];
                                    bttn.helpTip = text;
                                    
                                bttn.onClick = function ()
                                    {
                                        updateAssetInShotFile (shotObj.appFolder, bg_asset, 'add', this.value);
                                    }
                                if (bg_asset['status'] == "uploaded")   
                                    {
                                        bttn.value = true;
                                        bttn.notify();
                                    }
                                else if (bg_asset['status'] == "not exported")
                                    {
                                        bttn.value = false;
                                        bttn.notify();
                                    }
                                else if (bg_asset['status'] == "exported")
                                    {
                                        bttn.value = false;
                                        bttn.notify();
                                    }
                                else;
                                
                                return bttn;
                            }
                        function colorizeUI (asset_obj, obj)
                            {
                                if (ui_use_colors == true)
                                    {
                                        status_color = status_params[asset_obj.status].ui_color;
                                        //alert(status_color);
                                        g = obj.graphics;
                                        myBrush = g.newBrush(g.BrushType.SOLID_COLOR, status_color);
                                        g.backgroundColor = myBrush;
                                    }
                            }
                        function colorizeText (asset_obj, obj)
                            {
                                if (ui_use_colors == true)
                                    {
                                        status_color = status_params[asset_obj.status].ui_color;
                                        //alert(status_color);
                                        g = obj.graphics;
                                        myBrush = g.newPen(g.PenType.SOLID_COLOR, status_color,4);
                                        g.foregroundColor = myBrush;
                                    }
                            }
                        // MAIN SCRIPT
                        // get Object for current asset with latest status !
                        check_result = check_assetItem (bg_asset, check_asset_status_onLoad);                                  
                        log('debug', [$.line, decodeURI(File($.fileName).name)], 'BG asset : ' + check_result.toSource());
                        // update asset in .asset list (if not re-use)
                        if (check_result instanceof Object)
                            {
                                var asset_obj = check_result;
                                if (asset_obj.BGType != 're-use') addAssetToFile (episodeFolder, asset_obj);
                                if (asset_obj.BGType.match(/BG3Dmoving/gi))
                                    {
                                       updateEntryInShotFile (shotObj.appFolder, "Check camera", 'task_template')
                                    }
                            }
                        else
                            {
                                log('err', [$.line, decodeURI(File($.fileName).name)], localize(err,bg_asset.name,check_result));
                                return;
                            }
                        
                        //BUILD UI
                        // define BG_asset_panel environnement
                        var compPanel = obj.parent;
                        bg_assets_grp = obj; // compPanel.children[1];
                            bg_assets_grp.alignment = ['fill','fill'];
                        //MACheck = compPanel.grp.children[0].children[3];
                        // check if no duplicates of bg panel in the ui and delete them
                        for (var p=0; p < bg_assets_grp.children.length; p++)
                            {
                                if (bg_assets_grp.children[p].children[0].text == asset_obj.name && bg_assets_grp.children[p].children[1].text == asset_obj.BGType)
                                    {
                                       log('info', [$.line, decodeURI(File($.fileName).name)], "there is a panel with corresponding asset !\n"+  asset_obj.name);
                                       delete_BG_panel (bg_assets_grp.children[p]);
                                    }
                            }
                        // create the panel for this asset and common objects [name and bgtype]
                        if (showAssetStatus_inPanelName == true) pname = "BG Asset ["+asset_obj.status+"]";
                        else pname = "BG Asset ";
                        bg_panel = bg_assets_grp.add("panel", undefined, pname, {'borderStyle':"raised"});
                            bg_panel.id = "BG";
                            bg_panel.status = asset_obj.status;
                            bg_panel.orientation = "row";
                            bg_panel.alignment = ['fill','top'];
                            bg_panel.borderStyle = "sunken";
                        newAssetItem = bg_panel.add("statictext", undefined, asset_obj.name);
                            newAssetItem.alignment = ['fill','middle'];
                            newAssetItem.helpTip =  asset_obj.name;
                        var the_text = null;
                        if (show_asset_BGType == 1)
                            {
                                the_text = asset_obj.id;
                            }
                        else
                            {
                                the_text = asset_obj.BGType;
                            }
                        newAssetType = bg_panel.add("statictext", undefined, the_text);
                            newAssetType.alignment = ['right','middle'];
                        bttn_grp =  bg_panel.add("group", undefined);
                            bttn_grp.minimumSize = [90,40];
                            bttn_grp.alignment = ['right','middle'];
                            bttn_grp.alignChildren = ['right','middle'];
                        colorGrp = bg_panel.add("group", undefined);
                            colorGrp.preferredSize = [8,20];
                            colorizeUI (asset_obj, colorGrp);
                        // UI configure based on asset export status
                        // based on the status of asset_obj, build bg_asset UI
                        if (asset_obj.status.match(/re-use/))
                            {                                
                                deleteBttn = add_delBttn (bttn_grp, "Unlink this asset and the shot");
                            }
                        else if (asset_obj.status.match(/^not exported/))
                            {
                                var deleteBttn = add_delBttn (bttn_grp, "Delete this asset");
                                add_updateBttn (bttn_grp, asset_obj);
                                exbttn = add_exportBttn (bttn_grp, "Add asset to exporting list", asset_obj);
                            }
                        else if (asset_obj.status.match(/^exported/))
                            {
                                var deleteBttn = add_delBttn (bttn_grp, "Unlink this asset and remove all exported files");
                                add_updateBttn (bttn_grp, asset_obj);
                                add_exportBttn (bttn_grp, "Add asset to exporting list", asset_obj);
                            }
                        else if (asset_obj.status.match(/uploaded/))
                            {
                                colorGrp.onClick = function () {
                                        // function to open page of asset on shotgun
                                        open_sg_page (asset_obj);
                                    };
                                var deleteBttn =add_delBttn (bttn_grp, "Unlink this asset, remove all exported files, and delete asset on Shotgun");
                                add_updateBttn (bttn_grp, asset_obj);
                                add_exportBttn (bttn_grp, "Add asset to exporting list", asset_obj);
                            }
                        else if (asset_obj.status.match(/locked/))
                            {
                                bg_panel.enabled = status_params[asset_obj.status].ui_enabled;
                                infoText = bttn_grp.add("staticText", undefined);
                                    infoText.text = "Scheduled for BG";
                                    infoText.alignment = ['center','middle'];
                                colorGrp.onClick = function () {
                                        // function to open page of asset on shotgun
                                        asset_url = localize (url_asset_page, asset_obj.sg_id);
                                        pythonScript = system.callSystem ("explorer " + asset_url);
                                    };
                            }
                        
                        // update the ui
                        compPanel.minimumSize.height = compPanel.children[0].size.height + 50;
                        TabbedPanel.minimumSize = [compPanel.size.width,  compPanel.minimumSize.height + 50];
                        compPanel.parent.parent.layout.layout(true); 
						try
						{  
							// check if we need a maya file for this BG
							if (asset_obj.id.match(/3D|camera|render/gi))
							{
								if (compPanel.MACheck.value == false)
								{ 
									alert(asset_obj.name + " has 3D render task. Please provide a maya file");
									compPanel.MACheck.notify();
								}
							}
						}
						catch (err)
						{
							log('err', [$.line, decodeURI(File($.fileName).name)], err.message);
						}
                                  
                        // return the new panel when complete                
                        return bg_panel;
                    }
                function build_maya_file_panel (ui, obj, fileObj, appFolder)
				{
					try {
						// obj is the checkbox
						// ui is the grp for assets listing in CompPanel
						// fileObj is a file obj passed if shot already exported. it is undefined if it is a new export and it will be filled up later
						shotObj = readFile (decodeURI(appFolder), 'shot');
						if (fileObj instanceof Array)
						{
							fileObj = fileObj[0];
						}
						// FUNCTION
						function colorizeUI (file, obj, shotObj)
						{
							if (ui_use_colors == true)
							{
								status_color = undefined;
								fileName = file.name;
								filePath = file.parent.fsName;
								cleanName = localize(appFileName_template, shotObj['episodeCode'].replace("_", ''), shotObj['name'], "MA."+ fileName.split('.')[1]);
								if (decodeURI(filePath) == decodeURI(shotObj['appFolder']) && fileName == cleanName) 
								{
									// is is a perfect match with supposed exported maya file
									// the maya file is stored into the shot's appFolder :: it has been exported already
									status_color = status_params['uploaded'].ui_color;
								}
								else
								{
									status_color = status_params['not exported'].ui_color;
								}
								// build the brush
								g = obj.graphics;
								myBrush = g.newBrush(g.BrushType.SOLID_COLOR, status_color);
								g.backgroundColor = myBrush;
								obj.layout.layout(true);
							}
						}
						function getFiles (type, prefFolder)
						{
							sourcesFolder = new Folder (prefFolder);
							selectedFile = undefined;
							selectedFile = sourcesFolder.openDlg("Select maya file for 3D Anim", type, false);
							if (!selectedFile)
							{
								return undefined;
							}
							else if (!selectedFile.name.match('\.(ma|mb)$'))
							{
								alert('The selected file is not of type \".ma\" or \".mb\"\nPlease select new file !');
								getFiles (type, prefFolder);
							}
							else
							{
								uploadedFile = new File (selectedFile);
								return uploadedFile;
							}
						}
						
						if (obj.value == true)
						{
							// J Hearn - this will always be the folder
							prefFolder = new Folder(decodeURI(projectPath.parent) + "/3D");
							// first we make some checks to see if there is already a file to show or not
							if (!fileObj)
							{
								// 3D anim file is clicked and wanted
								// ask user to load a maya file
								if (prefFolder.exists) { maFile = getFiles ("*.ma,*.mb" , prefFolder); }
								else { maFile = getFiles ("*.ma,*.mb" , projectPath); };
							}
							else if (!fileObj.exists)
							{
								alert (fileObj.fsName + "\ncannot be found.\nPlease re-connect file !!");
								// J Hearn - commenting the following out as one folder is always pointed to
								// prefFolder = new Folder (fileObj.parent.fsName);
								// 3D anim file is clicked and wanted
								// ask user to load a maya file
								if (prefFolder.exists) { maFile = getFiles ("*.ma,*.mb" , prefFolder); }
								else { maFile = getFiles ("*.ma,*.mb" , projectPath); };
							}
							else
							{
								maFile = new File (fileObj);
							}
							// then process
							// if maFile is not a File Object it means the action has been cancelled by user
							if (maFile instanceof File)
							{
								// BUILD THE MAYA PANEL
								MAExportPanel = ui.add("panel", undefined, "MAExportPanel");
									MAExportPanel.id = "Maya";
									MAExportPanel.text = "3D Maya File to export";
									MAExportPanel.orientation= "row";
									MAExportPanel.alignment = ['fill','top'];
								MAPath = MAExportPanel.add("statictext", undefined, "undefined");
									MAPath.text = maFile.name;
									MAPath.alignment = ['fill','middle'];
								MALoad = MAExportPanel.add("button", undefined, "Load .ma file" );
									MALoad.preferredSize = [90,25];
									MALoad.alignment = ['right','middle'];
							   
								colorGrp = MAExportPanel.add("group", undefined);
									colorGrp.preferredSize = [8,20];
									colorizeUI (maFile, colorGrp, shotObj);
									
								// ACTIONS
								MALoad.onClick = function ()
								{
									// J Hearn - always go to the wip folder
									//prefFolder = maFile.parent;
									if (prefFolder.exists) { maFile = getFiles ("*.ma,*.mb" , prefFolder); }
									else { maFile = getFiles ("*.ma,*.mb" , projectPath); };
									
									if (maFile instanceof File)
									{
										MAPath.text = maFile.name;
										colorizeUI (maFile, colorGrp, shotObj);
										updateEntryInShotFile (shotObj.appFolder, maFile, 'add'); 
									}
								};
								
								// J Hearn - ensuring the onclick call has the correct maFile value when it happens
								colorGrp.onClick = (function(maf)
								{
									return function ()
									{     
										appDir = maf.parent;
										appDir.execute();
									}
								})(maFile);
								
								// update shot file with new maya file
								updateEntryInShotFile (shotObj['appFolder'], maFile, 'add');
							}
							else
							{
								obj.notify();
							}
						}
						else
						{
							/// WE DELETE THE EXISTING MAYA FILE
							var assetsList = readFile (episodeFolder, 'asset');
							var mayaFile = shotObj.maFile;
							var BGassetsList = shotObj.background_asset;
							var targetBG = undefined;
							// first check if there are no BG asset using maya file !
							var deleteAuth = true; // by default we are ok to delete maya object
							if (BGassetsList.length > 0 )
							{
								for (var e=0; e < BGassetsList.length; e++)
								{
									// we use the if of asset object to check if this asset need maya file
									if (BGassetsList[e][1].match(/3D|camera/gi))
									{
										deleteAuth = false;
										targetBG = BGassetsList[e][0];
									}
								}
							}
							else deleteAuth = true;
							if (deleteAuth == true)
							{
								updateEntryInShotFile (shotObj['appFolder'], undefined, 'remove');
								for (e=ui.children.length-1; e >= 0; e--)
								{
									if (ui.children[e].id == "Maya")  ui.remove(e);
								}
							}
							else
							{
								alert(targetBG + '\nneed 3D render task !\n\n You can\'t remove the maya file from the list.');
								obj.value = true;
							}
						}
						
						compPanel = ui.parent;
						TabbedPanel = compPanel.parent;
						// re-scale the compPanel to show all the assets
						//compPanel.minimumSize.height = ui.size.height + compPanel.children[0].size.height;
						TabbedPanel.minimumSize = [compPanel.size.width,  compPanel.minimumSize.height + 50];
						// update the ui
						TabbedPanel.parent.layout.layout(true);
					}
					catch(err) { log('err', [$.line, decodeURI(File($.fileName).name)], err.message);}
				}
                //--- script ---//
                // define appFolder for the shot
                var shotNum = compItem.name;
                var appFolder_path = localize (LO_APPFolder_template, episodeFolder, shotNum);
                var appFolder = new Folder (appFolder_path);
                // get shot export status
                shot_status = check_shotItem (appFolder);
                log('debug', [$.line, decodeURI(File($.fileName).name)], "shot status:" + shot_status);
                // go for panel creation
                if (String(shot_status) == "new")
				{
					// shot never exported before //
					// create a shot obj and save it in ".shot" file in approved folder
					var shotObj = new shotObj_template ();
						shotObj.name = "Sc" + shotNum;
						shotObj.shotCode = localize(shotObj.shotCode, episodeName, shotNum);
						shotObj.episodeCode = localize(shotObj.episodeCode, episodeNum, episodeName);
						shotObj.appFolder = appFolder.fsName;
					// create .shot file
					createShotToFile (shotObj.appFolder, shotObj);
					// create a new export panel for this shot
					build_newShotPanel (shotObj, compItem, shotObj.status);
					// end > go to next shot
				}
                else if (shot_status.match(/not exported|uploaded|exported/))
				{
					// shot already exported
					// get the shot object stored in the file ".shot"
					var shotObj = readFile (decodeURI(appFolder), 'shot');
					// build the panel and build variables to update it
					shotPanel = build_newShotPanel (shotObj, compItem, shot_status);
						//ma_check = shotPanel.children[0].children[0].children[3];
						//appFolder_icon = shotPanel.children[0].children[1].children[1];
						//assets_panel = shotPanel.children[1];
					// UPDATE UI 
					try
					{
						// first check if MA file linked to shot
						if (shotObj.maFile instanceof Array)
						{
							if (shotObj.maFile.length == 2)
							{
								maFile = new File (shotObj["maFile"][0]);
								shotPanel.MACheck.value = true;
								build_maya_file_panel (shotPanel.assets_grp, shotPanel.MACheck, maFile, shotObj["appFolder"]);
							}
							else 
							{
								log('debug', [$.line, decodeURI(File($.fileName).name)], String(shotObj.maFile) + "\n" + "is not an array!");
								updateEntryInShotFile (decodeURI(appFolder), undefined, 'del');
							}
						}
						// then take care of BG files
						if (shotObj.background_asset instanceof Array)
						{
							for (var i=0; i < shotObj.background_asset.length; i++)
							{
								bg_asset = shotObj.background_asset[i];
								build_bg_asset_panel (shotPanel.assets_grp, bg_asset, shotObj);
							}
						}
						// update appFolder_icon according to files already exported into appFolder
						if (shotPanel.appFolder_bttn_obj)
						{
							getExportedFiles (shotPanel.appFolder_bttn_obj, shotObj);
						}
					}
					catch(err) {   log('err', [$.line, decodeURI(File($.fileName).name)],  shotObj.name + "\n" + err.message); }
				}
                else
                    {
                        log('err', [$.line, decodeURI(File($.fileName).name)],  shotObj.name + "\n" + shot_status + "\nis not a valid status for shot !");
                        return;
                    }
            }

        //---- MAIN ---//
        myPanel = exportToolUI_builder (thisObj);
        if (myPanel != null)
            {
                
                myPanel.onClose = endScript;
                
                /* VARIABLES */
                AddShotsList = myPanel.children[0].children[0].children[0];
                EmptyBttn = myPanel.children[0].children[0].children[1];
                HelpButton = myPanel.children[0].children[0].children[2];
                
                TabbedPanel = myPanel.children[1];
                ExportBttn = myPanel.children[2];
                debugBttn = myPanel.children[3];
				
				// J Hearn - get list of users and depts from shotgun
				usersAndDepts = getUsersAndDepts();
                
                /* ACTIONS */
                AddShotsList.onClick = function ()
                    {
                        // rebuild projectPath and glob vars
                        projectPath = app.project.file;
                        shotsToExport_list = undefined;
                        try
                            { 
                                 /*
                                                        use project file name to build global vars :
                                                        > episodeFolder
                                                        > episodeName
                                                        > episodeNum
                                                        > appFolder_path
                                                        > appFolder (Folder object)
                                                    */
								if (projectPath != null)
								{
									episodeRegEx = /(GB[0-9]{3})(_)?([a-zA-Z]*)/.exec(projectPath.fsName); 
									if (episodeRegEx != null)
									{
										episodeGuessed = episodeRegEx[1] + "_" + episodeRegEx[3];
										episodeFolder = getEpisodeFolders(episodeGuessed);
										episodeName = episodeRegEx[3].toUpperCase().replace(/^THE/gi, "");
										episodeNum = episodeRegEx[1];
									}
									else
									{
										log('err', [$.line, decodeURI(File($.fileName).name)], "Your current scene file is " + projectPath.name + ", which is not a valid file name.\nCannot export shots !");
										return;
									}
								}
								else
								{
									log('err', [$.line, decodeURI(File($.fileName).name)], "You must have a scene file open!");
									return;
								}
                            }
                        catch (err)
                            {
                                log('err', [$.line, decodeURI(File($.fileName).name)], err.message);
                                return;
                            }
                        // get a list of the shots to export (user defined)
                        shotsToExport_list = ShotsToExport_ListBuilder();
                        // for compItem in shotsList, build shot panel
                        if (shotsToExport_list)
                            {
                                log('info', [$.line, decodeURI(File($.fileName).name)], shotsToExport_list.length + ' shots to export');
                                for (obj in shotsToExport_list)
                                    {
                                        log('debug', [$.line, decodeURI(File($.fileName).name)], localize("Creation of panel for Sc%1", shotsToExport_list[obj].name));
                                        try 
										{
                                            shotPanel_builder(shotsToExport_list[obj]);
										}
                                        catch(err) { log('err', [$.line, decodeURI(File($.fileName).name)], err.message); };
                                    }
                            }
                        return;
						
                    }
                EmptyBttn.onClick = function()
                    {
                        if (TabbedPanel.children.length > 0)
                            {
                                do 
                                    {
                                        myPanel.grp.remove(TabbedPanel.children.length-1);
                                        myPanel.grp.layout.layout(true);
                                    }
                                while (TabbedPanel.children.length > 0);
                            }
                    }; 
                ExportBttn.onClick = function ()
				{
					var ask = confirm('Would you like to do an incremental save, before exporting?')
					if (ask == true)
						IncrementalSave.onClick();
					/*new try >>>
						- send a list of all compItem to external script
						- this script will process this way based on this list:
							# build a temp file [A] containing dictionnary of all shotObj
							# build a temp file [B] containing dictionnary of all assetObj using shotObj['backgrounds_asset']
									- re-uses are not retrieved
									- locked are not retrieved
							# copy all BG files :
									- build a list of all BG files to copy
									- use supercopier to copy or python
									- update all the path in the file [B]
							# export maya files :
									- build a list of files to copy using shotObj['maFile'] of each obj of list [A]
									- use supercopier or python to copy
									- for all shotObj['maFile'] == undefined, remove maya file in the approved folder if exists
							# export all framing :
									- build renderQueue using shotObj['exportFraming'] of each obj of list [A]
									- save temp AFX project in local
									- batch render
							# export QT :
									- build a list of files to copy using shotObj['exportQT'] of each obj of list [A]
									- use supercopier or python to copy
							# export AE :
									- build a list of project to export using shotObj['exportAE'] of each obj of list [A]
									- run script for AFX export for each item of the list
							# send bg assets to shotgun using file[B]
									- make sure the status of BG asset is updated to "uploaded"
							# send shots to shotgun using file [A]
									- make sure the status of the shotObj is updated to "uploaded"
					*/
					// script
					try
					{
						var rushesFolder = Folder (localize (LO_RUSHESFolder_template, episodeFolder));
						var assets_list_path = new File (localize(EPI_processingFolder, episodeFolder, 'asset'));
						var compToExport = {"path":app.project.file.fsName,'rushesFolder':rushesFolder.fsName, 'assets_list_path':assets_list_path.fsName};
						compToExport.shots = [];
						for (var c = 0; c < TabbedPanel.children.length; c++)
						{
							//shot_export (TabbedPanel.children[c], episodeFolder); // old export script
							// we pass the shotPanel obj
							// the object has some infos we will use :
							//       > shotPanel.comp == compItem
							//       > shotPanel.appFolder == shot's approved folder !
							shotObj = readFile(TabbedPanel.children[c].appFolder, 'shot');
							shotName = shotObj.name.substring(2);
							compId = TabbedPanel.children[c].comp.id;
							app_dir = Folder(TabbedPanel.children[c].appFolder).fsName;
							final_aep = localize(appFileName_template, shotObj.episodeCode.replace('_', ''), shotObj.name, "AE.aepx");
							compToExport.shots.push({'shot_infos':[shotName, compId, app_dir, final_aep]});
						}
						// clear export folder
						temp_dir = new Folder ( exportTask_temp_dir );
						temp_dir.create ();
						// create the .inf file for export
						command = compToExport.toSource();
						var exportFile = new File ("~/Documents/AdobeScripts/ExportTool/export_task/export.inf");
						exportFile.open("w","TEXT","????");
						exportFile.write (command);
						exportFile.close();
						// save actual project in export dir, as .aepx
						main_project_file = app.project.file;
						temp_aep_forExport = new File ("~/Documents/AdobeScripts/ExportTool/export_task/export_temp.aepx");
						// clean renderQueue
						if (app.project.renderQueue.numItems != 0)
						{
							while (app.project.renderQueue.numItems  != 0)
							{
								app.project.renderQueue.item(app.project.renderQueue.numItems).remove();
							};
						};
						app.project.save(temp_aep_forExport);
						app.open(main_project_file);
						// launch python script for export
						ScriptPath = localize(py_scripts_path, "export_task_vCC2014.py");
						batFile = new File ("~/Documents/AdobeScripts/ExportTool/export_task/export_task.bat");
						batFile.open("w","TEXT","????");
						batFile.write ("@ECHO OFF\n");
						batFile.write (python_path + ' \"' + ScriptPath + '\"\n');
						batFile.write ("pause");
						batFile.close();
						test = batFile.execute();

						//myPanel.close();
						return;
					}
					catch(err)
					{
						log('err', [$.line, decodeURI(File($.fileName).name)], err.message);
						return;
					}
				};
                debugBttn.onClick = function () 
                    {
                        $.gc();
                        myPanel.close();
                        loadScript ($.fileName);
                     };
                 HelpButton.onClick = function () 
                    {
                        helpFile = new File (File($.fileName).parent.fsName + "/_docs/help.pdf");
                        helpFile.execute();
                     };
                
                /* PANEL CREATION */
                if (myPanel instanceof Window)
                    {
                        myPanel.frameLocation = [10,10];
                        myPanel.show();
                    }
                else
                    {
                        myPanel.layout.layout(true);
                    }
            }
    }
        CleaningNotBoring (this);
    }
catch(err) { alert(err.line + "\n" + err.message + "\n" + decodeURI($.fileName)); };