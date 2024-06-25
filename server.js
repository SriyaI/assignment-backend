const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');

app.use(bodyParser.json());
app.use(cors());

app.use(express.json()); 
app.use(uploadRoutes);
app.use(userRoutes);

const connectToMongoDB = require('./connection')

connectToMongoDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
