import json

# open the master JSON database
master_file = open('34.geojson')
data = json.load(master_file)

route_to_reverse = data["features"][0]["geometry"]["coordinates"]
reversed_route = []

for coordinates in reversed(route_to_reverse):
	reversed_route.append(coordinates)

print(reversed_route)

data["features"][1]["geometry"]["coordinates"] = reversed_route

with open('34-new.geojson', 'w') as out:
	json.dump(data, out)

master_file.close()
