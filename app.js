var http = require("http");
var url = require('url');
var fs = require('fs');
var io = require('socket.io'); // 加入 Socket.IO
var dateFormat = require('dateFormat');

var server = http.createServer(function(request, response) {
  //console.log('Connection');
  var path = url.parse(request.url).pathname;
  
  switch (path) {
    case '/':
        fs.readFile(__dirname + '/index.html', function(error, data) {
            if (error){
              response.writeHead(404);
              response.write("opps this doesn't exist - 404");
            } else {
              response.writeHead(200, {"Content-Type": "text/html"});
              response.write(data, "utf8");
            }
            response.end();
          });
      break;
    default:
      response.writeHead(404);
      response.write("opps this doesn't exist - 404");
      response.end();
      break;
  }
});

var cidtail = 0;
var contractMap = new Map();
var userMap = new Map();

server.listen(8000);
var serv_io = io.listen(server); // 開啟 Socket.IO 的 listener
serv_io.sockets.on('connection', function(socket) {
    socket.on('addCont', function(data) {
      data = JSON.parse(data);
      var usera = data.usera;
      var userb = data.userb;
      var cont = data.contstr;
      addCont(usera, userb, cont);
    });
    socket.on('getContList', function(data) {
      data = JSON.parse(data);
      var user = data.user;
      socket.emit('getContList', {'contListStr': ""+getContList(user)});
      console.log( getContList(user));
    });
    socket.on('confirm', function(data) {
      data = JSON.parse(data);
      var user = data.user;
      confirm(user);
    });
    socket.on('signature', function(data) {
      data = JSON.parse(data);
      var user = data.user;
      var sign = data.sign;
      signature(user, sign);
    });
});

function addCont(usera, userb, cont){
  var contractId = cidtail++;
  var json = {'usera' : usera, 'userb' : userb, 'cont': cont, 'comfa' : true, 'comfb' : false, 'signa' : '', 'signb' : ''};
  contractMap.set(contractId, json);
  if(userMap.get(usera)==undefined)userMap.set(usera,[]);
  if(userMap.get(userb)==undefined)userMap.set(userb,[]);
  var useraarr = userMap.get(usera); useraarr.push(contractId);
  var userbarr = userMap.get(userb); userbarr.push(contractId);
  userMap.set(usera, useraarr);
  userMap.set(userb, userbarr);
  console.log(json);
  return contractId;
}

function getCont(cid){
  return contractMap.get(cid);
}
function setCont(cid, contract){
  contractMap.set(cid, contract);
}
function confirm(cid, uid){
  var contract = getCont(cid);
  if(contract.usera==uid)contract.comfa = true;
  if(contract.userb==uid)contract.comfb = true;
  setCont(cid, contract);
}
function signature(cid, uid, sign){
  var contract = getCont(cid);
  if(contract.usera==uid)contract.signa = sign;
  if(contract.userb==uid)contract.signb = sign;
  setCont(cid, contract);
}
function getContList(uid){
  return userMap.get(uid);
}
function randomId(){
  return Math.floor(Math.random() * 9000) + 1000;
}