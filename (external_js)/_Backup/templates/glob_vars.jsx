// script paths
    var js_scripts_path = "T:/Team/01_RESOURCES/AFTER_EFFECTS/Scripts/Gumball_inHouse_scripts/LayoutExportToolCC2014/(external_js)/%1"; // path to external jsx scripts
    var py_scripts_path = "T:/Team/01_RESOURCES/AFTER_EFFECTS/Scripts/Gumball_inHouse_scripts/LayoutExportToolCC2014/external_py/%1"; // path to external python scripts
    var icon_dir = "T:/Team/01_RESOURCES/AFTER_EFFECTS/Scripts/Gumball_inHouse_scripts/LayoutExportToolCC2014/icons/%1/"; // icons folder
    var python_path = "C:/Python27/python.exe"; // python module > verify version !
    
// shotgun paths
	var url_asset_page = "https://turneruk.shotgunstudio.com/detail/Asset/%1"; // weblink for defined asset on Shotgun
	
//export task options
    var exportTask_temp_dir = "~/Documents/AdobeScripts/ExportTool/export_task";

// SCRIPT DEBUG
    var debug = true; // debug mode on (true) or off (false)
    var show_list_results = false; // to debug lists creation/update // will open .shot or .asset files each time script access to them
    var writed_obj_template = "\'%1\':\"%2\""; // template to write objects