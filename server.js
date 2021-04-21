if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

const port = process.env.port || 3000

console.log(stripeSecretKey, stripePublicKey)


const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');
const nodeMailer = require('nodemailer');

const app = express();
app.use(express.urlencoded({extended:false}));

app.use(express.json())
// app.use(express.static('public'))
app.use(express.static(path.join(__dirname, 'public'), { index:false }));

// SET OUR VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge:  3600 * 1000 // 1hr
}));

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login-register');
    }
    next();
}

const ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/index');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

// ROOT PAGE
app.get('/', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT `name` FROM `users` WHERE `id`=?",[req.session.userID])
    // Old, was throwing error when trying to redirect to index instead of render
    // .then(([rows]) => {
    //     res.render('index',{
    //         name:rows[0].name
    //     });
    // });
    .then(([rows]) => {
        res.redirect('/index');
    });
    
});// END OF ROOT PAGE

app.get('/index', (req, res) => {
    if(!req.session.isLoggedIn){
        return res.redirect('/');
    } else {
        return res.render('index')
    }
})

app.get('/portfolio', (req, res) => {
    if(!req.session.isLoggedIn){
        return res.redirect('/');
    } else {
        return res.render('portfolio')
    }
})

app.get('/pieces/low-poly-animation', (req, res) => {
    if(!req.session.isLoggedIn){
        return res.redirect('/');
    } else {
        return res.render('pieces/low-poly-animation')
    }
})

app.get('/pieces/cityscape-animation', (req, res) => {
    if(!req.session.isLoggedIn){
        return res.redirect('/');
    } else {
        return res.render('pieces/cityscape-animation')
    }
})

app.get('/pieces/after-effects-blend', (req, res) => {
    if(!req.session.isLoggedIn){
        return res.redirect('/');
    } else {
        return res.render('pieces/after-effects-blend')
    }
})

app.get('/pieces/mysql-php-dynamic', (req, res) => {
    if(!req.session.isLoggedIn){
        return res.redirect('/');
    } else {
        return res.render('pieces/mysql-php-dynamic')
    }
})


// REGISTER PAGE
app.post('/register', ifLoggedin, 
// post data validation(using express-validator)
[
    body('user_email','Invalid email address!').isEmail().custom((value) => {
        try {
            return dbConnection.execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        })} catch (e) {
            return Promise.reject('An error was caught. Please try again <a href="/">Login</a>');
        };
    }),
    body('user_name','Username is Empty!').trim().not().isEmpty(),
    body('user_pass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {user_name, user_pass, user_email} = req.body;
    // IF validation_result HAS NO ERROR
    if(validation_result.isEmpty()){
        // password encryption (using bcryptjs)
        bcrypt.hash(user_pass, 12).then((hash_pass) => {
            // INSERTING USER INTO DATABASE
            dbConnection.execute("INSERT INTO `users`(`name`,`email`,`password`) VALUES(?,?,?)",[user_name,user_email, hash_pass])
            .then(result => {
                res.send(`Your account has been created successfully, you can now <a href="/">Login</a>`);
            }).catch(err => {
                // THROW INSERTING USER ERROR'S
                if (err) throw err;
            });
        })
        .catch(err => {
            // THROW HASING ERROR'S
            if (err) throw err;
        })
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        res.render('login-register',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});// END OF REGISTER PAGE

app.get('/register', (req, res) => {
    if(!req.session.isLoggedIn){
        return res.redirect('/');
    } else {
        return res.render('index')
    }
})

// LOGIN PAGE
app.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        return dbConnection.execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('Invalid Email Address!');
            
        });
    }),
    body('user_pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `users` WHERE `email`=?",[user_email])
        .then(([rows]) => {
            bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.userID = rows[0].id;

                    res.redirect('/');
                }
                else{
                    res.render('login-register',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login-register',{
            login_errors:allErrors
        });
    }
});
// END OF LOGIN PAGE

// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/');
});
// END OF LOGOUT

// Push Contact Form Data To Terminal/Console
app.post('/index', (req, res) => {
    console.log(req.body);

    const transporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS
        }
    })
    const mailOptions = {
        from: req.body.email,
        to: process.env.EMAIL,
        subject: `Message from ${req.body.email}: ${req.body.subject}`,
        text: req.body.message
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if(error){
            console.log(error);
            res.send('error');
        } else {
            console.log('Email sent' + info.response);
            res.send('success');
        };
    });
});



app.get('/shop', function (req, res) {
    fs.readFile('items.json', function (error, data) {
        if (error) {
            res.status(500).end()
        } else if (!req.session.isLoggedIn){
            return res.redirect('/');
        } else {
            res.render('shop', {
                stripePublicKey: stripePublicKey,
                items: JSON.parse(data)
            })
        }
    })
})

app.post('/purchase', function (req, res) {
    fs.readFile('items.json', function (error, data) {
        if (error) {
            res.status(500).end()
        } else {
            //console.log('purchase')
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.commisions.concat(itemsJson.merch)
            let total = 0
            req.body.items.forEach(function(item) {
                const itemJson = itemsArray.find(function(i) {
                    return i.id == item.id
                })
                total = total + itemJson.price * item.quantity
            })
            stripe.charges.create({
                amount: total,
                source: req.body.stripeTokenId,
                currency: 'eur'
            }).then(function() {
                console.log('Charge Successful')
                res.json({ message: 'Successfully purchased items'})
            }).catch(function() {
                console.log('Charge Failed')
                res.status(500).end()
            })
        }
    })
})

app.listen(port, () => console.log('Server running on port: '+port))

//app.listen(3000, () => console.log("Server is Running..."));