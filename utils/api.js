const fetch = require('node-fetch');

module.exports = {
  fetchLandContributions: async (landId, fromDate, toDate) => {
    const url = `https://api-lok-live.leagueofkingdoms.com/api/stat/land/contribution?landId=${landId}&from=${fromDate}&to=${toDate}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching land contributions:', error);
      return null;
    }
  }
};