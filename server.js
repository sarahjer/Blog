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
var User = require('./models/user');
var Blog = require('./models/blog');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('topsecret', config.secret);
// initialize passport
app.use(passport.initialize());
app.use(methodOverride("_method"));
app.use(morgan('dev'));
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// Connect to mongoose
mongoose.Promise = global.Promise;
mongoose.connect(config.database);

var apiRoutes = express.Router();


// First Page
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname + '/views/header.html'));
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

// Set url for API group routes
app.use('/api', apiRoutes);

// Register new users
app.post('/signup', function(req, res) {  
  if(!req.body.username || !req.body.password) {
    res.json({ success: false, message: 'Please enter username and password.' });
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    });
    // Attempt to save the user
    newUser.save(function(err, user) {
      if (err) {
        return res.json({ success: false, message: 'That user already exists.'});
      }
        var token = jwt.sign(user.toObject(), config.secret, {
            // expiresIn: 10080 // in seconds
          });
          res.send({ success: true, token: 'JWT ' + token, user: user, redirect: true, redirectURL: '/'});
          console.log(user);
    });
  }
});


// Authenticate the user and get a JSON Web Token to include in the header of future requests.
app.post('/login', function(req, res) {  
  User.findOne(
    {username: req.body.username.toLowerCase()}, 
    function(err, user) {
    if (err) 
        console.log(err);
    if (!user) {
      res.send({ success: false, message: 'Authentication failed. User not found.' });
    } else {
      // Check if password matches
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          // Create token if the password matched and no error was thrown
          var token = jwt.sign(user.toObject(), config.secret, {
            // expiresIn: 10080 // in seconds
          });
          res.send({ success: true, token: 'JWT ' + token, user: user, redirect: true, redirectURL: '/'});
          
        } else {
          res.send({ success: false, message: 'Authentication failed. Passwords did not match.' });
        }
      });
    }
  });
});

app.listen(3000, function(req, res){
   console.log("Server has started");
});