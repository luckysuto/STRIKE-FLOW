
/*
 * STRIKE FLOW
 * CPU AI
 *
 * easy   : 初級
 * normal : 中級
 * hard   : 上級
 */

const SETTINGS = {
  easy: {
    reaction: 0.42,
    attackChance: 0.42,
    guardChance: 0.08,
    dodgeChance: 0.03,
    comboChance: 0.10,
    escapeChance: 0.05
  },

  normal: {
    reaction: 0.23,
    attackChance: 0.68,
    guardChance: 0.26,
    dodgeChance: 0.12,
    comboChance: 0.48,
    escapeChance: 0.24
  },

  hard: {
    reaction: 0.11,
    attackChance: 0.88,
    guardChance: 0.48,
    dodgeChance: 0.27,
    comboChance: 0.82,
    escapeChance: 0.58
  }
};

const random = () => Math.random();

export class CPU {
  constructor(difficulty = "normal") {
    this.settings =
      SETTINGS[difficulty] || SETTINGS.normal;

    this.thinkTimer = 0;
    this.attackTimer = 0;

    this.lastAction = null;

    this.comboCount = 0;
    this.guardTimer = 0;

    this.current = {
      left: false,
      right: false,
      guard: false
    };
  }

  update(dt, self, enemy) {
    const cfg = this.settings;

    this.thinkTimer -= dt;
    this.attackTimer -= dt;
    this.guardTimer -= dt;

    const result = {
      left: this.current.left,
      right: this.current.right,
      guard: this.current.guard,
      jump: false,
      dash: false,
      dodge: false,
      move: null,
      escape: false,
      justGuard: false
    };

    // コンボを受けている場合
    if (self.stun > 0) {
      result.left = false;
      result.right = false;
      result.guard = false;

      if (
        self.escapeWindow > 0 &&
        random() <
          cfg.escapeChance * dt * 7
      ) {
        result.escape = true;
      }

      return result;
    }

    // 思考タイミングまで待つ
    if (this.thinkTimer > 0) {
      return result;
    }

    this.thinkTimer =
      cfg.reaction *
      (0.75 + random() * 0.5);

    const dx = enemy.x - self.x;
    const distance = Math.abs(dx);

    const toward = dx >= 0 ? 1 : -1;

    const enemyAttacking =
      Boolean(enemy.move) &&
      enemy.moveTime <
        enemy.move.start +
        enemy.move.active;

    const danger =
      enemyAttacking &&
      distance < 165;

    // 移動方向を決定
    let direction = 0;

    if (distance > 115) {
      direction = toward;
    } else if (distance < 45) {
      direction = -toward;
    } else if (random() < 0.16) {
      direction = -toward;
    }

    this.current.left = direction < 0;
    this.current.right = direction > 0;
    this.current.guard = false;

    result.left = this.current.left;
    result.right = this.current.right;

    // 危険な攻撃への対処
    if (danger) {
      if (random() < cfg.dodgeChance) {
        result.dodge = true;
        return result;
      }

      if (random() < cfg.guardChance) {
        this.current.guard = true;
        result.guard = true;

        if (
          cfg.reaction < 0.2 &&
          random() < 0.35
        ) {
          result.justGuard = true;
        }

        return result;
      }
    }

    // 遠距離から接近
    if (distance > 260) {
      if (random() < 0.35) {
        result.dash = true;
      }

      if (random() < 0.09) {
        result.jump = true;
      }

      return result;
    }

    // 攻撃できる状態か
    const canAttack =
      self.recovery <= 0 ||
      self.moveHit;

    if (!canAttack) return result;

    if (distance > 165) {
      if (random() < 0.25) {
        result.dash = true;
      }

      return result;
    }

    if (random() > cfg.attackChance) {
      return result;
    }

    // 連続攻撃
    const chaining =
      self.moveHit &&
      random() < cfg.comboChance;

    if (chaining) {
      this.comboCount++;
    } else {
      this.comboCount = 0;
    }

    const available = [
      "punch",
      "kick",
      "upper",
      "tackle",
      "grab"
    ];

    // 難易度による技の追加
    if (cfg.comboChance > 0.3) {
      available.push(
        "skill1",
        "skill2",
        "super1"
      );
    }

    if (cfg.comboChance > 0.7) {
      available.push(
        "super2",
        "super3"
      );
    }

    let chosen = available[
      Math.floor(
        random() * available.length
      )
    ];

    // 空中にいる場合は空中攻撃
    if (!self.ground) {
      chosen = "air";
    }

    // コンボ中は連携向きの技を優先
    if (chaining) {
      const comboMoves = [
        "punch",
        "kick",
        "upper",
        "skill1",
        "super1"
      ];

      chosen = comboMoves[
        Math.floor(
          random() * comboMoves.length
        )
      ];
    }

    // 長いコンボの偏りを抑制
    if (this.comboCount >= 6) {
      chosen = "super3";
      this.comboCount = 0;
    }

    result.move = chosen;
    this.lastAction = chosen;

    return result;
  }
}
