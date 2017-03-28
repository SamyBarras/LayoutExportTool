function TaggerTool_buildUI  (bgtype)
    {
        var tags_result = undefined;
       /* TO UPDATE :::::
            >> if type of window === palette,
            the update should be more efficient
            it should reduce lag!
            
            
           the tagger tool is supposed to be completely independant
           no arg at start
           return just a tag
           
           function which call the TaggerTool has to process this tag to build task template and tag list
           
           */
        // ui build
                TaggerTool_UI = new Window("dialog", "Tagger tool", [100, 250, 500, 500]);
                TaggerTool_UI.grp = TaggerTool_UI.add("group");
                    TaggerTool_UI.grp.orientation = "column";
                    TaggerTool_UI.grp.alignChildren = ['fill','fill'];
                searchTool = TaggerTool_UI.grp.add("group");
                    searchTool.alignment = ['fill','fill'];
                    searchTool.orientation = "row";
                    search_icon = searchTool.add("image {image: \""+(icons_folder+"search.png")+"\"}");
                    searchField = searchTool.add("edittext");
                        searchField.alignment = ['fill','fill'];
                        searchField.minimumSize = searchField.maximumSize = [150,20];
                        searchField.enabled = false;  // need to debug
                listgrp = TaggerTool_UI.grp.add("group");
                    tagsList = listgrp.add("treeview", [0, 0, 200, 200]);
                    for (obj in locations)
                        {
                            nodetag = tagsList.add('node', obj);
                                    location = locations[obj];
                                    subitems = [];
                                    for (sub_location in location)
                                        {
                                            subitems.push(sub_location);
                                        }
                                    subitems.sort();
                                    for (sub_location in subitems)
                                        {
                                            bttntag = nodetag.add('item', subitems[sub_location]);
                                        }
                        };
                resultGrp = TaggerTool_UI.grp.add("group");
                    resultGrp.orientation = "row";
                    resultGrp.alignChildren = ['center','fill'];
                    txt = resultGrp.add("statictext", undefined, 'Tags: ');
                    tags = resultGrp.add("statictext", undefined, undefined);
                        tags.minimumSize = tags.maximumSize = [150,20];
                        tags.graphics.font = ScriptUI.newFont ("Arial", "Bold", 9);
                bttnGrp = TaggerTool_UI.grp.add("group");
                    goBttn = bttnGrp.add("button", undefined, 'go!');
                    cancelBttn = bttnGrp.add("button", undefined, 'cancel');
                    
        // searching funtcion
        function searchTag ()
            {
                /* this function is not used yet because it slow down and crash AFX when using it */
                // bug is due to hard refreshing UI
                    var temp = searchField.text;
                    if (temp != "")
                        {
                            function blabla()
                                {
                                    for (var e=0; e < tagsList.items.length; e++)
                                        {
                                            location = tagsList.items[e];
                                            try
                                                {
                                                    if (location.text.toLowerCase().match(temp, "gi") != null)
                                                        {
                                                             guessed_location = location;
                                                        }
                                                    else
                                                        {
                                                            for (var i=0; i < location.items.length; i++)
                                                                {
                                                                    sublocation = location.items[i];
                                                                    if (sublocation.text.toLowerCase().match(temp, "gi") != null)
                                                                        {
                                                                            guessed_location = sublocation;
                                                                        }
                                                                }
                                                        }
                                                }
                                            catch (err) { log('err', [$.line, decodeURI(File($.fileName).name)], err.message); } ;
                                        }
                                        return guessed_location;
                                }
                            guess = blabla();
                            tagsList.selection = guess;
                            tagsList.layout.layout(true);
                        }
                    else
                        {
                            tagsList.selection = null;
                            
                        }
                    
                    updateTag();
            }
        function updateTag(tag)
            {
                tag = tagsList.selection;
                if (tag != null)
                    {
                        if (tag.parent != tagsList && !tag.parent.text.match(/other/gi))
                            {
                               tags.text= tag.parent.text + "_" + tag.text;
                            }
                        else if (tag.text != "other")
                            {
                               tags.text= tag.text;
                            }
                        else
                            {
                                tags.text = '';
                            }
                    }
                else
                    {
                        tags.text = '';
                    }
            }
        function addItem () 
            {
                 // this function is not available yet >>> WIP
                 // the idea is allowing user add a tag in the list (shared with evrybody)
                tagsList.selection = null;
                newTag = prompt ('Set up a new tag');
                if (newTag != null)  tags.text = newTag;
            }
        function sendTags (bgtype, tags_result, tags)  // to apply tags to asset name
            {
                try{
                tags_result = undefined;
                // get the task templates list for current type of BGs
                var active_task_templates = task_templates_list[bgtype];
                var guessed_task_templates = undefined;
                var tags_txtField = tags.text;
                
                if (!tags_txtField.match(/null|cancel|undefined/gi) && tags_txtField != "")
                    {
                        // defined tags not empty or null or undefined
                         // check if tag is available in the list
                         if (tags_txtField in locations)
                            {
                                log('err', [$.line, decodeURI(File($.fileName).name)],"Please define a valid sublocation..."); 
                            }
                        else
                            {
                                var is_custom_tag = true;
                                for (location in locations)
                                    {
                                        sublocations = locations[location];
                                        subloc = tags_txtField.replace(/^.*_/gi, '');
                                        if (subloc in sublocations)
                                            {
                                                // the tag correspond to a sub-location of the list
                                                task_template_num = sublocations[subloc];
                                                for (taskTemplate in active_task_templates)
                                                    {
                                                        if (taskTemplate == task_template_num)
                                                            {
                                                                guessed_task_templates = active_task_templates[taskTemplate];
                                                                break;
                                                            }
                                                    }
                                                if (guessed_task_templates == undefined) guessed_task_templates = active_task_templates["default"];
                                                is_custom_tag = false;
                                                break;
                                            }
                                    }
                                if (is_custom_tag == true)
                                    {
                                        if (allow_custom_tags == true)
                                            {
                                                /// the artist is allowed to use customized tags... we can continue
                                                guessed_task_templates = active_task_templates["default"];
                                            }
                                        else
                                            {
                                                // not allowed to use customized tags >> error !
                                                log('err', [$.line, decodeURI(File($.fileName).name)],localize("\"%1\" is not a valid tag!\n\n Please select a sublocation in the list before continuing.", tags_txtField));
                                            }
                                    }
                               
                            }
                    }
                else
                    {
                        log('err', [$.line, decodeURI(File($.fileName).name)],localize("\"%1\" is not a valid tag!\n\n Please select a sublocation in the list before continuing or set a custom tag.", tags_txtField));
                    };
                if (guessed_task_templates)
                    {
                        TaggerTool_UI.close();
                        tags_result = [guessed_task_templates, tags_txtField];
                        return tags_result;
                    };
                }
            catch(err) {log('err', [$.line, decodeURI(File($.fileName).name)],err.message);}
            }
        function cancel (tags_result)
            {
                    TaggerTool_UI.close();
                     tags_result = undefined;
                     return tags_result;
            }
        //// ACTIONS BUTTONS
        searchField.onChange = searchField.onChanging = searchTag;
        tagsList.onChange = function () { updateTag(tagsList.selection); };
        search_icon.onClick = addItem;
        goBttn.onClick = function () { tags_result = sendTags (bgtype, tags_result, tags);};
                    //TaggerTool_UI.defaultElement = goBttn;
        cancelBttn.onClick = function () { tags_result = cancel (tags_result);};
                    TaggerTool_UI.cancelElement = cancelBttn;
        
        TaggerTool_UI.layout.layout(true);
        TaggerTool_UI.show();
        
        return  tags_result;
                                
    }