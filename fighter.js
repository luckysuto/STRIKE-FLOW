
import { MOVES } from "./moves.js";

const FLOOR = 460;
const GRAVITY = 1500;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

export class Fighter {
  constructor(def, x, dir = 1, color = null) {
    this.def = def;

    this.id = def.id;
    this.name = def.name;
    this.color = color || def.color;

    this.maxHp = def.hp;
    this.hp = def.hp;

    this.x = x;
    this.y = FLOOR;

    this.vx = 0;
    this.vy = 0;

    this.dir = dir;

    this.width =
      def.id === "tank" ? 54 : 38;

    this.height =
      def.id === "tank" ? 106 : 94;

    this.speed = 180 + def.speed * 13;

    this.ground = true;
    this.jumps = 0;

    this.stun = 0;
    this.recovery = 0;
    this.landingRecovery = 0;

    this.guard = false;
    this.guardAge = 10;
    this.guardHp = 100;

    this.dodgeTime = 0;
    this.dodgeRecovery = 0;

    this.dashTime = 0;
    this.dashDir = dir;

    this.move = null;
    this.moveTime = 0;
    this.moveHit = false;
    this.moveBlocked = false;

    this.combo = 0;
    this.comboTimer = 0;
    this.lastHitName = "";

    this.escapeWindow = 0;
    this.escapeLock = 0;

    this.flash = 0;
  }

  // ジャンプ（二段ジャンプ対応）
  jump() {
    if (
      this.stun > 0 ||
      this.recovery > 0 ||
      this.landingRecovery > 0 ||
      this.dodgeRecovery > 0
    ) {
      return false;
    }

    if (this.jumps >= 2) return false;

    this.vy = this.jumps === 0 ? -640 : -570;

    this.jumps++;
    this.ground = false;

    return true;
  }

  // ダッシュ
  beginDash(direction) {
    if (
      this.stun > 0 ||
      this.recovery > 0 ||
      this.dodgeRecovery > 0
    ) {
      return false;
    }

    this.dashDir = direction >= 0 ? 1 : -1;
    this.dir = this.dashDir;

    this.dashTime = 0.13;
    this.vx = this.dashDir * this.speed * 2.5;

    return true;
  }

  // 回避
  beginDodge(direction) {
    if (
      this.stun > 0 ||
      this.recovery > 0 ||
      this.dodgeRecovery > 0 ||
      this.dodgeTime > 0
    ) {
      return false;
    }

    this.dodgeTime = 0.17;
    this.dodgeRecovery = 0.25;

    this.vx =
      (direction >= 0 ? 1 : -1) *
      this.speed *
      2.7;

    return true;
  }

  // 攻撃を開始
  beginMove(name) {
    if (
      this.stun > 0 ||
      this.landingRecovery > 0 ||
      this.dodgeRecovery > 0
    ) {
      return false;
    }

    const move = MOVES[name];

    if (!move) return false;

    // 攻撃後の隙が残っている場合は
    // 命中した攻撃からのみキャンセル可能
    if (
      this.recovery > 0 &&
      !this.moveHit
    ) {
      return false;
    }

    const data = {
      ...move,
      name,
      label: move.label || name
    };

    // 固有技のキャラクター別設定
    if (name === "skill1" || name === "skill2") {
      const index = name === "skill1" ? 0 : 1;

      data.label =
        this.def.skills?.[index] ||
        move.label;
    }

    // 必殺技のキャラクター別設定
    if (name.startsWith("super")) {
      const index =
        Number(name.slice(-1)) - 1;

      data.label =
        this.def.supers?.[index] ||
        move.label;
    }

    this.move = data;
    this.moveTime = 0;
    this.moveHit = false;
    this.moveBlocked = false;

    this.recovery =
      data.start +
      data.active +
      data.recovery;

    this.guard = false;

    // 技ごとの前進
    if (data.advance) {
      this.vx =
        this.dir * data.advance;
    }

    // 打ち上げ系の技
    if (data.launch && !this.ground) {
      this.vy = Math.min(this.vy, -120);
    }

    return true;
  }

