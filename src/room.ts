// Earth Special Force — Game Room (Durable Object)

export interface Env {
  ROOM: DurableObjectNamespace;
  KV: KVNamespace;
}

type Vec2 = { x: number; y: number };
type TrailPoint = { x: number; y: number; life: number };

type EntityState =
  | "IDLE" | "WALK" | "DASH" | "SWOOP" | "MELEE" | "MELEE_CHARGE"
  | "GRAB" | "HIT" | "KI_CHARGE" | "KI_BLAST" | "TELEPORT"
  | "SUPER_ATTACK" | "KNOCKBACK" | "KAMEHAMEHA_CHARGE";

interface SavedProfile {
  name: string;
  password: string;
  level: number;
  exp: number;
  expToNext: number;
  maxHp: number;
  maxKi: number;
}

interface Entity {
  id: string;
  isBot: boolean;
  name: string;
  password?: string;
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  hp: number; maxHp: number;
  ki: number; maxKi: number;
  level: number;
  exp: number;
  expToNext: number;
  state: EntityState;
  stateTimer: number;
  facing: Vec2;
  comboCount: number;
  invincible: number;
  hitFlash: number;
  stunTimer: number;
  trail: TrailPoint[];
  colors: { hair: string; aura: string; kameha: string; trail: string };
  kamehamehaCharge: number;
  kamehamehaActive: boolean;
  kamehamehaMaxCharge: number;
  meleeCharge: number;
  meleeMaxCharge: number;
  inGrab: boolean;
  grabTarget: string | null;
  spinAngle: number;
  grabOrbitRadius: number;
  heldTicks: Record<string, number>;
  ws?: WebSocket;
  keys?: Record<string, boolean>;
  joyVector?: Vec2;
  joyActive?: boolean;
  lastDirKey?: string;
  keyDownTimes?: Record<string, number>;
  botTimer?: number;
  botTarget?: string | null;
  botAction?: string;
  turbo: boolean;
  turboTimer: number;
  oPressed: boolean;
}

interface Projectile {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  damage: number;
  size: number;
  color: string;
  owner: string;
}

interface Effect {
  type: string;
  angle: number;
  x: number; y: number;
  timer: number;
  damage: number;
  length: number;
  thickness: number;
  color: string;
  owner: string;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
  size: number;
}

const TICK_RATE = 1000 / 30;
const WORLD_W = 2000;
const WORLD_H = 1500;
const MAX_PLAYERS = 8;

