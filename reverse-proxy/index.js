// this reverse proxy will redirect the requests 
// on p1.localhost:8000 to p1 folder in S3 bucket

const express = require('express');
const httpProxy = require('http-proxy');

const { config } = require('../config');

const {
    REVERSE_PROXY_PORT,
    S3_BUCKET_TARGET_URL,
} = config;

const app = express();

const proxy = httpProxy.createProxy();
const targetURL = S3_BUCKET_TARGET_URL;

app.use((req, res) => {
    const hostname = req.hostname;
    const project_slug = hostname.split('.')[0];

    return proxy.web(req, res, {target: `${targetURL}/${project_slug}`, changeOrigin: true});
});

proxy.on('proxyReq', (proxyReq, req, res) => {
    if(req.url === '/') {
        proxyReq.path += 'index.html';
    }
});

app.listen(REVERSE_PROXY_PORT, (res, req) => {
    console.log(`Server is running on port ${REVERSE_PROXY_PORT}`);
});