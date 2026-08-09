// Константы и мелкие хелперы

import type { EntityState, PickupType, Vec2 } from "./types";

export const TICK_RATE = 1000 / 30;
export const WORLD_W = 2000;
export const WORLD_H = 1500;
export const MAX_PLAYERS = 8;
export const BOSSES_EVERY_KILLS = 10;

export const BOT_NAMES = ["Vegeta","Piccolo","Gohan","Trunks","Frieza","Cell","Buu","Broly","Jiren","Hit","Goku","Toppo"];
export const BOSS_NAMES = ["BROLY","OMEGA SHENRON","JANEMBA","HIRUDEGARN","GOKU BLACK","BABIDI'S MAJIN"];
export const BOSS_COLORS = { hair: "#450a0a", aura: "#dc2626", kameha: "#ef4444", trail: "#f87171" };

export const PICKUP_TYPES: PickupType[] = ["heal", "ki", "power", "speed", "shield"];
export const PICKUP_COLORS: Record<PickupType, string> = {
  heal: "#22c55e", ki: "#3b82f6", power: "#ef4444", speed: "#fbbf24", shield: "#e2e8f0"
};
export const PICKUP_DURATION: Record<PickupType, number> = {
  heal: 0, ki: 0, power: 360, speed: 300, shield: 150
};

export const BOT_COLORS = [
  {hair:"#fbbf24", aura:"#3b82f6", kameha:"#3b82f6", trail:"#22d3ee"},
  {hair:"#ef4444", aura:"#ef4444", kameha:"#ef4444", trail:"#fca5a5"},
  {hair:"#22c55e", aura:"#22c55e", kameha:"#4ade80", trail:"#86efac"},
  {hair:"#a855f7", aura:"#a855f7", kameha:"#c084fc", trail:"#d8b4fe"},
  {hair:"#f97316", aura:"#f97316", kameha:"#fb923c", trail:"#fdba74"},
  {hair:"#ec4899", aura:"#ec4899", kameha:"#f472b6", trail:"#fbcfe8"},
  {hair:"#14b8a6", aura:"#14b8a6", kameha:"#2dd4bf", trail:"#99f6e4"},
  {hair:"#6366f1", aura:"#6366f1", kameha:"#818cf8", trail:"#c7d2fe"},
];

// Какие стейты завершаются переходом в IDLE (используется в player.ts и bot.ts)
export const END_STATE_MAP: Record<string, EntityState> = {
  DASH: "IDLE", KNOCKBACK: "IDLE", TELEPORT: "IDLE", SUPER_ATTACK: "IDLE",
  MELEE: "IDLE", SLASH: "IDLE", KI_BLAST: "IDLE", HIT: "IDLE"
};

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
