"use strict";
const defaultOptions = {
    privateFiles: [
        /^package\.json$/i
    ],
    privateDirectories: [
        /^node_modules$/i
    ],
    defaultPages: [
        'index.html',
        'index.htm',
        'default.html',
        'default.htm'
    ],
    contentTypes: new Map([
        ['text', 'text/plain'],
        ['xml', 'text/xml'],
        ['math', 'text/xml'],
        ['xhtml', 'text/xml'],
        ['htm', 'text/html'],
        ['html', 'text/html'],
        ['css', 'text/css'],
        ['csv', 'text/csv'],
        ['js', 'text/javascript'],
        ['json', 'application/json'],
        ['pdf', 'application/pdf'],
        ['zip', 'application/zip'],
        ['gzip', 'application/gzip'],
        ['ogg', 'application/ogg'],
        ['svg', 'image/xml+svg'],
        ['ico', 'image/x-icon'],
        ['gif', 'image/x-gif'],
        ['jpe', 'image/jpe'],
        ['jpeg', 'image/jpeg'],
        ['jpg', 'image/jpg'],
        ['bmp', 'image/x-bmp'],
        ['png', 'image/x-png'],
        ['tif', 'image/x-tiff'],
        ['tiff', 'image/x-tiff'],
        ['mp3', 'audio/mp3'],
        ['wav', 'audio/wav'],
        ['mp4', 'video/mp4'],
        ['avi', 'video/avi']
    ]),
    subRouters: [
        'router.js',
        'route.js',
        'index.js',
        'default.js'
    ]
};
module.exports = defaultOptions;
