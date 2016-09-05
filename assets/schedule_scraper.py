#! python2.7
#
# schedule_scraper.py is a script for downloading, parsing, and converting
# SEPTA schedule data from HTML tables to JSON.
#
# Since bus and trolley schedules are hosted on two distinct pages, this
# script runs twice – once for each type of vehicle.
#
# Creates a folder in the current working directory called 'schedules' that
# contains every schedule indexed by route, day of the week, and destination.
#
# Required modules:
# 	x. requests (https://docs.python-requests.org/en/master/)
#	x. bs4 (https://www.crummy.com/software/BeautifulSoup/)


import os
import json
import errno
import requests
from bs4 import BeautifulSoup

# scrape(): crawls a page containing lists of trolley or bus schedules and
# initiates a conversion function for each one.
def scrape(starting_url):
	# Open the starting URL [bus or trolley page] as a Soup object.
	page = requests.get(starting_url)
	print ('Opening starting page %s...' % starting_url)
	try:
		page.raise_for_status()
	except Exception as exc:
		print('Could not open starting page: %s' % exc)
	soup = BeautifulSoup(page.text, 'html.parser')

	# Create an array of all schedule links.
	links = soup.select('.route_days a')
	if links == []:
		print('Link selection failed.')
	else:
		# Iterate through the array of links and convert each one.
		for link in links:
			url = link.get('href')
			convert(url)

# convert(): takes a specific schedule URL and parses the data,
# creating a proper directory path and saving the data as JSON
# in that location.
def convert(schedule_url):
	# Open the page with schedule data as a Soup object.
	page = requests.get(schedule_url)
	print ('Converting data from %s...' % schedule_url)
	try:
		page.raise_for_status()
	except Exception as exc:
		print('There was a problem with %s: %' % schedule_url, exc)
		continue
	soup = BeautifulSoup(page.text, 'html.parser')

	# Parse route number and assign it to a variable.
	header = soup.select('#sched_top h1')
	route_header = header[0].get_text().split()
	if route_header[0] == "LUCY":
		route = route_header[0]
	else:
		route = route_header[1]

	# Parse destination and assign it to a variable.
	destination = header[0].get_text().split("|")[1].split("to")[1]

	# Parse day of the week and assign it to a variable.
	span = soup.select('#sched_top span')
	day = span[0].get_text().split()[0]

	# Initialize an empty 'stops' array.
	stops = []

	# Get stop headers, and append each one to the stops array
	# as a new dictionary.
	table_headers = soup.find_all("th", scope="col")
	for header in table_headers:
		id = header.span.get_text().split(":")[1]
		name = header.get_text().split("Stop")[0]
		dictionary = {"name": name, "id": id}
		stops.append(dictionary)

	# Create an array containing each column of the schedule.
	columns = soup.table.tbody.find_all("td", height="30px")

	# Loop through the columns array to parse stop times.
	for index, column in enumerate(columns):

		# Separate stop times for a given column and remove
		# most of the extraneous characters.
		times = column.get_text().split(u'\n')[1].split(u'\xa0')

		# Clean stop times that contain em-dashes or are empty.
		correct_times = []
		for time in times:
			clean_times(time, correct_times)

		# Add times array to the corresponding dictionary in the stops array.
		stops[index]["times"] = correct_times

	# Create a dictionary containing route, day, direction, and stops keys.
	# Assign them the values of their variables.
	data = {
		"route": route,
		"destination": destination,
		"day": day,
		"stops": stops
	}

	# Make a directory path for the data using route, day, and direction.
	file_path = os.path.join('schedules', route, day)
	try:
		os.makedirs(file_path)
	except OSError as exc:
		if exc.errno == errno.EEXIST and os.path.isdir(file_path):
			pass
		else:
			raise
	file_name = destination + '.json'
	file_path = os.path.join(file_path, file_name)
	json_file = open(file_path, 'w')
	print('Saving data to %s...' % file_path)

	# Convert data to JSON, dump the file, and close it.
	json_file = open(file_path, 'w')
	json.dump(data, json_file)
	json_file.close()

	print('Done converting %s.' % schedule_url)
	print('-----------------------------------')



# When the parser creates an array out of stop times, it sometimes messes up
# by smashing together em-dashes or including empty times. clean_times()
# fixes those mistakes and returns a corrected array of times.
def clean_times(item, lst):
	# Omit items that are empty.
	if (len(item) == 0):
		return

	# If the time contains an em-dash, separate it and call the function again.
	elif (u'\u2014') in item:
		str1 = item[:1]
		str2 = item[1:]
		lst.append(str1)
		clean_times(str2, lst)

	# If the time looks good, append it to the list.
	else:
		lst.append(item)


# Run the scraper for bus and trolley pages.
scrape('https://www.septa.org/schedules/bus/')
scrape('https://www.septa.org/schedules/trolley/')
