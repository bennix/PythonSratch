(function () {
  const GUIDE = `你是 Python 积木学习台的助教。学生用 Blockly 积木学 Python。你只能使用学习台里已经有的积木类型，不要发明新的 block type。
积木类型：text_print, text, py_comment, py_input, variables_set, variables_get, math_number, py_literal(KIND=int|str|bool, VAL), math_arithmetic(OP=ADD|MINUS|MULTIPLY|DIVIDE|POWER), py_call1(FN), py_call2(FN), logic_compare, logic_operation, logic_boolean, logic_negate, controls_if, controls_whileUntil, controls_for, controls_forEach, controls_flow_statements(FLOW=BREAK|CONTINUE), py_try, py_assert, py_list_make, py_append, py_index, py_slice, py_len, py_comp, py_tuple, py_dict_make, py_dict, py_set_make, py_set_add, py_in, py_setitem, py_values, py_items, py_def(KIND=none|pos|default|varargs|kwargs, NAME, ARGS), py_lambda, py_sorted, py_callfn, py_callstmt, py_callkw, py_return, py_import, re_pattern(PAT 不要带引号，程序会加 r), py_re_match, py_re_search, py_re_findall, py_re_group, py_re_groupn, pd_read, pd_col, pd_mean, pd_filter, pd_group, pd_plot, pd_line, py_file_write, py_file_append, py_file_read, py_json_loads。
语句用 <next> 串起来，嵌套用 <value> 或 <statement>。每个 value 和 statement 都必须接上子积木，禁止空槽。禁止生成 n = None，禁止 int(None)、float(None)。要读入数字时写成：variables_set 的值是 py_call1(int)，int 里面接 py_input。可能出错的 int 和除法必须放进 py_try 的 TRY 槽，不要放在 try 外面。除数使用已经读入的变量，不要留空。整段放在 <xml> 根里。范例数字、姓名、文件必须和当前题目不同。文件名只能是 data 目录里已有的演示文件。
要出题时，另给一个 json 代码块，语言标记为 task，字段：title, goal, hint, stdin, stdoutIncludes（字符串数组，输出里必须出现）, codeIncludes（正则字符串数组）。范例积木不要直接满足这些判定。
讲解用简体中文，可以写 Markdown 和 LaTeX（行内 $...$，独立 $$...$$）。`;

  const messages = [{ role: "system", content: GUIDE }];
  const files = [];
  let busy = false;
  let draft = "";

  const panel = document.getElementById("ai-panel");
  const log = document.getElementById("ai-log");
  const input = document.getElementById("ai-input");
  const thumbs = document.getElementById("ai-thumbs");
  const settings = document.getElementById("settings");

  function renderMd(src) {
    const maths = [];
    const protectedSrc = src
      .replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
        maths.push({ display: true, expr });
        return "@@M" + (maths.length - 1) + "@@";
      })
      .replace(/\$([^$\n]+?)\$/g, (_, expr) => {
        maths.push({ display: false, expr });
        return "@@M" + (maths.length - 1) + "@@";
      });
    let html = marked.parse(protectedSrc, { gfm: true, breaks: true });
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    html = html.replace(/@@M(\d+)@@/g, (_, i) => {
      const item = maths[Number(i)];
      try {
        return katex.renderToString(item.expr, { displayMode: item.display, throwOnError: false });
      } catch (_) {
        return item.expr;
      }
    });
    return html;
  }

  function copyText(text, button) {
    const done = () => {
      const prev = button.textContent;
      button.textContent = "已复制";
      setTimeout(() => { button.textContent = prev; }, 1200);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }

  function fallbackCopy(text, done) {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    done();
  }

  function normalizeXml(raw) {
    const text = String(raw || "").replace(/\u00a0/g, " ").trim();
    const wrapped = text.match(/<xml[\s\S]*<\/xml>/i);
    if (wrapped) return wrapped[0];
    if (/<block\b/i.test(text)) return "<xml>" + text + "</xml>";
    return text;
  }

  function decorate(bubble, text) {
    const bar = document.createElement("div");
    bar.className = "ai-bar";
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.textContent = "复制 Markdown";
    copyBtn.addEventListener("click", () => copyText(text, copyBtn));
    bar.appendChild(copyBtn);
    let xmlEditor = null;
    bubble.querySelectorAll("pre").forEach((pre) => {
      const code = pre.querySelector("code") || pre;
      const source = code.innerText;
      if (/<block\b|<xml\b/i.test(source)) {
        code.setAttribute("contenteditable", "true");
        code.setAttribute("spellcheck", "false");
        pre.classList.add("code-edit");
        xmlEditor = code;
      }
      const tools = document.createElement("div");
      tools.className = "ai-code-tools";
      const codeBtn = document.createElement("button");
      codeBtn.type = "button";
      codeBtn.textContent = "复制代码";
      codeBtn.addEventListener("click", () => copyText(code.innerText, codeBtn));
      tools.appendChild(codeBtn);
      if (code.getAttribute("contenteditable") === "true") {
        const sendBtn = document.createElement("button");
        sendBtn.type = "button";
        sendBtn.textContent = "放到画布";
        sendBtn.addEventListener("click", () => {
          try {
            loadXml(normalizeXml(code.innerText));
            sendBtn.textContent = "已放到画布";
          } catch (err) {
            sendBtn.textContent = "放不上";
          }
        });
        tools.appendChild(sendBtn);
      }
      pre.insertBefore(tools, pre.firstChild);
    });
    if (xmlEditor) {
      const sendBtn = document.createElement("button");
      sendBtn.type = "button";
      sendBtn.textContent = "放到画布";
      sendBtn.addEventListener("click", () => {
        try {
          loadXml(normalizeXml(xmlEditor.innerText));
          sendBtn.textContent = "已放到画布";
        } catch (err) {
          sendBtn.textContent = "放不上";
        }
      });
      bar.appendChild(sendBtn);
    }
    bubble.appendChild(bar);
  }

  function addBubble(role, text) {
    const el = document.createElement("div");
    el.className = "ai-msg " + role;
    if (role === "user") el.textContent = text;
    else el.innerHTML = renderMd(text);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function contextText() {
    const title = document.getElementById("task-title").textContent;
    const goal = document.getElementById("task-goal").textContent;
    const brief = document.getElementById("task-brief").textContent;
    const code = document.getElementById("code").innerText || "";
    return "当前学习内容：\n" + title + "\n" + brief + "\n" + goal + "\n当前画布生成的 Python：\n" + code.slice(0, 2000);
  }

  function extractXml(text) {
    const fenced = text.match(/```(?:xml|blockly)?\s*(<xml[\s\S]*?<\/xml>)\s*```/i);
    if (fenced) return fenced[1];
    const bare = text.match(/<xml[\s\S]*?<\/xml>/i);
    return bare ? bare[0] : "";
  }

  function loadXml(xml) {
    const ws = Blockly.getMainWorkspace();
    ws.clear();
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(normalizeXml(xml)), ws);
    ws.zoomToFit();
    if (window.labPinCanvas) window.labPinCanvas();
  }

  function applyReply(text) {
    const taskRaw = text.match(/```task\s*([\s\S]*?)```/);
    if (taskRaw && window.labAddAiTask) {
      try {
        const spec = JSON.parse(taskRaw[1]);
        window.labAddAiTask(spec);
        addBubble("note", "右侧题目和左侧列表已换成这道新题。");
      } catch (err) {
        addBubble("note", "题目格式无法使用：" + err.message);
      }
    }
    const xml = extractXml(text);
    if (xml) {
      try {
        loadXml(xml);
        addBubble("note", "范例积木已放进画布。");
      } catch (err) {
        addBubble("note", "积木没能放进画布：" + err.message);
      }
    }
  }

  async function send(extra) {
    if (busy) return;
    const settingsNow = await window.lab.getAiSettings();
    if (!settingsNow.hasKey) {
      addBubble("note", "还没有 API Key。打开设置填写，或先用邀请链接领取。");
      return;
    }
    const typed = input.value.trim();
    const prompt = [extra, typed, contextText()].filter(Boolean).join("\n\n");
    if (!typed && !extra && !files.length) return;
    input.value = "";
    addBubble("user", typed || extra || "（附件）");
    const content = [{ type: "text", text: prompt }];
    files.forEach((file) => {
      if (file.kind === "image") {
        content.push({ type: "image_url", image_url: { url: file.dataUrl } });
      } else {
        content.push({ type: "text", text: "附件 " + file.name + "：\n" + file.text.slice(0, 4000) });
      }
    });
    messages.push({ role: "user", content: files.length ? content : prompt });
    files.splice(0, files.length);
    paintThumbs();
    const bubble = addBubble("assistant", "");
    draft = "";
    busy = true;
    window.lab.onAiToken((token) => {
      draft += token;
      bubble.innerHTML = renderMd(draft);
      log.scrollTop = log.scrollHeight;
    });
    window.lab.onAiDone(() => {
      busy = false;
      messages.push({ role: "assistant", content: draft });
      applyReply(draft);
      decorate(bubble, draft);
    });
    window.lab.onAiError((message) => {
      busy = false;
      bubble.textContent = message;
    });
    window.lab.startAiChat({ model: settingsNow.model, messages });
  }

  function paintThumbs() {
    thumbs.innerHTML = "";
    files.forEach((file, index) => {
      const card = document.createElement("div");
      card.className = "ai-thumb";
      if (file.kind === "image") {
        const img = document.createElement("img");
        img.src = file.dataUrl;
        img.alt = file.name;
        card.appendChild(img);
      } else {
        card.textContent = file.name;
      }
      const del = document.createElement("button");
      del.type = "button";
      del.className = "ai-thumb-x";
      del.textContent = "×";
      del.addEventListener("click", () => {
        files.splice(index, 1);
        paintThumbs();
      });
      card.appendChild(del);
      thumbs.appendChild(card);
    });
  }

  function takeFiles(list) {
    [...list].forEach((file) => {
      if (files.length >= 5) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (file.type.startsWith("image/")) {
          files.push({ kind: "image", name: file.name, dataUrl: reader.result });
        } else {
          files.push({ kind: "text", name: file.name, text: String(reader.result) });
        }
        paintThumbs();
      };
      if (file.type.startsWith("image/")) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });
  }

  document.getElementById("btn-ai").addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });
  document.getElementById("ai-close").addEventListener("click", () => { panel.hidden = true; });

  function track(event, onMove) {
    event.preventDefault();
    function move(ev) { onMove(ev); }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  panel.querySelector(".drawer-head").addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    const rect = panel.getBoundingClientRect();
    const dx = event.clientX - rect.left;
    const dy = event.clientY - rect.top;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    track(event, (ev) => {
      panel.style.left = Math.min(Math.max(8, ev.clientX - dx), window.innerWidth - 80) + "px";
      panel.style.top = Math.min(Math.max(8, ev.clientY - dy), window.innerHeight - 48) + "px";
    });
  });

  document.getElementById("ai-resize").addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    const rect = panel.getBoundingClientRect();
    const sx = event.clientX;
    const sy = event.clientY;
    const sw = rect.width;
    const sh = rect.height;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.left = rect.left + "px";
    panel.style.top = rect.top + "px";
    track(event, (ev) => {
      panel.style.width = Math.min(window.innerWidth - 16, Math.max(280, sw + ev.clientX - sx)) + "px";
      panel.style.height = Math.min(window.innerHeight - 16, Math.max(240, sh + ev.clientY - sy)) + "px";
    });
  });
  document.getElementById("ai-send").addEventListener("click", () => send(""));
  document.getElementById("ai-blocks").addEventListener("click", () => {
    send("请根据当前学习内容，用内部积木生成一份范例程序。数字和题目不同。XML 放在 xml 代码块里，并先用一两句说明积木怎么拼。");
  });
  document.getElementById("ai-task").addEventListener("click", () => {
    send("请根据当前学习内容出一道新题，并给出判定标准。task 代码块写 title、goal、hint、stdin、stdoutIncludes、codeIncludes。再给一份不能直接通过判定的范例 XML。");
  });
  document.getElementById("ai-stop").addEventListener("click", () => window.lab.stopAiChat());
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send("");
    }
  });

  document.getElementById("btn-copy-out").addEventListener("click", () => {
    copyText(document.getElementById("output").innerText, document.getElementById("btn-copy-out"));
  });

  const drop = document.getElementById("ai-drop");
  drop.addEventListener("dragover", (event) => {
    event.preventDefault();
    drop.classList.add("over");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    drop.classList.remove("over");
    takeFiles(event.dataTransfer.files);
  });
  document.getElementById("ai-file").addEventListener("change", (event) => {
    takeFiles(event.target.files);
    event.target.value = "";
  });

  async function fillSettings() {
    const data = await window.lab.getAiSettings();
    document.getElementById("set-base").value = data.baseUrl;
    const select = document.getElementById("set-model");
    select.innerHTML = "";
    data.models.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    select.value = data.model;
    const key = document.getElementById("set-key");
    key.value = "";
    key.placeholder = data.hasKey ? "已保存，输入新密钥才会替换" : "还没有密钥";
    document.getElementById("set-invite").hidden = data.hasKey;
  }

  document.getElementById("btn-settings").addEventListener("click", async () => {
    await fillSettings();
    settings.hidden = false;
  });
  document.getElementById("set-close").addEventListener("click", () => { settings.hidden = true; });
  document.getElementById("set-add-model").addEventListener("click", () => {
    const name = document.getElementById("set-new-model").value.trim();
    if (!name) return;
    const select = document.getElementById("set-model");
    if (![...select.options].some((option) => option.value === name)) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    }
    select.value = name;
    document.getElementById("set-new-model").value = "";
  });
  document.getElementById("set-save").addEventListener("click", async () => {
    const select = document.getElementById("set-model");
    const saved = await window.lab.saveAiSettings({
      baseUrl: document.getElementById("set-base").value,
      model: select.value,
      models: [...select.options].map((option) => option.value),
      apiKey: document.getElementById("set-key").value,
    });
    document.getElementById("set-key").value = "";
    document.getElementById("set-key").placeholder = saved.hasKey ? "已保存，输入新密钥才会替换" : "还没有密钥";
    document.getElementById("set-invite").hidden = saved.hasKey;
  });
})();
