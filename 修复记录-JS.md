# 修复记录 · JS 缺陷（8 条）

- 项目：`D:\appData\airp\chatbot\work\didao-ds-new`
- 范围：只改 `js/` 下文件；`css/stage.css` 仅因 P1-7 明确允许而改了两行。`index.html` 未动。
- 校验：`node --check` 对 `js/` 下全部 11 个文件逐个执行，全过；用项目自带 `tools\qa.py`（CDP + headless Edge，attach 9222）跑全流程 31/31 通过、0 个 console 错误；另写临时脚本 `attic\2026-10-24\probe-didao-jsfix.py` 针对性复现 8 条，11/11 通过。
- 行号均为改完后的行号（改动前的旧行号在括号里）。

---

## P0-1 「从头看」只重置 dig，其余五个 reset() 是死代码

**原因**：`js/boot.js:76` 重开时发 `scene { i: 0, reset: true }`，而五个模块监听写成 `if (e.i === N && e.reset)`，`i` 恒为 0 永不成立。

**改动**（五个文件都改成先判 `e.reset`，再处理离场/二次进入）：

- `js/puzzle.js:238-241`（旧 231-235）
  ```js
  if (e.reset) { reset(); return; }
  if (e.i !== 2) { clearTimeout(goTimer); goTimer = 0; }
  ```
- `js/cards.js:79-82`（旧 71-73）：同上，段号 3。
- `js/quiz.js:91-94`（旧 87-89）：同上，段号 4。
- `js/poem.js:105-108`（旧 101-103）：同上，段号 6。
- `js/shooter.js:152-155`（旧 135-137）：`if (e.reset) { reset(); return; } if (e.i !== 5) leave();`（shooter 见 P0-3，走 `leave()`）
- `js/dig.js:107-111`：原本 `if (e.reset)` 就是对的，只补了离场清定时器：
  ```js
  if (e.reset) { reset(); return; }
  if (e.i !== 1) { clearTimeout(goTimer); goTimer = 0; return; }
  if (DD.stage.state.done.indexOf(1) < 0) reset();
  ```

**为什么**：这五个文件原来没有 dig 那条「第二次进入未完成则重置」，所以第二行只保留原有的 `if (e.i !== N)` 离场清理，不额外加新语义；`reset()` 自身幂等（重建/清空），不会被重开事件触发出问题。P0-2 的定时器 id 也顺路在这条离场分支里清掉。

---

## P0-2 完成后裸 `setTimeout(go(n+1))` 不清理，2 秒后把人拽走

**原因**：完成回调里直接 `setTimeout(function () { DD.stage.go(N + 1); }, 2000/2200/2600)`，没存 id、没守卫；复现是「第 1 段挖完 → 2 秒内点导航去第 5 段 → 被拉回第 2 段」。

**改动**：每个模块加模块级 `goTimer`，回调里加「还在本段才推进」的守卫，`reset()` 与离场都 `clearTimeout`：

- `js/dig.js:12` 加 `let goTimer = 0;`；`js/dig.js:37-39`（旧 36）
  ```js
  goTimer = setTimeout(function () {
    if (DD.stage.index === 1) DD.stage.go(2);
  }, 2000);
  ```
  `js/dig.js:79-80` 在 `reset()` 开头 `clearTimeout(goTimer); goTimer = 0;`
- `js/puzzle.js:25` / `:204-206`（旧 202）/ `:210-211`：段号 2，延迟仍 2200。
- `js/cards.js:8` / `:60-62`（旧 56）/ `:66-67`：段号 3，延迟 2200。
- `js/quiz.js:6` / `:73-75`（旧 73）/ `:79-80`：段号 4，延迟 2200。
- `js/poem.js:9` / `:88-90`（旧 88）/ `:94-95`：段号 6，延迟 2600。
- `js/shooter.js:8` / `:109-111`（旧 108）/ `:118-119`（`leave()` 里）/ `:132-133`（`reset()` 里）：段号 5，延迟保持 `win ? 2600 : 2400`。

