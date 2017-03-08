const fs = require('fs');
const crypto = require('crypto');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const css = fs.readFileSync(`${__dirname}/../client/style.css`);

const users = {};
const rooms = {};
let userNum = 1;

let etag = crypto.createHash('sha1').update(JSON.stringify(users));
let digest = etag.digest('hex');


// handle the index page
const getIndex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const getCss = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/css' });
  response.write(css);
  response.end();
};

// send the json object
const respond = (request, response, status, content) => {
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  console.log(content);

  response.writeHead(status, headers);
  response.write(JSON.stringify(content));
  response.end();
};

// send the json header
const respondMeta = (request, response, status) => {
  console.log('b');
  const headers = {
    'Content-Type': 'application/json',
    etag: digest,
  };

  response.writeHead(status, headers);
  response.end();
};

const connect = (request, response) => {
  const responseObj = {
    id: userNum,
  };
  userNum++;
  return respond(request, response, 200, responseObj);
};

// return list of users and rooms
const getUpdate = (request, response) => {
  const responseObj = {
    users,
    rooms,
  };

  if (request.headers['if-none-match'] === digest) {
    return respondMeta(request, response, 304);
  }
  return respond(request, response, 200, responseObj);
};

// return update header
const getUpdateMeta = (request, response) => {
  if (request.headers['if-none-match'] === digest) {
    return respondMeta(request, response, 304);
  }
  return respondMeta(request, response, 200);
};

// add a user
const addUser = (request, response, body) => {
  const responseObj = {
    message: 'Name and id are both required.',
  };
  
  if (!body.name) {
    responseObj.id = 'missingBody';
    return respond(request, response, 400, responseObj);
  }

  if (!body.id) {
    console.log(body['id']);
    responseObj.id = 'missingId';
    return respond(request, response, 400, responseObj);
  }

  let responseCode = 201;

  if (users[body.id]) {
    responseCode = 204;
  } else {
    users[body.id] = {};
  }

  users[body.id].name = body.name;

  etag = crypto.createHash('sha1').update(JSON.stringify(users));
  digest = etag.digest('hex');

  if (responseCode === 201) {
    responseObj.message = 'Created Successfully';
    return respond(request, response, responseCode, responseObj);
  }
  return respondMeta(request, response, responseCode);
};

// add a user
const joinRoom = (request, response, body) => {
  const responseObj = {
    message: 'Name and id are both required.',
  };

  if (!body.name || !body.id) {
    responseObj.id = 'missingParams';
    return respond(request, response, 400, responseObj);
  }

  let responseCode = 201;

  if (rooms[body.name]) {
    responseCode = 204;
  } else {
    rooms[body.name] = { users: {} };
  }

  rooms[body.name].users[body.id] = users[body.id];

  // etag = crypto.createHash('sha1').update(JSON.stringify(rooms));
  // digest = etag.digest('hex');

  if (responseCode === 201) {
    responseObj.message = 'Created Successfully';
    return respond(request, response, responseCode, responseObj);
  }
  return respondMeta(request, response, responseCode);
};

// return not found message
const notFound = (request, response) => {
  const responseObj = {
    message: 'The page you are looking for was not found.',
    id: 'notFound',
  };
  console.log('d');
  return respond(request, response, 404, responseObj);
};

// return not found header
const notFoundMeta = (request, response) => respondMeta(request, response, 404);

module.exports = {
  getIndex,
  getCss,
  connect,
  getUpdate,
  getUpdateMeta,
  addUser,
  joinRoom,
  notFound,
  notFoundMeta,
};
