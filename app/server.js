var express = require('express');
var mongoose = require('mongoose');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');
var config = require('./../config/config');
var routeHandler = require('./routes');


var app = express();
var port = process.env.PORT || 3000;
var router = express.Router();

var corsOption = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['x-auth-token']
};
app.use(cors(corsOption));

mongoose.connect(config.url, {useMongoClient: true});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  console.log('Mongo db is open now!');
});

app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({
  extended: true
})); // get information from html forms
app.use(bodyParser.json({limit: '50mb', type: 'application/json'})); // get information from other json inputs



//register passport strategies


//register routes
app.use('/api/v1', routeHandler, function(err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    return (res.status(401).send('Invalid authorization token'));
  }
});

app.listen(port, function(){
  console.log('The magic happens on port ' + port);
});
