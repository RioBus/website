# Rio Bus - Website

Web client for Rio Bus, available at http://riob.us/. This client is intended to
work with the Rio Bus API and allows searching for lines, buses or any other
parameters supported by the API.


## Build & development

We use [Grunt](http://gruntjs.com) as our task runner to build the project. You
can install the dependencies using [npm](http://npmjs.com) by running `npm install`.

To run the website locally during development, run `grunt serve`.

To generate the minified assets, use `grunt build --production`. The distribution
version of the website will be placed in the folder 'dist'. To select the
development environment as the API server, simply run `grunt build`. You can add
other environments by customising Gruntfile.js.


## Testing

Running `grunt test` will run the unit tests with karma.after using this give us feedback 
