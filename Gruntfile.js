module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	var spawn = require('child_process').spawn;
	var opener = require('opener');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		watch: {
			css: {
				files: '*.css',
				tasks: ['postcss','csslint'],
				options: {
					livereload: true
				}
			},
		
			self: {
				files: 'Gruntfile.js'
			},
		
			js: {
				files: 'scripts/*.js',
				tasks: ['jshint'],
				options: {
					livereload: true
				}

			},

			other: {
				files: '**/*.{html,png,jpg,svg,json,geojson,ai,map}',
				options: {
					livereload: true
				}
			}
		},

		jshint: {
			src: 'scripts/*.js'
		},

		csslint: {
			src: ['*.css']
		},

		postcss: {
			options: {
				map: true,
                processors: [
                    require('autoprefixer')({
                        browsers: ['last 2 versions']
                    })
                ]
			},

			dist: {
				src: 'styles.css',
				dest: 'styles-prefixed.css'
			}
		},

		processhtml: {
			dist: {
				files: {
					'dist/index.html': ['index.html']
				}
			}
		},

		uglify: {
			options:{
				compress: {
					drop_console: true
				}
			},
			js: {
				files: {
					'dist/scripts.min.js': ['scripts/*.js']
				}
			}
		},

		clean: ['dist', '*.map'],

		copy: {
			dist: {
				files: [
					{src: ['assets/**'], dest: 'dist/'},
					{src: ['*.html', 'styles-prefixed.css'], dest: 'dist/'},
					{src: ['about/**'], dest: 'dist/'}
				]
			}
		},	

		replace: {
			python: {
				src: ['app.py'],
				dest: 'dist/app.py',
				replacements: [
					{from: /# DEV([\s\S]*?)# ENDDEV/g, to: ""},
					{from: /# BUILD\n# ([\s\S]*?)# ENDBUILD/g, to: "$1"}
				]
			}
		}

	});

	grunt.registerTask('app', function() {
		var server = spawn('python', ['app.py'])
			.on('error', function(err) {
				throw err;
			});

        server.stdout.on('data', grunt.log.write);
        server.stderr.on('data', grunt.log.write);

        server.on('close', function(code) {
	        grunt.log.write('exit code: ' + code + '\n');
        });
        opener('http://127.0.0.1:8000');
	});

	grunt.registerTask('serve', ['app', 'watch']);
	grunt.registerTask('build', ['clean', 'jshint', 'csslint', 'postcss', 'copy', 'processhtml', 'uglify', 'replace']);
	grunt.registerTask('default', ['serve']);
};

