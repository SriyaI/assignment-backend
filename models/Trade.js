const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    User_Id: { type: String, required: true },
    Trades: {
        type: [{   
            UTC_Time: { type: Date, required: true },
            Operation: { type: String, required: true },
            Market: { type: String, required: true },
            BuySellAmount: { type: Number, required: true },
            Price: { type: Number, required: true }
        }]
    }
});

const Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade;
