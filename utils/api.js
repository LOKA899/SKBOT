const fetch = require('node-fetch');

module.exports = {
  fetchLandContributions: async (landId, fromDate, toDate) => {
    const url = `https://api-lok-live.leagueofkingdoms.com/api/stat/land/contribution?landId=${landId}&from=${fromDate}&to=${toDate}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // Timeout after 5 seconds

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      clearTimeout(timeout);
      if (!response.ok) throw new Error('API response not OK');
      return response.json();
    } catch (error) {
      console.error('API Error:', error.message);
      return null;
    }
  }
};
