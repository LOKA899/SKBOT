
const fetch = require('node-fetch');

module.exports = {
  fetchLandContributions: async (landId, fromDate, toDate) => {
    try {
      const response = await fetch(
        `https://api-lok-live.leagueofkingdoms.com/api/stat/land/contribution?landId=${landId}&from=${fromDate}&to=${toDate}`,
        { timeout: 8000 }
      );
      if (!response.ok) throw new Error('API response was not ok');
      return response.json();
    } catch (error) {
      return null;
    }
  }
};
