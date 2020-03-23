var mysql = require('mysql');
var express = require('express');
var app = express();
var bodyparser = require('body-parser');
var http = require("http");

var session = require('express-session');


app.use(express.urlencoded({ extended: true }))
app.use(bodyparser.json());
app.set('view engine','ejs');

var flash = require('express-flash-messages');
app.use(flash());

var multer  = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+ '_' + file.originalname)
  }
});
 
var upload = multer({ storage: storage });

var connection = mysql.createConnection({  
  host: "localhost",  
  user: "root",  
  password: "",
  database: "nodelogin"
});  
connection.connect((err)=>{  
  if (!err)  
  console.log("Your database connected!"); 
  else
 console.log("database connection failed \n Error :" + JSON.stringify(err, undefined, 2));
});  

app.listen(3000,()=>console.log('Express server is running at port no :3000'));



app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));


app.get('/', function (req, res) {
	var message = {'msg':''}
	res.render('login',{message:message});
});


app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
				var message = {'msg':'Incorrect Username and/or Password!'}
					response.render('login',{message:message});  
					//response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		var message = {'msg':'Please enter Username and Password!'}
		response.render('login',{message:message});
		//response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		var message ={
			'name': request.session.username
		}
		
		var sql = "SELECT * FROM accounts";
		connection.query(sql, (err, result)=> {  
			if (err){ 
			throw err; 
			}else{
			console.log(result); 
			console.log(result[0].name); 
			} 
		});
		
		
		//response.render('front',{message: message,result: result});
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		var message = {
			'msg':'Please login to view this page!'
		}
		response.render('login',{message:message});
	}
	response.end();
});

app.get('/logout',function(req,res){    
    req.session.destroy(function(err){  
        if(err){  
            console.log(err);  
        }  
        else{
			var message = {
			'msg':'You are logout successfully !'
			}
			res.render('login',{message:message});  
        }  
    }); 
}); 	


app.get('/register', function (req, res) {
	var message = {'msg':''}
	console.log(req.body);
	res.render('register', { message: message });
});

app.post('/register', upload.single('blogImg'),function (request, response, next) {
	var fileInfo = request.file;
	if (!fileInfo) {
		const error = new Error('Please upload a file')
		return next(error)
	}
    //response.send(fileInfo)

	var name = request.body.name;
	var username = request.body.username;
	var password = request.body.password;
	var email = request.body.email;
	var mobile = request.body.mobile;
	var image = fileInfo.filename;
	
	var sqlData = "INSERT INTO accounts (name, username, password, email, mobile, image) VALUES ('"+ name +"', '"+ username +"', '"+ password +"', '"+ email +"', '"+ mobile +"', '"+ image +"')"; 
	connection.query(sqlData, function (err, result) {
		if (err) throw err;  
		var message = {'msg':'Your record registered with the name :'+ request.body.name}
		response.render('register', { message: message });
	});
	
});