  // ダメージ・ガード判定
  takeHit(move, attacker) {
    if (this.dodgeTime > 0) {
      return "miss";
    }

    const facingAttacker =
      (attacker.x - this.x) * this.dir >= 0;

    const canGuard =
      this.guard &&
      facingAttacker &&
      !move.grab;

    if (canGuard) {
      // ジャストガード
      if (this.guardAge <= 0.2) {
        attacker.stun = Math.max(
          attacker.stun,
          0.28
        );

        attacker.recovery = Math.max(
          attacker.recovery,
          0.25
        );

        this.guardHp = clamp(
          this.guardHp + 8,
          0,
          100
        );

        this.flash = 0.13;

        return "parry";
      }

      // 通常ガード
      this.guardHp -=
        move.damage * 4;

      attacker.recovery += 0.12;
      attacker.moveBlocked = true;

      if (this.guardHp <= 0) {
        this.guardHp = 35;
        this.guard = false;

        this.stun = 0.65;
        this.flash = 0.25;

        return "break";
      }

      return "block";
    }

    // コンボ中のダメージ補正
    const continuing =
      this.comboTimer > 0;

    if (continuing) {
      this.combo++;
    } else {
      this.combo = 1;
    }

    const multiplier = Math.min(
      1.5,
      1 + (this.combo - 1) * 0.05
    );

    const attackFactor =
      0.75 + attacker.def.attack * 0.05;

    const defenseFactor =
      1.15 - this.def.defense * 0.035;

    const damage = Math.max(
      1,
      Math.round(
        move.damage *
        multiplier *
        attackFactor *
        defenseFactor
      )
    );

    this.hp = Math.max(
      0,
      this.hp - damage
    );

    // 同じ技の連発は硬直が短くなる
    const repeatFactor =
      this.lastHitName === move.name
        ? 0.72
        : 1;

    this.stun =
      (move.stun || 0.28) *
      repeatFactor;

    this.recovery = 0;
    this.move = null;
    this.moveHit = false;

    this.flash = 0.16;

    // ノックバック
    this.vx =
      attacker.dir *
      (move.knockback || 180);

    if (move.launch) {
      this.vy = -540;
      this.ground = false;
    }

    this.comboTimer = 1.1;
    this.lastHitName = move.name;

    // 新しい左右入力で脱出できる時間
    this.escapeWindow = 0.15;

    return "hit";
  }

  // キャラクターの毎フレーム更新
  update(dt, opponent, actions = {}) {
    const decrease = (value) =>
      Math.max(0, value - dt);

    this.stun = decrease(this.stun);
    this.recovery = decrease(this.recovery);
    this.landingRecovery =
      decrease(this.landingRecovery);

    this.dodgeTime = decrease(this.dodgeTime);
    this.dodgeRecovery =
      decrease(this.dodgeRecovery);

    this.dashTime = decrease(this.dashTime);

    this.comboTimer = decrease(this.comboTimer);
    this.escapeWindow =
      decrease(this.escapeWindow);
    this.escapeLock =
      decrease(this.escapeLock);

    this.flash = decrease(this.flash);

    // ガード
    const wantsGuard =
      Boolean(actions.guard);

    if (
      wantsGuard &&
      this.stun <= 0 &&
      this.recovery <= 0
    ) {
      if (!this.guard) {
        this.guardAge = 0;
      }

      this.guard = true;
      this.guardAge += dt;
    } else {
      this.guard = false;
      this.guardAge = 10;
    }

    if (!this.guard) {
      this.guardHp = clamp(
        this.guardHp + dt * 13,
        0,
        100
      );
    }

    // 攻撃時間
    if (this.move) {
      this.moveTime += dt;

      const total =
        this.move.start +
        this.move.active +
        this.move.recovery;

      if (this.moveTime >= total) {
        this.move = null;
        this.moveHit = false;
      }
    }

    // 横移動
    const direction =
      Number(Boolean(actions.right)) -
      Number(Boolean(actions.left));

    if (
      direction !== 0 &&
      this.stun <= 0 &&
      this.recovery <= 0 &&
      this.dodgeTime <= 0 &&
      this.dodgeRecovery <= 0 &&
      this.landingRecovery <= 0 &&
      this.dashTime <= 0
    ) {
      this.dir = direction;

      const airFactor =
        this.ground ? 1 : 0.65;

      this.vx =
        direction *
        this.speed *
        airFactor;
    } else if (
      this.dashTime <= 0 &&
      this.dodgeTime <= 0
    ) {
      this.vx *= Math.max(
        0,
        1 - dt * 9
      );
    }

    // 重力
    if (!this.ground) {
      this.vy += GRAVITY * dt;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 左右の画面端はループ
    if (this.x < -this.width / 2) {
      this.x = 960 + this.width / 2;
    }

    if (this.x > 960 + this.width / 2) {
      this.x = -this.width / 2;
    }

    // 着地
    if (this.y >= FLOOR) {
      if (!this.ground) {
        this.landingRecovery = 0.15;
      }

      this.y = FLOOR;
      this.vy = 0;
      this.ground = true;
      this.jumps = 0;
    }
  }
}
