const { createProxyMiddleware } = require('http-proxy-middleware');

// const apiUrl = 'http://localhost:8080';
const apiUrl = 'http://52.79.64.97:19490';

module.exports = function(app) {
    console.log('setupProxy');
    app.use(
        // '/admin',
        '/tntnadmin',
        createProxyMiddleware({ 
            target : apiUrl,
            changeOrigin: true,
        })
    );
};