
import { ROSTER } from "./moves.js";
import { Fighter } from "./fighter.js";
import { CPU } from "./cpu.js";
import { Renderer } from "./render.js";

export class Game {
  constructor(canvas, input, ui) {
    this.input = input;
    this.ui = ui;
    this.renderer = new Renderer(canvas);

    this.state = "menu";
    this.pause = false;

    this.time = 60;
    this.wins = [0, 0];
    this.round = 1;

    this.last = 0;
    this.acc = 0;

    this.skillAt = -10;
    this.roundWait = 0;

    this.setup(0, "normal", 0);
  }

  // 対戦設定
  setup(character, difficulty, stage, color) {
    this.playerDef = ROSTER[character] || ROSTER[0];

    this.difficulty = difficulty || "normal";
    this.renderer.stage = Number(stage) || 0;

    this.color = color || this.playerDef.color;

    this.wins = [0, 0];
    this.round = 1;

    this.startRound();
    this.state = "menu";
  }

  // 新しいラウンドを準備
  startRound() {
    this.player = new Fighter(
      this.playerDef,
      240,
      1,
      this.color
    );

    const opponents = ROSTER.filter(
      (character) =>
        character.id !== this.playerDef.id
    );

    const randomIndex = Math.floor(
      Math.random() * opponents.length
    );

    const enemyDef = opponents[randomIndex];

    this.enemy = new Fighter(
      enemyDef,
      720,
      -1
    );

    this.cpu = new CPU(this.difficulty);

    this.time = 60;
    this.roundWait = 1.4;
    this.skillAt = -10;

    this.input.reset();

    this.renderer.announce(
      `ROUND ${this.round}`,
      1.1
    );
  }

  // 試合開始
  start(character, difficulty, stage, color) {
    this.setup(
      character,
      difficulty,
      stage,
      color
    );

    this.state = "fight";
    this.pause = false;

    this.ui.overlay.classList.add("hidden");

    this.ui.status.textContent = "FIGHT";

    this.ui.message.textContent =
      "コンボをつなげて勝利しよう！";
  }

  // ラウンド終了
  endRound(winner) {
    if (this.state !== "fight") return;

    this.state = "roundEnd";

    if (winner >= 0) {
      this.wins[winner]++;
    }

    const message =
      winner < 0
        ? "DRAW"
        : winner === 0
          ? "ROUND WIN!"
          : "ROUND LOSE!";

    this.renderer.announce(message, 2);

    this.roundWait = 2.1;

    this.ui.message.textContent =
      winner < 0
        ? "引き分け！ 両者の勝利数は増えません"
        : winner === 0
          ? "ラウンド勝利！"
          : "ラウンド敗北";
  }

  // 試合終了
  finish() {
    this.state = "result";

    const won = this.wins[0] >= 2;

    this.renderer.announce(
      won ? "YOU WIN!" : "CPU WINS",
      99
    );

    this.ui.status.textContent =
      won ? "VICTORY" : "DEFEAT";

    this.ui.message.textContent =
      `試合終了：${this.wins[0]} - ${this.wins[1]}`;

    // 戦績をブラウザに保存
    try {
      const saved = JSON.parse(
        localStorage.getItem(
          "strike-flow-stats"
        ) || '{"wins":0,"losses":0}'
      );

      if (won) {
        saved.wins++;
      } else {
        saved.losses++;
      }

      localStorage.setItem(
        "strike-flow-stats",
        JSON.stringify(saved)
      );
    } catch (error) {
      console.warn(
        "戦績を保存できませんでした",
        error
      );
    }

    this.ui.showResult(won, this.wins);
  }

