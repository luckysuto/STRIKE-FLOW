
import { ROSTER } from "./moves.js";
import { Input } from "./input.js";
import { Game } from "./game.js";

const $ = (id) => document.getElementById(id);

const characterSelect = $("character");
const rosterElement = $("roster");

// 7人のキャラクターを登録
ROSTER.forEach((character, index) => {
  const option = document.createElement("option");

  option.value = index;
  option.textContent =
    `${character.name}（${character.type}）`;

  characterSelect.appendChild(option);
});

// キャラクター選択
function chooseCharacter(index) {
  const character = ROSTER[index];

  if (!character) return;

  characterSelect.value = String(index);

  $("color").value = character.color;

  $("selected-name").textContent =
    `${character.name}（${character.type}）`;

  const cards = rosterElement.querySelectorAll(
    ".character-card"
  );

  cards.forEach((card) => {
    const selected =
      Number(card.dataset.character) === index;

    card.classList.toggle("selected", selected);

    card.setAttribute(
      "aria-pressed",
      String(selected)
    );
  });
}

// キャラクターの簡易ドット絵
function drawCharacterPreview(canvas, character) {
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;

  const wide =
    character.id === "tank" ||
    character.id === "power";

  const thin =
    character.id === "speed" ||
    character.id === "trick";

  const width = wide ? 22 : thin ? 12 : 17;

  // 髪
  ctx.fillStyle = "#202738";
  ctx.fillRect(17, 6, 14, 12);

  // 顔
  ctx.fillStyle = "#e6b998";
  ctx.fillRect(19, 10, 10, 8);

  // 服
  ctx.fillStyle = character.color;
  ctx.fillRect(
    Math.round(24 - width / 2),
    20,
    width,
    21
  );

  // 腕
  ctx.fillRect(
    Math.round(24 - width / 2 - 5),
    22,
    5,
    18
  );

  ctx.fillRect(
    Math.round(24 + width / 2),
    22,
    5,
    18
  );

  // 脚
  ctx.fillStyle = "#222c40";

  ctx.fillRect(
    Math.round(24 - width / 2 + 2),
    41,
    6,
    16
  );

  ctx.fillRect(
    Math.round(24 + width / 2 - 8),
    41,
    6,
    16
  );
}

// 7人の選択カードを生成
ROSTER.forEach((character, index) => {
  const card = document.createElement("button");

  card.type = "button";
  card.className = "character-card";

  card.dataset.character = String(index);

  card.setAttribute(
    "aria-label",
    `${character.name}、${character.type}を選ぶ`
  );

  const avatar = document.createElement("canvas");

  avatar.width = 48;
  avatar.height = 60;
  avatar.className = "character-avatar";

  drawCharacterPreview(avatar, character);

  const name = document.createElement("span");

  name.className = "character-name";
  name.textContent = character.name;

  const type = document.createElement("small");

  type.textContent = character.type;

  card.append(avatar, name, type);

  card.addEventListener("click", () => {
    chooseCharacter(index);
  });

  rosterElement.appendChild(card);
});

// プルダウンからの選択にも対応
characterSelect.addEventListener("change", () => {
  chooseCharacter(Number(characterSelect.value));
});

// 最初はレイを選択
chooseCharacter(0);

// 入力システム
const input = new Input();

// 画面表示の管理
const ui = {
  overlay: $("overlay"),
  status: $("status"),
  message: $("message"),

  showResult(won, wins) {
    const panel = ui.overlay.querySelector(".panel");

    panel.querySelector("h1").textContent =
      won ? "YOU WIN!" : "CPU WINS";

    panel.querySelector("p").textContent =
      `試合結果 ${wins[0]} - ${wins[1]}　もう一度挑戦しよう！`;

    $("start").textContent = "もう一度対戦";

    ui.overlay.classList.remove("hidden");
  }
};

// ゲーム本体を作成
const game = new Game(
  $("game"),
  input,
  ui
);

// 対戦スタート
$("start").addEventListener("click", () => {
  const characterIndex =
    Number(characterSelect.value);

  const difficulty =
    $("difficulty").value;

  const stage =
    Number($("stage").value);

  const color =
    $("color").value;

  game.start(
    characterIndex,
    difficulty,
    stage,
    color
  );
});

// ポーズ操作
$("pause").addEventListener("click", () => {
  if (game.state !== "fight") return;

  game.pause = !game.pause;

  ui.status.textContent =
    game.pause ? "PAUSED" : "FIGHT";

  $("pause").textContent =
    game.pause ? "▶" : "Ⅱ";

  input.reset();
});

// ページを離れるとき入力状態を解除
window.addEventListener("pagehide", () => {
  input.reset();
});

// ゲームループを開始
requestAnimationFrame((time) => {
  game.frame(time);
});
