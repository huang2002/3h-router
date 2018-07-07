const Router = require('../dist/index');

const PORT = 88;

const router = new Router({
    basePath: __dirname
});

router.on('before', url => {
    router.route(url);
    console.log(url);
}).on('result', result => {
    console.log(result.code);
}).on('error', console.error);

console.log(`Server started on port ${PORT}.`);

router.start(PORT);
