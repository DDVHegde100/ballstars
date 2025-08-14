import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

// ---------- Utilities ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (min = 0, max = 1) => Math.random() * (max - min) + min;
const irnd = (min, max) => Math.floor(rnd(min, max + 1));
const chance = (p) => Math.random() < p; // p in [0,1]
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
const fmt = (n, d = 1) => Number(n).toFixed(d);
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// Format money in millions instead of thousands
const formatMoney = (amount) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}B`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}M`;
  } else {
    return `$${amount}k`;
  }
};

// Generate random player appearance
const generateAppearance = () => {
  const skinTones = ['#F5DEB3', '#DEB887', '#D2B48C', '#BC9A6A', '#A0522D', '#8B4513', '#654321'];
  const hairColors = ['#000000', '#2F1B14', '#8B4513', '#D2691E', '#DAA520', '#FFD700', '#B22222', '#FFFFFF'];
  const eyeColors = ['#8B4513', '#654321', '#4682B4', '#228B22', '#808080', '#000000'];
  
  return {
    skin: pick(skinTones),
    hair: pick(hairColors),
    eyes: pick(eyeColors),
    features: {
      faceShape: pick(['oval', 'round', 'square', 'heart']),
      nose: pick(['small', 'medium', 'large']),
      eyebrows: pick(['thin', 'medium', 'thick'])
    }
  };
};

// Convert hex color to RGB values for glassmorphism effects
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {r: 59, g: 130, b: 246}; // Default to blue if parsing fails
};

// Player ranking and Hall of Fame functions with enhanced efficiency calculations
const calculatePlayerScore = (game) => {
  const career = game.career;
  if (!career || !career.seasons || career.seasons.length === 0) return 0;
  
  const totals = career.totals || {};
  const seasons = career.seasons;
  const gamesPlayed = Math.max(totals.games || 1, 1);
  
  // Advanced statistical metrics with NaN protection
  const avgPPG = (totals.points || 0) / gamesPlayed;
  const avgRPG = (totals.rebounds || 0) / gamesPlayed;
  const avgAPG = (totals.assists || 0) / gamesPlayed;
  const avgSPG = (totals.steals || 0) / gamesPlayed;
  const avgBPG = (totals.blocks || 0) / gamesPlayed;
  
  // True Shooting and efficiency metrics with safe defaults
  const avgTS = totals.trueShootingSeasons && totals.trueShootingSeasons.length > 0 ? 
    totals.trueShootingSeasons.reduce((a,b) => a+(b||0.55), 0) / totals.trueShootingSeasons.length : 0.55;
  const avgTOV = (totals.turnovers || 0) / gamesPlayed;
  
  // Advanced PER calculation with better methodology and NaN protection
  const avgPER = totals.per && totals.per.length > 0 ? 
    totals.per.reduce((a,b) => a+(b||15), 0) / totals.per.length : 15.0;
  
  // Win Shares and advanced metrics with safe calculations
  const winShares = seasons.reduce((total, season) => {
    const ws = ((season.averages?.pts || 0) * 0.032) + 
               ((season.averages?.reb || 0) * 0.045) + 
               ((season.averages?.ast || 0) * 0.054) - 
               ((season.averages?.tov || 0) * 0.040);
    return total + Math.max(0, ws || 0);
  }, 0);
  
  // Box Plus/Minus approximation with safe calculations
  const bpm = seasons.length > 0 ? seasons.reduce((total, season) => {
    const seasonBPM = (((season.averages?.pts || 0) - 14.6) * 0.1) + 
                     (((season.averages?.reb || 0) - 4.6) * 0.14) + 
                     (((season.averages?.ast || 0) - 2.3) * 0.15) + 
                     (((season.averages?.stl || 0) - 0.9) * 0.22) + 
                     (((season.averages?.blk || 0) - 0.6) * 0.18) - 
                     (((season.averages?.tov || 0) - 2.1) * 0.12);
    return total + (seasonBPM || 0);
  }, 0) / seasons.length : 0;
  
  // Peak performance bonus (best 3-5 seasons) with safe calculations
  const peakSeasons = seasons
    .map(s => s.averages?.per || 15)
    .sort((a, b) => (b||0) - (a||0))
    .slice(0, Math.min(5, seasons.length));
  const peakPER = peakSeasons.length > 0 ? 
    peakSeasons.reduce((a, b) => a + (b||15), 0) / peakSeasons.length : 15;
  
  // Calculate base score with enhanced weighting and NaN protection
  let score = 0;
  
  // Primary stats (40% of score)
  score += (avgPPG || 0) * 2.5;
  score += (avgRPG || 0) * 1.8;
  score += (avgAPG || 0) * 2.2;
  score += (avgSPG || 0) * 3.0;
  score += (avgBPG || 0) * 2.5;
  
  // Advanced metrics (30% of score)
  score += ((avgPER || 15) - 15) * 4; // PER above average
  score += ((avgTS || 0.55) - 0.55) * 100; // TS% above league average
  score += Math.max(0, bpm || 0) * 8; // Positive BPM only
  score += (winShares || 0) * 1.5;
  
  // Peak performance (10% of score)
  score += ((peakPER || 15) - 20) * 3; // Peak seasons bonus
  
  // Accolades and achievements (20% of score)
  const championships = totals.titles || 0;
  const finalsMVPs = totals.finalsMVPs || 0;
  const allStars = totals.allstars || 0;
  const mvps = totals.mvps || 0;
  const dpoys = totals.dpoys || 0;
  const scoring = totals.scoring || 0;
  
  score += championships * 60; // Championships are extremely valuable
  score += finalsMVPs * 40;
  score += mvps * 50;
  score += allStars * 6;
  score += dpoys * 20;
  score += scoring * 12; // Scoring titles
  
  // Longevity and consistency bonuses
  score += seasons.length * 3; // Years played
  score += Math.min(10, gamesPlayed / 70) * 5; // Durability bonus
  
  // Efficiency penalties for poor shooting/turnovers with safe checks
  if ((avgTS || 0.55) < 0.50) score *= 0.9; // Poor shooting penalty
  if ((avgTOV || 0) > (avgAPG || 0) * 0.4) score *= 0.95; // High turnover penalty
  
  // Ensure no NaN values in final score
  const finalScore = isNaN(score) ? 0 : score;
  return Math.round(Math.max(0, finalScore));
};

const getHallOfFameChance = (game) => {
  const career = game.career;
  if (!career || !career.seasons || career.seasons.length === 0) return 0;
  
  const score = calculatePlayerScore(game);
  const seasons = career.seasons.length;
  const totals = career.totals || {};
  const championships = totals.titles || 0;
  const mvps = totals.mvps || 0;
  const allStars = totals.allstars || 0;
  const finalsMVPs = totals.finalsMVPs || 0;
  
  // Base chance from overall score
  let chance = Math.min(95, score / 12);
  
  // Minimum requirements and modifiers
  if (seasons < 5) chance = Math.min(chance, 15); // Very low for short careers
  if (seasons < 8) chance = Math.min(chance, 35); // Still penalized for shortish careers
  if (seasons >= 15) chance += 10; // Longevity bonus
  
  // Championship and MVP requirements (more stringent)
  if (championships === 0 && mvps === 0) {
    chance = Math.min(chance, 45); // Harder without championships or MVPs
    if (allStars < 5) chance = Math.min(chance, 25); // Much harder without All-Stars
  }
  
  // Elite player bonuses
  if (championships >= 3) chance += 15;
  if (mvps >= 2) chance += 20;
  if (finalsMVPs >= 2) chance += 15;
  if (allStars >= 10) chance += 10;
  
  // Statistical excellence bonuses
  const avgPPG = (totals.points || 0) / Math.max(totals.games || 1, 1);
  const avgAPG = (totals.assists || 0) / Math.max(totals.games || 1, 1);
  const avgRPG = (totals.rebounds || 0) / Math.max(totals.games || 1, 1);
  
  if (avgPPG >= 25) chance += 8;
  if (avgAPG >= 8) chance += 8;
  if (avgRPG >= 12) chance += 8;
  
  return Math.round(Math.max(0, Math.min(100, chance)));
};

const generateCurrentLeagueRankings = (game) => {
  // Generate mock current season stats for top players with more realistic and varied stats
  const mockPlayers = [
    { name: "Luka Dončić", team: "DAL", ppg: 31.2, rpg: 8.9, apg: 9.1, per: 29.8, ts: 0.583 },
    { name: "Jayson Tatum", team: "BOS", ppg: 28.5, rpg: 8.2, apg: 4.8, per: 27.1, ts: 0.571 },
    { name: "Nikola Jokić", team: "DEN", ppg: 26.8, rpg: 12.4, apg: 8.9, per: 31.2, ts: 0.632 },
    { name: "Giannis Antetokounmpo", team: "MIL", ppg: 29.1, rpg: 11.2, apg: 6.1, per: 30.5, ts: 0.598 },
    { name: "Joel Embiid", team: "PHI", ppg: 27.9, rpg: 10.8, apg: 3.2, per: 28.9, ts: 0.588 },
    { name: "Shai Gilgeous-Alexander", team: "OKC", ppg: 30.1, rpg: 5.5, apg: 6.2, per: 28.2, ts: 0.618 },
    { name: "Donovan Mitchell", team: "CLE", ppg: 27.5, rpg: 4.4, apg: 6.0, per: 24.8, ts: 0.572 },
    { name: "Anthony Davis", team: "LAL", ppg: 24.7, rpg: 12.6, apg: 3.5, per: 27.4, ts: 0.589 },
    { name: "De'Aaron Fox", team: "SAC", ppg: 26.6, rpg: 4.6, apg: 6.1, per: 25.1, ts: 0.551 },
    { name: "Paolo Banchero", team: "ORL", ppg: 22.6, rpg: 6.9, apg: 5.4, per: 21.9, ts: 0.544 }
  ];
  
  // Add player's current season stats if available
  const seasons = game.career?.seasons || [];
  const currentSeason = seasons[seasons.length - 1];
  if (currentSeason && currentSeason.averages) {
    const playerStats = {
      name: `${game.firstName || 'Player'} ${game.lastName || ''}`,
      team: game.team || 'N/A',
      ppg: currentSeason.averages.pts || 0,
      rpg: currentSeason.averages.reb || 0,
      apg: currentSeason.averages.ast || 0,
      per: currentSeason.averages.per || 15.0,
      ts: currentSeason.averages.ts || 0.55,
      isPlayer: true
    };
    
    mockPlayers.push(playerStats);
  }
  
  // Calculate a more comprehensive ranking score
  mockPlayers.forEach(player => {
    // Advanced ranking formula considering multiple factors
    player.rankingScore = 
      (player.ppg * 1.0) + 
      (player.rpg * 0.8) + 
      (player.apg * 1.2) + 
      ((player.per - 15) * 1.5) + 
      ((player.ts - 0.55) * 50);
  });
  
  // Sort by comprehensive ranking score and assign rankings
  mockPlayers.sort((a, b) => b.rankingScore - a.rankingScore);
  return mockPlayers.map((player, index) => ({
    ...player,
    rank: index + 1
  }));
};

const generateAllTimeRankings = (game) => {
  // All-time greats for comparison with more balanced scoring
  const allTimeGreats = [
    { name: "Michael Jordan", score: 950, championships: 6, mvps: 5, avgPPG: 30.1, avgPER: 27.9 },
    { name: "LeBron James", score: 920, championships: 4, mvps: 4, avgPPG: 27.2, avgPER: 27.5 },
    { name: "Kareem Abdul-Jabbar", score: 890, championships: 6, mvps: 6, avgPPG: 24.6, avgPER: 25.2 },
    { name: "Magic Johnson", score: 860, championships: 5, mvps: 3, avgPPG: 19.5, avgPER: 24.1 },
    { name: "Larry Bird", score: 840, championships: 3, mvps: 3, avgPPG: 24.3, avgPER: 23.5 },
    { name: "Tim Duncan", score: 820, championships: 5, mvps: 2, avgPPG: 19.0, avgPER: 21.3 },
    { name: "Shaquille O'Neal", score: 800, championships: 4, mvps: 1, avgPPG: 23.7, avgPER: 26.4 },
    { name: "Kobe Bryant", score: 780, championships: 5, mvps: 1, avgPPG: 25.0, avgPER: 22.9 },
    { name: "Hakeem Olajuwon", score: 760, championships: 2, mvps: 1, avgPPG: 21.8, avgPER: 23.6 },
    { name: "Bill Russell", score: 740, championships: 11, mvps: 5, avgPPG: 15.1, avgPER: 18.9 },
    { name: "Wilt Chamberlain", score: 720, championships: 2, mvps: 4, avgPPG: 30.1, avgPER: 26.1 },
    { name: "Stephen Curry", score: 700, championships: 4, mvps: 2, avgPPG: 24.6, avgPER: 23.8 }
  ];
  
  // Add player if they have completed seasons
  const seasons = game.career?.seasons || [];
  if (seasons.length > 0) {
    const playerScore = calculatePlayerScore(game);
    const totals = game.career?.totals || {};
    const gamesPlayed = Math.max(totals.games || 1, 1);
    
    const playerEntry = {
      name: `${game.firstName || 'Player'} ${game.lastName || ''}`,
      score: playerScore,
      championships: totals.titles || 0,
      mvps: totals.mvps || 0,
      avgPPG: (totals.points || 0) / gamesPlayed,
      avgPER: totals.per && totals.per.length > 0 ? 
        totals.per.reduce((a,b) => a+b, 0) / totals.per.length : 15.0,
      isPlayer: true
    };
    
    allTimeGreats.push(playerEntry);
  }
  
  // Sort by score and assign rankings
  allTimeGreats.sort((a, b) => b.score - a.score);
  return allTimeGreats.map((player, index) => ({
    ...player,
    rank: index + 1
  })).slice(0, 20); // Top 20
};

// Calculate age-based performance multiplier
const getAgeMultiplier = (age) => {
  if (age <= 23) return 1.0; // Young players at baseline
  if (age <= 26) return 1.0 + (age - 23) * 0.05; // Gradual improvement: 1.05, 1.10, 1.15
  if (age === 27) return 1.2; // Peak performance age
  if (age <= 30) return 1.2 - (age - 27) * 0.05; // Gradual decline from peak: 1.15, 1.10, 1.05
  if (age <= 35) return 1.0 - (age - 30) * 0.04; // Noticeable decline: 0.96, 0.92, 0.88, 0.84, 0.80
  if (age <= 38) return 0.8 - (age - 35) * 0.08; // Sharp decline: 0.72, 0.64, 0.56
  return 0.5; // Veteran minimum performance
};

// Check if player should be forced to retire
const shouldForceRetirement = (player, seasonAverages) => {
  if (player.age < 35) return false; // No forced retirement before 35
  
  // Define minimum thresholds for continuing career
  const minThresholds = {
    points: 3.0,
    rebounds: 1.5,
    assists: 1.0,
    minutes: 8.0,
    overall: 55
  };
  
  return (
    seasonAverages.points < minThresholds.points &&
    seasonAverages.rebounds < minThresholds.rebounds &&
    seasonAverages.assists < minThresholds.assists &&
    seasonAverages.minutes < minThresholds.minutes
  ) || player.ratings.overall < minThresholds.overall;
};

const STORAGE_KEY = "basketball-life-save-v1";

// ---------- Data ----------
const FIRST_NAMES = [
  "Jalen","Zion","Luka","Jaiden","Marcus","CJ","Devin","Evan","Tyrese","Jamal",
  "Darius","Kyrie","Jayson","Kobe","Trey","Jaxson","Nikola","Gianni","Anthony","Victor",
  "Scoot","Micah","Paolo","Cade","Keegan","Bam","Trae","LaMelo","Shai","Brandon"
];
const LAST_NAMES = [
  "Johnson","Williams","Miller","Davis","Brown","Wilson","Moore","Taylor","Anderson","Thomas",
  "Jackson","White","Harris","Martin","Thompson","Garcia","Martinez","Robinson","Clark","Rodriguez",
  "Young","Allen","King","Wright","Lopez","Hill","Scott","Green","Adams","Baker"
];

// ---------- Game Data ----------

const POSITIONS = ["PG","SG","SF","PF","C"];
const SKILLS = ["shooting","finishing","defense","playmaking","rebounding","athleticism"];

