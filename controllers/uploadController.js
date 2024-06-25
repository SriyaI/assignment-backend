const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const Trade = require('../models/Trade'); 

const uploadFile = (req, res) => {
  const results = [];
  const filePath = path.join(__dirname, '../', req.file.path);

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      results.push({
        User_Id: data.User_ID,
        UTC_Time: new Date(data.UTC_Time),
        Operation: data.Operation,
        Market: data.Market,
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
        fs.unlinkSync(filePath); 
        res.status(200).send('Data inserted successfully');
      } catch (err) {
        fs.unlinkSync(filePath);
        console.error('Error inserting data:', err);
        res.status(500).send('Error inserting data');
      }
    });
};

module.exports = { uploadFile };
