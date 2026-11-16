import sys, squelette, json
formes = [tuple(x.split(":")) for x in sys.argv[2].split(",")]
squelette.planche(formes, sys.argv[1], col=3, cell=600)
