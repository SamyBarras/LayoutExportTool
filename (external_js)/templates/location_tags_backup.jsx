/* LOCATION TAG LIST */
/*
    used for the script "TaggerTool.jsx" 
    Here is a list of locations and sub locations which need specific task_templates for BG task.
    This list is used for the creation of BG asset during exporting task of Layout.
    this list is written as javascript object and can be updated using following template :
	
    'Location':{
                        'Room1':number for task template,
                        'Room2':number for task template,
                        'Room3':number for task template,
                        },
    
	
	> where "Location" is the name of the main location (like "School")
	and "Room#" is the name of sublocation (like "Canteen" for school's canteen)
	> for number of task template, please refer to the chart
	
*/
/*	 Below are Numbers and corresponding task_templates
     Numbers are matching task_templates positin into "bg_asset_params.jsx" file
     If you create new task_template for a BGtype, you have to report it there!
               
                # BGmatte, BG3Dmoving, BGcamap and BGfootage always have same task templates and won't be affected by this list !
                # new 3D still render :
                        0:"BG Choose workflow"
                        1:"BG 3D still to Soi"
                        2:"BG 3D still to Soi then BG matte"
                        3:"BG 3D still to CN"
                # new 3D render to matte:
                        [0,3] : BG 3D still to CN
                        1 : BG 3D still to Soi then BG matte
                        2 : BG 3D still to Soi then BG matte
	
				|-------------------------------------------------------|
				|				BG TYPE	   // TASK TEMPLATE				|
	|-------------------------------------------------------------------|
	|	number	|	 new 3D still render	|	 3D render to matte		|
	|-------------------------------------------------------------------|
	|	  0		|	 BG Choose workflow		|	 BG 3D still to CN		|
	|-------------------------------------------------------------------|	
	|	  1		|	 BG 3D still to Soi		|	 BG 3D still to Soi		|
	|			|							|	 then BG matte			|
	|-------------------------------------------------------------------|
	|	  2		|	 BG 3D still to Soi		|	 BG 3D still to Soi		|
	|			|	 then BG matte			|	 then BG matte			|
	|-------------------------------------------------------------------|
	|	  3		|	 BG 3D still to CN		|	 BG 3D still to CN		|
	|-------------------------------------------------------------------|
	

*/	
/*
	PLEASE MAKE CHANGES TO THIS LIST CAUTIOUSLY :
	ALL CHANGES WILL AFFECT ALL USERS !
	
	! IT IS SAFER TO MAKE A COPY OF THIS FILE BEFORE MODIFYING IT !
*/
  
var locations = {
    'School':{
                'Canteen':1,
                'Classroom':1,
                'Corridor':2,
                'Gym':2,
                'Toilets':2,
                'PrincipalsOffice': 3,
                'Nurseroom': 3,
                'SimiansOffice': 3,
                'Vent': 3,
                'Rooftop': 3,
                'Front': 3,
                },
    'WattersonsHouse':{
                'Front':3,
                'Livingroom':2,
                'Kitchen':2,
                'ParentsBedroom': 3,
                'Attic': 3,
                'Backyard': 3,
                'Shed': 3,
                'GumballBedroom': 3,
                },
    'other':{
                'Highway':2,
                'Streets':3,
                'Pavement' :3,
                'RobinsonsHouse':3,
                'Clouds': 3,
                'Jail': 3
                }
            };