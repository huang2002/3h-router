"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const fs_1 = __importDefault(require("fs"));
const zlib_1 = require("zlib");
class Result {
    constructor(options) {
        Object.assign(this, options);
        const { url, src } = this;
        if (url && !src) {
            this.src = fs_1.default.createReadStream(url);
        }
    }
    pipe(output, zip, zlibOptions) {
        const { src } = this;
        let ans = src;
        if (zip === 'gzip') {
            ans = src.pipe(zlib_1.createGzip(zlibOptions));
        }
        else if (zip === 'deflate') {
            ans = src.pipe(zlib_1.createDeflate(zlibOptions));
        }
        ans.pipe(output);
    }
}
module.exports = Result;
