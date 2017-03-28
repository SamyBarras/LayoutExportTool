// includes for extrenal scripts
#includepath "../templates/;../../custom_options/;"
 // CUSTOM OPTIONS FILES
#include "project_custom_options.jsx"
// include glob vars
#include "glob_vars.jsx"

function newErr (numErr,obj)
    {
        err_code = Number(String (numErr) + String (obj));
        //app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        //app.open(main_project_file);
        return err_code;
    }
function lookUpArr (arr,value)
    {
        for(var i=0; i < arr.length; i++)
        {
            if(arr[i] === value){ return true; }
        }
        return false;
    }
function collectFiles ()
    {
        alert(10);
        var main_project_file = app.project.file;
        var exportTask_temp_dir = new Folder("~/Documents/AdobeScripts/ExportTool/export_task");
        var collect_files_datas_dir = new Folder("~/Documents/AdobeScripts/ExportTool/export_task/collect_files_datas/");
        collect_files_datas_dir.create ();
        var export_infos_file = new File (decodeURI(exportTask_temp_dir) + "/export.inf");
        // open aep main project
        var temp_aep = new File (decodeURI(exportTask_temp_dir) +"/" + "export_temp.aepx");
        app.open(temp_aep);
        var temp_project_file = app.project.file;
        // get infos from "export.inf"
        var export_infos_datas = $.evalFile(export_infos_file);
        /*EXPORT AE PROJECTS*/
        alert(11);
        if (export_infos_datas['shots'].length >0)
            {
                for (obj in export_infos_datas['shots'])
                    {
                        var shot_datas = export_infos_datas['shots'][obj];
                        if (shot_datas == undefined) { app.exitCode = newErr (55, obj); break;};
                        var shot_num = shot_datas['shot_infos'][0];
                        var comp_id = shot_datas['shot_infos'][1];
                        var appFolder = shot_datas['shot_infos'][2];
                        alert(12);
                        var app_file_name = shot_datas['shot_infos'][3];
                        
                        var compItem = undefined;
                        for (var e=1; e <= app.project.numItems; e++)
                            {
                                if (app.project.item(e) instanceof CompItem && app.project.item(e).id == comp_id && app.project.item(e).name == shot_num)
                                    {
                                        //it is the comp we are looking for
                                        compItem = app.project.item(e);
                                    }
                            }
                        if (compItem == undefined) {  app.exitCode =  newErr (65, obj); break;};
                        
                        export_ae = lookUpArr (export_infos_datas['toExport_ae'], shot_num);// export ae projects
                        if (export_ae == true)
                            {  
								alert(0);
                                // reduce project using compItem
                                app.project.reduceProject(compItem);
                                 // build final aepx name and file
                                 var project_name = app_file_name;
                                 if (!project_name.match(/^GB[0-9]{3}[a-z]*_Sc[0-9]{3}[a-z]?_LO_AE.aepx$/gi))
                                    {
                                        app.exitCode = newErr (12, obj);
                                        break;
                                    }
                                var targetFolder = new Folder (appFolder + "/AE/");
                                if (!targetFolder.exists) targetFolder.create();
                                var AEPX_project_file = new File (decodeURI(targetFolder) + "/" + project_name);
                                // save file
                                if (!AEPX_project_file.exists) { app.project.save(AEPX_project_file);  }
                                else 
                                    {
                                        if (overwrite_app_existing_files  == true) { app.project.save(AEPX_project_file); }
                                        else { app.exitCode =  newErr (13, obj); break; }
                                    }
									
                                 // collect files process
								 
								alert(1);
                                var filesToCollect = new Array ();
                                for (var r=1; r <= app.project.numItems; r++)
                                    {   
                                            // keep only Footage items with source = file (no solids kept)
                                            if (app.project.item(r).typeName == "Footage" && app.project.item(r).mainSource.file)
                                                {
                                                    // recuperation en variable de l'objet et du fichier source
                                                    Obj = app.project.item(r);
                                                    sourceObj = app.project.item(r).mainSource;
                                                    sourceFile = sourceObj.file;
                                                    // process object
                                                    if (sourceFile.exists)
                                                        {
                                                            // here we check the position of the object compare to the root (base) of the project.
                                                            // we have to start from the object and go to the root > we store all parents folders into an array
                                                            // then reverse the array to get the full "path" of the object
                                                            patharray=new Array()
                                                            object = Obj;
                                                            do
                                                                {
                                                                    patharray.push(object.parentFolder.name);
                                                                    object = object.parentFolder;
                                                                }
                                                            while (object.parentFolder != app.project.rootFolder);
                                                            subfolders = patharray.reverse().join("/"); // path of asset
                                                            
                                                            // check if sourceFile is not in T:/Team/00_ASSETS
                                                            // if in assets library, do not need to copy file cause Soi fully synchronised !
                                                            // else : it is a file created by layout artist, we need to copy it !
                                                            if (!sourceFile.parent.fsName.match(assets_libraries_path , "gi") && !sourceFile.name.match(/safeframe_template/gi) && !sourceFile.path.match(/00_animatics/gi))
                                                                {
                                                                   if (sourceFile.name.match(/(\.(jp(e)?g|png|psd|tif|iff|exr|hdr))$/gi) && !sourceObj.isStill)// sequence file
                                                                        {
                                                                            //alert("seq files" + sourceFile.name);
                                                                            sourcePath = sourceFile.parent.fsName;
                                                                            destPath = new Folder (decodeURI (targetFolder) + "/" + subfolders + "/" + sourceFile.parent.name).fsName;
                                                                            filesName = Obj.name;
                                                                            filesToCollect.push(["fffffffe", sourcePath, destPath, filesName]);
                                                                        }
                                                                    else
                                                                        {
                                                                            cleanSourceFile = sourceFile.fsName;
                                                                            destFile = File (decodeURI (targetFolder) + "/" + subfolders).fsName;
                                                                            
                                                                            if (sourceFile.name.match(/(\.png)$/gi)) { filesToCollect.push(["504e4766", cleanSourceFile , destFile]); } // PNG
                                                                            else if (sourceFile.name.match(/(\.jpg|\.jpeg)$/gi)) {filesToCollect.push(["4a504547", cleanSourceFile , destFile]);} //JPEG // JPG
                                                                            else if (sourceFile.name.match(/(\.psd)$/gi)) { filesToCollect.push(["38425053", cleanSourceFile , destFile]); } // PSD
                                                                            else if (sourceFile.name.match(/(\.tif|\.tiff)$/gi)) { filesToCollect.push(["54494646", cleanSourceFile , destFile]); } //TIF
                                                                            else if (sourceFile.name.match(/(\.iff)$/gi)) { filesToCollect.push(["49464620", cleanSourceFile , destFile]); } // IFF
                                                                            else if (sourceFile.name.match(/(\.swf)$/gi)) { filesToCollect.push(["53574620", cleanSourceFile , destFile]); } // SWF
                                                                            else if (sourceFile.name.match(/(\.hdr)$/gi)) { filesToCollect.push(["52484452", cleanSourceFile , destFile]); } // HDR
                                                                            else if (sourceFile.name.match(/(\.exr)$/gi)) { filesToCollect.push(["45585220", cleanSourceFile, destFile]); } // EXR
                                                                            else if (sourceFile.name.match(/(\.mov|.avi|.mp(e)?g|.mp4)$/gi)) { filesToCollect.push(["4d6f6f56", cleanSourceFile , destFile]); } // movies
                                                                            else if (sourceFile.name.match(/(\.aif(f)?)$/gi))  {  filesToCollect.push(["4d6f6f56",cleanSourceFile , destFile]); } ; // AIFF
                                                                        }
                                                                }
                                                        }
                                                 }
                                        }
                                // write shotNum.temp file
								
								alert(2);
								test = confirm("is there .temp in the folder ?");
								if (test == true)
								{
								alert(3);
                                temp = new File (decodeURI(collect_files_datas_dir) + "/" + shot_num + ".temp");
                                temp.open("w");
                                shot_datas['files_to_collect'] = filesToCollect;
                                temp.write(shot_datas.toSource());
                                temp.close();
								
								alert(4);
                                // close reduced project and open main file
                                app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
                                app.open(temp_project_file);
								
								}
								else{app.exitCode =  newErr (14, obj); break;}
                            }               
                    }
            }
        else
            {
                 if (debug == true) { alert('no aepx to export'); };
            }
        /* EXPORT FRAMINGS */
        if (export_infos_datas['toExport_framing'].length > 0)
            {
                 // clean renderQueue
               if (app.project.renderQueue.numItems != 0)
                    {
                        while (app.project.renderQueue.numItems  != 0)
                            {
                                app.project.renderQueue.item(app.project.renderQueue.numItems).remove();
                            };
                    };
                for (obj in export_infos_datas['shots'])
                    {
                        var shot_datas = export_infos_datas['shots'][obj];
                        if (shot_datas == undefined) { app.exitCode = newErr (55, obj); break;};
                        var shot_num = shot_datas['shot_infos'][0];
                        var comp_id = shot_datas['shot_infos'][1];
                        var appFolder = shot_datas['shot_infos'][2];
                        var app_file_name = shot_datas['shot_infos'][3];
                        
                        export_framing = lookUpArr (export_infos_datas['toExport_framing'], shot_num);
                        // build renderQueue for framings
                        var compItem = undefined;
                        for (var e=1; e <= app.project.numItems; e++)
                            {
                                if (app.project.item(e) instanceof CompItem && app.project.item(e).id == comp_id && app.project.item(e).name == shot_num)
                                    {
                                        //it is the comp we are looking for
                                        compItem = app.project.item(e);
                                    }
                            }
                        if (compItem == undefined) {  app.exitCode =  newErr (65, obj); break;};
                        
                        if (export_framing == true )
                            {
                                framingName = app_file_name.replace(/ae.aepx/gi, "framing");
                                framingFile = File (decodeURI(appFolder) + "/" + framingName + '.jpg');
                                if (framingFile.exists) framingFile.remove();
                                // list all layers with blue label >> use them to export framing
                                bluelayers = new Array();
                                for (var i=1; i <= compItem.numLayers; i++)
                                    {
                                        layer  = compItem.layer(i);
                                        if ((layer.label == 8) && layer.enabled == true)
                                            {
                                                bluelayers.push(layer);
                                                layer.solo = true;
                                            };
                                    }
                                // build renderqueue and render if one or more blue layer(s)
                                if (bluelayers.length > 0)
                                    {
                                            // var for render queue
                                            startframe = compItem.duration/2;
                                            durationStillFrame = currentFormatToTime(1, compItem.frameRate, true);
                                            // -- renderqueue builder
                                            screenshotRender = app.project.renderQueue.items.add(compItem);
                                            has_template = false;
                                            for (var t=0; t < screenshotRender.templates.length; t++)
                                                {
                                                    if (screenshotRender.templates[t].toLowerCase() == "GUMBALL".toLowerCase())
                                                        {
                                                            has_template = true;
                                                        }
                                                }
                                            if (has_template  == false)
                                                {
                                                    app.exitCode = newErr (23, obj);
                                                    break;
                                                }
                                            has_template = false;
                                            for (var t=0; t < screenshotRender.outputModules[1].templates.length; t++)
                                                {
                                                    if (screenshotRender.outputModules[1].templates[t].toLowerCase() == "GUMBALL_LO_Screenshot".toLowerCase())
                                                        {
                                                            has_template = true;
                                                        }
                                                }
                                           if (has_template  == false)
                                                {
                                                    app.exitCode = newErr (24, obj);
                                                    break;
                                                }
                                            screenshotRender.applyTemplate("GUMBALL");
                                            // renderqueue output module builder
                                            screenshotFile = new File (decodeURI(appFolder) + "/" + framingName +"[#####].jpg");
                                            screenshotRender.outputModules[1].applyTemplate("GUMBALL_LO_Screenshot");
                                            screenshotRender.outputModules[1].file = screenshotFile;
                                            screenshotRender.timeSpanDuration = durationStillFrame;
                                            screenshotRender.timeSpanStart = startframe;
                                            
                                    }
                                else {app.exitCode = newErr (22, obj); break;};
                // if everything is fine, save project to keep itemin renderqueue
                app.project.save();
                            }
                    }
            }
        else
            {
                if (debug==true) { alert('no framing to export'); };
            }
			
        //app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
        //app.open(main_project_file);
    }

collectFiles ();
app.exitAfterLaunchAndEval = false;
