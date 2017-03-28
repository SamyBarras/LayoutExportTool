// script paths
    // J Hearn - common path separated into a var (at some point could be made relative to make dev easier)
	var lxt_dir_path = (new File($.fileName)).parent.parent.parent.fsName.replace(/\\/g, "/");
    // JH old hard coded path: var lxt_dir_path = "T:/Team/01_RESOURCES/AFTER_EFFECTS/Scripts/Gumball_inHouse_scripts/LayoutExportToolCC2014";
    var js_scripts_path = lxt_dir_path + "/(external_js)/%1"; // path to external jsx scripts
    var py_scripts_path = lxt_dir_path + "/external_py/%1"; // path to external python scripts
    var icon_dir = lxt_dir_path + "/icons/%1/"; // icons folder
    var python_path = "C:/Python27/python.exe"; // python module > verify version !
    
// shotgun paths
	var url_asset_page = "https://turneruk.shotgunstudio.com/detail/Asset/%1"; // weblink for defined asset on Shotgun
	
//export task options
    var exportTask_temp_dir = "~/Documents/AdobeScripts/ExportTool/export_task";

// SCRIPT DEBUG
    var debug = false; // debug mode on (true) or off (false)
    var show_list_results = false; // to debug lists creation/update // will open .shot or .asset files each time script access to them
    var writed_obj_template = "\'%1\':\"%2\""; // template to write objects