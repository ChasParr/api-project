const http = require('http');
const url = require('url');

const query = require('querystring');
const responseHandler = require('./responses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;


const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);

  switch (request.method) {
    case 'GET':
      console.log('GET');
      console.log(parsedUrl.pathname);
      switch (parsedUrl.pathname) {

        case '/':
          responseHandler.getIndex(request, response);
          break;
        case '/style.css':
          responseHandler.getCss(request, response);
          break;
        case '/connect':
          responseHandler.connect(request, response);
          break;
        case '/getUpdate':
          responseHandler.getUpdate(request, response);
          break;
        case '/notReal':
          responseHandler.notFound(request, response);
          break;
        default:
          responseHandler.notFound(request, response);
          break;
      }
      break;
    case 'HEAD':
      console.log('HEAD');
      switch (parsedUrl.pathname) {

        case '/getUpdate':
          responseHandler.getUpdateMeta(request, response);
          break;
        case '/notReal':
          responseHandler.notFoundMeta(request, response);
          break;
        default:
          responseHandler.notFoundMeta(request, response);
          break;
      }
      break;
    case 'POST':
      console.log('POST');
      switch (parsedUrl.pathname) {

        case '/addUser': {
          const res = response;
          const body = [];

          request.on('error', () => {
            res.statusCode = 400;
            res.end();
          });

          request.on('data', (chunk) => {
            body.push(chunk);
          });

          request.on('end', () => {
            const bodyString = Buffer.concat(body).toString();
            const bodyParams = query.parse(bodyString);

            responseHandler.addUser(request, res, bodyParams);
          });
          break; }
        case '/joinRoom': {
          const res = response;
          const body = [];

          request.on('error', () => {
            res.statusCode = 400;
            res.end();
          });

          request.on('data', (chunk) => {
            body.push(chunk);
          });

          request.on('end', () => {
            const bodyString = Buffer.concat(body).toString();
            const bodyParams = query.parse(bodyString);

            responseHandler.joinRoom(request, res, bodyParams);
          });
          break; }
        case '/getRoom': {
          const res = response;
          const body = [];

          request.on('error', () => {
            res.statusCode = 400;
            res.end();
          });

          request.on('data', (chunk) => {
            body.push(chunk);
          });

          request.on('end', () => {
            const bodyString = Buffer.concat(body).toString();
            const bodyParams = query.parse(bodyString);

            responseHandler.getRoom(request, res, bodyParams);
          });
          break; }
        case '/submitPost': {
          const res = response;
          const body = [];

          request.on('error', () => {
            res.statusCode = 400;
            res.end();
          });

          request.on('data', (chunk) => {
            body.push(chunk);
          });

          request.on('end', () => {
            const bodyString = Buffer.concat(body).toString();
            const bodyParams = query.parse(bodyString);

            responseHandler.postMessage(request, res, bodyParams);
          });
          break; }
        default:
          responseHandler.notFound(request, response);
          break;
      }
      break;
    default:
      responseHandler.notFound(request, response);
      break;
  }
};

http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);