  // プレイヤーの操作
  processPlayer(dt) {
    const input = this.input;
    const player = this.player;

    const left = input.is("left");
    const right = input.is("right");

    const horizontal =
      Number(right) - Number(left);

    const actions = {
      left,
      right,
      guard: input.is("guard")
    };

    // 左右入力とダッシュ
    for (const key of ["left", "right"]) {
      if (!input.hit(key)) continue;

      const direction =
        key === "left" ? -1 : 1;

      if (player.stun > 0) {
        // コンボ脱出の受付時間内のみ有効
        const windowOpen =
          player.escapeWindow > 0;

        if (
          windowOpen &&
          player.escapeLock <= 0
        ) {
          player.stun = 0;
          player.vx = direction * 170;
          player.x += direction * 20;

          player.escapeLock = 0.25;
          player.escapeWindow = 0;

          this.renderer.burst(
            player.x,
            player.y - 50,
            "#7ee9ff",
            7
          );

          this.ui.message.textContent =
            "COMBO ESCAPE!";
        }

        continue;
      }

      const now = performance.now() / 1000;

      player.lastTapDir ||= {};

      const previous =
        player.lastTapDir[key] ?? -10;

      if (now - previous < 0.24) {
        player.beginDash(direction);
      }

      player.lastTapDir[key] = now;
    }

    // ジャンプ
    if (input.hit("jump")) {
      player.jump();
    }

    // 回避
    if (input.hit("dodge")) {
      player.beginDodge(
        horizontal || -player.dir
      );
    }

    // ダッシュボタン
    if (input.hit("dash")) {
      player.beginDash(
        horizontal || player.dir
      );
    }

    // 通常攻撃
    if (input.hit("attack")) {
      let move = "punch";

      if (!player.ground) {
        move = "air";
      } else if (input.is("jump")) {
        move = "upper";
      } else if (input.is("guard")) {
        move = "grab";
      } else if (horizontal === player.dir) {
        move = "kick";
      } else if (horizontal === -player.dir) {
        move = "tackle";
      }

      player.beginMove(move);
    }

    // 固有技：2回押し
    if (input.hit("skill")) {
      const now = performance.now() / 1000;

      if (now - this.skillAt < 0.34) {
        player.beginMove(
          horizontal !== 0
            ? "skill2"
            : "skill1"
        );

        this.skillAt = -10;
      } else {
        this.skillAt = now;
      }
    }

    // 3種類の必殺技
    for (const key of [
      "super1",
      "super2",
      "super3"
    ]) {
      if (input.hit(key)) {
        player.beginMove(key);
      }
    }

    player.update(
      dt,
      this.enemy,
      actions
    );
  }

  // CPUの操作
  processCPU(dt) {
    const enemy = this.enemy;

    const actions = this.cpu.update(
      dt,
      enemy,
      this.player
    );

    if (actions.justGuard) {
      enemy.guard = false;
      enemy.guardAge = 0;
    }

    if (actions.dodge) {
      enemy.beginDodge(
        Math.sign(
          enemy.x - this.player.x
        ) || 1
      );
    }

    if (actions.dash) {
      enemy.beginDash(
        Math.sign(
          this.player.x - enemy.x
        ) || 1
      );
    }

    if (actions.jump) {
      enemy.jump();
    }

    if (actions.move) {
      enemy.beginMove(actions.move);
    }

    if (
      actions.escape &&
      enemy.stun > 0 &&
      enemy.escapeWindow > 0 &&
      enemy.escapeLock <= 0
    ) {
      enemy.stun = 0;
      enemy.escapeWindow = 0;
      enemy.escapeLock = 0.3;
      enemy.x += enemy.dir * 30;
    }

    enemy.update(
      dt,
      this.player,
      actions
    );
  }

