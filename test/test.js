const Router = require('../3h-router'),
    router = new Router(__dirname);
Router.defaultPages.unshift('my-index.html');
router.start(88).on('before', ({ request, stopRouting }) => {
    console.log(`(Before Routing) URL: "${request.url}".`);
    // if (/* need to stop routing */) {
    //     stopRouting(/* status code */);
    // }
}).on('error', err => {
    console.error(err);
});