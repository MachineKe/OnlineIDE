const express = require("express");
const path = require("path");
const collection = require("./config");
const bcrypt = require('bcrypt');
const session = require('express-session'); // Add express-session

const app = express();
app.use(session({
    secret: 'secret-key', // Change this to a random string
    resave: false,
    saveUninitialized: true
}));

// Convert data into JSON format
app.use(express.json());
// Static file
app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));
// Use EJS as the view engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

// Register User
app.post("/signup", async (req, res) => {
  const data = {
      name: req.body.username,
      password: req.body.password
  }

  try {
      // Check if the username already exists in the database
      const existingUser = await collection.findOne({ name: data.name });

      if (existingUser) {
          res.send('User already exists. Please choose a different username.');
      } else {
          // Create a new user document in the database
          const newUser = await collection.create(data);
          console.log("New user registered:", newUser);

          // After successful registration, log in the user immediately
          req.session.user = newUser; // Store user data in session
          res.render("home", { user: newUser }); // Render home page with user data
      }
  } catch (error) {
      console.error(error);
      res.send('An error occurred during registration.');
  }
});

// Login user 
app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ name: req.body.username });

        if (!check) {
            res.send("Username not found");
        } else {
            const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);

            if (!isPasswordMatch) {
                res.send("Wrong Password");
            } else {
                // Set the user information in the session
                req.session.user = check;
                res.render("home", { user: check }); // Pass user information to the view
            }
        }
    } catch (error) {
        console.error(error);
        res.send("An error occurred during login.");
    }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next(); // User is authenticated, proceed to the next middleware
    } else {
        res.redirect('/login'); // User is not authenticated, redirect to login page
    }
}

// Home page route - Protected route, only accessible for authenticated users
app.get("/home", isAuthenticated, (req, res) => {
    // Render the home page only if the user is authenticated
    res.render("home", { user: req.session.user }); // Pass user information to the view
});


// Logout route
app.get("/logout", (req, res) => {
    // Destroy the user's session or JWT token
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            res.send("An error occurred during logout.");
        } else {
            // Redirect to the login page after logout
            res.redirect("/login");
        }
    });
});


// Define Port for Application
const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});
