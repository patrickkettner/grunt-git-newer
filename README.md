# grunt-git-newer

like grunt-newer, but for git-commits

It will filter your `config.src` (or `config.files`, or `config.files.src`...) down to just the ones that have changed between the current branch and master.
If you are on master, it will test all of the files.

## Configuration

As of now, there is no options. All you need to do is load the task, and prepend your task names with `git-newer`

So instead of

```javascript
 grunt.registerTask('default', ['mocha']);
```

you can use

```javascript
 grunt.registerTask('default', ['git-newer:mocha']);
```

## Release History
1.0.0 - Initial Release
1.0.2 - Swap out synchronous spawn module, add branch name fallback for master

## License
Copyright (c) 2014 Patrick Kettner. Licensed under the MIT license.
