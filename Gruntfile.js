module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);

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
				src: 'styles.css'
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
					{src: ['*.css'], dest: 'dist/'},
					{src: ['about/**'], dest: 'dist/'}
				]
			}
		}

	});

	grunt.registerTask('default', ['watch']);
	grunt.registerTask('dist', ['clean', 'jshint', 'csslint', 'postcss', 'copy', 'processhtml', 'uglify']);
};

