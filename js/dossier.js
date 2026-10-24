/* dossier.js — 史料抽屉
   每段 .sc-src 行尾插一个“看详情 →”，点开从右侧滑出一张纸卡：
   这一段的史料原文、数字、出处。点 ×、点左侧遮罩、按 ESC 关闭；切段自动关。
   只读 DD.stage 的 scene 事件，不改动任何既有模块。 */
(function () {
  var DD = window.DD;
  if (!DD) return;

  var TOTAL = 8;
  var CN = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

  /* 内容按段序号排：0 序 / 1 挖 / 2 连 / 3 藏 / 4 守 / 5 打 / 6 人 / 7 尾
     tag 只用项目现有的四类：【史料】【影片】【幕后】【示意】 */
  var DATA = [
    {
      no: '〇',
      label: '序',
      title: '地上没路了',
      lede: '1942 年，日军把冀中平原切成一块一块。先看几个数字，再往下走。',
      items: [
        {
          tag: '史料',
          head: '五万余人，铁壁合围',
          text: '1942 年 5 月 1 日，日军华北方面军司令官冈村宁次调集两个师团、两个旅团共 5 万余人，加伪军 4 万余人，对冀中抗日根据地发动“五一大扫荡”，号称“铁壁合围”。',
          src: '冉庄地道战纪念馆展陈；冀中抗战史料'
        },
        {
          tag: '史料',
          head: '八千个村庄',
          text: '1942 年 5 月至 7 月，冀中 8000 多个村庄被 1753 座据点分割，封锁沟总长 4187 公里，公路 2 万多公里。炮楼、沟、路，把平原织成了一张网。',
          src: '冉庄地道战纪念馆公开口径'
        },
        {
          tag: '史料',
          head: '合围之后是清剿',
          text: '先以重兵合围中心区，再分区“清剿”：修据点、挖封锁沟、修公路，把根据地切成一村一村的小块。人在地面上走，随时可能撞上炮楼和巡逻队。',
          src: '据冀中抗战史料与冉庄地道战纪念馆展陈整理'
        },
        {
          tag: '示意',
          head: '数字的口径',
          text: '这一段的据点、封锁沟、公路是冀中全区的数字，不是冉庄一个村的数据。冉庄的干线、支线和长度，放在第二段。',
          src: '本页编者说明'
        }
      ]
    },
    {
      no: '一',
      label: '挖',
      title: '自家院里挖个坑',
      lede: '地道不是一天挖成的。先是一口竖井，后来是两个口，再后来，一户连一户。',
      items: [
        {
          tag: '史料',
          head: '一口竖井，一个人蹲',
          text: '最早的地道是单口竖井，俗称“蛤蟆蹲”：一口井直上直下，人在底下蹲着，只能藏，不能打。洞口开在不起眼的地方。',
          src: '冉庄地道战纪念馆展陈与民兵口述'
        },
        {
          tag: '史料',
          head: '1941 年冬，单口洞被破坏',
          text: '1941 年冬，敌人发现一处单口洞，就往里灌水、放毒。单口洞只有一口，一旦被发觉，整洞的人没有第二条路。',
          src: '冉庄地道战纪念馆展陈'
        },
        {
          tag: '史料',
          head: '1942 年春，改双口',
          text: '1942 年春，冉庄把单口改成双口：一头被堵，还能从另一头出去。再往后是户通户、村连村，洞口越留越多，地道才从“藏身”变成“能打”。',
          src: '冉庄地道战纪念馆展陈'
        },
        {
          tag: '史料',
          head: '党员民兵带头',
          text: '1942 年夏季反“扫荡”开始后，中共冀中区委和冀中军区号召冀中人民普遍开展挖地道活动。冉庄的党员和民兵带头，把一家一家的洞连成了网。',
          src: '中国军网《军史文物｜张森林的就义辞》，2025-02-09'
        }
      ]
    },
    {
      no: '二',
      label: '连',
      title: '二十四条支线',
      lede: '冉庄的地道以十字街为中心。四条干线往外伸，二十四条支线把一户一户接起来。',
      items: [
        {
          tag: '史料',
          head: '十字街，四条干线',
          text: '以十字街为中心，四条干线总长 2.25 公里；南北支线 13 条，东西支线 11 条，共 24 条；地道全长 32 华里，约 16 公里。',
          src: '冉庄地道战纪念馆'
        },
        {
          tag: '史料',
          head: '洞有多宽',
          text: '洞宽 0.7—0.8 米，高 1—1.5 米，顶部距地面 2 米多。人在里面得弯腰走，但顶上压着两米多的土，一般的挖掘不容易找着。',
          src: '冉庄地道战纪念馆'
        },
        {
          tag: '史料',
          head: '井，也是出口',
          text: '地道和水井相连。敌人从井口灌水，水顺着地道又流回井里——灌水的办法，在这张网里不灵。',
          src: '冉庄地道战纪念馆；民兵口述'
        },
        {
          tag: '史料',
          head: '双向地道',
          text: '冉庄有一条双向地道：两扇活动门，两端各有翻板陷阱。敌人进来，把门一关，就成了“关起门来打狗”。',
          src: '冉庄地道战纪念馆；参见电影《地道战》台词“堵住笼子抓鸡，关起门来打狗”'
        }
      ]
    },
    {
      no: '三',
      label: '藏',
      title: '洞口就在脚下',
      lede: '洞口不写在墙上。它藏在锅台、炕面、马槽底下；敌人站在洞口上，也未必知道脚下有路。',
      items: [
        {
          tag: '史料',
          head: '洞口开在哪里',
          text: '墙根、马槽底、炕面、锅台、井口、面柜、织布机下、夹壁墙、衣柜。平地上的洞口盖一块滑板，盖上和地面齐平。',
          src: '冉庄地道战纪念馆'
        },
        {
          tag: '史料',
          head: '锅台、炕面、马槽',
          text: '锅台洞口，把锅端开，灶膛后头的砖一抽就是口；炕面洞口，掀起几块炕砖，炕上照常睡人；马槽洞口，槽底石板一掀，人就从槽下走。',
          src: '冉庄地道战纪念馆展陈与民兵口述'
        },
        {
          tag: '史料',
          head: '翻眼',
          text: '翻眼是地道的双层结构：上层把灌进来的水、放下来的毒气导入下层，下层把口一封；下层还通着水井，水最后流回井里。',
          src: '冉庄地道战纪念馆'
        },
        {
          tag: '史料',
          head: '村外的出口',
          text: '地道不只在院里。有的出口留在村外；敌人围了村，人还能从村外出来。',
          src: '冉庄地道战纪念馆展陈'
        }
      ]
    },
    {
      no: '四',
      label: '守',
      title: '五防：水毒火钻破',
      lede: '水、毒、火、钻、破，五样都防住了，地道才能待人。',
      items: [
        {
          tag: '史料',
          head: '五防',
          text: '地道战讲“五防”：防水、防毒、防火、防钻、防破。防水、防毒靠翻眼，防火靠挡火墙和拐弯，防钻靠卡口和陷阱；防破，靠多口多路，坏一段补一段，村连村互相接。',
          src: '冉庄地道战纪念馆展陈'
        },
        {
          tag: '史料',
          head: '防水',
          text: '敌人从井口灌水，水经翻眼导进下层，再顺着地道流回井里。水最后又回到原处，灌水的办法就不灵了。',
          src: '冉庄地道战纪念馆与民兵口述'
        },
        {
          tag: '史料',
          head: '防毒',
          text: '敌人放毒气，就把毒气引进下层，封住下层口，人在另一段地道里。翻眼一封，两边地道就隔开了。',
          src: '冉庄地道战纪念馆与民兵口述'
        },
        {
          tag: '史料',
          head: '防钻',
          text: '卡口是只容一人侧身通过的窄口；卡口后面是翻板陷阱。敌人钻进来，只能一个一个爬，民兵守在卡口后面。',
          src: '冉庄地道战纪念馆展陈与民兵口述'
        },
        {
          tag: '史料',
          head: '防火',
          text: '地道不是直的，隔一段砌一道挡火墙。敌人点火熏洞，火和烟被墙和拐弯挡住，人退到另一段，从别的口出去。',
          src: '冉庄地道战纪念馆展陈'
        }
      ]
    },
    {
      no: '五',
      label: '打',
      title: '打一枪，换一个地方',
      lede: '先把敌人放进来，再在房上、院里、街上三层打；打完就下地道，从另一个口出去。',
      items: [
        {
          tag: '影片',
          head: '“打一枪换一个地方”',
          text: '“各小组注意：你们各自为战，打一枪换一个地方，不准放空枪。”这是电影《地道战》里高传宝的台词，也是冉庄民兵的战法。',
          src: '电影《地道战》，八一电影制片厂，1965 年摄制，1966 年公映'
        },
        {
          tag: '史料',
          head: '诱敌深入，三层火力',
          text: '村边先杀伤，把敌人往村里引；高房、院落、街巷三层火力交叉；打完就下地道，从另一个洞口出来。敌人进了村，找不到人，处处挨打。',
          src: '冉庄地道战纪念馆战法说明'
        },
        {
          tag: '史料',
          head: '1945 年 4 月 1 日',
          text: '1945 年 4 月 1 日凌晨，600 多名日伪军偷袭冉庄。30 多名民兵依托地道相持 13 小时，无一伤亡。此后当地有“宁绕黑风口，不从冉庄走”的说法。',
          src: '冉庄地道战纪念馆'
        },
        {
          tag: '幕后',
          head: '一部民兵教育片',
          text: '1963 年 5 月，总参谋部指令八一电影制片厂拍一部民兵教育片。导演任旭东带着创作组走遍冀中几十个村庄，剧本磨了两年；1965 年 5 月开拍，外景在清苑县冉庄、唐庄、李庄。',
          src: '中国新闻网转《北京晚报》2015-08-27，杨庆华文'
        },
        {
          tag: '影片',
          head: '大古钟与高家庄',
          text: '电影里村口那口大古钟是艺术加工。杨成武看过片子说，当年其实是用线拉铃联络。高家庄的原型是正定县高平村，高传宝的原型是村党支部书记兼民兵队长刘傻子。',
          src: '中国新闻网转《北京晚报》2015-08-27，杨庆华文'
        }
      ]
    },
    {
      no: '六',
      label: '人',
      title: '张森林，三十四岁',
      lede: '冉庄第一个共产党员，也是把地道从“藏”变成“打”的人之一。1943 年秋，他被活埋，三十四岁。',
      items: [
        {
          tag: '史料',
          head: '冉庄第一个党员',
          text: '张森林，1909 年生于河北省清苑县冉庄。1939 年春加入中国共产党，是冉庄第一名中共党员。',
          src: '中国军网《军史文物｜张森林的就义辞》，2025-02-09'
        },
        {
          tag: '史料',
          head: '带全村修地道',
          text: '1942 年夏反“扫荡”开始后，他带着党员和民兵，修能打能藏的地道。1943 年秋，任清苑县抗日武装大队政委。',
          src: '中国军网《军史文物｜张森林的就义辞》，2025-02-09'
        },
        {
          tag: '史料',
          head: '耿庄被捕',
          text: '1943 年秋，他去耿庄了解敌情时被捕。敌人要他交出各村党员名单、画出冉庄地道的线路图，他都没交，最后被活埋，年 34 岁。',
          src: '中国军网《军史文物｜张森林的就义辞》，2025-02-09'
        },
        {
          tag: '史料',
          head: '《就义辞》',
          text: '“鳞伤遍体做徒囚，山河未复志未酬。多少英雄遭毒手，血染黄沙恨不休。”本页用四句传抄本；就义辞手迹为六句，另有“敌酋逼书归降字，誓将碧血染春秋。人去留得英魂在，唤起民众报国仇”，署“癸未岁中书”（1943 年），现展于中国共产党历史展览馆。',
          src: '冉庄地道战纪念馆与地方史志；六句传抄本见中国共产党历史展览馆陈列'
        }
      ]
    },
    {
      no: '七',
      label: '尾',
      title: '地上照常种庄稼',
      lede: '地道还在，村子也还在。纪念馆、保护区、三千米地道，和地里一年一茬的玉米。',
      items: [
        {
          tag: '史料',
          head: '一九五九年建馆',
          text: '冉庄地道战纪念馆 1959 年建馆，聂荣臻题写馆名；2008 年改扩建后免费开放。',
          src: '冉庄地道战纪念馆；清苑冉庄地道战遗址基地介绍'
        },
        {
          tag: '史料',
          head: '二十万平方米',
          text: '冉庄地道战遗址保护区 20 万平方米，地下保留地道 3000 米；1997 年被命名为首批全国爱国主义教育示范基地。',
          src: '冉庄地道战纪念馆公开口径'
        },
        {
          tag: '史料',
          head: '第一批全国重点文物保护单位',
          text: '1961 年 3 月 4 日，冉庄地道战遗址被国务院公布为第一批全国重点文物保护单位。',
          src: '国务院 1961 年 3 月 4 日公布的第一批全国重点文物保护单位名单'
        },
        {
          tag: '史料',
          head: '聂荣臻题词',
          text: '“神出鬼没，出奇制胜的地道战，是华北人民保家卫国，开展游击战争，在平原地带战胜顽敌的伟大创举。”',
          src: '冉庄地道战纪念馆'
        },
        {
          tag: '史料',
          head: '今天的地面',
          text: '地里照常种庄稼。2023 年，纪念馆接待游客 81.7 万人次；地面上的玉米，一年一茬。',
          src: '清苑冉庄地道战遗址基地介绍，2024-12'
        }
      ]
    }
  ];

  var layer = null;
  var bodyEl = null;
  var kickerEl = null;
  var titleEl = null;
  var subEl = null;
  var footCount = null;
  var closeBtn = null;
  var cur = -1;
  var lastFocus = null;
  var closeTimer = 0;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function tagClass(tag) {
    if (tag === '影片') return 'dd-tag--film';
    if (tag === '幕后') return 'dd-tag--hou';
    if (tag === '示意') return 'dd-tag--yi';
    return 'dd-tag--shi';
  }

  function isOpen() {
    return !!layer && layer.classList.contains('is-on');
  }

  function sync() {
    var btns = document.querySelectorAll('.dd-src-more');
    for (var k = 0; k < btns.length; k++) {
      var i = Number(btns[k].getAttribute('data-i'));
      btns[k].setAttribute('aria-expanded', isOpen() && i === cur ? 'true' : 'false');
    }
  }

  function ensure() {
    if (layer) return true;
    var stage = document.getElementById('stage');
    if (!stage) return false;

    layer = el('div', 'dd-layer');
    layer.setAttribute('aria-hidden', 'true');

    var mask = el('div', 'dd-mask');
    mask.addEventListener('click', function () { close(); });
    layer.appendChild(mask);

    var drawer = el('aside', 'dd-drawer');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'dd-title');

    var head = el('header', 'dd-head');
    kickerEl = el('p', 'dd-kicker', '');
    titleEl = el('h3', 'dd-title', '');
    titleEl.id = 'dd-title';
    subEl = el('p', 'dd-sub', '');
    closeBtn = el('button', 'dd-close', '×');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭史料');
    closeBtn.addEventListener('click', function () { close(); });

    head.appendChild(kickerEl);
    head.appendChild(titleEl);
    head.appendChild(subEl);
    head.appendChild(closeBtn);

    bodyEl = el('div', 'dd-body');

    var foot = el('footer', 'dd-foot');
    foot.appendChild(el('span', '', '出处随条标注 · 【示意】非史料原文'));
    footCount = el('span', '', '');
    foot.appendChild(footCount);

    drawer.appendChild(head);
    drawer.appendChild(bodyEl);
    drawer.appendChild(foot);
    layer.appendChild(drawer);

    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      if (closeBtn) closeBtn.focus();
    });

    stage.appendChild(layer);
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        close();
      }
    });
    return true;
  }

  function render(d, i) {
    kickerEl.textContent = '第' + d.no + '段 · ' + d.label;
    titleEl.textContent = d.title;
    subEl.textContent = '共 ' + d.items.length + ' 条 · 史料、数字与出处';
    footCount.textContent = (i + 1) + ' / ' + TOTAL;

    bodyEl.innerHTML = '';
    if (d.lede) bodyEl.appendChild(el('p', 'dd-lede', d.lede));

    for (var k = 0; k < d.items.length; k++) {
      var item = d.items[k];
      var sec = el('section', 'dd-item');

      var h = el('h4', 'dd-item-head');
      var no = el('span', 'dd-item-no', CN[k + 1] || String(k + 1));
      h.appendChild(no);
      h.appendChild(document.createTextNode(item.head));
      sec.appendChild(h);

      sec.appendChild(el('p', 'dd-item-text', item.text));

      var src = el('p', 'dd-item-src');
      src.appendChild(el('span', 'dd-tag ' + tagClass(item.tag), '【' + item.tag + '】'));
      src.appendChild(document.createTextNode(item.src));
      sec.appendChild(src);

      bodyEl.appendChild(sec);
    }
    bodyEl.scrollTop = 0;
  }

  function open(i, btn) {
    var d = DATA[i];
    if (!d || !ensure()) return;
    window.clearTimeout(closeTimer);
    cur = i;
    lastFocus = btn || null;
    render(d, i);

    layer.classList.add('is-on');
    layer.setAttribute('aria-hidden', 'false');
    void layer.offsetWidth;
    layer.classList.add('is-open');

    if (DD.audio && DD.audio.tap) DD.audio.tap(0.5);
    sync();
    try {
      closeBtn.focus({ preventScroll: true });
    } catch (e) {
      if (closeBtn.focus) closeBtn.focus();
    }
  }

  function close(immediate, silent) {
    if (!layer || !layer.classList.contains('is-on')) return;
    cur = -1;
    window.clearTimeout(closeTimer);
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    sync();

    var dur = immediate ? 0 : 460;
    if (dur === 0) {
      layer.classList.remove('is-on');
    } else {
      closeTimer = window.setTimeout(function () {
        layer.classList.remove('is-on');
      }, dur);
    }

    if (!silent && DD.audio && DD.audio.tap) DD.audio.tap(0.35);
    if (!immediate && lastFocus && document.documentElement.contains(lastFocus)) {
      try {
        lastFocus.focus({ preventScroll: true });
      } catch (e) {}
    }
    lastFocus = null;
  }

  function addButtons() {
    var scenes = document.querySelectorAll('.scene');
    for (var i = 0; i < scenes.length && i < TOTAL; i++) {
      var src = scenes[i].querySelector('.sc-src');
      if (!src || !DATA[i] || src.querySelector('.dd-src-more')) continue;

      var b = el('button', 'dd-src-more', '看详情 →');
      b.type = 'button';
      b.setAttribute('data-i', String(i));
      b.setAttribute('aria-haspopup', 'dialog');
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        open(Number(this.getAttribute('data-i')), this);
      });
      src.appendChild(b);
    }
  }

  function init() {
    addButtons();
    if (DD.stage && DD.stage.on) {
      DD.stage.on('scene', function () {
        if (isOpen()) close(true, true);
      });
    }
  }

  DD.extra = DD.extra || {};
  DD.extra.dossier = { open: open, close: close, data: DATA };
  DD.modules = DD.modules || [];
  DD.modules.push({ init: init });
})();
