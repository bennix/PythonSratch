(function () {
  const KEYWORDS = new Set(
    "and as assert break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield".split(" ")
  );

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function paint(line) {
    let html = "";
    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === "#") {
        html += '<span class="tok-cmt">' + esc(line.slice(i)) + "</span>";
        break;
      }
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let j = i + 1;
        while (j < line.length) {
          if (line[j] === "\\") {
            j += 2;
            continue;
          }
          if (line[j] === quote) {
            j += 1;
            break;
          }
          j += 1;
        }
        html += '<span class="tok-str">' + esc(line.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      if (/[0-9]/.test(ch) && (i === 0 || !/[\w]/.test(line[i - 1]))) {
        let j = i + 1;
        while (j < line.length && /[0-9.]/.test(line[j])) j += 1;
        html += '<span class="tok-num">' + esc(line.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        let j = i + 1;
        while (j < line.length && /[\w]/.test(line[j])) j += 1;
        const word = line.slice(i, j);
        const next = line.slice(j).match(/^\s*\(/);
        const cls = KEYWORDS.has(word) ? "tok-kw" : next ? "tok-fn" : "";
        html += cls ? '<span class="' + cls + '">' + esc(word) + "</span>" : esc(word);
        i = j;
        continue;
      }
      html += esc(ch);
      i += 1;
    }
    return html || "&nbsp;";
  }

  window.renderCode = function (el, src) {
    const text = src && src.trim() ? src.replace(/\n$/, "") : "# 把积木拖到这里，左侧会变成 Python";
    const lines = text.split("\n");
    el.innerHTML = lines
      .map(function (line, index) {
        return '<div class="ln"><span>' + (index + 1) + "</span><code>" + paint(line) + "</code></div>";
      })
      .join("");
  };
})();
