import os, sys, re, getopt, json
try:
    from custom_options.py_glob_vars import *
    from shotgun_link import *
except ImportError,e:
    raise sys.exit(e)

def get_epFolder(argv):
    object = None
    try:
        opts, args = getopt.getopt(argv,"hk:",["keywords="])
    except getopt.GetoptError:
        print 'test.py -k "string of objects to search. can be any string or id"'
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print 'test.py -k "keywords"'
            sys.exit()
        elif opt in ("-k", "--keywords"):
            object = str(arg)
    return object

to_search = get_epFolder(sys.argv[1:])
items_to_search = to_search.split(",")

# build search filters based on args
sub_filters = []
for item in items_to_search:
	if item.isdigit():
		new_filter = ["id", "is", int(item)]
	else:
		cleanedName = re.sub(r'(\.[a-zA-Z0-9]*)|(_v[0-9]*)', '', str(item))
		#print cleanedName
		new_filter = [ "code", "contains", [cleanedName]]
	sub_filters.append(new_filter)

# build filters base
if len(sub_filters) > 0:
    fields = ['id', 'code']
    filters = [
        ['project','is',{'type':'Project','id':project_id}],
        ['sg_asset_type','is', "Background"],
        {
            "filter_operator": "all",
            "filters": sub_filters
        }
        ]
    result = sg.find('Asset', filters, fields)
    print json.dumps(result)
else:
    print 'error'