const NBA_TEAMS = {
  "Lakers": { 
    name: "Los Angeles Lakers", 
    strength: 85, 
    colors: { primary: "#552583", secondary: "#FDB927", text: "#FFFFFF" },
    conference: "West"
  },
  "Warriors": { 
    name: "Golden State Warriors", 
    strength: 88, 
    colors: { primary: "#1D428A", secondary: "#FFC72C", text: "#FFFFFF" },
    conference: "West"
  },
  "Celtics": { 
    name: "Boston Celtics", 
    strength: 90, 
    colors: { primary: "#007A33", secondary: "#BA9653", text: "#FFFFFF" },
    conference: "East"
  },
  "Heat": { 
    name: "Miami Heat", 
    strength: 82, 
    colors: { primary: "#98002E", secondary: "#F9A01B", text: "#FFFFFF" },
    conference: "East"
  },
  "Nets": { 
    name: "Brooklyn Nets", 
    strength: 75, 
    colors: { primary: "#000000", secondary: "#FFFFFF", text: "#FFFFFF" },
    conference: "East"
  },
  "Knicks": { 
    name: "New York Knicks", 
    strength: 83, 
    colors: { primary: "#006BB6", secondary: "#F58426", text: "#FFFFFF" },
    conference: "East"
  },
  "Bulls": { 
    name: "Chicago Bulls", 
    strength: 77, 
    colors: { primary: "#CE1141", secondary: "#000000", text: "#FFFFFF" },
    conference: "East"
  },
  "76ers": { 
    name: "Philadelphia 76ers", 
    strength: 84, 
    colors: { primary: "#006BB6", secondary: "#ED174C", text: "#FFFFFF" },
    conference: "East"
  },
  "Nuggets": { 
    name: "Denver Nuggets", 
    strength: 92, 
    colors: { primary: "#0E2240", secondary: "#FEC524", text: "#FFFFFF" },
    conference: "West"
  },
  "Clippers": { 
    name: "LA Clippers", 
    strength: 81, 
    colors: { primary: "#C8102E", secondary: "#1D428A", text: "#FFFFFF" },
    conference: "West"
  },
  "Suns": { 
    name: "Phoenix Suns", 
    strength: 86, 
    colors: { primary: "#1D1160", secondary: "#E56020", text: "#FFFFFF" },
    conference: "West"
  },
  "Mavericks": { 
    name: "Dallas Mavericks", 
    strength: 87, 
    colors: { primary: "#00538C", secondary: "#002B5E", text: "#FFFFFF" },
    conference: "West"
  },
  "Rockets": { 
    name: "Houston Rockets", 
    strength: 72, 
    colors: { primary: "#CE1141", secondary: "#000000", text: "#FFFFFF" },
    conference: "West"
  },
  "Spurs": { 
    name: "San Antonio Spurs", 
    strength: 70, 
    colors: { primary: "#C4CED4", secondary: "#000000", text: "#000000" },
    conference: "West"
  },
  "Jazz": { 
    name: "Utah Jazz", 
    strength: 74, 
    colors: { primary: "#002B5C", secondary: "#F9A01B", text: "#FFFFFF" },
    conference: "West"
  },
  "Trail Blazers": { 
    name: "Portland Trail Blazers", 
    strength: 68, 
    colors: { primary: "#E03A3E", secondary: "#000000", text: "#FFFFFF" },
    conference: "West"
  },
  "Kings": { 
    name: "Sacramento Kings", 
    strength: 76, 
    colors: { primary: "#5A2D81", secondary: "#63727A", text: "#FFFFFF" },
    conference: "West"
  },
  "Thunder": { 
    name: "Oklahoma City Thunder", 
    strength: 89, 
    colors: { primary: "#007AC1", secondary: "#EF3B24", text: "#FFFFFF" },
    conference: "West"
  },
  "Timberwolves": { 
    name: "Minnesota Timberwolves", 
    strength: 85, 
    colors: { primary: "#0C2340", secondary: "#236192", text: "#FFFFFF" },
    conference: "West"
  },
  "Pelicans": { 
    name: "New Orleans Pelicans", 
    strength: 73, 
    colors: { primary: "#0C2340", secondary: "#C8102E", text: "#FFFFFF" },
    conference: "West"
  },
  "Grizzlies": { 
    name: "Memphis Grizzlies", 
    strength: 78, 
    colors: { primary: "#5D76A9", secondary: "#12173F", text: "#FFFFFF" },
    conference: "West"
  },
  "Hawks": { 
    name: "Atlanta Hawks", 
    strength: 79, 
    colors: { primary: "#E03A3E", secondary: "#C1D32F", text: "#FFFFFF" },
    conference: "East"
  },
  "Hornets": { 
    name: "Charlotte Hornets", 
    strength: 71, 
    colors: { primary: "#1D1160", secondary: "#00788C", text: "#FFFFFF" },
    conference: "East"
  },
  "Magic": { 
    name: "Orlando Magic", 
    strength: 80, 
    colors: { primary: "#0077C0", secondary: "#C4CED4", text: "#FFFFFF" },
    conference: "East"
  },
  "Pistons": { 
    name: "Detroit Pistons", 
    strength: 66, 
    colors: { primary: "#C8102E", secondary: "#1D42BA", text: "#FFFFFF" },
    conference: "East"
  },
  "Pacers": { 
    name: "Indiana Pacers", 
    strength: 81, 
    colors: { primary: "#002D62", secondary: "#FDBB30", text: "#FFFFFF" },
    conference: "East"
  },
  "Cavaliers": { 
    name: "Cleveland Cavaliers", 
    strength: 84, 
    colors: { primary: "#860038", secondary: "#FDBB30", text: "#FFFFFF" },
    conference: "East"
  },
  "Raptors": { 
    name: "Toronto Raptors", 
    strength: 75, 
    colors: { primary: "#CE1141", secondary: "#000000", text: "#FFFFFF" },
    conference: "East"
  },
  "Wizards": { 
    name: "Washington Wizards", 
    strength: 69, 
    colors: { primary: "#002B5C", secondary: "#E31837", text: "#FFFFFF" },
    conference: "East"
  },
  "Bucks": { 
    name: "Milwaukee Bucks", 
    strength: 86, 
    colors: { primary: "#00471B", secondary: "#EEE1C6", text: "#FFFFFF" },
    conference: "East"
  }
};

const TEAMS = Object.keys(NBA_TEAMS);

const ARENAS = ["Fieldhouse","Coliseum","Garden","Forum","Center","Pavilion","Dome"]; 

const ARCHETYPES = {
  Scorer:      { shooting: 78, finishing: 70, playmaking: 62, defense: 58, rebounding: 52, stamina: 65, dunking: 68, passing: 60, leadership: 55 },
  Playmaker:   { shooting: 68, finishing: 66, playmaking: 80, defense: 60, rebounding: 50, stamina: 70, dunking: 55, passing: 85, leadership: 75 },
  TwoWay:      { shooting: 70, finishing: 68, playmaking: 60, defense: 78, rebounding: 62, stamina: 72, dunking: 65, passing: 65, leadership: 68 },
  Stretch:     { shooting: 80, finishing: 60, playmaking: 58, defense: 60, rebounding: 72, stamina: 60, dunking: 50, passing: 62, leadership: 58 },
  Slasher:     { shooting: 62, finishing: 82, playmaking: 66, defense: 62, rebounding: 56, stamina: 75, dunking: 80, passing: 68, leadership: 60 },
  Big:         { shooting: 58, finishing: 76, playmaking: 54, defense: 72, rebounding: 82, stamina: 68, dunking: 78, passing: 52, leadership: 65 },
};

const AWARDS = ["MVP","DPOY","6MOY","MIP","Scoring Title","All-Star","Finals MVP","ROY"];

const SHOE_BRANDS = [
  { name: "AirJordan", minOverall: 75, minFollowers: 100000, base: 400, risk: 0.03 },
  { name: "Nike", minOverall: 70, minFollowers: 50000, base: 350, risk: 0.04 },
  { name: "Adidas", minOverall: 68, minFollowers: 40000, base: 280, risk: 0.05 },
  { name: "Puma", minOverall: 65, minFollowers: 30000, base: 220, risk: 0.06 },
  { name: "Under Armour", minOverall: 62, minFollowers: 20000, base: 180, risk: 0.07 },
  { name: "NewBalance", minOverall: 60, minFollowers: 15000, base: 150, risk: 0.08 },
];

const PREMIUM_SERVICES = [
  { name: "Private Chef", cost: 50, healthBoost: 15, peakBoost: 5, duration: 4 },
  { name: "Personal Trainer", cost: 80, ratingBoost: 2, peakBoost: 10, duration: 6 },
  { name: "Mental Coach", cost: 60, moraleBoost: 20, leadershipBoost: 3, duration: 5 },
  { name: "Recovery Specialist", cost: 70, healthBoost: 25, peakBoost: 15, duration: 4 },
  { name: "Media Training", cost: 40, followersBoost: 10000, duration: 3 },
];

