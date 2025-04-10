const mysql = require("mysql2"); // MySQL library
const express = require("express"); // Express framework
const cors = require("cors"); // CORS middleware
const bodyParser = require("body-parser"); // Body parser middleware

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create a MySQL Connection Pool
const pool = mysql.createPool({
  user: "abdi",
  password: "abdi@1234",
  host: "localhost",
  database: "multiDB",
  waitForConnections: true,
  connectionLimit: 10, // Number of concurrent connections
  queueLimit: 0,
});

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL Database!");
  connection.release(); // Release connection back to the pool
});

// Install: Create tables
app.get("/install", (req, res) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS Products (
      product_id INT AUTO_INCREMENT PRIMARY KEY,
      product_url VARCHAR(255) NOT NULL,
      product_name VARCHAR(255) NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS ProductDescription (
      description_id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      product_brief_description TEXT NOT NULL,
      product_description TEXT NOT NULL,
      product_img TEXT NOT NULL,
      product_link VARCHAR(255) NOT NULL,
      FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS ProductPrice (
      price_id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      starting_price VARCHAR(255) NOT NULL,
      price_range VARCHAR(255) NOT NULL,
      FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS Users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(255) NOT NULL,
      user_password VARCHAR(255) NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS Orders (
      order_id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
    );`,
  ];

  queries.forEach((query) => {
    pool.query(query, (err, result) => {
      if (err) {
        console.error("Error creating tables:", err);
        return res.status(500).send("Error creating tables");
      }
    });
  });

  res.send("Tables Created Successfully");
});

// Insert Product, User, and Order
app.post("/add-product", (req, res) => {
  const {
    product_url,
    product_name,
    product_brief_description,
    product_description,
    product_img,
    product_link,
    starting_price,
    price_range,
    user_name,
    user_password,
  } = req.body;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).send("Database connection error");
    }

    connection.beginTransaction((err) => {
      if (err) {
        console.error("Transaction error:", err);
        return res.status(500).send("Transaction error");
      }

      // Insert Product
      connection.query(
        "INSERT INTO Products (product_url, product_name) VALUES (?, ?)",
        [product_url, product_name],
        (err, productResult) => {
          if (err) {
            console.error("Error inserting product:", err);
            return connection.rollback(() =>
              res.status(500).send("Error inserting product")
            );
          }

          const newProductId = productResult.insertId;

          // Insert Product Description
          connection.query(
            "INSERT INTO ProductDescription (product_id, product_brief_description, product_description, product_img, product_link) VALUES (?, ?, ?, ?, ?)",
            [
              newProductId,
              product_brief_description,
              product_description,
              product_img,
              product_link,
            ],
            (err) => {
              if (err) {
                console.error("Error inserting product description:", err);
                return connection.rollback(() =>
                  res.status(500).send("Error inserting product description")
                );
              }
            }
          );

          // Insert Product Price
          connection.query(
            "INSERT INTO ProductPrice (product_id, starting_price, price_range) VALUES (?, ?, ?)",
            [newProductId, starting_price, price_range],
            (err) => {
              if (err) {
                console.error("Error inserting product price:", err);
                return connection.rollback(() =>
                  res.status(500).send("Error inserting product price")
                );
              }
            }
          );

          // Insert User
          connection.query(
            "INSERT INTO Users (user_name, user_password) VALUES (?, ?)",
            [user_name, user_password],
            (err, userResult) => {
              if (err) {
                console.error("Error inserting user:", err);
                return connection.rollback(() =>
                  res.status(500).send("Error inserting user")
                );
              }

              const newUserId = userResult.insertId;

              // Insert Order
              connection.query(
                "INSERT INTO Orders (product_id, user_id) VALUES (?, ?)",
                [newProductId, newUserId],
                (err) => {
                  if (err) {
                    console.error("Error inserting order:", err);
                    return connection.rollback(() =>
                      res.status(500).send("Error inserting order")
                    );
                  }

                  connection.commit((err) => {
                    if (err) {
                      console.error("Transaction commit error:", err);
                      return connection.rollback(() =>
                        res.status(500).send("Transaction commit error")
                      );
                    }

                    res.send({
                      message: "Product, User, and Order added successfully!",
                    });

                    connection.release();
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});

// Get all iPhones
app.get("/iphones", (req, res) => {
  pool.query(
    `SELECT * FROM Products 
    INNER JOIN ProductDescription ON Products.product_id = ProductDescription.product_id 
    INNER JOIN ProductPrice ON Products.product_id = ProductPrice.product_id`,
    (err, rows) => {
      if (err) {
        console.error("Error retrieving products:", err);
        return res.status(500).send("Error retrieving products");
      }
      res.json({ products: rows });
    }
  );
});

// Get all user names
app.get("/users", (req, res) => {
  pool.query("SELECT user_name FROM Users", (err, rows) => {
    if (err) {
      console.error("Error retrieving users:", err);
      return res.status(500).send("Error retrieving users");
    }
    res.json({ users: rows });
  });
});

// Start Server
app.listen(3001, () => {
  console.log("Server running on port 3001");
});
