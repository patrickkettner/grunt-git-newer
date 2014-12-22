/*
 * grunt-git-newer
 * https://github.com/patrickkettner/grunt-git-newer
 *
 * Copyright (c) 2014 Patrick Kettner
 * Licensed under the MIT license.
 */

'use strict';
var path = require('path');
var exec = require('child_process').exec;
var path = require('path');
var os = require('os');
var fs = require('fs');
var logFileDir = path.normalize(path.join(os.tmpdir(), String(process.pid)));

function _spawnSync(command, args) {
  var stdout = logFileDir + '-stdout';
  var stderr = logFileDir + '-stderr';
  var status = logFileDir + '-status';
  var response = {};

  exec(command + ' ' + args.join(' ') + ' > ' + stdout + ' 2> ' + stderr + '; echo $? > ' + status);

  while (!fs.existsSync(status)) {}

  response.stdout = fs.readFileSync(stdout) || '';
  response.stderr = fs.readFileSync(stderr) || '';
  response.status = parseInt(fs.readFileSync(status));

  try {
    fs.unlinkSync(stdout);
    fs.unlinkSync(stderr);
    fs.unlinkSync(status);
  } catch(e) {}

  return response;
}

_spawnSync = require('child_process').spawnSync || _spawnSync;

function spawnSync(command, args, grunt) {
  var result = _spawnSync(command, args);
  if (result.status !== 0) {
    return grunt.fatal(result.stderr.toString());
  }
  return result.stdout.toString();
}

function createTask(grunt, base, branch) {
  function filterFiles(files, diff) {

    return grunt.file.expand(files).map(function(file) {
      return path.resolve(file);
    }).filter(function(file) {
      return diff.indexOf(file) > -1;
    });
  }

  return function(taskName, targetName) {

    var prefix = this.name;
    var tasks = [];

    if (!targetName) {
      if (!grunt.config(taskName)) {
        grunt.fatal('The "' + prefix + '" prefix is not supported for aliases');
        return;
      }

      Object.keys(grunt.config(taskName)).forEach(function(targetName) {
        if (!/^_|^options$/.test(targetName)) {
          tasks.push(prefix + ':' + taskName + ':' + targetName);
        }
      });
      return grunt.task.run(tasks);
    }

    if (branch === 'master') {
      grunt.task.run(tasks);
    }

    var done = this.async();

    var originalConfig = grunt.config.get([taskName, targetName]);
    var config = grunt.util._.clone(originalConfig);
    var diff = _spawnSync('git', ['diff', '--name-only', 'master']);

    if (diff.status !== 0) {
      diff = _spawnSync('git', ['diff', '--name-only', 'origin/master']);
    }

    if (diff.status !== 0) {
      return grunt.fatal(diff.stderr.toString());
    }

    diff = diff.stdout.toString();

    diff = grunt.util._.compact(diff.split(grunt.util.linefeed)).map(function(file) {
      return base + file;
    });

    if (config.src) {
      config.src = filterFiles(config.src, diff);
    } else if (grunt.util._.isString(config.files)) {
      config.files = filterFiles([config.files], diff).join(',');
    } else if (Array.isArray(config.files) && grunt.util._.isString(config.files[0])) {
      config.files = filterFiles(config.files, diff);
    } else if (grunt.util._.isObject(config.files.src)) {
      config.files.src = filterFiles(config.files.src, diff);
    }

    grunt.config.set([taskName, targetName], config);
    grunt.task.run([taskName + ':' + targetName]);
    done();
  };
}

module.exports = function(grunt) {

  var cdup = spawnSync('git', ['rev-parse', '--show-cdup'], grunt);
  var branch = spawnSync('git', ['rev-parse', '--abbref-rev', 'HEAD'], grunt);
  var base = path.resolve(process.cwd(), cdup).replace(grunt.util.linefeed, '');

  grunt.registerTask( 'git-newer', 'like grunt-newer, but for git-commits' , createTask(grunt, base, branch));
};
