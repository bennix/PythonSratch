(function () {
  const darkTheme = Blockly.Theme.defineTheme("labDark", {
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: "#0f1419",
      toolboxBackgroundColour: "#17202b",
      toolboxForegroundColour: "#d7e3f4",
      flyoutBackgroundColour: "#1a2332",
      flyoutForegroundColour: "#e7eef8",
      scrollbarColour: "#3dd6c6",
    },
  });
  const lightTheme = Blockly.Theme.defineTheme("labLight", {
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: "#f4f7fb",
      toolboxBackgroundColour: "#ffffff",
      toolboxForegroundColour: "#1c2430",
      flyoutBackgroundColour: "#e8eef6",
      flyoutForegroundColour: "#1c2430",
      scrollbarColour: "#4c8dff",
    },
  });

  const workspace = Blockly.inject("blockly", {
    toolbox: window.TOOLBOX,
    trashcan: true,
    theme: darkTheme,
    zoom: { controls: true, wheel: true, startScale: 0.95 },
    move: { scrollbars: true, drag: true, wheel: true },
  });

  const themeBtn = document.getElementById("btn-theme");
  function applyTheme(mode) {
    const light = mode === "light";
    document.body.classList.toggle("light", light);
    workspace.setTheme(light ? lightTheme : darkTheme);
    const bg = light ? "#f4f7fb" : "#0f1419";
    const fly = light ? "#e8eef6" : "#1a2332";
    const tool = light ? "#ffffff" : "#17202b";
    const ink = light ? "#1c2430" : "#d7e3f4";
    document.querySelectorAll(".blocklyMainBackground").forEach((el) => el.setAttribute("fill", bg));
    document.querySelectorAll(".blocklyFlyoutBackground").forEach((el) => el.setAttribute("fill", fly));
    document.querySelectorAll(".blocklyToolboxDiv").forEach((el) => { el.style.background = tool; });
    document.querySelectorAll(".blocklyTreeLabel").forEach((el) => { el.style.color = ink; });
    themeBtn.textContent = light ? "暗黑" : "明亮";
    localStorage.setItem("py-lab-theme", mode);
  }
  themeBtn.addEventListener("click", () => {
    applyTheme(document.body.classList.contains("light") ? "dark" : "light");
  });
  applyTheme(localStorage.getItem("py-lab-theme") || "dark");

  const listEl = document.getElementById("task-list");
  const titleEl = document.getElementById("task-title");
  const briefEl = document.getElementById("task-brief");
  const goalEl = document.getElementById("task-goal");
  const hintEl = document.getElementById("task-hint");
  const exampleEl = document.getElementById("example");
  const codeEl = document.getElementById("code");
  const outEl = document.getElementById("output");
  const verdictEl = document.getElementById("verdict");
  const stdinEl = document.getElementById("stdin");
  const plotEl = document.getElementById("plot");

  let current = window.TASKS[0];
  const snapshots = {};
  let dataNames = [];

  async function showDataFiles(mentioned) {
    const picks = document.getElementById("file-picks");
    const view = document.getElementById("file-view");
    if (!window.lab.listDataFiles) return;
    dataNames = await window.lab.listDataFiles();
    const hit = dataNames.find((name) => mentioned && mentioned.indexOf(name) !== -1);
    picks.innerHTML = "";
    dataNames.forEach((name) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = name;
      btn.addEventListener("click", () => openDataFile(name));
      picks.appendChild(btn);
    });
    if (hit) openDataFile(hit);
    else view.textContent = dataNames.length ? "点一个文件名查看内容。" : "data 目录里还没有文本文件。";
  }

  async function openDataFile(name) {
    const view = document.getElementById("file-view");
    document.querySelectorAll("#file-picks button").forEach((btn) => {
      btn.classList.toggle("active", btn.textContent === name);
    });
    const result = await window.lab.readDataFile(name);
    view.textContent = result.ok ? result.text : "读不到这个文件。";
  }

  function codeNow() {
    return Blockly.Python.workspaceToCode(workspace);
  }

  function refreshCode() {
    const code = codeNow();
    window.renderCode(codeEl, code);
  }

  function showTask(task) {
    stopDemo();
    document.getElementById("demo-bar").classList.remove("show");
    if (current) snapshots[current.id] = Blockly.Xml.workspaceToDom(workspace);
    current = task;
    titleEl.textContent = "第 " + task.week + " 周 · " + task.title;
    briefEl.textContent = task.brief;
    goalEl.textContent = task.goal;
    hintEl.textContent = "提示：" + task.hint;
    const regexRef = document.getElementById("regex-ref");
    regexRef.innerHTML = task.regex
      ? "<h3>正则元字符</h3><table class=\"meta\"><tr><td>\\d \\D</td><td>数字 / 非数字</td><td>\\w \\W</td><td>单词字符 / 其他</td></tr><tr><td>\\s \\S</td><td>空白 / 非空白</td><td>.</td><td>除换行外任意字符</td></tr><tr><td>* + ?</td><td>重复 0+、1+、0 或 1 次。https? 里的 ? 让 s 可有可无，于是 http 和 https 都能匹配</td><td>^ $</td><td>开头 / 结尾</td></tr><tr><td>\\?</td><td>问号本身。网址参数里的 ? 在正则里要写成 \\?</td><td>|</td><td>或</td></tr><tr><td>[] ()</td><td>字符组 / 分组</td><td>match</td><td>只从开头匹配</td></tr><tr><td>search</td><td>任意位置找第一处</td><td>findall</td><td>找出全部，返回列表</td></tr><tr><td>()</td><td>捕获组，从左往右编号，从 1 开始</td><td>group(1)</td><td>第 1 个括号里匹配到的文本。group(0) 是整段</td></tr></table>"
      : "";
    const excRef = document.getElementById("exc-ref");
    excRef.innerHTML = task.errors
      ? "<h3>异常与断言</h3><table class=\"meta\"><tr><td>try</td><td>放可能出错的代码</td></tr><tr><td>except</td><td>出错后执行，程序可以继续</td></tr><tr><td>finally</td><td>无论成败都会执行，用来收尾</td></tr><tr><td>assert</td><td>条件为假就中断，并带上说明</td></tr></table>"
      : "";
    const dataRef = document.getElementById("data-ref");
    const topics = {
      dict: "<h3>字典</h3><table class=\"meta\"><tr><td>{键: 值}</td><td>一次放入多对。键通常是字符串</td></tr><tr><td>d[键]</td><td>取值。键必须已经存在</td></tr><tr><td>d[键] = 值</td><td>没有这个键就新增，已有就覆盖</td></tr><tr><td>for k in d</td><td>遍历得到的是键，顺序和放入顺序一致</td></tr><tr><td>.values()</td><td>只拿出值</td></tr><tr><td>.items()</td><td>拿出键值对，适合排序</td></tr></table>",
      tuple: "<h3>元组</h3><table class=\"meta\"><tr><td>(a, b)</td><td>用圆括号建立，项与项用逗号隔开</td></tr><tr><td>t[0]</td><td>按下标取值，从 0 开始</td></tr><tr><td>不能改项</td><td>建好后不能给 t[0] 重新赋值</td></tr></table>",
      nest: "<h3>嵌套列表</h3><table class=\"meta\"><tr><td>[[], []]</td><td>元素本身还是列表</td></tr><tr><td>a[i]</td><td>先取出第 i 行</td></tr><tr><td>a[i][j]</td><td>再取出这一行的第 j 列</td></tr></table>",
      comp: "<h3>列表生成式</h3><table class=\"meta\"><tr><td>[表达式 for 变量 in 序列]</td><td>对序列每一项算出一个新值，收成新列表</td></tr></table>",
      loop: "<h3>循环</h3><table class=\"meta\"><tr><td>for</td><td>次数或范围事先知道时用</td></tr><tr><td>while</td><td>条件还成立就继续，循环里要改变条件</td></tr><tr><td>break</td><td>立刻结束整个循环</td></tr><tr><td>continue</td><td>跳过这一轮剩下的语句，进入下一轮</td></tr></table>",
      file: "<h3>文件</h3><table class=\"meta\"><tr><td>写入</td><td>模式 w。文件已有内容会被清空，然后写入新的一行</td></tr><tr><td>追加</td><td>模式 a。新行接在文件末尾</td></tr><tr><td>读取</td><td>把整个文件读成一段文字，再打印或交给正则</td></tr><tr><td>位置</td><td>这些文件都在 data 目录里</td></tr></table>",
      set: "<h3>集合</h3><table class=\"meta\"><tr><td>{a, b}</td><td>花括号建立。重复元素只保留一个，而且没有顺序</td></tr><tr><td>set()</td><td>空集合。写 {} 会变成空字典</td></tr><tr><td>x in s</td><td>判断元素在不在集合里</td></tr><tr><td>s.add(x)</td><td>往集合里再加一个元素</td></tr><tr><td>空位</td><td>拖进一个元素后，列表、元组、字典、集合会自动再长出一格</td></tr></table>",
    };
    dataRef.innerHTML = topics[task.topic] || "";
    const sample = window.EXAMPLES[task.id];
    window.renderCode(exampleEl, sample ? sample.text : "这一题还没有范例");
    const mentioned = ((sample && sample.text) || "") + " " + (task.goal || "");
    showDataFiles(mentioned);
    stdinEl.value = (task.tests[0] && task.tests[0].stdin) || "";
    verdictEl.textContent = "";
    verdictEl.className = "";
    outEl.textContent = "尚未运行";
    plotEl.hidden = true;
    workspace.clear();
    if (snapshots[task.id]) Blockly.Xml.domToWorkspace(snapshots[task.id], workspace);
    refreshCode();
    document.querySelectorAll(".task-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.id === task.id);
    });
  }

  const byWeek = new Map();
  window.TASKS.forEach((task) => {
    if (!byWeek.has(task.week)) byWeek.set(task.week, []);
    byWeek.get(task.week).push(task);
  });
  byWeek.forEach((tasks, week) => {
    const box = document.createElement("div");
    box.className = "week";
    const label = document.createElement("button");
    label.type = "button";
    label.className = "week-btn";
    label.textContent = "第 " + week + " 周";
    box.appendChild(label);
    tasks.forEach((task) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "task-btn";
      btn.dataset.id = task.id;
      btn.textContent = task.title;
      btn.addEventListener("click", () => showTask(task));
      box.appendChild(btn);
    });
    listEl.appendChild(box);
  });

  workspace.addChangeListener(refreshCode);

  const STEP_NAMES = {
    text_print: "打印",
    text: "文字",
    py_comment: "注释",
    py_input: "输入",
    variables_set: "赋值",
    variables_get: "读取变量",
    math_number: "数字",
    py_literal: "字面值",
    py_len: "长度",
    py_slice: "切片",
    math_arithmetic: "运算",
    py_call1: "函数调用",
    py_call2: "双参数调用",
    logic_compare: "比较",
    controls_if: "如果",
    controls_for: "计数循环",
    controls_forEach: "遍历",
    controls_whileUntil: "当循环",
    controls_flow_statements: "break 或 continue",
    py_try: "异常处理",
    py_assert: "断言",
    py_def: "定义函数",
    py_callfn: "调用函数",
    py_callstmt: "执行调用",
    py_callkw: "关键字调用",
    py_return: "返回",
    py_lambda: "lambda",
    py_apply: "把函数用在",
    py_sorted: "排序",
    py_index: "取值",
    py_setitem: "写入",
    py_dict: "空字典",
    py_dict_make: "字典",
    py_file_write: "写入文件",
    py_file_append: "追加文件",
    py_file_read: "读取文件",
    py_tuple: "元组",
    py_comp: "列表生成式",
    py_values: "字典的值",
    py_append: "追加",
    lists_create_with: "列表",
    lists_create_empty: "空列表",
    py_re_match: "re.match",
    py_re_search: "re.search",
    py_re_findall: "re.findall",
    py_re_group: "取出匹配",
    py_re_groupn: "第几个捕获组",
    re_meta: "元字符",
    re_pattern: "原始字符串模式",
    pd_read: "读表",
    pd_col: "取列",
    pd_mean: "求平均",
    pd_filter: "筛选",
    pd_group: "分组",
    pd_plot: "柱状图",
    pd_line: "折线图",
    procedures_defreturn: "定义函数",
    procedures_callreturn: "调用函数",
  };

  const demoBar = document.getElementById("demo-bar");
  const demoCaption = document.getElementById("demo-caption");
  let demoTimer = null;
  let demoIndex = 0;
  let demoTotal = 0;

  function stopDemo() {
    if (demoTimer) clearInterval(demoTimer);
    demoTimer = null;
    document.getElementById("demo-play").textContent = "播放";
  }

  function loadExample(partialCount) {
    const sample = window.EXAMPLES[current.id];
    if (!sample) return 0;
    const dom = Blockly.utils.xml.textToDom(sample.xml);
    const blocks = Array.from(dom.getElementsByTagName("block"));
    blocks.forEach(function (block, index) {
      if (partialCount == null || index < partialCount) block.setAttribute("id", "demo-" + index);
    });
    if (partialCount != null) {
      for (let i = blocks.length - 1; i >= partialCount; i--) blocks[i].parentNode.removeChild(blocks[i]);
    }
    workspace.clear();
    Blockly.Xml.domToWorkspace(dom, workspace);
    const shown = partialCount == null ? blocks.length : partialCount;
    if (shown > 0) {
      const added = workspace.getBlockById("demo-" + (shown - 1));
      if (added) {
        added.select();
        workspace.centerOnBlock(added.id);
      }
    }
    refreshCode();
    return blocks.length;
  }

  function finishDemo() {
    stopDemo();
    demoIndex = demoTotal;
    loadExample(null);
    if (workspace.zoomToFit) workspace.zoomToFit();
    demoBar.classList.add("show");
    demoCaption.textContent = "演示完成，程序已经搭好，可以直接运行。";
  }

  function showDemoStep(index) {
    const sample = window.EXAMPLES[current.id];
    if (!sample) return;
    const total = Blockly.utils.xml.textToDom(sample.xml).getElementsByTagName("block").length;
    demoTotal = total;
    if (index >= total) {
      finishDemo();
      return;
    }
    demoIndex = Math.max(0, index);
    const dom = Blockly.utils.xml.textToDom(sample.xml);
    const blocks = Array.from(dom.getElementsByTagName("block"));
    loadExample(demoIndex);
    demoBar.classList.add("show");
    if (demoIndex === 0) {
      demoCaption.textContent = "共 " + total + " 块。点下一步开始搭第一块。";
      return;
    }
    const type = blocks[demoIndex - 1].getAttribute("type");
    demoCaption.textContent = "第 " + demoIndex + " / " + total + " 步：" + (STEP_NAMES[type] || type);
  }

  document.getElementById("btn-example").addEventListener("click", () => {
    stopDemo();
    demoBar.classList.remove("show");
    const sample = window.EXAMPLES[current.id];
    if (!sample) return;
    loadExample(null);
    verdictEl.textContent = "";
    verdictEl.className = "";
  });

  document.getElementById("btn-demo").addEventListener("click", () => {
    stopDemo();
    verdictEl.textContent = "";
    showDemoStep(0);
    showDemoStep(1);
  });

  document.getElementById("demo-prev").addEventListener("click", () => {
    stopDemo();
    showDemoStep(demoIndex - 1);
  });
  document.getElementById("demo-next").addEventListener("click", () => {
    stopDemo();
    showDemoStep(demoIndex + 1);
  });
  document.getElementById("demo-play").addEventListener("click", () => {
    if (demoTimer) {
      stopDemo();
      return;
    }
    if (!demoBar.classList.contains("show") || demoIndex >= demoTotal) showDemoStep(0);
    document.getElementById("demo-play").textContent = "暂停";
    demoTimer = setInterval(() => {
      if (demoIndex >= demoTotal) {
        finishDemo();
        return;
      }
      showDemoStep(demoIndex + 1);
    }, 900);
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    delete snapshots[current.id];
    workspace.clear();
    refreshCode();
    verdictEl.textContent = "";
  });

  function showResult(result) {
    const parts = [];
    if (result.stdout) parts.push(result.stdout.replace(/\s+$/, ""));
    if (result.stderr) parts.push(result.stderr);
    outEl.textContent = parts.join("\n") || (result.ok ? "(没有输出)" : "运行失败");
    if (result.image) {
      plotEl.hidden = false;
      plotEl.src = "data:image/png;base64," + result.image;
    } else {
      plotEl.hidden = true;
    }
  }

  async function runOnce(stdin) {
    return window.lab.runPython({ code: codeNow(), stdin: stdin || "" });
  }

  document.getElementById("btn-run").addEventListener("click", async () => {
    outEl.textContent = "运行中…";
    showResult(await runOnce(stdinEl.value));
    const active = document.querySelector("#file-picks button.active");
    await showDataFiles(active ? active.textContent : "");
  });

  document.getElementById("btn-check").addEventListener("click", async () => {
    const code = codeNow();
    const runs = [];
    for (const test of current.tests) {
      runs.push(await window.lab.runPython({ code, stdin: test.stdin }));
    }
    const ok = current.accept(code, runs);
    const last = runs[runs.length - 1];
    showResult(last);
    verdictEl.className = ok ? "ok" : "bad";
    verdictEl.textContent = ok ? "通过。可以做下一题。" : "还没通过。看目标和提示，改积木后再检查。";
    const active = document.querySelector("#file-picks button.active");
    await showDataFiles(active ? active.textContent : "");
  });

  showTask(current);
  snapshots[current.id] = null;
})();
