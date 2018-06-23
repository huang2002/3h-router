import fs from "fs";
import { createGzip, createDeflate, ZlibOptions } from "zlib";
import { Writable, Readable } from "stream";

interface ResultOptions {
    code: number;
    url?: string;
    src?: Readable;
}

class Result implements ResultOptions {

    constructor(options: ResultOptions) {
        Object.assign(this, options);
        const { url, src } = this;
        if (url && !src) {
            this.src = fs.createReadStream(url);
        }
    }

    readonly code!: number;
    readonly url!: string | undefined;
    readonly src!: Readable | undefined;

    pipe(output: Writable, zip?: 'gzip' | 'deflate', zlibOptions?: ZlibOptions) {
        const { src } = this as { src: Readable };
        let ans: Readable = src;
        if (zip === 'gzip') {
            ans = src.pipe(createGzip(zlibOptions));
        } else if (zip === 'deflate') {
            ans = src.pipe(createDeflate(zlibOptions));
        }
        ans.pipe(output);
    }

}

export = Result;