  // 攻撃が命中したか判定
  collisions() {
    const pairs = [
      [this.player, this.enemy],
      [this.enemy, this.player]
    ];

    let candidates = [];

    for (const [attacker, defender] of pairs) {
      const move = attacker.move;

      if (
        !move ||
        attacker.moveHit ||
        attacker.stun > 0
      ) {
        continue;
      }

      // 技の有効時間
      const active =
        attacker.moveTime >= move.start &&
        attacker.moveTime <=
          move.start + move.active;

      if (!active) continue;

      const dx = defender.x - attacker.x;

      const dy = Math.abs(
        (defender.y - defender.height * 0.55) -
        (attacker.y - attacker.height * 0.55)
      );

      const inFront =
        dx * attacker.dir >= -14;

      const inRange =
        dx * attacker.dir <
        move.range + defender.width * 0.4;

      if (
        inFront &&
        inRange &&
        dy < 85
      ) {
        candidates.push({
          attacker,
          defender,
          move
        });
      }
    }

    // 同時攻撃は優先度で判定
    if (candidates.length === 2) {
      const [first, second] = candidates;

      if (
        first.move.priority ===
        second.move.priority
      ) {
        for (const hit of candidates) {
          hit.attacker.moveHit = true;
          hit.attacker.stun = Math.max(
            hit.attacker.stun,
            0.18
          );
        }

        this.renderer.burst(
          (this.player.x + this.enemy.x) / 2,
          Math.min(
            this.player.y,
            this.enemy.y
          ) - 50,
          "#ffffff",
          12
        );

        return;
      }

      candidates = [
        first.move.priority >
        second.move.priority
          ? first
          : second
      ];
    }

    // ダメージとガードの処理
    for (const hit of candidates) {
      const {
        attacker,
        defender,
        move
      } = hit;

      const result = defender.takeHit(
        move,
        attacker
      );

      if (result === "miss") continue;

      attacker.moveHit = true;

      if (result === "hit") {
        this.renderer.burst(
          defender.x,
          defender.y - 50,
          attacker.color,
          12
        );

        this.ui.message.textContent =
          `${attacker.name}：${move.label}`;

        // HPが0になったら即終了
        if (defender.hp <= 0) {
          this.endRound(
            attacker === this.player ? 0 : 1
          );
        }
      } else if (result === "parry") {
        this.renderer.burst(
          defender.x,
          defender.y - 50,
          "#83f1ff",
          16
        );

        this.ui.message.textContent =
          "JUST GUARD!";
      } else if (result === "break") {
        this.renderer.burst(
          defender.x,
          defender.y - 50,
          "#ffdd7b",
          16
        );

        this.ui.message.textContent =
          "GUARD BREAK!";
      } else if (result === "block") {
        this.renderer.burst(
          defender.x,
          defender.y - 50,
          "#9eb7cc",
          5
        );
      }
    }
  }

  // ゲームの時間を進める
  step(dt) {
    this.renderer.update(dt);

    if (
      this.pause ||
      this.state === "menu" ||
      this.state === "result"
    ) {
      return;
    }

    // ラウンド終了後の処理
    if (this.state === "roundEnd") {
      this.roundWait -= dt;

      if (this.roundWait <= 0) {
        if (
          this.wins[0] >= 2 ||
          this.wins[1] >= 2
        ) {
          this.finish();
        } else {
          this.round++;
          this.startRound();
          this.state = "fight";
        }
      }

      return;
    }

    // 開始前のカウント
    if (this.roundWait > 0) {
      this.roundWait -= dt;
      return;
    }

    // 60秒の制限時間
    this.time = Math.max(
      0,
      this.time - dt
    );

    this.processPlayer(dt);
    this.processCPU(dt);
    this.collisions();

    if (this.state !== "fight") return;

    // 時間切れは引き分け
    if (this.time <= 0) {
      this.endRound(-1);
    }
  }

  // 毎フレーム実行
  frame(time) {
    if (!this.last) {
      this.last = time;
    }

    const delta = Math.min(
      0.05,
      (time - this.last) / 1000
    );

    this.last = time;
    this.acc += delta;

    let loops = 0;

    // 固定時間刻みでゲームを更新
    while (
      this.acc >= 1 / 120 &&
      loops < 8
    ) {
      this.step(1 / 120);
      this.acc -= 1 / 120;
      loops++;
    }

    if (loops >= 8) {
      this.acc = 0;
    }

    this.renderer.render(this);

    this.input.clearFrame();

    requestAnimationFrame(
      (nextTime) => this.frame(nextTime)
    );
  }
}
