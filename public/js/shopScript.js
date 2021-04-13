// Check to make sure page is loaded
if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', ready)
} else { // When page is loaded
    ready()
}

function ready() {
    // Remove an item from the cart
    var removeCartItemButtons = document.getElementsByClassName('btn-danger') // Change btn-danger
    //console.log(removeCartItemButtons)
    for (var i = 0; i < removeCartItemButtons.length; i++) {
        var button = removeCartItemButtons[i]
        button.addEventListener('click', removeCartItem) // Uses removeCartItem function
    }

    var quantityInputs = document.getElementsByClassName('cart-quantity-input')
    for (var i = 0; i < quantityInputs.length; i++) {
        var input = quantityInputs[i]
        input.addEventListener('change', quantityChanged)
    }

    var addToCartButtons = document.getElementsByClassName('shop-item-button')
    for (var i = 0; i < addToCartButtons.length; i++) {
        var button = addToCartButtons[i]
        button.addEventListener('click', addToCartClicked)
    }

    document.getElementsByClassName('btn-purchase')[0].addEventListener('click', purchaseClicked)
}

var stripeHandler = StripeCheckout.configure({
    key: stripePublicKey,
    locale: 'en',
    token: function (token) {
        //console.log(token)
        var items = []
        var cartItemContainer = document.getElementsByClassName('cart-items')[0]
        var cartRows = cartItemContainer.getElementsByClassName('cart-row')
        for (var i = 0; i < cartRows.length; i++) {
            var cartRow = cartRows[i]
            var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0]
            var quantity = quantityElement.value
            var id = cartRow.dataset.itemId
            items.push({
                id: id,
                quantity: quantity
            })
        }

        fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                stripeTokenId: token.id,
                items: items
            })
        }).then(function (res) {
            return res.json()
        }).then(function (data) {
            alert(data.message)
            var cartItems = document.getElementsByClassName('cart-items')[0]
            while (cartItems.hasChildNodes()) { // Remove items from cart
                cartItems.removeChild(cartItems.firstChild)
            }
            updateCartTotal()
        }).catch(function(error) {
            console.error(error)
        })
    }
})

// Purchase button clicked
function purchaseClicked() {
    // alert('Thank you for your purchase') // Alert user
    var priceElement = document.getElementsByClassName('cart-total-price')[0]
    var price = parseFloat(priceElement.innerText.replace('€', '')) * 100
    stripeHandler.open({
        amount: price
    })
}

// Remove item from the cart
function removeCartItem(event) {
    //console.log('clicked')
    var buttonClicked = event.target
    buttonClicked.parentElement.parentElement.remove() // Parent of btn-danger, parent of that parent, remove - Removes cart-row
    updateCartTotal()
}

// Change quantity value
function quantityChanged(event) {
    var input = event.target
    if (isNaN(input.value) || input.value <= 0) { // Check if value thats input is not a number, and is 0 or less
        input.value = 1 // Set value to 1 if its not a number of 0 or less
    }
    updateCartTotal()
}

// Add item to cart button clicked
function addToCartClicked(event) {
    var button = event.target
    var shopItem = button.parentElement.parentElement // Parent, parent, of button - shop-item
    var title = shopItem.getElementsByClassName('shop-item-title')[0].innerText
    var price = shopItem.getElementsByClassName('shop-item-price')[0].innerText
    var id = shopItem.dataset.itemId
    //console.log(title,price)
    addItemToCart(title, price, id) // Calls another method to add the item to the cart
    updateCartTotal() // Call to use function to update total
}
// Adds the item to the cart
function addItemToCart(title, price, id) {
    var cartRow = document.createElement('div')
    //cartRow.innerText = title
    // Can add classes to the created div here
    cartRow.classList.add('cart-row','row', 'justify-content-md')
    cartRow.dataset.itemId = id
    var cartItems = document.getElementsByClassName('cart-items')[0]
    var cartItemNames = cartItems.getElementsByClassName('cart-item-title')
    for (var i = 0; i < cartItemNames.length; i++) {
        if (cartItemNames[i].innerText == title) {
            alert('Item already added to cart.')
            return
        }
    }
    var cartRowContent = `
        <div class="cart-item col-md-4">
            <p class="cart-item-title">${title}</p>
        </div>
        <p class="cart-price col-md-4">${price}</p>
        <div class="cart-quantity col-md-4 pb-3">
            <input class="cart-quantity-input shop-item-quantity col-md-7 h-100 display-7" type="number" value="1">
            <button class="btn btn-danger col-md-auto display-7 h-100" type="button">Remove</button>
        </div>
        <hr>`
    cartRow.innerHTML = cartRowContent
    cartItems.append(cartRow)
    cartRow.getElementsByClassName('btn-danger')[0].addEventListener('click', removeCartItem) // Listens for click and uses remove item function
    cartRow.getElementsByClassName('cart-quantity-input')[0].addEventListener('change', quantityChanged) // Listens for change and uses quantity changed function
}

// Update cart total when there is a change
function updateCartTotal() {
    var cartItemContainer = document.getElementsByClassName('cart-items')[0] // Change cart-items
    var cartRows = cartItemContainer.getElementsByClassName('cart-row') // Change cart-row
    var total = 0
    for (var i = 0; i < cartRows.length; i++) {
        var cartRow = cartRows[i]
        var priceElement = cartRow.getElementsByClassName('cart-price')[0] // Change cart-price
        var quantityElement = cartRow.getElementsByClassName('cart-quantity-input')[0] // Change cart-quantity-input
        //console.log(priceElement,quantityElement)
        var price = parseFloat(priceElement.innerText.replace('€', ''))
        var quantity = quantityElement.value // Gets the value element of the input
        //console.log(price * quantity)
        total = total + (price * quantity)
    }
    total = Math.round(total * 100) / 100 // Round the number to 2 decimal places
    document.getElementsByClassName('cart-total-price')[0].innerText = '€' + total
}

