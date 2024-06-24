const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const mongoose = require('mongoose');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Trade = require('./models/Trade');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(cors());

const connectToMongoDB = require('./connection')

connectToMongoDB();

app.get('/', (req, res) => {
  res.send('Hello from MERN stack!');
});


app.post('/upload', upload.single('file'), (req, res) => {
  const results = [];
  const filePath = path.join(__dirname, req.file.path);

  fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
          const [BaseCoin, QuoteCoin] = data.Market.split('/');
          results.push({
              User_Id: data.User_ID,
              UTC_Time: new Date(data.UTC_Time),
              Operation: data.Operation,
              Market: data.Market,
              BaseCoin,
              QuoteCoin,
              BuySellAmount: parseFloat(data['Buy/Sell Amount']),
              Price: parseFloat(data.Price)
          });
      })
      .on('end', async () => {
          const groupedTrades = results.reduce((acc, trade) => {
              const { User_Id, ...tradeData } = trade;
              if (!acc[User_Id]) {
                  acc[User_Id] = {
                      User_Id,
                      Trades: []
                  };
              }
              acc[User_Id].Trades.push(tradeData);
              return acc;
          }, {});

          const tradeDocuments = Object.values(groupedTrades);

          try {
              await Trade.insertMany(tradeDocuments);
              fs.unlinkSync(filePath); // Delete the file after processing
              res.status(200).send('Data inserted successfully');
          } catch (err) {
              fs.unlinkSync(filePath); // Delete the file even if there's an error
              console.error('Error inserting data:', err);
              res.status(500).send('Error inserting data');
          }
      });
});

app.post('/users/:userId', async (req, res) => {
  const userId = req.params.userId;
  const netAmounts = {};
  const inputTimestamp = new Date('2022-09-27 12:00:00');
  console.log(`Fetching data for user with ID: ${userId}`);

  const trades = await Trade.findOne({ User_Id: userId });

  console.log(trades.Trades)

  const arr=trades.Trades;

  arr.forEach(trade => {
    const tradeTimestamp = new Date(trade.UTC_Time);
  
    // Check if the trade occurred before the input timestamp
    if (tradeTimestamp < inputTimestamp) {
      // Determine the operation type (+ for Buy, - for Sell)
      const operationSign = trade.Operation === 'Buy' ? 1 : -1;
  
      // Initialize or update netAmounts for the BaseCoin
      if (!netAmounts[trade.BaseCoin]) {
        netAmounts[trade.BaseCoin] = 0;
      }
      netAmounts[trade.BaseCoin] += operationSign * trade.BuySellAmount;
    }
  });

  console.log(netAmounts);

  // You can send a response back if needed
  res.send(`Fetching data for user with ID: ${userId}`);
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});