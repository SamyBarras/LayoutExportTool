function readFile (path, type)
    {
            /*
                this function read the target file which contains two variables:
                - one list of BG assets / as an object   //   assetsList
                - one list of shots / as an object   // shotsList
                
                need to pass the app folder PATH into the function to be able to save file properly
            */
        var assetsList = undefined;
        var shotsList = undefined;
        
        if (type == "shot")
            {
                theFile = new File (decodeURI(path) + "/.shot");
            }
        else if (type == "asset")
            {
                thepath = localize(EPI_processingFolder, path, type);
                theFile = new File (thepath);
            }
        else
            {
                log('err', [$.line, decodeURI(File($.fileName).name)], localize("Type of list is not valid : \n%1 !",type));
                theFile = "";
            }
        
        if (theFile.exists)
            {
                try
                    {
                        listFile = $.evalFile(theFile);
                        test = eval (listFile);
                        return eval(listFile);
                    }
                catch (err) 
                    {
                        log('err', [$.line, decodeURI(File($.fileName).name)], localize("Error while reading the file \"%1\" !\n%2", theFile.fsName,err.message));
                        return;
                    }
            }
        else
            {
                if (type == "asset")
                    {
                        // depending of the acccess allowed to other artists
                        // need to define how artists can find "not already exported" assets
                        var txtFile = new File (decodeURI(theFile));
                        txtFile.open("w","TEXT","????");
                        txtFile.write ("({})");
                        txtFile.close();
                        
                        try
                            {
                                listFile = $.evalFile(theFile);
                                test = eval (listFile);
                                return eval(listFile);
                            }
                        catch (err) 
                            {
                                 log('err', [$.line, decodeURI(File($.fileName).name)],localize("Error while reading the file \"%1\" !\n%2", theFile.fsName,err.message));
                                return;
                            }
                    }
                else
                    {
                        return undefined;
                    }
            };
    };

function addAssetToFile (episodeFolder, assetObj)
    {
        // this list to create or update asset_obj in .asset list
        assetsList = readFile (episodeFolder, 'asset');
        // check if the BG asset already exist in the list
        if (assetsList == undefined)
            {
                assetsList = {};
            };
        // update or create the asset
        assetsList[assetObj['name']] = assetObj;
        updatedList = assetsList.toSource().replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        
        // write the file
        file_path = localize(EPI_processingFolder, episodeFolder, 'asset');
        savePath = new File (decodeURI(file_path)); // to define : stored inlocal or on the server
        // depending of the acccess allowed to other artists
        // need to define how artists can find "not already exported" assets
        var txtFile = new File(savePath);
        txtFile.open("w","TEXT","????");
        txtFile.write (updatedList);
        txtFile.close();
        //debug
        if (show_list_results == true)
		{
			var tmpBat = new File($.getenv("TEMP") + "/show_list_results.bat");
			tmpBat.open("w");
			tmpBat.write("start Notepad \"" + txtFile.fsName + "\"");
			tmpBat.close();
			tmpBat.execute();
			
		}           
    };

function createShotToFile (path, shotObj)
    {
        // check if the BG asset already exist in the list
        shotSource = shotObj.toSource().replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        // write the file
        savePath = new File (decodeURI(path + "/.shot"));
        
        var txtFile = new File (savePath);
        txtFile.open("w","TEXT","????");
        txtFile.write (shotSource);
        txtFile.close();
        //debug
        if (show_list_results == true)
		{
			var tmpBat = new File($.getenv("TEMP") + "/show_list_results.bat");
			tmpBat.open("w");
			tmpBat.write("start Notepad \"" + txtFile.fsName + "\"");
			tmpBat.close();
			tmpBat.execute();
		}           
    };

function remAssetToFile (episodeFolder, assetToRemove)
    {
        assetsList = readFile (episodeFolder, 'asset');
        // check if the BG asset already exist in the list
        // then delete it
        // check first if the argument given is an object (from BGAsset Creation Panel) or a String (From Export Panel)
        if (assetToRemove in assetsList) // del from CreateBGPanel
            {
                delete assetsList[assetToRemove];
                log('info', [$.line, decodeURI(File($.fileName).name)], assetToRemove + " removed from BG assets list.");
            }
        else
            {
                // throw an error
                log('err', [$.line, decodeURI(File($.fileName).name)], assetToRemove + ' not found in the BG assets list - can\'t delete it !');
            }
        
        // then re-write the list file
        updatedList = assetsList.toSource().replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        // write the file
        file_path = localize(EPI_processingFolder, episodeFolder, 'asset');
        savePath = new File (decodeURI(file_path)); // to define : stored inlocal or on the server
        // depending of the acccess allowed to other artists
        // need to define how artists can find "not already exported" assets
        var txtFile = new File(savePath);
        txtFile.open("w","TEXT","????");
        txtFile.write (updatedList);
        txtFile.close();
        //debug
        if (show_list_results == true)
		{
			var tmpBat = new File($.getenv("TEMP") + "/show_list_results.bat");
			tmpBat.open("w");
			tmpBat.write("start Notepad \"" + txtFile.fsName + "\"");
			tmpBat.close();
			tmpBat.execute();
		}
    };


