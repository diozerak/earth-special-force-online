// Ссылки на DOM-элементы

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');
export const minimap = document.getElementById('minimap');
export const mmCtx = minimap.getContext('2d');

export const lobby = document.getElementById('lobby');
export const lobbyName = document.getElementById('lobby-name');
export const lobbyPassword = document.getElementById('lobby-password');
export const lobbyRoom = document.getElementById('lobby-room');
export const lobbyPlayers = document.getElementById('lobby-players');
export const startBtn = document.getElementById('start-btn');

export const colHair = document.getElementById('col-hair');
export const colAura = document.getElementById('col-aura');
export const colKameha = document.getElementById('col-kameha');
export const colTrail = document.getElementById('col-trail');

export const hud = document.getElementById('hud');
export const hpText = document.getElementById('hpText');
export const kiText = document.getElementById('kiText');
export const expText = document.getElementById('expText');
export const hpFill = document.getElementById('hp-fill');
export const kiFill = document.getElementById('ki-fill');
export const expFill = document.getElementById('exp-fill');
export const stateText = document.getElementById('state-text');
export const levelText = document.getElementById('levelText');

export const stateBox = document.getElementById('state-box');
export const buffs = document.getElementById('buffs');
export const buffPower = document.getElementById('buff-power');
export const buffPowerT = document.getElementById('buff-power-t');
export const buffSpeed = document.getElementById('buff-speed');
export const buffSpeedT = document.getElementById('buff-speed-t');
export const buffShield = document.getElementById('buff-shield');
export const buffShieldT = document.getElementById('buff-shield-t');

export const chargeBar = document.getElementById('charge-bar');
export const chargeFill = document.getElementById('charge-fill');
export const chargeLabel = document.getElementById('charge-label');

export const leaderboard = document.getElementById('leaderboard');
export const lbBody = document.getElementById('lb-body');
export const bossProgress = document.getElementById('boss-progress');

export const bossBarWrap = document.getElementById('boss-bar-wrap');
export const bossBarName = document.getElementById('boss-bar-name');
export const bossBarFill = document.getElementById('boss-bar-fill');

export const eventBanner = document.getElementById('event-banner');
export const logEl = document.getElementById('log');

export const joyZone = document.getElementById('joystick-zone');
export const joyKnob = document.getElementById('joystick-knob');
export const actionZone = document.getElementById('action-zone');

export const settingsBtn = document.getElementById('settings-btn');
export const settingsPanel = document.getElementById('settings-panel');
export const toggleLog = document.getElementById('toggle-log');
export const volSlider = document.getElementById('vol-slider');
export const botAdd = document.getElementById('bot-add');
export const botRemove = document.getElementById('bot-remove');
