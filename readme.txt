Stripe checkout system created with help from: https://www.youtube.com/channel/UCFbNIlppjAuEX4znoulh0Cw
- Errors shown in console for the checkout are due to there being a more recent version of Stripe available and do not impact performance or functionality
- Items in the shop page MUST be edited, deleted, and added through the items.json file

To run on localhost:
Download Node JS
Open CMD and type: npm install
Then use cd to move to the folder container server.js
In this folder type: npm install
Then type: npm install --save express ejs express-validator cookie-session bcrypt mysql2
Then type: npm install bcryptjs nodemailer
Then in CMD, or a terminal in an editor such as VS Code, type: node server.js

Have XAAMP installed and run Apache & MySql
Create a database called: nodejs_login
Import the database.sql file in to the nodejs_login database


To have the shop and contact form working on localhost:
You will need to create a .env in the root project folder which contains server.js
The reason for this is that GitHub ignores the .env file as it contains sensitive information that shouldn't be shared.
In this file you must provide:

STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=

A stripe key can be obtained by signing up at Stripe Checkout, and a gmail login must also be provided as:

EMAIL=
PASS=