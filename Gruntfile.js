module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		watch: {
			css: {
				files: '*.css',
				tasks: ['autoprefixer','csslint'],
				options: {
					livereload: true
				}
			},
		
			self: {
				files: 'Gruntfile.js'
			},
		
			js: {
				files: 'src/*.js',
				tasks: ['concat'],
				options: {
					livereload: true
				}

			},

			static: {
				files: '**/*.{html,png,jpg,svg,json,geojson,ai}',
				options: {
					livereload: true
				}
			}
		},

		concat: {
			options: {
				sourceMap: true
			},
			dist: {
				src: ['src/Route.js', 'src/Map.js', 'src/Tracker.js'],
				dest: 'scripts.js'
			}
		},

		jshint: {
			beforeconcat: ['src/*.js'],
			afterconcat: ['scripts.js']
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
				src: 'styles.css'
			}
		}
	});

	grunt.registerTask('default', ['watch']);
};