function updateAssetInShotFile (path, assetObj, action, arg)
    {
        // read the shot's sumup
        var shotObject = readFile (path, 'shot');
        // then process if not missing
        if (shotObject != undefined)
            {
                shotObject.status = "not exported";
                // get list of bg_assets for the shot
				
                var shot_bg_assets_list = shotObject['background_asset'];
                // build the bg_asset entry which will be add to bg_assets list in shot file
                // [asset name , asset id , added to export queue] //
                    
                if (action == 'add')
                    {
                        // arg is the queueStatus for the bg
                        var assetarr = [assetObj['name'], assetObj['id'], arg];
                        // add a bg asset to the bg_assets list
                        if (shot_bg_assets_list == undefined )
                            {
                                // if empty before : add the bg_asset in an array
                                shotObject['background_asset'] = [assetarr];
                            }
                        else if (shot_bg_assets_list.length == [])
                            {
                                shotObject['background_asset'] = [assetarr];
                            }
                        else
                            {
                                updated = false;
                                var bg_assets_list = shotObject['background_asset'];
                                for (var a=0; a < bg_assets_list.length; a++)
                                    {
                                        if (bg_assets_list[a][0] == assetarr[0])
                                            {
                                                // update the asset because exists // don't create new instance
                                                bg_assets_list[a] = assetarr;
                                                updated = true;
                                                break;
                                            };
                                     }
                                 if (updated == false) // not present in the list at this point
                                    {
                                        bg_assets_list.push(assetarr);
                                    };
                                
                                shotObject['background_asset'] = bg_assets_list;         
                            };
                    }
                else if (action == 'update')
                    {
                        updated = false;
                        //arg is the [queeStatus, old bg asset]
                        var assetarr = [assetObj['name'], assetObj['id'], arg[0]];
                        bg_assets_list = shotObject['background_asset'];
                        for (var a=0; a < bg_assets_list.length; a++)
                            {
                                if (bg_assets_list[a][0] == arg[1].name)
                                    {
                                        if (bg_assets_list[a][1].match(/re-use/gi))
                                            {
                                                shotObject['background_asset'][a][0] = assetObj['name'];
                                                shotObject['background_asset'][a][2] = assetObj['sg_id'];
                                                updated = true;
                                                break;
                                            }
                                        else
                                            {
                                                // update the asset because exists // don't create new instance
                                                shotObject['background_asset'][a] = assetarr;
                                                updated = true;
                                                break;
                                            }
                                        break;
                                    };
                                
                            }
                        if (updated == false) // not present in the list at this point
                            {
                                log('err', [$.line, decodeURI(File($.fileName).name)], arg[1].name + "not found in .shot file [" + shotObject.name + "]!\nCan't update the .shot file with new values of bg asset");
                            };
                    }
                else if (action == 'del')
                    {
                        if (shot_bg_assets_list == undefined)
                            {
                                // list is empty / nothing o do / no BG asset to remove from list
                                // this is an error which shouldn't happened. maybe need to throw an error to say "the bg asset you want to remove is not in the list"
                                log('err', [$.line, decodeURI(File($.fileName).name)], "shot_bg_assets_list is undefined for " + shotObject['name'] + "\nCan't remove BG from the list");
                            }
                        else
                            {
                                // then find the BG asset we want to remove from the list
                                var bg_assets_list = shotObject['background_asset'];
                                for (var e=bg_assets_list.length-1; e >= 0; e--)
                                    {
                                        if (bg_assets_list[e][0] ==  assetObj.name)
                                            {
                                                // if found, remove from temp list
                                                bg_assets_list.splice(e,1);
                                                break;
                                            };
                                    };
                                // then update with the temp list
                                shotObject['background_asset'] = bg_assets_list;
                            };
                    }
                else
                    {
                        log('err', [$.line, decodeURI(File($.fileName).name)], action +"\nis not a valid command to update the .shot file");
                        return;
                    }
            }
        //or create
        else
            {
                // throw error!
                log('err', [$.line, decodeURI(File($.fileName).name)], 'error when updating bg_assets list of shot File');
                return;
            }
        // convert to text
        updatedObj = shotObject.toSource().replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        // write the file
        savePath = new File (decodeURI(path) + "/.shot");
        // depending of the acccess allowed to other artists
        // need to define how artists can find "not already exported" assets
        var txtFile = new File(savePath);
        txtFile.open("w","TEXT","????");
        txtFile.write (updatedObj);
        txtFile.close();
        //debug
        if (show_list_results == true)
		{
			var tmpBat = new File($.getenv("TEMP") + "/show_list_results.bat");
			tmpBat.open("w");
			tmpBat.write("start Notepad \"" + txtFile.fsName + "\"");
			tmpBat.close();
			tmpBat.execute();
		}
        return true;
    }
