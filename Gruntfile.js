module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      options: {
        predef: ["tank", "Robot", "Jx"],
        curly: true,
        eqeqeq: true,
        eqnull: true,
        browser: true,
        globals: {
          Robot: true
        },
      },
      with_overrides: {
        options: {
          curly: false,
          undef: true,
        },
        files: {
          src: 'src/**/*.js'
        },
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint']);
};