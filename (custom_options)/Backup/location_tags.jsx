/* LOCATION TAG LIST 

	Function:
        List locations that need specific workflows depending of the BG type (can't be guessed from their type only)
        For example: certain locations need colour-grading after render.
    
    Context:
        used in "TaggerTool.jsx" during the creation of new background asset.
        
    Format:
        'Location':{
                            'Sub-location': workflow index,
                            'Sub-location': workflow index,
                            'Sub-location': workflow index,
                            },
        
        Location: The name of the main location, e.g. "School".
        Sub-location: The name of Sub-location, e.g. "Canteen" or "PrincipalsOffice".
        Workflow Index: The desired task template according to the BG type.
    
    Dependencies:
        task templates are defined in the "task_templates_list", according to BG types

*/	
/*
	PLEASE MAKE CHANGES TO THIS LIST CAUTIOUSLY :
	ANY CHANGE WILL AFFECT ALL USERS !
	
	! IT IS SAFER TO MAKE A COPY OF THIS FILE BEFORE EDITING !
*/
var task_templates_list = {
	"new matte painting" :{
		"default":"BG matte"
		},
	"new 3D still render":{
		"default":"BG Choose workflow",
		1:"BG 3D still to Soi",
		2:"BG 3D still to Soi then BG matte",
		3:"BG 3D still to CN"
		},
	"new 3D moving render":{
        "default":"BG Choose workflow",
		},
	"new 3D render to matte":{
		"default":"BG 3D still to CN",
		1:"BG 3D still to Soi then BG matte",
		2:"BG 3D still to Soi then BG matte",
		3:"BG 3D still to CN"
		},
	"new AFX moving set":{
		"default":"BG AFX comp"
		},
	"new Camera Map":{
		"default":"BG camap"
		},
	"new footage":{
		"default":"BG footage"
		},
	}
var locations = {
    'School':{
				// tags will be : School_tag
                'Canteen':1,
                'Classroom':1,
                'Corridor':2,
                'Gym':2,
                'SwimmingPool':2,
                'Toilets':2,
                'PrincipalsOffice': 3,
                'Nurseroom': 3,
                'SimiansOffice': 3,
                'Vent': 3,
                'Rooftop': 3,
                'Library': 3,
                'TeachersLounge': 3,
                'Front': 3,
                },
    'WattersonsHouse':{
				// tags will be : WattersonsHouse_tag
                'Front':3,
                'Livingroom':2,
                'Kitchen':2,
                'ParentsBedroom': 3,
                'Attic': 3,
                'Backyard': 3,
                'Shed': 3,
                'GumballBedroom': 3,
                'Corridor': 3,
                'Basement': 3,
                },
    'Others':{
				// tags will be : _tag
                'Clouds': 3,
                'Highway':2,
                'Streets':3,
                'Pavement' :3,
                'Jail': 3,
                },
    'Hospital':{
				// tags will be : Hospital_tag
                'OperatingTheatre': 3,
                'Corridor': 3,
			   'Front': 3,
                },
    'RobinsonsHouse':{
				// tags will be : RobinsonsHouse_tag
                'Backyard': 3,
                'Livingroom': 3,
				'Front':3,
                },
	'ElmoreDam':{
		'Night':3,
                },
     'Supermarket':{
         'Interior':3,
         'StripMall':3,
		'CarPark':3,      
	},
            };