module.exports = {
  farm: [
    { level: 1, production: 50000, expectedDevPoints: 1 }, // 50,000 / 50,000 = 1
    { level: 2, production: 100000, expectedDevPoints: 2 }, // 100,000 / 50,000 = 2
    { level: 3, production: 200000, expectedDevPoints: 4 }, // 200,000 / 50,000 = 4
    { level: 4, production: 300000, expectedDevPoints: 6 }, // 300,000 / 50,000 = 6
    { level: 5, production: 600000, expectedDevPoints: 12 }, // 600,000 / 50,000 = 12
    { level: 6, production: 900000, expectedDevPoints: 18 }, // 900,000 / 50,000 = 18
    { level: 7, production: 1200000, expectedDevPoints: 24 }, // 1,200,000 / 50,000 = 24
    { level: 8, production: 1800000, expectedDevPoints: 36 }, // 1,800,000 / 50,000 = 36
    { level: 9, production: 2400000, expectedDevPoints: 48 }, // 2,400,000 / 50,000 = 48
    { level: 10, production: 3000000, expectedDevPoints: 60 } // 3,000,000 / 50,000 = 60
  ],
  crystalMine: [
    { level: 1, production: 50, expectedDevPoints: 10 }, // 50 / 5 = 10
    { level: 2, production: 100, expectedDevPoints: 20 }, // 100 / 5 = 20
    { level: 3, production: 200, expectedDevPoints: 40 }, // 200 / 5 = 40
    { level: 4, production: 300, expectedDevPoints: 60 }, // 300 / 5 = 60
    { level: 5, production: 600, expectedDevPoints: 120 } // 600 / 5 = 120
  ],
  sealedMine: [
    { level: 1, production: 1000, expectedDevPoints: 40 }, // 1,000 / 25 = 40
    { level: 2, production: 2000, expectedDevPoints: 80 }, // 2,000 / 25 = 80
    { level: 3, production: 3000, expectedDevPoints: 120 }, // 3,000 / 25 = 120
    { level: 4, production: 4000, expectedDevPoints: 160 }, // 4,000 / 25 = 160
    { level: 5, production: 5000, expectedDevPoints: 200 } // 5,000 / 25 = 200
  ]
};