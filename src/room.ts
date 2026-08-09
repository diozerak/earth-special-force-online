// Earth Special Force — Game Room (Durable Object)
// Точка входа: lifecycle, WebSocket, игровой цикл, рассылка состояния.
// Вся игровая логика вынесена в модули: entity, player, bot, boss, combat, pickups, effects.

import type { Entity, SavedProfile, Projectile, Effect, Particle, Pickup } from "./types";
import {
  TICK_RATE, WORLD_W, WORLD_H, MAX_PLAYERS,
  BOT_COLORS, BOSS_NAMES, BOSS_COLORS, makeId,
} from "./constants";
import { createEntity } from "./entity";
import { processPlayer } from "./player";
import { botAI } from "./bot";
import { bossAI } from "./boss";
import { updatePickups } from "./pickups";
import { addParticles, updateProjectiles, updateEffects, updateParticles } from "./effects";

export interface Env {
  ROOM: DurableObjectNamespace;
  KV: KVNamespace;
}

export class GameRoom {
  public tick = 0;
  public entities = new Map<string, Entity>();
  public projectiles: Projectile[] = [];
  public effects: Effect[] = [];
  public particles: Particle[] = [];
  public pickups: Pickup[] = [];
  public botKills = 0;
  private running = false;
  private timeoutId: any = null;

