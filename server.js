var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var morgan = require('morgan');  
var passport = require('passport');  
var jwt = require('jsonwebtoken');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('topsecret', config.secret);
// initialize passport
app.use(passport.initialize());
app.use(methodOverride("_method"));
app.use(morgan('dev'));

// Connect to mongoose
mongoose.Promise = global.Promise;
mongoose.connect(config.database);

var apiRoutes = express.Router();


// First Page
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname + 'views/firstpage.html'));
});