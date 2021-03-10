if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const port = process.env.port || 3000

console.log(stripeSecretKey, stripePublicKey)

const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile('./public/index.html', {root: __dirname})
})

app.get('/shop', function (req, res) {
    fs.readFile('items.json', function (error, data) {
        if (error) {
            res.status(500).end()
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

app.listen(port)