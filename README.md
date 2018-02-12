# 3h-router

> A simple router.

## Install

```
$ npm install 3h-router
```

## Features

- Gzip is enabled.
- Private files/directories can be forbidden.
- Main router & sub-routers.

## Example

### main router

```javascript
const Router = require('3h-router'),
    router = new Router(__dirname);
Router.defaultPages.unshift('my-index.html');
router.start(88).on('before', ({ request, stopRouting }) => {
    console.log(`(Before Routing) URL: "${request.url}".`);
    if (needToStopRouting) {
        stopRouting(statusCode); // Or, don't pass the code to it to prevent the router from ending the response.
    }
}).on('error', err => {
    console.error(err);
});
```

### sub-router

```javascript
const Router = require('3h-router');
module.exports = (req, res) => {
    // ... (Do something with the request here.)
    // Finish routing.
    Router.endWithFile(
        __dirname + '/some-file.html',
        req, res
    ).catch(console.error);
    // Or:
    // res.writeHead(200, {
    //     'Content-Type': 'text/html'
    // });
    // res.end('<h1>Some data here.</h1>');
};
```

## How it works

Here's the *simplified code*:

```javascript
try {
    if (exists) {
        if (isDir) {
            if (isPrivateDir) {
                endWithCode(403);
            } else {
                if (hasSubRouter) {
                    callSubRouter();
                } else {
                    if (hasDefaultPage) {
                        showDefaultPage();
                    } else {
                        endWithCode(404);
                    }
                }
            }
        } else {
            if (isPrivateFile) {
                endWithCode(403);
            } else {
                endWithThatFile();
            }
        }
    } else {
        endWithCode(404);
    }
} catch (err) {
    endWithCode(500);
}
```

## API

( There're **detailed comments** available in `3h-router.js`, so you can also read the comments in that file to learn how to use it. )

- Router(root) - *The main constructor which you can employ to create a router just by passing the root directory to it.*
    - Router.types - *An object that tells how to match content-types with the extensions of files.*
    - Router.defaultPages - *An array that contains the default pages.*
    - Router.codeMesssages - *An object that tells how to match messages with different status codes.*
    - Router.privateFiles - *An array of RegExp that contains the private files.*
    - Router.privateDirectories - *An array of RegExp that contains the private directories.*
    - Router.gzipEnabled - *Whether to enable gzip.*
    - Router.subRouter - *A string that tells the name of sub-router files.*
    - Router.routeDirectory(dir, req, res) - *Call this to route in the given directory.*
    - Router.routeDefaultPages(dir, req, res) - *Call this to route the default pages in the given directory.*
    - Router.endWithFile(url, req, res) - *Call this to end the response with the content of the given file.*
    - Router.endWithJson(obj, req, res) - *Call this to end the response with a json string.*
    - Router.endWithCode(code, req, res) - *Call this to end the response with that code.*
    - Router.redirect(url, req, res) - *Call this to redirect to that url.*
- router - *( Any instance of Router. )*
    - Event: "before" - *Before routing.*
    - Event: "error" - *When error appears.*
    - router.start(port) - *Call this to start routing. (The sever will listen on that given port.)*
    - router.stop() - *Call this to stop it.*

## ps

- Absolute pathes are recommended.
- Tell me the issues if you find any.