// ---------- Generators ----------
function genName(){ return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`; }
function genTeam(){ return pick(TEAMS); }
function genArena(team){ return `${team.split(" ")[0]} ${pick(ARENAS)}`; }
function startingAge(){ return irnd(18, 22); }
function pickArchetype(){ return pick(Object.keys(ARCHETYPES)); }

function baseRatings(arch){
  const base = ARCHETYPES[arch];
  const jitter = (x) => clamp(Math.round(x + irnd(-6,6)), 40, 95);
  const r = {
    shooting: jitter(base.shooting),
    finishing: jitter(base.finishing),
    playmaking: jitter(base.playmaking),
    defense: jitter(base.defense),
    rebounding: jitter(base.rebounding),
    stamina: jitter(base.stamina),
    dunking: jitter(base.dunking),
    passing: jitter(base.passing),
    leadership: jitter(base.leadership),
  };
  const mainStats = [r.shooting, r.finishing, r.playmaking, r.defense, r.rebounding];
  r.overall = Math.round(mainStats.reduce((a,b) => a+b, 0) / 5);
  return r;
}

function rookieContract(overall){
  const years = 2 + (overall > 78 ? 2 : overall > 70 ? 1 : 0);
  const value = Math.round((overall * 80 + irnd(100, 500)) * years); // $k
  return { team: genTeam(), years, salary: value, clause: chance(0.2) ? "Team Option" : "None" };
}

// ---------- Core Models ----------
function newPlayer(custom){
  const name = custom?.name || genName();
  const age = custom?.age || startingAge();
  const arch = custom?.archetype || pickArchetype();
  const ratings = baseRatings(arch);
  const rookie = rookieContract(ratings.overall);
  return {
    name, age, archetype: arch, ratings, potential: clamp(ratings.overall + irnd(4,15), 70, 99),
    morale: 70, health: 100, peak: 90, fame: 5, followers: irnd(1000, 5000), cash: 50, 
    endorsements: [], shoeDeals: [], premiumServices: [],
    team: rookie.team, arena: genArena(rookie.team), jersey: irnd(0,99),
    contract: { ...rookie, year: 1 },
    season: 1, week: 1, phase: "Preseason", // Preseason, Regular, Playoffs, Offseason
    teamChem: irnd(40,75), teamStrength: irnd(65,85), teamStanding: irnd(8,15),
    teammates: generateTeammates(),
    stats: resetSeasonStats(),
    league: initializeLeague(),
    career: { seasons: [], awards: [], totals: resetCareerTotals(), timeline: [event("Signed", `Drafted by ${rookie.team}`)] },
    alive: true, retired: false,
  };
}

function initializeLeague() {
  const standings = {};
  TEAMS.forEach(teamKey => {
    const teamInfo = NBA_TEAMS[teamKey];
    // Initialize with base strength but add some randomness for league parity
    const strengthVariation = (Math.random() - 0.5) * 20; // ±10 strength variation
    const adjustedStrength = Math.max(50, Math.min(95, teamInfo.strength + strengthVariation));
    
    // Convert strength to approximate wins (more realistic range)
    const baseWins = Math.round((adjustedStrength - 30) * 0.8); // Converts 50-95 strength to roughly 16-52 wins
    const randomVariation = Math.round((Math.random() - 0.5) * 20); // ±10 wins variation
    const currentSeasonWins = Math.max(10, Math.min(72, baseWins + randomVariation));
    
    standings[teamKey] = {
      name: teamInfo.name,
      wins: currentSeasonWins,
      losses: 82 - currentSeasonWins,
      winPct: currentSeasonWins / 82,
      conference: teamInfo.conference,
      baseStrength: teamInfo.strength,
      currentStrength: adjustedStrength,
      championships: 0,
      playoffAppearances: 0,
      lastPlayoff: null,
      lastChampionship: null,
      seasonProgress: 0 // Tracks how many games into season
    };
  });
  return { standings, season: 1 };
}

// Function to update standings consistently across the game
function updateStandings(game, weeksProgressed = 1) {
  const standings = { ...game.league.standings };
  
  TEAMS.forEach(teamKey => {
    const team = standings[teamKey];
    if (!team) return;
    
    // Simulate games based on current strength + some randomness for 82-game season
    const currentForm = team.currentStrength + (Math.random() - 0.5) * 12; // Reduced variance for realism
    const expectedWinRate = Math.max(0.20, Math.min(0.80, currentForm / 100)); // 20-80% win rate range
    
    // Each week represents 10 games now (82 games / ~8.2 weeks)
    const gamesThisWeek = game.phase === "Regular" ? 10 : 3; // More games during regular season
    let newWins = 0;
    
    for (let i = 0; i < gamesThisWeek; i++) {
      if (Math.random() < expectedWinRate) {
        newWins++;
      }
    }
    
    const newLosses = gamesThisWeek - newWins;
    const totalGamesAfter = team.wins + team.losses + gamesThisWeek;
    
    // Ensure we don't exceed 82 games in regular season
    if (totalGamesAfter <= 82 || game.phase !== "Regular") {
      team.wins = team.wins + newWins;
      team.losses = team.losses + newLosses;
      team.winPct = team.wins / (team.wins + team.losses);
      team.seasonProgress += gamesThisWeek;
    }
    
    // More stable team strength - teams don't fluctuate as wildly
    const strengthChange = (Math.random() - 0.5) * 1.5; // Smaller changes for stability
    team.currentStrength = Math.max(50, Math.min(90, team.currentStrength + strengthChange));
  });
  
  return standings;
}

// Get consistent standings sorted by conference
function getStandings(game) {
  const standings = game.league.standings;
  const standingsArray = Object.keys(standings).map(teamKey => ({
    team: teamKey,
    ...standings[teamKey],
    isPlayerTeam: teamKey === game.team
  }));
  
  return standingsArray.sort((a, b) => b.winPct - a.winPct);
}

// Get conference-specific standings
function getConferenceStandings(game, conference) {
  return getStandings(game).filter(team => team.conference === conference);
}

function generateTeammates(){
  const count = irnd(4, 7);
  const teammates = [];
  for(let i = 0; i < count; i++){
    teammates.push({
      name: genName(),
      overall: irnd(55, 85),
      ppg: irnd(8, 24),
      rpg: irnd(3, 12),
      apg: irnd(2, 9),
      position: pick(["PG", "SG", "SF", "PF", "C"]),
    });
  }
  return teammates;
}

function resetSeasonStats(){
  return {
    games: 0, minutes: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0,
    fgMade: 0, fgAtt: 0, threesMade: 0, threesAtt: 0, ftMade: 0, ftAtt: 0,
    wins: 0, losses: 0, playoffs: false, champion: false, finalsMVP: false,
    gameLogs: [],
  };
}

function resetCareerTotals(){
  return {
    games: 0, minutes: 0, points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0,
    fgMade: 0, fgAtt: 0, threesMade: 0, threesAtt: 0, ftMade: 0, ftAtt: 0,
    titles: 0, mvps: 0, dpoys: 0, sixmoys: 0, mips: 0, scoring: 0, allstars: 0, roys: 0, finalsMVPs: 0,
    wins: 0, losses: 0, per: [], ts: [], usage: [],
  };
}

function event(type, text){
  return { id: cryptoRandomId(), weekStamp: Date.now(), type, text };
}

function cryptoRandomId(){
  // reasonably unique without external libs
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36).slice(2);
}

// ---------- Simulation ----------
function playerGameSim(p){
  // Base minutes depend on peak/health and team strength - much more realistic
  const peakFactor = p.peak / 100;
  const healthFactor = p.health / 100;
  const ageMultiplier = getAgeMultiplier(p.age);
  
  // High-rated players get more consistency in minutes and performance
  const consistencyFactor = p.ratings.overall >= 90 ? 1.2 : 
                           p.ratings.overall >= 85 ? 1.1 : 
                           p.ratings.overall >= 80 ? 1.05 : 1.0;
  
  // More realistic minutes calculation with better consistency for stars
  const minsVariance = p.ratings.overall >= 85 ? 6 : 8; // Less variance for better players
  const mins = clamp(18 + irnd(-3, minsVariance) + Math.round((p.ratings.overall-70)/5) + Math.round(peakFactor * 6) - Math.round((100-p.health)/15), 8, 40);
  
  // More conservative usage calculation with star bonus
  const usageBase = 0.16 + (p.ratings.overall-60)/100 * 0.18; // Max ~34% usage for 100 OVR
  const starUsageBonus = p.ratings.overall >= 90 ? 0.02 : p.ratings.overall >= 85 ? 0.01 : 0;
  const usage = clamp(usageBase + starUsageBonus + (p.ratings.shooting + p.ratings.finishing)/300 * 0.08 + rnd(-0.02, 0.02), 0.12, 0.35);
  
  // Shot attempts with consistency for high-rated players
  const shotsBase = Math.max(3, Math.round(mins * 0.7 * usage));
  
  // Enhanced efficiency scaling for high-rated players
  let efficiencyMultiplier = 0.8; // Start lower
  
  // Better scaling for high overall ratings with consistency
  if (p.ratings.overall >= 95) {
    efficiencyMultiplier += 0.18; // Elite players get better consistency
  } else if (p.ratings.overall >= 90) {
    efficiencyMultiplier += 0.15; // Stars get good consistency  
  } else if (p.ratings.overall >= 85) {
    efficiencyMultiplier += 0.12; // Above average players
  } else if (p.ratings.overall >= 80) {
    efficiencyMultiplier += 0.08; // Good players
  } else if (p.ratings.overall >= 75) {
    efficiencyMultiplier += 0.04; // Average players
  }
  
  // Enhanced skill effects for high-rated players
  const shootingEffect = Math.max(0, (p.ratings.shooting - 75) / 100 * 0.1);
  const finishingEffect = Math.max(0, (p.ratings.finishing - 75) / 100 * 0.1);
  
  // Condition impact with star player resilience
  const conditionPenalty = p.ratings.overall >= 85 ? 0.8 : 1.0; // Stars handle fatigue better
  efficiencyMultiplier += (peakFactor - 0.5) * 0.12 * conditionPenalty;
  efficiencyMultiplier += (healthFactor - 0.5) * 0.10 * conditionPenalty;
  efficiencyMultiplier += shootingEffect + finishingEffect;
  
  // Age effects with star longevity
  if (p.age >= 30) {
    const experienceBonus = p.ratings.overall >= 85 ? 0.04 : 0.03; // Stars get more from experience
    efficiencyMultiplier += Math.min(experienceBonus, (p.age - 30) * 0.007);
    const agePenalty = p.ratings.overall >= 90 ? 0.01 : 0.015; // Stars age better
    efficiencyMultiplier -= Math.max(0, (p.age - 33) * agePenalty);
  }
  
  // Apply consistency factor to reduce variance for stars
  const shots = Math.round(shotsBase * Math.max(0.6, efficiencyMultiplier * consistencyFactor));
  
  // Three-point rates with star player intelligence
  const threeRateBase = 0.25 + Math.max(0, (p.ratings.shooting-70)/100 * 0.20);
  const smartShooting = p.ratings.overall >= 85 ? 0.02 : 0; // Stars take better shots
  const threeRate = clamp(threeRateBase + smartShooting + rnd(-0.04, 0.04), 0.15, 0.45);
  const threes = Math.round(shots * threeRate);
  const twos = Math.max(0, shots - threes);

  // Enhanced shooting percentages with better consistency for high-rated players
  const shootingBonus = p.ratings.shooting >= 95 ? 0.05 : 
                       p.ratings.shooting >= 90 ? 0.04 : 
                       p.ratings.shooting >= 85 ? 0.03 : 
                       p.ratings.shooting >= 80 ? 0.02 : 0;
  const finishingBonus = p.ratings.finishing >= 95 ? 0.04 : 
                        p.ratings.finishing >= 90 ? 0.03 : 
                        p.ratings.finishing >= 85 ? 0.02 : 
                        p.ratings.finishing >= 80 ? 0.01 : 0;
  
  // Reduced variance for high-rated players
  const variance = p.ratings.overall >= 85 ? 0.03 : 0.05;
  
  // Better shooting percentage ranges with consistency
  const fg2Pct = clamp(0.45 + (p.ratings.finishing-70)/100 * 0.18 + finishingBonus + (healthFactor-0.5)*0.04 + rnd(-variance, variance), 0.38, 0.65);
  const fg3Pct = clamp(0.33 + (p.ratings.shooting-70)/100 * 0.15 + shootingBonus + (peakFactor-0.5)*0.03 + rnd(-variance, variance), 0.28, 0.50);
  const ftPct  = clamp(0.72 + (p.ratings.shooting-70)/100 * 0.18 + shootingBonus*0.5 + rnd(-0.02, 0.02), 0.65, 0.92);

  const made2 = binomial(twos, fg2Pct);
  const made3 = binomial(threes, fg3Pct);
  const and1  = binomial(made2 + made3, 0.06);
  const fts   = and1 * 1 + irnd(0,3);
  const ftm   = binomial(fts, ftPct);

  // Enhanced statistical consistency for high-rated players
  const playmakingFactor = 0.12 + (p.ratings.playmaking >= 90 ? 0.1 : p.ratings.playmaking >= 80 ? 0.07 : p.ratings.playmaking >= 70 ? 0.04 : 0);
  const reboundingFactor = 0.18 + (p.ratings.rebounding >= 90 ? 0.14 : p.ratings.rebounding >= 80 ? 0.10 : p.ratings.rebounding >= 70 ? 0.06 : 0);
  const defenseFactor = 0.03 + (p.ratings.defense >= 90 ? 0.025 : p.ratings.defense >= 80 ? 0.02 : p.ratings.defense >= 70 ? 0.015 : 0);

  // Apply age multiplier and consistency to counting stats
  const baseAst = poisson(mins * (p.ratings.playmaking/100) * playmakingFactor);
  const baseReb = poisson(mins * (p.ratings.rebounding/100) * reboundingFactor);
  const baseStl = poisson(mins * (p.ratings.defense/100) * defenseFactor);
  const baseBlk = poisson(mins * (p.ratings.defense/100) * (defenseFactor * 0.8));

  const ast = Math.round(baseAst * ageMultiplier * consistencyFactor);
  const reb = Math.round(baseReb * ageMultiplier * consistencyFactor);
  const stl = Math.round(baseStl * ageMultiplier);
  const blk = Math.round(baseBlk * ageMultiplier);
  const pts = Math.round((made2*2 + made3*3 + ftm) * ageMultiplier);

  // Calculate advanced stats
  const per = calculatePER(pts, reb, ast, stl, blk, made2 + made3, twos + threes, ftm, fts, mins);
  const ts = calculateTS(pts, twos + threes, fts);

  return {
    minutes: mins,
    fgMade: made2 + made3,
    fgAtt: twos + threes,
    threesMade: made3,
    threesAtt: threes,
    ftMade: ftm,
    ftAtt: fts,
    points: pts,
    rebounds: reb,
    assists: ast,
    steals: stl,
    blocks: blk,
    per: per,
    ts: ts,
    usage: usage,
    ageMultiplier: ageMultiplier,
    consistencyFactor: consistencyFactor, // Include for transparency
  };
}

function calculatePER(pts, reb, ast, stl, blk, fgm, fga, ftm, fta, mins) {
  if (mins === 0) return 0;
  
  // More accurate PER calculation based on NBA formula
  // Positive contributions
  const posContrib = (fgm * 85.910) + (stl * 53.897) + (ast * 34.677) + 
                    (ftm * 46.845) + (blk * 39.190) + (reb * 39.190);
  
  // Negative contributions (missed shots and free throws)
  const negContrib = ((fga - fgm) * 39.190) + ((fta - ftm) * 20.091);
  
  // Turnovers approximation (roughly 15% of possessions for average player)
  const estimatedTurnovers = (fga + fta * 0.44 + ast) * 0.12;
  const turnoverPenalty = estimatedTurnovers * 53.897;
  
  // Calculate unadjusted PER
  const uPER = (1/mins) * (posContrib - negContrib - turnoverPenalty);
  
  // Pace adjustment (assumed league pace of 100 possessions per 48 minutes)
  const paceAdjusted = uPER * (48 / 100);
  
  // League average is 15.00, ensure we don't go below 0
  return Math.max(0, Math.min(50, paceAdjusted)); // Cap at 50 for sanity
}

function calculateTS(pts, fga, fta) {
  if (fga === 0 && fta === 0) return 0;
  return pts / (2 * (fga + 0.44 * fta));
}

function binomial(n, p){
  let k = 0; for(let i=0;i<n;i++){ if(Math.random()<p) k++; } return k;
}
function poisson(lambda){
  // Knuth's algorithm
  let L=Math.exp(-lambda), k=0, p=1; do{ k++; p*=Math.random(); }while(p>L); return k-1;
}

function teamWinChance(p, gameState){
  const starPower = (p.ratings.overall - 70) * 0.006 + p.fame * 0.002;
  const chem = (p.teamChem-50)/100 * 0.08;
  
  // Use actual NBA team strength and standings position for realistic win chances
  const teamInfo = NBA_TEAMS[p.team];
  const actualTeamStrength = teamInfo ? teamInfo.strength : p.teamStrength;
  
  // Get team's current standing position (1-30) - use gameState parameter
  const standings = getStandings(gameState);
  const teamStanding = standings.findIndex(team => team.team === p.team) + 1;
  
  // Base win chance heavily on team strength and current standing
  // Top 8 teams have much better chances, bottom teams struggle
  let baseChance = 0.15; // Very low base for bad teams
  if (teamStanding <= 4) baseChance = 0.70; // Elite teams
  else if (teamStanding <= 8) baseChance = 0.55; // Good playoff teams  
  else if (teamStanding <= 16) baseChance = 0.35; // Mediocre teams
  else if (teamStanding <= 24) baseChance = 0.20; // Poor teams
  
  // Player impact (reduced from original)
  const strength = (actualTeamStrength-70)/100 * 0.12; // Reduced team strength impact
  const peak = (p.peak-50)/100 * 0.04;
  const health = (p.health-50)/100 * 0.03;
  const morale = (p.morale-70)/100 * 0.02;
  
  return clamp(baseChance + starPower + chem + strength + peak + health + morale, 0.05, 0.80);
}

function progressAging(p){
  // development curve: improve early, plateau, decline later
  const dev = p.potential - p.ratings.overall;
  let delta = 0;
  if(p.age <= 24) delta = clamp( (dev>0? rnd(0.2,1.5): rnd(-0.5,0.5)) + rnd(-0.4,0.4), -1.0, 2.0);
  else if(p.age <= 28) delta = clamp( rnd(-0.3, 1.2), -0.8, 1.5);
  else if(p.age <= 32) delta = clamp( rnd(-1.0, 0.6), -1.6, 1.0);
  else delta = clamp( rnd(-2.2, -0.2), -3.0, 0.2);
  const keys = ["shooting","finishing","playmaking","defense","rebounding","stamina","dunking","passing","leadership"];
  keys.forEach(k=>{ 
    if(["shooting","finishing","playmaking","defense","rebounding"].includes(k)) {
      p.ratings[k] = clamp(Math.round(p.ratings[k] + delta + rnd(-0.4,0.4)), 40, 99);
    } else {
      p.ratings[k] = clamp(Math.round(p.ratings[k] + delta*0.7 + rnd(-0.3,0.3)), 40, 99);
    }
  });
  const mainStats = [p.ratings.shooting, p.ratings.finishing, p.ratings.playmaking, p.ratings.defense, p.ratings.rebounding];
  p.ratings.overall = Math.round(mainStats.reduce((a,b)=>a+b,0)/5);
}

function endSeasonAwards(player, league){
  const avg = seasonAverages(player.stats);
  const awards = [];
  
  // MVP - More achievable but still elite
  const mvpThreshold = 24 + rnd(-2, 2); // Reduced threshold
  const mvpWinPct = 0.55; // Reduced win requirement
  if(avg.pts >= mvpThreshold && avg.winsPct >= mvpWinPct && player.ratings.overall >= 83) {
    // Additional criteria for MVP
    const efficiency = avg.per >= 23; // Lowered PER requirement
    const wellRounded = (avg.reb >= 5 && avg.ast >= 4) || (avg.reb >= 7) || (avg.ast >= 7);
    const teamSuccess = avg.winsPct >= 0.60;
    const statLeader = avg.pts >= league.scoringLeader - 2; // Near scoring leader
    
    if((efficiency || wellRounded || teamSuccess || statLeader) && chance(0.55)) { // Increased to 55% chance
      awards.push("MVP");
    }
  }
  
  // DPOY - More achievable for defensive players
  const dpoyThreshold = 3.0 + rnd(-0.3, 0.3); // Lowered threshold
  if(avg.stl + avg.blk >= dpoyThreshold && avg.winsPct >= 0.40 && player.ratings.defense >= 78) {
    if(chance(0.40)) awards.push("DPOY"); // Increased to 40% chance
  }
  
  // Finals MVP - More realistic distribution
  if(player.stats.finals && avg.winsPct >= 0.70) {
    const fmvpChance = Math.min(0.75, 0.35 + (avg.pts - 20) * 0.03 + (avg.winsPct - 0.70) * 1.0);
    if(chance(fmvpChance)) awards.push("Finals MVP");
  }
  
  // Rookie of the Year - First year players only
  if(player.season === 1 && avg.pts >= 14 && avg.mins >= 22) { // Lowered requirements
    awards.push("ROY");
  }
  
  // Scoring Title - Must lead league in scoring
  if(avg.pts >= league.scoringLeader - 0.5) { // Slightly more lenient
    awards.push("Scoring Title");
  }
  
  // All-Star - More achievable
  const allStarPPG = 16 + rnd(-2, 2); // Lowered threshold
  if(avg.pts >= allStarPPG && avg.winsPct >= 0.30 && player.ratings.overall >= 72) {
    const allStarChance = Math.min(0.8, 0.3 + (avg.pts - 16) * 0.025 + (avg.winsPct - 0.30) * 0.7);
    if(chance(allStarChance)) awards.push("All-Star");
  }
  
  // Most Improved Player - More frequent for growth
  if(avg.improved && player.season > 1 && chance(0.25)) { // Increased chance
    awards.push("MIP");
  }
  
  // Sixth Man of the Year - Bench players only  
  if(avg.benchBeast && chance(0.3)) { // Increased chance
    awards.push("6MOY");
  }
  
  return awards;
}

function seasonAverages(s){
  const gp = Math.max(1, s.games);
  const mins = s.minutes/gp, pts=s.points/gp, reb=s.rebounds/gp, ast=s.assists/gp, stl=s.steals/gp, blk=s.blocks/gp;
  const fgPct = s.fgAtt? s.fgMade/s.fgAtt : 0; 
  const tpPct = s.threesAtt? s.threesMade/s.threesAtt:0; 
  const ftPct = s.ftAtt? s.ftMade/s.ftAtt:0;
  const winsPct = gp? s.wins/gp:0;
  const improved = gp>10 && (pts>18 || ast>7 || reb>10) && chance(0.3);
  const benchBeast = mins<24 && pts>14 && chance(0.4);
  
  // Calculate advanced stats averages
  const per = s.gameLogs.length ? s.gameLogs.reduce((sum, log) => sum + (log.per || 0), 0) / s.gameLogs.length : 0;
  const ts = s.gameLogs.length ? s.gameLogs.reduce((sum, log) => sum + (log.ts || 0), 0) / s.gameLogs.length : 0;
  const usage = s.gameLogs.length ? s.gameLogs.reduce((sum, log) => sum + (log.usage || 0), 0) / s.gameLogs.length : 0;
  
  return { gp, mins, pts, reb, ast, stl, blk, fgPct, tpPct, ftPct, winsPct, improved, benchBeast, per, ts, usage };
}

function playoffsSim(player, gameState){
  // Only top 16 teams make playoffs - check if team qualifies
  const standings = getStandings(gameState);
  const teamStanding = standings.findIndex(team => team.team === player.team) + 1;
  
  // If team is not in playoff position (top 16), no championship possible
  if(teamStanding > 16) {
    return { champion: false, finalsMVP: false, wins: 0 };
  }
  
  // 4 rounds for realistic playoffs: First Round, Conference Semis, Conference Finals, NBA Finals
  let rounds = ["First Round", "Conference Semifinals", "Conference Finals", "NBA Finals"]; 
  let champion = false; 
  let finalsMVP = false; 
  let wins = 0;
  
  rounds.forEach((r, idx) => {
    const wc = teamWinChance(player, gameState);
    
    // Each round gets progressively harder - reduce win chance
    let adjustedWinChance = wc;
    if(idx === 1) adjustedWinChance *= 0.9; // Conference Semis slightly harder
    if(idx === 2) adjustedWinChance *= 0.8; // Conference Finals harder
    if(idx === 3) adjustedWinChance *= 0.7; // NBA Finals much harder
    
    const won = chance(adjustedWinChance);
    if(won) {
      wins++;
      
      // Only if you win the Finals do you become champion
      if(idx === 3) { 
        champion = true;
        
        // Finals MVP is very rare and requires exceptional performance
        const playerAvg = seasonAverages(player.stats);
        const isEliteScorer = playerAvg.pts >= 25;
        const isAllAround = playerAvg.pts >= 20 && playerAvg.reb >= 8 && playerAvg.ast >= 6;
        const isTeamLeader = player.ratings.overall >= 85;
        const teamStandingBonus = teamStanding <= 4 ? 0.3 : teamStanding <= 8 ? 0.2 : 0.1;
        
        // Much more strict Finals MVP criteria
        let fmvpChance = 0.15; // Base 15% chance
        if(isEliteScorer) fmvpChance += 0.25;
        if(isAllAround) fmvpChance += 0.20;
        if(isTeamLeader) fmvpChance += 0.15;
        fmvpChance += teamStandingBonus;
        
        // Cap at 75% max chance
        finalsMVP = chance(Math.min(0.75, fmvpChance));
      }
    } else {
      // Lost this round, season over
      return;
    }
  });
  
  return { champion, finalsMVP, wins };
}

// ---------- Endorsements & Events ----------
const ENDORSEMENTS = [
  { name: "HyperBounce Shoes", minOverall: 70, base: 200, risk: 0.05 },
  { name: "Swish Soda", minOverall: 65, base: 120, risk: 0.08 },
  { name: "DefendPro Gear", minOverall: 68, base: 150, risk: 0.06 },
  { name: "StreamHoops", minOverall: 75, base: 260, risk: 0.04 },
  { name: "RimRock Energy", minOverall: 72, base: 180, risk: 0.07 },
];

const LIFE_EVENTS = [
  (p)=>({ text: "Local fans start a chant with your name.", morale:+5, fame:+3, followers: +2000 }),
  (p)=>({ text: "You volunteer at a youth clinic.", morale:+6, fame:+2, followers: +1500 }),
  (p)=>({ text: "Minor ankle sprain in practice.", health:-6, peak:-8 }),
  (p)=>({ text: "Viral trickshot video boosts your profile.", fame:+5, followers: +8000 }),
  (p)=>({ text: "Locker room disagreement.", morale:-5, teamChem:-4 }),
  (p)=>({ text: "Meditation retreat weekend.", peak:+10, morale:+4 }),
  (p)=>({ text: "Random drug test (you pass).", morale:-1 }),
  (p)=>({ text: "You adopt a rescue dog named Bouncy.", morale:+7, followers: +3000 }),
  (p)=>({ text: "Featured on magazine cover.", fame:+8, followers: +12000, cash: +25 }),
  (p)=>({ text: "Charity event raises $50k for local schools.", morale:+8, fame:+6, followers: +5000 }),
  (p)=>({ text: "Controversial social media post backfires.", fame:-3, followers: -8000, morale:-3 }),
  (p)=>({ text: "You discover a new pregame ritual.", peak:+5, morale:+3 }),
  (p)=>({ text: "Invited to exclusive basketball camp.", dunking: +1, leadership: +1 }),
  (p)=>({ text: "Food poisoning from team dinner.", health:-10, peak:-15 }),
  (p)=>({ text: "Win slam dunk contest at local event.", fame:+4, followers: +6000, dunking: +2 }),
  
  // New social media and challenge events
  (p)=>({ text: "Your workout video goes viral on social media.", fame:+6, followers: +15000, peak: +3 }),
  (p)=>({ text: "Challenged by fan to 3-point contest - you win!", fame:+3, followers: +4000, shooting: +0.5 }),
  (p)=>({ text: "Your motivational post gets 1M likes.", fame:+4, followers: +10000, morale: +5 }),
  (p)=>({ text: "Trash talk from rival player motivates you.", morale:+8, peak: +5 }),
  (p)=>({ text: "You start a podcast about basketball.", fame:+7, followers: +8000, cash: +15 }),
  (p)=>({ text: "Bet with teammate on free throw shooting - you lose.", morale:-2, cash: -5 }),
  (p)=>({ text: "Late night gaming session affects your energy.", peak:-8, morale:+2 }),
  (p)=>({ text: "You mentor a young player from your hometown.", morale:+6, leadership: +1, fame: +2 }),
  (p)=>({ text: "Equipment malfunction during practice.", peak:-3, morale:-2 }),
  (p)=>({ text: "Your signature move gets its own nickname.", fame:+5, followers: +7000, morale: +4 }),
];

const SOCIAL_MEDIA_POSTS = [
  { text: "💪 Grinding in the gym! #NoOffSeason", followers: +2000, fame: +1 },
  { text: "Blessed to play the game I love every day 🙏", followers: +1500, morale: +2 },
  { text: "Shoutout to my teammates - we're building something special! 🔥", followers: +3000, teamChem: +2 },
  { text: "Just dropped 30! But the W is all that matters 💯", followers: +4000, fame: +2 },
  { text: "Tough loss tonight but we'll be back stronger 💪", followers: +1000, morale: +1 },
  { text: "Can't wait to see our fans at the next home game! 🏟️", followers: +2500, fame: +1 },
  { text: "New shoes just dropped! Link in bio 👟", followers: +5000, cash: +10 },
  { text: "Studying film late into the night 📹 #Preparation", followers: +1800, playmaking: +0.3 },
];

function applyDelta(p, delta){
  const keys = Object.keys(delta);
  keys.forEach(k=>{
    if(k==="text") return;
    if(k==="teamChem"||k==="fame"||k==="cash"||k==="morale"||k==="health"||k==="peak"||k==="followers"){
      if(k==="followers") {
        p[k] = Math.max(0, (p[k]||0) + delta[k]);
      } else {
        p[k] = clamp((p[k]||0) + delta[k], 0, 100);
      }
    } else if(p.ratings && p.ratings[k] !== undefined) {
      p.ratings[k] = clamp(Math.round((p.ratings[k]||0) + delta[k]), 40, 99);
      // Recalculate overall if main stat changed
      const mainStats = [p.ratings.shooting, p.ratings.finishing, p.ratings.playmaking, p.ratings.defense, p.ratings.rebounding];
      p.ratings.overall = Math.round(mainStats.reduce((a,b)=>a+b,0)/5);
    }
  });
}

// ---------- Main Component ----------
export default function BasketballLife(){
  const [game, setGame] = useState(()=> loadGame() || newPlayer());
  const [tab, setTab] = useState("Home");
  const [toast, setToast] = useState(null);
  const [awardsPopup, setAwardsPopup] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const importRef = useRef();

  useEffect(()=>{ saveGame(game); }, [game]);
  
  // Update team colors dynamically
  useEffect(() => {
    if (game?.team && NBA_TEAMS[game.team]) {
      const teamColors = NBA_TEAMS[game.team].colors;
      const primaryRgb = hexToRgb(teamColors.primary);
      const secondaryRgb = hexToRgb(teamColors.secondary);
      
      document.documentElement.style.setProperty('--team-primary', teamColors.primary);
      document.documentElement.style.setProperty('--team-secondary', teamColors.secondary);
      document.documentElement.style.setProperty('--team-text', teamColors.text);
      
      // Set RGB values for the new background gradients
      document.documentElement.style.setProperty('--team-primary-rgb', `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
      document.documentElement.style.setProperty('--team-secondary-rgb', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
      
      // Add glassmorphism team colors
      document.documentElement.style.setProperty('--team-glass', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`);
      document.documentElement.style.setProperty('--team-border', `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.2)`);
    } else {
      // Default colors if no team
      document.documentElement.style.setProperty('--team-primary', '#3b82f6');
      document.documentElement.style.setProperty('--team-secondary', '#1e40af');
      document.documentElement.style.setProperty('--team-text', '#ffffff');
      document.documentElement.style.setProperty('--team-primary-rgb', '59, 130, 246');
      document.documentElement.style.setProperty('--team-secondary-rgb', '30, 64, 175');
      document.documentElement.style.setProperty('--team-glass', 'rgba(59, 130, 246, 0.1)');
      document.documentElement.style.setProperty('--team-border', 'rgba(59, 130, 246, 0.2)');
    }
  }, [game?.team]);

  function resetAll(){ setGame(newPlayer()); setTab("Home"); pushToast("New career started!"); }

  function pushToast(t){ setToast({ id: cryptoRandomId(), text: t}); setTimeout(()=>setToast(null), 2200); }
  
  function showAwardsPopup(awards, seasonNumber, isChampion, isFinalsMVP) {
    setAwardsPopup({ 
      awards, 
      season: seasonNumber, 
      champion: isChampion, 
      finalsMVP: isFinalsMVP 
    });
  }

  function actTrain(type, intensity = 1){
    setGame(prev=>{
      const p = deepClone(prev);
      if(p.phase==="Offseason" || p.phase==="Preseason" || p.phase==="Regular"){
        // Auto-rest if peak is too low
        if(p.peak < 25 && type !== "Recovery") {
          p.peak = clamp(p.peak + 15, 0, 100);
          p.morale = clamp(p.morale + 2, 0, 100);
          p.career.timeline.push(event("Training", "Auto-rest applied before training."));
        }
        
        // Balanced peak cost for training
        const costPeak = type==="Recovery"? (8 * intensity) : -(8 * intensity);
        const moraleBase = type==="Recovery"? 2 : (chance(0.8) ? 1 : -1); // Training more likely to help morale
        const moraleDelta = moraleBase * intensity;
        p.peak = clamp(p.peak + costPeak, 0, 100);
        p.morale = clamp(p.morale + moraleDelta, 0, 100);
        
        const trainMap = {
          Shooting: ["shooting"],
          Finishing: ["finishing"], 
          Playmaking: ["playmaking"],
          Defense: ["defense"],
          Rebounding: ["rebounding"],
          Stamina: ["stamina"],
          Dunking: ["dunking"],
          Passing: ["passing"],
          Leadership: ["leadership"],
          Balanced: ["shooting","finishing","playmaking","defense","rebounding"],
          Recovery: [],
        };
        
        // More balanced training gains that still reward existing skills
        let baseBoost = 0.15 + rnd(0, 0.25); // 0.15-0.4 base
        
        // Age penalty for training - older players improve slower but not too much
        if (p.age >= 25) baseBoost *= 0.95;
        if (p.age >= 28) baseBoost *= 0.9;
        if (p.age >= 30) baseBoost *= 0.85;
        if (p.age >= 33) baseBoost *= 0.8;
        
        // More balanced skill level scaling - high-rated players still improve but slower
        trainMap[type].forEach(skill => {
          let skillBoost = baseBoost * intensity;
          const currentRating = p.ratings[skill];
          
          // Better diminishing returns curve
          if (currentRating >= 95) skillBoost *= 0.4; // Very hard to improve elite skills
          else if (currentRating >= 90) skillBoost *= 0.5; // Hard but still possible
          else if (currentRating >= 85) skillBoost *= 0.65; // Moderate difficulty
          else if (currentRating >= 80) skillBoost *= 0.75; // Easier
          else if (currentRating >= 75) skillBoost *= 0.85; // Much easier
          else if (currentRating >= 70) skillBoost *= 0.9; // Even easier
          // Below 70 gets full boost - easier to improve weak skills
          
          // High-rated players (80+) get consistency bonus in game performance
          // but training is still challenging
          
          // Training effectiveness based on peak condition
          skillBoost *= (p.peak / 100);
          
          // Random success/failure with better odds
          if (chance(0.2)) skillBoost *= 1.8; // Great session (increased chance)
          else if (chance(0.1)) skillBoost *= 0.6; // Poor session (decreased chance)
          
          p.ratings[skill] = clamp(Math.round(p.ratings[skill] + skillBoost), 40, 99);
        });
        
        // Recalculate overall
        const mainStats = [p.ratings.shooting, p.ratings.finishing, p.ratings.playmaking, p.ratings.defense, p.ratings.rebounding];
        p.ratings.overall = Math.round(mainStats.reduce((a,b)=>a+b,0)/5);
        
        p.career.timeline.push(event("Training", `${type} session (${intensity}x) completed.`));
      }
      return p;
    });
    pushToast(`${type} training (${intensity}x) applied`);
  }

  function actHealth(type){
    setGame(prev=>{
      const p = deepClone(prev);
      let cost = 0, healthGain = 0, peakGain = 0, moraleGain = 0;
      
      switch(type){
        case "Diet":
          cost = 15; healthGain = 8; peakGain = 3; break;
        case "Gym":
          cost = 25; healthGain = 12; peakGain = 5; moraleGain = 2; break;
        case "Cryotherapy":
          cost = 80; healthGain = 20; peakGain = 15; moraleGain = 3; break;
      }
      
      if(p.cash >= cost){
        p.cash -= cost;
        p.health = clamp(p.health + healthGain, 0, 100);
        p.peak = clamp(p.peak + peakGain, 0, 100);
        p.morale = clamp(p.morale + moraleGain, 0, 100);
        p.career.timeline.push(event("Health", `${type} session completed (-$${cost}k).`));
        pushToast(`${type} completed!`);
      } else {
        pushToast(`Not enough cash for ${type} ($${cost}k needed)`);
      }
      return p;
    });
  }

  function takeEndorsement(){
    setGame(prev=>{
      const p = deepClone(prev);
      const offers = ENDORSEMENTS.filter(e=>p.ratings.overall>=e.minOverall && !p.endorsements.find(x=>x.name===e.name));
      if(!offers.length){ pushToast("No new offers right now"); return p; }
      const offer = pick(offers);
      
      // Enhanced endorsement value calculation
      let multiplier = 1.0;
      
      // Star power multiplier (much more significant)
      if (p.ratings.overall >= 95) multiplier += 4.0; // Superstar
      else if (p.ratings.overall >= 90) multiplier += 2.5; // Elite
      else if (p.ratings.overall >= 85) multiplier += 1.5; // All-Star
      else if (p.ratings.overall >= 80) multiplier += 0.8; // Starter
      
      // Popularity and following impact
      multiplier += p.fame/50; // Fame has bigger impact
      multiplier += p.followers/500000; // Followers scale better (LeBron-level = 100M+ followers)
      
      // Championship and award bonuses
      const totals = p.career?.totals || {};
      multiplier += (totals.titles || 0) * 0.5; // Championships boost value
      multiplier += (totals.mvps || 0) * 0.8; // MVPs boost value significantly
      multiplier += (totals.allstars || 0) * 0.1; // All-Stars add value
      
      const value = Math.round(offer.base * multiplier * (1 + rnd(-0.1, 0.25)));
      p.cash += value;
      p.endorsements.push({ name: offer.name, value });
      p.career.timeline.push(event("Endorsement", `Signed with ${offer.name} for $${value}k`));
      return p;
    });
  }

  function takeShoeEndorsement(){
    setGame(prev=>{
      const p = deepClone(prev);
      const offers = SHOE_BRANDS.filter(b=>p.ratings.overall>=b.minOverall && p.followers>=b.minFollowers && !p.shoeDeals.find(x=>x.name===b.name));
      if(!offers.length){ pushToast("No shoe deals available"); return p; }
      const offer = pick(offers);
      
      // Enhanced shoe deal value calculation  
      let multiplier = 1.0;
      
      // Star power has massive impact on shoe deals
      if (p.ratings.overall >= 95) multiplier += 6.0; // Superstar signature shoe
      else if (p.ratings.overall >= 90) multiplier += 3.5; // Elite signature shoe
      else if (p.ratings.overall >= 85) multiplier += 2.0; // All-Star signature
      else if (p.ratings.overall >= 80) multiplier += 1.0; // Pro model
      
      // Global popularity (follower count is crucial for shoe deals)
      multiplier += p.fame/40;
      multiplier += p.followers/400000; // Better scaling for massive followings
      
      // Performance bonuses
      const totals = p.career?.totals || {};
      multiplier += (totals.titles || 0) * 0.8;
      multiplier += (totals.mvps || 0) * 1.2;
      multiplier += (totals.scoring || 0) * 0.3; // Scoring titles help shoe sales
      
      const value = Math.round(offer.base * multiplier * (1 + rnd(-0.1, 0.3)));
      p.cash += value;
      p.shoeDeals.push({ name: offer.name, value, years: irnd(2,5) });
      p.career.timeline.push(event("Shoe Deal", `Signed with ${offer.name} for $${value}k`));
      return p;
    });
  }

  function buyPremiumService(service){
    setGame(prev=>{
      const p = deepClone(prev);
      if(p.cash >= service.cost && !p.premiumServices.find(s => s.name === service.name)){
        p.cash -= service.cost;
        p.premiumServices.push({ ...service, weeksLeft: service.duration });
        if(service.healthBoost) p.health = clamp(p.health + service.healthBoost, 0, 100);
        if(service.peakBoost) p.peak = clamp(p.peak + service.peakBoost, 0, 100);
        if(service.moraleBoost) p.morale = clamp(p.morale + service.moraleBoost, 0, 100);
        if(service.leadershipBoost) p.ratings.leadership = clamp(p.ratings.leadership + service.leadershipBoost, 40, 99);
        if(service.followersBoost) p.followers += service.followersBoost;
        if(service.ratingBoost) {
          ["shooting","finishing","playmaking","defense","rebounding"].forEach(k => {
            p.ratings[k] = clamp(Math.round(p.ratings[k] + service.ratingBoost), 40, 99);
          });
          const mainStats = [p.ratings.shooting, p.ratings.finishing, p.ratings.playmaking, p.ratings.defense, p.ratings.rebounding];
          p.ratings.overall = Math.round(mainStats.reduce((a,b)=>a+b,0)/5);
        }
        p.career.timeline.push(event("Premium", `Hired ${service.name} for ${service.duration} weeks (-$${service.cost}k).`));
        pushToast(`${service.name} hired!`);
      } else {
        pushToast(p.cash < service.cost ? `Need $${service.cost}k` : "Already active");
      }
      return p;
    });
  }

  function requestTrade(){
    setGame(prev=>{
      const p = deepClone(prev);
      const teamInfo = NBA_TEAMS[p.team];
      const isContractYear = p.contract.year >= p.contract.years;
      
      // Trade success rate depends on multiple factors
      let baseSuccessRate = 0.35; // Base 35% chance
      
      // Contract year trades are less likely (teams prefer to let player walk)
      if (isContractYear) baseSuccessRate *= 0.7;
      
      // Player performance affects trade likelihood
      const avg = seasonAverages(p.stats);
      if (avg.pts > 25 || avg.per > 22) baseSuccessRate += 0.15; // Star players easier to trade
      if (avg.pts < 10 && avg.per < 15) baseSuccessRate -= 0.15; // Poor performers harder to trade
      
      // Team situation affects willingness to trade
      if (teamInfo && teamInfo.strength > 85) baseSuccessRate -= 0.1; // Good teams less likely to trade stars
      if (p.morale < 40) baseSuccessRate += 0.1; // Unhappy players more likely to be traded
      
      // Salary affects trade difficulty
      const salaryRatio = (p.contract.salary / p.contract.years) / 30; // Relative to average salary
      if (salaryRatio > 1.5) baseSuccessRate -= 0.1; // Expensive players harder to trade
      
      const finalSuccessRate = Math.max(0.15, Math.min(0.85, baseSuccessRate));
      
      if(chance(finalSuccessRate)){
        const oldTeam = p.team;
        p.team = pick(TEAMS.filter(t=>t!==p.team));
        p.arena = genArena(p.team);
        p.teammates = generateTeammates();
        p.teamChem = irnd(25, 65); // Fresh start uncertainty (slightly lower)
        p.teamStrength = irnd(60, 90);
        p.teamStanding = irnd(5, 20);
        p.career.timeline.push(event("Trade", `Successfully traded from ${oldTeam} to ${p.team}.`));
        pushToast("Trade request approved!");
      } else {
        p.morale = clamp(p.morale - 8, 0, 100); // Increased morale penalty
        p.career.timeline.push(event("Trade", "Trade request denied by management."));
        pushToast("Trade request denied");
      }
      return p;
    });
  }

  function requestContract(){
    setGame(prev=>{
      const p = deepClone(prev);
      const currentValue = p.contract.salary / p.contract.years;
      const avg = seasonAverages(p.stats);
      const teamInfo = NBA_TEAMS[p.team];
      
      // Check if this is an extension (before final year) vs. new contract
      const isExtension = p.contract.year < p.contract.years - 1;
      const isContractYear = p.contract.year >= p.contract.years;
      
      // Performance-based multipliers with better balance
      let performanceMultiplier = 1.0;
      performanceMultiplier += Math.max(-0.2, Math.min(0.3, (p.ratings.overall - 78) / 80));
      performanceMultiplier += Math.max(-0.15, Math.min(0.25, (avg.pts - 18) / 40));
      performanceMultiplier += Math.max(-0.1, Math.min(0.15, (avg.per - 16) / 20));
      
      // Market and team factors
      const marketMultiplier = 1 + Math.max(0, Math.min(0.25, p.fame / 150));
      const teamLoyaltyBonus = isExtension ? 1.05 : 1.0; // 5% bonus for extensions
      
      // Cap the total increase to prevent unrealistic jumps
      const maxIncrease = isExtension ? 1.4 : 1.8; // Lower cap for extensions
      const minDecrease = isContractYear ? 0.7 : 0.85; // Can decrease more if contract expired
      
      let newValue = currentValue * performanceMultiplier * marketMultiplier * teamLoyaltyBonus;
      newValue *= (1 + rnd(-0.1, 0.15)); // Market variation
      newValue = Math.max(currentValue * minDecrease, Math.min(currentValue * maxIncrease, newValue));
      newValue = Math.round(newValue);
      
      // Success rate calculation with extension preference
      let baseSuccessRate = 0.25;
      
      // Extensions are MUCH more likely to succeed
      if (isExtension) {
        baseSuccessRate = 0.65; // 65% base rate for extensions
        
        // Additional bonuses for extensions
        if (avg.pts > 15 && avg.per > 16) baseSuccessRate += 0.15;
        if (p.ratings.overall >= 80) baseSuccessRate += 0.1;
        if (teamInfo && teamInfo.strength >= 75) baseSuccessRate += 0.1; // Good teams extend players
        if (p.morale >= 70) baseSuccessRate += 0.1;
        
      } else {
        // New contracts (free agency)
        baseSuccessRate = 0.35;
        
        if (avg.pts > 20) baseSuccessRate += 0.2;
        if (avg.per > 18) baseSuccessRate += 0.15;
        if (teamInfo && teamInfo.strength < 75) baseSuccessRate += 0.15; // Struggling teams more willing
      }
      
      // Financial feasibility check
      const increaseRatio = newValue / currentValue;
      if (increaseRatio > 1.5) baseSuccessRate -= 0.2; // Big raises are harder
      if (increaseRatio < 1.1) baseSuccessRate += 0.1; // Modest raises easier
      
      const finalSuccessRate = Math.max(0.1, Math.min(0.9, baseSuccessRate));
      
      if(chance(finalSuccessRate)){ 
        const increase = newValue - currentValue;
        const contractYears = isExtension ? (p.contract.years - p.contract.year + irnd(2, 4)) : irnd(2, 5);
        
        p.contract.salary = Math.round(newValue * contractYears);
        p.contract.years = contractYears;
        if (isExtension) {
          p.contract.year = p.contract.year; // Keep current year for extensions
        } else {
          p.contract.year = 1; // Reset for new contracts
        }
        
        p.cash += Math.round(Math.abs(increase) * 0.15); // Signing bonus
        
        const contractType = isExtension ? "Extension" : "Contract";
        p.career.timeline.push(event(contractType, `${contractType} signed: $${newValue}k/year for ${contractYears} years (${increase > 0 ? '+' : ''}$${increase}k/year).`));
        pushToast(`${contractType} signed: $${newValue}k/year!`);
      } else {
        p.morale = clamp(p.morale - (isExtension ? 3 : 6), 0, 100); // Less penalty for failed extensions
        const failureType = isExtension ? "Extension" : "Contract";
        p.career.timeline.push(event(failureType, `${failureType} negotiation rejected by management.`));
        pushToast(`${failureType} request denied - ${isExtension ? 'try again later' : 'improve performance'}`);
      }
      return p;
    });
  }

  function simMonth(){
    setGame(prev => {
      let p = deepClone(prev);
      for(let i = 0; i < 4; i++) {
        // Simulate one week
        p = simulateOneWeek(p);
      }
      return p;
    });
    pushToast("Simmed 1 month!");
  }

  function simSeason(){
    setGame(prev => {
      let p = deepClone(prev);
      let weekCount = 0;
      const maxWeeks = 100; // Safety limit to prevent infinite loops
      
      while(p.phase !== "Offseason" && !p.retired && weekCount < maxWeeks) {
        p = simulateOneWeek(p);
        weekCount++;
      }
      return p;
    });
    pushToast("Season simulated!");
  }

  // Helper function to simulate one week without state updates
  function simulateOneWeek(p) {
    // Update premium services
    p.premiumServices = p.premiumServices.filter(service => {
      service.weeksLeft--;
      if(service.weeksLeft <= 0) {
        p.career.timeline.push(event("Premium", `${service.name} contract expired.`));
        return false;
      }
      return true;
    });

    // Weekly tick: chance of minor injury if peak is low
    if(p.peak < 25 && chance(0.15)){ 
      p.health = clamp(p.health - irnd(5,12), 0, 100); 
      p.career.timeline.push(event("Injury","Minor injury from low peak condition.")); 
    }

    // Phase behavior
    if(p.phase==="Preseason"){
      // 2 weeks preseason
      if(p.week>=2){ 
        p.phase = "Regular"; 
        p.week = 1; 
        p.career.timeline.push(event("Season",`Season ${p.season} tip-off!`)); 
      } else { 
        p.week++; 
      }
    } else if(p.phase==="Regular"){
      // 12-week regular season, 2 games/week
      simulateGames(p, 2);
      if(p.week>=12){
        // Decide playoffs eligibility
        const avg = seasonAverages(p.stats);
        p.stats.playoffs = avg.winsPct>=0.50 || chance(0.25 + avg.winsPct*0.5);
        p.phase = p.stats.playoffs? "Playoffs" : "Offseason";
        p.week = 1;
        if(p.stats.playoffs) p.career.timeline.push(event("Playoffs","Your team clinched a playoff berth!"));
      } else { 
        p.week++; 
      }
    } else if(p.phase==="Playoffs"){
      // 3 weeks of playoffs
      const res = playoffsSim(p, game);
      if(res.champion){ 
        p.stats.champion = true; 
        if(res.finalsMVP) p.stats.finalsMVP = true; 
        p.career.timeline.push(event("Championship", res.finalsMVP? "You win the title and Finals MVP!":"You are an NBA champion!")); 
      }
      p.phase = "Offseason"; 
      p.week = 1;
    } else if(p.phase==="Offseason"){
      // End season bookkeeping
      finalizeSeason(p);
      // New season start
      offSeasonMoves(p);
      p.season++; 
      p.phase = "Preseason"; 
      p.week = 1; 
      p.age += 1; 
      progressAging(p);
      p.career.timeline.push(event("Season",`Entering Season ${p.season}`));
    }

    // Passive peak decay & social media growth - gradual peak decay
    p.peak = clamp(p.peak - 1, 0, 100); // Only 1 point per week instead of 4
    if(chance(0.3)) p.followers += irnd(100, 1000);
    if(chance(0.25)) randomLifeEventSilent(p);
    
    return p;
  }

  function postSocialMedia(){
    setGame(prev=>{
      const p = deepClone(prev);
      const post = pick(SOCIAL_MEDIA_POSTS);
      
      // Apply effects based on current fame and followers
      const fameMultiplier = 1 + (p.fame / 200); // More famous = bigger impact
      const followersGain = Math.round((post.followers || 0) * fameMultiplier);
      
      applyDelta(p, { 
        ...post, 
        followers: followersGain,
        text: undefined // Remove text from delta application
      });
      
      p.career.timeline.push(event("Social Media", `Posted: "${post.text}"`));
      pushToast("Social media post published!");
      return p;
    });
  }

  function randomLifeEvent(){
    setGame(prev=>{
      const p = deepClone(prev);
      const ev = pick(LIFE_EVENTS)(p);
      applyDelta(p, ev);
      p.career.timeline.push(event("Event", ev.text));
      return p;
    });
    pushToast("Life event!");
  }

  function playNextWeek(){
    setGame(prev=>{
      const p = deepClone(prev);

      // Update league standings consistently
      p.league.standings = updateStandings(p, 1);

      // Update premium services
      p.premiumServices = p.premiumServices.filter(service => {
        service.weeksLeft--;
        if(service.weeksLeft <= 0) {
          p.career.timeline.push(event("Premium", `${service.name} contract expired.`));
          return false;
        }
        return true;
      });

      // Weekly tick: chance of minor injury if peak is low
      if(p.peak < 25 && chance(0.15)){ 
        p.health = clamp(p.health - irnd(5,12), 0, 100); 
        p.career.timeline.push(event("Injury","Minor injury from low peak condition.")); 
      }

      // Phase behavior
      if(p.phase==="Preseason"){
        // 2 weeks preseason
        if(p.week>=2){ 
          p.phase = "Regular"; 
          p.week = 1; 
          p.career.timeline.push(event("Season",`Season ${p.season} tip-off!`)); 
        } else { 
          p.week++; 
        }
      } else if(p.phase==="Regular"){
        // 82-game season, 10 games per week (8.2 weeks)
        simulateGames(p, 10);
        if(p.week>=9){ // Changed from 12 to 9 weeks for 82-game season
          // Decide playoffs eligibility - top 16 teams make playoffs
          const standings = getStandings(p);
          const teamStanding = standings.findIndex(team => team.team === p.team) + 1;
          p.stats.playoffs = teamStanding <= 16;
          
          p.phase = p.stats.playoffs? "Playoffs" : "Offseason";
          p.week = 1;
          if(p.stats.playoffs) {
            p.career.timeline.push(event("Playoffs", `Your team (#${teamStanding} seed) clinched a playoff berth!`));
          } else {
            p.career.timeline.push(event("Season End", `Season ended. Team finished #${teamStanding} in standings.`));
          }
        } else { 
          p.week++; 
        }
      } else if(p.phase==="Playoffs"){
        // 3 weeks of playoffs
        const res = playoffsSim(p, p);
        if(res.champion){ 
          p.stats.champion = true; 
          if(res.finalsMVP) p.stats.finalsMVP = true; 
          p.career.timeline.push(event("Championship", res.finalsMVP? "You win the title and Finals MVP!":"You are an NBA champion!")); 
        }
        p.phase = "Offseason"; 
        p.week = 1;
      } else if(p.phase==="Offseason"){
        // End season bookkeeping
        finalizeSeason(p);
        // New season start
        offSeasonMoves(p);
        p.season++; 
        p.phase = "Preseason"; 
        p.week = 1; 
        p.age += 1; 
        progressAging(p);
        p.career.timeline.push(event("Season",`Entering Season ${p.season}`));
      }

      // Passive peak decay & social media growth - gradual peak decay
      p.peak = clamp(p.peak - 1, 0, 100); // Only 1 point per week instead of 4
      if(chance(0.3)) p.followers += irnd(100, 1000);
      if(chance(0.25)) randomLifeEventSilent(p);
      return p;
    });
  }

  function randomLifeEventSilent(p){
    const ev = pick(LIFE_EVENTS)(p); applyDelta(p, ev); p.career.timeline.push(event("Event", ev.text));
  }

  function simulateGames(p, count){
    let actualGamesPlayed = 0;
    
    for(let g=0; g<count; g++){
      // Determine if player will miss this game
      let missGame = false;
      let missReason = "";
      
      // Load management for stars (especially veterans)
      if (p.ratings.overall >= 85 && p.age >= 30 && chance(0.08)) {
        missGame = true;
        missReason = "Load Management";
      }
      
      // Injury-based rest (more likely with low health)
      if (p.health < 40 && chance(0.25)) {
        missGame = true;
        missReason = "Injury Recovery";
      } else if (p.health < 60 && chance(0.12)) {
        missGame = true;
        missReason = "Minor Injury";
      } else if (p.health < 80 && chance(0.06)) {
        missGame = true;
        missReason = "Precautionary Rest";
      }
      
      // Peak performance related rest
      if (p.peak < 30 && chance(0.15)) {
        missGame = true;
        missReason = "Fatigue Management";
      }
      
      // Random injuries during games
      if (!missGame && chance(0.03 + (100-p.health)/800 + (p.age-25)/300)) {
        const injuryType = pick(["ankle sprain", "knee soreness", "back stiffness", "shoulder strain", "hamstring tightness"]);
        const severity = chance(0.1) ? "major" : "minor";
        const healthLoss = severity === "major" ? irnd(15, 30) : irnd(5, 15);
        const gamesOut = severity === "major" ? irnd(3, 12) : irnd(1, 4);
        
        p.health = clamp(p.health - healthLoss, 0, 100);
        p.career.timeline.push(event("Injury", `${severity} ${injuryType} (-${healthLoss} health, ${gamesOut} games out).`));
        
        // Skip games based on injury severity
        g += gamesOut - 1; // Skip additional games
        continue;
      }
      
      if (missGame) {
        p.career.timeline.push(event("Rest", `Missed game due to ${missReason}.`));
        continue;
      }
      
      // Play the game
      const perf = playerGameSim(p);
      const win = chance(teamWinChance(p, p));
      
      // Update season stats
      Object.keys(perf).forEach(k=> {
        if(typeof perf[k] === 'number' && k !== 'ageMultiplier') {
          p.stats[k] = (p.stats[k] || 0) + perf[k];
        }
      });
      
      p.stats.games += 1;
      actualGamesPlayed += 1;
      
      if(win) p.stats.wins++; else p.stats.losses++;
      
      // Enhanced follower calculation based on performance and stardom
      let followerGain = Math.round(perf.points * 150 + perf.assists * 120 + perf.rebounds * 80 + (win ? 800 : -300));
      
      // Star player bonuses (top players get massive following boosts)
      if (p.ratings.overall >= 95) followerGain *= 3.5; // Superstar level
      else if (p.ratings.overall >= 90) followerGain *= 2.8; // Elite level  
      else if (p.ratings.overall >= 85) followerGain *= 2.2; // All-Star level
      else if (p.ratings.overall >= 80) followerGain *= 1.6; // Starter level
      
      // Performance bonuses
      if (perf.points >= 40) followerGain *= 2.0; // Explosive scoring
      if (perf.points >= 30) followerGain *= 1.5; // Great scoring night
      if (perf.assists >= 15) followerGain *= 1.8; // Elite playmaking
      if (perf.rebounds >= 20) followerGain *= 1.6; // Dominant rebounding
      
      p.followers = Math.max(0, p.followers + followerGain);
      
      // Peak & morale management
      p.peak = clamp(p.peak - 1, 0, 100); // Natural peak decline from playing
      p.morale = clamp(p.morale + (win? +2 : -2) + (perf.points>=25? +1:0) + (perf.points<8? -1:0), 0, 100);
      
      // Record game log
      p.stats.gameLogs.unshift({
        id: cryptoRandomId(),
        gameNo: p.stats.games,
        win, ...perf
      });
    }
    
    // Add realistic games played variance (even healthy players miss some games)
    const targetGames = Math.min(82, count);
    if (actualGamesPlayed === 0 && targetGames > 0) {
      // Ensure at least some games are played unless severely injured
      actualGamesPlayed = Math.max(1, Math.round(targetGames * 0.1));
    }
  }

  function finalizeSeason(p){
    const avg = seasonAverages(p.stats);
    const league = { mvpPts: 22 + rnd(-2,2), dpoyDef: 2.4 + rnd(-0.4,0.4), scoringLeader: 26 + rnd(-2,2) };
    const awards = endSeasonAwards(p, league);
    awards.forEach(a=>{
      p.career.awards.push({ season: p.season, award: a });
      if(a==="MVP") p.career.totals.mvps++;
      if(a==="DPOY") p.career.totals.dpoys++;
      if(a==="6MOY") p.career.totals.sixmoys++;
      if(a==="MIP") p.career.totals.mips++;
      if(a==="Scoring Title") p.career.totals.scoring++;
      if(a==="All-Star") p.career.totals.allstars++;
      if(a==="ROY") p.career.totals.roys++;
    });
    
    // Handle championship and Finals MVP awards
    let allAwards = [...awards];
    if(p.stats.finalsMVP){ 
      p.career.totals.finalsMVPs++; 
      p.career.awards.push({ season: p.season, award: "Finals MVP"}); 
      allAwards.push("Finals MVP");
    }
    if(p.stats.champion){ 
      p.career.totals.titles++; 
      p.career.awards.push({ season: p.season, award: "NBA Champion"}); 
      allAwards.push("NBA Champion");
    }

    // Show awards popup if there are any awards
    if(allAwards.length > 0) {
      setTimeout(() => {
        showAwardsPopup(allAwards, p.season, p.stats.champion, p.stats.finalsMVP);
      }, 500);
    }

    // Pay contract salary for the season
    const seasonSalary = Math.round(p.contract.salary / p.contract.years);
    p.cash += seasonSalary;
    p.career.timeline.push(event("Contract", `Received $${seasonSalary}k salary payment.`));

    // Pay endorsement money
    p.endorsements.forEach(e => {
      p.cash += e.value;
      p.career.timeline.push(event("Endorsement", `Received $${e.value}k from ${e.name}.`));
    });

    // Pay shoe deal money
    p.shoeDeals.forEach(e => {
      p.cash += e.value;
      p.career.timeline.push(event("Shoe Deal", `Received $${e.value}k from ${e.name}.`));
    });

    // add season to career
    p.career.seasons.push({ season: p.season, team: p.team, stats: deepClone(p.stats), averages: avg, overall: p.ratings.overall });

    // update career totals including advanced stats
    const t = p.career.totals;
    const s = p.stats;
    ["games","minutes","points","rebounds","assists","steals","blocks","fgMade","fgAtt","threesMade","threesAtt","ftMade","ftAtt","wins","losses"].forEach(k=>{ t[k] = (t[k]||0) + (s[k]||0); });
    
    // Store advanced stats for graphs
    t.per.push(avg.per || 0);
    t.ts.push(avg.ts || 0);
    t.usage.push(avg.usage || 0);

    // accolades story
    if(awards.length){ p.career.timeline.push(event("Awards", `Season ${p.season} awards: ${awards.join(", ")}`)); }
    if(p.stats.champion){ p.career.timeline.push(event("Banner", `You captured the championship!`)); }

    // Check for forced retirement based on age and performance
    if(shouldForceRetirement(p, avg)) {
      p.retired = true;
      p.career.timeline.push(event("Retirement", `Forced retirement due to declining performance at age ${p.age}.`));
      setTimeout(() => {
        pushToast(`Career ended - Retired at age ${p.age} after ${p.season} seasons`);
      }, 1000);
    }

    // reset season stats for next year
    p.stats = resetSeasonStats();
  }

  function offSeasonMoves(p){
    // More stable team movement - teams don't move as drastically in standings
    const currentStanding = p.teamStanding;
    const maxMovement = currentStanding <= 8 ? 2 : 3; // Top teams stay more stable
    p.teamStanding = clamp(currentStanding + irnd(-maxMovement, maxMovement), 1, 30);
    
    // More realistic contract/trade logic - favor extensions heavily
    let moved = false;
    if(p.contract.year >= p.contract.years){
      // Check for extension offers first (80% chance if playing well)
      const avg = seasonAverages(p.stats);
      const extensionLikely = avg.pts >= 15 && avg.winsPct >= 0.4 && p.teamChem >= 60;
      
      if(extensionLikely && chance(0.80)) {
        // Extension with current team
        const years = irnd(2, 4);
        const salary = Math.round((p.ratings.overall*120 + p.fame*25 + p.followers/800 + irnd(200,800)) * years);
        p.contract = { team: p.team, years, salary, clause: chance(0.30)?"Player Option":"None", year: 1 };
        p.career.timeline.push(event("Extension", `You signed an extension with the ${p.team} (${years}y, $${salary}k).`));
      } else {
        // Free agency - but fewer offers, more selective
        const offers = irnd(1, 3); // Reduced from 2-4
        const bestTeam = pick(TEAMS.filter(t=>t!==p.team));
        let bestValue = 0; let chosen = null;
        for(let i=0;i<offers;i++){
          const team = pick(TEAMS);
          const years = irnd(2,4);
          const salary = Math.round((p.ratings.overall*100 + p.fame*20 + p.followers/1000 + irnd(100,600)) * years);
          if(salary>bestValue){ bestValue = salary; chosen = { team, years, salary, clause: chance(0.25)?"Player Option":"None", year:1}; }
        }
        if(chosen){ 
          p.contract = chosen; 
          p.team = chosen.team; 
          p.arena = genArena(p.team); 
          p.teammates = generateTeammates();
          p.career.timeline.push(event("Free Agency",`You signed with the ${p.team} (${chosen.years}y, $${chosen.salary}k).`)); 
          moved = true; 
        }
      }
    } else if(chance(0.08)){ // Reduced trade chance from 18% to 8%
      const oldTeam = p.team; 
      p.team = pick(TEAMS.filter(t=>t!==p.team)); 
      p.arena = genArena(p.team);
      p.teammates = generateTeammates();
      p.contract.year = Math.min(p.contract.year+1, p.contract.years);
      p.career.timeline.push(event("Trade",`Traded from ${oldTeam} to ${p.team}.`)); 
      moved = true;
    } else {
      p.contract.year += 1; // staying put - most common outcome
    }

    // adjust team chemistry/strength
    p.teamChem = clamp(p.teamChem + (moved? irnd(-10,10): irnd(-3,6)), 30, 95);
    p.teamStrength = clamp(p.teamStrength + irnd(-4,4) + (moved? irnd(-6,6): 0), 60, 90);

    // endorsements payouts
    const endorsementPayout = Math.round(sum(p.endorsements.map(e=>e.value)) * (0.6 + rnd(-0.1, 0.2)));
    const shoePayout = Math.round(sum(p.shoeDeals.map(e=>e.value)) * (0.8 + rnd(-0.1, 0.2)));
    const totalPayout = endorsementPayout + shoePayout;
    p.cash += totalPayout; 
    if(totalPayout>0) p.career.timeline.push(event("Payout",`Endorsements paid $${totalPayout}k`));

    // small chance endorsement drops due to scandal
    if(chance(0.08)){ 
      const allDeals = [...p.endorsements, ...p.shoeDeals];
      if(allDeals.length > 0) {
        const ix = irnd(0, allDeals.length - 1); 
        const isShoe = ix >= p.endorsements.length;
        const actualIx = isShoe ? ix - p.endorsements.length : ix;
        const removed = isShoe ? p.shoeDeals.splice(actualIx,1)[0] : p.endorsements.splice(actualIx,1)[0]; 
        if(removed){ 
          p.career.timeline.push(event("PR", `${removed.name} ended your deal after a PR hiccup.`)); 
          p.fame = Math.max(0, p.fame - 3);
          p.followers = Math.max(0, p.followers - 5000);
        } 
      }
    }

    // fame drift by performance
    const last = p.career.seasons[p.career.seasons.length-1];
    if(last){ 
      const fameGain = (last.averages.pts>22? +6: last.averages.pts>16? +3: -1) + (last.stats.champion? +4:0);
      p.fame = clamp(p.fame + fameGain, 0, 100); 
      p.followers += Math.round(fameGain * 2000);
    }
  }

  function retireNow(){
    setGame(prev=>{
      const p = deepClone(prev);
      p.retired = true; p.alive = true; p.phase = "Retired";
      p.career.timeline.push(event("Retired","You have retired."));
      return p;
    });
  }

  function hallOfFameOdds(p){
    const t=p.career.totals; const o=p.ratings.overall;
    let score = 0;
    score += (t.points/1000) * 0.6;
    score += t.titles * 6 + t.mvps * 10 + t.finalsMVPs * 8 + t.allstars * 2 + t.scoring * 3;
    score += (o/100) * 10;
    return clamp(score, 0, 100);
  }

  function exportSave(){
    const blob = new Blob([JSON.stringify(game, null, 2)], { type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`BasketballLife_${game.name.replace(/\s+/g,'_')}.json`; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function importSave(json){
    try{
      const data = JSON.parse(json);
      if(!data || !data.name || !data.career) throw new Error("Invalid save");
      setGame(data); setShowImport(false); pushToast("Save loaded!");
    }catch(e){ pushToast("Import failed: "+e.message); }
  }

  // ---------- UI ----------
  const avg = useMemo(()=> seasonAverages(game.stats), [game.stats]);
  const careerPPG = game.career.totals.games? game.career.totals.points / game.career.totals.games : 0;

  return (
    <div className="fade-in">
      <Header game={game} onReset={resetAll} onExport={exportSave} onImport={()=>setShowImport(true)} onRetire={retireNow} />

      <Tabs current={tab} onSelect={setTab} tabs={["Home","Training","Health","Team","Contracts","Awards","History","Analytics","League"]} />

      {tab==="Home" && (
        <HomePanel game={game} avg={avg} onWeek={playNextWeek} onEvent={randomLifeEvent} onSocialMedia={postSocialMedia} onSimMonth={simMonth} onSimSeason={simSeason} />
      )}

        {tab==="Training" && (
          <TrainingPanel game={game} onTrain={actTrain} onEndorse={takeEndorsement} onShoeEndorse={takeShoeEndorsement} 
                         onPremium={buyPremiumService} endorsements={game.endorsements} shoeDeals={game.shoeDeals} 
                         premiumServices={game.premiumServices} cash={game.cash} />
        )}

        {tab==="Health" && (
          <HealthPanel onHealth={actHealth} cash={game.cash} health={game.health} peak={game.peak} />
        )}

        {tab==="Team" && (
          <TeamPanel game={game} avg={avg} onTrade={requestTrade} onContract={requestContract} />
        )}

        {tab==="Contracts" && (
          <ContractsPanel game={game} />
        )}

        {tab==="Awards" && (
          <AwardsPanel game={game} />
        )}

        {tab==="History" && (
          <HistoryPanel game={game} hof={hallOfFameOdds(game)} />
        )}

        {tab==="Analytics" && (
          <AnalyticsPanel game={game} />
        )}

        {tab==="League" && (
          <LeaguePanel game={game} />
        )}

        {toast && <Toast text={toast.text} />}

        {showImport && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="panel panel-content w-full max-w-lg">
              <h3 className="text-xl font-bold mb-4">Import Save</h3>
              <textarea 
                ref={importRef} 
                className="w-full h-40 p-3 rounded-lg outline-none resize-none"
                style={{backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}}
                placeholder="Paste your save JSON here..." 
              />
              <div className="flex gap-3 justify-end mt-4">
                <button className="btn btn-ghost" onClick={()=>setShowImport(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={()=>importSave(importRef.current.value)}>Load Game</button>
              </div>
            </div>
          </div>
        )}

        {awardsPopup && (
          <AwardsPopup 
            awards={awardsPopup.awards}
            season={awardsPopup.season}
            champion={awardsPopup.champion}
            finalsMVP={awardsPopup.finalsMVP}
            onClose={() => setAwardsPopup(null)}
          />
        )}

        {toast && <Toast text={toast.text} />}
    </div>
  );
}

// ---------- Subcomponents ----------
function Header({ game, onReset, onExport, onImport, onRetire }){
  const teamInfo = NBA_TEAMS[game.team];
  const teamName = teamInfo ? teamInfo.name : game.team;
  
  return (
    <div className="header">
      <div className="header-content">
        <div className="player-info">
          <div className="player-avatar">
            {game.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="player-details">
            <h1>{game.name}</h1>
            <div className="player-meta">
              <span>{teamName}</span>
              <span>#{game.jersey}</span>
              <span>{game.archetype}</span>
              <span>{game.ratings.overall} OVR</span>
              <span>${game.cash}k</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" onClick={onExport}>Export</button>
          <button className="btn btn-secondary btn-sm" onClick={onImport}>Import</button>
          <button className="btn btn-ghost btn-sm" onClick={onReset}>New Career</button>
          {!game.retired && <button className="btn btn-sm" style={{background: '#dc2626', color: 'white'}} onClick={onRetire}>Retire</button>}
        </div>
      </div>
    </div>
  );
}

function Tabs({ current, onSelect, tabs }){
  return (
    <div className="tabs">
      {tabs.map(t=> (
        <button 
          key={t} 
          onClick={()=>onSelect(t)} 
          className={`tab ${current===t ? 'active' : ''}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function StatPill({ label, value, sub }){
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function HomePanel({ game, avg, onWeek, onEvent, onSocialMedia, onSimMonth, onSimSeason }){
  const teamInfo = NBA_TEAMS[game.team];
  
  // Get current team standing from persistent standings
  const standings = getStandings(game);
  const teamRank = standings.findIndex(team => team.isPlayerTeam) + 1;
  const ageMultiplier = getAgeMultiplier(game.age);
  
  return (
    <div className="grid-2" style={{gap: '12px'}}>
      {/* Player Stats - Left Column */}
      <div>
        {/* Quick Stats Grid */}
        <div className="stats-grid">
          <div className="compact-stat">
            <div className="compact-stat-label">Overall</div>
            <div className="compact-stat-value">{game.ratings.overall}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Age</div>
            <div className="compact-stat-value" style={{color: game.age <= 26 ? '#10b981' : game.age <= 30 ? '#f59e0b' : '#ef4444'}}>{game.age}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Performance</div>
            <div className="compact-stat-value" style={{color: ageMultiplier >= 1.1 ? '#10b981' : ageMultiplier >= 0.9 ? '#f59e0b' : '#ef4444'}}>{(ageMultiplier * 100).toFixed(0)}%</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Health</div>
            <div className="compact-stat-value">{game.health}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Peak</div>
            <div className="compact-stat-value">{game.peak}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Morale</div>
            <div className="compact-stat-value">{game.morale}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Fame</div>
            <div className="compact-stat-value">{game.fame}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Chemistry</div>
            <div className="compact-stat-value">{game.teamChem}</div>
          </div>
        </div>
        
        {/* Season Stats */}
        <div className="panel panel-content-tight" style={{marginBottom: '12px'}}>
          <h3 style={{marginBottom: '8px', color: 'var(--team-primary)'}}>Season {game.season} Stats</h3>
          <div className="grid-4">
            <div className="compact-stat">
              <div className="compact-stat-label">PPG</div>
              <div className="compact-stat-value">{avg.pts.toFixed(1)}</div>
            </div>
            <div className="compact-stat">
              <div className="compact-stat-label">RPG</div>
              <div className="compact-stat-value">{avg.reb.toFixed(1)}</div>
            </div>
            <div className="compact-stat">
              <div className="compact-stat-label">APG</div>
              <div className="compact-stat-value">{avg.ast.toFixed(1)}</div>
            </div>
            <div className="compact-stat">
              <div className="compact-stat-label">FG%</div>
              <div className="compact-stat-value">{(avg.fgPct*100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="panel panel-content-tight">
          <h3 style={{marginBottom: '8px', color: 'var(--team-primary)'}}>Game Actions</h3>
          <div className="grid-2" style={{gap: '8px'}}>
            <button className="btn btn-primary" onClick={onWeek}>Next Week</button>
            <button className="btn btn-secondary" onClick={onEvent}>Life Event</button>
            <button className="btn btn-accent" onClick={onSocialMedia}>Social Media</button>
            <button className="btn btn-ghost" style={{fontSize: '11px'}}>📱 {(game.followers / 1000000).toFixed(1)}M</button>
            <button className="btn btn-team-outline" onClick={onSimMonth}>Sim Month</button>
            <button className="btn btn-team-outline" onClick={onSimSeason}>Sim Season</button>
          </div>
        </div>
      </div>

      {/* Team & Status - Right Column */}
      <div>
        {/* Team Info */}
        <div className="panel panel-content-tight" style={{marginBottom: '12px'}}>
          <h3 style={{marginBottom: '8px', color: 'var(--team-primary)'}}>Team Status</h3>
          <div style={{padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '8px'}}>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: 'var(--team-primary)', marginBottom: '4px'}}>
              {teamInfo ? teamInfo.name : game.team}
            </div>
            <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>
              Strength: {teamInfo ? teamInfo.strength : game.teamStrength}/100
            </div>
            <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>
              Standing: #{teamRank}
            </div>
          </div>
          
          <div className="grid-2" style={{gap: '8px'}}>
            <div className="compact-stat">
              <div className="compact-stat-label">Season</div>
              <div className="compact-stat-value">{game.season}</div>
            </div>
            <div className="compact-stat">
              <div className="compact-stat-label">Week</div>
              <div className="compact-stat-value">{game.week}</div>
            </div>
          </div>
          
          <div style={{marginTop: '8px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '6px', textAlign: 'center'}}>
            <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>Phase</div>
            <div style={{fontSize: '16px', fontWeight: 'bold', color: 'var(--team-primary)'}}>{game.phase}</div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="panel panel-content-tight">
          <h3 style={{marginBottom: '8px', color: 'var(--team-primary)'}}>Contract</h3>
          <div style={{padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px'}}>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px'}}>
              ${game.contract.salary}k/year
            </div>
            <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>
              Year {game.contract.year} of {game.contract.years}
            </div>
            {game.contract.clause !== "None" && (
              <div style={{fontSize: '12px', color: 'var(--team-primary)', marginTop: '4px'}}>
                {game.contract.clause}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrainingPanel({ game, onTrain, onEndorse, onShoeEndorse, onPremium, endorsements, shoeDeals, premiumServices, cash }){
  const [intensity, setIntensity] = useState(1);
  const [showPremiumServices, setShowPremiumServices] = useState(false);
  const trainingOptions = ["Shooting","Finishing","Playmaking","Defense","Rebounding","Stamina","Dunking","Passing","Leadership","Balanced","Recovery"];
  const ageMultiplier = getAgeMultiplier(game.age);
  
  return (
    <div className="grid-3">
      {/* Current Player Stats */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '10px', color: 'var(--team-primary)', fontSize: '14px'}}>Current Ratings</h3>
        
        {/* Overall Rating - Highlighted */}
        <div style={{
          background: 'linear-gradient(135deg, var(--team-primary), var(--team-secondary))',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          <div style={{fontSize: '10px', color: 'var(--team-text)', opacity: '0.8', fontWeight: '600'}}>OVERALL</div>
          <div style={{fontSize: '20px', fontWeight: 'bold', color: 'var(--team-text)'}}>{game.ratings.overall}</div>
        </div>

        {/* Age and Performance */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '4px',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '4px 8px',
            background: game.age <= 26 ? 'rgba(16, 185, 129, 0.1)' : game.age <= 30 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            border: `1px solid ${game.age <= 26 ? 'rgba(16, 185, 129, 0.3)' : game.age <= 30 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Age</span>
            <span style={{fontSize: '12px', fontWeight: 'bold', color: game.age <= 26 ? '#10b981' : game.age <= 30 ? '#f59e0b' : '#ef4444'}}>{game.age}</span>
          </div>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '4px 8px',
            background: ageMultiplier >= 1.1 ? 'rgba(16, 185, 129, 0.1)' : ageMultiplier >= 0.9 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '6px',
            border: `1px solid ${ageMultiplier >= 1.1 ? 'rgba(16, 185, 129, 0.3)' : ageMultiplier >= 0.9 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Performance</span>
            <span style={{fontSize: '12px', fontWeight: 'bold', color: ageMultiplier >= 1.1 ? '#10b981' : ageMultiplier >= 0.9 ? '#f59e0b' : '#ef4444'}}>{(ageMultiplier * 100).toFixed(0)}%</span>
          </div>
        </div>
        
        {/* Core Basketball Stats */}
        <div style={{marginBottom: '12px'}}>
          <h4 style={{fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase'}}>Basketball Skills</h4>
          <div style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '4px'
          }}>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Shooting</span>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)'}}>{game.ratings.shooting}</span>
            </div>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Finishing</span>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)'}}>{game.ratings.finishing}</span>
            </div>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Playmaking</span>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)'}}>{game.ratings.playmaking}</span>
            </div>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Defense</span>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)'}}>{game.ratings.defense}</span>
            </div>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Rebounding</span>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)'}}>{game.ratings.rebounding}</span>
            </div>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Passing</span>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)'}}>{game.ratings.passing}</span>
            </div>
          </div>
        </div>

        {/* Physical & Mental Stats */}
        <div style={{marginBottom: '12px'}}>
          <h4 style={{fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase'}}>Physical & Mental</h4>
          <div style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '4px'
          }}>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Stamina</span>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)'}}>{game.ratings.stamina}</span>
            </div>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Dunking</span>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)'}}>{game.ratings.dunking}</span>
            </div>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)'
            }}>
              <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Leadership</span>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)'}}>{game.ratings.leadership}</span>
            </div>
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '4px 8px',
              background: game.health > 70 ? 'rgba(16, 185, 129, 0.1)' : game.health > 30 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: '6px',
              border: `1px solid ${game.health > 70 ? 'rgba(16, 185, 129, 0.3)' : game.health > 30 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              <span style={{fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500'}}>Health</span>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: game.health > 70 ? '#10b981' : game.health > 30 ? '#f59e0b' : '#ef4444'}}>{game.health}</span>
            </div>
          </div>
        </div>

        {/* Peak Condition - Special highlight */}
        <div style={{
          background: game.peak > 70 ? 'rgba(16, 185, 129, 0.1)' : game.peak > 30 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${game.peak > 70 ? 'rgba(16, 185, 129, 0.3)' : game.peak > 30 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          borderRadius: '8px',
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600'}}>PEAK CONDITION</span>
          <span style={{fontSize: '14px', fontWeight: 'bold', color: game.peak > 70 ? '#10b981' : game.peak > 30 ? '#f59e0b' : '#ef4444'}}>{game.peak}</span>
        </div>

        <div style={{fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center'}}>
          💡 Train lower ratings for maximum improvement
        </div>
      </div>
      {/* Training Programs */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>Training Programs</h3>
        
        <div style={{marginBottom: '12px'}}>
          <div style={{fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px'}}>Intensity</div>
          <div style={{display: 'flex', gap: '4px'}}>
            {[1,2,3].map(i => (
              <button 
                key={i} 
                onClick={() => setIntensity(i)} 
                className={intensity === i ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                style={{flex: 1}}
              >
                {i}x
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid-4" style={{gap: '6px'}}>
          {trainingOptions.slice(0, 8).map(option=> (
            <button 
              key={option} 
              onClick={()=>onTrain(option, intensity)} 
              className="btn btn-team-outline btn-sm"
              style={{fontSize: '11px', padding: '6px 8px'}}
            >
              {option}
            </button>
          ))}
        </div>
        
        <div style={{marginTop: '8px', display: 'flex', gap: '4px'}}>
          <button onClick={()=>onTrain("Balanced", intensity)} className="btn btn-primary btn-sm" style={{flex: 1}}>
            Balanced
          </button>
          <button onClick={()=>onTrain("Recovery", intensity)} className="btn btn-secondary btn-sm" style={{flex: 1}}>
            Recovery
          </button>
        </div>
      </div>

      {/* Endorsements */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>Brand Deals</h3>
        
        <div style={{marginBottom: '12px'}}>
          <div style={{fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px'}}>Cash: {formatMoney(cash)}</div>
          <div style={{display: 'flex', gap: '4px'}}>
            <button onClick={onEndorse} className="btn btn-team btn-sm" style={{flex: 1}}>
              Get Endorsement
            </button>
            <button onClick={onShoeEndorse} className="btn btn-team-outline btn-sm" style={{flex: 1}}>
              Shoe Deal
            </button>
          </div>
        </div>
        
        <div style={{maxHeight: '120px', overflowY: 'auto'}}>
          {[...endorsements, ...shoeDeals].map((deal, i) => (
            <div key={i} style={{
              padding: '6px 8px',
              marginBottom: '4px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              borderLeft: '3px solid var(--team-primary)'
            }}>
              <div style={{fontSize: '12px', fontWeight: 'bold'}}>{deal.name}</div>
              <div style={{fontSize: '11px', color: 'var(--text-secondary)'}}>${deal.value}k/year</div>
            </div>
          ))}
          {endorsements.length === 0 && shoeDeals.length === 0 && (
            <div style={{fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px'}}>
              No deals yet
            </div>
          )}
        </div>
      </div>

      {/* Premium Services */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>Premium Services</h3>
        
        <button onClick={() => setShowPremiumServices(true)} className="btn btn-primary btn-sm" style={{width: '100%', marginBottom: '12px'}}>
          Browse Premium Services
        </button>
        
        <div style={{maxHeight: '120px', overflowY: 'auto'}}>
          {premiumServices.map((service, i) => (
            <div key={i} style={{
              padding: '6px 8px',
              marginBottom: '4px',
              background: 'linear-gradient(135deg, var(--team-primary), var(--team-secondary))',
              color: 'var(--team-text)',
              borderRadius: '6px',
              opacity: 0.9
            }}>
              <div style={{fontSize: '12px', fontWeight: 'bold'}}>{service.name}</div>
              <div style={{fontSize: '11px', opacity: 0.8}}>{service.weeksLeft} weeks left</div>
            </div>
          ))}
          {premiumServices.length === 0 && (
            <div style={{fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px'}}>
              No active services
            </div>
          )}
        </div>
      </div>
      
      {/* Premium Services Modal */}
      {showPremiumServices && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 fade-in">
          <div className="panel panel-content w-full max-w-2xl mx-4" style={{maxHeight: '80vh', overflowY: 'auto'}}>
            <h3 className="text-xl font-bold mb-4 text-team-primary">Premium Services</h3>
            <div className="grid-2" style={{gap: '12px'}}>
              {PREMIUM_SERVICES.map((service, index) => {
                const isActive = premiumServices.find(s => s.name === service.name);
                const canAfford = cash >= service.cost;
                
                return (
                  <div key={index} style={{
                    padding: '16px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                    background: isActive ? 'rgba(var(--team-primary-rgb), 0.1)' : 'var(--bg-secondary)',
                    opacity: isActive ? 0.6 : 1
                  }}>
                    <div style={{fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--team-primary)'}}>
                      {service.name}
                    </div>
                    <div style={{fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px'}}>
                      {service.description}
                    </div>
                    <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px'}}>
                      Duration: {service.duration} weeks • Cost: ${service.cost}k
                    </div>
                    <button 
                      onClick={() => {
                        if (!isActive && canAfford) {
                          onPremium(service);
                        }
                      }}
                      disabled={isActive || !canAfford}
                      className={`btn btn-sm ${canAfford && !isActive ? 'btn-primary' : 'btn-ghost'}`}
                      style={{width: '100%'}}
                    >
                      {isActive ? 'Active' : !canAfford ? `Need $${service.cost}k` : 'Hire'}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn btn-ghost" onClick={() => setShowPremiumServices(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HealthPanel({ onHealth, cash, health, peak }){
  const healthOptions = [
    { name: "Diet", cost: 15, health: 8, peak: 3, desc: "Nutrition plan" },
    { name: "Gym", cost: 25, health: 12, peak: 5, desc: "Training session" },
    { name: "Cryotherapy", cost: 80, health: 20, peak: 15, desc: "Recovery treatment" },
  ];
  
  return (
    <div className="grid-3">
      {/* Health Services */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>Health Services</h3>
        <div style={{marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: 'var(--team-primary)'}}>
          Cash: {formatMoney(cash)}
        </div>
        <div className="grid-4" style={{gap: '6px'}}>
          {healthOptions.map(option=> (
            <button 
              key={option.name} 
              onClick={()=>onHealth(option.name)}
              className={cash >= option.cost ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
              disabled={cash < option.cost}
              style={{
                fontSize: '11px', 
                padding: '8px 6px',
                opacity: cash >= option.cost ? 1 : 0.5
              }}
            >
              <div>{option.name}</div>
              <div style={{fontSize: '10px'}}>${option.cost}k</div>
            </button>
          ))}
        </div>
        <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px'}}>
          Health affects accuracy & injury resistance. Peak affects minutes & performance.
        </div>
      </div>

      {/* Current Status */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>Physical Status</h3>
        <div className="stats-grid">
          <div className="compact-stat">
            <div className="compact-stat-label">Health</div>
            <div className="compact-stat-value">{health}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Peak</div>
            <div className="compact-stat-value">{peak}</div>
          </div>
        </div>
        
        <div style={{marginTop: '12px'}}>
          <div style={{marginBottom: '6px'}}>
            <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Health Level</div>
            <div style={{
              width: '100%', 
              height: '8px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${health}%`, 
                height: '100%', 
                background: health > 70 ? 'var(--team-primary)' : health > 30 ? '#f59e0b' : '#ef4444',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
          
          <div>
            <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Peak Condition</div>
            <div style={{
              width: '100%', 
              height: '8px', 
              background: 'var(--bg-secondary)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${peak}%`, 
                height: '100%', 
                background: peak > 70 ? 'var(--team-secondary)' : peak > 30 ? '#f59e0b' : '#ef4444',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Tips */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>Health Guide</h3>
        <div style={{fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4'}}>
          <div style={{marginBottom: '8px'}}>
            <strong style={{color: 'var(--team-primary)'}}>Diet:</strong> Affordable daily nutrition boost
          </div>
          <div style={{marginBottom: '8px'}}>
            <strong style={{color: 'var(--team-primary)'}}>Gym:</strong> Balanced training and recovery
          </div>
          <div style={{marginBottom: '8px'}}>
            <strong style={{color: 'var(--team-primary)'}}>Cryotherapy:</strong> Maximum recovery for important games
          </div>
          <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px'}}>
            💡 Use recovery services before important games or when health is low
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamPanel({ game, avg, onTrade, onContract }){
  const teamInfo = NBA_TEAMS[game.team];
  
  // Use persistent standings from game state
  const standings = getStandings(game);
  const playerTeamRank = standings.findIndex(team => team.isPlayerTeam) + 1;
  const conferenceStandings = standings.filter(team => 
    team.conference === teamInfo?.conference
  ).slice(0, 8); // Top 8 in conference

  return (
    <div className="grid-3">
      {/* Team Status */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>Team Status</h3>
        <div style={{padding: '16px', background: 'linear-gradient(135deg, var(--team-primary), var(--team-secondary))', borderRadius: '12px', marginBottom: '12px', color: 'var(--team-text)'}}>
          <div style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '4px'}}>
            {teamInfo ? teamInfo.name : game.team}
          </div>
          <div style={{fontSize: '14px', opacity: '0.9'}}>
            #{playerTeamRank} in League • {teamInfo?.conference} Conference
          </div>
          <div style={{fontSize: '14px', opacity: '0.9'}}>
            Strength: {teamInfo ? teamInfo.strength : game.teamStrength}/100
          </div>
        </div>
        
        <div className="grid-2" style={{gap: '8px', marginBottom: '12px'}}>
          <div className="compact-stat">
            <div className="compact-stat-label">Chemistry</div>
            <div className="compact-stat-value">{game.teamChem}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Your Role</div>
            <div className="compact-stat-value" style={{fontSize: '12px'}}>Star</div>
          </div>
        </div>
        
        <div className="grid-2" style={{gap: '6px'}}>
          <button className="btn btn-primary btn-sm" onClick={onContract}>Renegotiate</button>
          <button className="btn btn-secondary btn-sm" onClick={onTrade}>Request Trade</button>
        </div>
      </div>

      {/* Conference Standings */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>{teamInfo?.conference} Conference</h3>
        <div style={{maxHeight: '300px', overflowY: 'auto'}}>
          {conferenceStandings.map((team, index) => (
            <div 
              key={team.team} 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                marginBottom: '4px',
                background: team.isPlayerTeam ? 'var(--team-primary)' : 'var(--bg-secondary)',
                color: team.isPlayerTeam ? 'var(--team-text)' : 'var(--text-primary)',
                borderRadius: '6px',
                fontSize: '13px',
                opacity: team.isPlayerTeam ? 1 : 0.9
              }}
            >
              <div>
                <span style={{fontWeight: 'bold', marginRight: '8px'}}>#{index + 1}</span>
                <span style={{fontWeight: team.isPlayerTeam ? 'bold' : 'normal'}}>
                  {team.name}
                </span>
              </div>
              <div style={{fontWeight: 'bold'}}>
                {team.wins}-{team.losses}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teammates */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>Teammates</h3>
        <div style={{maxHeight: '300px', overflowY: 'auto'}}>
          {game.teammates.map((teammate, i) => (
            <div key={i} style={{
              padding: '10px',
              marginBottom: '6px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              borderLeft: '3px solid var(--team-primary)'
            }}>
              <div style={{fontWeight: 'bold', fontSize: '14px', marginBottom: '2px'}}>
                {teammate.name}
              </div>
              <div style={{fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px'}}>
                {teammate.position} • {teammate.overall} OVR
              </div>
              <div style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                {teammate.ppg}p {teammate.rpg}r {teammate.apg}a
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel({ game }){
  const seasons = game.career?.seasons || [];
  const careerPPG = seasons.map(s => s.averages?.pts || 0);
  const careerPER = seasons.map(s => s.averages?.per || 0);
  const careerTS = seasons.map(s => s.averages?.ts || 0);
  
  // Format ranking display for better UX with legacy score consideration
  const formatRanking = (rank, legacyScore = 0) => {
    if (rank === "N/A" || rank <= 10) return `#${rank}`;
    
    // Use legacy score to determine appropriate ranking display
    if (legacyScore >= 800) {
      if (rank <= 15) return "Top 15";
      if (rank <= 25) return "Top 25";
    } else if (legacyScore >= 600) {
      if (rank <= 25) return "Top 25";
      if (rank <= 50) return "Top 50";
    } else if (legacyScore >= 400) {
      if (rank <= 50) return "Top 50";
      if (rank <= 100) return "Top 100";
    } else if (legacyScore >= 200) {
      if (rank <= 100) return "Top 100";
      if (rank <= 200) return "Top 200";
    } else {
      if (rank <= 200) return "Top 200";
      if (rank <= 300) return "Top 300";
      if (rank <= 400) return "Top 400";
      if (rank <= 500) return "Top 500";
    }
    
    return "Unranked";
  };
  
  // Calculate analytics data safely
  const playerScore = calculatePlayerScore(game);
  const hofChance = getHallOfFameChance(game);
  const currentRankings = generateCurrentLeagueRankings(game);
  const allTimeRankings = generateAllTimeRankings(game);
  
  const playerCurrentRank = currentRankings.find(p => p.isPlayer)?.rank || "N/A";
  const playerAllTimeRank = allTimeRankings.find(p => p.isPlayer)?.rank || "N/A";
  const formattedAllTimeRank = formatRanking(playerAllTimeRank, playerScore);
  
  // Safely get awards data from totals
  const totals = game.career?.totals || {};
  const championships = totals.titles || 0;
  const mvpAwards = totals.mvps || 0;
  
  return (
    <div className="grid-3">
      {/* Hall of Fame & Legacy */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>Hall of Fame Analysis</h3>
        
        {seasons.length > 0 ? (
          <div style={{gap: '12px', display: 'flex', flexDirection: 'column'}}>
            {/* Legacy Score */}
            <div style={{
              background: 'linear-gradient(135deg, var(--team-primary), var(--team-secondary))',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              marginBottom: '8px'
            }}>
              <div style={{fontSize: '10px', color: 'var(--team-text)', opacity: '0.9', fontWeight: '600'}}>LEGACY SCORE</div>
              <div style={{fontSize: '24px', fontWeight: 'bold', color: 'var(--team-text)'}}>{playerScore}</div>
              <div style={{fontSize: '11px', color: 'var(--team-text)', opacity: '0.8'}}>
                Career Impact Rating
              </div>
            </div>
            
            {/* Hall of Fame Probability */}
            <div style={{
              background: hofChance >= 60 ? 'linear-gradient(135deg, #10b981, #059669)' : 
                          hofChance >= 30 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                          'linear-gradient(135deg, #6b7280, #4b5563)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '11px', color: 'white', opacity: '0.9', fontWeight: '600', marginBottom: '4px'}}>
                HALL OF FAME PROBABILITY
              </div>
              <div style={{fontSize: '24px', fontWeight: 'bold', color: 'white'}}>{hofChance}%</div>
              <div style={{fontSize: '10px', color: 'white', opacity: '0.8', marginTop: '2px'}}>
                {hofChance >= 80 ? "Lock for HOF" :
                 hofChance >= 60 ? "Strong Candidate" :
                 hofChance >= 30 ? "Building Legacy" :
                 "Work in Progress"}
              </div>
            </div>

            {/* Legacy Score */}
            <div className="stats-grid">
              <div className="compact-stat">
                <div className="compact-stat-label">Legacy Score</div>
                <div className="compact-stat-value">{playerScore}</div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">Career Seasons</div>
                <div className="compact-stat-value">{seasons.length}</div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">Championships</div>
                <div className="compact-stat-value">{championships}</div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">MVP Awards</div>
                <div className="compact-stat-value">{mvpAwards}</div>
              </div>
            </div>

            {/* HOF Requirements */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '10px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{fontWeight: '600', marginBottom: '4px'}}>HOF Factors:</div>
              <div>• Career Stats & Efficiency</div>
              <div>• Championships & Finals MVPs</div>
              <div>• Individual Awards (MVP, All-Star)</div>
              <div>• Career Longevity</div>
            </div>
          </div>
        ) : (
          <div style={{color: 'var(--text-muted)', textAlign: 'center', padding: '20px', fontSize: '12px'}}>
            Complete your first season to see Hall of Fame analysis
          </div>
        )}
      </div>

      {/* Current League Rankings */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>Current Season Rankings</h3>
        
        {seasons.length > 0 ? (
          <div style={{gap: '8px', display: 'flex', flexDirection: 'column'}}>
            {/* Player's Current Rank */}
            <div style={{
              background: playerCurrentRank <= 5 ? 'linear-gradient(135deg, #10b981, #059669)' :
                          playerCurrentRank <= 10 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                          'linear-gradient(135deg, #6b7280, #4b5563)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '10px', color: 'white', opacity: '0.9', fontWeight: '600'}}>YOUR LEAGUE RANK</div>
              <div style={{fontSize: '18px', fontWeight: 'bold', color: 'white'}}>#{playerCurrentRank}</div>
            </div>

            {/* Top 5 Current Players */}
            <div style={{fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600'}}>
              Top Players This Season (by PER)
            </div>
            <div style={{maxHeight: '140px', overflowY: 'auto', gap: '2px', display: 'flex', flexDirection: 'column'}}>
              {currentRankings.slice(0, 5).map((player, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: player.isPlayer ? 'var(--team-primary)' : 'var(--bg-secondary)',
                  color: player.isPlayer ? 'var(--team-text)' : 'var(--text-primary)',
                  fontSize: '10px'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <span style={{fontWeight: 'bold', width: '16px'}}>#{player.rank}</span>
                    <div>
                      <div style={{fontWeight: '600'}}>{player.name}</div>
                      <div style={{opacity: '0.7'}}>{player.team}</div>
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div>{fmt(player.ppg)} PPG</div>
                    <div style={{opacity: '0.7'}}>{fmt(player.per)} PER</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{color: 'var(--text-muted)', fontSize: '12px'}}>Complete a season to see rankings</div>
        )}
      </div>

      {/* All-Time Rankings */}
      <div className="panel panel-content-tight">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>All-Time Rankings</h3>
        
        {seasons.length > 0 ? (
          <div style={{gap: '8px', display: 'flex', flexDirection: 'column'}}>
            {/* Player's All-Time Rank */}
            <div style={{
              background: playerAllTimeRank <= 10 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                          playerAllTimeRank <= 50 ? 'linear-gradient(135deg, #10b981, #059669)' :
                          'linear-gradient(135deg, #6b7280, #4b5563)',
              borderRadius: '8px',
              padding: '8px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '10px', color: 'white', opacity: '0.9', fontWeight: '600'}}>ALL-TIME RANK</div>
              <div style={{fontSize: '18px', fontWeight: 'bold', color: 'white'}}>{formattedAllTimeRank}</div>
              <div style={{fontSize: '9px', color: 'white', opacity: '0.8'}}>Legacy Score: {playerScore}</div>
            </div>

            {/* Top All-Time Players */}
            <div style={{fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600'}}>
              All-Time Greats (by Legacy Score)
            </div>
            <div style={{maxHeight: '160px', overflowY: 'auto', gap: '2px', display: 'flex', flexDirection: 'column'}}>
              {allTimeRankings.slice(0, 10).map((player, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: player.isPlayer ? 'var(--team-primary)' : 
                             player.rank <= 3 ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))' :
                             'var(--bg-secondary)',
                  color: player.isPlayer ? 'var(--team-text)' : 'var(--text-primary)',
                  fontSize: '10px',
                  border: player.rank <= 3 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid transparent'
                }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <span style={{fontWeight: 'bold', width: '16px'}}>
                      {player.rank <= 3 ? 
                        (player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉') : 
                        `#${player.rank}`}
                    </span>
                    <div>
                      <div style={{fontWeight: '600'}}>{player.name}</div>
                      <div style={{opacity: '0.7'}}>{player.championships}🏆 {player.mvps}👑</div>
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontWeight: '600'}}>{player.score}</div>
                    <div style={{opacity: '0.7'}}>Legacy</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{color: 'var(--text-muted)', fontSize: '12px'}}>Build your legacy to see all-time rankings</div>
        )}
      </div>
    </div>
  );
}

function LeaguePanel({ game }){
  // Use persistent standings from game state
  const eastStandings = getConferenceStandings(game, "East");
  const westStandings = getConferenceStandings(game, "West");

  const renderStandings = (teams, conference) => (
    <div className="panel panel-content-tight">
      <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>{conference} Conference</h3>
      <div style={{gap: '4px', display: 'flex', flexDirection: 'column'}}>
        {teams.map((team, index) => (
          <div 
            key={team.team} 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: team.isPlayerTeam ? 'var(--team-primary)' : 'var(--bg-secondary)',
              opacity: team.isPlayerTeam ? '0.9' : '0.7',
              border: team.isPlayerTeam ? '1px solid var(--team-secondary)' : '1px solid transparent'
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', width: '20px'}}>{index + 1}</span>
              <div>
                <div style={{
                  fontSize: '13px', 
                  fontWeight: '600',
                  color: team.isPlayerTeam ? 'var(--team-text)' : 'var(--text-primary)'
                }}>
                  {team.name}
                </div>
                <div style={{fontSize: '10px', color: team.isPlayerTeam ? 'var(--team-text)' : 'var(--text-muted)'}}>
                  Strength: {team.baseStrength || team.currentStrength}
                </div>
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{
                fontSize: '13px', 
                fontWeight: 'bold',
                color: team.isPlayerTeam ? 'var(--team-text)' : 'var(--text-primary)'
              }}>
                {team.wins}-{team.losses}
              </div>
              <div style={{
                fontSize: '11px',
                color: team.isPlayerTeam ? 'var(--team-text)' : 'var(--text-secondary)'
              }}>
                {(team.winPct * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid-2">
      {renderStandings(eastStandings, "Eastern")}
      {renderStandings(westStandings, "Western")}
    </div>
  );
}

function ContractsPanel({ game }){
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700">
        <div className="font-bold text-xl mb-4 text-slate-100">Current Contract</div>
        <div className="space-y-3">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-400">Team</div>
                <div className="font-semibold text-slate-200">{game.team}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Years</div>
                <div className="font-semibold text-slate-200">{game.contract.year}/{game.contract.years}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Total Value</div>
                <div className="font-semibold text-emerald-400">${game.contract.salary}k</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Clause</div>
                <div className="font-semibold text-slate-200">{game.contract.clause}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-slate-400 text-sm mt-4">
          Free agency or trades happen automatically in Offseason based on performance, fame, and social media following.
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="font-bold text-xl mb-4 text-slate-100">Career Earnings</div>
          <div className="text-4xl font-black text-emerald-400 mb-2">${game.cash}k</div>
          <div className="text-slate-400 text-sm mb-4">Includes salaries & endorsement payouts</div>
          
          <div className="space-y-2">
            <StatPill label="Social Media" value={`${(game.followers/1000).toFixed(0)}K followers`} />
            <StatPill label="Fame Level" value={`${game.fame}/100`} />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="font-bold text-xl mb-4 text-slate-100">Active Deals</div>
          
          {game.endorsements.length > 0 && (
            <>
              <div className="font-semibold mb-2 text-slate-300">Endorsements</div>
              {game.endorsements.map((e,i)=>(
                <div key={i} className="flex justify-between text-sm bg-slate-800/50 rounded-xl px-3 py-2 mb-2 border border-slate-600">
                  <div className="font-medium">{e.name}</div>
                  <div className="text-emerald-400">${e.value}k/yr</div>
                </div>
              ))}
            </>
          )}
          
          {game.shoeDeals.length > 0 && (
            <>
              <div className="font-semibold mb-2 mt-4 text-slate-300">Shoe Deals</div>
              {game.shoeDeals.map((e,i)=>(
                <div key={i} className="flex justify-between text-sm bg-blue-900/20 rounded-xl px-3 py-2 mb-2 border border-blue-600/30">
                  <div className="font-medium">{e.name}</div>
                  <div className="text-blue-400">${e.value}k/yr • {e.years}y</div>
                </div>
              ))}
            </>
          )}
          
          {game.endorsements.length === 0 && game.shoeDeals.length === 0 && (
            <div className="text-slate-400 text-sm">No deals yet. Build your brand in Training tab.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AwardsPanel({ game }){
  const grouped = game.career.awards.reduce((acc,a)=>{(acc[a.season]=acc[a.season]||[]).push(a.award); return acc;},{});
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700">
        <div className="font-bold text-xl mb-4 text-slate-100">Season Awards</div>
        {Object.keys(grouped).length? (
          <div className="space-y-3">
            {Object.entries(grouped).map(([s, list])=> (
              <div key={s} className="bg-gradient-to-r from-amber-900/20 to-yellow-900/20 rounded-xl p-4 border border-amber-600/30">
                <div className="font-semibold text-amber-200">Season {s}</div>
                <div className="text-sm text-amber-100 mt-1">{list.join(", ")}</div>
              </div>
            ))}
          </div>
        ): <div className="text-slate-400 text-center py-8">No awards yet. Time to ball out!</div>}
      </div>
      
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700">
        <div className="font-bold text-xl mb-4 text-slate-100">Career Achievements</div>
        <div className="grid grid-cols-2 gap-3">
          <StatPill label="Games" value={game.career.totals.games.toLocaleString()} />
          <StatPill label="Points" value={game.career.totals.points.toLocaleString()} />
          <StatPill label="Career PPG" value={fmt(game.career.totals.games? game.career.totals.points/game.career.totals.games:0)} />
          <StatPill label="Career APG" value={fmt(game.career.totals.games? game.career.totals.assists/game.career.totals.games:0)} />
          <StatPill label="Career RPG" value={fmt(game.career.totals.games? game.career.totals.rebounds/game.career.totals.games:0)} />
          <StatPill label="Titles" value={game.career.totals.titles} />
          <StatPill label="MVPs" value={game.career.totals.mvps} />
          <StatPill label="Finals MVPs" value={game.career.totals.finalsMVPs} />
          <StatPill label="All-Stars" value={game.career.totals.allstars} />
          <StatPill label="DPOY" value={game.career.totals.dpoys} />
          <StatPill label="6MOY" value={game.career.totals.sixmoys} />
          <StatPill label="Scoring Titles" value={game.career.totals.scoring} />
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({ game, hof }){
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700">
        <div className="font-bold text-xl mb-4 text-slate-100">Career Timeline</div>
        <div className="max-h-[500px] overflow-auto pr-2 space-y-3">
          {game.career.timeline.slice().reverse().map(ev=> (
            <div key={ev.id} className={`bg-slate-800/50 rounded-xl p-3 border border-slate-600 ${
              ev.type === 'Championship' ? 'border-amber-500/50 bg-amber-900/10' :
              ev.type === 'Awards' ? 'border-purple-500/50 bg-purple-900/10' :
              ev.type === 'Injury' ? 'border-red-500/50 bg-red-900/10' :
              ev.type === 'Trade' ? 'border-blue-500/50 bg-blue-900/10' : ''
            }`}>
              <div className="text-xs text-slate-400 font-medium">{ev.type}</div>
              <div className="text-sm text-slate-200 mt-1">{ev.text}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="font-bold text-xl mb-4 text-slate-100">Legacy</div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-300 mb-2">Hall of Fame Odds</div>
              <Bar label="" value={hof} />
              <div className="text-lg font-bold text-center mt-2 text-amber-400">{Math.round(hof)}%</div>
            </div>
            
            {game.retired && (
              <div className="text-sm text-slate-300 bg-slate-800/50 rounded-xl p-3 border border-slate-600">
                {hof>=60? "Congratulations! You're projected to enter the Hall of Fame soon." : 
                 hof>=40? "A solid career - you made your mark on the game." :
                 "A respectable career - every journey starts somewhere."}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700">
          <div className="font-bold text-xl mb-4 text-slate-100">Season History</div>
          {game.career.seasons.length? (
            <div className="space-y-2 max-h-80 overflow-auto pr-2">
              {game.career.seasons.map(s=> (
                <div key={s.season} className={`bg-slate-800/50 rounded-xl p-3 border border-slate-600 ${
                  s.stats.champion ? 'border-amber-500/50 bg-amber-900/10' : ''
                }`}>
                  <div className="text-xs text-slate-400">Season {s.season} • {s.team} • {s.overall} OVR</div>
                  <div className="text-sm text-slate-200">
                    {fmt(s.averages.pts)}p {fmt(s.averages.reb)}r {fmt(s.averages.ast)}a • {s.stats.wins}-{s.stats.losses}
                    {s.stats.champion && " CHAMP"}
                    {s.stats.finalsMVP && " FMVP"}
                  </div>
                  <div className="text-xs text-slate-400">PER: {fmt(s.averages.per || 0)} • TS: {fmt((s.averages.ts || 0)*100,1)}%</div>
                </div>
              ))}
            </div>
          ): <div className="text-slate-400 text-sm">No completed seasons yet.</div>}
        </div>
      </div>
    </div>
  );
}

function Gauge({ label, value }){
  return (
    <div className="progress-container">
      <div className="progress-label">
        <span className="text-muted font-medium text-xs uppercase tracking-wide">{label}</span>
        <span className="font-bold text-sm">{Math.round(value)}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${clamp(value,0,100)}%` }} />
      </div>
    </div>
  );
}

function Bar({ label, value }){
  return (
    <div className="progress-container">
      <div className="progress-label">
        <span className="font-medium">{label}</span>
        <span className="font-bold">{Math.round(value)}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${clamp(value,0,100)}%` }} />
      </div>
    </div>
  );
}

// ...removed duplicate StatPill definition...

function Toast({ text }){
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 panel panel-content-tight z-50 fade-in">
      <div className="font-medium text-center">{text}</div>
    </div>
  );
}

function AwardsPopup({ awards, season, champion, finalsMVP, onClose }){
  const getAwardEmoji = (award) => {
    switch(award) {
      case "MVP": return "";
      case "Finals MVP": return "";
      case "NBA Champion": return "";
      case "DPOY": return "";
      case "6MOY": return "";
      case "ROY": return "";
      case "Scoring Title": return "";
      case "All-Star": return "";
      case "MIP": return "";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 fade-in">
      <div className="panel panel-content text-center max-w-lg mx-4">
        <div className="text-2xl font-bold mb-6 text-team-primary">Season {season} Awards</div>
        <div className="space-y-3 mb-6">
          {awards.map((award, index) => (
            <div key={index} className="flex items-center justify-center gap-3 p-3 bg-bg-tertiary rounded-lg">
              <span className="text-2xl">{getAwardEmoji(award)}</span>
              <span className="text-lg font-semibold">{award}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-team font-bold px-8 py-3" onClick={onClose}>
          Fantastic!
        </button>
      </div>
    </div>
  );
}

function cap(s){ return s.slice(0,1).toUpperCase()+s.slice(1); }

// ---------- Persistence ----------
function saveGame(game){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); }catch{} }
function loadGame(){ try{ const s = localStorage.getItem(STORAGE_KEY); return s? JSON.parse(s): null; }catch{ return null; } }
