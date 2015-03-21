/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-8-2
 * Time: 下午5:02
 * To change this template use File | Settings | File Templates.
 */
/*global module:false*/
module.exports = function (grunt) {

    var REQUIRE = /require\(('|")([^()<>\\\/|?*:]*)('|")\)/g;
    var COMMENT_RE = /(\/\*(.|[\r\n])*?\*\/)|((\/\/.*))/g;
    /**
     * 配置文件
     */
    var config = grunt.file.readJSON("Config.json"),
    // var config = grunt.file.readJSON("ConfigMobile.json"),
        configFile = config.configFile,
        configVersion = config.config,
        configPath = configVersion.path,
        filePath = {},
        filePathMin = {},
        depslist = {};

    for(var key in configFile){
        if(/(.js)$/.test(key)){
            var depsArr = configFile[key];
            var deps = [];
            for(var i=0;i < depsArr.length;i++){
                deps = deps.concat(getJsPack(depsArr[i]));
                deps.push(depsArr[i]);
            }
            depslist[key] = deps;
            grunt.file.write("deps.json", JSON.stringify(depslist));
            filePath["dist/"+ configVersion.version + "/" + configVersion.publish + "/" + key] = deps
            filePathMin["dist/"+ configVersion.version + "/" + configVersion.publish + "/" + key.replace(/(.js)$/, "-min.js")] = deps
        }
    }

    function getJsPack(filePath){
        var file = grunt.file.read(filePath);
        var deps = [];

        file.toString().replace(COMMENT_RE, '').replace(REQUIRE, function(match, f1, f2, f3){
            f2 = configPath + f2.replace(/\./g, "/") + ".js";
            if(!isArrIn(deps, f2)){
                deps = deps.concat(getJsPack(f2));
                deps.push(f2);
            }
        });
        depslist[filePath] = deps;
        return deps;
    }

    function isArrIn(arr, file){
        var isFileIn = false;
        for(var i=0;i < arr.length;i++){
            if(arr[i] == file){
                isFileIn = true;
                break;
            }
        }
        return isFileIn;
    }
    console.log(filePath);
    grunt.initConfig({
        pkg: '<json:dapeigou.jquery.json>',
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
                '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
                ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        },
        concat: filePath,
        min: filePathMin,
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            my_target: {
                files: filePathMin
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concat', 'uglify']);
};
