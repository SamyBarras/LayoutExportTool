# Connection to Shotgun server
# Make sure shotgun_api3 is installed for Python

# shotgun
from custom_options.py_glob_vars import *
import shotgun_api3

# connexion
sg = shotgun_api3.Shotgun(server_path, script_name, script_key)
#print sg
# result
	
