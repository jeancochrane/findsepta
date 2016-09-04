# !Python2.7
#
# schedule_scraper.py is a script for downloading, parsing, and converting
# SEPTA schedule data from HTML tables to JSON.
#
# Since bus and trolley schedules are hosted on two distinct pages, this
# script runs twice – once for each type of vehicle.
#
# Requires requests and bs4 modules.


import requests
import json
import sys
import os
from bs4 import BeautifulSoup


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

	# Loop through the column array to parse stop times.
	for column in columns:

		# TODO: Isolate stop times as a list and create an array.
		times = column.get_text().split(u'\n')[1].split(u'\xa0')

		# TODO: select() all <tr> elements in the column (produces an array).

		# TODO: Append the text from each <tr> element to the 'times' array.

		# TODO: Create a dictionary containing stop, id, and times, and append it to 
		# the stops array.

	# TODO: Create a dictionary containing route, day, direction, and stops keys.
	# Assign them the values of their variables.

	# TODO: Make a directory path for the data using route, day, and direction.

	# TODO: Convert data to JSON, and dump the file.

	print('Done converting %s.' % schedule_url)
	print('-----------------------------------')

	

