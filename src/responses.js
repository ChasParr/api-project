const fs = require('fs');
const crypto = require('crypto');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const css = fs.readFileSync(`${__dirname}/../client/style.css`);

const data = {};
data.users = {};
data.rooms = {};
data.roomMessages = {};
let userNum = 1;

let etag = crypto.createHash('sha1').update(JSON.stringify(data));
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

  console.log('return:');
  console.log(content);

  response.writeHead(status, headers);
  response.write(JSON.stringify(content));
  response.end();
};

// send the json header
const respondMeta = (request, response, status) => {
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
    allUsers: data.users,
    allRooms: data.rooms,
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

// add a user or change names
const addUser = (request, response, body) => {
  const responseObj = {
    message: 'Name and id are both required.',
  };

  if (!body.name) {
    responseObj.id = 'missingBody';
    return respond(request, response, 400, responseObj);
  }

  if (!body.id) {
    console.log(body.id);
    responseObj.id = 'missingId';
    return respond(request, response, 400, responseObj);
  }

  let responseCode = 201;

  if (data.users[body.id]) {
    responseCode = 204;
  } else {
    data.users[body.id] = {};
    data.users[body.id].id = body.id;
    data.users[body.id].rooms = {};
  }
  data.users[body.id].name = body.name;

  etag = crypto.createHash('sha1').update(JSON.stringify(data));
  digest = etag.digest('hex');

  console.log(data.users);
  if (responseCode === 201) {
    responseObj.message = 'User Created Successfully';
    return respond(request, response, responseCode, responseObj);
  }
  return respondMeta(request, response, responseCode);
};

// create or join a room
const joinRoom = (request, response, body) => {
  const responseObj = {
    message: 'Room name, uid and a username are all required.',
  };

  if (!body.name || !body.id) {
    responseObj.id = 'missingParams';
    return respond(request, response, 400, responseObj);
  }

  if (Object.keys(data.users).indexOf(body.id) === -1) {
    responseObj.id = 'forbidden';
    return respond(request, response, 403, responseObj);
  }

  let responseCode = 201;

  if (data.rooms[body.name]) {
    responseCode = 204;
  } else {
    data.rooms[body.name] = { users: {} };
    data.rooms[body.name].name = body.name;
    data.roomMessages[body.name] = { messages: [] };
    data.roomMessages[body.name].messages.push({ name: data.users[body.id].name, message: `created room ${body.name}` });
  }
  data.rooms[body.name].users[body.id] = data.users[body.id];
  data.users[body.id].rooms[body.name] = body.name;

  etag = crypto.createHash('sha1').update(JSON.stringify(data));
  digest = etag.digest('hex');
  if (responseCode === 201) {
    responseObj.message = 'Room Created Successfully';
    return respond(request, response, responseCode, responseObj);
  }
  return respondMeta(request, response, responseCode);
};

const getRoom = (request, response, body) => {
  const responseObj = {};

  if (!body.name) {
    responseObj.message = 'Room name required.';
    responseObj.id = 'missingParams';
    return respond(request, response, 400, responseObj);
  }

  const responseCode = 200;

  responseObj.roomData = data.roomMessages[body.name];
  return respond(request, response, responseCode, responseObj);
};

const postMessage = (request, response, body) => {
  const responseObj = {
    message: 'Room name, uid and a message are all required.',
  };

  if (!body.name || !body.id || !body.message) {
    responseObj.id = 'missingParams';
    return respond(request, response, 400, responseObj);
  }

  const responseCode = 201;

  if (body.name === 'all') {
    const keys = Object.keys(data.users[body.id].rooms);
    for (let i = 0; i < keys.length; i++) {
      data.roomMessages[keys[i]].messages.push(
      { name: data.users[body.id].name, message: body.message });
    }
  } else if (data.roomMessages[body.name]) {
    data.roomMessages[body.name].messages.push(
    { name: data.users[body.id].name, message: body.message });
  }
  responseObj.message = 'Message posted';

  etag = crypto.createHash('sha1').update(JSON.stringify(data));
  digest = etag.digest('hex');
  return respond(request, response, responseCode, responseObj);
};

// return not found message
const notFound = (request, response) => {
  const responseObj = {
    message: 'The page you are looking for was not found.',
    id: 'notFound',
  };
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
  getRoom,
  postMessage,
  notFound,
  notFoundMeta,
};
