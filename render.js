
/*
 * STRIKE FLOW
 * Rendering System
 */

const WIDTH = 960;
const HEIGHT = 540;
const FLOOR = 460;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    this.ctx.imageSmoothingEnabled = false;

    this.stage = 0;
    this.particles = [];
    this.announcement = "";
    this.announcementTime = 0;
    this.shake = 0;
    this.flash = 0;
    this.frameCount = 0;
  }

  announce(text, duration = 1.5) {
    this.announcement = text;
    this.announcementTime = duration;
  }

  burst(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 240;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.18 + Math.random() * 0.3,
        maxLife: 0.48,
        size: 3 + Math.random() * 6,
        color
      });
    }

    this.shake = Math.max(this.shake, 5);
    this.flash = Math.max(this.flash, 0.055);

    if (this.particles.length > 180) {
      this.particles.splice(
        0,
        this.particles.length - 180
      );
    }
  }

  update(dt) {
    this.frameCount++;

    this.announcementTime = Math.max(
      0,
      this.announcementTime - dt
    );

    this.shake = Math.max(
      0,
      this.shake - dt * 35
    );

    this.flash = Math.max(
      0,
      this.flash - dt
    );

    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 500 * dt;
      particle.life -= dt;
    }

    this.particles = this.particles.filter(
      (particle) => particle.life > 0
    );
  }

  drawStage() {
    const ctx = this.ctx;

    const backgrounds = [
      {
        sky: "#151f32",
        wall: "#24354e",
        floor: "#354762",
        line: "#607b9b"
      },
      {
        sky: "#242035",
        wall: "#41304e",
        floor: "#4b3d60",
        line: "#8c729b"
      },
      {
        sky: "#171b20",
        wall: "#303842",
        floor: "#48525e",
        line: "#7c8b99"
      }
    ];

    const theme =
      backgrounds[this.stage] ||
      backgrounds[0];

    ctx.fillStyle = theme.sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 背景の建物
    if (this.stage !== 2) {
      for (let i = 0; i < 14; i++) {
        const x = i * 76 - 12;
        const height =
          80 + ((i * 47) % 125);

        ctx.fillStyle = theme.wall;

        ctx.fillRect(
          x,
          FLOOR - height,
          60,
          height
        );

        ctx.fillStyle = "#ffffff12";

        for (let y = FLOOR - height + 15;
          y < FLOOR - 15;
          y += 25) {
          ctx.fillRect(x + 12, y, 9, 12);
          ctx.fillRect(x + 37, y, 9, 12);
        }
      }
    } else {
      // トレーニングステージのグリッド
      ctx.strokeStyle = "#ffffff13";
      ctx.lineWidth = 1;

      for (let x = 0; x < WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, FLOOR);
        ctx.stroke();
      }

      for (let y = 0; y < FLOOR; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
      }
    }

    // 地面
    ctx.fillStyle = theme.floor;
    ctx.fillRect(
      0,
      FLOOR,
      WIDTH,
      HEIGHT - FLOOR
    );

    ctx.fillStyle = theme.line;
    ctx.fillRect(0, FLOOR, WIDTH, 5);

    for (let x = 0; x < WIDTH; x += 80) {
      ctx.fillStyle = "#ffffff0b";
      ctx.fillRect(x, FLOOR + 28, 42, 3);
    }
  }

  drawFighter(fighter) {
    const ctx = this.ctx;

    const x = Math.round(fighter.x);
    const y = Math.round(fighter.y);

    const scale =
      fighter.id === "tank"
        ? 1.18
        : fighter.id === "speed"
          ? 0.91
          : 1;

    const walking =
      Math.abs(fighter.vx) > 25 &&
      fighter.ground;

    const phase =
      walking
        ? Math.sin(this.frameCount * 0.25) * 5
        : 0;

    // 地面の影
    ctx.fillStyle = "#00000055";

    ctx.beginPath();
    ctx.ellipse(
      x,
      FLOOR + 4,
      fighter.width * 0.7,
      7,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.save();

    ctx.translate(x, y);
    ctx.scale(fighter.dir * scale, scale);

    // 被弾時に点滅
    if (
      fighter.flash > 0 &&
      Math.floor(this.frameCount / 3) % 2 === 0
    ) {
      ctx.globalAlpha = 0.55;
    }

    const attacking = Boolean(fighter.move);

    const attackActive =
      attacking &&
      fighter.moveTime >= fighter.move.start &&
      fighter.moveTime <=
        fighter.move.start + fighter.move.active;

    const leaning =
      attacking ? 5 : 0;

    // 後ろ脚
    ctx.fillStyle = "#1c2535";
    ctx.fillRect(-17, -39, 13, 36 + phase);

    // 前脚
    ctx.fillStyle = "#2a3548";
    ctx.fillRect(5, -39, 13, 36 - phase);

    // 靴
    ctx.fillStyle = "#e5eaf3";
    ctx.fillRect(-19, -7 + phase, 17, 7);
    ctx.fillRect(5, -7 - phase, 18, 7);

    // 胴体
    ctx.fillStyle = fighter.color;
    ctx.fillRect(
      -22 + leaning,
      -80,
      44,
      44
    );

    // 服の影
    ctx.fillStyle = "#00000035";
    ctx.fillRect(
      10 + leaning,
      -80,
      12,
      44
    );

    // 首
    ctx.fillStyle = "#dba98d";
    ctx.fillRect(-7, -89, 14, 11);

    // 顔
    ctx.fillStyle = "#e6bb9d";
    ctx.fillRect(-16, -111, 32, 27);

    // 髪
    const hair = {
      balance: "#694a37",
      speed: "#d8e5ed",
      power: "#292b34",
      tank: "#4b423d",
      tech: "#22283e",
      rush: "#f2a04a",
      trick: "#30243f"
    };

    ctx.fillStyle =
      hair[fighter.id] || "#2b2b36";

    ctx.fillRect(-17, -116, 34, 13);
    ctx.fillRect(-18, -110, 8, 14);

    // 目
    ctx.fillStyle = "#29303b";
    ctx.fillRect(8, -100, 4, 3);

    // 後ろ腕
    ctx.fillStyle = fighter.color;
    ctx.fillRect(-29, -77, 11, 36);

    // 前腕
    ctx.fillStyle = fighter.color;

    if (attackActive) {
      ctx.fillRect(
        15,
        -76,
        42,
        13
      );

      // 攻撃の軌跡
      ctx.fillStyle = "#ffffffaa";
      ctx.fillRect(51, -82, 17, 5);
    } else if (fighter.guard) {
      ctx.fillRect(
        13,
        -92,
        12,
        34
      );
    } else {
      ctx.fillRect(
        18,
        -76,
        11,
        36
      );
    }

    // ガードエフェクト
    if (fighter.guard) {
      ctx.strokeStyle = "#8edfffaa";
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.arc(
        4,
        -70,
        50,
        -1.2,
        1.2
      );
      ctx.stroke();
    }

    // 回避の残像
    if (fighter.dodgeTime > 0) {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = fighter.color;
      ctx.fillRect(-48, -80, 25, 48);
    }

    ctx.restore();
  }

  drawParticles() {
    const ctx = this.ctx;

    for (const particle of this.particles) {
      ctx.globalAlpha = clamp(
        particle.life / particle.maxLife,
        0,
        1
      );

      ctx.fillStyle = particle.color;

      ctx.fillRect(
        Math.round(particle.x),
        Math.round(particle.y),
        particle.size,
        particle.size
      );
    }

    ctx.globalAlpha = 1;
  }

  drawHUD(game) {
    const ctx = this.ctx;
    const player = game.player;
    const enemy = game.enemy;

    // HPバーの背景
    ctx.fillStyle = "#07101bcc";
    ctx.fillRect(18, 17, 365, 53);
    ctx.fillRect(577, 17, 365, 53);

    // プレイヤーHP
    const pRatio = clamp(
      player.hp / player.maxHp,
      0,
      1
    );

    ctx.fillStyle = "#26364b";
    ctx.fillRect(28, 42, 345, 17);

    ctx.fillStyle = "#4ed0f4";
    ctx.fillRect(
      28,
      42,
      345 * pRatio,
      17
    );

    // CPU HP（右から減る）
    const eRatio = clamp(
      enemy.hp / enemy.maxHp,
      0,
      1
    );

    ctx.fillStyle = "#26364b";
    ctx.fillRect(587, 42, 345, 17);

    ctx.fillStyle = "#ff6e7d";
    ctx.fillRect(
      932 - 345 * eRatio,
      42,
      345 * eRatio,
      17
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(player.name, 29, 35);

    ctx.textAlign = "right";
    ctx.fillText(enemy.name, 931, 35);

    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(
      `${Math.ceil(player.hp)} / ${player.maxHp}`,
      29,
      84
    );

    ctx.textAlign = "right";
    ctx.fillText(
      `${Math.ceil(enemy.hp)} / ${enemy.maxHp}`,
      931,
      84
    );

    // タイマー
    ctx.fillStyle = "#0a1426ee";
    ctx.fillRect(427, 13, 106, 70);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 36px monospace";

    ctx.fillText(
      String(Math.ceil(game.time)).padStart(2, "0"),
      480,
      52
    );

    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "#b8c8dd";

    ctx.fillText(
      `ROUND ${game.round}`,
      480,
      72
    );

    // 勝利ラウンド数
    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "#ffd36d";

    ctx.textAlign = "left";
    ctx.fillText(
      `WIN ${game.wins[0]}`,
      29,
      105
    );

    ctx.textAlign = "right";
    ctx.fillText(
      `WIN ${game.wins[1]}`,
      931,
      105
    );

    // ガード耐久値
    ctx.fillStyle = "#172b3c";
    ctx.fillRect(28, 114, 180, 6);
    ctx.fillRect(752, 114, 180, 6);

    ctx.fillStyle = "#8cdbff";

    ctx.fillRect(
      28,
      114,
      180 * player.guardHp / 100,
      6
    );

    ctx.fillRect(
      932 - 180 * enemy.guardHp / 100,
      114,
      180 * enemy.guardHp / 100,
      6
    );

    // コンボ表示
    if (
      enemy.combo > 1 &&
      enemy.comboTimer > 0
    ) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffe17b";
      ctx.font = "bold 28px sans-serif";

      ctx.fillText(
        `${enemy.combo} COMBO`,
        40,
        180
      );
    }

    if (
      player.combo > 1 &&
      player.comboTimer > 0
    ) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#ff91a3";
      ctx.font = "bold 28px sans-serif";

      ctx.fillText(
        `${player.combo} COMBO`,
        920,
        180
      );
    }
  }

  drawAnnouncement() {
    if (this.announcementTime <= 0) return;

    const ctx = this.ctx;

    ctx.fillStyle = "#08111dcc";
    ctx.fillRect(180, 213, 600, 98);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 43px sans-serif";

    ctx.fillText(
      this.announcement,
      WIDTH / 2,
      276
    );
  }

  render(game) {
    const ctx = this.ctx;

    ctx.save();

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // 画面揺れ
    if (this.shake > 0) {
      const x =
        (Math.random() - 0.5) *
        this.shake;

      const y =
        (Math.random() - 0.5) *
        this.shake;

      ctx.translate(x, y);
    }

    this.drawStage();

    if (game.player && game.enemy) {
      this.drawFighter(game.player);
      this.drawFighter(game.enemy);
    }

    this.drawParticles();

    ctx.restore();

    if (game.player && game.enemy) {
      this.drawHUD(game);
    }

    this.drawAnnouncement();

    // ヒット時の画面フラッシュ
    if (this.flash > 0) {
      ctx.fillStyle =
        `rgba(255,255,255,${this.flash * 2})`;

      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }
}
