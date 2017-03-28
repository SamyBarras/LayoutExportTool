/*
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
                                                    - use latest infos from [B] to upload BG assets linked to shot
                                    */
function export_task (exportQueue)
    {
        /*
            exportQueue = array of shotPanels 
                    shotPanel.comp == compItem
                    shotPanel.appFolder == shot's approved folder 
           */
       /*
           we try to do as much things as possible OUTSIDE of current after effects project
           use cmd-line to do so...
           */
        
    }