const Trade = require('../models/Trade'); 

const getUserData = async (req, res) => {
  const userId = req.params.userId;
  const { timestamp } = req.body;
  const inputTimestamp = new Date(timestamp);

  // Validate the input timestamp
  if (isNaN(inputTimestamp.getTime())) {
    return res.status(400).send({ error: 'Invalid timestamp format' });
  }

  console.log(`Fetching data for user with ID: ${userId}`);

  try {
    const trades = await Trade.findOne({ User_Id: userId });

    if (!trades) {
      return res.status(404).send({ error: 'User not found or no trades available' });
    }

    console.log(trades.Trades);

    const arr = trades.Trades;
    const netAmounts = {};

    arr.forEach(trade => {
      const tradeTimestamp = new Date(trade.UTC_Time);

      if (tradeTimestamp < inputTimestamp) {
        const [BaseCoin, QuoteCoin] = trade.Market.split('/'); 
        const operationSign = trade.Operation === 'Buy' ? 1 : -1;

        if (!netAmounts[BaseCoin]) {
          netAmounts[BaseCoin] = 0;
        }
        netAmounts[BaseCoin] += operationSign * trade.BuySellAmount;
      }
    });

    console.log(netAmounts);

    res.status(200).send({ netAmounts });

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
};

module.exports = { getUserData };
