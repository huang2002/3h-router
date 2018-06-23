"use strict";
const http_1 = require("http");
const EventEmitter = require("events");
const path = require("path");
const fs = require("fs");
const defaultOptions = require("./defaultOptions");
const Result = require("./result");
const isFile = (url) => fs.statSync(url).isFile();
class Router extends EventEmitter {
    constructor(options = {}) {
        super();
        this.basePath = process.cwd();
        this.gzipEnabled = true;
        this.deflateEnabled = true;
        this.zlibOptions = {};
        this.defaultPages = defaultOptions.defaultPages;
        this.privateFiles = defaultOptions.privateFiles;
        this.privateDirectories = defaultOptions.privateDirectories;
        this.contentTypes = defaultOptions.contentTypes;
        this.subRouters = defaultOptions.subRouters;
        this.separator = /\/|\\/;
        Object.assign(this, options);
    }
    get server() {
        return this._server;
    }
    get request() {
        return this._request;
    }
    get response() {
        return this._response;
    }
    isPrivateDirectory(dir) {
        return this.privateDirectories.some(reg => reg.test(dir));
    }
    isPrivateFile(file) {
        return this.privateFiles.some(reg => reg.test(file));
    }
    resolveDefaultPage(dir) {
        let resultUrl;
        this.defaultPages.some(defaultPage => {
            const defaultPageUrl = path.join(dir, defaultPage);
            if (fs.existsSync(defaultPageUrl)) {
                resultUrl = defaultPageUrl;
                return true;
            }
            else {
                return false;
            }
        });
        return resultUrl ? new Result({ code: 200, url: resultUrl }) : new Result({ code: 404 });
    }
    resolveStatic(url) {
        const dir = path.dirname(url), dirs = dir.split(this.separator), file = path.basename(url);
        if (dirs.some(dir => this.isPrivateDirectory(dir)) || this.isPrivateFile(file)) {
            return new Result({
                code: 403
            });
        }
        else {
            if (fs.existsSync(url)) {
                if (isFile(url)) {
                    return new Result({ code: 200, url });
                }
                else {
                    return this.resolveDefaultPage(url);
                }
            }
            else {
                return this.resolveDefaultPage(dir);
            }
        }
    }
    resolveSubRouter(dir) {
        let subRouterUrl;
        this.subRouters.some(subRouter => {
            const defaultPageUrl = path.join(dir, subRouter);
            if (fs.existsSync(defaultPageUrl)) {
                subRouterUrl = defaultPageUrl;
                return true;
            }
            else {
                return false;
            }
        });
        if (subRouterUrl) {
            try {
                const subRouter = require(path.resolve(subRouterUrl));
                subRouter(this);
                return new Result({ code: 0 });
            }
            catch (err) {
                this.emit('error', err);
                return new Result({ code: 500 });
            }
        }
        else {
            return new Result({ code: 404 });
        }
    }
    resolve(url) {
        const staticResult = this.resolveStatic(url);
        if (staticResult.code !== 200 && fs.existsSync(url) && !isFile(url)) {
            return this.resolveSubRouter(url);
        }
        else {
            return staticResult;
        }
    }
    route(url) {
        const { response } = this, result = this.resolve(path.join(this.basePath, url)), { code } = result;
        this.emit('result', result);
        response.on('close', () => {
            this._response = this._request = undefined;
        });
        if (code === 200) {
            const { contentTypes } = this, { request: { headers } } = this, acceptEncoding = headers['accept-encoding'] || [];
            if (result.url) {
                const ext = path.extname(result.url);
                if (contentTypes.has(ext)) {
                    response.setHeader('Content-Type', contentTypes.get(ext));
                }
            }
            if (acceptEncoding.includes('gzip') && this.gzipEnabled) {
                response.setHeader('Content-Encoding', 'gzip');
                result.pipe(response, 'gzip', this.zlibOptions);
            }
            else if (acceptEncoding.includes('deflate') && this.deflateEnabled) {
                response.setHeader('Content-Encoding', 'deflate');
                result.pipe(response, 'deflate', this.zlibOptions);
            }
            else {
                result.pipe(response);
            }
        }
        else if (code > 0) {
            response.statusCode = code;
            response.end();
        }
    }
    start(port = 80) {
        if (!this._server) {
            this._server = http_1.createServer((request, response) => {
                this._request = request;
                this._response = response;
                const { url } = request;
                if (!this.emit('before', url)) {
                    this.route(url);
                }
            }).on('error', err => {
                if (!this.emit('error', err)) {
                    throw err;
                }
            }).listen(port);
        }
        return this;
    }
    stop() {
        const { _server } = this;
        if (_server) {
            _server.close();
            this._server = undefined;
        }
        return this;
    }
}
Router.defaultOptions = defaultOptions;
module.exports = Router;
