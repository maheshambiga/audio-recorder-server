import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';

import config from './../config/config';
import routeHandler from './routes';


const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();

const corsOption = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['x-auth-token'],
};
app.use(cors(corsOption));

mongoose.connect(config.url, {useMongoClient: true});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', () => {
  console.log('Mongo db is open now!');
});

app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({
  extended: true,
})); // get information from html forms
app.use(bodyParser.json()); // get information from other json inputs



//register passport strategies


//register routes
app.use('/api/v1', routeHandler, (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return (res.status(401).send('Invalid authorization token'));
  }
});

app.listen(port, ()=>{
  console.log('The magic happens on port ' + port);
});
