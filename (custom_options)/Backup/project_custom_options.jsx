// PROJECT PATHS //
var season = "Season4"; // exact name of actual season's folder on the server
var LO_RUSHESFolder_template = "T:/Team/" + season +"/%1/05_LAYOUT/01_WIP/02_RUSHES/"; // path to rushes folder of the episode
var LO_APPFolder_template = "T:/Team/" + season +"/%1/05_LAYOUT/02_APPROVED/Sc%2"; // path for approved shot folder of the episode
var EPI_processingFolder ="T:/Team/" + season +"/%1/05_LAYOUT/00_TEMP/processing/.%2"; // path for ".asset" file of the episode
var assets_libraries_path = "T:\\Team\\00_ASSETS"; // ! please keep path as URI notation !

// GLOBAL VARIABLES //
/*
	> naming convention template for files stored in LO approved folder:
		GB400EPISODE_Sc000_LO_TYPE.ext
	e.g. : GB400EPISODE_Sc000_LO_MA.ma for the maya file
	
	%1 > GB###EPISODE
	%2 > Sc###
	%3 > TYPE.ext
*/
var appFileName_template = "%1_%2_LO_%3";

/*
	List of necessary files to be stored in approved folder
	Given as type:
		AE > after effect project
		QT > as quicktime file (from rushes folder)
		Framing > as framing for the shot
	If one of these files is missing in approved folder, the colored dot of the folder icon in the UI will be orange.
	If none of these files > dot will be gray
	If all of these files > dot will be green
*/
var appFilesToCheck = ["AE","QT","Framing"];

/*
	> resolutions_templates :
	this is the list of available resolutions for 3D renders.
	this parameter will be uploaded to the "resolution" field of the BG asset, on Shotgun
*/
var resolutions_templates = [ "2K","3K","4K" ];

/*
	> Naming convention for background assets
	Tags will be added at the end of the name
	> this variable shouldn't be modified.
	! If has to, please do it caustiously, and be aware some change have to be done in the main script
*/
var naming_convention = "GB###EPISODE_Sc###_bgtype";

/*	overwrite existing files in approved folder
	true by default
*/
var overwrite_app_existing_files = true;
	
/* Shotgun variables */
    // to upload assets on Shotgun during export task 
    /*
        0 > do not upload assets on shotgun
        1 > upload if asset not on Shotgun
        2 > always upload asset on Shotgun (will overwrite existing ones) >> default
     */
    var upload_assets_toShotgun = 2;
    var check_asset_status_onLoad = false; // if true, will check the status of asset on Shotgun each time a bg asset panel is created > longer but safer
