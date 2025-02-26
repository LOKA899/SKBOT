const fetch = require('node-fetch');

module.exports = {
  fetchLandContributions: async (landId, fromDate, toDate) => {
    const url = `https://api-lok-live.leagueofkingdoms.com/api/stat/land/contribution?landId=${landId}&from=${fromDate}&to=${toDate}`;
    try {
      const response = await fetch(url, {
        timeout: 8000,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    } catch (error) {
      console.error('API Error:', error.message);
      return null;
    }
  }
};
