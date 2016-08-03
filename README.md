# septa_tracker
A web app for geolocating SEPTA buses and trolleys in Philadelphia.

##Development
Requires Python 2.7, pip, node.js, and npm.

Run `npm install` in the directory, then `pip install -r requirements.txt`.

To watch files for changes and start a local webserver, run `grunt` or `grunt serve`. Changes to the bottle app will automatically restart the server. To automatically reload js/css/html changes in the browser, install the [livereload extension](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei) and click the extension icon while the `watch` task is running.

To build for distribution, use `grunt build`. Clean up with `grunt clean`.
