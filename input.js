
/*
 * STRIKE FLOW
 * Input System
 *
 * PC:
 * A / D = 左右移動
 * W     = ジャンプ
 * J     = 通常攻撃
 * K     = 固有技
 * L     = ガード
 * Shift = 回避
 * Space = ダッシュ
 * U/I/O = 必殺技1/2/3
 */

const KEY_MAP = {
  KeyA: "left",
  ArrowLeft: "left",

  KeyD: "right",
  ArrowRight: "right",

  KeyW: "jump",
  ArrowUp: "jump",

  KeyJ: "attack",
  KeyK: "skill",
  KeyL: "guard",

  ShiftLeft: "dodge",
  ShiftRight: "dodge",

  Space: "dash",

  KeyU: "super1",
  KeyI: "super2",
  KeyO: "super3"
};

export class Input {
  constructor() {
    // 押されている入力元を管理
    this.sources = new Map();

    // 現在押されている操作
    this.down = new Set();

    // 今回新しく押された操作
    this.pressed = new Set();

    // タッチ操作中のポインター
    this.pointers = new Map();

    this.bindKeyboard();
    this.bindTouch();
    this.bindWindow();
  }

  // 入力開始
  press(action, source) {
    if (!action || !source) return;

    const key = String(source);

    // 同じ入力元の重複を防止
    if (this.sources.has(key)) return;

    this.sources.set(key, action);

    if (!this.down.has(action)) {
      this.down.add(action);
      this.pressed.add(action);
    }
  }

  // 入力終了
  release(source) {
    const key = String(source);
    const action = this.sources.get(key);

    if (!action) return;

    this.sources.delete(key);

    // 同じ操作を別の指やキーで
    // 押している場合は維持する
    const stillHeld = [
      ...this.sources.values()
    ].includes(action);

    if (!stillHeld) {
      this.down.delete(action);
    }
  }

  // 押し続けているか
  is(action) {
    return this.down.has(action);
  }

  // 新しく押された瞬間か
  hit(action) {
    return this.pressed.has(action);
  }

  // 1描画フレーム分の入力を消去
  clearFrame() {
    this.pressed.clear();
  }

  // 入力をすべて解除
  reset() {
    this.sources.clear();
    this.down.clear();
    this.pressed.clear();
    this.pointers.clear();

    document
      .querySelectorAll("#touch button")
      .forEach((button) => {
        button.classList.remove("pressed");
      });
  }

  // PCキーボード
  bindKeyboard() {
    window.addEventListener(
      "keydown",
      (event) => {
        const action = KEY_MAP[event.code];

        if (!action) return;

        // セレクトボックスなどの操作を妨げない
        const target = event.target;

        if (
          target instanceof HTMLElement &&
          target.closest(
            "input, select, textarea"
          )
        ) {
          return;
        }

        event.preventDefault();

        // キー長押しによる連打を防止
        if (event.repeat) return;

        this.press(
          action,
          `keyboard:${event.code}`
        );
      }
    );

    window.addEventListener(
      "keyup",
      (event) => {
        const action = KEY_MAP[event.code];

        if (!action) return;

        event.preventDefault();

        this.release(
          `keyboard:${event.code}`
        );
      }
    );
  }

  // スマホのタッチ操作
  bindTouch() {
    const buttons = document.querySelectorAll(
      "#touch button[data-key]"
    );

    buttons.forEach((button) => {
      const action = button.dataset.key;

      button.addEventListener(
        "pointerdown",
        (event) => {
          event.preventDefault();

          const source =
            `pointer:${event.pointerId}`;

          this.pointers.set(
            event.pointerId,
            button
          );

          this.press(action, source);

          button.classList.add("pressed");

          try {
            button.setPointerCapture(
              event.pointerId
            );
          } catch (error) {
            // 一部ブラウザでは非対応
          }
        }
      );

      const releasePointer = (event) => {
        const source =
          `pointer:${event.pointerId}`;

        this.release(source);

        this.pointers.delete(
          event.pointerId
        );

        const stillPressed = [
          ...this.pointers.values()
        ].includes(button);

        if (!stillPressed) {
          button.classList.remove(
            "pressed"
          );
        }
      };

      button.addEventListener(
        "pointerup",
        releasePointer
      );

      button.addEventListener(
        "pointercancel",
        releasePointer
      );

      button.addEventListener(
        "lostpointercapture",
        releasePointer
      );

      // 長押しメニューを防止
      button.addEventListener(
        "contextmenu",
        (event) => {
          event.preventDefault();
        }
      );
    });
  }

  // 画面外に移動した際の入力解除
  bindWindow() {
    window.addEventListener(
      "blur",
      () => this.reset()
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          this.reset();
        }
      }
    );
  }
}
