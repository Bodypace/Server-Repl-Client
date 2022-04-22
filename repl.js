#!/bin/node
var repl = require("repl");

// A "local" node repl with a custom prompt
var local = repl.start(`client::REST> `);

const io = require('socket.io-client');
const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio-client');
const auth = require('@feathersjs/authentication-client');

const socket = io('http://127.0.0.1:3030');
const client = feathers();

client.configure(socketio(socket));
client.configure(auth())

// Exposing stuff to the local REPL's context.
local.context.client = client

local.context.auth = {
  login: (email, password) => client.authenticate({
    strategy: 'local',
    email, 
    password
  }),
  register: (email, password) => client.service('users').create({
    email, 
    password,
  }),
  loginMe: () => client.authenticate({
    strategy: 'local',
    email: 'rdorna8@gmail.com',
    password: 'password'
  })
}

local.context.list = async serviceName =>
  Promise.all((await client.service(serviceName).find())
  .data.map(async e => {
    if (serviceName === "buys" || serviceName === "eats") {
      const product = await client.service('products').get(e.ProductId)
      return {id: e.id, name: product.name}
    }
    return {id: e.id, name: e.name}
  }))
