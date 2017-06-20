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
var fs = require('fs');
var multer = require('multer');
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});
var upload = multer({storage:storage});


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

app.use(multer({ dest: './uploads/',
 rename: function (fieldname, filename) {
   return filename;
 },
}).single('imgFile'));


if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Bring in defined Passport Strategy
require('./config/passport')(passport);

// Connect to mongoose
mongoose.Promise = global.Promise;
mongoose.connect(config.database);

var apiRoutes = express.Router();


// First Page
app.get('/', function(req, res){
    res.sendFile(path.join(__dirname + '/views/header.html'));
});

apiRoutes.get('/blogs',function(req, res){
     Blog.find({}, function(err, allblogs){
        if(err){
            throw err;
        } else {
          console.log(allblogs.length);
          for(var i=0; i<allblogs.length; i++){
            var base64 = (allblogs[i].image.data.toString('base64'));
            console.log(allblogs[i].image.data);
            res.write(base64);
          }
            res.end();
        }
    });    
});

// apiRoutes.get('/blogs', function (req, res) {
//     res.sendFile(path.resolve('./uploads/Photos-Camping.jpg'));
// }); 

app.post("/new", function(req, res){
  // get data from form and add to campgrounds array
    var newBlog = new Blog();
    var tmp_path = req.file.path; 
    var target_path = './uploads/' + req.file.originalname;
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;
            console.log('File uploaded to: ' + target_path);
        });
    });
    newBlog.image.data = fs.readFileSync(tmp_path);
    newBlog.image.contentType = 'image/*';
    newBlog.title = req.body.title;
    newBlog.text = req.body.text;  
    newBlog.save();    
// Create a new blog and save to DB
    Blog.create(newBlog, function(err, newBlog){
        if(err) {
          return res.json({ success: false, message: 'Cannot create blog.', });
        } else {
            // redirect to blog page   
            res.send({ success: true, message: 'Successfully created new blog.', redirect: true, redirectURL: '/' });
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