function updateEntryInShotFile (path, obj, arg)
    {
        // read the shot's sumup
        shotObject = readFile (path, 'shot');
        // then process if not missing
        if (shotObject != undefined)
            {
                shotObject.status = "not exported";
                // for Maya file Entry
                if (arg == 'add')
                    {
                        cleanName = localize(appFileName_template, shotObject['episodeCode'].replace("_", ''), shotObject['name'], "MA." + decodeURI(obj).split(".")[1]);
                        shotObject['maFile'] = [obj.fsName, cleanName];
                    }
                else if (arg.match('del|remove'))
                    {
                        shotObject['maFile'] = undefined;
                    }
                // for AE entry
                else if (arg == 'AE')
                    {
                        shotObject['exportAE'] = obj;
                    }
                // for AE entry
                else if (arg == 'QT')
                    {
                        shotObject['exportQT'] = obj;
                    }
                // for AE entry
                else if (arg == 'Framing')
                    {
                        shotObject['exportFraming']= obj;
                    }
				// J Hearn - added this property
				else if (arg == 'MultiFraming')
				{
					shotObject['exportMultiFraming'] = obj;
				}
                else if (arg == 'task_template')
                    {
                        // update task template for the shot
                        shotObject['task_template'] = obj;
                    }
				// J Hearn - added this property
				else if (arg == 'Notes')
				{
					shotObject['notes'] = obj;
				}
				// J Hearn - added this property
				else if (arg == 'NotesTo')
				{
					shotObject['notesTo'] = obj;
				}
				// J Hearn - added this property
				else if (arg == 'NotesDepts')
				{
					shotObject['notesDepts'] = obj;
				}
                else
                    {
                        log('debug', [$.line, decodeURI(File($.fileName).name)], localize( 'argument \"%1\" not valable for update entry in .shot file',arg) );
                    }
            }
        else
            {
                log('err', [$.line, decodeURI(File($.fileName).name)], localize('Can\'t find ".shot" file in\n%1!!',shotObj.appFolder));
                return;
            }
        
        updatedObj = shotObject.toSource().replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        // write the file
        savePath = new File (decodeURI(path) + "/.shot");
        // depending of the acccess allowed to other artists
        // need to define how artists can find "not already exported" assets
        var txtFile = new File(savePath);
        txtFile.open("w","TEXT","????");
        txtFile.write (updatedObj);
        txtFile.close();
        //debug
        if (show_list_results == true)
		{
			var tmpBat = new File($.getenv("TEMP") + "/show_list_results.bat");
			tmpBat.open("w");
			tmpBat.write("start Notepad \"" + txtFile.fsName + "\"");
			tmpBat.close();
			tmpBat.execute();
		}
        // read the shot's sumup
        shotObject = readFile (path, 'shot');
        return shotObject;
    }
function check_exists_inAssetList (episodeFolder, assetobj)
    {
        // asset is supposed to be an object !
        assetsList = readFile (episodeFolder, 'asset');
        if (assetsList[assetobj.name] != null) // del from CreateBGPanel
            {
                // asset exists
                return true;
            }
        else
            {
                return false;
            }
    }

/**/
function pathToWinPath(path)
	{
        // automatically convert or clean folder or file path to string
		var str = path.toString().replace(/\//, "");
		str = str.replace(/\//, ":/");
		str = str.replace(/%20/g, " ");
		str = str.replace(/\//g, "\\");
		return str;
	}
function pathToPythonPath(path)
	{
        // automatically convert or clean folder or file path to string
		var str = path.toString().replace(/\//, "");
		str = str.replace(/\//, ":/");
		str = str.replace(/%20/g, " ");
		str = str.replace(/\//g, "\\\\");
		return str;
	}