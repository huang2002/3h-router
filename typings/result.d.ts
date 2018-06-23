/// <reference types="node" />
import { ZlibOptions } from "zlib";
import { Writable, Readable } from "stream";
interface ResultOptions {
    code: number;
    url?: string;
    src?: Readable;
}
declare class Result implements ResultOptions {
    constructor(options: ResultOptions);
    readonly code: number;
    readonly url: string | undefined;
    readonly src: Readable | undefined;
    pipe(output: Writable, zip?: 'gzip' | 'deflate', zlibOptions?: ZlibOptions): void;
}
export = Result;
//# sourceMappingURL=result.d.ts.map