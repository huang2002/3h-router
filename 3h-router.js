/**
 * @file 3h-router.js
 * @author 3h
 */

const http = require('http'),
    EventEmitter = require('events'),
    fs = require('fs'),
    zlib = require('zlib'),
    path = require('path');

/**
 * @description The constructor of routers.
 * @event before Before routing events. (The listener will receive an object: { request: IncomingMessage, response: SeverResponse, stopRouting: (code: number) => void }. Call stopRouting to stop the routing with that code, and the response will not be ended if the code is not a number.)
 * @event error Error events. (The listeners will receive the error and maybe do something with it, and if there is no listeners to deal with the error, it will be just logged to console. By the way, the response will be finished with status code 500.)
 */
class Router extends EventEmitter {
    /**
     * @description To construct the router.
     * @param {string?} root The root directory.
     */
    constructor(root) {
        super();
        this.root = root || '';
        this.sever = null; // The sever object.
    }
    /**
     * @description To start the router.
     * @param {number} port The port to listen on.
     * @returns {Router} The router ifself.
     */
    start(port) {
        this.sever = http.createServer((req, res) => {
            let code = null,
                flag = true;
            res = extend(req, res);
            this.emit('before', {
                request: req,
                response: res,
                stopRouting: code => {
                    flag = false;
                    code = code;
                }
            });
            if (flag) {
                const url = this.root + req.url.split(/\?|#/)[0],
                    base = path.basename(url),
                    ext = path.extname(url);
                let dir;
                if (ext) {
                    dir = url.slice(0, -base.length);
                } else {
                    dir = url;
                    if (!/(?:\/|\\)$/.test(dir[dir.length - 1])) {
                        dir += path.sep;
                    }
                }
                if (ext && privateFiles.some(f => f.test(base))) {
                    endWithCode(403, req, res);
                } else {
                    fs.exists(url, exists => {
                        if (exists) {
                            if (ext) {
                                endWithFile(url, req, res).catch(err => {
                                    if (!this.emit('error', err)) {
                                        console.error(err);
                                    }
                                });
                            } else {
                                if (privateDirectories.some(d => d.test(dir))) {
                                    endWithCode(403, req, res);
                                } else {
                                    routeDirectory(dir, req, res).catch(err => {
                                        if (!this.emit('error', err)) {
                                            console.error(err);
                                        }
                                    });
                                }
                            }
                        } else {
                            endWithCode(404, req, res);
                        }
                    });
                }
            } else {
                if (typeof code === 'number') {
                    endWithCode(code, req, res);
                }
            }
        }).on('error', err => {
            if (!this.emit('error', err)) {
                console.error(err);
            }
        }).listen(88);
        return this;
    }
    /**
     * @description To stop it.
     */
    stop() {
        this.sever.close();
    }
}

/**
 * @description To extend the res.
 * @param {IncomingMessage} req The request object.
 * @param {SeverResponse} res The response object.
 * @returns {SeverResponse} The response object.
 */
const extend = Router.extend = (req, res) => {
    res.routeDirectory = dir => routeDirectory(dir, req, res);
    res.routeDefaultPages = dir => routeDefaultPages(dir, req, res);
    res.endWithFile = url => endWithFile(url, req, res);
    res.endWithJson = obj => endWithJson(obj, req, res);
    res.endWithCode = code => endWithCode(code, req, res);
    res.redirect = url => redirect(url, req, res);
    return res;
};

/**
 * @description To route the directory.
 * @param {string} dir The directory.
 * @param {IncomingMessage} req The request object.
 * @param {SeverResponse} res The response object.
 * @returns {Promise} A promise resolve on success and reject on error.
 */
const routeDirectory = Router.routeDirectory = (dir, req, res) => {
    return new Promise((resolve, reject) => {
        const subRt = dir + Router.subRouter;
        fs.exists(subRt, exists => {
            if (exists) {
                try {
                    const cb = require(subRt);
                    cb(req, res);
                    resolve();
                } catch (err) {
                    endWithCode(500, req, res);
                    reject(err);
                }
            } else {
                routeDefaultPages(dir, req, res).then(resolve, reject);
            }
        });
    });
};

/**
 * @description To route the default pages in the directory.
 * @param {string} dir The directory.
 * @param {IncomingMessage} req The request object.
 * @param {SeverResponse} res The response object.
 * @returns {Promise} A promise resolve on success and reject on error.
 */
const routeDefaultPages = Router.routeDefaultPages = (dir, req, res) => {
    return new Promise((resolve, reject) => {
        let curIndex = 0;
        const len = defaultPages.length,
            next = () => {
                if (curIndex < len) {
                    const curUrl = dir + defaultPages[curIndex];
                    fs.exists(curUrl, exists => {
                        if (exists) {
                            endWithFile(curUrl, req, res).then(resolve, reject);
                        } else {
                            curIndex++;
                            next();
                        }
                    });
                } else {
                    endWithCode(404, req, res);
                }
            };
        next();
    });
};

/**
 * @description To end the response with a file.
 * @param {string} url The url of the file.
 * @param {IncomingMessage} req The request object.
 * @param {SeverResponse} res The response object.
 * @returns {Promise} A promise resolve on success and reject on error.
 */
const endWithFile = Router.endWithFile = (url, req, res) => {
    return new Promise((resolve, reject) => {
        fs.readFile(url, (err, data) => {
            if (err) {
                endWithCode(500, req, res);
                reject(err);
            } else {
                const ext = path.extname(url).slice(1);
                if (ext in types) {
                    res.setHeader('Content-Type', types[ext]);
                }
                if (Router.gzipEnabled && req.headers['accept-encoding'].includes('gzip')) {
                    zlib.gzip(data, (e, d) => {
                        if (e) {
                            endWithCode(500, req, res);
                            reject(e);
                        } else {
                            res.setHeader('Content-Encoding', 'gzip');
                            res.end(d);
                            resolve();
                        }
                    });
                } else {
                    res.end(data);
                    resolve();
                }
            }
        });
    });
};

/**
 * @description To end the response with a json string.
 * @param {Object} obj The object to stringify.
 * @param {IncomingMessage} req The request object.
 * @param {SeverResponse} res The response object.
 * @returns {Promise} A promise resolve on success and reject on error.
 */
const endWithJson = Router.endWithJson = (obj, req, res) => {
    return new Promise((resolve, reject) => {
        try {
            const str = JSON.stringify(obj);
            res.setHeader('Content-Type', types.json);
            if (Router.gzipEnabled && req.headers['accept-encoding'].includes('gzip')) {
                zlib.gzip(str, (e, d) => {
                    if (e) {
                        endWithCode(500, req, res);
                        reject(e);
                    } else {
                        res.setHeader('Content-Encoding', 'gzip');
                        res.end(d);
                        resolve();
                    }
                });
            } else {
                res.end(str);
                resolve();
            }
        } catch (err) {
            endWithCode(500, req, res);
            reject(err);
        }
    });
};

/**
 * @description To end the response with that code.
 * @param {number} code The status code.
 * @param {IncomingMessage} req The request object.
 * @param {SeverResponse} res The response object.
 */
const endWithCode = Router.endWithCode = (code, req, res) => {
    res.writeHead(code, {
        'Content-Type': 'text/html'
    });
    res.end(
        code in codeMessages ?
            codeMessages[code] :
            `<h1>Something bad happended!</h1><p>Status Code: ${code}</p>`
    );
};

/**
 * @description To redirect to that url.
 * @param {string} url The target url.
 * @param {IncomingMessage} req The request object.
 * @param {SeverResponse} res The response object.
 */
const redirect = Router.redirect = (url, req, res) => {
    res.writeHead(302, {
        'Location': url
    });
    res.end();
};

/**
 * @description The types that match the extensions of files.
 * @type {[ext: string]: string} ext->type
 */
const types = Router.types = {
    text: 'text/plain',
    xml: 'text/xml',
    math: 'text/xml',
    xhtml: 'text/xml',
    htm: 'text/html',
    html: 'text/html',
    css: 'text/css',
    csv: 'text/csv',
    js: 'application/javascript',
    json: 'application/json',
    pdf: 'application/pdf',
    zip: 'application/zip',
    gzip: 'application/gzip',
    ogg: 'application/ogg',
    svg: 'image/xml+svg',
    ico: 'image/x-icon',
    gif: 'image/x-gif',
    jpe: 'image/jpe',
    jpeg: 'image/jpeg',
    jpg: 'image/jpg',
    bmp: 'image/x-bmp',
    png: 'image/x-png',
    tif: 'image/x-tiff',
    tiff: 'image/x-tiff',
    mp3: 'audio/mp3',
    wav: 'audio/wav',
    mp4: 'video/mp4',
    avi: 'video/avi'
};

/**
 * @description The messages of the status codes.
 * @type {[code: string]: string} code->message
 */
const codeMessages = Router.codeMessages = {
    200: '',
    404: '<h1>404 - Not Found!</h1>',
    403: '<h1>403 - Forbidden!</h1>',
    500: '<h1>500 - Internal Error!</h1>'
};

/**
 * @description The default pages. (Will route the default pages in that order.)
 * @type {string[]} An array of strings.
 */
const defaultPages = Router.defaultPages = [
    'index.html',
    'index.htm',
    'default.html',
    'default.htm'
];

/**
 * @typedef {(req, res) => void} SubRoutingFunction The function sub-router script must export.
 * @description The sub-router will manage the routing. That script must export a SubRoutingFunction. (Main router's routing stops here.)
 * @type {string} The file name of the sub-router.
 */
Router.subRouter = 'sub-router.js';

/**
 * @description Whether to enable gzip.
 * @type {boolean}
 */
Router.gzipEnabled = true;

/**
 * @description The private file that shouldn't be visited.
 * @type {RegExp[]} An array of strings.
 */
const privateFiles = Router.privateFiles = [
    /package(?:-lock)?\.json/i,
    /private/i,
    /route/i
];

/**
 * @description The private directories that shouldn't be visited.
 * @type {RegExp[]} An array of strings.
 */
const privateDirectories = Router.privateDirectories = [
    /private/i,
    /node_modules/i
];

module.exports = Router;
