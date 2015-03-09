(function (module) {
    'use strict';

    module.exports = function (grunt) {

        // Project configuration.
        grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            uglify: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                build: {
                    src: 'src/<%= pkg.name %>.js',
                    dest: 'build/<%= pkg.name %>.min.js'
                }
            },
            less: {
                compile: {
                    options: {
                        compress: true
                    },
                    files: {
                        "build/ngWidgets.min.css": "src/ngWidgets.less"
                    }
                }
            }
        });

        // Load the plugin that provides the "uglify" task.
        grunt.loadNpmTasks('grunt-contrib-uglify');
        // Load the plugin that provides the "less" task.
        grunt.loadNpmTasks('grunt-contrib-less');

        // Default task(s).
        grunt.registerTask('default', ['uglify', 'less']);

    };
}(module));

