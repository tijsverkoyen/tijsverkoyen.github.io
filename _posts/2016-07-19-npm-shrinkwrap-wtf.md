---
layout: post
title:  "npm shrinkwrap WTF?"
date:   2016-07-19 09:37:00
image:  2016-07-19-npm-shrinkwrap-wtf.gif
comments: true
---
I really like package-managers, I think they help a lot of developers save time and make it a lot easier to use existing 
packages instead of writing another (crappy) implementation of something trivial.

Package managers also help people to not have a shitload of not-important code in their source-control.

But all of this depends on how the dependency manager is implemented. At this point I think `npm` is one of the most
idiotic and stupid systems around. I am aware that this is a bold statement, and probably not everyone will agree with
me. But let me explain some of the problems I have with `npm`.


## Dependencies of packages

Each package can/will have his own dependencies, and this is a good thing. But take a look at the following `package.json`:

    {
      "dependencies": {
        "babel-code-frame": "6.11.0",
        "js-tokens": "1.0.0",
        "loose-envify": "1.2.0"
      }
    }

<small>Remark: I know the versions are fixed, but this is an example to prove my point.</small>

If you run `npm install` you will end up with **3** versions of the `js-tokens`-package:

* `node_modules/babel-code-frame/node_modules/js-tokens`, which is version: 2.0.0
* `node_modules/js-tokens: version`, which is version: 1.0.0
* `node_modules/loose-envify/node_modules/js-tokens`, which is version: 1.0.3

Not only will the 3 versions of the js-tokens introduce issues at some point, but it also uses 7.9 MB on the diskspace, 
while I just required 3 (simple) packages ...

This is not only the fault of the `npm`-maintainers, a big part of this issue is the responsibility of package-maintainers.
If every maintainer uses [SemVer](http://semver.org/), and use correct version-constraints in their `package.json`-file, 
most installed packages will be re-used and not installed specific for a package as this is available in `npm`.

In my opinion, you should not be able to use different versions of the same package in a project. I think this better 
detected by [Composer](https://getcomposer.org/), but they have the "benefit" that the same namespace can only be used once.

## Locking version (`npm shrinkwrap`)

Locking versions is something you want to do if you know everything works, so you do not run into unpleasant surprises
when you just have deployed your "working" version to production and some rare bug in a patch-release messes everything up.

Therefore `npm` has [`npm shrinkwrap`](https://docs.npmjs.com/cli/shrinkwrap). This will generate a file called 
`npm-shrinkwrap.json`, wherein all the specific installed versions are stored.

With this you are sure you will have all the same versions of the depencies every time you install them, even across 
machines.

But there is a very big problem with it. So have a look at the `package.json`-file below:

    {
      "dependencies": {
        "bootstrap-sass": "^3.3.6"
      },
      "devDependencies": {
        "node-sass": "^3.8.0"
      }
    }

So we run `npm install; npm shrinkwrap`, because we can't shrinkwrap without installing first. We will end up with a 
`npm-shrinkwrap.json`-file which contains:

    {
      "dependencies": {
        "abbrev": {
          "version": "1.0.9",
          "from": "abbrev@>=1.0.0 <2.0.0",
          "resolved": "https://registry.npmjs.org/abbrev/-/abbrev-1.0.9.tgz"
        },
        "ansi-regex": {
          "version": "2.0.0",
          "from": "ansi-regex@>=2.0.0 <3.0.0",
          "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-2.0.0.tgz"
        },
        ...
        "bootstrap-sass": {
          "version": "3.3.6",
          "from": "bootstrap-sass@>=3.3.6 <4.0.0",
          "resolved": "https://registry.npmjs.org/bootstrap-sass/-/bootstrap-sass-3.3.6.tgz"
        },
        ...
        "yargs": {
          "version": "4.8.1",
          "from": "yargs@>=4.7.1 <5.0.0",
          "resolved": "https://registry.npmjs.org/yargs/-/yargs-4.8.1.tgz"
        },
        "yargs-parser": {
          "version": "2.4.1",
          "from": "yargs-parser@>=2.4.1 <3.0.0",
          "resolved": "https://registry.npmjs.com/yargs-parser/-/yargs-parser-2.4.1.tgz",
          "dependencies": {
            "camelcase": {
              "version": "3.0.0",
              "from": "camelcase@>=3.0.0 <4.0.0",
              "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-3.0.0.tgz"
            }
          }
        }
      }
    }


As you can see there are a lot of packages included that in reality are dependencies of the `node-sass`-package. So if we
commit our `npm-shrinkwrap.json`-file into our version control system, and on deploy the `npm install --production` is 
executed, the shrinkwrap-file is used, so all the dependencies of the `node-sass`-package are installed but are just useless.

I know this can be resolved by running `npm install --production; npm shrinkwrap` instead at the start of the project. 
And you should keep this in mind, when you are developing (aka: installed dev-dependencies) and installing new packages.

In my opinion this makes working with the shrinkwrap-files just really hard. Once again I think `npm` should take a look
at how [Composer](https://getcomposer.org/) works by separating the packages into production and development in the
shrinkwrap-file.

<br />

To conclude this rant. I really think `npm` is here to stay and will mature in the future, until the problems above are
resolved I will work around those issues but I really hope they will be resolved soon.