  constructor(private ctx: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }
    if (this.getPlayerCount() >= MAX_PLAYERS) {
      return new Response("Room full", { status: 403 });
    }
    const playerId = makeId();
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server, [playerId]);
    server.send(JSON.stringify({ type: "init", id: playerId, world: { w: WORLD_W, h: WORLD_H } }));
    if (!this.running) { this.running = true; this.scheduleTick(); }
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;
    try {
      const data = JSON.parse(message);
      const tags = this.ctx.getTags(ws);
      const playerId = tags[0];
      if (!playerId) return;
      if (data.type === "join") {
        await this.addPlayer(ws, playerId, data.name, data.colors, data.password);
        return;
      }
      const entity = this.entities.get(playerId);
      if (!entity || entity.isBot) return;
      if (data.type === "input") {
        entity.keys = data.keys || {};
        entity.joyVector = data.joyVector || { x: 0, y: 0 };
        entity.joyActive = data.joyActive || false;
        if (data.lastDirKey) entity.lastDirKey = data.lastDirKey;
        if (data.keyDownTimes) entity.keyDownTimes = data.keyDownTimes;
      }
      if (data.type === "botControl") {
        if (data.action === "remove") {
          for (const [eid, ent] of this.entities) {
            if (ent.isBot && !ent.isBoss) { this.entities.delete(eid); break; }
          }
        } else if (data.action === "add") {
          if (this.entities.size < MAX_PLAYERS) {
            const b = createEntity("bot_" + makeId(), true);
            this.entities.set(b.id, b);
          }
        }
        this.broadcastPlayerList();
        return;
      }
    } catch (err) { console.error("ws msg error:", err); }
  }

  async webSocketClose(ws: WebSocket) {
    try {
      const tags = this.ctx.getTags(ws);
      const playerId = tags[0];
      if (playerId) {
        const entity = this.entities.get(playerId);
        if (entity) await this.saveProfile(entity);
        this.removePlayer(playerId);
      }
    } catch (err) { console.error("ws close error:", err); }
  }

  private scheduleTick() {
    if (!this.running) return;
    this.timeoutId = setTimeout(() => {
      try { this.gameTick(); } catch (err) { console.error("tick error:", err); }
      this.scheduleTick();
    }, TICK_RATE);
  }

  private stopTick() {
    this.running = false;
    if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
  }

  private async addPlayer(ws: WebSocket, id: string, name: string, colors?: any, password?: string) {
    try {
      if (this.entities.size >= MAX_PLAYERS) {
        ws.send(JSON.stringify({ type: "error", message: "Room full" }));
        ws.close(); return;
      }

      let profile: SavedProfile | undefined = undefined;
      const n = (name || "Warrior").trim();
      const pw = (password || "").trim();
      if (pw && this.env.KV) {
        try {
          const stored = await this.env.KV.get(`profile:${n}`);
          if (stored) {
            const data = JSON.parse(stored) as SavedProfile;
            if (data.password === pw) profile = data;
          }
        } catch {}
      }

      const c = colors || BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];
      const entity = createEntity(id, false, n, c, profile);
      if (pw) entity.password = pw;
      entity.ws = ws;
      this.entities.set(id, entity);
      this.broadcastPlayerList();
    } catch (err) { console.error("addPlayer error:", err); }
  }

  private async saveProfile(e: Entity) {
    if (e.isBot || !e.password || !this.env.KV) return;
    try {
      const payload: SavedProfile = {
        name: e.name,
        password: e.password,
        level: e.level,
        exp: e.exp,
        expToNext: e.expToNext,
        maxHp: e.maxHp,
        maxKi: e.maxKi,
      };
      await this.env.KV.put(`profile:${e.name}`, JSON.stringify(payload));
    } catch (err) { console.error("saveProfile error:", err); }
  }

  private removePlayer(id: string) {
    try {
      this.entities.delete(id);
      this.broadcastPlayerList();
      if (this.getPlayerCount() === 0) this.stopTick();
    } catch (err) { console.error("removePlayer error:", err); }
  }

  private getPlayerCount() { let c = 0; for (const e of this.entities.values()) if (!e.isBot) c++; return c; }

  // === BOSS ===

  public getBoss(): Entity | undefined {
    for (const e of this.entities.values()) if (e.isBoss) return e;
    return undefined;
  }

  public spawnBoss(): void {
    if (this.getBoss()) return;
    const name = BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)];
    const b = createEntity("boss_" + makeId(), true, name, BOSS_COLORS);
    b.isBoss = true; b.bossPhase = 1; b.bossTimer = 90;
    b.maxHp = 1500; b.hp = 1500; b.radius = 34; b.level = 99;
    b.kamehamehaMaxCharge = 220; b.meleeMaxCharge = 60;
    b.x = WORLD_W / 2; b.y = WORLD_H / 2;
    b.vx = 0; b.vy = 0;
    this.entities.set(b.id, b);
    this.broadcastEvent({ kind: "bossSpawn", name });
    addParticles(this, b.x, b.y, "#ef4444", 60);
  }

  // === GAME LOOP ===

  private gameTick() {
    this.tick++;
    for (const e of this.entities.values()) {
      if ((e.buffPower || 0) > 0) e.buffPower--;
      if ((e.buffSpeed || 0) > 0) e.buffSpeed--;
      if ((e.buffShield || 0) > 0) { e.buffShield--; e.invincible = Math.max(e.invincible, 2); }
      if (e.isBot && e.isBoss) bossAI(this, e);
      else if (e.isBot) botAI(this, e);
      else processPlayer(this, e);
    }
    updateProjectiles(this);
    updateEffects(this);
    updatePickups(this);
    updateParticles(this);
    this.broadcastState();
  }

  // === BROADCAST ===

  private broadcastState() {
    try {
      const payload = {
        type: "state", tick: this.tick,
        entities: Array.from(this.entities.values()).map(e => ({
          id: e.id, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp,
          ki: e.ki, maxKi: e.maxKi, level: e.level, state: e.state,
          facing: e.facing, hitFlash: e.hitFlash, invincible: e.invincible,
          colors: e.colors, name: e.name, trail: e.trail.slice(-6),
          kamehamehaCharge: e.kamehamehaCharge, kamehamehaActive: e.kamehamehaActive, kamehamehaMaxCharge: e.kamehamehaMaxCharge,
          kiBlastCharge: e.kiBlastCharge, kiBlastMaxCharge: e.kiBlastMaxCharge, kiBlastActive: e.state === "KI_BEAM_CHARGE",
          meleeCharge: e.meleeCharge, isBot: e.isBot, isBoss: e.isBoss, bossPhase: e.bossPhase,
          buffPower: e.buffPower, buffSpeed: e.buffSpeed, buffShield: e.buffShield,
          grabTarget: e.grabTarget, spinAngle: e.spinAngle, grabOrbitRadius: e.grabOrbitRadius,
          turbo: e.turbo, turboTimer: e.turboTimer,
          exp: e.exp, expToNext: e.expToNext,
        })),
        projectiles: this.projectiles, effects: this.effects, particles: this.particles,
        pickups: this.pickups, botKills: this.botKills
      };
      const msg = JSON.stringify(payload);
      for (const ws of this.ctx.getWebSockets()) { try { ws.send(msg); } catch {} }
    } catch (err) { console.error("broadcast error:", err); }
  }

  private broadcastPlayerList() {
    try {
      const list = Array.from(this.entities.values()).filter(e => !e.isBot).map(e => ({ id: e.id, name: e.name, colors: e.colors }));
      const msg = JSON.stringify({ type: "playerList", list });
      for (const ws of this.ctx.getWebSockets()) { try { ws.send(msg); } catch {} }
    } catch (err) { console.error("list error:", err); }
  }

  public broadcastEvent(ev: any) {
    try {
      const msg = JSON.stringify({ type: "event", ...ev });
      for (const ws of this.ctx.getWebSockets()) { try { ws.send(msg); } catch {} }
    } catch (err) { console.error("event error:", err); }
  }
}
