module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"
    jshint:
      options:
        predef: [
          "tank"
        ]
        curly: false
        undef: true
        eqeqeq: true
        eqnull: true
        browser: true
        globals:
          Jx: true
          Robot: true
      uses_defaults: 
        src: "src/**/*.js"

  grunt.loadNpmTasks "grunt-contrib-jshint"

  grunt.registerTask "default", ["jshint"]