**为什么**：守卫用 `DD.stage.index === N`（getter 返回当前段），既不误伤正常的自动进段，也不在用户手动导航后被旧定时器推走；存 id 是为了重开时把旧定时器清掉，而不是让它晚点再推一次。定时器时长沿用原值，没有统一改成 2000。

---

## P0-3 shooter 离场后倒计时/rAF 继续跑，25 秒后强跳第 6 段

**原因**：唯一的 scene 监听是死条件（P0-1），离场后 `tick()` 的 rAF 仍在跑，`field.clientWidth=0` 让靶子生成在负坐标，时间到 `finish(false)` → `markDone(5)` + 2.4s 后 `go(6)`。

**改动**（`js/shooter.js`）：

- 新增 `js/shooter.js:114-125` 的 `leave()`：
  ```js
  function leave() {
    running = false;
    cancelAnimationFrame(raf);
    clearTimeout(goTimer);
    goTimer = 0;
    if (field) field.querySelectorAll('.target').forEach(...remove...);
    if (startBtn) startBtn.style.display = '';
    hits = 0;
    left = conf().seconds;
    paint();
  }
  ```
- 监听 `js/shooter.js:152-155`：`e.reset` 走 `reset()`，否则 `e.i !== 5` 调 `leave()`。
- `js/shooter.js:127-138` 的 `reset()` 补 `clearTimeout(goTimer)`（P0-2），其余保持。
- 悬空的 `done` 状态收拾干净：删掉 `done` 变量（旧 :7），`start()` 的 `if (running || done)` 改成 `if (running) return;`（`:82-83`），`reset()` 里删掉 `done = false`。
- `finish()` 的 `markDone(5)` 与失败/成功文案没动。

**为什么**：离场清理必须同时停 rAF（倒计时来源）和 go 定时器，否则「25 秒到点」和「2.4 秒后跳段」两个路径都还在；`done` 从未被置 true，是纯死状态，删掉比补置位更干净（若置位，回到第 5 段后「开始」按钮会永久失效，与 `reset()` 的初始态语义冲突）。

**验证**：探针把 `DD.content.shooter.seconds` 临时改成 2，开始 0.6s 后 `DD.stage.go(2)`，等 4.8s（超过旧逻辑的 2s+2.4s）：`index` 仍为 2，`done` 无 5，靶子 0 个，`startBtn` 恢复显示，计时回到 `2.0`，hits 归零。

---

## P1-4 拼图完成态 class 挂错元素

**原因**：`js/puzzle.js:198`（旧）给 `svg`（class `puzzle-stage`）加 `is-complete`，CSS 选择器却是 `.puzzle.is-complete .pz-base`（`css/scenes.css:383`），外层是 `#puzzle.puzzle`。

**改动**：
- `js/puzzle.js:199-200`：
  ```js
  const box = document.getElementById('puzzle');
  if (box) box.classList.add('is-complete');
  ```
- `js/puzzle.js:217-218` 清理处同步改成 `box.classList.remove('is-complete')`。

**为什么**：直接对上层容器操作，和现有 CSS 选择器对齐；没有改 CSS，也没有给 svg 加别的 class。

**验证**：探针拼完 7 段后 `#puzzle` 有 `is-complete`、`#puzzle-svg` 没有。

---

## P1-5 翻卡第 7/8 张：显示「再翻 -1 张」并覆盖完成文案

**原因**：`NEED=6`、卡有 8 张，`else if` 分支在 `flipped` 为 7/8 时算 `NEED - flipped` 得负数并覆盖完成文案。

**改动**：`js/cards.js:43-53`（旧 43-49）
```js
if (flipped === 1 && hintEl) hintEl.textContent = '洞口就藏在平时天天用的东西底下。';
if (flipped >= NEED) {
  if (flipped === NEED) {
    if (hintEl) hintEl.textContent = '这些洞口，敌人翻十遍也翻不全。';
    if (DD.audio) DD.audio.ok(0.7);
    complete();
  }
  return;
}
if (hintEl) {
  hintEl.textContent = '已经翻了 ' + flipped + ' 张，再翻 ' + (NEED - flipped) + ' 张。';
}
```

