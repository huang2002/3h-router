import { createServer, Server, IncomingMessage, ServerResponse } from "http";
import { ZlibOptions } from "zlib";
import EventEmitter = require('events');
import path = require('path');
import fs = require('fs');
import defaultOptions = require("./defaultOptions");
import Result = require("./result");

const isFile = (url: string) => fs.statSync(url).isFile();

type SubRouterExport = (router: Router) => void;

interface RouterOptions {
    basePath?: string;
    gzipEnabled?: boolean;
    deflateEnabled?: boolean;
    zlibOptions?: ZlibOptions;
    defaultPages?: string[];
    privateFiles?: RegExp[];
    privateDirectories?: RegExp[];
    contentTypes?: Map<string, string>;
    subRouters?: string[];
    separator?: string | RegExp;
}

interface Router {
    on(event: 'before', listener: (url?: string) => void): this;
    emit(event: 'before', url?: string): boolean;
    on(event: 'error', listener: (err: Error) => void): this;
    emit(event: 'error', err: Error): boolean;
    on(event: 'result', listener: (result: Result) => void): this;
    emit(event: 'result', result: Result): boolean;
}

class Router extends EventEmitter implements RouterOptions {

    constructor(options: RouterOptions = {}) {
        super();
        Object.assign(this, options);
    }

    static readonly defaultOptions = defaultOptions;

    basePath = process.cwd();
    gzipEnabled = true;
    deflateEnabled = true;
    zlibOptions: ZlibOptions = {};
    defaultPages = defaultOptions.defaultPages;
    privateFiles = defaultOptions.privateFiles;
    privateDirectories = defaultOptions.privateDirectories;
    contentTypes = defaultOptions.contentTypes;
    subRouters = defaultOptions.subRouters;
    separator = /\/|\\/;

    private _server?: Server;
    get server() {
        return this._server;
    }

    private _request?: IncomingMessage;
    get request() {
        return this._request;
    }

    private _response?: ServerResponse;
    get response() {
        return this._response;
    }

    isPrivateDirectory(dir: string) {
        return this.privateDirectories.some(reg => reg.test(dir));
    }
    isPrivateFile(file: string) {
        return this.privateFiles.some(reg => reg.test(file));
    }

    resolveDefaultPage(dir: string) {
        let resultUrl: string | undefined;
        this.defaultPages.some(defaultPage => {
            const defaultPageUrl = path.join(dir, defaultPage);
            if (fs.existsSync(defaultPageUrl)) {
                resultUrl = defaultPageUrl;
                return true;
            } else {
                return false;
            }
        });
        return resultUrl ? new Result({ code: 200, url: resultUrl }) : new Result({ code: 404 });
    }
    resolveStatic(url: string) {
        const dir = path.dirname(url),
            dirs = dir.split(this.separator),
            file = path.basename(url);
        if (dirs.some(dir => this.isPrivateDirectory(dir)) || this.isPrivateFile(file)) {
            return new Result({
                code: 403
            });
        } else {
            if (fs.existsSync(url)) {
                if (isFile(url)) {
                    return new Result({ code: 200, url });
                } else {
                    return this.resolveDefaultPage(url);
                }
            } else {
                return this.resolveDefaultPage(dir);
            }
        }
    }
    resolveSubRouter(dir: string) {
        let subRouterUrl: string | undefined;
        this.subRouters.some(subRouter => {
            const defaultPageUrl = path.join(dir, subRouter);
            if (fs.existsSync(defaultPageUrl)) {
                subRouterUrl = defaultPageUrl;
                return true;
            } else {
                return false;
            }
        });
        if (subRouterUrl) {
            try {
                const subRouter = require(path.resolve(subRouterUrl)) as SubRouterExport;
                subRouter(this);
                return new Result({ code: 0 });
            } catch (err) {
                this.emit('error', err);
                return new Result({ code: 500 });
            }
        } else {
            return new Result({ code: 404 });
        }
    }
    resolve(url: string) {
        const staticResult = this.resolveStatic(url);
        if (staticResult.code !== 200 && fs.existsSync(url) && !isFile(url)) {
            return this.resolveSubRouter(url);
        } else {
            return staticResult;
        }
    }

    route(url: string) {
        const { response } = this as { response: ServerResponse },
            result = this.resolve(path.join(this.basePath, url)),
            { code } = result;
        this.emit('result', result);
        response.on('close', () => {
            this._response = this._request = undefined;
        });
        if (code === 200) {
            const { contentTypes } = this,
                { request: { headers } } = this as { request: IncomingMessage },
                acceptEncoding = headers['accept-encoding'] || [];
            if (result.url) {
                const ext = path.extname(result.url);
                if (contentTypes.has(ext)) {
                    response.setHeader('Content-Type', contentTypes.get(ext) as string);
                }
            }
            if (acceptEncoding.includes('gzip') && this.gzipEnabled) {
                response.setHeader('Content-Encoding', 'gzip');
                result.pipe(response, 'gzip', this.zlibOptions);
            } else if (acceptEncoding.includes('deflate') && this.deflateEnabled) {
                response.setHeader('Content-Encoding', 'deflate');
                result.pipe(response, 'deflate', this.zlibOptions);
            } else {
                result.pipe(response);
            }
        } else if (code > 0) {
            response.statusCode = code;
            response.end();
        }
    }

    start(port = 80) {
        if (!this._server) {
            this._server = createServer((request, response) => {
                this._request = request;
                this._response = response;
                const { url } = request;
                if (!this.emit('before', url)) {
                    this.route(url as string);
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

export = Router;
