# Basketball Life Simulation

A comprehensive basketball team management simulation built with React and Vite. Experience the complexity of managing a professional basketball team with advanced player psychology, health management, and team dynamics.

## Installation and Setup

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Getting Started

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production-ready application
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code analysis

## Game Overview

Basketball Life Simulation offers an immersive team management experience featuring realistic player behavior, complex team dynamics, and strategic decision-making. The game emphasizes psychological realism and statistical depth.

## Core Game Systems

### 1. Player Morale System

The morale system tracks ten distinct factors that influence player performance and behavior:

**Morale Factors:**
- **Playing Time**: Satisfaction with minutes allocated per game
- **Team Performance**: Reaction to team wins and losses
- **Contract Satisfaction**: Contentment with current salary and terms
- **Role Clarity**: Understanding of position and expectations
- **Coach Relationship**: Personal connection with coaching staff
- **Team Chemistry**: Bonds with teammates and locker room atmosphere
- **Media Attention**: Response to press coverage and public perception
- **Injury Concerns**: Physical health and recovery status
- **Trade Rumors**: Stability and security within organization
- **Personal Life**: External factors affecting focus and motivation

**Morale Effects:**
- Performance modifiers ranging from -20% to +20%
- Trade request probability calculations
- Contract negotiation leverage
- Team chemistry influence
- Media interaction outcomes

### 2. Player Personality System

Each player possesses eight core personality traits that affect all aspects of gameplay:

**Personality Dimensions:**
- **Extroversion** (0-100): Social interaction preferences and leadership tendencies
- **Agreeableness** (0-100): Cooperation level and conflict resolution style
- **Conscientiousness** (0-100): Work ethic and preparation dedication
- **Neuroticism** (0-100): Emotional stability and pressure response
- **Openness** (0-100): Adaptability to new strategies and change acceptance
- **Competitiveness** (0-100): Drive to win and individual achievement focus
- **Leadership** (0-100): Natural authority and team guidance ability
- **Loyalty** (0-100): Organization commitment and retention likelihood

**Personality Applications:**
- Training response rates and improvement speed
- Contract negotiation behavior and demands
- Team chemistry compatibility calculations
- Injury recovery attitudes and compliance
- Media interaction styles and controversy likelihood
- Trade acceptance and adaptation periods

### 3. Dynamic Player Chemistry

The chemistry system models complex interpersonal relationships between teammates:

**Relationship Types:**
- **Best Friends**: Maximum positive chemistry bonus (+15 performance)
- **Good Friends**: Strong positive relationship (+10 performance)
- **Friendly**: Positive working relationship (+5 performance)
- **Neutral**: No significant impact (0 performance change)
- **Tension**: Mild negative relationship (-5 performance)
- **Rivals**: Strong negative chemistry (-10 performance)

**Chemistry Mechanics:**
- Weekly relationship evolution based on personality compatibility
- Team bonding activities to improve overall chemistry
- Conflict resolution for negative relationships
- Performance multipliers based on on-court partnerships
- Trade impact analysis for team dynamics
- Veteran leadership influence on younger players

### 4. Comprehensive Injury Tracking

The injury system provides realistic health management with long-term consequences:

**Injury Categories:**
- **Minor Injuries**: 1-2 week recovery, minimal long-term impact
- **Moderate Injuries**: 3-6 week recovery, slight performance reduction
- **Major Injuries**: 6+ week recovery, significant stat impact
- **Career-Threatening**: Potential permanent effects and early retirement
- **Chronic Conditions**: Ongoing management and periodic flare-ups
- **Acute Trauma**: Immediate severe injuries requiring emergency care
- **Overuse Syndromes**: Gradual development from excessive training

**Injury Management:**
- Risk assessment based on age, position, and play style
- Recovery tracking with medical staff efficiency ratings
- Career impact calculations for major injuries
- Insurance considerations and salary implications
- Player psychology effects during rehabilitation
- Return-to-play protocols and re-injury prevention

### 5. Advanced Fatigue Management

The fatigue system balances player energy across multiple time scales:

**Energy Levels:**
- **Fresh** (90-100%): Peak performance capability
- **Slightly Tired** (70-89%): Minor performance reduction
- **Tired** (50-69%): Noticeable stat decreases
- **Exhausted** (30-49%): Significant performance impact
- **Depleted** (0-29%): Severe limitations and injury risk

**Recovery Options:**
- **Full Rest**: Complete recovery but no skill development
- **Light Practice**: Moderate recovery with minimal training
- **Active Recovery**: Balanced approach with maintenance work
- **Normal Training**: Standard practice load with gradual recovery
- **Intensive Training**: Maximum development but increased fatigue

**Fatigue Factors:**
- Game minutes and intensity levels
- Practice participation and training load
- Age-related recovery rate differences
- Injury status affecting energy restoration
- Seasonal accumulation and playoff intensity

## User Interface Features

### Dashboard Overview
- Team performance metrics and standings
- Player status indicators and alerts
- Weekly schedule and upcoming events
- Financial summary and salary cap status

### Player Management
- Individual player cards with comprehensive statistics
- Personality trait visualization and compatibility analysis
- Injury reports and recovery timelines
- Morale tracking and improvement recommendations

### Team Operations
- Lineup optimization based on chemistry and fatigue
- Training program customization for individual players
- Contract negotiation interface with personality-driven outcomes
- Trade evaluation tools with chemistry impact analysis

### Analytics and Reports
- Performance trend analysis across multiple seasons
- Injury pattern recognition and prevention strategies
- Morale correlation studies and team culture assessment
- Financial projections and roster planning tools

## Game Complexity and Depth

### Simulation Accuracy
The game employs realistic statistical models based on professional basketball analytics. Player development follows age curves, performance metrics correlate with real-world factors, and team success depends on both talent and management decisions.

### Strategic Decision Making
Success requires balancing multiple competing priorities: salary cap management, player development, chemistry optimization, injury prevention, and performance maximization. Each decision creates cascading effects throughout the organization.

### Long-term Consequences
Player actions and management decisions have lasting impacts spanning multiple seasons. Building a championship team requires careful planning, relationship management, and strategic vision extending beyond immediate results.

## Technical Architecture

### Frontend Framework
- React 18 with functional components and hooks
- Vite for fast development and optimized builds
- Modern JavaScript with ES6+ features
- CSS with glassmorphism design principles

### State Management
- Comprehensive application state with complex data relationships
- Efficient update patterns for real-time simulation
- Local storage persistence for game saves
- Performance optimization for large datasets

### Code Organization
- Modular system architecture with clear separation of concerns
- Reusable utility functions for complex calculations
- Component-based UI with consistent design patterns
- Extensible framework for future feature additions

## Development Roadmap

The game follows a structured 100-commit development plan across five phases:

**Phase 1**: Core Enhancement (Advanced player management and team dynamics)
**Phase 2**: Advanced Features (Scouting, draft system, and complex negotiations)
**Phase 3**: UI Revolution (3D visualization and immersive interfaces)
**Phase 4**: Analytics and AI (Machine learning and predictive modeling)
**Phase 5**: Next-Generation Features (Virtual reality and multiplayer modes)

Current implementation includes the foundational systems for player psychology, health management, and team dynamics, establishing the framework for advanced features in subsequent development phases.
