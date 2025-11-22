const express = require("express");
const app = express();
const port = 3000;

// a basic route
app.get("/", (req, res) => {
  res.send("Hello from your small web server!");
});

// start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
