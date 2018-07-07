/// <reference types="node" />
import { Server, IncomingMessage, ServerResponse } from "http";
import { ZlibOptions } from "zlib";
import EventEmitter = require('events');
import Result = require("./result");
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
declare class Router extends EventEmitter implements RouterOptions {
    constructor(options?: RouterOptions);
    static readonly defaultOptions: {
        privateFiles: RegExp[];
        privateDirectories: RegExp[];
        defaultPages: string[];
        contentTypes: Map<string, string>;
        subRouters: string[];
    };
    static readonly SUB_ROUTER_CODE: number;
    static readonly REDIRECT_DIR_CODE: number;
    basePath: string;
    gzipEnabled: boolean;
    deflateEnabled: boolean;
    zlibOptions: ZlibOptions;
    defaultPages: string[];
    privateFiles: RegExp[];
    privateDirectories: RegExp[];
    contentTypes: Map<string, string>;
    subRouters: string[];
    separator: RegExp;
    private _server?;
    readonly server: Server | undefined;
    private _request?;
    readonly request: IncomingMessage | undefined;
    private _response?;
    readonly response: ServerResponse | undefined;
    isPrivateDirectory(dir: string): boolean;
    isPrivateFile(file: string): boolean;
    resolveDefaultPage(dir: string): Result;
    resolveStatic(url: string): Result;
    resolveSubRouter(dir: string): Result;
    resolve(url: string): Result;
    route(url: string): void;
    start(port?: number): this;
    stop(): this;
}
export = Router;
//# sourceMappingURL=index.d.ts.map