const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    apiId: { type: Number, unique: true, required: true },
    league: String,
    homeTeam: {
        id: Number,
        name: String,
        logo: String
    },
    awayTeam: {
        id: Number,
        name: String,
        logo: String
    },
    score: {
        home: { type: Number, default: 0 },
        away: { type: Number, default: 0 }
    },
    status: { type: String, enum: ['scheduled', 'live', 'finished'], default: 'scheduled' },
    date: Date,
    lineups: [
        {
            team_id: Number,
            player_id: Number,
            player_name: String,
            jersey_number: String,
            position: String
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Match', MatchSchema);