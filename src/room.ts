// Earth Special Force — Game Room (Durable Object)
// Точка входа: lifecycle, WebSocket, игровой цикл, рассылка состояния.
// Вся игровая логика вынесена в модули: entity, player, bot, boss, combat, pickups, effects.

import type { Entity, SavedProfile, Projectile, Effect, Particle, Pickup, SpaceObject } from "./types";
import {
  TICK_RATE, WORLD_W, WORLD_H, MAX_PLAYERS,
  BOT_COLORS, BOSS_NAMES, BOSS_COLORS, makeId,
} from "./constants";
import { createEntity } from "./entity";
import { processPlayer } from "./player";
import { botAI } from "./bot";
import { bossAI } from "./boss";
import { updatePickups, spawnPickup } from "./pickups";
import { addParticles, updateProjectiles, updateEffects, updateParticles } from "./effects";
import { damageEntity } from "./combat";

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
  public spaceObjects: SpaceObject[] = [];
  private spaceSpawnTimer = 150;
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
        await this.addPlayer(ws, playerId, data.name, data.colors, data.password, data.look);
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

  private async addPlayer(ws: WebSocket, id: string, name: string, colors?: any, password?: string, look?: any) {
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
      if (look && typeof look === "object" && look.parts && look.colors) entity.look = look;
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
    this.updateSpaceObjects();
    this.broadcastState();
  }

  // === SPACE OBJECTS: обломки, астероиды, кометы, motherships, аномалии, радиация ===

  private updateSpaceObjects() {
    this.spaceSpawnTimer--;
    if (this.spaceSpawnTimer <= 0) {
      this.spaceSpawnTimer = 200 + Math.floor(Math.random() * 160);
      this.spawnSpaceObject();
    }
    // флаги "внутри поля" и кулдауны
    for (const t of this.entities.values()) {
      (t as any)._radIn = false;
      if ((t.objHitCd || 0) > 0) t.objHitCd!--;
    }
    for (let i = this.spaceObjects.length - 1; i >= 0; i--) {
      const o = this.spaceObjects[i];
      o.rot += o.rotSpeed;
      o.life--;
      // трение: запущенные объекты постепенно оседают
      if ((o.thrownTtl || 0) > 0) {
        o.thrownTtl--;
        o.vx *= 0.985; o.vy *= 0.985;
        if (o.thrownTtl <= 0 || Math.hypot(o.vx, o.vy) < 6) { o.thrownTtl = 0; }
      }
      o.x += o.vx; o.y += o.vy;

      // коллизия с сущностями: толкание + урон при быстром влёте
      for (const t of this.entities.values()) {
        if (t.hp <= 0) continue;
        const dx = o.x - t.x, dy = o.y - t.y;
        const d = Math.hypot(dx, dy);
        if (d < o.radius + t.radius && d > 0.01 && o.maxHp > 1) {
          // лёгкое смещение при касании (в 10 раз слабее раньше);
          // реальный запуск объекта — только броском из чарджа меле
          const nx = dx / d, ny = dy / d;
          const sp = Math.hypot(t.vx, t.vy);
          const push = Math.min(sp, 12) * (0.16 / o.mass);
          o.vx += nx * push + (t.vx / o.mass) * 0.08;
          o.vy += ny * push + (t.vy / o.mass) * 0.08;
          if (sp > 6 && (t.objHitCd || 0) <= 0 && o.maxHp > 1 && !(o.thrownBy === t.id)) {
            const bonus = o.type === "comet" ? 4 : o.type === "asteroid" ? 2 : 0;
            damageEntity(this, t, Math.round((sp - 5) * 0.9) + bonus, undefined);
            t.objHitCd = 25;
            this.broadcastEvent({ kind: "objHit" });
            addParticles(this, t.x, t.y, "#fbbf24", 8);
          }
        }
        // аномалия: притяжение + урон как у радиации
        if (o.type === "anomaly") {
          const da = Math.hypot(o.x - t.x, o.y - t.y);
          if (da < 320 && da > 10) { t.vx += ((o.x - t.x) / da) * 1.1; t.vy += ((o.y - t.y) / da) * 1.1; }
          if (da < o.radius + 70) (t as any)._radIn = true;
        }
        if (o.type === "radfield" && Math.hypot(o.x - t.x, o.y - t.y) < o.radius + t.radius) {
          (t as any)._radIn = true;
        }
      }
      if (o.type === "anomaly") {
        // притягивает и малые объекты
        for (const o2 of this.spaceObjects) {
          if (o2 === o || o2.mass >= 5) continue;
          const dx = o.x - o2.x, dy = o.y - o2.y;
          const d = Math.hypot(dx, dy);
          if (d < 320 && d > 10) { o2.vx += (dx / d) * 0.5; o2.vy += (dy / d) * 0.5; }
        }
        if (this.tick % 12 === 0) addParticles(this, o.x, o.y, "#a855f7", 2);
      }

      // запущенный объект — снаряд: бьёт врагов и другие объекты
      if ((o.thrownTtl || 0) > 0 && Math.hypot(o.vx, o.vy) > 7) {
        for (const t of this.entities.values()) {
          if (t.hp <= 0 || t.id === o.thrownBy) continue;
          if (Math.hypot(o.x - t.x, o.y - t.y) < o.radius + t.radius + 4) {
            damageEntity(this, t, Math.round(8 + o.mass * 6), this.entities.get(o.thrownBy || "") || undefined);
            const a = Math.atan2(t.y - o.y, t.x - o.x);
            t.vx += Math.cos(a) * 10; t.vy += Math.sin(a) * 10;
            t.stunTimer = 10; t.state = "KNOCKBACK"; t.stateTimer = 14;
            this.broadcastEvent({ kind: "objHit" });
            o.vx *= 0.4; o.vy *= 0.4;
            o.thrownTtl = Math.min(o.thrownTtl || 0, 8);
          }
        }
        for (const o2 of this.spaceObjects) {
          if (o2 === o || o2.maxHp <= 1) continue;
          if (Math.hypot(o.x - o2.x, o.y - o2.y) < o.radius + o2.radius) {
            this.damageSpaceObject(o2, 20);
            o.vx *= 0.5; o.vy *= 0.5;
          }
        }
      }

      const out = o.x < -160 || o.x > WORLD_W + 160 || o.y < -160 || o.y > WORLD_H + 160;
      if (o.life <= 0 || out) {
        if (o.grabbedBy) { const h = this.entities.get(o.grabbedBy); if (h) h.inGrabObj = null; }
        this.spaceObjects.splice(i, 1);
      }
    }
    // радиация/гравитация: рост урона внутри, истощение 1/3 снаружи
    for (const t of this.entities.values()) {
      if (t.hp <= 0) continue;
      if ((t as any)._radIn) {
        t.radTime = (t.radTime || 0) + 1;
        if (this.tick % 12 === 0) {
          const dmg = 2 + Math.floor((t.radTime || 0) / 24);
          damageEntity(this, t, dmg, undefined);
          addParticles(this, t.x, t.y, "#4ade80", 2);
          this.broadcastEvent({ kind: "radTick", name: t.name });
        }
      } else if ((t.radTime || 0) > 0) {
        if (t.radAfter === undefined || t.radAfter === null) t.radAfter = t.radTime;
        t.radAfter--;
        if (this.tick % 12 === 0) {
          const dmg = Math.max(1, Math.floor((2 + (t.radTime || 0) / 24) / 3));
          damageEntity(this, t, dmg, undefined);
          this.broadcastEvent({ kind: "radTick", name: t.name });
        }
        if ((t.radAfter || 0) <= 0) { t.radTime = 0; t.radAfter = undefined; }
      }
    }
  }

  private spawnSpaceObject() {
    const r = Math.random();
    const type = r < 0.28 ? "debris" : r < 0.5 ? "asteroid" : r < 0.66 ? "comet"
               : r < 0.78 ? "anomaly" : r < 0.9 ? "radfield" : "mothership";
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = -60; y = Math.random() * WORLD_H; }
    else if (side === 1) { x = WORLD_W + 60; y = Math.random() * WORLD_H; }
    else if (side === 2) { x = Math.random() * WORLD_W; y = -60; }
    else { x = Math.random() * WORLD_W; y = WORLD_H + 60; }
    const dir = Math.atan2(WORLD_H / 2 - y + (Math.random() - 0.5) * 700, WORLD_W / 2 - x + (Math.random() - 0.5) * 700);
    let vx = 0, vy = 0, radius = 14, hp = 100, life = 999999, mass = 1;
    if (type === "debris") { const sp = 0.6 + Math.random() * 0.8; vx = Math.cos(dir) * sp; vy = Math.sin(dir) * sp; }
    else if (type === "asteroid") { const sp = 0.3 + Math.random() * 0.5; vx = Math.cos(dir) * sp; vy = Math.sin(dir) * sp; radius = 26; hp = 100; mass = 4; }
    else if (type === "comet") { const sp = 1.4 + Math.random() * 1.2; vx = Math.cos(dir) * sp; vy = Math.sin(dir) * sp; radius = 16; hp = 100; mass = 2; }
    else if (type === "mothership") { const sp = 0.2 + Math.random() * 0.2; vx = Math.cos(dir) * sp; vy = Math.sin(dir) * sp; radius = 55; hp = 220; mass = 20; }
    else if (type === "anomaly") { vx = 0; vy = 0; radius = 30; hp = 1; life = 480; x = 200 + Math.random() * (WORLD_W - 400); y = 200 + Math.random() * (WORLD_H - 400); }
    else { vx = 0.1; vy = 0.05; radius = 80; hp = 1; life = 600; x = 200 + Math.random() * (WORLD_W - 400); y = 200 + Math.random() * (WORLD_H - 400); }
    this.spaceObjects.push({
      id: "so_" + makeId(), type, x, y, vx, vy,
      hp, maxHp: hp, radius, mass,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      life, shed: 0
    });
  }

  // урон объектам; mul — множитель (захваченный объект получает половину)
  public damageSpaceObject(o: SpaceObject, dmg: number, mul = 1) {
    if (o.maxHp <= 1) return; // аномалии и поля неразрушаимы
    o.hp -= dmg * mul;
    addParticles(this, o.x, o.y, "#9ca3af", 4);
    // mothership раскалывается на куски по мере урона
    if (o.type === "mothership" && o.hp > 0) {
      const chunk = 55;
      while (o.hp <= o.maxHp - chunk * ((o.shed || 0) + 1)) {
        o.shed = (o.shed || 0) + 1;
        const a = Math.random() * Math.PI * 2;
        this.spaceObjects.push({
          id: "so_" + makeId(), type: Math.random() < 0.6 ? "debris" : "asteroid",
          x: o.x + Math.cos(a) * o.radius * 0.6, y: o.y + Math.sin(a) * o.radius * 0.6,
          vx: Math.cos(a) * 3 + o.vx, vy: Math.sin(a) * 3 + o.vy,
          hp: 60, maxHp: 60, radius: 13, mass: 1,
          rot: Math.random() * 6, rotSpeed: (Math.random() - 0.5) * 0.1,
          life: 999999, shed: 0
        });
        addParticles(this, o.x, o.y, "#9ca3af", 15);
      }
    }
    if (o.hp <= 0) {
      addParticles(this, o.x, o.y, "#fbbf24", 30);
      if (Math.random() < 0.3) spawnPickup(this, o.x, o.y);
      this.broadcastEvent({ kind: "objExplode" });
      if (o.type === "mothership") {
        // взрыв mothership: 4 куска наружу
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + Math.random();
          this.spaceObjects.push({
            id: "so_" + makeId(), type: "debris",
            x: o.x, y: o.y,
            vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
            hp: 60, maxHp: 60, radius: 12, mass: 1,
            rot: Math.random() * 6, rotSpeed: (Math.random() - 0.5) * 0.12,
            life: 999999, shed: 0
          });
        }
      }
      const i = this.spaceObjects.indexOf(o);
      if (i >= 0) this.spaceObjects.splice(i, 1);
    }
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
          buffPower: e.buffPower, buffSpeed: e.buffSpeed, buffShield: e.buffShield, hairLen: e.hairLen,
          kamehaHands: e.kamehaHands, beamSide: e.beamSide,
          look: e.look,
          swordCharge: e.swordCharge, swordPower: e.swordPower, swordActiveTimer: e.swordActiveTimer,
          grabTarget: e.grabTarget, spinAngle: e.spinAngle, grabOrbitRadius: e.grabOrbitRadius,
          turbo: e.turbo, turboTimer: e.turboTimer,
          exp: e.exp, expToNext: e.expToNext,
        })),
        projectiles: this.projectiles, effects: this.effects, particles: this.particles,
        pickups: this.pickups, spaceObjects: this.spaceObjects, botKills: this.botKills
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
