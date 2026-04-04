const axios = require('axios');
const Match = require('../models/Match'); 

async function syncLeagueData(leagueId) {
    const TOKEN = process.env.SPORTSMONKS_API_TOKEN;

    try {
        if (!TOKEN) return { success: false, message: "Token okunamadı." };

        // V3 için en garantili filtreleme yöntemi:
        const response = await axios.get(`https://api.sportmonks.com/v3/football/fixtures`, {
            params: {
                api_token: TOKEN,
                filters: `fixtureLeagues:${leagueId}`, 
                include: 'participants;league;scores'
            }
        });

        const fixtures = response.data.data;
        if (!fixtures || fixtures.length === 0) {
            return { success: false, message: "API'den bu lig için veri gelmedi." };
        }

        let savedCount = 0;
        for (const f of fixtures) {
            const home = f.participants?.find(p => p.meta?.location === 'home');
            const away = f.participants?.find(p => p.meta?.location === 'away');

            if (!home || !away) continue;

            await Match.findOneAndUpdate(
                { apiId: f.id },
                {
                    apiId: f.id,
                    league: f.league?.name || "Süper Lig",
                    homeTeam: { id: home.id, name: home.name, logo: home.image_path },
                    awayTeam: { id: away.id, name: away.name, logo: away.image_path },
                    score: {
                        home: f.scores?.find(s => s.participant_id === home.id)?.score?.goals || 0,
                        away: f.scores?.find(s => s.participant_id === away.id)?.score?.goals || 0
                    },
                    status: f.state?.state === 'FINISHED' ? 'finished' : (f.state?.state === 'LIVE' ? 'live' : 'scheduled'),
                    date: f.starting_at
                },
                { upsert: true, new: true }
            );
            savedCount++;
        }

        return { success: true, message: `${savedCount} maç veritabanına işlendi.`, league: fixtures[0]?.league?.name };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = { syncLeagueData };