import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

// ---------- Utilities ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (min = 0, max = 1) => Math.random() * (max - min) + min;
const irnd = (min, max) => Math.floor(rnd(min, max + 1));
const chance = (p) => Math.random() < p; // p in [0,1]
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const deepClone = (obj) => {
  const cloned = JSON.parse(JSON.stringify(obj));
  // Protect against NaN and corrupted money values
  if (cloned && typeof cloned.cash === 'number' && (isNaN(cloned.cash) || cloned.cash < 0)) {
    cloned.cash = 0;
  }
  return cloned;
};

// Money validation function
const validateMoney = (player) => {
  if (!player) return player;
  if (isNaN(player.cash) || player.cash < 0) {
    player.cash = 0;
  }
  return player;
};

// Global championship tracking
const CHAMPIONSHIP_WINNERS = {};
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

// Generate random player appearance with comprehensive customization
const generateAppearance = () => {
  const skinTones = [
    '#F5DEB3', '#DEB887', '#D2B48C', '#BC9A6A', 
    '#A0522D', '#8B4513', '#654321', '#F4C2A1',
    '#E6B887', '#C8956D', '#8D5524', '#5D4037'
  ];
  
  const hairStyles = [
    'buzz', 'short', 'medium', 'long', 'curly', 'afro', 
    'fade', 'mohawk', 'bald', 'ponytail', 'dreadlocks', 'waves'
  ];
  
  const hairColors = [
    '#000000', '#2F1B14', '#8B4513', '#D2691E', 
    '#DAA520', '#FFD700', '#B22222', '#FFFFFF', 
    '#654321', '#4A4A4A', '#8B0000', '#2E2E2E'
  ];
  
  const eyeColors = [
    '#8B4513', '#654321', '#4682B4', '#228B22', 
    '#808080', '#000000', '#32CD32', '#4169E1',
    '#20B2AA', '#8A2BE2', '#A0522D', '#2E8B57'
  ];
  
  const faceShapes = ['oval', 'round', 'square', 'heart', 'diamond', 'oblong'];
  const noseTypes = ['small', 'medium', 'large', 'wide', 'narrow', 'button', 'hooked'];
  const facialHairStyles = ['none', 'mustache', 'goatee', 'full_beard', 'stubble', 'soul_patch', 'mutton_chops'];
  const expressions = ['neutral', 'smile', 'smirk', 'serious', 'confident', 'determined'];
  
  return {
    skin: pick(skinTones),
    hairStyle: pick(hairStyles),
    hairColor: pick(hairColors),
    eyes: pick(eyeColors),
    faceShape: pick(faceShapes),
    nose: pick(noseTypes),
    facialHair: pick(facialHairStyles),
    expression: pick(expressions),
    eyebrows: pick(['thin', 'medium', 'thick', 'bushy']),
    jawline: pick(['soft', 'defined', 'strong', 'rounded'])
  };
};