const BOT_NAMES = ["Vegeta","Piccolo","Gohan","Trunks","Frieza","Cell","Buu","Broly","Jiren","Hit","Goku","Toppo"];
const BOT_COLORS = [
  {hair:"#fbbf24", aura:"#3b82f6", kameha:"#3b82f6", trail:"#22d3ee"},
  {hair:"#ef4444", aura:"#ef4444", kameha:"#ef4444", trail:"#fca5a5"},
  {hair:"#22c55e", aura:"#22c55e", kameha:"#4ade80", trail:"#86efac"},
  {hair:"#a855f7", aura:"#a855f7", kameha:"#c084fc", trail:"#d8b4fe"},
  {hair:"#f97316", aura:"#f97316", kameha:"#fb923c", trail:"#fdba74"},
  {hair:"#ec4899", aura:"#ec4899", kameha:"#f472b6", trail:"#fbcfe8"},
  {hair:"#14b8a6", aura:"#14b8a6", kameha:"#2dd4bf", trail:"#99f6e4"},
  {hair:"#6366f1", aura:"#6366f1", kameha:"#818cf8", trail:"#c7d2fe"},
];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class GameRoom {
  private tick = 0;
  private entities = new Map<string, Entity>();
  private projectiles: Projectile[] = [];
  private effects: Effect[] = [];
  private particles: Particle[] = [];
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
            if (ent.isBot) { this.entities.delete(eid); break; }
          }
        } else if (data.action === "add") {
          if (this.entities.size < MAX_PLAYERS) {
            const b = this.createEntity("bot_" + makeId(), true);
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
      for (const [eid, e] of this.entities) { if (e.isBot) { this.entities.delete(eid); break; } }

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
      const entity = this.createEntity(id, false, n, c, profile);
      if (pw) entity.password = pw;
      entity.ws = ws;
      this.entities.set(id, entity);
      this.broadcastPlayerList();
      this.fillBots();
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
      this.fillBots();
      if (this.getPlayerCount() === 0) this.stopTick();
    } catch (err) { console.error("removePlayer error:", err); }
  }

  private fillBots() {
    try { while (this.entities.size < MAX_PLAYERS) { const b = this.createEntity("bot_" + makeId(), true); this.entities.set(b.id, b); } }
    catch (err) { console.error("fillBots error:", err); }
  }

  private getPlayerCount() { let c = 0; for (const e of this.entities.values()) if (!e.isBot) c++; return c; }

  private createEntity(id: string, isBot: boolean, name?: string, colors?: any, profile?: SavedProfile): Entity {
    const c = colors || BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];
    const n = name || (isBot ? BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + " " + Math.floor(Math.random()*99) : "Warrior");
    const level = profile?.level ?? 1;
    const exp = profile?.exp ?? 0;
    const expToNext = profile?.expToNext ?? 100;
    const maxHp = profile?.maxHp ?? 100;
    const maxKi = profile?.maxKi ?? 100;
    return {
      id, isBot, name: n,
      x: 200 + Math.random() * (WORLD_W - 400),
      y: 200 + Math.random() * (WORLD_H - 400),
      vx: 0, vy: 0, radius: 18,
      hp: maxHp, maxHp, ki: maxKi, maxKi, level,
      exp, expToNext,
      state: "IDLE", stateTimer: 0,
      facing: { x: Math.random() > 0.5 ? 1 : -1, y: 0 },
      comboCount: 0, invincible: 0, hitFlash: 0, stunTimer: 0,
      trail: [], colors: c,
      kamehamehaCharge: 0, kamehamehaActive: false, kamehamehaMaxCharge: 150,
      meleeCharge: 0, meleeMaxCharge: 80,
      inGrab: false, grabTarget: null, spinAngle: 0, grabOrbitRadius: 45,
      heldTicks: {},
      keys: {}, joyVector: { x: 0, y: 0 }, joyActive: false, lastDirKey: "D", keyDownTimes: {},
      botTimer: 0, botTarget: null, botAction: "idle",
      turbo: false, turboTimer: 0, oPressed: false,
    };
  }

  private respawn(e: Entity) {
    e.hp = e.maxHp; e.ki = e.maxKi;
    e.x = 200 + Math.random() * (WORLD_W - 400);
    e.y = 200 + Math.random() * (WORLD_H - 400);
    e.vx = 0; e.vy = 0; e.state = "IDLE"; e.stateTimer = 0;
    e.inGrab = false; e.grabTarget = null;
    e.turbo = false; e.turboTimer = 0;
  }

  private gainExp(e: Entity, amount: number) {
    e.exp += amount;
    while (e.exp >= e.expToNext) {
      e.exp -= e.expToNext;
      e.level++;
      e.maxHp = Math.floor(e.maxHp * 1.01);
      e.maxKi = Math.floor(e.maxKi * 1.01);
      e.hp = Math.min(e.hp + Math.floor(e.maxHp * 0.3), e.maxHp);
      e.ki = Math.min(e.ki + Math.floor(e.maxKi * 0.3), e.maxKi);
      e.expToNext = Math.floor(e.expToNext * 1.2);
    }
  }

  private clampEntity(e: Entity) {
    e.x = Math.max(e.radius, Math.min(WORLD_W - e.radius, e.x));
    e.y = Math.max(e.radius, Math.min(WORLD_H - e.radius, e.y));
  }

  private gameTick() {
    this.tick++;
    for (const e of this.entities.values()) { if (e.isBot) this.botAI(e); else this.processPlayer(e); }
    this.updateProjectiles(); this.updateEffects(); this.updateParticles();
    this.broadcastState();
  }

  private processPlayer(e: Entity) {
    if (!Number.isFinite(e.stateTimer)) e.stateTimer = 0;
    if (!Number.isFinite(e.stunTimer)) e.stunTimer = 0;
    if (!Number.isFinite(e.invincible)) e.invincible = 0;
    if (!Number.isFinite(e.hitFlash)) e.hitFlash = 0;
    if (!Number.isFinite(e.ki)) e.ki = 0;
    if (!Number.isFinite(e.hp)) e.hp = 0;

    if (e.hp <= 0) { this.respawn(e); return; }
    if (e.invincible > 0) e.invincible--;
    if (e.hitFlash > 0) e.hitFlash--;

    if (e.stunTimer > 0) {
      e.stunTimer--;
      e.x += e.vx; e.y += e.vy;
      this.clampEntity(e);
      return;
    }

    if (e.stateTimer > 0) {
      e.stateTimer--;
      if (e.stateTimer === 0) {
        const endMap: Record<string, EntityState> = {
          DASH:"IDLE", KNOCKBACK:"IDLE", TELEPORT:"IDLE", SUPER_ATTACK:"IDLE",
          MELEE:"IDLE", GRAB:"IDLE", KI_BLAST:"IDLE", HIT:"IDLE"
        };
        if (endMap[e.state]) {
          e.state = endMap[e.state];
          if (e.state === "IDLE") { e.vx *= 0.3; e.vy *= 0.3; e.comboCount = 0; }
        }
      }
      if (e.state === "KNOCKBACK") { e.vx *= 0.92; e.vy *= 0.92; }
      e.x += e.vx; e.y += e.vy;
      this.clampEntity(e);
      return;
    }

    if (e.inGrab && e.state === "GRAB" && e.grabTarget) {
      const target = this.entities.get(e.grabTarget);
      if (target && target.hp > 0) {
        e.spinAngle += 0.18;
        const r = e.grabOrbitRadius;
        target.x = e.x + Math.cos(e.spinAngle) * r;
        target.y = e.y + Math.sin(e.spinAngle) * r;
        target.vx = 0; target.vy = 0; target.state = "HIT";
        if (e.stateTimer <= 0) {
          e.inGrab = false; e.state = "IDLE";
          const ang = Math.atan2(target.y - e.y, target.x - e.x);
          const force = 7 + Math.random() * 11;
          target.vx = Math.cos(ang) * force; target.vy = Math.sin(ang) * force;
          target.state = "KNOCKBACK"; target.stateTimer = 20; target.stunTimer = 12;
          this.damageEntity(target, 8, e);
          this.addParticles(target.x, target.y, "#ef4444", 25);
        }
      } else { e.inGrab = false; e.grabTarget = null; e.state = "IDLE"; }
      this.clampEntity(e);
      return;
    }

    // === TURBO (O) ===
    if (e.keys?.["O"] && !e.oPressed && !e.turbo && e.ki >= 15 &&
        (e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP" || e.state === "DASH")) {
      e.turbo = true; e.turboTimer = 180; e.ki -= 15; e.oPressed = true;
    }
    if (!e.keys?.["O"]) e.oPressed = false;
    if (e.turbo) {
      e.turboTimer--;
      if (e.turboTimer <= 0 || e.ki <= 0) { e.turbo = false; e.turboTimer = 0; }
      else e.ki -= 0.3;
    }

    if (e.state === "KAMEHAMEHA_CHARGE") {
      if (e.keys?.["U"] && e.ki > 1) {
        e.kamehamehaCharge++;
        e.ki -= 0.2;
        e.vx *= 0.1; e.vy *= 0.1;
        if (e.kamehamehaCharge >= e.kamehamehaMaxCharge) this.fireKamehameha(e);
      } else {
        this.fireKamehameha(e);
      }
      this.applyMovement(e);
      this.clampEntity(e);
      return;
    }

    if (e.state === "MELEE_CHARGE") {
      if (e.keys?.["K"] && e.ki > 0.5) {
        e.meleeCharge++;
        e.ki -= 0.25;
        e.vx *= 0.1; e.vy *= 0.1;
        if (this.tick % 3 === 0) {
          this.addParticles(e.x + (Math.random()-0.5)*20, e.y + (Math.random()-0.5)*20, e.colors.hair, 2);
        }
        if (e.meleeCharge >= e.meleeMaxCharge) this.fireMeleeCharge(e);
      } else {
        this.fireMeleeCharge(e);
      }
      this.applyMovement(e);
      this.clampEntity(e);
      return;
    }

    if (e.state === "KI_CHARGE") {
      if (e.keys?.["I"]) {
        e.vx *= 0.1; e.vy *= 0.1;
        if (e.ki < e.maxKi) e.ki += 0.9;
      } else {
        e.state = "IDLE";
      }
      e.x += e.vx; e.y += e.vy;
      this.clampEntity(e);
      return;
    }

    this.applyMovement(e);

    if (e.keys?.["DASH"] && (e.state === "IDLE" || e.state === "WALK")) {
      e.state = "DASH"; e.stateTimer = 10;
      const sp = 22;
      const fl = Math.hypot(e.facing.x, e.facing.y);
      if (fl > 0.001) { e.vx = (e.facing.x / fl) * sp; e.vy = (e.facing.y / fl) * sp; }
      e.keys["DASH"] = false;
    }

    if (e.state === "SWOOP" && e.keys?.["K"]) {
      e.state = "SUPER_ATTACK"; e.stateTimer = 18;
      this.meleeHit(e, 5, 55, true);
    }

    if (e.keys?.["J"] && e.state === "IDLE") {
      if (e.ki >= 5) {
        e.ki -= 5; e.state = "KI_BLAST"; e.stateTimer = 12;
        const fl = Math.hypot(e.facing.x, e.facing.y);
        const fx = fl > 0.001 ? e.facing.x / fl : 1;
        const fy = fl > 0.001 ? e.facing.y / fl : 0;
        this.projectiles.push({ x: e.x + fx * 25, y: e.y + fy * 25, vx: fx * 11, vy: fy * 11, life: 70, damage: 2, size: 7, color: e.colors.kameha, owner: e.id });
      }
    }

    if (e.keys?.["L"] && (e.state === "IDLE" || e.state === "WALK")) {
      const target = this.findGrabTarget(e);
      if (target) {
        e.state = "GRAB"; e.stateTimer = 90; e.inGrab = true;
        e.grabTarget = target.id; e.spinAngle = 0; target.state = "HIT";
      } else { e.state = "MELEE"; e.stateTimer = 15; }
    }

    if (e.keys?.["H"] && e.state === "IDLE") {
      e.state = "TELEPORT"; e.stateTimer = 6; e.invincible = 12;
      const d = 90;
      if (e.lastDirKey === "W") e.y -= d;
      if (e.lastDirKey === "S") e.y += d;
      if (e.lastDirKey === "A") e.x -= d;
      if (e.lastDirKey === "D") e.x += d;
      this.clampEntity(e);
      this.addParticles(e.x, e.y, e.colors.trail, 12);
    }

    if (e.keys?.["U"] && (e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP" || e.state === "DASH")) {
      e.kamehamehaActive = true; e.kamehamehaCharge = 0; e.state = "KAMEHAMEHA_CHARGE";
    }

    if (e.keys?.["K"] && (e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP" || e.state === "DASH")) {
      e.meleeCharge = 0; e.state = "MELEE_CHARGE";
    }

    if (e.keys?.["I"] && (e.state === "IDLE" || e.state === "WALK")) {
      e.state = "KI_CHARGE";
    }

    this.clampEntity(e);
    if (e.ki < e.maxKi) e.ki += 0.06;
  }

  private applyMovement(e: Entity) {
    const isLocked = e.state === "MELEE_CHARGE" || e.state === "KAMEHAMEHA_CHARGE" || e.stateTimer > 0;
    let dx = 0, dy = 0;
    if (e.keys?.["W"]) dy = -1;
    if (e.keys?.["S"]) dy = 1;
    if (e.keys?.["A"]) dx = -1;
    if (e.keys?.["D"]) dx = 1;
    if (e.joyActive && e.joyVector) { dx = e.joyVector.x; dy = e.joyVector.y; }
    if (!e.joyActive && dx !== 0 && dy !== 0) { const len = Math.hypot(dx, dy); dx /= len; dy /= len; }
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
      e.facing = { x: dx, y: dy };
      if (Math.abs(dx) > Math.abs(dy)) e.lastDirKey = dx > 0 ? "D" : "A";
      else e.lastDirKey = dy > 0 ? "S" : "W";
    }

    for (const k of ["W","A","S","D"]) { if (e.keys?.[k]) e.heldTicks[k] = (e.heldTicks[k] || 0) + 1; else e.heldTicks[k] = 0; }
    if (e.joyActive) e.heldTicks["JOY"] = (e.heldTicks["JOY"] || 0) + 1; else e.heldTicks["JOY"] = 0;

    const anyHeld = e.keys?.["W"] || e.keys?.["A"] || e.keys?.["S"] || e.keys?.["D"] || e.joyActive;
    let held = 0;
    for (const k of ["W","A","S","D","JOY"]) held = Math.max(held, e.heldTicks[k] || 0);

    const canSwoop = e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP" || isLocked;
    if (anyHeld && canSwoop) {
      if (held > 10 && e.ki > 0) {
        if (!isLocked) e.state = "SWOOP";
        e.ki -= e.turbo ? 0.8 : 0.4;
        const sp = e.turbo ? 14 : 9;
        if (e.joyActive && e.joyVector) { e.vx = e.joyVector.x * sp; e.vy = e.joyVector.y * sp; }
        else { e.vx = dx * sp; e.vy = dy * sp; }
      } else {
        if (!isLocked) e.state = "WALK";
        const sp = 3.5;
        if (e.joyActive && e.joyVector) { e.vx = e.joyVector.x * sp; e.vy = e.joyVector.y * sp; }
        else { e.vx = dx * sp; e.vy = dy * sp; }
      }
    } else {
      if (e.state === "SWOOP" && !isLocked) e.state = "IDLE";
      if (!isLocked) {
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          e.state = "WALK";
          const sp = 3.5;
          e.vx = dx * sp; e.vy = dy * sp;
        } else {
          e.state = "IDLE";
          e.vx *= 0.85; e.vy *= 0.85;
        }
      } else {
        e.vx *= 0.85; e.vy *= 0.85;
      }
    }

    e.x += e.vx; e.y += e.vy;
    this.clampEntity(e);
    if (Math.abs(e.vx) > 4 || Math.abs(e.vy) > 4) {
      e.trail.push({ x: e.x, y: e.y, life: 10 });
    }
    e.trail = e.trail.filter(t => { t.life--; return t.life > 0; });
  }

  private botAI(b: Entity) {
    if (!Number.isFinite(b.stateTimer)) b.stateTimer = 0;
    if (!Number.isFinite(b.stunTimer)) b.stunTimer = 0;
    if (!Number.isFinite(b.invincible)) b.invincible = 0;
    if (!Number.isFinite(b.hitFlash)) b.hitFlash = 0;
    if (b.hp <= 0) { this.respawn(b); return; }
    if (b.invincible > 0) b.invincible--;
    if (b.hitFlash > 0) b.hitFlash--;
    if (b.stunTimer > 0) { b.stunTimer--; b.x += b.vx; b.y += b.vy; this.clampEntity(b); return; }
    if (b.stateTimer > 0) {
      b.stateTimer--;
      if (b.stateTimer === 0) {
        const endMap: Record<string, EntityState> = { DASH:"IDLE", KNOCKBACK:"IDLE", TELEPORT:"IDLE", SUPER_ATTACK:"IDLE", MELEE:"IDLE", GRAB:"IDLE", KI_BLAST:"IDLE", HIT:"IDLE" };
        if (endMap[b.state]) { b.state = endMap[b.state]; if (b.state === "IDLE") { b.vx *= 0.3; b.vy *= 0.3; b.comboCount = 0; } }
      }
      if (b.state === "KNOCKBACK") { b.vx *= 0.92; b.vy *= 0.92; }
      b.x += b.vx; b.y += b.vy; this.clampEntity(b); return;
    }

    // === BOT CHARGE STATES ===
    if (b.state === "KAMEHAMEHA_CHARGE") {
      if (b.kamehamehaCharge < b.kamehamehaMaxCharge && b.ki > 1) {
        b.kamehamehaCharge++;
        b.ki -= 0.25;
        b.vx *= 0.1; b.vy *= 0.1;
        // bots release early sometimes, or hold to max
        if (b.kamehamehaCharge >= b.kamehamehaMaxCharge || Math.random() < 0.04) {
          this.fireKamehameha(b);
        }
      } else {
        this.fireKamehameha(b);
      }
      return;
    }

    if (b.state === "MELEE_CHARGE") {
      if (b.meleeCharge < b.meleeMaxCharge && b.ki > 0.5) {
        b.meleeCharge++;
        b.ki -= 0.25;
        b.vx *= 0.1; b.vy *= 0.1;
        if (this.tick % 3 === 0) {
          this.addParticles(b.x + (Math.random()-0.5)*20, b.y + (Math.random()-0.5)*20, b.colors.hair, 2);
        }
        if (b.meleeCharge >= b.meleeMaxCharge || Math.random() < 0.06) {
          this.fireMeleeCharge(b);
        }
      } else {
        this.fireMeleeCharge(b);
      }
      return;
    }

    let nearest: Entity | null = null; let minD = Infinity;
    for (const t of this.entities.values()) { if (t.id === b.id || t.hp <= 0) continue; const d = dist(b, t); if (d < minD) { minD = d; nearest = t; } }
    if (!nearest) { b.vx *= 0.9; b.vy *= 0.9; b.state = "IDLE"; return; }
    b.botTarget = nearest.id;
    const dx = nearest.x - b.x; const dy = nearest.y - b.y; const d = Math.hypot(dx, dy);
    b.facing = { x: dx / d || 1, y: dy / d || 0 };
    b.botTimer = (b.botTimer || 0) + 1;
    if (b.botTimer % 8 === 0) {
      const r = Math.random();
      b.botAction = "idle";
      if (d < 70 && b.ki > 8 && r > 0.55) b.botAction = "meleeCharge";
      else if (d < 55 && b.ki > 5) b.botAction = r > 0.4 ? "melee" : "kiblast";
      else if (d < 220 && b.ki > 10 && r > 0.3) b.botAction = "kiblast";
      else if (d < 500 && b.ki > 45 && r > 0.85) b.botAction = "kamehameha";
      else if (d > 150 && d < 350 && b.ki > 15 && r > 0.9) b.botAction = "swoop";
      else if (d > 80) b.botAction = "chase";
      else if (b.ki < 25 && r > 0.6) b.botAction = "charge";
      if (b.hp < 35 && r > 0.75) b.botAction = "teleport";
    }
    switch (b.botAction) {
      case "chase": { const sp = 3.4; b.vx = (dx / d) * sp; b.vy = (dy / d) * sp; b.state = "WALK"; break; }
      case "melee": { b.state = "MELEE"; b.stateTimer = 10; b.comboCount++; const dmg = 2 + Math.min(b.comboCount, 3); for (const t of this.entities.values()) { if (t.id === b.id || t.hp <= 0) continue; const tx = t.x - b.x, ty = t.y - b.y; if (Math.hypot(tx, ty) < 50 && (tx * b.facing.x + ty * b.facing.y) > 0) { this.damageEntity(t, dmg, b); t.stunTimer = 10; t.vx = b.facing.x * 4; t.vy = b.facing.y * 4; } } break; }
      case "meleeCharge": { b.meleeCharge = 0; b.state = "MELEE_CHARGE"; break; }
      case "kiblast": { if (b.ki < 5) break; b.ki -= 5; b.state = "KI_BLAST"; b.stateTimer = 12; const fl = Math.hypot(b.facing.x, b.facing.y); const fx = fl > 0.001 ? b.facing.x / fl : 1; const fy = fl > 0.001 ? b.facing.y / fl : 0; this.projectiles.push({ x: b.x + fx * 25, y: b.y + fy * 25, vx: fx * 11, vy: fy * 11, life: 70, damage: 2, size: 7, color: b.colors.kameha, owner: b.id }); break; }
      case "kamehameha": { b.kamehamehaActive = true; b.kamehamehaCharge = 0; b.state = "KAMEHAMEHA_CHARGE"; break; }
      case "swoop": { b.state = "SWOOP"; b.ki -= 0.5; const sp = 11; b.vx = b.facing.x * sp; b.vy = b.facing.y * sp; break; }
      case "teleport": { b.state = "TELEPORT"; b.stateTimer = 6; b.invincible = 12; const ang = Math.random() * Math.PI * 2; b.x += Math.cos(ang) * 100; b.y += Math.sin(ang) * 100; this.clampEntity(b); this.addParticles(b.x, b.y, b.colors.trail, 10); break; }
      case "charge": { b.state = "KI_CHARGE"; b.vx *= 0.1; b.vy *= 0.1; if (b.ki < b.maxKi) b.ki += 0.9; break; }
      default: { b.vx *= 0.85; b.vy *= 0.85; b.state = "IDLE"; }
    }
    b.x += b.vx; b.y += b.vy; this.clampEntity(b);
    if (b.ki < b.maxKi) b.ki += 0.06;
  }

  private meleeHit(attacker: Entity, damage: number, range: number, isSwoop: boolean) {
    for (const t of this.entities.values()) {
      if (t.id === attacker.id || t.hp <= 0) continue;
      const dx = t.x - attacker.x; const dy = t.y - attacker.y; const d = Math.hypot(dx, dy); const dot = dx * attacker.facing.x + dy * attacker.facing.y;
      if (d < range && dot > 0) {
        this.damageEntity(t, damage, attacker);
        t.stunTimer = isSwoop ? 20 : 10;
        t.vx = attacker.facing.x * (isSwoop ? 10 : 4); t.vy = attacker.facing.y * (isSwoop ? 10 : 4);
        t.state = "KNOCKBACK"; t.stateTimer = isSwoop ? 20 : 10;
      }
    }
  }

  private fireMeleeCharge(e: Entity) {
    const charge = Math.max(1, e.meleeCharge || 0);
    const ratio = Math.min(1, charge / e.meleeMaxCharge);
    const damage = Math.floor(Math.min(60, 5 + charge * 0.9));
    const range = Math.min(90, 45 + charge * 0.6);
    const knockback = 5 + ratio * 12;
    e.state = "MELEE";
    e.stateTimer = 10;
    e.meleeCharge = 0;
    let hit = false;
    for (const t of this.entities.values()) {
      if (t.id === e.id || t.hp <= 0) continue;
      const dx = t.x - e.x, dy = t.y - e.y;
      if (Math.hypot(dx, dy) < range && (dx * e.facing.x + dy * e.facing.y) > 0) {
        hit = true;
        this.damageEntity(t, damage, e);
        t.stunTimer = 15 + Math.floor(ratio * 15);
        t.vx = e.facing.x * knockback; t.vy = e.facing.y * knockback;
        t.state = "KNOCKBACK"; t.stateTimer = 20 + Math.floor(ratio * 15);
        this.addParticles(t.x, t.y, ratio > 0.7 ? "#ef4444" : "#fbbf24", 20);
      }
    }
    if (!hit) this.addParticles(e.x + e.facing.x * 30, e.y + e.facing.y * 30, "#94a3b8", 8);
    else this.addParticles(e.x, e.y, e.colors.hair, 15);
  }

  private fireKamehameha(e: Entity) {
    const charge = Math.max(1, e.kamehamehaCharge || 0);
    const damage = Math.floor(Math.min(120, 15 + charge * 0.7));
    const thickness = Math.min(110, 25 + charge * 0.6);
    const length = Math.min(700, 250 + charge * 3);
    const angle = Math.atan2(e.facing.y, e.facing.x);
    e.state = "SUPER_ATTACK"; e.stateTimer = 50;
    e.kamehamehaActive = false; e.kamehamehaCharge = 0;
    this.effects.push({ type: "kamehameha", angle, x: e.x, y: e.y, timer: 50, damage, length, thickness, color: e.colors.kameha, owner: e.id });
    this.addParticles(e.x, e.y, e.colors.kameha, 30);
  }

  private findGrabTarget(e: Entity): Entity | null {
    for (const t of this.entities.values()) { if (t.id === e.id || t.hp <= 0) continue; if (Math.hypot(t.x - e.x, t.y - e.y) < 45) return t; }
    return null;
  }

  private damageEntity(target: Entity, amount: number, attacker: Entity) {
    target.hp -= amount; target.hitFlash = 10;

    // EXP за КАЖДОЕ повреждение (будь то бот или игрок)
    if (attacker && !attacker.isBot && target.id !== attacker.id && amount > 0) {
      const expGain = Math.max(1, Math.ceil(amount * 0.8));
      this.gainExp(attacker, expGain);
    }

    if (target.hp <= 0) target.hp = 0;
    this.addParticles(target.x, target.y, "#ef4444", 5);
  }

  private addParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 20 + Math.random() * 10, color, size: Math.random() * 3 + 2 });
    }
  }

  private updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]; p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) { this.projectiles.splice(i, 1); continue; }
      const owner = this.entities.get(p.owner);
      for (const t of this.entities.values()) {
        if (t.id === p.owner || t.hp <= 0) continue;
        if (Math.hypot(p.x - t.x, p.y - t.y) < t.radius + p.size + 5) { this.damageEntity(t, p.damage, owner || { id: p.owner } as Entity); this.projectiles.splice(i, 1); break; }
      }
    }
  }

  private updateEffects() {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i]; e.timer--;
      if (e.timer <= 0) { this.effects.splice(i, 1); continue; }
      if (e.type === "kamehameha") {
        const fx = Math.cos(e.angle), fy = Math.sin(e.angle);
        const owner = this.entities.get(e.owner);
        for (const t of this.entities.values()) {
          if (t.id === e.owner || t.hp <= 0) continue;
          const dx = t.x - e.x, dy = t.y - e.y;
          const proj = dx * fx + dy * fy; const perp = Math.abs(dx * fy - dy * fx);
          if (proj > 0 && proj < e.length && perp < e.thickness / 2 + t.radius) {
            this.damageEntity(t, e.damage / 15, owner || { id: e.owner } as Entity);
            t.vx += fx * 2.5; t.vy += fy * 2.5;
          }
        }
      }
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private broadcastState() {
    try {
      const payload = {
        type: "state", tick: this.tick,
        entities: Array.from(this.entities.values()).map(e => ({
          id: e.id, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp,
          ki: e.ki, maxKi: e.maxKi, level: e.level, state: e.state,
          facing: e.facing, hitFlash: e.hitFlash, invincible: e.invincible,
          colors: e.colors, name: e.name, trail: e.trail.slice(-6),
          kamehamehaCharge: e.kamehamehaCharge, kamehamehaActive: e.kamehamehaActive,
          meleeCharge: e.meleeCharge, isBot: e.isBot,
          grabTarget: e.grabTarget, spinAngle: e.spinAngle, grabOrbitRadius: e.grabOrbitRadius,
          turbo: e.turbo, turboTimer: e.turboTimer,
          exp: e.exp, expToNext: e.expToNext,
        })),
        projectiles: this.projectiles, effects: this.effects, particles: this.particles
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
}