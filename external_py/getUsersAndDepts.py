import os, sys, re, getopt, json
try:
    from custom_options.py_glob_vars import *
    from shotgun_link import *
except ImportError,e:
    raise sys.exit(e)

print json.dumps({
	"users": [x['login'] for x in sg.find('HumanUser', [['sg_studio', 'is', 'CN']], ['login'])],
	"departments": [x['code'] for x in sg.find('Department', [], ['code'])],
})