// Create SVG avatar based on appearance
const createAvatarSVG = (appearance, size = 120) => {
  const { skin, hairStyle, hairColor, eyes, faceShape, nose, facialHair, expression, eyebrows, jawline } = appearance;
  
  // Face shape paths
  const getFaceShape = (shape) => {
    const baseWidth = size * 0.8;
    const baseHeight = size * 0.9;
    const centerX = size / 2;
    const centerY = size / 2;
    
    switch (shape) {
      case 'oval':
        return `M ${centerX - baseWidth/2.5} ${centerY - baseHeight/2.5} 
                Q ${centerX - baseWidth/2.5} ${centerY - baseHeight/2} ${centerX} ${centerY - baseHeight/2}
                Q ${centerX + baseWidth/2.5} ${centerY - baseHeight/2} ${centerX + baseWidth/2.5} ${centerY - baseHeight/2.5}
                Q ${centerX + baseWidth/2.5} ${centerY + baseHeight/2.5} ${centerX} ${centerY + baseHeight/2}
                Q ${centerX - baseWidth/2.5} ${centerY + baseHeight/2.5} ${centerX - baseWidth/2.5} ${centerY - baseHeight/2.5} Z`;
      case 'round':
        return `M ${centerX} ${centerY - baseHeight/2.2} 
                A ${baseWidth/2.2} ${baseHeight/2.2} 0 1 1 ${centerX} ${centerY + baseHeight/2.2}
                A ${baseWidth/2.2} ${baseHeight/2.2} 0 1 1 ${centerX} ${centerY - baseHeight/2.2} Z`;
      case 'square':
        return `M ${centerX - baseWidth/2.5} ${centerY - baseHeight/2.5}
                L ${centerX + baseWidth/2.5} ${centerY - baseHeight/2.5}
                Q ${centerX + baseWidth/2.3} ${centerY + baseHeight/2.5} ${centerX} ${centerY + baseHeight/2}
                Q ${centerX - baseWidth/2.3} ${centerY + baseHeight/2.5} ${centerX - baseWidth/2.5} ${centerY - baseHeight/2.5} Z`;
      case 'heart':
        return `M ${centerX} ${centerY + baseHeight/2.2}
                Q ${centerX - baseWidth/2.5} ${centerY + baseHeight/3} ${centerX - baseWidth/2.5} ${centerY - baseHeight/4}
                Q ${centerX - baseWidth/2.5} ${centerY - baseHeight/2} ${centerX} ${centerY - baseHeight/2.5}
                Q ${centerX + baseWidth/2.5} ${centerY - baseHeight/2} ${centerX + baseWidth/2.5} ${centerY - baseHeight/4}
                Q ${centerX + baseWidth/2.5} ${centerY + baseHeight/3} ${centerX} ${centerY + baseHeight/2.2} Z`;
      default:
        return getFaceShape('oval');
    }
  };
  
  // Hair style paths
  const getHairStyle = (style, color) => {
    const centerX = size / 2;
    const hairTop = size * 0.05;
    const hairWidth = size * 0.85;
    
    if (style === 'bald') return '';
    
    const hairPath = (() => {
      switch (style) {
        case 'buzz':
          return `M ${centerX - hairWidth/3} ${hairTop + 10} 
                  Q ${centerX} ${hairTop} ${centerX + hairWidth/3} ${hairTop + 10}
                  L ${centerX + hairWidth/2.5} ${hairTop + 25}
                  Q ${centerX} ${hairTop + 15} ${centerX - hairWidth/2.5} ${hairTop + 25} Z`;
        case 'short':
          return `M ${centerX - hairWidth/2.5} ${hairTop + 8} 
                  Q ${centerX} ${hairTop - 5} ${centerX + hairWidth/2.5} ${hairTop + 8}
                  L ${centerX + hairWidth/2.5} ${hairTop + 35}
                  Q ${centerX} ${hairTop + 20} ${centerX - hairWidth/2.5} ${hairTop + 35} Z`;
        case 'afro':
          return `M ${centerX} ${hairTop - 10} 
                  A ${hairWidth/1.8} ${hairWidth/2.2} 0 1 1 ${centerX + 0.1} ${hairTop - 10} Z`;
        case 'curly':
          return `M ${centerX - hairWidth/2.3} ${hairTop} 
                  Q ${centerX - hairWidth/3} ${hairTop - 15} ${centerX} ${hairTop - 8}
                  Q ${centerX + hairWidth/3} ${hairTop - 15} ${centerX + hairWidth/2.3} ${hairTop}
                  L ${centerX + hairWidth/2.5} ${hairTop + 40}
                  Q ${centerX} ${hairTop + 25} ${centerX - hairWidth/2.5} ${hairTop + 40} Z`;
        case 'fade':
          return `M ${centerX - hairWidth/2.8} ${hairTop + 12} 
                  Q ${centerX} ${hairTop - 2} ${centerX + hairWidth/2.8} ${hairTop + 12}
                  L ${centerX + hairWidth/3} ${hairTop + 30}
                  Q ${centerX} ${hairTop + 18} ${centerX - hairWidth/3} ${hairTop + 30} Z`;
        default:
          return getHairStyle('short', color);
      }
    })();
    
    return `<path d="${hairPath}" fill="${color}" stroke="${color}" stroke-width="1"/>`;
  };
  
  // Eye generation
  const getEyes = (eyeColor, expression) => {
    const leftEyeX = size * 0.35;
    const rightEyeX = size * 0.65;
    const eyeY = size * 0.4;
    const eyeWidth = 12;
    const eyeHeight = expression === 'smile' ? 8 : 10;
    
    return `
      <ellipse cx="${leftEyeX}" cy="${eyeY}" rx="${eyeWidth}" ry="${eyeHeight}" fill="white" stroke="#333" stroke-width="1"/>
      <circle cx="${leftEyeX}" cy="${eyeY}" r="6" fill="${eyeColor}"/>
      <circle cx="${leftEyeX + 2}" cy="${eyeY - 1}" r="2" fill="black"/>
      <circle cx="${leftEyeX + 3}" cy="${eyeY - 2}" r="1" fill="white"/>
      
      <ellipse cx="${rightEyeX}" cy="${eyeY}" rx="${eyeWidth}" ry="${eyeHeight}" fill="white" stroke="#333" stroke-width="1"/>
      <circle cx="${rightEyeX}" cy="${eyeY}" r="6" fill="${eyeColor}"/>
      <circle cx="${rightEyeX + 2}" cy="${eyeY - 1}" r="2" fill="black"/>
      <circle cx="${rightEyeX + 3}" cy="${eyeY - 2}" r="1" fill="white"/>
    `;
  };
  
  // Eyebrow generation
  const getEyebrows = (type, hairColor) => {
    const leftBrowX = size * 0.35;
    const rightBrowX = size * 0.65;
    const browY = size * 0.32;
    
    const thickness = type === 'thick' ? 4 : type === 'medium' ? 3 : 2;
    const length = type === 'bushy' ? 18 : 15;
    
    return `
      <path d="M ${leftBrowX - length/2} ${browY} Q ${leftBrowX} ${browY - 3} ${leftBrowX + length/2} ${browY}" 
            stroke="${hairColor}" stroke-width="${thickness}" fill="none" stroke-linecap="round"/>
      <path d="M ${rightBrowX - length/2} ${browY} Q ${rightBrowX} ${browY - 3} ${rightBrowX + length/2} ${browY}" 
            stroke="${hairColor}" stroke-width="${thickness}" fill="none" stroke-linecap="round"/>
    `;
  };
  
  // Nose generation
  const getNose = (type, skinColor) => {
    const noseX = size / 2;
    const noseY = size * 0.5;
    
    switch (type) {
      case 'small':
        return `<ellipse cx="${noseX}" cy="${noseY}" rx="3" ry="6" fill="${skinColor}" stroke="#999" stroke-width="0.5"/>`;
      case 'large':
        return `<ellipse cx="${noseX}" cy="${noseY}" rx="8" ry="12" fill="${skinColor}" stroke="#999" stroke-width="1"/>`;
      case 'wide':
        return `<ellipse cx="${noseX}" cy="${noseY}" rx="10" ry="8" fill="${skinColor}" stroke="#999" stroke-width="1"/>`;
      case 'button':
        return `<circle cx="${noseX}" cy="${noseY}" r="5" fill="${skinColor}" stroke="#999" stroke-width="0.5"/>`;
      default:
        return `<ellipse cx="${noseX}" cy="${noseY}" rx="5" ry="8" fill="${skinColor}" stroke="#999" stroke-width="0.8"/>`;
    }
  };
  
  // Mouth/Expression generation
  const getMouth = (expression, skinColor) => {
    const mouthX = size / 2;
    const mouthY = size * 0.65;
    
    switch (expression) {
      case 'smile':
        return `<path d="M ${mouthX - 15} ${mouthY} Q ${mouthX} ${mouthY + 8} ${mouthX + 15} ${mouthY}" 
                stroke="#D4696B" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      case 'smirk':
        return `<path d="M ${mouthX - 12} ${mouthY} Q ${mouthX + 5} ${mouthY + 4} ${mouthX + 15} ${mouthY - 2}" 
                stroke="#D4696B" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      case 'serious':
        return `<line x1="${mouthX - 12}" y1="${mouthY}" x2="${mouthX + 12}" y2="${mouthY}" 
                stroke="#D4696B" stroke-width="3" stroke-linecap="round"/>`;
      default:
        return `<path d="M ${mouthX - 10} ${mouthY} Q ${mouthX} ${mouthY + 2} ${mouthX + 10} ${mouthY}" 
                stroke="#D4696B" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
  };
  
  // Facial hair generation
  const getFacialHair = (style, hairColor) => {
    const centerX = size / 2;
    const chinY = size * 0.8;
    
    if (style === 'none') return '';
    
    switch (style) {
      case 'mustache':
        return `<path d="M ${centerX - 15} ${size * 0.6} Q ${centerX} ${size * 0.58} ${centerX + 15} ${size * 0.6}" 
                stroke="${hairColor}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      case 'goatee':
        return `<ellipse cx="${centerX}" cy="${chinY - 5}" rx="8" ry="12" fill="${hairColor}"/>`;
      case 'full_beard':
        return `<path d="M ${centerX - 25} ${size * 0.6} 
                Q ${centerX - 30} ${chinY} ${centerX} ${chinY + 5}
                Q ${centerX + 30} ${chinY} ${centerX + 25} ${size * 0.6}" 
                fill="${hairColor}"/>`;
      case 'stubble':
        return `<circle cx="${centerX - 10}" cy="${chinY - 8}" r="1" fill="${hairColor}" opacity="0.6"/>
                <circle cx="${centerX - 5}" cy="${chinY - 5}" r="1" fill="${hairColor}" opacity="0.6"/>
                <circle cx="${centerX}" cy="${chinY - 3}" r="1" fill="${hairColor}" opacity="0.6"/>
                <circle cx="${centerX + 5}" cy="${chinY - 5}" r="1" fill="${hairColor}" opacity="0.6"/>
                <circle cx="${centerX + 10}" cy="${chinY - 8}" r="1" fill="${hairColor}" opacity="0.6"/>`;
      default:
        return '';
    }
  };
  
  const facePath = getFaceShape(faceShape);
  const hairSVG = getHairStyle(hairStyle, hairColor);
  const eyesSVG = getEyes(eyes, expression);
  const eyebrowsSVG = getEyebrows(eyebrows, hairColor);
  const noseSVG = getNose(nose, skin);
  const mouthSVG = getMouth(expression, skin);
  const facialHairSVG = getFacialHair(facialHair, hairColor);
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Face -->
      <path d="${facePath}" fill="${skin}" stroke="#999" stroke-width="1"/>
      
      <!-- Hair -->
      ${hairSVG}
      
      <!-- Eyebrows -->
      ${eyebrowsSVG}
      
      <!-- Eyes -->
      ${eyesSVG}
      
      <!-- Nose -->
      ${noseSVG}
      
      <!-- Mouth -->
      ${mouthSVG}
      
      <!-- Facial Hair -->
      ${facialHairSVG}
    </svg>
  `;
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

// Life Activities and Investments
const LIFE_ACTIVITIES = [
  { id: 'dating', name: 'Go on Dates', cost: 5, moraleBoost: 8, fameBoost: 2, duration: 1 },
  { id: 'charity', name: 'Charity Work', cost: 20, moraleBoost: 15, fameBoost: 10, followersBoost: 8000, duration: 2 },
  { id: 'mentoring', name: 'Youth Mentoring', cost: 10, moraleBoost: 12, fameBoost: 8, followersBoost: 5000, duration: 3 },
  { id: 'business', name: 'Business Meeting', cost: 25, netWorthBoost: 50, duration: 1 },
  { id: 'vacation', name: 'Vacation', cost: 100, moraleBoost: 25, peakBoost: 15, duration: 5 },
  { id: 'family', name: 'Family Time', cost: 8, moraleBoost: 20, duration: 1 }
];

const INVESTMENT_OPTIONS = [
  { id: 'stocks', name: 'Stock Portfolio', cost: 200, riskLevel: 'medium', returnRate: 0.08, duration: 10 },
  { id: 'realestate', name: 'Real Estate', cost: 500, riskLevel: 'low', returnRate: 0.12, duration: 20 },
  { id: 'restaurant', name: 'Restaurant Chain', cost: 800, riskLevel: 'high', returnRate: 0.20, duration: 15 },
  { id: 'tech', name: 'Tech Startup', cost: 300, riskLevel: 'high', returnRate: 0.25, duration: 8 },
  { id: 'sports', name: 'Sports Franchise', cost: 2000, riskLevel: 'low', returnRate: 0.15, duration: 30 }
];

// Enhanced Social Media Challenges and Content
const SOCIAL_MEDIA_CHALLENGES = [
  {
    id: 'workout', name: 'Workout Challenge', difficulty: 'easy',
    requirements: { overall: 70 }, rewards: { followers: 15000, fame: 5 },
    content: 'Post your training routine and inspire fans!'
  },
  {
    id: 'charity_drive', name: 'Charity Drive', difficulty: 'medium',
    requirements: { overall: 75, fame: 30 }, rewards: { followers: 25000, fame: 12, morale: 10 },
    content: 'Organize a charity event and show your community spirit!'
  },
  {
    id: 'signature_move', name: 'Signature Move', difficulty: 'hard',
    requirements: { overall: 85, skillRating: 80 }, rewards: { followers: 40000, fame: 20 },
    content: 'Showcase your best basketball move in a creative video!'
  },
  {
    id: 'collaboration', name: 'Celebrity Collab', difficulty: 'expert',
    requirements: { overall: 90, fame: 70 }, rewards: { followers: 100000, fame: 35 },
    content: 'Collaborate with a major celebrity for massive reach!'
  }
];

// Relationship system
const DATING_POOL = [
  { name: 'Alex Rivera', profession: 'Model', appeal: 85, fameRequirement: 20 },
  { name: 'Jordan Kim', profession: 'Actress', appeal: 90, fameRequirement: 40 },
  { name: 'Taylor Johnson', profession: 'Musician', appeal: 88, fameRequirement: 35 },
  { name: 'Morgan Davis', profession: 'Entrepreneur', appeal: 82, fameRequirement: 25 },
  { name: 'Casey Brown', profession: 'Athlete', appeal: 87, fameRequirement: 30 }
];

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
  const firstName = custom?.firstName || pick(FIRST_NAMES);
  const lastName = custom?.lastName || pick(LAST_NAMES);
  const age = custom?.age || startingAge();
  const arch = custom?.archetype || pickArchetype();
  const ratings = baseRatings(arch);
  const rookie = rookieContract(ratings.overall);
  const appearance = custom?.appearance || generateAppearance();
  
  return {
    firstName, lastName, age, archetype: arch, ratings, potential: clamp(ratings.overall + irnd(4,15), 70, 99),
    appearance,
    morale: 70, health: 100, peak: 90, fame: 5, followers: irnd(1000, 5000), cash: 50, 
    endorsements: [], shoeDeals: [], premiumServices: [],
    // New life features
    relationships: { girlfriend: null, relationshipLevel: 0 },
    investments: [],
    lifestyleActivities: [],
    socialMediaChallenges: [],
    teamChemistry: irnd(40,75),
    // End new features
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
      championshipYears: [],
      playoffAppearances: 0,
      lastPlayoff: null,
      lastChampionship: null,
      seasonProgress: 0 // Tracks how many games into season
    };
  });
  return { 
    standings, 
    season: 1,
    championshipHistory: {}
  };
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
  
  // Elite players get MASSIVE consistency bonuses and dominance
  const consistencyFactor = p.ratings.overall >= 95 ? 1.8 : // Elite superstars dominate
                           p.ratings.overall >= 90 ? 1.5 : // Stars are very consistent
                           p.ratings.overall >= 85 ? 1.3 : // Great players are consistent  
                           p.ratings.overall >= 80 ? 1.15 : // Good players
                           1.0; // Average players
  
  // Elite skill bonuses - each high skill adds significant performance
  const eliteShootingBonus = p.ratings.shooting >= 95 ? 1.4 : p.ratings.shooting >= 90 ? 1.2 : 1.0;
  const eliteFinishingBonus = p.ratings.finishing >= 95 ? 1.3 : p.ratings.finishing >= 90 ? 1.15 : 1.0;
  const elitePlaymakingBonus = p.ratings.playmaking >= 95 ? 1.35 : p.ratings.playmaking >= 90 ? 1.2 : 1.0;
  
  // Star players get better minutes and usage
  const starMinutesBonus = p.ratings.overall >= 95 ? 8 : p.ratings.overall >= 90 ? 6 : p.ratings.overall >= 85 ? 4 : 0;
  const minsVariance = p.ratings.overall >= 90 ? 3 : p.ratings.overall >= 85 ? 4 : 6; // Much less variance for stars
  const mins = clamp(22 + starMinutesBonus + irnd(-2, minsVariance) + Math.round((p.ratings.overall-70)/4) + Math.round(peakFactor * 4) - Math.round((100-p.health)/20), 12, 42);
  
  // Enhanced usage for elite players - but more realistic
  const usageBase = 0.16 + (p.ratings.overall-60)/100 * 0.18; // More conservative usage
  const starUsageBonus = p.ratings.overall >= 95 ? 0.04 : p.ratings.overall >= 90 ? 0.03 : p.ratings.overall >= 85 ? 0.02 : 0;
  const usage = clamp(usageBase + starUsageBonus + (p.ratings.shooting + p.ratings.finishing + p.ratings.playmaking)/400 * 0.08 + rnd(-0.015, 0.015), 0.15, 0.38);
  
  // More realistic shot attempts for elite players
  const shotsBase = Math.max(4, Math.round(mins * 0.75 * usage)); // Reduced shot rate
  
  // REALISTIC efficiency for elite players - toned down significantly
  let efficiencyMultiplier = 0.88; // Better starting point but not crazy
  
  // Much more realistic elite overall rating scaling
  if (p.ratings.overall >= 98) {
    efficiencyMultiplier += 0.18; // Generational talents but realistic
  } else if (p.ratings.overall >= 95) {
    efficiencyMultiplier += 0.15; // Elite superstars
  } else if (p.ratings.overall >= 92) {
    efficiencyMultiplier += 0.12; // Superstars
  } else if (p.ratings.overall >= 88) {
    efficiencyMultiplier += 0.10; // All-NBA level
  } else if (p.ratings.overall >= 85) {
    efficiencyMultiplier += 0.08; // All-Star level
  } else if (p.ratings.overall >= 80) {
    efficiencyMultiplier += 0.06; // Starter level
  } else if (p.ratings.overall >= 75) {
    efficiencyMultiplier += 0.04; // Role player
  }
  
  // Individual skill mastery bonuses - much more realistic
  const shootingEffect = Math.max(0, (p.ratings.shooting - 75) / 100 * 0.12 * eliteShootingBonus);
  const finishingEffect = Math.max(0, (p.ratings.finishing - 75) / 100 * 0.10 * eliteFinishingBonus);
  const playmakingEffect = Math.max(0, (p.ratings.playmaking - 75) / 100 * 0.08 * elitePlaymakingBonus);
  
  // Elite players handle conditions better
  const conditionPenalty = p.ratings.overall >= 90 ? 0.6 : p.ratings.overall >= 85 ? 0.75 : 1.0;
  efficiencyMultiplier += (peakFactor - 0.5) * 0.15 * conditionPenalty;
  efficiencyMultiplier += (healthFactor - 0.5) * 0.12 * conditionPenalty;
  efficiencyMultiplier += shootingEffect + finishingEffect + playmakingEffect;
  
  // Age effects with superstar longevity
  if (p.age >= 30) {
    const experienceBonus = p.ratings.overall >= 90 ? 0.06 : p.ratings.overall >= 85 ? 0.04 : 0.03;
    efficiencyMultiplier += Math.min(experienceBonus, (p.age - 30) * 0.01);
    const agePenalty = p.ratings.overall >= 95 ? 0.008 : p.ratings.overall >= 90 ? 0.012 : 0.018;
    efficiencyMultiplier -= Math.max(0, (p.age - 33) * agePenalty);
  }
  
  // Apply all bonuses
  const shots = Math.round(shotsBase * Math.max(0.7, efficiencyMultiplier * consistencyFactor));
  
  // Elite three-point shooting and shot selection
  const threeRateBase = 0.28 + Math.max(0, (p.ratings.shooting-70)/100 * 0.25);
  const smartShooting = p.ratings.overall >= 90 ? 0.04 : p.ratings.overall >= 85 ? 0.02 : 0;
  const threeRate = clamp(threeRateBase + smartShooting + rnd(-0.03, 0.03), 0.18, 0.50);
  const threes = Math.round(shots * threeRate);
  const twos = Math.max(0, shots - threes);

  // REALISTIC shooting percentages with reasonable bonuses for high ratings
  const shootingBonus = p.ratings.shooting >= 98 ? 0.08 : 
                       p.ratings.shooting >= 95 ? 0.06 : 
                       p.ratings.shooting >= 92 ? 0.05 : 
                       p.ratings.shooting >= 88 ? 0.04 : 
                       p.ratings.shooting >= 85 ? 0.03 : 
                       p.ratings.shooting >= 80 ? 0.02 : 0;
                       
  const finishingBonus = p.ratings.finishing >= 98 ? 0.06 : 
                        p.ratings.finishing >= 95 ? 0.05 : 
                        p.ratings.finishing >= 92 ? 0.04 : 
                        p.ratings.finishing >= 88 ? 0.03 : 
                        p.ratings.finishing >= 85 ? 0.02 : 
                        p.ratings.finishing >= 80 ? 0.015 : 0;
  
  // Realistic variance - less for elite players but not zero
  const variance = p.ratings.overall >= 95 ? 0.025 : p.ratings.overall >= 90 ? 0.03 : p.ratings.overall >= 85 ? 0.035 : 0.045;
  
  // Realistic shooting percentages - elite but not impossible
  const fg2Pct = clamp(0.46 + (p.ratings.finishing-70)/100 * 0.18 + finishingBonus + (healthFactor-0.5)*0.025 + rnd(-variance, variance), 0.40, 0.62);
  const fg3Pct = clamp(0.34 + (p.ratings.shooting-70)/100 * 0.16 + shootingBonus + (peakFactor-0.5)*0.02 + rnd(-variance, variance), 0.30, 0.48);
  const ftPct  = clamp(0.74 + (p.ratings.shooting-70)/100 * 0.18 + shootingBonus*0.6 + rnd(-0.015, 0.015), 0.68, 0.92);

  const made2 = binomial(twos, fg2Pct);
  const made3 = binomial(threes, fg3Pct);
  const and1  = binomial(made2 + made3, p.ratings.overall >= 90 ? 0.06 : 0.05); // More realistic foul drawing
  const fts   = and1 * 1 + irnd(0, p.ratings.overall >= 85 ? 3 : 2); // More reasonable free throws
  const ftm   = binomial(fts, ftPct);

  // More realistic other stats for elite players
  const playmakingFactor = 0.12 + (p.ratings.playmaking >= 98 ? 0.12 : 
                                  p.ratings.playmaking >= 95 ? 0.10 : 
                                  p.ratings.playmaking >= 90 ? 0.08 : 
                                  p.ratings.playmaking >= 85 ? 0.06 : 
                                  p.ratings.playmaking >= 80 ? 0.04 : 0);
                                  
  const reboundingFactor = 0.18 + (p.ratings.rebounding >= 98 ? 0.14 : 
                                  p.ratings.rebounding >= 95 ? 0.12 : 
                                  p.ratings.rebounding >= 90 ? 0.10 : 
                                  p.ratings.rebounding >= 85 ? 0.08 : 
                                  p.ratings.rebounding >= 80 ? 0.05 : 0);
                                  
  const defenseFactor = 0.025 + (p.ratings.defense >= 98 ? 0.025 : 
                                p.ratings.defense >= 95 ? 0.020 : 
                                p.ratings.defense >= 90 ? 0.016 : 
                                p.ratings.defense >= 85 ? 0.012 : 
                                p.ratings.defense >= 80 ? 0.008 : 0);

  // Apply all multipliers to counting stats - more realistic
  const baseAst = poisson(mins * (p.ratings.playmaking/100) * playmakingFactor);
  const baseReb = poisson(mins * (p.ratings.rebounding/100) * reboundingFactor);
  const baseStl = poisson(mins * (p.ratings.defense/100) * defenseFactor);
  const baseBlk = poisson(mins * (p.ratings.defense/100) * (defenseFactor * 0.8));

  const ast = Math.round(baseAst * ageMultiplier * consistencyFactor);
  const reb = Math.round(baseReb * ageMultiplier * consistencyFactor);
  const stl = Math.round(baseStl * ageMultiplier);
  const blk = Math.round(baseBlk * ageMultiplier);
  const pts = Math.round((made2*2 + made3*3 + ftm) * ageMultiplier * (p.ratings.overall >= 90 ? 1.03 : 1.0)); // Small elite scorer bonus

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
    consistencyFactor: consistencyFactor,
    eliteBonus: {shooting: eliteShootingBonus, finishing: eliteFinishingBonus, playmaking: elitePlaymakingBonus}
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
  if (!s) return { gp: 0, mins: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgPct: 0, tpPct: 0, ftPct: 0, winsPct: 0, improved: false, benchBeast: false, per: 0, ts: 0, usage: 0 };
  
  const gp = Math.max(1, s.games || 0);
  const mins = (s.minutes || 0)/gp;
  const pts = (s.points || 0)/gp;
  const reb = (s.rebounds || 0)/gp;
  const ast = (s.assists || 0)/gp;
  const stl = (s.steals || 0)/gp;
  const blk = (s.blocks || 0)/gp;
  
  const fgPct = (s.fgAtt && s.fgAtt > 0) ? (s.fgMade || 0)/(s.fgAtt) : 0; 
  const tpPct = (s.threesAtt && s.threesAtt > 0) ? (s.threesMade || 0)/(s.threesAtt) : 0; 
  const ftPct = (s.ftAtt && s.ftAtt > 0) ? (s.ftMade || 0)/(s.ftAtt) : 0;
  const winsPct = (s.games && s.games > 0) ? (s.wins || 0)/(s.games) : 0;
  
  const actualGamesPlayed = s.games || 0;
  const improved = actualGamesPlayed > 10 && (pts > 18 || ast > 7 || reb > 10) && chance(0.3);
  const benchBeast = mins < 24 && pts > 14 && chance(0.4);
  
  // Calculate advanced stats averages with safety checks
  const gameLogs = s.gameLogs || [];
  const per = gameLogs.length > 0 ? gameLogs.reduce((sum, log) => sum + ((log && log.per) || 0), 0) / gameLogs.length : 0;
  const ts = gameLogs.length > 0 ? gameLogs.reduce((sum, log) => sum + ((log && log.ts) || 0), 0) / gameLogs.length : 0;
  const usage = gameLogs.length > 0 ? gameLogs.reduce((sum, log) => sum + ((log && log.usage) || 0), 0) / gameLogs.length : 0;
  
  // Ensure no NaN values
  return { 
    gp: actualGamesPlayed, 
    mins: isNaN(mins) ? 0 : mins, 
    pts: isNaN(pts) ? 0 : pts, 
    reb: isNaN(reb) ? 0 : reb, 
    ast: isNaN(ast) ? 0 : ast, 
    stl: isNaN(stl) ? 0 : stl, 
    blk: isNaN(blk) ? 0 : blk, 
    fgPct: isNaN(fgPct) ? 0 : fgPct, 
    tpPct: isNaN(tpPct) ? 0 : tpPct, 
    ftPct: isNaN(ftPct) ? 0 : ftPct, 
    winsPct: isNaN(winsPct) ? 0 : winsPct, 
    improved, 
    benchBeast, 
    per: isNaN(per) ? 0 : per, 
    ts: isNaN(ts) ? 0 : ts, 
    usage: isNaN(usage) ? 0 : usage 
  };
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
  
  // Validate money integrity regularly
  useEffect(() => {
    if (game && (isNaN(game.cash) || game.cash < 0)) {
      console.warn('Money validation: Correcting invalid cash value:', game.cash);
      setGame(prev => ({ ...prev, cash: 0 }));
    }
  }, [game?.cash]);
  
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
  
  // Handle avatar appearance changes
  function handleAppearanceChange(newAppearance) {
    setGame(prev => ({
      ...prev,
      appearance: newAppearance
    }));
    pushToast("Avatar updated!");
  }

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
        
        // More balanced training gains that reward progress but aren't too easy
        let baseBoost = 0.18 + rnd(0, 0.28); // 0.18-0.46 base (slightly easier)
        
        // Age penalty for training - more gradual
        if (p.age >= 25) baseBoost *= 0.96;
        if (p.age >= 28) baseBoost *= 0.92;
        if (p.age >= 30) baseBoost *= 0.87;
        if (p.age >= 33) baseBoost *= 0.82;
        
        // Slightly easier skill level scaling - high-rated players can still improve
        trainMap[type].forEach(skill => {
          let skillBoost = baseBoost * intensity;
          const currentRating = p.ratings[skill];
          
          // More forgiving diminishing returns curve
          if (currentRating >= 95) skillBoost *= 0.45; // Still very hard but slightly easier
          else if (currentRating >= 90) skillBoost *= 0.55; // Hard but more manageable
          else if (currentRating >= 85) skillBoost *= 0.70; // Moderate difficulty
          else if (currentRating >= 80) skillBoost *= 0.80; // Easier
          else if (currentRating >= 75) skillBoost *= 0.90; // Much easier
          else if (currentRating >= 70) skillBoost *= 0.95; // Even easier
          // Below 70 gets full boost - easy to improve weak skills
          
          // Training effectiveness based on peak condition
          skillBoost *= (p.peak / 100);
          
          // Better success/failure odds with more frequent good sessions
          if (chance(0.25)) skillBoost *= 1.8; // Great session (increased chance)
          else if (chance(0.08)) skillBoost *= 0.6; // Poor session (decreased chance)
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
      
      // Ensure cash is valid before checking/spending
      if (isNaN(p.cash)) p.cash = 0;
      
      if(p.cash >= cost){
        p.cash -= cost;
        // Ensure cash doesn't become NaN after subtraction
        if (isNaN(p.cash)) p.cash = 0;
        
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
      const validValue = isNaN(value) ? 0 : Math.max(0, value);
      
      // Ensure cash is valid before adding
      if (isNaN(p.cash)) p.cash = 0;
      p.cash += validValue;
      if (isNaN(p.cash)) p.cash = 0;
      
      p.endorsements.push({ name: offer.name, value: validValue });
      p.career.timeline.push(event("Endorsement", `Signed with ${offer.name} for $${validValue}k`));
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
      const validValue = isNaN(value) ? 0 : Math.max(0, value);
      
      // Ensure cash is valid before adding
      if (isNaN(p.cash)) p.cash = 0;
      p.cash += validValue;
      if (isNaN(p.cash)) p.cash = 0;
      
      p.shoeDeals.push({ name: offer.name, value: validValue, years: irnd(2,5) });
      p.career.timeline.push(event("Shoe Deal", `Signed with ${offer.name} for $${validValue}k`));
      return p;
    });
  }

  function buyPremiumService(service){
    setGame(prev=>{
      const p = deepClone(prev);
      
      // Ensure cash is valid before checking/spending
      if (isNaN(p.cash)) p.cash = 0;
      
      if(p.cash >= service.cost && !p.premiumServices.find(s => s.name === service.name)){
        p.cash -= service.cost;
        // Ensure cash doesn't become NaN after subtraction
        if (isNaN(p.cash)) p.cash = 0;
        
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

  // New Life Activity Functions
  function actLifestyle(activityId) {
    setGame(prev => {
      const p = deepClone(prev);
      const activity = LIFE_ACTIVITIES.find(a => a.id === activityId);
      
      if (!activity) {
        pushToast("Activity not found");
        return p;
      }
      
      // Ensure cash is valid before checking
      if (isNaN(p.cash)) p.cash = 0;
      
      if (p.cash < activity.cost) {
        pushToast(`Need ${formatMoney(activity.cost)} for ${activity.name}`);
        return p;
      }
      
      // Apply activity effects
      p.cash -= activity.cost;
      // Ensure cash doesn't become NaN after subtraction
      if (isNaN(p.cash)) p.cash = 0;
      
      if (activity.moraleBoost) p.morale = clamp(p.morale + activity.moraleBoost, 0, 100);
      if (activity.fameBoost) p.fame = clamp(p.fame + activity.fameBoost, 0, 100);
      if (activity.followersBoost) p.followers += activity.followersBoost;
      if (activity.peakBoost) p.peak = clamp(p.peak + activity.peakBoost, 0, 100);
      if (activity.netWorthBoost) {
        const validBoost = isNaN(activity.netWorthBoost) ? 0 : activity.netWorthBoost;
        p.cash += validBoost;
        if (isNaN(p.cash)) p.cash = 0;
      }
      
      // Special dating logic
      if (activityId === 'dating') {
        const availablePartners = DATING_POOL.filter(partner => p.fame >= partner.fameRequirement);
        if (availablePartners.length > 0 && !p.relationships.girlfriend) {
          if (chance(0.3)) { // 30% chance to find girlfriend
            p.relationships.girlfriend = pick(availablePartners);
            p.relationships.relationshipLevel = 20;
            pushToast(`Started dating ${p.relationships.girlfriend.name}!`);
          }
        } else if (p.relationships.girlfriend) {
          p.relationships.relationshipLevel = Math.min(100, p.relationships.relationshipLevel + 10);
          if (p.relationships.relationshipLevel >= 80 && chance(0.1)) {
            pushToast(`${p.relationships.girlfriend.name} wants to get married!`);
          }
        }
      }
      
      p.career.timeline.push(event("Lifestyle", `${activity.name} - ${formatMoney(activity.cost)}`));
      pushToast(`${activity.name} completed!`);
      return p;
    });
  }

  function makeInvestment(investmentId) {
    setGame(prev => {
      const p = deepClone(prev);
      const investment = INVESTMENT_OPTIONS.find(i => i.id === investmentId);
      
      if (!investment) {
        pushToast("Investment not found");
        return p;
      }
      
      // Ensure cash is valid before checking
      if (isNaN(p.cash)) p.cash = 0;
      
      if (p.cash < investment.cost) {
        pushToast(`Need ${formatMoney(investment.cost)} for ${investment.name}`);
        return p;
      }
      
      // Check if already invested
      if (p.investments.find(inv => inv.id === investmentId)) {
        pushToast("Already invested in this option");
        return p;
      }
      
      p.cash -= investment.cost;
      // Ensure cash doesn't become NaN after subtraction
      if (isNaN(p.cash)) p.cash = 0;
      p.investments.push({
        ...investment,
        startWeek: p.week,
        startSeason: p.season,
        totalValue: investment.cost,
        active: true
      });
      
      p.career.timeline.push(event("Investment", `Invested ${formatMoney(investment.cost)} in ${investment.name}`));
      pushToast(`Invested in ${investment.name}!`);
      return p;
    });
  }

  function attemptSocialMediaChallenge(challengeId) {
    setGame(prev => {
      const p = deepClone(prev);
      const challenge = SOCIAL_MEDIA_CHALLENGES.find(c => c.id === challengeId);
      
      if (!challenge) {
        pushToast("Challenge not found");
        return p;
      }
      
      // Check if already completed
      if (p.socialMediaChallenges.includes(challengeId)) {
        pushToast("Challenge already completed");
        return p;
      }
      
      // Check requirements
      let canAttempt = true;
      if (challenge.requirements.overall && p.ratings.overall < challenge.requirements.overall) {
        pushToast(`Need ${challenge.requirements.overall} overall rating`);
        canAttempt = false;
      }
      if (challenge.requirements.fame && p.fame < challenge.requirements.fame) {
        pushToast(`Need ${challenge.requirements.fame} fame`);
        canAttempt = false;
      }
      if (challenge.requirements.skillRating) {
        const maxSkill = Math.max(p.ratings.shooting, p.ratings.finishing, p.ratings.playmaking, p.ratings.defense, p.ratings.rebounding);
        if (maxSkill < challenge.requirements.skillRating) {
          pushToast(`Need ${challenge.requirements.skillRating} in any skill`);
          canAttempt = false;
        }
      }
      
      if (!canAttempt) return p;
      
      // Calculate success rate
      let successRate = 0.6; // Base 60%
      if (challenge.difficulty === 'easy') successRate = 0.8;
      else if (challenge.difficulty === 'medium') successRate = 0.7;
      else if (challenge.difficulty === 'hard') successRate = 0.5;
      else if (challenge.difficulty === 'expert') successRate = 0.3;
      
      // Adjust for player rating
      successRate += (p.ratings.overall - 75) / 100;
      successRate = Math.max(0.1, Math.min(0.9, successRate));
      
      if (chance(successRate)) {
        // Success!
        p.socialMediaChallenges.push(challengeId);
        p.followers += challenge.rewards.followers;
        if (challenge.rewards.fame) p.fame = clamp(p.fame + challenge.rewards.fame, 0, 100);
        if (challenge.rewards.morale) p.morale = clamp(p.morale + challenge.rewards.morale, 0, 100);
        
        p.career.timeline.push(event("Social Media", `Completed ${challenge.name} challenge!`));
        pushToast(`Challenge completed! +${challenge.rewards.followers.toLocaleString()} followers`);
      } else {
        // Failure
        pushToast(`Challenge failed - try again when you're better`);
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
        
        // Ensure game state is properly initialized for new season
        if (!p.stats) p.stats = resetSeasonStats();
        if (!p.ratings) p.ratings = { overall: 75 }; // fallback
        if (!p.career) p.career = { seasons: [], awards: [], timeline: [], totals: resetCareerTotals() };
        if (!p.team) p.team = "LAL"; // fallback team
        if (!p.firstName || !p.lastName) {
          p.firstName = "Player";
          p.lastName = "Name";
        }
        
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
    
    // Handle championship and Finals MVP awards with winner tracking
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
      
      // Track championship winner for the season
      CHAMPIONSHIP_WINNERS[p.season] = {
        team: p.team,
        teamName: NBA_TEAMS[p.team]?.name || p.team,
        player: `${p.firstName} ${p.lastName}`,
        isPlayerTeam: true
      };
      
      // Update league standings with championship
      if (p.league && p.league.standings && p.league.standings[p.team]) {
        p.league.standings[p.team].championships++;
        p.league.standings[p.team].championshipYears.push(p.season);
        p.league.standings[p.team].lastChampionship = p.season;
      }
      
      // Add to league championship history
      if (!p.league.championshipHistory) p.league.championshipHistory = {};
      p.league.championshipHistory[p.season] = {
        team: p.team,
        teamName: NBA_TEAMS[p.team]?.name || p.team,
        player: `${p.firstName} ${p.lastName}`,
        isPlayerTeam: true
      };
    } else {
      // Player's team didn't win - generate a champion
      if (!CHAMPIONSHIP_WINNERS[p.season]) {
        const possibleChampions = Object.keys(NBA_TEAMS).filter(team => team !== p.team);
        const championTeam = pick(possibleChampions);
        const championTeamName = NBA_TEAMS[championTeam]?.name || championTeam;
        
        CHAMPIONSHIP_WINNERS[p.season] = {
          team: championTeam,
          teamName: championTeamName,
          player: null,
          isPlayerTeam: false
        };
        
        // Update league standings with championship
        if (p.league && p.league.standings && p.league.standings[championTeam]) {
          p.league.standings[championTeam].championships++;
          if (!p.league.standings[championTeam].championshipYears) {
            p.league.standings[championTeam].championshipYears = [];
          }
          p.league.standings[championTeam].championshipYears.push(p.season);
          p.league.standings[championTeam].lastChampionship = p.season;
        }
        
        // Add to league championship history
        if (!p.league.championshipHistory) p.league.championshipHistory = {};
        p.league.championshipHistory[p.season] = {
          team: championTeam,
          teamName: championTeamName,
          player: null,
          isPlayerTeam: false
        };
      }
    }

    // Show awards popup if there are any awards
    if(allAwards.length > 0) {
      setTimeout(() => {
        showAwardsPopup(allAwards, p.season, p.stats.champion, p.stats.finalsMVP);
      }, 500);
    }

    // Pay contract salary for the season - with NaN protection
    const seasonSalary = Math.round((p.contract.salary || 0) / (p.contract.years || 1));
    const validSeasonSalary = isNaN(seasonSalary) ? 0 : seasonSalary;
    p.cash = (p.cash || 0) + validSeasonSalary;
    
    // Ensure cash never becomes NaN or negative from operations
    if (isNaN(p.cash) || p.cash < 0) p.cash = 0;
    
    p.career.timeline.push(event("Contract", `Received $${validSeasonSalary}k salary payment.`));

    // Pay endorsement money - with protection
    p.endorsements.forEach(e => {
      const endorsementValue = isNaN(e.value) ? 0 : (e.value || 0);
      p.cash += endorsementValue;
      if (isNaN(p.cash)) p.cash = 0;
      p.career.timeline.push(event("Endorsement", `Received $${endorsementValue}k from ${e.name}.`));
    });

    // Pay shoe deal money - with protection
    p.shoeDeals.forEach(e => {
      const shoeValue = isNaN(e.value) ? 0 : (e.value || 0);
      p.cash += shoeValue;
      if (isNaN(p.cash)) p.cash = 0;
      p.career.timeline.push(event("Shoe Deal", `Received $${shoeValue}k from ${e.name}.`));
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

    // endorsements payouts - with NaN protection
    const validEndorsements = p.endorsements.filter(e => e && typeof e.value === 'number' && !isNaN(e.value));
    const validShoeDeals = p.shoeDeals.filter(e => e && typeof e.value === 'number' && !isNaN(e.value));
    
    const endorsementPayout = Math.round(sum(validEndorsements.map(e=>e.value)) * (0.6 + rnd(-0.1, 0.2)));
    const shoePayout = Math.round(sum(validShoeDeals.map(e=>e.value)) * (0.8 + rnd(-0.1, 0.2)));
    const totalPayout = (isNaN(endorsementPayout) ? 0 : endorsementPayout) + (isNaN(shoePayout) ? 0 : shoePayout);
    
    // Ensure cash is valid before adding
    if (isNaN(p.cash)) p.cash = 0;
    p.cash += totalPayout; 
    if (isNaN(p.cash)) p.cash = 0; // Double check after addition
    
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
      p.retired = true; 
      p.alive = true; 
      p.phase = "Retired";
      
      // Calculate final career stats and Hall of Fame probability
      const hofOdds = hallOfFameOdds(p);
      const hofPercentage = Math.round(hofOdds * 100);
      
      // Store retirement info for ceremony
      p.retirementCelebration = {
        finalSeason: p.season,
        finalTeam: p.team,
        careerStats: deepClone(p.career.totals),
        awards: deepClone(p.career.awards),
        hofEligible: true,
        hofOdds: hofOdds,
        hofPercentage: hofPercentage,
        ceremonyShown: false
      };
      
      // Initialize post-retirement features
      p.postRetirement = {
        phase: 'celebration', // celebration -> hof_voting -> management
        ownedTeams: [],
        managedTeam: null,
        coachingExperience: 0,
        businessVentures: [],
        trainingAcademy: null,
        reputation: Math.round(p.fame * 0.8), // Starting management reputation
        availablePositions: []
      };
      
      p.career.timeline.push(event("Retired","You have announced your retirement."));
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

  // Post-Retirement Functions
  function proceedToHallOfFameVoting(){
    setGame(prev=>{
      const p = deepClone(prev);
      
      // Simulate Hall of Fame voting
      const hofOdds = p.retirementCelebration.hofOdds;
      const randomRoll = Math.random();
      const inducted = randomRoll < hofOdds;
      
      p.retirementCelebration.hofResult = {
        inducted: inducted,
        votingPercentage: Math.round((randomRoll + hofOdds) / 2 * 100), // Simulated voting %
        yearInducted: p.season + 3, // HoF typically 3 years after retirement
        rank: inducted ? calculateHofRanking(p) : null
      };
      
      p.postRetirement.phase = 'hof_result';
      
      if (inducted) {
        p.career.timeline.push(event("Hall of Fame", `Inducted into Basketball Hall of Fame!`));
        pushToast("🏆 HALL OF FAME INDUCTEE! 🏆");
      } else {
        p.career.timeline.push(event("Hall of Fame", `Not selected for Hall of Fame this year.`));
        pushToast("Hall of Fame voting results announced");
      }
      
      return p;
    });
  }
  
  function calculateHofRanking(player) {
    // Simplified ranking system - in reality this would compare against historical greats
    const totalScore = (player.career.totals.points || 0) + 
                       (player.career.totals.mvps || 0) * 5000 + 
                       (player.career.totals.titles || 0) * 3000 +
                       (player.career.totals.finalsMVPs || 0) * 4000;
    
    if (totalScore > 50000) return Math.floor(Math.random() * 3) + 1; // Top 3
    if (totalScore > 35000) return Math.floor(Math.random() * 5) + 3; // Top 3-8
    if (totalScore > 25000) return Math.floor(Math.random() * 5) + 6; // Top 6-10
    return Math.floor(Math.random() * 10) + 11; // Outside top 10
  }
  
  function enterManagementPhase(){
    setGame(prev=>{
      const p = deepClone(prev);
      p.postRetirement.phase = 'management';
      
      // Generate available management opportunities
      p.postRetirement.availablePositions = generateManagementOpportunities(p);
      
      pushToast("Welcome to your post-playing career!");
      return p;
    });
  }
  
  function generateManagementOpportunities(player) {
    const opportunities = [];
    const reputation = player.postRetirement.reputation;
    
    // Coaching opportunities
    if (reputation > 60) {
      opportunities.push({
        type: 'head_coach',
        team: pick(TEAMS),
        salary: Math.round(reputation * 0.5 + Math.random() * 20),
        requirements: { reputation: 60, experience: 0 }
      });
    }
    
    if (reputation > 40) {
      opportunities.push({
        type: 'assistant_coach',
        team: pick(TEAMS),
        salary: Math.round(reputation * 0.3 + Math.random() * 10),
        requirements: { reputation: 40, experience: 0 }
      });
    }
    
    // Front office opportunities
    if (reputation > 70) {
      opportunities.push({
        type: 'general_manager',
        team: pick(TEAMS),
        salary: Math.round(reputation * 0.8 + Math.random() * 30),
        requirements: { reputation: 70, experience: 2 }
      });
    }
    
    // Team ownership (if enough money)
    if (player.cash > 1000) { // Need at least $1B (1000k in game money)
      opportunities.push({
        type: 'team_purchase',
        team: pick(TEAMS),
        cost: Math.round(800 + Math.random() * 400), // $800M-$1.2B
        requirements: { cash: 800 }
      });
    }
    
    return opportunities;
  }
  
  function acceptManagementPosition(position) {
    setGame(prev=>{
      const p = deepClone(prev);
      
      if (position.type === 'team_purchase') {
        if (p.cash >= position.cost) {
          p.cash -= position.cost;
          p.postRetirement.ownedTeams.push({
            team: position.team,
            purchasePrice: position.cost,
            currentValue: position.cost,
            season: p.season
          });
          p.career.timeline.push(event("Business", `Purchased ${position.team} for $${position.cost}k`));
          pushToast(`🏢 You now own the ${position.team}!`);
        } else {
          pushToast("Not enough money to purchase team");
          return p;
        }
      } else {
        p.postRetirement.managedTeam = {
          team: position.team,
          role: position.type,
          salary: position.salary,
          startSeason: p.season,
          record: { wins: 0, losses: 0 }
        };
        p.career.timeline.push(event("Management", `Accepted ${position.type} position with ${position.team}`));
        pushToast(`🏀 Welcome to the ${position.team} front office!`);
      }
      
      // Remove accepted position from available
      p.postRetirement.availablePositions = p.postRetirement.availablePositions.filter(pos => pos !== position);
      
      return p;
    });
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
  const avg = useMemo(()=> {
    if (!game || !game.stats) {
      return { gp: 0, mins: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgPct: 0, tpPct: 0, ftPct: 0, winsPct: 0, improved: false, benchBeast: false, per: 0, ts: 0, usage: 0 };
    }
    return seasonAverages(game.stats);
  }, [game?.stats]);
  
  const careerPPG = (game?.career?.totals?.games && game.career.totals.games > 0) ? game.career.totals.points / game.career.totals.games : 0;

  // Ensure game state is valid before rendering
  if (!game || !game.firstName || !game.lastName) {
    return <div className="fade-in">Loading...</div>;
  }

  return (
    <div className="fade-in">
      {!game.retired ? (
        <>
          <Header 
            game={game} 
            onReset={resetAll} 
            onExport={exportSave} 
            onImport={()=>setShowImport(true)} 
            onRetire={retireNow}
            onAppearanceChange={handleAppearanceChange}
          />
          <Tabs current={tab} onSelect={setTab} tabs={["Home","Training","Health","Life","Social","Team","Contracts","Awards","History","Analytics","League"]} />
          
          {tab==="Home" && (
            <HomePanel game={game} avg={avg} onWeek={playNextWeek} onEvent={randomLifeEvent} onSocialMedia={postSocialMedia} onSimMonth={simMonth} onSimSeason={simSeason} />
          )}
        </>
      ) : (
        <>
          <RetirementHeader game={game} onReset={resetAll} onExport={exportSave} onImport={()=>setShowImport(true)} />
          
          {game.postRetirement?.phase === 'celebration' && (
            <RetirementCelebrationPanel 
              game={game} 
              onProceedToHoF={proceedToHallOfFameVoting}
            />
          )}
          
          {game.postRetirement?.phase === 'hof_result' && (
            <HallOfFameResultPanel 
              game={game} 
              onEnterManagement={enterManagementPhase}
            />
          )}
          
          {game.postRetirement?.phase === 'management' && (
            <>
              <ManagementTabs current={tab} onSelect={setTab} tabs={["Overview","Opportunities","Teams","Business","Legacy"]} />
              
              {tab==="Overview" && (
                <ManagementOverviewPanel game={game} />
              )}
              
              {tab==="Opportunities" && (
                <ManagementOpportunitiesPanel 
                  game={game} 
                  onAcceptPosition={acceptManagementPosition}
                />
              )}
              
              {tab==="Teams" && (
                <TeamManagementPanel game={game} />
              )}
              
              {tab==="Business" && (
                <BusinessPanel game={game} />
              )}
              
              {tab==="Legacy" && (
                <LegacyPanel game={game} />
              )}
            </>
          )}
        </>
      )}

      {!game.retired && tab==="Training" && (
        <TrainingPanel game={game} onTrain={actTrain} onEndorse={takeEndorsement} onShoeEndorse={takeShoeEndorsement} 
                       onPremium={buyPremiumService} endorsements={game.endorsements} shoeDeals={game.shoeDeals} 
                       premiumServices={game.premiumServices} cash={game.cash} />
      )}

      {!game.retired && tab==="Health" && (
        <HealthPanel onHealth={actHealth} cash={game.cash} health={game.health} peak={game.peak} />
      )}

      {!game.retired && tab==="Life" && (
        <LifePanel game={game} onLifestyle={actLifestyle} onInvestment={makeInvestment} />
      )}

      {!game.retired && tab==="Social" && (
        <SocialPanel game={game} onChallenge={attemptSocialMediaChallenge} />
      )}

      {!game.retired && tab==="Team" && (
        <TeamPanel game={game} avg={avg} onTrade={requestTrade} onContract={requestContract} />
      )}

      {!game.retired && tab==="Contracts" && (
        <ContractsPanel game={game} />
      )}

      {!game.retired && tab==="Awards" && (
        <AwardsPanel game={game} />
      )}

      {!game.retired && tab==="History" && (
        <HistoryPanel game={game} hof={hallOfFameOdds(game)} />
      )}

      {!game.retired && tab==="Analytics" && (
        <AnalyticsPanel game={game} />
      )}

      {!game.retired && tab==="League" && (
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

// Simple profile picture component
// ---------- Subcomponents ----------
function Header({ game, onReset, onExport, onImport, onRetire, onAppearanceChange }){
  const [showProfileChanger, setShowProfileChanger] = useState(false);
  const teamInfo = NBA_TEAMS[game.team];
  const teamName = teamInfo ? teamInfo.name : game.team;
  
  const handleAppearanceChange = (newAppearance) => {
    onAppearanceChange(newAppearance);
  };
  
  return (
    <>
      <div className="header">
        <div className="header-content">
          <div className="player-info">
            <div 
              className="player-avatar" 
              onClick={() => setShowProfileChanger(true)}
              style={{ 
                cursor: 'pointer',
                position: 'relative',
                padding: 0,
                borderRadius: '50%',
                overflow: 'visible'
              }}
              title="Click to customize avatar"
            >
              <Avatar 
                appearance={game.appearance || generateAppearance()} 
                size={64} 
              />
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--team-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                border: '2px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                ✏️
              </div>
            </div>
            <div className="player-details">
              <h1>{game.firstName} {game.lastName}</h1>
              <div className="player-meta">
                <span>{teamName}</span>
                <span>#{game.jersey}</span>
                <span>{game.archetype}</span>
                <span>{game.ratings.overall} OVR</span>
                <span>{formatMoney(game.cash)}</span>
                {game.relationships?.girlfriend && (
                  <span style={{ color: 'var(--team-secondary)' }}>
                    💕 {game.relationships.girlfriend.name}
                  </span>
                )}
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
      
      {showProfileChanger && (
        <ProfilePictureChanger
          currentAppearance={game.appearance || generateAppearance()}
          onAppearanceChange={handleAppearanceChange}
          onClose={() => setShowProfileChanger(false)}
        />
      )}
    </>
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
  // Safety checks to prevent rendering issues
  if (!game || !avg) {
    return <div className="panel panel-content">Loading game data...</div>;
  }
  
  const teamInfo = NBA_TEAMS[game.team] || { name: game.team, strength: game.teamStrength || 75, colors: { primary: '#1f2937' } };
  
  // Get current team standing from persistent standings with safety check
  let teamRank = 1;
  try {
    const standings = getStandings(game);
    teamRank = standings.findIndex(team => team.isPlayerTeam) + 1 || 1;
  } catch (e) {
    console.warn('Error getting standings:', e);
  }
  
  const ageMultiplier = getAgeMultiplier(game.age || 22);
  
  return (
    <div className="grid-2" style={{gap: '12px'}}>
      {/* Player Stats - Left Column */}
      <div>
        {/* Quick Stats Grid */}
        <div className="stats-grid">
          <div className="compact-stat">
            <div className="compact-stat-label">Overall</div>
            <div className="compact-stat-value">{game.ratings?.overall || 75}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Age</div>
            <div className="compact-stat-value" style={{color: (game.age || 22) <= 26 ? '#10b981' : (game.age || 22) <= 30 ? '#f59e0b' : '#ef4444'}}>{game.age || 22}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Performance</div>
            <div className="compact-stat-value" style={{color: ageMultiplier >= 1.1 ? '#10b981' : ageMultiplier >= 0.9 ? '#f59e0b' : '#ef4444'}}>{(ageMultiplier * 100).toFixed(0)}%</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Health</div>
            <div className="compact-stat-value">{game.health || 100}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Peak</div>
            <div className="compact-stat-value">{game.peak || 100}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Morale</div>
            <div className="compact-stat-value">{game.morale || 50}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Fame</div>
            <div className="compact-stat-value">{game.fame || 0}</div>
          </div>
          <div className="compact-stat">
            <div className="compact-stat-label">Chemistry</div>
            <div className="compact-stat-value">{game.teamChem || 50}</div>
          </div>
        </div>
        
        {/* Season Stats */}
        <div className="panel panel-content-tight" style={{marginBottom: '12px'}}>
          <h3 style={{marginBottom: '8px', color: 'var(--team-primary)'}}>Season {game.season || 1} Stats</h3>
          <div className="grid-4">
            <div className="compact-stat">
              <div className="compact-stat-label">PPG</div>
              <div className="compact-stat-value">{(avg.pts || 0).toFixed(1)}</div>
            </div>
            <div className="compact-stat">
              <div className="compact-stat-label">RPG</div>
              <div className="compact-stat-value">{(avg.reb || 0).toFixed(1)}</div>
            </div>
            <div className="compact-stat">
              <div className="compact-stat-label">APG</div>
              <div className="compact-stat-value">{(avg.ast || 0).toFixed(1)}</div>
            </div>
            <div className="compact-stat">
              <div className="compact-stat-label">FG%</div>
              <div className="compact-stat-value">{((avg.fgPct || 0)*100).toFixed(0)}%</div>
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
            <button className="btn btn-ghost" style={{fontSize: '11px'}}>📱 {((game.followers || 0) / 1000000).toFixed(1)}M</button>
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
              ${(game.contract?.salary || 0)}k/year
            </div>
            <div style={{fontSize: '14px', color: 'var(--text-secondary)'}}>
              Year {game.contract?.year || 1} of {game.contract?.years || 1}
            </div>
            {game.contract?.clause && game.contract.clause !== "None" && (
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
  const careerRPG = seasons.map(s => s.averages?.reb || 0);
  const careerAPG = seasons.map(s => s.averages?.ast || 0);
  const careerPER = seasons.map(s => s.averages?.per || 0);
  const careerTS = seasons.map(s => s.averages?.ts || 0);
  const careerWS = seasons.map(s => s.averages?.winShares || (s.averages?.pts || 0) * 0.1);
  const careerVORP = seasons.map(s => s.averages?.vorp || (s.averages?.per || 0) * 0.5 - 5);
  
  // Enhanced Legacy Score Calculation with more award factors
  const calculateEnhancedLegacyScore = (player) => {
    const totals = player.career?.totals || {};
    const stats = player.career?.stats || {};
    
    // Base statistical score (0-300 points)
    const careerPPG = stats.ppg || 0;
    const careerRPG = stats.rpg || 0;
    const careerAPG = stats.apg || 0;
    const careerPER = stats.per || 0;
    const careerTS = stats.ts || 0;
    const gamesPlayed = totals.games || 0;
    
    let baseScore = 0;
    baseScore += Math.min(careerPPG * 8, 200); // Max 200 for scoring
    baseScore += Math.min(careerRPG * 6, 60); // Max 60 for rebounding
    baseScore += Math.min(careerAPG * 8, 80); // Max 80 for assists
    baseScore += Math.min((careerPER - 15) * 10, 100); // Max 100 for efficiency
    baseScore += Math.min(careerTS * 200, 100); // Max 100 for shooting
    baseScore += Math.min(gamesPlayed / 82 * 10, 150); // Max 150 for longevity
    
    // Major Awards (0-400 points)
    let awardScore = 0;
    awardScore += (totals.titles || 0) * 60; // Championships: 60 pts each
    awardScore += (totals.mvps || 0) * 80; // MVP: 80 pts each
    awardScore += (totals.finalsMvps || 0) * 50; // Finals MVP: 50 pts each
    awardScore += (totals.dpoys || 0) * 30; // DPOY: 30 pts each
    awardScore += (totals.sixthMans || 0) * 15; // 6MOY: 15 pts each
    awardScore += (totals.roys || 0) * 25; // ROY: 25 pts each
    awardScore += (totals.mips || 0) * 20; // MIP: 20 pts each
    
    // All-Star and honors (0-200 points)
    let honorScore = 0;
    honorScore += (totals.allStars || 0) * 8; // All-Star: 8 pts each
    honorScore += (totals.allNBAs || 0) * 12; // All-NBA: 12 pts each
    honorScore += (totals.allDefenses || 0) * 10; // All-Defense: 10 pts each
    honorScore += (totals.scoringTitles || 0) * 15; // Scoring titles: 15 pts each
    honorScore += (totals.reboundingTitles || 0) * 12; // Rebounding titles: 12 pts each
    honorScore += (totals.assistTitles || 0) * 12; // Assist titles: 12 pts each
    
    // Peak performance bonus (0-100 points)
    let peakScore = 0;
    const bestSeason = seasons.reduce((best, season) => {
      const seasonScore = (season.averages?.pts || 0) + (season.averages?.reb || 0) + (season.averages?.ast || 0);
      return seasonScore > best.score ? { score: seasonScore, season } : best;
    }, { score: 0, season: null });
    
    if (bestSeason.season) {
      peakScore += Math.min(bestSeason.score * 2, 100);
    }
    
    return Math.round(Math.max(0, baseScore + awardScore + honorScore + peakScore));
  };
  
  // Enhanced ranking designation system
  const getPrestigiousDesignation = (rank, legacyScore) => {
    if (rank <= 1) return { title: "GOAT", color: "#FFD700", tier: "Legendary" };
    if (rank <= 3) return { title: "Top 3 All-Time", color: "#FFD700", tier: "Legendary" };
    if (rank <= 5) return { title: "Top 5 All-Time", color: "#C0C0C0", tier: "Legendary" };
    if (rank <= 10) return { title: `#${rank} All-Time`, color: "#CD7F32", tier: "Elite" };
    if (rank <= 15) return { title: "Top 15", color: "#8A2BE2", tier: "Elite" };
    if (rank <= 25) return { title: "Top 25", color: "#FF6347", tier: "Elite" };
    if (rank <= 50) return { title: "Top 50", color: "#32CD32", tier: "Great" };
    if (rank <= 100) return { title: "Top 100", color: "#1E90FF", tier: "Great" };
    if (rank <= 200) return { title: "Top 200", color: "#9370DB", tier: "Very Good" };
    if (rank <= 300) return { title: "Top 300", color: "#20B2AA", tier: "Good" };
    if (rank <= 400) return { title: "Top 400", color: "#FFA500", tier: "Solid" };
    if (rank <= 500) return { title: "Top 500", color: "#DC143C", tier: "Respectable" };
    return { title: "Unranked", color: "#696969", tier: "Developing" };
  };
  
  // Calculate enhanced analytics
  const playerScore = calculateEnhancedLegacyScore(game);
  const hofChance = getHallOfFameChance(game);
  const currentRankings = generateCurrentLeagueRankings(game);
  const allTimeRankings = generateAllTimeRankings(game);
  
  const playerCurrentRank = currentRankings.find(p => p.isPlayer)?.rank || "N/A";
  const playerAllTimeRank = allTimeRankings.find(p => p.isPlayer)?.rank || 999;
  const designation = getPrestigiousDesignation(playerAllTimeRank, playerScore);
  
  // Generate MVP winners during player's career
  const generateMVPHistory = () => {
    const mvpWinners = [];
    seasons.forEach((season, index) => {
      if (season.stats?.mvp) {
        mvpWinners.push({
          season: season.season,
          playerName: game.name,
          stats: `${fmt(season.averages?.pts || 0)}/${fmt(season.averages?.reb || 0)}/${fmt(season.averages?.ast || 0)}`,
          team: season.team,
          isPlayer: true
        });
      } else {
        // Generate random MVP winner for that season
        const mvpNames = ["LeBron James", "Stephen Curry", "Giannis Antetokounmpo", "Nikola Jokic", "Joel Embiid", "Luka Doncic", "Jayson Tatum", "Kevin Durant"];
        mvpWinners.push({
          season: season.season,
          playerName: pick(mvpNames),
          stats: `${irnd(25, 35)}/${irnd(8, 15)}/${irnd(6, 12)}`,
          team: pick(Object.keys(NBA_TEAMS)),
          isPlayer: false
        });
      }
    });
    return mvpWinners.slice(-10); // Last 10 seasons
  };
  
  const mvpHistory = generateMVPHistory();
  
  // Career trajectory data points
  const trajectoryData = seasons.map((season, index) => ({
    season: season.season,
    overallRating: season.overall || 70,
    ppg: season.averages?.pts || 0,
    per: season.averages?.per || 0,
    winShares: season.averages?.winShares || 0,
    vorp: season.averages?.vorp || 0,
    age: (game.age || 20) - seasons.length + index + 1
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
      
      {/* Enhanced Legacy & Designation */}
      <div className="panel">
        <h3 style={{marginBottom: '16px', color: 'var(--team-primary)', textAlign: 'center'}}>Legacy Analysis</h3>
        
        {seasons.length > 0 ? (
          <div style={{gap: '16px', display: 'flex', flexDirection: 'column'}}>
            {/* Prestigious Designation */}
            <div style={{
              background: `linear-gradient(135deg, ${designation.color}22, ${designation.color}11)`,
              border: `2px solid ${designation.color}44`,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '11px', color: designation.color, opacity: '0.9', fontWeight: '700', letterSpacing: '1px'}}>
                {designation.tier.toUpperCase()} TIER
              </div>
              <div style={{fontSize: '28px', fontWeight: 'bold', color: designation.color, margin: '8px 0'}}>
                {designation.title}
              </div>
              <div style={{fontSize: '13px', color: 'var(--text-secondary)', opacity: '0.9'}}>
                NBA All-Time Ranking
              </div>
            </div>
            
            {/* Enhanced Legacy Score */}
            <div style={{
              background: 'linear-gradient(135deg, var(--team-primary), var(--team-secondary))',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '12px', color: 'white', opacity: '0.9', fontWeight: '600', letterSpacing: '1px'}}>
                ENHANCED LEGACY SCORE
              </div>
              <div style={{fontSize: '36px', fontWeight: 'bold', color: 'white', margin: '8px 0'}}>
                {playerScore}
              </div>
              <div style={{fontSize: '11px', color: 'white', opacity: '0.8'}}>
                Career Impact Rating • Max: 1000
              </div>
            </div>
            
            {/* Hall of Fame Analysis */}
            <div style={{
              background: hofChance >= 80 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                          hofChance >= 60 ? 'linear-gradient(135deg, #10b981, #059669)' : 
                          hofChance >= 30 ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                          'linear-gradient(135deg, #6b7280, #4b5563)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '12px', color: 'white', opacity: '0.9', fontWeight: '600', letterSpacing: '1px'}}>
                HALL OF FAME PROBABILITY
              </div>
              <div style={{fontSize: '36px', fontWeight: 'bold', color: 'white', margin: '8px 0'}}>
                {hofChance}%
              </div>
              <div style={{fontSize: '12px', color: 'white', opacity: '0.8'}}>
                {hofChance >= 80 ? "🔒 LOCK FOR HALL OF FAME" :
                 hofChance >= 60 ? "⭐ STRONG CANDIDATE" :
                 hofChance >= 30 ? "📈 BUILDING LEGACY" :
                 "🔨 WORK IN PROGRESS"}
              </div>
            </div>

            {/* Career Achievement Summary */}
            <div className="stats-grid" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
              <div className="compact-stat">
                <div className="compact-stat-label">Seasons Played</div>
                <div className="compact-stat-value">{seasons.length}</div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">Championships</div>
                <div className="compact-stat-value">{game.career?.totals?.titles || 0}</div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">MVP Awards</div>
                <div className="compact-stat-value">{game.career?.totals?.mvps || 0}</div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">All-Star Games</div>
                <div className="compact-stat-value">{game.career?.totals?.allStars || 0}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{color: 'var(--text-muted)', textAlign: 'center', padding: '40px', fontSize: '14px'}}>
            Complete your first season to unlock legacy analysis
          </div>
        )}
      </div>

      {/* Career Trajectory Charts */}
      <div className="panel">
        <h3 style={{marginBottom: '16px', color: 'var(--team-primary)'}}>Career Trajectory</h3>
        
        {trajectoryData.length > 0 ? (
          <div style={{gap: '20px', display: 'flex', flexDirection: 'column'}}>
            {/* PPG Progression Chart */}
            <div>
              <div style={{fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)'}}>
                Points Per Game Progression
              </div>
              <div style={{
                height: '60px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'end',
                gap: '2px'
              }}>
                {trajectoryData.map((data, index) => (
                  <div key={index} style={{
                    flex: 1,
                    background: 'linear-gradient(to top, var(--team-primary), var(--team-secondary))',
                    height: `${(data.ppg / Math.max(...careerPPG, 1)) * 100}%`,
                    borderRadius: '2px',
                    minHeight: '4px',
                    position: 'relative'
                  }} title={`Season ${data.season}: ${fmt(data.ppg)} PPG`} />
                ))}
              </div>
              <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>
                Current: {fmt(careerPPG[careerPPG.length - 1] || 0)} PPG • Peak: {fmt(Math.max(...careerPPG, 0))} PPG
              </div>
            </div>

            {/* PER Progression Chart */}
            <div>
              <div style={{fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)'}}>
                Player Efficiency Rating (PER)
              </div>
              <div style={{
                height: '60px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'end',
                gap: '2px'
              }}>
                {trajectoryData.map((data, index) => (
                  <div key={index} style={{
                    flex: 1,
                    background: data.per >= 20 ? 'linear-gradient(to top, #10b981, #059669)' :
                               data.per >= 15 ? 'linear-gradient(to top, #f59e0b, #d97706)' :
                               'linear-gradient(to top, #6b7280, #4b5563)',
                    height: `${Math.min((data.per / 30) * 100, 100)}%`,
                    borderRadius: '2px',
                    minHeight: '4px'
                  }} title={`Season ${data.season}: ${fmt(data.per)} PER`} />
                ))}
              </div>
              <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>
                Current: {fmt(careerPER[careerPER.length - 1] || 0)} • League Avg: 15.0 • Elite: 20+
              </div>
            </div>

            {/* Overall Rating Progression */}
            <div>
              <div style={{fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)'}}>
                Overall Rating Development
              </div>
              <div style={{
                height: '60px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'end',
                gap: '2px'
              }}>
                {trajectoryData.map((data, index) => (
                  <div key={index} style={{
                    flex: 1,
                    background: data.overallRating >= 90 ? 'linear-gradient(to top, #FFD700, #FFA500)' :
                               data.overallRating >= 85 ? 'linear-gradient(to top, #C0C0C0, #A9A9A9)' :
                               data.overallRating >= 80 ? 'linear-gradient(to top, #CD7F32, #B8860B)' :
                               'linear-gradient(to top, var(--team-primary), var(--team-secondary))',
                    height: `${((data.overallRating - 50) / 50) * 100}%`,
                    borderRadius: '2px',
                    minHeight: '4px'
                  }} title={`Season ${data.season}: ${data.overallRating} OVR (Age ${data.age})`} />
                ))}
              </div>
              <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>
                Current: {game.ratings?.overall || 70} OVR • Peak: {Math.max(...trajectoryData.map(d => d.overallRating), 70)} OVR
              </div>
            </div>
          </div>
        ) : (
          <div style={{color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px'}}>
            Play multiple seasons to see career progression
          </div>
        )}
      </div>

      {/* MVP Race History */}
      <div className="panel">
        <h3 style={{marginBottom: '16px', color: 'var(--team-primary)'}}>MVP Award History</h3>
        
        {mvpHistory.length > 0 ? (
          <div style={{gap: '12px', display: 'flex', flexDirection: 'column'}}>
            <div style={{fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600'}}>
              Recent MVP Winners
            </div>
            <div style={{maxHeight: '300px', overflowY: 'auto', gap: '8px', display: 'flex', flexDirection: 'column'}}>
              {mvpHistory.slice().reverse().map((mvp, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: '12px',
                  background: mvp.isPlayer ? 
                    'linear-gradient(135deg, var(--team-primary), var(--team-secondary))' : 
                    'var(--bg-secondary)',
                  border: mvp.isPlayer ? '2px solid var(--team-primary)' : '1px solid var(--border-subtle)',
                  color: mvp.isPlayer ? 'white' : 'var(--text-primary)'
                }}>
                  <div>
                    <div style={{fontWeight: 'bold', fontSize: '14px'}}>
                      {mvp.isPlayer ? '🏆 ' : ''}{mvp.playerName}
                    </div>
                    <div style={{fontSize: '12px', opacity: '0.8'}}>
                      {mvp.team} • Season {mvp.season}
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontWeight: 'bold', fontSize: '13px'}}>{mvp.stats}</div>
                    <div style={{fontSize: '11px', opacity: '0.7'}}>PPG/RPG/APG</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px'}}>
            Complete more seasons to see MVP history
          </div>
        )}
      </div>

      {/* Extended All-Time Rankings */}
      <div className="panel">
        <h3 style={{marginBottom: '16px', color: 'var(--team-primary)'}}>Extended All-Time Rankings</h3>
        
        {seasons.length > 0 ? (
          <div style={{gap: '12px', display: 'flex', flexDirection: 'column'}}>
            {/* Player's Detailed Rank */}
            <div style={{
              background: designation.tier === 'Legendary' ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                          designation.tier === 'Elite' ? 'linear-gradient(135deg, #C0C0C0, #A9A9A9)' :
                          designation.tier === 'Great' ? 'linear-gradient(135deg, #CD7F32, #B8860B)' :
                          'linear-gradient(135deg, var(--team-primary), var(--team-secondary))',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{fontSize: '12px', color: 'white', opacity: '0.9', fontWeight: '600'}}>
                YOUR ALL-TIME RANKING
              </div>
              <div style={{fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '8px 0'}}>
                {designation.title}
              </div>
              <div style={{fontSize: '11px', color: 'white', opacity: '0.8'}}>
                Legacy Score: {playerScore} • {designation.tier} Tier
              </div>
            </div>

            {/* Extended Top Players List */}
            <div style={{fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600'}}>
              All-Time Greats (Top 25)
            </div>
            <div style={{maxHeight: '400px', overflowY: 'auto', gap: '4px', display: 'flex', flexDirection: 'column'}}>
              {allTimeRankings.slice(0, 25).map((player, index) => {
                const rankDesignation = getPrestigiousDesignation(player.rank, player.score);
                return (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: player.isPlayer ? 
                      'linear-gradient(135deg, var(--team-primary), var(--team-secondary))' : 
                      player.rank <= 3 ? `linear-gradient(135deg, ${rankDesignation.color}22, ${rankDesignation.color}11)` :
                      'var(--bg-secondary)',
                    border: player.rank <= 10 ? `1px solid ${rankDesignation.color}66` : '1px solid transparent',
                    color: player.isPlayer ? 'white' : 'var(--text-primary)',
                    fontSize: '11px'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <div style={{
                        fontWeight: 'bold', 
                        fontSize: '13px',
                        color: player.rank <= 10 ? rankDesignation.color : 'inherit',
                        minWidth: '32px'
                      }}>
                        {player.rank <= 3 ? 
                          (player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉') : 
                          `#${player.rank}`}
                      </div>
                      <div>
                        <div style={{fontWeight: '600', fontSize: '12px'}}>{player.name}</div>
                        <div style={{opacity: '0.7', fontSize: '10px'}}>
                          {player.championships} Rings • {player.mvps} MVPs • {player.allStars || 0} AS
                        </div>
                      </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{fontWeight: '700', fontSize: '13px', color: rankDesignation.color}}>
                        {player.score}
                      </div>
                      <div style={{opacity: '0.7', fontSize: '9px'}}>{rankDesignation.tier}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px'}}>
            Build your legacy to see all-time rankings
          </div>
        )}
      </div>

      {/* Advanced Career Statistics */}
      <div className="panel">
        <h3 style={{marginBottom: '16px', color: 'var(--team-primary)'}}>Advanced Metrics</h3>
        
        {seasons.length > 0 ? (
          <div style={{gap: '16px', display: 'flex', flexDirection: 'column'}}>
            {/* Advanced Stats Grid */}
            <div className="stats-grid" style={{gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'}}>
              <div className="compact-stat">
                <div className="compact-stat-label">Career PER</div>
                <div className="compact-stat-value" style={{
                  color: (game.career?.stats?.per || 0) >= 20 ? '#10b981' :
                         (game.career?.stats?.per || 0) >= 15 ? '#f59e0b' : 'inherit'
                }}>
                  {fmt(game.career?.stats?.per || 0)}
                </div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">True Shooting%</div>
                <div className="compact-stat-value" style={{
                  color: (game.career?.stats?.ts || 0) >= 0.6 ? '#10b981' :
                         (game.career?.stats?.ts || 0) >= 0.55 ? '#f59e0b' : 'inherit'
                }}>
                  {fmt((game.career?.stats?.ts || 0) * 100, 1)}%
                </div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">Win Shares</div>
                <div className="compact-stat-value">{fmt(careerWS.reduce((a, b) => a + b, 0))}</div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">Career VORP</div>
                <div className="compact-stat-value">{fmt(careerVORP.reduce((a, b) => a + b, 0))}</div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">Games Played</div>
                <div className="compact-stat-value">{game.career?.totals?.games || 0}</div>
              </div>
              <div className="compact-stat">
                <div className="compact-stat-label">Peak Season</div>
                <div className="compact-stat-value">
                  {Math.max(...careerPPG, 0) > 0 ? `${fmt(Math.max(...careerPPG, 0))} PPG` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Career Milestones */}
            <div>
              <div style={{fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)'}}>
                Career Milestones
              </div>
              <div style={{gap: '8px', display: 'flex', flexDirection: 'column'}}>
                {[
                  { milestone: '1,000 Career Points', achieved: (game.career?.totals?.points || 0) >= 1000 },
                  { milestone: '10,000 Career Points', achieved: (game.career?.totals?.points || 0) >= 10000 },
                  { milestone: '20,000 Career Points', achieved: (game.career?.totals?.points || 0) >= 20000 },
                  { milestone: 'First All-Star', achieved: (game.career?.totals?.allStars || 0) >= 1 },
                  { milestone: 'First Championship', achieved: (game.career?.totals?.titles || 0) >= 1 },
                  { milestone: 'First MVP Award', achieved: (game.career?.totals?.mvps || 0) >= 1 }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: item.achieved ? 'var(--success)' : 'var(--bg-secondary)',
                    fontSize: '11px'
                  }}>
                    <span style={{fontSize: '14px'}}>
                      {item.achieved ? '✅' : '⏳'}
                    </span>
                    <span style={{
                      color: item.achieved ? 'white' : 'var(--text-muted)',
                      fontWeight: item.achieved ? '600' : '400'
                    }}>
                      {item.milestone}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '40px'}}>
            Complete seasons to unlock advanced metrics
          </div>
        )}
      </div>

    </div>
  );
}

function LeaguePanel({ game }){
  // Use persistent standings from game state
  const eastStandings = getConferenceStandings(game, "East");
  const westStandings = getConferenceStandings(game, "West");
  
  // Get championship history
  const championshipHistory = game.league?.championshipHistory || {};
  const sortedChampionshipYears = Object.keys(championshipHistory).sort((a, b) => b - a);

  const renderStandings = (teams, conference) => (
    <div className="panel">
      <div className="panel-content">
        <h3 style={{marginBottom: '12px', color: 'var(--team-primary)'}}>{conference} Conference</h3>
        <div style={{gap: '4px', display: 'flex', flexDirection: 'column'}}>
          {teams.map((team, index) => {
            const teamChampionships = team.championships || 0;
            const lastChampionship = team.lastChampionship;
            
            return (
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
                      color: team.isPlayerTeam ? 'var(--team-text)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {team.name}
                      {teamChampionships > 0 && (
                        <div style={{display: 'flex', alignItems: 'center', gap: '2px'}}>
                          {Array.from({length: Math.min(teamChampionships, 3)}, (_, i) => (
                            <span key={i} style={{fontSize: '10px'}}>🏆</span>
                          ))}
                          {teamChampionships > 3 && (
                            <span style={{fontSize: '10px', fontWeight: 'bold', color: '#ffd700'}}>
                              +{teamChampionships - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{fontSize: '10px', color: team.isPlayerTeam ? 'var(--team-text)' : 'var(--text-muted)'}}>
                      Strength: {team.baseStrength || team.currentStrength}
                      {lastChampionship && ` • Last Title: S${lastChampionship}`}
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
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {renderStandings(eastStandings, "Eastern")}
        {renderStandings(westStandings, "Western")}
      </div>
      
      {sortedChampionshipYears.length > 0 && (
        <div className="panel">
          <div className="panel-content">
            <h2>🏆 Championship History</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
              {sortedChampionshipYears.slice(0, 12).map(year => {
                const champion = championshipHistory[year];
                const teamInfo = NBA_TEAMS[champion.team];
                
                return (
                  <div 
                    key={year}
                    className="panel"
                    style={{
                      background: champion.isPlayerTeam 
                        ? `linear-gradient(135deg, ${teamInfo?.colors.primary}30, ${teamInfo?.colors.secondary}30)`
                        : 'rgba(100,100,100,0.1)',
                      border: champion.isPlayerTeam 
                        ? `1px solid ${teamInfo?.colors.primary}80`
                        : '1px solid rgba(255,255,255,0.1)',
                      padding: '12px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: champion.isPlayerTeam ? teamInfo?.colors.primary : 'var(--text-primary)'
                      }}>
                        Season {year}
                      </span>
                      <span style={{fontSize: '16px'}}>🏆</span>
                    </div>
                    
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: champion.isPlayerTeam ? teamInfo?.colors.primary : 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {champion.teamName}
                    </div>
                    
                    {champion.player && (
                      <div style={{
                        fontSize: '11px',
                        color: champion.isPlayerTeam ? '#ffd700' : 'var(--text-secondary)',
                        fontWeight: champion.isPlayerTeam ? 'bold' : 'normal'
                      }}>
                        {champion.isPlayerTeam ? '⭐ ' : ''}{champion.player}
                      </div>
                    )}
                    
                    {!champion.player && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic'
                      }}>
                        Team Championship
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {sortedChampionshipYears.length > 12 && (
              <div style={{textAlign: 'center', marginTop: '1rem', opacity: 0.7}}>
                And {sortedChampionshipYears.length - 12} more seasons...
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel">
          <div className="panel-content">
            <h3>📊 League Stats</h3>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between">
                <span>Current Season:</span>
                <span className="font-bold">Season {game.season}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Championships Awarded:</span>
                <span className="font-bold">{sortedChampionshipYears.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Championships:</span>
                <span className="font-bold text-yellow-400">
                  {Object.values(championshipHistory).filter(c => c.isPlayerTeam).length} 🏆
                </span>
              </div>
              <div className="flex justify-between">
                <span>Most Successful Team:</span>
                <span className="font-bold">
                  {getMostSuccessfulTeam(game.league?.standings || {})}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="panel">
          <div className="panel-content">
            <h3>🔥 Current Season</h3>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between">
                <span>Your Team:</span>
                <span className="font-bold" style={{color: 'var(--team-primary)'}}>
                  {game.team}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Conference:</span>
                <span className="font-bold">
                  {NBA_TEAMS[game.team]?.conference || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Team Record:</span>
                <span className="font-bold">
                  {game.league?.standings?.[game.team]?.wins || 0}-{game.league?.standings?.[game.team]?.losses || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Team Championships:</span>
                <span className="font-bold text-yellow-400">
                  {game.league?.standings?.[game.team]?.championships || 0} 🏆
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to find most successful team
function getMostSuccessfulTeam(standings) {
  let mostSuccessful = null;
  let maxChampionships = 0;
  
  Object.entries(standings).forEach(([teamKey, teamData]) => {
    if ((teamData.championships || 0) > maxChampionships) {
      maxChampionships = teamData.championships || 0;
      mostSuccessful = teamData.name || teamKey;
    }
  });
  
  return mostSuccessful || 'N/A';
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
  const teamThemes = {};
  
  // Group seasons by team with comprehensive data
  game.career.seasons.forEach(season => {
    if (!teamThemes[season.team]) {
      teamThemes[season.team] = {
        seasons: [],
        totalAwards: [],
        totalStats: { points: 0, rebounds: 0, assists: 0, games: 0 },
        championships: 0,
        bestSeason: null
      };
    }
    
    const seasonAwards = game.career.awards.filter(a => a.season === season.season);
    const isChampion = season.stats.champion;
    
    teamThemes[season.team].seasons.push({
      season: season.season,
      stats: season.stats,
      averages: season.averages,
      overall: season.overall,
      awards: seasonAwards.map(a => a.award),
      champion: isChampion
    });
    
    teamThemes[season.team].totalAwards.push(...seasonAwards);
    teamThemes[season.team].totalStats.points += season.stats.points || 0;
    teamThemes[season.team].totalStats.rebounds += season.stats.rebounds || 0;
    teamThemes[season.team].totalStats.assists += season.stats.assists || 0;
    teamThemes[season.team].totalStats.games += season.stats.games || 0;
    
    if (isChampion) teamThemes[season.team].championships++;
    
    // Track best season for each team
    if (!teamThemes[season.team].bestSeason || 
        (season.averages?.per || 0) > (teamThemes[season.team].bestSeason.averages?.per || 0)) {
      teamThemes[season.team].bestSeason = {
        season: season.season,
        stats: season.stats,
        averages: season.averages,
        overall: season.overall
      };
    }
  });

  return (
    <div className="space-y-4">
      {/* Career Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="panel" style={{padding: '12px'}}>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">{Object.values(teamThemes).reduce((sum, team) => sum + team.championships, 0)}</div>
            <div className="text-xs opacity-75">Championships 🏆</div>
          </div>
        </div>
        <div className="panel" style={{padding: '12px'}}>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{game.career.totals.mvps || 0}</div>
            <div className="text-xs opacity-75">MVP Awards</div>
          </div>
        </div>
        <div className="panel" style={{padding: '12px'}}>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{game.career.totals.allstars || 0}</div>
            <div className="text-xs opacity-75">All-Star Games</div>
          </div>
        </div>
        <div className="panel" style={{padding: '12px'}}>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{Object.keys(teamThemes).length}</div>
            <div className="text-xs opacity-75">Teams Played</div>
          </div>
        </div>
      </div>

      {/* Career by Team - Compact Layout */}
      <div className="panel">
        <div className="panel-content">
          <h2>🏆 Career by Team</h2>
          
          <div className="space-y-3 mt-4">
            {Object.entries(teamThemes).map(([team, data]) => {
              const teamInfo = NBA_TEAMS[team];
              const avgPPG = data.totalStats.games ? (data.totalStats.points / data.totalStats.games).toFixed(1) : 0;
              const avgRPG = data.totalStats.games ? (data.totalStats.rebounds / data.totalStats.games).toFixed(1) : 0;
              const avgAPG = data.totalStats.games ? (data.totalStats.assists / data.totalStats.games).toFixed(1) : 0;
              
              return (
                <div 
                  key={team} 
                  className="panel"
                  style={{
                    background: `linear-gradient(135deg, ${teamInfo?.colors.primary}20, ${teamInfo?.colors.secondary}20)`,
                    border: `1px solid ${teamInfo?.colors.primary}60`,
                    padding: '16px'
                  }}
                >
                  {/* Team Header - Compact */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: teamInfo?.colors.primary }}
                      >
                        {team.slice(0, 2)}
                      </div>
                      <div>
                        <h3 style={{ color: teamInfo?.colors.primary, fontSize: '16px', margin: 0 }}>{team}</h3>
                        <div className="text-xs opacity-75">
                          {data.seasons.length} seasons • {avgPPG}/{avgRPG}/{avgAPG}
                          {data.championships > 0 && ` • ${data.championships}🏆`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{data.totalAwards.length} Awards</div>
                      {data.bestSeason && (
                        <div className="text-xs opacity-75">Best: S{data.bestSeason.season} ({data.bestSeason.overall} OVR)</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Season Cards - Ultra Compact */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                    {data.seasons.map((season, i) => (
                      <div 
                        key={i} 
                        className="relative group cursor-pointer"
                        style={{ 
                          background: season.champion ? 'linear-gradient(135deg, #ffd700, #ff6b35)' : 'rgba(0,0,0,0.4)',
                          border: `1px solid ${season.champion ? '#ffd700' : 'rgba(255,255,255,0.2)'}`,
                          borderRadius: '6px',
                          padding: '6px',
                          minHeight: '60px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <div className="text-xs font-bold" style={{ color: season.champion ? '#000' : '#fff' }}>
                          S{season.season}
                        </div>
                        <div className="text-xs" style={{ color: season.champion ? '#000' : '#ccc' }}>
                          {season.overall}
                        </div>
                        {season.champion && <div className="text-xs">🏆</div>}
                        {season.awards.length > 0 && <div className="text-xs">⭐</div>}
                        
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                            <div>Season {season.season} • {season.overall} OVR</div>
                            <div>{season.averages?.ppg?.toFixed(1) || 0} PPG • PER {season.averages?.per?.toFixed(1) || 0}</div>
                            {season.awards.length > 0 && <div className="text-yellow-300">{season.awards.join(", ")}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Detailed Career Stats */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel">
          <div className="panel-content">
            <h3>📊 Career Totals</h3>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{game.career.totals.points?.toLocaleString() || 0}</div>
                <div className="text-xs opacity-75">Career Points</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{game.career.totals.rebounds?.toLocaleString() || 0}</div>
                <div className="text-xs opacity-75">Career Rebounds</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">{game.career.totals.assists?.toLocaleString() || 0}</div>
                <div className="text-xs opacity-75">Career Assists</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center">
                <div className="text-sm font-bold">{fmt(game.career.totals.games ? game.career.totals.points/game.career.totals.games : 0)}</div>
                <div className="text-xs opacity-75">PPG</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">{fmt(game.career.totals.games ? game.career.totals.rebounds/game.career.totals.games : 0)}</div>
                <div className="text-xs opacity-75">RPG</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">{fmt(game.career.totals.games ? game.career.totals.assists/game.career.totals.games : 0)}</div>
                <div className="text-xs opacity-75">APG</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="panel">
          <div className="panel-content">
            <h3>🏆 Major Awards</h3>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div className="flex justify-between">
                <span>Championships:</span>
                <span className="font-bold text-yellow-400">{game.career.totals.titles || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>MVPs:</span>
                <span className="font-bold text-blue-400">{game.career.totals.mvps || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Finals MVPs:</span>
                <span className="font-bold text-purple-400">{game.career.totals.finalsMVPs || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>All-Stars:</span>
                <span className="font-bold text-red-400">{game.career.totals.allstars || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>DPOY:</span>
                <span className="font-bold text-green-400">{game.career.totals.dpoys || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>6MOY:</span>
                <span className="font-bold text-orange-400">{game.career.totals.sixmoys || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Scoring Titles:</span>
                <span className="font-bold text-pink-400">{game.career.totals.scoring || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Games Played:</span>
                <span className="font-bold">{game.career.totals.games?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
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

// Avatar Component
function Avatar({ appearance, size = 120, className = "" }) {
  const svgContent = createAvatarSVG(appearance, size);
  
  return (
    <div 
      className={`avatar ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '3px solid rgba(255, 255, 255, 0.2)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// Profile Picture Changer Component
function ProfilePictureChanger({ currentAppearance, onAppearanceChange, onClose }) {
  const [previewAppearance, setPreviewAppearance] = useState(currentAppearance);
  const [activeCategory, setActiveCategory] = useState('face');
  
  const categories = {
    face: {
      name: 'Face',
      options: {
        skin: {
          label: 'Skin Tone',
          values: [
            '#F5DEB3', '#DEB887', '#D2B48C', '#BC9A6A', 
            '#A0522D', '#8B4513', '#654321', '#F4C2A1',
            '#E6B887', '#C8956D', '#8D5524', '#5D4037'
          ]
        },
        faceShape: {
          label: 'Face Shape',
          values: ['oval', 'round', 'square', 'heart', 'diamond', 'oblong']
        }
      }
    },
    hair: {
      name: 'Hair',
      options: {
        hairStyle: {
          label: 'Hair Style',
          values: ['buzz', 'short', 'medium', 'long', 'curly', 'afro', 'fade', 'mohawk', 'bald', 'ponytail', 'dreadlocks', 'waves']
        },
        hairColor: {
          label: 'Hair Color',
          values: [
            '#000000', '#2F1B14', '#8B4513', '#D2691E', 
            '#DAA520', '#FFD700', '#B22222', '#FFFFFF', 
            '#654321', '#4A4A4A', '#8B0000', '#2E2E2E'
          ]
        }
      }
    },
    features: {
      name: 'Features',
      options: {
        eyes: {
          label: 'Eye Color',
          values: [
            '#8B4513', '#654321', '#4682B4', '#228B22', 
            '#808080', '#000000', '#32CD32', '#4169E1',
            '#20B2AA', '#8A2BE2', '#A0522D', '#2E8B57'
          ]
        },
        nose: {
          label: 'Nose Type',
          values: ['small', 'medium', 'large', 'wide', 'narrow', 'button', 'hooked']
        },
        eyebrows: {
          label: 'Eyebrows',
          values: ['thin', 'medium', 'thick', 'bushy']
        }
      }
    },
    expression: {
      name: 'Expression',
      options: {
        expression: {
          label: 'Expression',
          values: ['neutral', 'smile', 'smirk', 'serious', 'confident', 'determined']
        },
        facialHair: {
          label: 'Facial Hair',
          values: ['none', 'mustache', 'goatee', 'full_beard', 'stubble', 'soul_patch', 'mutton_chops']
        }
      }
    }
  };
  
  const updateFeature = (feature, value) => {
    setPreviewAppearance(prev => ({
      ...prev,
      [feature]: value
    }));
  };
  
  const randomizeAll = () => {
    setPreviewAppearance(generateAppearance());
  };
  
  const saveChanges = () => {
    onAppearanceChange(previewAppearance);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="panel" style={{ 
        maxWidth: '800px', 
        width: '90%', 
        maxHeight: '90vh', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ color: 'var(--team-primary)', margin: 0 }}>Customize Avatar</h2>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={onClose}
            style={{ padding: '8px 12px' }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
          {/* Preview Section */}
          <div style={{ 
            flex: '0 0 200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Avatar appearance={previewAppearance} size={160} />
            
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', width: '100%' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={randomizeAll}
                style={{ fontSize: '12px' }}
              >
                🎲 Randomize All
              </button>
              <button 
                className="btn btn-primary" 
                onClick={saveChanges}
                style={{ fontSize: '14px', padding: '12px' }}
              >
                Save Changes
              </button>
            </div>
          </div>
          
          {/* Customization Options */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Category Tabs */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '12px'
            }}>
              {Object.entries(categories).map(([key, category]) => (
                <button
                  key={key}
                  className={`btn btn-sm ${activeCategory === key ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveCategory(key)}
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            {/* Options for Active Category */}
            <div style={{ 
              flex: 1, 
              overflow: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(categories[activeCategory].options).map(([optionKey, option]) => (
                  <div key={optionKey}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      marginBottom: '8px',
                      color: 'var(--text-secondary)'
                    }}>
                      {option.label}
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: optionKey.includes('Color') || optionKey === 'skin' ? 
                        'repeat(6, 1fr)' : 'repeat(3, 1fr)',
                      gap: '8px'
                    }}>
                      {option.values.map((value, index) => {
                        const isSelected = previewAppearance[optionKey] === value;
                        const isColor = optionKey.includes('Color') || optionKey === 'skin';
                        
                        return (
                          <button
                            key={index}
                            onClick={() => updateFeature(optionKey, value)}
                            style={{
                              padding: isColor ? '0' : '8px 12px',
                              borderRadius: '8px',
                              border: isSelected ? 
                                '3px solid var(--team-primary)' : 
                                '2px solid rgba(255, 255, 255, 0.1)',
                              background: isColor ? value : 
                                isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                              color: isColor ? 'transparent' : 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: isSelected ? '600' : '400',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              aspectRatio: isColor ? '1' : 'auto',
                              minHeight: isColor ? '32px' : '36px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textTransform: 'capitalize'
                            }}
                          >
                            {isColor ? '' : value.replace('_', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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

// Profile Picture Component
function ProfilePicture({ appearance, firstName, lastName, size = 40, className = "" }) {
  if (!appearance) {
    // Fallback to initials
    const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}` : '??';
    return (
      <div 
        className={`profile-picture ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--team-primary), var(--team-secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.4),
          fontWeight: 'bold',
          color: 'white',
          border: '2px solid var(--team-primary)'
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div 
      className={`profile-picture ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${appearance.skin}, ${appearance.skin})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        border: '3px solid var(--team-primary)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'hidden'
      }}
    >
      {/* Face */}
      <div style={{
        width: '85%',
        height: '85%',
        borderRadius: '50%',
        background: appearance.skin,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Hair */}
        <div style={{
          position: 'absolute',
          top: '5%',
          left: '10%',
          right: '10%',
          height: '40%',
          background: appearance.hair,
          borderRadius: '50% 50% 20% 20%',
          zIndex: 1
        }} />
        
        {/* Eyes */}
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '25%',
          width: '12%',
          height: '8%',
          background: appearance.eyes,
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          top: '35%',
          right: '25%',
          width: '12%',
          height: '8%',
          background: appearance.eyes,
          borderRadius: '50%'
        }} />
        
        {/* Nose */}
        <div style={{
          position: 'absolute',
          top: '45%',
          left: '47%',
          width: '6%',
          height: '8%',
          background: `linear-gradient(to bottom, transparent, ${appearance.skin})`,
          borderRadius: '0 0 50% 50%'
        }} />
        
        {/* Mouth */}
        <div style={{
          position: 'absolute',
          top: '60%',
          left: '40%',
          width: '20%',
          height: '4%',
          background: '#8B4513',
          borderRadius: '0 0 20px 20px'
        }} />
      </div>
    </div>
  );
}

// Life Panel Component
function LifePanel({ game, onLifestyle, onInvestment }) {
  return (
    <div className="grid-2" style={{gap: '20px'}}>
      {/* Lifestyle Activities */}
      <div className="panel panel-content">
        <h3 style={{marginBottom: '16px', color: 'var(--team-primary)'}}>
          🌟 Lifestyle Activities
        </h3>
        
        {/* Current Relationship Status */}
        {game.relationships?.girlfriend && (
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.1))',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid rgba(236, 72, 153, 0.2)'
          }}>
            <div style={{fontWeight: '600', marginBottom: '4px'}}>
              💕 Dating {game.relationships.girlfriend.name}
            </div>
            <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>
              {game.relationships.girlfriend.profession} • Love Level: {game.relationships.relationshipLevel}/100
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              background: 'rgba(236, 72, 153, 0.2)',
              borderRadius: '2px',
              marginTop: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${game.relationships.relationshipLevel}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ec4899, #db2777)',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        )}
        
        <div style={{display: 'grid', gap: '12px'}}>
          {LIFE_ACTIVITIES.map(activity => (
            <button
              key={activity.id}
              className="btn btn-action"
              style={{
                padding: '12px',
                textAlign: 'left',
                background: game.cash >= activity.cost ? 
                  'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))' : 
                  'rgba(100, 100, 100, 0.1)',
                border: game.cash >= activity.cost ? 
                  '1px solid var(--team-primary)' : 
                  '1px solid rgba(100, 100, 100, 0.3)',
                opacity: game.cash >= activity.cost ? 1 : 0.5
              }}
              onClick={() => onLifestyle(activity.id)}
              disabled={game.cash < activity.cost}
            >
              <div style={{fontWeight: '600', marginBottom: '4px'}}>
                {activity.name}
              </div>
              <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px'}}>
                Cost: {formatMoney(activity.cost)} • Duration: {activity.duration} week{activity.duration > 1 ? 's' : ''}
              </div>
              <div style={{fontSize: '11px', display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                {activity.moraleBoost && <span style={{color: '#10b981'}}>+{activity.moraleBoost} Morale</span>}
                {activity.fameBoost && <span style={{color: '#f59e0b'}}>+{activity.fameBoost} Fame</span>}
                {activity.followersBoost && <span style={{color: '#3b82f6'}}>+{activity.followersBoost} Followers</span>}
                {activity.peakBoost && <span style={{color: '#8b5cf6'}}>+{activity.peakBoost} Peak</span>}
                {activity.netWorthBoost && <span style={{color: '#06b6d4'}}>+{formatMoney(activity.netWorthBoost)}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Investments */}
      <div className="panel panel-content">
        <h3 style={{marginBottom: '16px', color: 'var(--team-primary)'}}>
          💰 Investment Portfolio
        </h3>
        
        {/* Current Investments */}
        {game.investments && game.investments.length > 0 && (
          <div style={{marginBottom: '20px'}}>
            <h4 style={{marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)'}}>
              Current Investments
            </h4>
            <div style={{display: 'grid', gap: '8px'}}>
              {game.investments.map((investment, idx) => {
                const weeksElapsed = (game.season - investment.startSeason) * 20 + (game.week - investment.startWeek);
                const progress = Math.min(100, (weeksElapsed / (investment.duration * 20)) * 100);
                const currentValue = investment.totalValue * (1 + (investment.returnRate * progress / 100));
                
                return (
                  <div key={idx} style={{
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '6px',
                    border: '1px solid var(--team-primary)'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                      <span style={{fontWeight: '600'}}>{investment.name}</span>
                      <span style={{color: currentValue > investment.totalValue ? '#10b981' : '#ef4444'}}>
                        {formatMoney(Math.round(currentValue))}
                      </span>
                    </div>
                    <div style={{fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px'}}>
                      Risk: {investment.riskLevel} • Return: {(investment.returnRate * 100).toFixed(1)}%/year
                    </div>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(100, 100, 100, 0.2)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--team-primary), var(--team-secondary))',
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Available Investments */}
        <div style={{display: 'grid', gap: '12px'}}>
          {INVESTMENT_OPTIONS.filter(inv => !game.investments?.find(i => i.id === inv.id)).map(investment => (
            <button
              key={investment.id}
              className="btn btn-action"
              style={{
                padding: '12px',
                textAlign: 'left',
                background: game.cash >= investment.cost ? 
                  'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))' : 
                  'rgba(100, 100, 100, 0.1)',
                border: game.cash >= investment.cost ? 
                  '1px solid var(--team-primary)' : 
                  '1px solid rgba(100, 100, 100, 0.3)',
                opacity: game.cash >= investment.cost ? 1 : 0.5
              }}
              onClick={() => onInvestment(investment.id)}
              disabled={game.cash < investment.cost}
            >
              <div style={{fontWeight: '600', marginBottom: '4px'}}>
                {investment.name}
              </div>
              <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px'}}>
                Cost: {formatMoney(investment.cost)} • Duration: {investment.duration} years
              </div>
              <div style={{fontSize: '11px', display: 'flex', gap: '12px', alignItems: 'center'}}>
                <span style={{
                  color: investment.riskLevel === 'low' ? '#10b981' : 
                        investment.riskLevel === 'medium' ? '#f59e0b' : '#ef4444'
                }}>
                  {investment.riskLevel.toUpperCase()} RISK
                </span>
                <span style={{color: '#06b6d4'}}>
                  {(investment.returnRate * 100).toFixed(1)}% Annual Return
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Social Media Panel Component
function SocialPanel({ game, onChallenge }) {
  return (
    <div className="grid-2" style={{gap: '20px'}}>
      {/* Social Media Stats */}
      <div className="panel panel-content">
        <h3 style={{marginBottom: '16px', color: 'var(--team-primary)'}}>
          📱 Social Media Status
        </h3>
        
        <div style={{display: 'grid', gap: '12px', marginBottom: '20px'}}>
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{fontWeight: '600', marginBottom: '4px'}}>
              👥 Followers: {game.followers?.toLocaleString() || 0}
            </div>
            <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>
              Fame Level: {game.fame}/100
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{fontWeight: '600', marginBottom: '4px'}}>
              🔥 Engagement Rate
            </div>
            <div style={{fontSize: '12px', color: 'var(--text-muted)'}}>
              {game.fame >= 80 ? 'Viral Star' : 
               game.fame >= 60 ? 'Influencer' : 
               game.fame >= 40 ? 'Rising' : 
               game.fame >= 20 ? 'Growing' : 'Building'}
            </div>
          </div>
        </div>
        
        {/* Recent Social Media Activity */}
        {game.socialMediaChallenges && game.socialMediaChallenges.length > 0 && (
          <div>
            <h4 style={{marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)'}}>
              Recent Posts
            </h4>
            <div style={{display: 'grid', gap: '8px'}}>
              {game.socialMediaChallenges.slice(-3).map((challenge, idx) => (
                <div key={idx} style={{
                  padding: '10px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '6px',
                  border: '1px solid var(--team-primary)'
                }}>
                  <div style={{fontWeight: '600', marginBottom: '4px'}}>
                    {challenge.name}
                  </div>
                  <div style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                    +{challenge.followersGained?.toLocaleString()} followers • +{challenge.fameGained} fame
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Social Media Challenges */}
      <div className="panel panel-content">
        <h3 style={{marginBottom: '16px', color: 'var(--team-primary)'}}>
          🎯 Social Media Challenges
        </h3>
        
        <div style={{display: 'grid', gap: '12px'}}>
          {SOCIAL_MEDIA_CHALLENGES.map(challenge => {
            const meetsRequirements = game.ratings.overall >= challenge.requirements.overall &&
                                     game.fame >= (challenge.requirements.fame || 0) &&
                                     (!challenge.requirements.skillRating || 
                                      Math.max(game.ratings.shooting, game.ratings.finishing, game.ratings.playmaking) >= challenge.requirements.skillRating);
            
            const completed = game.socialMediaChallenges?.find(c => c.id === challenge.id);
            
            return (
              <button
                key={challenge.id}
                className="btn btn-action"
                style={{
                  padding: '14px',
                  textAlign: 'left',
                  background: completed ? 
                    'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))' :
                    meetsRequirements ? 
                      'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))' : 
                      'rgba(100, 100, 100, 0.1)',
                  border: completed ?
                    '1px solid #22c55e' :
                    meetsRequirements ? 
                      '1px solid var(--team-primary)' : 
                      '1px solid rgba(100, 100, 100, 0.3)',
                  opacity: completed ? 0.7 : meetsRequirements ? 1 : 0.5
                }}
                onClick={() => onChallenge(challenge.id)}
                disabled={!meetsRequirements || completed}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                  <span style={{fontWeight: '600'}}>
                    {challenge.name} {completed && '✅'}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: challenge.difficulty === 'easy' ? '#10b981' :
                               challenge.difficulty === 'medium' ? '#f59e0b' :
                               challenge.difficulty === 'hard' ? '#ef4444' : '#8b5cf6',
                    color: 'white'
                  }}>
                    {challenge.difficulty.toUpperCase()}
                  </span>
                </div>
                
                <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px'}}>
                  {challenge.content}
                </div>
                
                <div style={{fontSize: '11px', marginBottom: '8px'}}>
                  <div style={{color: 'var(--text-muted)', marginBottom: '4px'}}>Requirements:</div>
                  <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                    <span style={{color: game.ratings.overall >= challenge.requirements.overall ? '#10b981' : '#ef4444'}}>
                      {challenge.requirements.overall}+ OVR
                    </span>
                    {challenge.requirements.fame && (
                      <span style={{color: game.fame >= challenge.requirements.fame ? '#10b981' : '#ef4444'}}>
                        {challenge.requirements.fame}+ Fame
                      </span>
                    )}
                    {challenge.requirements.skillRating && (
                      <span style={{color: Math.max(game.ratings.shooting, game.ratings.finishing, game.ratings.playmaking) >= challenge.requirements.skillRating ? '#10b981' : '#ef4444'}}>
                        {challenge.requirements.skillRating}+ Elite Skill
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{fontSize: '11px', display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                  <span style={{color: '#3b82f6'}}>+{challenge.rewards.followers?.toLocaleString()} Followers</span>
                  <span style={{color: '#f59e0b'}}>+{challenge.rewards.fame} Fame</span>
                  {challenge.rewards.morale && <span style={{color: '#10b981'}}>+{challenge.rewards.morale} Morale</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Retirement Components ----------
function RetirementHeader({ game, onReset, onExport, onImport }) {
  return (
    <div className="header">
      <div className="header-content">
        <div className="player-info">
          <ProfilePicture appearance={game.appearance} size="large" />
          <div className="player-details">
            <h1>{game.name} - Retired Legend</h1>
            <div className="player-meta">
              <span>Retired after {game.retirementCelebration?.finalSeason} seasons</span>
              <span>{formatMoney(game.cash)} Net Worth</span>
              <span>Legacy: {game.postRetirement?.reputation || 0}/100</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onExport}>💾</button>
          <button className="btn btn-secondary" onClick={onImport}>📥</button>
          <button className="btn btn-danger" onClick={onReset}>🔄</button>
        </div>
      </div>
    </div>
  );
}

function RetirementCelebrationPanel({ game, onProceedToHoF }) {
  const celebration = game.retirementCelebration;
  const stats = celebration.careerStats;
  
  return (
    <div className="panel">
      <div className="panel-content">
        <h2 style={{fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem', background: 'linear-gradient(45deg, #ffd700, #ff6b35)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent'}}>
          🏆 RETIREMENT CELEBRATION 🏆
        </h2>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem'}}>
          <div className="panel" style={{background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,107,53,0.1))'}}>
            <h3>🏀 Career Statistics</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
              <div><strong>Games:</strong> {stats.games?.toLocaleString() || 0}</div>
              <div><strong>Points:</strong> {stats.points?.toLocaleString() || 0}</div>
              <div><strong>Rebounds:</strong> {stats.rebounds?.toLocaleString() || 0}</div>
              <div><strong>Assists:</strong> {stats.assists?.toLocaleString() || 0}</div>
              <div><strong>PPG:</strong> {stats.games ? (stats.points / stats.games).toFixed(1) : 0}</div>
              <div><strong>RPG:</strong> {stats.games ? (stats.rebounds / stats.games).toFixed(1) : 0}</div>
            </div>
          </div>
          
          <div className="panel" style={{background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1))'}}>
            <h3>🏆 Achievements</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem'}}>
              <div><strong>Championships:</strong> {stats.titles || 0}</div>
              <div><strong>MVPs:</strong> {stats.mvps || 0}</div>
              <div><strong>Finals MVPs:</strong> {stats.finalsMVPs || 0}</div>
              <div><strong>All-Stars:</strong> {stats.allstars || 0}</div>
              <div><strong>Scoring Titles:</strong> {stats.scoring || 0}</div>
              <div><strong>DPOY Awards:</strong> {stats.dpoy || 0}</div>
            </div>
          </div>
        </div>
        
        <div className="panel" style={{background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))', textAlign: 'center', padding: '2rem'}}>
          <h3 style={{fontSize: '1.8rem', marginBottom: '1rem'}}>🎯 Hall of Fame Probability</h3>
          <div style={{fontSize: '3rem', fontWeight: 'bold', color: celebration.hofPercentage > 70 ? '#10b981' : celebration.hofPercentage > 40 ? '#f59e0b' : '#ef4444', marginBottom: '1rem'}}>
            {celebration.hofPercentage}%
          </div>
          <p style={{fontSize: '1.1rem', opacity: 0.8, marginBottom: '2rem'}}>
            Based on your career achievements, statistical performance, and impact on the game
          </p>
          <button className="btn btn-primary" style={{fontSize: '1.2rem', padding: '1rem 2rem'}} onClick={onProceedToHoF}>
            🗳️ Proceed to Hall of Fame Voting
          </button>
        </div>
      </div>
    </div>
  );
}

function HallOfFameResultPanel({ game, onEnterManagement }) {
  const result = game.retirementCelebration.hofResult;
  
  return (
    <div className="panel">
      <div className="panel-content">
        {result.inducted ? (
          <>
            <h2 style={{fontSize: '3rem', textAlign: 'center', marginBottom: '2rem', color: '#ffd700'}}>
              🎉 HALL OF FAME INDUCTEE! 🎉
            </h2>
            
            <div className="panel" style={{background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,107,53,0.2))', textAlign: 'center', padding: '2rem', marginBottom: '2rem'}}>
              <h3 style={{fontSize: '2rem', marginBottom: '1rem'}}>Congratulations!</h3>
              <p style={{fontSize: '1.2rem', marginBottom: '1rem'}}>
                You received <strong>{result.votingPercentage}%</strong> of the votes
              </p>
              <p style={{fontSize: '1.1rem', marginBottom: '1rem'}}>
                Inducted in <strong>{result.yearInducted}</strong>
              </p>
              {result.rank <= 10 && (
                <div style={{background: 'rgba(255,215,0,0.3)', padding: '1rem', borderRadius: '1rem', marginTop: '1rem'}}>
                  <h4 style={{color: '#ffd700', fontSize: '1.3rem'}}>🏆 All-Time Ranking: #{result.rank}</h4>
                  <p>You're considered one of the greatest players in basketball history!</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 style={{fontSize: '2.5rem', textAlign: 'center', marginBottom: '2rem', color: '#ef4444'}}>
              Hall of Fame Results
            </h2>
            
            <div className="panel" style={{background: 'rgba(239,68,68,0.1)', textAlign: 'center', padding: '2rem', marginBottom: '2rem'}}>
              <h3 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Not Selected This Year</h3>
              <p style={{fontSize: '1.1rem', marginBottom: '1rem'}}>
                You received <strong>{result.votingPercentage}%</strong> of the votes
              </p>
              <p>You'll be eligible again next year. Your legacy lives on!</p>
            </div>
          </>
        )}
        
        <div style={{textAlign: 'center', marginTop: '2rem'}}>
          <button className="btn btn-primary" style={{fontSize: '1.2rem', padding: '1rem 2rem'}} onClick={onEnterManagement}>
            🏢 Begin Your Post-Playing Career
          </button>
        </div>
      </div>
    </div>
  );
}

function ManagementTabs({ current, onSelect, tabs }) {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`tab ${current === tab ? 'active' : ''}`}
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function ManagementOverviewPanel({ game }) {
  const postRetirement = game.postRetirement;
  
  return (
    <div className="panel">
      <div className="panel-content">
        <h2>🏢 Management Career Overview</h2>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem'}}>
          <div className="panel">
            <h3>Current Status</h3>
            <div>
              <p><strong>Net Worth:</strong> {formatMoney(game.cash)}</p>
              <p><strong>Reputation:</strong> {postRetirement.reputation}/100</p>
              <p><strong>Experience:</strong> {postRetirement.coachingExperience} years</p>
              {postRetirement.managedTeam && (
                <p><strong>Current Role:</strong> {postRetirement.managedTeam.role} - {postRetirement.managedTeam.team}</p>
              )}
            </div>
          </div>
          
          <div className="panel">
            <h3>Business Portfolio</h3>
            <div>
              <p><strong>Teams Owned:</strong> {postRetirement.ownedTeams.length}</p>
              <p><strong>Business Ventures:</strong> {postRetirement.businessVentures.length}</p>
              {postRetirement.trainingAcademy && (
                <p><strong>Training Academy:</strong> Active</p>
              )}
            </div>
          </div>
        </div>
        
        {postRetirement.ownedTeams.length > 0 && (
          <div className="panel" style={{marginTop: '2rem'}}>
            <h3>🏀 Owned Teams</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              {postRetirement.ownedTeams.map((ownership, index) => (
                <div key={index} className="panel" style={{background: 'rgba(59,130,246,0.1)'}}>
                  <h4>{ownership.team}</h4>
                  <p>Purchased: Season {ownership.season}</p>
                  <p>Cost: {formatMoney(ownership.purchasePrice)}</p>
                  <p>Current Value: {formatMoney(ownership.currentValue)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ManagementOpportunitiesPanel({ game, onAcceptPosition }) {
  const opportunities = game.postRetirement.availablePositions;
  
  return (
    <div className="panel">
      <div className="panel-content">
        <h2>🎯 Available Opportunities</h2>
        
        {opportunities.length === 0 ? (
          <div className="panel" style={{textAlign: 'center', padding: '2rem'}}>
            <p>No new opportunities available at this time.</p>
            <p style={{opacity: 0.7}}>Check back later or build your reputation!</p>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginTop: '2rem'}}>
            {opportunities.map((opportunity, index) => (
              <div key={index} className="panel" style={{background: getOpportunityGradient(opportunity.type)}}>
                <h3>{getOpportunityTitle(opportunity.type)}</h3>
                <p><strong>Team:</strong> {opportunity.team}</p>
                {opportunity.salary && <p><strong>Salary:</strong> {formatMoney(opportunity.salary)}/year</p>}
                {opportunity.cost && <p><strong>Cost:</strong> {formatMoney(opportunity.cost)}</p>}
                
                <div style={{marginTop: '1rem', marginBottom: '1rem'}}>
                  <h4>Requirements:</h4>
                  {Object.entries(opportunity.requirements).map(([req, value]) => (
                    <p key={req} style={{
                      color: checkRequirement(game, req, value) ? '#10b981' : '#ef4444'
                    }}>
                      {req}: {value} {checkRequirement(game, req, value) ? '✓' : '✗'}
                    </p>
                  ))}
                </div>
                
                <button 
                  className="btn btn-primary" 
                  style={{width: '100%'}}
                  disabled={!canAcceptOpportunity(game, opportunity)}
                  onClick={() => onAcceptPosition(opportunity)}
                >
                  {opportunity.type === 'team_purchase' ? 'Purchase Team' : 'Accept Position'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamManagementPanel({ game }) {
  const managedTeam = game.postRetirement.managedTeam;
  
  return (
    <div className="panel">
      <div className="panel-content">
        <h2>🏀 Team Management</h2>
        
        {managedTeam ? (
          <div>
            <div className="panel" style={{background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1))', marginBottom: '2rem'}}>
              <h3>{managedTeam.team} - {managedTeam.role.replace('_', ' ').toUpperCase()}</h3>
              <p><strong>Joined:</strong> Season {managedTeam.startSeason}</p>
              <p><strong>Salary:</strong> {formatMoney(managedTeam.salary)}/year</p>
              <p><strong>Record:</strong> {managedTeam.record.wins}-{managedTeam.record.losses}</p>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem'}}>
              <div className="panel">
                <h4>Team Actions</h4>
                <button className="btn btn-secondary" style={{width: '100%', marginBottom: '1rem'}}>
                  📊 View Team Stats
                </button>
                <button className="btn btn-secondary" style={{width: '100%', marginBottom: '1rem'}}>
                  🔄 Make Trades
                </button>
                <button className="btn btn-secondary" style={{width: '100%'}}>
                  📋 Set Lineups
                </button>
              </div>
              
              <div className="panel">
                <h4>Development</h4>
                <button className="btn btn-secondary" style={{width: '100%', marginBottom: '1rem'}}>
                  🏋️ Training Programs
                </button>
                <button className="btn btn-secondary" style={{width: '100%', marginBottom: '1rem'}}>
                  🎯 Draft Strategy
                </button>
                <button className="btn btn-secondary" style={{width: '100%'}}>
                  💼 Hire Staff
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="panel" style={{textAlign: 'center', padding: '2rem'}}>
            <p>You're not currently managing any team.</p>
            <p style={{opacity: 0.7}}>Check the Opportunities tab to find coaching or front office positions!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessPanel({ game }) {
  return (
    <div className="panel">
      <div className="panel-content">
        <h2>💼 Business Ventures</h2>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem'}}>
          <div className="panel">
            <h3>Investment Portfolio</h3>
            <p><strong>Current Net Worth:</strong> {formatMoney(game.cash)}</p>
            <p><strong>Active Investments:</strong> {game.investments?.length || 0}</p>
            
            <div style={{marginTop: '1rem'}}>
              <button className="btn btn-primary" style={{width: '100%', marginBottom: '1rem'}}>
                📈 View Investments
              </button>
              <button className="btn btn-secondary" style={{width: '100%'}}>
                💰 New Investment
              </button>
            </div>
          </div>
          
          <div className="panel">
            <h3>Training Academy</h3>
            {game.postRetirement.trainingAcademy ? (
              <div>
                <p>✅ Academy Active</p>
                <p>Students: {game.postRetirement.trainingAcademy.students || 0}</p>
                <p>Revenue: {formatMoney(game.postRetirement.trainingAcademy.revenue || 0)}/year</p>
              </div>
            ) : (
              <div>
                <p>Start your own basketball training academy</p>
                <button className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>
                  🏀 Start Academy ({formatMoney(500)})
                </button>
              </div>
            )}
          </div>
          
          <div className="panel">
            <h3>Media & Endorsements</h3>
            <p>Leverage your playing career for business opportunities</p>
            <button className="btn btn-secondary" style={{width: '100%', marginBottom: '1rem'}}>
              📺 TV Commentary
            </button>
            <button className="btn btn-secondary" style={{width: '100%', marginBottom: '1rem'}}>
              📚 Autobiography
            </button>
            <button className="btn btn-secondary" style={{width: '100%'}}>
              🎬 Documentary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegacyPanel({ game }) {
  const hofResult = game.retirementCelebration.hofResult;
  
  return (
    <div className="panel">
      <div className="panel-content">
        <h2>🏆 Your Legacy</h2>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem'}}>
          <div className="panel" style={{background: hofResult?.inducted ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,107,53,0.2))' : 'rgba(100,100,100,0.1)'}}>
            <h3>🏛️ Hall of Fame Status</h3>
            {hofResult?.inducted ? (
              <div>
                <p style={{color: '#ffd700', fontSize: '1.2rem', fontWeight: 'bold'}}>✅ INDUCTED</p>
                <p>Class of {hofResult.yearInducted}</p>
                <p>Voting: {hofResult.votingPercentage}%</p>
                {hofResult.rank <= 10 && (
                  <p style={{color: '#ffd700'}}>All-Time Rank: #{hofResult.rank}</p>
                )}
              </div>
            ) : (
              <div>
                <p style={{color: '#ef4444'}}>Not Yet Inducted</p>
                <p>Voting: {hofResult?.votingPercentage || 0}%</p>
                <p style={{opacity: 0.7}}>Eligible for future voting</p>
              </div>
            )}
          </div>
          
          <div className="panel">
            <h3>📊 Career Statistics</h3>
            <div>
              <p><strong>Career PPG:</strong> {game.career.totals.games ? (game.career.totals.points / game.career.totals.games).toFixed(1) : 0}</p>
              <p><strong>Total Points:</strong> {game.career.totals.points?.toLocaleString() || 0}</p>
              <p><strong>Championships:</strong> {game.career.totals.titles || 0}</p>
              <p><strong>MVP Awards:</strong> {game.career.totals.mvps || 0}</p>
            </div>
          </div>
          
          <div className="panel">
            <h3>🎯 Historical Impact</h3>
            <div>
              <p><strong>Peak Overall:</strong> {Math.max(...(game.career.seasons?.map(s => s.overall) || [game.ratings.overall]))}</p>
              <p><strong>Seasons Played:</strong> {game.career.seasons?.length || 0}</p>
              <p><strong>All-Star Games:</strong> {game.career.totals.allstars || 0}</p>
              <p><strong>Records Held:</strong> Coming Soon</p>
            </div>
          </div>
        </div>
        
        <div className="panel" style={{marginTop: '2rem', textAlign: 'center'}}>
          <h3>💫 Legacy Score</h3>
          <div style={{fontSize: '3rem', fontWeight: 'bold', color: getLegacyColor(calculateLegacyScore(game))}}>
            {calculateLegacyScore(game)}/100
          </div>
          <p style={{opacity: 0.8}}>Based on achievements, longevity, and impact</p>
        </div>
      </div>
    </div>
  );
}

// Helper functions for retirement features
function getOpportunityTitle(type) {
  const titles = {
    'head_coach': '🏀 Head Coach Position',
    'assistant_coach': '👥 Assistant Coach Position', 
    'general_manager': '💼 General Manager Position',
    'team_purchase': '🏢 Team Ownership Opportunity'
  };
  return titles[type] || 'Management Opportunity';
}

function getOpportunityGradient(type) {
  const gradients = {
    'head_coach': 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1))',
    'assistant_coach': 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))',
    'general_manager': 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.1))',
    'team_purchase': 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,107,53,0.2))'
  };
  return gradients[type] || 'rgba(100,100,100,0.1)';
}

function checkRequirement(game, req, value) {
  switch(req) {
    case 'reputation': return game.postRetirement.reputation >= value;
    case 'experience': return game.postRetirement.coachingExperience >= value;
    case 'cash': return game.cash >= value;
    default: return true;
  }
}

function canAcceptOpportunity(game, opportunity) {
  return Object.entries(opportunity.requirements).every(([req, value]) => 
    checkRequirement(game, req, value)
  );
}

function calculateLegacyScore(game) {
  let score = 0;
  const stats = game.career.totals;
  
  // Statistical achievements
  score += Math.min((stats.points || 0) / 300, 30); // Max 30 points for scoring
  score += (stats.titles || 0) * 15; // 15 points per championship
  score += (stats.mvps || 0) * 10; // 10 points per MVP
  score += (stats.allstars || 0) * 2; // 2 points per All-Star
  
  // Longevity
  score += Math.min((game.career.seasons?.length || 0), 20); // Max 20 for longevity
  
  // Hall of Fame bonus
  if (game.retirementCelebration?.hofResult?.inducted) {
    score += 20;
    if (game.retirementCelebration.hofResult.rank <= 10) score += 10;
  }
  
  return Math.min(Math.round(score), 100);
}

function getLegacyColor(score) {
  if (score >= 90) return '#ffd700'; // Gold
  if (score >= 75) return '#c0c0c0'; // Silver  
  if (score >= 60) return '#cd7f32'; // Bronze
  return '#6b7280'; // Gray
}

// ---------- Persistence ----------
function saveGame(game){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); }catch{} }
function loadGame(){ 
  try{ 
    const s = localStorage.getItem(STORAGE_KEY); 
    if (!s) return null;
    const game = JSON.parse(s);
    
    // Backward compatibility: Add appearance if missing
    if (game && !game.appearance) {
      game.appearance = generateAppearance();
    }
    
    return game;
  } catch { 
    return null; 
  } 
}
