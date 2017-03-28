// UI CUSTOM OPTIONS 
    // show or hide the status of the shot in the title of the panel
    var showShotStatus_inPanelName = true;
	
	/*
		>> use_realShotStatus
		shots with "not exported" status will always have "not exported" status in UI
		if use_realShotStatus = false:
			the status shown in the UI will be "exported" if shot's status is "uploaded" or "exported"
		if use_realShotStatus = true:
			the status shown in the UI will be 	"exported" if shot's status is "exported"
                                                                                    "uploaded" if shot's status is "uploaded"
		
		by default set to false, according to Antoine's request
	*/
    var use_realShotStatus = false;
	
    // show or hide the status of the background asset in the title of the panel
    var showAssetStatus_inPanelName = true;
	
    /*
		Define which info is given in the BG panel next to BG asset name :
			0 > will show the short BG type [BGmatte, BG3Dstill, BG3Dmoving, BGAFX, BGfootage] >> this is already given in the asset name...
			1 > will shot the type of the asset [new matte painting, new 3D still render, new 3D moving render, ...]
		By default it is "1" to give a more detailed info about the asset
	*/
    var show_asset_BGType = 1;
	
	/*
		Icons are stored in : ../icons/
								   |../style1/
								   |../style2/
								   
		You can customize the icon shown in the UI:
		- Change the variable below to change the folder of icons you want to use.
		- If you want to use other icons, just create your own folder and put your icons with same names into it, then change variable.
		- new icons' folder can have the name you want (example : "myIcons")
		
		PSD files are available in "icons" folder as guide.
		Size of icons is 25*25px, PNG
	*/
    var icon_style = "style2";
    
	/*
		"ui_use_colors" variable to use (or not) colors in the UI
		Color bars are depending of the status of the asset (BG or Maya)
			- values are given as RVBA in an array : [R,G,B,A] with a base of 1
			e.g :
				RED = [1,0,0,1]
				GREEN = [0,1,0,1]
				BLUE = [0,0,1,1]
	*/
    var ui_use_colors = true;
    var status_params =
        {
            'not exported':{ui_color:[0.612,0.816,0.816, 1]},
            'exported':{ui_color:[1,0.816,0.204, 1],},
            'uploaded':{ui_color:[0.408,0.816,0.204, 1],},
            'locked':{ui_color:[0.816,0.408,0.408, 1],
					 // "ui_enabled:false" >> will desable the panel of BG asset with "locked" status
					ui_enabled:true},
            're-use':{ui_color:[0.816,0.816,0.816, 1]},
        };
	
	/*
		>> allow_custom_tags :
		let artists define custom tags while creating new BG assets
		if true, corresponding task-template will be 0
	*/
    var allow_custom_tags = true;
    
/* !! do not modify following variables !! */
var icons_folder = localize(icon_dir, icon_style);