var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var morgan = require('morgan');  
var passport = require('passport');  
var jwt = require('jsonwebtoken');
var path = require('path');
var config = require('./config/main');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('topsecret', config.secret);
// initialize passport
app.use(passport.initialize());
app.use(methodOverride("_method"));
app.use(morgan('dev'));
app.set('view engine', 'html');
app.set('views',  '/views');

// Connect to mongoose
mongoose.Promise = global.Promise;
mongoose.connect(config.database);

var apiRoutes = express.Router();


// First Page
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname + '/views/firstpage.html'));
});

apiRoutes.get('/',function(req, res){
     Blog.find({}, function(err, allblogs){
        if(err){
            console.log(err);
        } else {
            res.send(JSON.stringify({blogs: allblogs}));
        }
    });
    
});

app.post("/blog/new", passport.authenticate('jwt', { session: false }), function(req, res){
    // get data from form and add to campgrounds array
var newBlog = {
     name : req.body.name,
     image : req.body.image,
     desc : req.body.description,
     author : {
        'id': req.user._id,
        'username': req.user.username
    },
};    
// Create a new blog and save to DB
    Blog.create(newBlog, function(err, newlyCreated){
        if(err) {
          return res.json({ success: false, message: 'Cannot create blog.', });
        } else {
            // redirect to blog page
            console.log(newlyCreated);
            res.json({ success: true, message: 'Successfully created new blog.' });
        }
    });
});

app.listen(3000, function(req, res){
   console.log("Server has started");
});