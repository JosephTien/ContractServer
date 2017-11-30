var http = require("http");
var url = require('url');
var fs = require('fs');
var io = require('socket.io'); // 加入 Socket.IO
//var dateFormat = require('dateformat');
var express = require('express');

var PORT = process.env.PORT || 8080;

var INDEX = __dirname + '/index.html';
var server = express()
.use((req, res) => res.sendFile(INDEX) )
.listen(PORT, () => console.log(`Listening on ${ PORT }`));
/*
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
*/

var cidtail = 0;
var contractMap = new Map();
var userMap = new Map();

server.listen(PORT);
var serv_io = io.listen(server); // 開啟 Socket.IO 的 listener

serv_io.sockets.on('connection', function(socket) {
    console.log("_____________________________");
    console.log("Somebody connected~");

    socket.on('addCont', function(data) {
      console.log("_____________________________");
      console.log("Somebody upload a contract...");
      data = JSON.parse(data);
      var usera = data.usera;
      var userb = data.userb;
      var title = data.title;
      var cont = data.contstr;
      addCont(usera, userb, title, cont);
      console.log("Current Total Contract Number : " + contractMap.size);
      serv_io.emit("refresh",data.usera+","+data.userb);
    });
    socket.on('getAllConts', function(data) {
      var str = "";
      for (var entry of contractMap.entries()) {
        var key = entry[0],value = entry[1];
        str += "&nbsp;Cont-";
        str += key + " : ";
        str += value.usera + " to ";
        str += value.userb + ", ";
        str += value.title + ", ";
        str += value.comfa + "-";
        str += value.comfb + ", ";
        if(value.signa==="")str += "Nan-";
        else str += "Yay-";
        if(value.signb==="")str += "Nan";
        else str += "Yay";
        str+="<br\>";
      }
      socket.emit('getAllConts', str);
    });
    socket.on('getAllUsers', function(data) {
      var str = "";
      for (var entry of userMap.entries()) {
        var key = entry[0],value = entry[1];
        str += "&nbsp;User-";
        str += key + " : [";
        str += value;
        str+="]<br\>";
      }
      socket.emit('getAllUsers', str);
    });
    socket.on('getContList', function(data) {
      data = JSON.parse(data);
      var user = data.user;
      socket.emit('getContList', {'contListStr': ""+getContList(user)});
      console.log("_____________________________");
      console.log("User-" + data.user + " want list");
      console.log(""+getContList(user));
    });
    socket.on('confirm', function(data) {
      data = JSON.parse(data);
      var user = data.user;
      var cont = data.cont;
      var cid = parseInt(cont);
      confirm(cid,user);

      var contract = getCont(cid);
      serv_io.emit("refresh",contract.usera+","+contract.userb);
    });
    socket.on('signature', function(data) {
      data = JSON.parse(data);
      var user = data.user;
      var cont = data.cont;
      var sign = data.sign;
      var cid = parseInt(cont);
      signature(cid, user, sign);
      
      var contract = getCont(cid);
      serv_io.emit("refresh",contract.usera+","+contract.userb);
    });
    socket.on('getCont', function(data) {
      data = JSON.parse(data);
      socket.emit('getCont', getCont(parseInt(data.cid)));
    });
    socket.on('reset', function(data) {
      console.log("_____________________________");
      console.log("Reseted!!!");
      cidtail = 0;
      contractMap = new Map();
      userMap = new Map();
    });
});

function addCont(usera, userb, title, cont){
  var contractId = cidtail++;
  var json = {'usera' : usera, 'userb' : userb, "title" : title, 'cont': cont, 'comfa' : true, 'comfb' : false, 'signa' : '', 'signb' : '', "time" : '', 'cid' : contractId};
  contractMap.set(contractId, json);
  if(userMap.get(usera)==undefined)userMap.set(usera,[]);
  if(userMap.get(userb)==undefined)userMap.set(userb,[]);
  var useraarr = userMap.get(usera); useraarr.push(contractId);
  var userbarr = userMap.get(userb); userbarr.push(contractId);
  userMap.set(usera, useraarr);
  userMap.set(userb, userbarr);
  console.log(getCont(contractId));
  return contractId;
}

function getCont(cid){//cid : int
  return contractMap.get(cid);
}
function setCont(cid, contract){
  contractMap.set(cid, contract);
}
function confirm(cid, uid){//cid : int ; uid : string
  console.log("_____________________________");
  console.log(uid + " comf " + cid);
  var contract = getCont(cid);
  if(contract.usera==uid)contract.comfa = true;
  if(contract.userb==uid)contract.comfb = true;
  setCont(cid, contract);
}
function signature(cid, uid, sign){//cid : int ; uid : string
  console.log("_____________________________");
  console.log(uid + " sign " + cid);
  var contract = getCont(parseInt(cid));
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