**为什么**：达到 NEED 后先判完成、再直接 return，第 7/8 张仍会翻（`is-flipped` 在判断之前加）但不改提示、不重复触发完成；`complete()` 本身也有 `if (done) return`。特意**没有**在 `turn()` 顶上再加 `if (done) return;`——那样第 7/8 张就翻不动了，和本条要求的行为相反。

**验证**：探针连点 8 张：翻转数 8，提示仍是「这些洞口，敌人翻十遍也翻不全。」，`done` 里 3 只出现一次。

---

## P1-6 dig 丢一次 pointerup 就变成「悬停即开挖」

**原因**：`onMove` 只看 `dragging`；切后台/窗口外松手拿不到 pointerup，`dragging` 永真。

**改动**：`js/dig.js:65`（旧 61-62 的 onMove 开头）
```js
if (e.buttons === 0) { onUp(); return; }
```
放在 `if (!dragging) return;` 之前；`onUp()` 自己会判 `dragging`，未按下时是空操作。

**为什么**：`e.buttons === 0` 表示此刻没有任何键被按下，是「松手事件丢了」的可靠信号；这里只是补上离场清理，不引入 pointerleave/blur 等新监听。

**验证**：探针按下后直接发 `buttons=0` 的 pointermove：depth 停在 `0.0`、`is-digging` 被移除；随后 `buttons=1` 的 move 也不再刨土。

---

## P1-7 隐藏的导航仍可点击（唯一允许改 CSS 的一条）

**改动**：`css/stage.css:213-214`，紧跟在原 `.nav.is-on { opacity: 1; }`（:212）后面加两行：
```css
.nav { pointer-events: none; }
.nav.is-on { pointer-events: auto; }
```

**为什么**：`.nav.is-on` 选择器更具体，`auto` 会正确覆盖 `.nav` 的 `none`，不依赖书写顺序；只加两行，没动别的样式。

**验证**：探针读 `getComputedStyle(#nav).pointerEvents`：第 0 段隐藏时 `none`，进村后 `auto`。

---

## P1-8 首尾圆点永远不「已完成」

**原因**：`js/boot.js:83-86`（旧）进村只 `go(1)` 没 `markDone(0)`；全项目没有 `markDone(7)`。

**改动**：
- `js/boot.js:85`：进村按钮里 `DD.stage.go(1);` 之前加 `DD.stage.markDone(0);`。
- `js/boot.js:90-93`：新增 scene 监听
  ```js
  DD.stage.on('scene', function (e) {
    if (e.i === 7) DD.stage.markDone(7);
  });
  ```
  注册在 `DD.stage.init()` / `fire()` 之前，hash 直达 `#7` 也会记。

**为什么**：`markDone` 自己会去重并 `save()`，重复进尾段不会重复写；`go()` 里先 `updateNav()` 后 `emit`，所以 `is-done` 是事件里追加的 class，而 `is-active` 的 CSS 在后面、仍会盖住圆点样式，不需要重排。

**验证**：探针进村后 `done=[0]`、0 号圆点带 `is-done`；`go(7)` 后 `done=[0,7]`、7 号圆点带 `is-done`。`tools\qa.py` 末段 localStorage 也从 `done=[1..6]` 变成 `done=[1..7]`。

---

## 附注（没改、但值得知道）

- `js/quiz.js:50-53` 答题后 1.6s 的换题/收尾 `setTimeout` 不在 8 条清单里，未动。它最终调用的 `finish()` 里那个跳段定时器已按 P0-2 加了守卫，所以最坏情况只是「答完第 5 题后 1.6 秒内离场，顺手把 4 记为已完成」，不会跨段跳。
- shooter 的 `finish()` 失败分支原本就会 `markDone(5)`（限时打完即算完成），这是既有设计，按「不动别的逻辑」保留。
- 已确认没有 `git commit`；`git status` 里整个项目本来就是未跟踪状态，由用户自己管版本。
