
module.exports = {
  rss: [
    { level: 1, production: 50000, expectedDevPoints: 1 },
    { level: 2, production: 100000, expectedDevPoints: 2 },
    { level: 3, production: 200000, expectedDevPoints: 4 },
    { level: 4, production: 300000, expectedDevPoints: 6 },
    { level: 5, production: 600000, expectedDevPoints: 12 },
    { level: 6, production: 900000, expectedDevPoints: 18 },
    { level: 7, production: 1200000, expectedDevPoints: 24 },
    { level: 8, production: 1800000, expectedDevPoints: 36 },
    { level: 9, production: 2400000, expectedDevPoints: 48 },
    { level: 10, production: 3000000, expectedDevPoints: 60 }
  ],
  crystalMine: [
    { level: 1, production: 50, expectedDevPoints: 10 },
    { level: 2, production: 100, expectedDevPoints: 20 },
    { level: 3, production: 200, expectedDevPoints: 40 },
    { level: 4, production: 300, expectedDevPoints: 60 },
    { level: 5, production: 600, expectedDevPoints: 120 }
  ],
  dsa: [
    { level: 1, production: 1000, expectedDevPoints: 40 },
    { level: 2, production: 2000, expectedDevPoints: 80 }
  ]
};
