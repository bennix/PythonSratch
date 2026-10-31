(function () {
  const P = Blockly.Python;

  const origInit = P.init;
  P.init = function (workspace) {
    origInit.call(this, workspace);
    delete this.definitions_.variables;
  };

  function slotFilled(block, name) {
    const input = block.getInput(name);
    return !!(input && input.connection && input.connection.targetConnection);
  }

  P["variables_set"] = function (block) {
    if (!slotFilled(block, "VALUE")) return "";
    const name = P.getVariableName(block.getFieldValue("VAR"));
    const value = P.valueToCode(block, "VALUE", P.ORDER_NONE);
    if (!value) return "";
    return name + " = " + value + "\n";
  };

  Blockly.Msg.PROCEDURES_CALL_BEFORE_PARAMS = "传入";
  Blockly.Msg.PROCEDURES_DEFNORETURN_TITLE = "定义函数";
  Blockly.Msg.PROCEDURES_DEFRETURN_TITLE = "定义函数";
  Blockly.Msg.PROCEDURES_MUTATORCONTAINER_TITLE = "参数";
  Blockly.Msg.PROCEDURES_MUTATORARG_TITLE = "参数名：";
  ["procedures_defreturn", "procedures_defnoreturn"].forEach((type) => {
    const proto = Blockly.Blocks[type];
    if (!proto || !proto.updateParams_) return;
    const orig = proto.updateParams_;
    proto.updateParams_ = function () {
      orig.call(this);
      if (!this.getField("PARAMS")) return;
      const args = this.arguments_ || [];
      this.setFieldValue(args.length ? "(参数 " + args.join(", ") + ")" : "()", "PARAMS");
    };
  });

  Blockly.Blocks["py_input"] = {
    init() {
      this.appendDummyInput()
        .appendField("输入 input")
        .appendField(new Blockly.FieldTextInput("请输入："), "PROMPT");
      this.setOutput(true, null);
      this.setColour(160);
      this.setTooltip("生成 input(\"提示\")");
    },
  };
  P["py_input"] = function (block) {
    const prompt = block.getFieldValue("PROMPT");
    return ["input(" + P.quote_(prompt) + ")", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["py_comment"] = {
    init() {
      this.appendDummyInput()
        .appendField("# 注释")
        .appendField(new Blockly.FieldTextInput("说明这段代码在做什么"), "TEXT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(45);
    },
  };
  P["py_comment"] = function (block) {
    const text = block.getFieldValue("TEXT").replace(/\n/g, " ");
    return "# " + text + "\n";
  };

  Blockly.Blocks["py_import"] = {
    init() {
      this.appendDummyInput()
        .appendField("导入模块")
        .appendField(
          new Blockly.FieldDropdown([
            ["math", "math"],
            ["random", "random"],
            ["string", "string"],
            ["re", "re"],
            ["json", "json"],
            ["csv", "csv"],
            ["pandas", "pandas"],
          ]),
          "MOD"
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
    },
  };
  P["py_import"] = function (block) {
    const mod = block.getFieldValue("MOD");
    if (mod === "pandas") P.definitions_["import_pandas"] = "import pandas as pd";
    else P.definitions_["import_" + mod] = "import " + mod;
    return "";
  };

  function usePandas() {
    P.definitions_["import_pandas"] = "import pandas as pd";
  }
  function usePlot() {
    usePandas();
    P.definitions_["import_plt"] = "import matplotlib\nmatplotlib.use('Agg')\nimport matplotlib.pyplot as plt";
  }

  Blockly.Blocks["pd_read"] = {
    init() {
      this.appendDummyInput()
        .appendField("读取表格 pd.read_csv")
        .appendField(
          new Blockly.FieldDropdown([
            ["data/scores.csv", "data/scores.csv"],
            ["data/demo_scores.csv", "data/demo_scores.csv"],
            ["data/weeks.csv", "data/weeks.csv"],
            ["data/demo_weeks.csv", "data/demo_weeks.csv"],
          ]),
          "PATH"
        );
      this.setOutput(true, null);
      this.setColour(20);
    },
  };
  P["pd_read"] = function (block) {
    usePandas();
    return ["pd.read_csv(" + P.quote_(block.getFieldValue("PATH")) + ")", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["pd_col"] = {
    init() {
      this.appendValueInput("DF").appendField("取列");
      this.appendDummyInput().appendField(new Blockly.FieldTextInput("score"), "COL");
      this.setOutput(true, null);
      this.setColour(20);
      this.setInputsInline(true);
    },
  };
  P["pd_col"] = function (block) {
    usePandas();
    const df = P.valueToCode(block, "DF", P.ORDER_MEMBER) || "df";
    return [df + "[" + P.quote_(block.getFieldValue("COL")) + "]", P.ORDER_MEMBER];
  };

  Blockly.Blocks["pd_mean"] = {
    init() {
      this.appendValueInput("S").appendField("求平均 .mean()");
      this.setOutput(true, null);
      this.setColour(20);
    },
  };
  P["pd_mean"] = function (block) {
    usePandas();
    const s = P.valueToCode(block, "S", P.ORDER_MEMBER) || "df";
    return [s + ".mean()", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["pd_filter"] = {
    init() {
      this.appendValueInput("DF").appendField("筛选");
      this.appendDummyInput()
        .appendField("列")
        .appendField(new Blockly.FieldTextInput("score"), "COL")
        .appendField(">=");
      this.appendValueInput("N");
      this.setOutput(true, null);
      this.setColour(20);
      this.setInputsInline(true);
    },
  };
  P["pd_filter"] = function (block) {
    usePandas();
    const df = P.valueToCode(block, "DF", P.ORDER_MEMBER) || "df";
    const n = P.valueToCode(block, "N", P.ORDER_RELATIONAL) || "0";
    const col = P.quote_(block.getFieldValue("COL"));
    return [df + "[" + df + "[" + col + "] >= " + n + "]", P.ORDER_MEMBER];
  };

  Blockly.Blocks["pd_group"] = {
    init() {
      this.appendValueInput("DF").appendField("分组 groupby");
      this.appendDummyInput()
        .appendField("按")
        .appendField(new Blockly.FieldTextInput("class"), "BY")
        .appendField("对")
        .appendField(new Blockly.FieldTextInput("score"), "COL")
        .appendField("求平均");
      this.setOutput(true, null);
      this.setColour(20);
      this.setInputsInline(true);
    },
  };
  P["pd_group"] = function (block) {
    usePandas();
    const df = P.valueToCode(block, "DF", P.ORDER_MEMBER) || "df";
    const by = P.quote_(block.getFieldValue("BY"));
    const col = P.quote_(block.getFieldValue("COL"));
    return [df + ".groupby(" + by + ")[" + col + "].mean()", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["pd_plot"] = {
    init() {
      this.appendValueInput("S").appendField("柱状图 .plot.bar 保存并显示");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };
  P["pd_plot"] = function (block) {
    usePlot();
    const s = P.valueToCode(block, "S", P.ORDER_MEMBER) || "df";
    return s + ".plot.bar()\nplt.tight_layout()\nplt.savefig('plot.png')\nprint('图已保存')\n";
  };

  Blockly.Blocks["pd_line"] = {
    init() {
      this.appendValueInput("S").appendField("折线图 .plot.line 保存并显示");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
    },
  };
  P["pd_line"] = function (block) {
    usePlot();
    const s = P.valueToCode(block, "S", P.ORDER_MEMBER) || "df";
    return s + ".plot.line()\nplt.tight_layout()\nplt.savefig('plot.png')\nprint('图已保存')\n";
  };

  Blockly.Blocks["py_call1"] = {
    init() {
      this.appendValueInput("A").setCheck(null).appendField(
        new Blockly.FieldDropdown([
          ["int", "int"],
          ["float", "float"],
          ["str", "str"],
          ["len", "len"],
          ["sum", "sum"],
          ["abs", "abs"],
          ["round", "round"],
          ["math.sqrt", "math.sqrt"],
          ["math.ceil", "math.ceil"],
          ["math.floor", "math.floor"],
        ]),
        "FN"
      );
      this.setOutput(true, null);
      this.setColour(230);
    },
  };
  P["py_call1"] = function (block) {
    const fn = block.getFieldValue("FN");
    if (!slotFilled(block, "A")) return ["", P.ORDER_ATOMIC];
    const a = P.valueToCode(block, "A", P.ORDER_NONE);
    if (!a) return ["", P.ORDER_ATOMIC];
    if (fn.startsWith("math.")) P.definitions_["import_math"] = "import math";
    return [fn + "(" + a + ")", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["py_call2"] = {
    init() {
      this.appendValueInput("A").setCheck(null).appendField(
        new Blockly.FieldDropdown([
          ["round", "round"],
          ["pow", "pow"],
          ["random.randint", "random.randint"],
          ["random.uniform", "random.uniform"],
        ]),
        "FN"
      );
      this.appendValueInput("B").setCheck(null).appendField(",");
      this.setOutput(true, null);
      this.setColour(230);
      this.setInputsInline(true);
    },
  };
  P["py_call2"] = function (block) {
    const fn = block.getFieldValue("FN");
    if (!slotFilled(block, "A") || !slotFilled(block, "B")) return ["", P.ORDER_ATOMIC];
    const a = P.valueToCode(block, "A", P.ORDER_NONE);
    const b = P.valueToCode(block, "B", P.ORDER_NONE);
    if (!a || !b) return ["", P.ORDER_ATOMIC];
    if (fn.startsWith("random.")) P.definitions_["import_random"] = "import random";
    return [fn + "(" + a + ", " + b + ")", P.ORDER_FUNCTION_CALL];
  };

  function containerBlock(type, title, colour, pairs) {
    function slotUsed(block, index) {
      const names = pairs ? ["KEY", "VAL"] : ["ITEM"];
      return names.some(function (name) {
        const input = block.getInput(name + index);
        return input && input.connection && input.connection.targetConnection;
      });
    }
    function addSlot(block, index) {
      if (pairs) {
        block.appendValueInput("KEY" + index).appendField("键");
        block.appendValueInput("VAL" + index).appendField("值");
      } else {
        block.appendValueInput("ITEM" + index).appendField("元素");
      }
    }
    Blockly.Blocks[type] = {
      init() {
        this.itemCount_ = 1;
        this.appendDummyInput("HEAD").appendField(title);
        this.setOutput(true, null);
        this.setColour(colour);
        this.setTooltip("先拖出这块积木，再把整数、字符串或布尔拖进「元素」。放满后会自动再长出一格。");
        addSlot(this, 0);
      },
      mutationToDom() {
        const mutation = Blockly.utils.xml.createElement("mutation");
        mutation.setAttribute("items", String(this.itemCount_));
        return mutation;
      },
      domToMutation(xml) {
        const count = parseInt(xml.getAttribute("items"), 10) || 1;
        while (this.itemCount_ < count) {
          addSlot(this, this.itemCount_);
          this.itemCount_ += 1;
        }
      },
      onchange(event) {
        if (!event || this.isInFlyout || !this.workspace || this.resizing_) return;
        if (this.workspace.isDragging && this.workspace.isDragging()) return;
        let lastUsed = -1;
        for (let n = 0; n < this.itemCount_; n++) {
          if (slotUsed(this, n)) lastUsed = n;
        }
        const want = Math.min(12, Math.max(1, lastUsed + 2));
        if (want === this.itemCount_) return;
        this.resizing_ = true;
        Blockly.Events.disable();
        try {
          while (this.itemCount_ < want) {
            addSlot(this, this.itemCount_);
            this.itemCount_ += 1;
          }
          while (this.itemCount_ > want) {
            const index = this.itemCount_ - 1;
            if (slotUsed(this, index)) break;
            if (this.getInput("ITEM" + index)) this.removeInput("ITEM" + index);
            if (this.getInput("KEY" + index)) this.removeInput("KEY" + index);
            if (this.getInput("VAL" + index)) this.removeInput("VAL" + index);
            this.itemCount_ -= 1;
          }
        } finally {
          Blockly.Events.enable();
          this.resizing_ = false;
        }
      },
    };
  }

  containerBlock("py_list_make", "列表 [ ]", 260, false);
  containerBlock("py_dict_make", "字典 { }", 20, true);
  containerBlock("py_set_make", "集合 { }", 160, false);
  containerBlock("py_tuple", "元组 ( )", 260, false);

  function filledSlots(block, names) {
    const parts = [];
    for (let n = 0; n < block.itemCount_; n++) {
      const bits = names.map(function (name) {
        return P.valueToCode(block, name + n, P.ORDER_NONE);
      });
      if (bits.every(Boolean)) parts.push(bits);
    }
    return parts;
  }

  P["py_tuple"] = function (block) {
    const items = filledSlots(block, ["ITEM"]).map(function (pair) { return pair[0]; });
    if (items.length === 1) return ["(" + items[0] + ",)", P.ORDER_ATOMIC];
    return ["(" + items.join(", ") + ")", P.ORDER_ATOMIC];
  };
  P["py_list_make"] = function (block) {
    const items = filledSlots(block, ["ITEM"]).map(function (pair) { return pair[0]; });
    return ["[" + items.join(", ") + "]", P.ORDER_ATOMIC];
  };
  P["py_dict_make"] = function (block) {
    const items = filledSlots(block, ["KEY", "VAL"]).map(function (pair) {
      return pair[0] + ": " + pair[1];
    });
    return ["{" + items.join(", ") + "}", P.ORDER_ATOMIC];
  };
  P["py_set_make"] = function (block) {
    const items = filledSlots(block, ["ITEM"]).map(function (pair) { return pair[0]; });
    if (!items.length) return ["set()", P.ORDER_FUNCTION_CALL];
    return ["{" + items.join(", ") + "}", P.ORDER_ATOMIC];
  };

  Blockly.Blocks["py_in"] = {
    init() {
      this.appendValueInput("ITEM").appendField("元素");
      this.appendValueInput("COLL").appendField("in 在里面");
      this.setOutput(true, null);
      this.setColour(160);
      this.setInputsInline(true);
    },
  };
  P["py_in"] = function (block) {
    const item = P.valueToCode(block, "ITEM", P.ORDER_RELATIONAL) || "None";
    const coll = P.valueToCode(block, "COLL", P.ORDER_RELATIONAL) || "set()";
    return [item + " in " + coll, P.ORDER_RELATIONAL];
  };

  Blockly.Blocks["py_set_add"] = {
    init() {
      this.appendValueInput("ITEM").appendField("把");
      this.appendValueInput("SET").appendField("加入集合");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setInputsInline(true);
    },
  };
  P["py_set_add"] = function (block) {
    const item = P.valueToCode(block, "ITEM", P.ORDER_NONE) || "None";
    const coll = P.valueToCode(block, "SET", P.ORDER_MEMBER) || "set()";
    return coll + ".add(" + item + ")\n";
  };

  Blockly.Blocks["py_literal"] = {
    init() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ["整数", "int"],
          ["字符串", "str"],
          ["布尔", "bool"],
        ]), "KIND")
        .appendField(new Blockly.FieldTextInput("0"), "VAL");
      this.setOutput(true, null);
      this.setColour(230);
      this.setInputsInline(true);
      this.setTooltip("拖进列表、元组、字典或集合。整数写 0，字符串写文字，布尔写 True 或 False。");
    },
  };
  P["py_literal"] = function (block) {
    const kind = block.getFieldValue("KIND");
    const raw = String(block.getFieldValue("VAL") || "");
    if (kind === "bool") return [raw === "False" ? "False" : "True", P.ORDER_ATOMIC];
    if (kind === "str") return [P.quote_(raw), P.ORDER_ATOMIC];
    return [/^-?\d+$/.test(raw.trim()) ? raw.trim() : "0", P.ORDER_ATOMIC];
  };

  Blockly.Blocks["py_len"] = {
    init() {
      this.appendValueInput("V").appendField("长度 len");
      this.setOutput(true, null);
      this.setColour(260);
    },
  };
  P["py_len"] = function (block) {
    const v = P.valueToCode(block, "V", P.ORDER_NONE) || "[]";
    return ["len(" + v + ")", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["py_comp"] = {
    init() {
      this.appendValueInput("EXPR").appendField("[");
      this.appendDummyInput()
        .appendField("for")
        .appendField(new Blockly.FieldTextInput("n"), "VAR")
        .appendField("in");
      this.appendValueInput("SEQ");
      this.appendDummyInput().appendField("]");
      this.setOutput(true, null);
      this.setColour(260);
      this.setInputsInline(true);
      this.setTooltip("列表生成式，生成 [表达式 for 变量 in 序列]。");
    },
  };
  P["py_comp"] = function (block) {
    const expr = P.valueToCode(block, "EXPR", P.ORDER_NONE) || "None";
    const seq = P.valueToCode(block, "SEQ", P.ORDER_NONE) || "[]";
    const name = (block.getFieldValue("VAR") || "n").trim() || "n";
    return ["[" + expr + " for " + name + " in " + seq + "]", P.ORDER_ATOMIC];
  };

  Blockly.Blocks["py_slice"] = {
    init() {
      this.appendValueInput("COLL").appendField("切片");
      this.appendValueInput("A").appendField("[");
      this.appendValueInput("B").appendField(":");
      this.appendDummyInput().appendField("]");
      this.setOutput(true, null);
      this.setColour(260);
      this.setInputsInline(true);
      this.setTooltip("取出从开始到结束之前的一段，对应 a[start:end]。");
    },
  };
  P["py_slice"] = function (block) {
    const coll = P.valueToCode(block, "COLL", P.ORDER_MEMBER) || "[]";
    const a = P.valueToCode(block, "A", P.ORDER_NONE) || "None";
    const b = P.valueToCode(block, "B", P.ORDER_NONE) || "None";
    return [coll + "[" + a + ":" + b + "]", P.ORDER_MEMBER];
  };

  Blockly.Blocks["py_append"] = {
    init() {
      this.appendValueInput("ITEM").appendField("把").setCheck(null);
      this.appendValueInput("LIST").appendField("追加到列表").setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setInputsInline(true);
    },
  };
  P["py_append"] = function (block) {
    const item = P.valueToCode(block, "ITEM", P.ORDER_NONE) || "None";
    const list = P.valueToCode(block, "LIST", P.ORDER_MEMBER) || "[]";
    return list + ".append(" + item + ")\n";
  };

  Blockly.Blocks["py_index"] = {
    init() {
      this.appendValueInput("COLL").appendField("取");
      this.appendValueInput("KEY").appendField("[").setCheck(null);
      this.appendDummyInput().appendField("]");
      this.setOutput(true, null);
      this.setColour(260);
      this.setInputsInline(false);
    },
  };
  P["py_index"] = function (block) {
    const coll = P.valueToCode(block, "COLL", P.ORDER_MEMBER) || "[]";
    const key = P.valueToCode(block, "KEY", P.ORDER_NONE) || "0";
    return [coll + "[" + key + "]", P.ORDER_MEMBER];
  };

  Blockly.Blocks["py_setitem"] = {
    init() {
      this.appendValueInput("COLL").appendField("令");
      this.appendValueInput("KEY").appendField("[");
      this.appendValueInput("VAL").appendField("] =");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(260);
      this.setInputsInline(true);
    },
  };
  P["py_setitem"] = function (block) {
    const coll = P.valueToCode(block, "COLL", P.ORDER_MEMBER) || "data";
    const key = P.valueToCode(block, "KEY", P.ORDER_NONE) || "0";
    const val = P.valueToCode(block, "VAL", P.ORDER_NONE) || "None";
    return coll + "[" + key + "] = " + val + "\n";
  };

  Blockly.Blocks["py_dict"] = {
    init() {
      this.appendDummyInput().appendField("空字典 {}");
      this.setOutput(true, null);
      this.setColour(260);
    },
  };
  P["py_dict"] = function () {
    return ["{}", P.ORDER_ATOMIC];
  };

  Blockly.Blocks["py_try"] = {
    init() {
      this.appendStatementInput("TRY").appendField("尝试 try");
      this.appendStatementInput("EXCEPT").appendField("出错时 except");
      this.appendStatementInput("FINALLY").appendField("无论成败 finally");
      this.appendStatementInput("FINALLY").appendField("最后 finally");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
      this.setTooltip("finally 里的语句无论是否出错都会执行。不需要就留空。");
    },
  };
  P["py_try"] = function (block) {
    const t = P.statementToCode(block, "TRY") || P.PASS;
    const e = P.statementToCode(block, "EXCEPT") || P.PASS;
    const f = P.statementToCode(block, "FINALLY");
    let code = "try:\n" + t + "except Exception:\n" + e;
    if (f) code += "finally:\n" + f;
    return code;
  };

  Blockly.Blocks["py_assert"] = {
    init() {
      this.appendValueInput("COND").appendField("断言 assert");
      this.appendValueInput("MSG").appendField("否则说明");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
      this.setInputsInline(true);
      this.setTooltip("条件为假时抛出 AssertionError，并带上说明。");
    },
  };
  P["py_assert"] = function (block) {
    const cond = P.valueToCode(block, "COND", P.ORDER_NONE) || "False";
    const msg = P.valueToCode(block, "MSG", P.ORDER_NONE) || "''";
    return "assert " + cond + ", " + msg + "\n";
  };

  function cleanName(raw, fallback) {
    return (raw || fallback).replace(/[^\w]/g, "") || fallback;
  }

  Blockly.Blocks["py_def"] = {
    init() {
      const block = this;
      this.appendDummyInput("HEAD")
        .appendField("定义函数")
        .appendField(
          new Blockly.FieldDropdown(
            [
              ["无参数", "none"],
              ["位置参数", "pos"],
              ["默认值参数", "default"],
              ["*args 可变参数", "varargs"],
              ["**kwargs 关键字收集", "kwargs"],
            ],
            function (kind) {
              block.setKind(kind);
              return kind;
            }
          ),
          "KIND"
        )
        .appendField(new Blockly.FieldTextInput("my_func"), "NAME");
      this.appendDummyInput("ARGS_ROW")
        .appendField("参数")
        .appendField(new Blockly.FieldTextInput("a, b"), "ARGS");
      this.appendStatementInput("BODY").appendField("函数体");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("先选定义类型，再改函数名。位置参数写 a, b；默认值写 a, b=0。");
      this.setKind("pos");
    },
    setKind(kind) {
      const row = this.getInput("ARGS_ROW");
      if (!row) return;
      row.setVisible(kind !== "none");
      const presets = { pos: "a, b", default: "a, b=0", varargs: "args", kwargs: "info" };
      if (presets[kind]) this.setFieldValue(presets[kind], "ARGS");
    },
  };
  P["py_def"] = function (block) {
    const name = cleanName(block.getFieldValue("NAME"), "my_func");
    const kind = block.getFieldValue("KIND");
    let args = (block.getFieldValue("ARGS") || "").trim();
    if (kind === "none") args = "";
    if (kind === "varargs") args = "*" + args.replace(/^\*+/, "");
    if (kind === "kwargs") args = "**" + args.replace(/^\*+/, "");
    const body = P.statementToCode(block, "BODY") || P.PASS;
    return "def " + name + "(" + args + "):\n" + body;
  };

  Blockly.Blocks["py_values"] = {
    init() {
      this.appendValueInput("D").appendField(".values() 字典的值");
      this.setOutput(true, null);
      this.setColour(20);
    },
  };
  P["py_values"] = function (block) {
    const d = P.valueToCode(block, "D", P.ORDER_MEMBER) || "{}";
    return [d + ".values()", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["py_items"] = {
    init() {
      this.appendValueInput("D").appendField(".items() 字典条目");
      this.setOutput(true, null);
      this.setColour(290);
    },
  };
  P["py_items"] = function (block) {
    const d = P.valueToCode(block, "D", P.ORDER_MEMBER) || "{}";
    return [d + ".items()", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["py_sorted"] = {
    init() {
      this.appendValueInput("SEQ").appendField("sorted 排序");
      this.appendDummyInput().appendField(new Blockly.FieldDropdown([
        ["从低到高", "0"],
        ["从高到低", "1"],
      ]), "REV");
      this.appendValueInput("KEY").appendField("key=");
      this.setOutput(true, null);
      this.setColour(290);
      this.setInputsInline(true);
      this.setTooltip("key 接一个 lambda。按字典的值排序时，lambda 取条目的第 2 项。");
    },
  };
  P["py_sorted"] = function (block) {
    const seq = P.valueToCode(block, "SEQ", P.ORDER_NONE) || "[]";
    const key = P.valueToCode(block, "KEY", P.ORDER_NONE) || "None";
    const rev = block.getFieldValue("REV") === "1" ? ", reverse=True" : "";
    return ["sorted(" + seq + ", key=" + key + rev + ")", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["py_apply"] = {
    init() {
      this.appendValueInput("FN").appendField("把函数");
      this.appendValueInput("A").appendField("用在");
      this.setOutput(true, null);
      this.setColour(290);
      this.setInputsInline(true);
      this.setTooltip("用来调用 lambda。左边接 lambda，右边接参数。");
    },
  };
  P["py_apply"] = function (block) {
    const fn = P.valueToCode(block, "FN", P.ORDER_NONE) || "lambda: None";
    const arg = P.valueToCode(block, "A", P.ORDER_NONE) || "";
    return ["(" + fn + ")(" + arg + ")", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["py_lambda"] = {
    init() {
      this.appendValueInput("BODY")
        .appendField("lambda")
        .appendField(new Blockly.FieldTextInput("x"), "ARGS")
        .appendField(":");
      this.setOutput(true, null);
      this.setColour(290);
      this.setInputsInline(true);
      this.setTooltip("匿名函数。参数可写 x 或 x, y。冒号右边接表达式。");
    },
  };
  P["py_lambda"] = function (block) {
    const args = (block.getFieldValue("ARGS") || "x").trim() || "x";
    const body = P.valueToCode(block, "BODY", P.ORDER_NONE) || "None";
    return ["lambda " + args + ": " + body, P.ORDER_LAMBDA || P.ORDER_NONE];
  };

  Blockly.Blocks["py_callfn"] = {
    init() {
      this.appendValueInput("A").appendField("调用").appendField(new Blockly.FieldTextInput("my_func"), "NAME").appendField("(");
      this.appendValueInput("B").appendField(",");
      this.appendValueInput("C").appendField(",");
      this.appendDummyInput().appendField(")");
      this.setOutput(true, null);
      this.setColour(290);
      this.setInputsInline(true);
      this.setTooltip("函数名要和定义时一致。用不到的参数口留空。");
    },
  };
  function callArgs(block) {
    return ["A", "B", "C"]
      .map((slot) => P.valueToCode(block, slot, P.ORDER_NONE))
      .filter(Boolean)
      .join(", ");
  }
  P["py_callfn"] = function (block) {
    const name = cleanName(block.getFieldValue("NAME"), "my_func");
    return [name + "(" + callArgs(block) + ")", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["py_callstmt"] = {
    init() {
      this.appendValueInput("A").appendField("执行调用").appendField(new Blockly.FieldTextInput("my_func"), "NAME").appendField("(");
      this.appendValueInput("B").appendField(",");
      this.appendValueInput("C").appendField(",");
      this.appendDummyInput().appendField(")");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setInputsInline(true);
      this.setTooltip("函数自己会打印时用这个。没有参数就把插口留空。");
    },
  };
  P["py_callstmt"] = function (block) {
    const name = cleanName(block.getFieldValue("NAME"), "my_func");
    return name + "(" + callArgs(block) + ")\n";
  };

  Blockly.Blocks["py_callkw"] = {
    init() {
      this.appendDummyInput()
        .appendField("关键字调用")
        .appendField(new Blockly.FieldTextInput("my_func"), "NAME")
        .appendField("(")
        .appendField(new Blockly.FieldTextInput("city"), "K1")
        .appendField("=");
      this.appendValueInput("V1");
      this.appendDummyInput().appendField(")");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setInputsInline(true);
      this.setTooltip("按参数名传值，对应 **kwargs 或默认值参数。");
    },
  };
  P["py_callkw"] = function (block) {
    const name = cleanName(block.getFieldValue("NAME"), "my_func");
    const key = cleanName(block.getFieldValue("K1"), "city");
    const val = P.valueToCode(block, "V1", P.ORDER_NONE) || "None";
    return name + "(" + key + "=" + val + ")\n";
  };

  Blockly.Blocks["py_return"] = {
    init() {
      this.appendValueInput("V").appendField("返回 return");
      this.setPreviousStatement(true, null);
      this.setColour(290);
    },
  };
  P["py_return"] = function (block) {
    const v = P.valueToCode(block, "V", P.ORDER_NONE) || "None";
    return "return " + v + "\n";
  };

  Blockly.Blocks["py_json_loads"] = {
    init() {
      this.appendValueInput("S").appendField("json.loads");
      this.setOutput(true, null);
      this.setColour(290);
    },
  };
  const FILE_CHOICES = [
    ["grades.txt", "grades.txt"],
    ["demo_grades.txt", "demo_grades.txt"],
    ["roster.txt", "roster.txt"],
    ["demo_roster.txt", "demo_roster.txt"],
    ["messages.txt", "messages.txt"],
    ["demo_messages.txt", "demo_messages.txt"],
    ["lab.log", "lab.log"],
    ["demo_lab.log", "demo_lab.log"],
  ];
  function labFile(block) {
    const name = FILE_CHOICES.some(function (pair) { return pair[1] === block.getFieldValue("NAME"); })
      ? block.getFieldValue("NAME")
      : "grades.txt";
    return "data/" + name;
  }
  function fileStatement(type, title, mode) {
    Blockly.Blocks[type] = {
      init() {
        this.appendValueInput("TEXT").appendField(title).appendField(new Blockly.FieldDropdown(FILE_CHOICES), "NAME");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(20);
        this.setInputsInline(true);
        this.setTooltip("文件都放在 data 目录。写入会覆盖，追加会接在末尾。每次写一行。");
      },
    };
    P[type] = function (block) {
      const text = P.valueToCode(block, "TEXT", P.ORDER_NONE) || "''";
      const path = P.quote_(labFile(block));
      return "with open(" + path + ", '" + mode + "', encoding='utf-8') as _f:\n  _f.write(str(" + text + ") + '\\n')\n";
    };
  }
  fileStatement("py_file_write", "写入一行到", "w");
  fileStatement("py_file_append", "追加一行到", "a");

  Blockly.Blocks["py_file_read"] = {
    init() {
      this.appendDummyInput().appendField("读取文件").appendField(new Blockly.FieldDropdown(FILE_CHOICES), "NAME");
      this.setOutput(true, null);
      this.setColour(20);
      this.setTooltip("读出整个文件的文字。");
    },
  };
  P["py_file_read"] = function (block) {
    return ["open(" + P.quote_(labFile(block)) + ", encoding='utf-8').read()", P.ORDER_FUNCTION_CALL];
  };

  P["py_json_loads"] = function (block) {
    P.definitions_["import_json"] = "import json";
    const s = P.valueToCode(block, "S", P.ORDER_NONE) || "''";
    return ["json.loads(" + s + ")", P.ORDER_FUNCTION_CALL];
  };

  const RE_META = [
    ["\\d 一位数字", "\\d"],
    ["\\D 非数字", "\\D"],
    ["\\w 字母数字或下划线", "\\w"],
    ["\\W 非单词字符", "\\W"],
    ["\\s 空白", "\\s"],
    ["\\S 非空白", "\\S"],
    [". 除换行外任意字符", "."],
    ["\\d+ 一串数字", "\\d+"],
    ["\\w+ 一串单词字符", "\\w+"],
    ["* 前面的字符重复 0 次或更多", "*"],
    ["+ 前面的字符重复 1 次或更多", "+"],
    ["? 前一个字符可有可无", "?"],
    ["\\? 问号本身", "\\?"],
    ["s? 同时匹配 http 与 https", "s?"],
    ["^ 字符串开头", "^"],
    ["$ 字符串结尾", "$"],
    ["[] 字符组", "[]"],
    ["() 分组", "()"],
    ["| 或", "|"],
  ];

  Blockly.Blocks["re_meta"] = {
    init() {
      this.appendDummyInput().appendField("元字符").appendField(new Blockly.FieldDropdown(RE_META), "META");
      this.setOutput(true, null);
      this.setColour(200);
      this.setTooltip("这是一个模式片段，接到 match、search 或 findall 的模式口。");
    },
  };
  function rawLiteral(text) {
    const body = String(text);
    const q = body.indexOf("'") === -1 ? "'" : '"';
    return "r" + q + body.split(q).join("\\" + q) + q;
  }

  function asRaw(code) {
    const matched = code.match(/^(['"])([\s\S]*)\1$/);
    if (!matched) return code;
    const body = matched[2].replace(/\\(.)/g, function (_, ch) {
      return ch;
    });
    return rawLiteral(body);
  }

  P["re_meta"] = function (block) {
    return [rawLiteral(block.getFieldValue("META")), P.ORDER_ATOMIC];
  };

  Blockly.Blocks["re_pattern"] = {
    init() {
      this.appendDummyInput()
        .appendField("r")
        .appendField(new Blockly.FieldTextInput("\\d+"), "PAT");
      this.setOutput(true, null);
      this.setColour(200);
      this.setTooltip("原始字符串。反斜杠只写一次，例如 \\d+ 会生成 r'\\d+'。");
    },
  };
  P["re_pattern"] = function (block) {
    return [rawLiteral(block.getFieldValue("PAT")), P.ORDER_ATOMIC];
  };

  function reCall(fn) {
    return function (block) {
      P.definitions_["import_re"] = "import re";
      const pat = asRaw(P.valueToCode(block, "PAT", P.ORDER_NONE) || "''");
      const text = P.valueToCode(block, "TEXT", P.ORDER_NONE) || "''";
      return ["re." + fn + "(" + pat + ", " + text + ")", P.ORDER_FUNCTION_CALL];
    };
  }

  Blockly.Blocks["py_re_match"] = {
    init() {
      this.appendValueInput("PAT").appendField("re.match 模式 r");
      this.appendValueInput("TEXT").appendField("文本");
      this.setOutput(true, null);
      this.setColour(200);
      this.setInputsInline(true);
    },
  };
  P["py_re_match"] = reCall("match");

  Blockly.Blocks["py_re_search"] = {
    init() {
      this.appendValueInput("PAT").appendField("re.search 模式 r");
      this.appendValueInput("TEXT").appendField("文本");
      this.setOutput(true, null);
      this.setColour(200);
      this.setInputsInline(true);
    },
  };
  P["py_re_search"] = reCall("search");

  Blockly.Blocks["py_re_group"] = {
    init() {
      this.appendValueInput("M").appendField(".group() 取出匹配文本");
      this.setOutput(true, null);
      this.setColour(200);
    },
  };
  P["py_re_group"] = function (block) {
    const m = P.valueToCode(block, "M", P.ORDER_MEMBER) || "None";
    return [m + ".group()", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["py_re_groupn"] = {
    init() {
      this.appendValueInput("M").appendField(".group(");
      this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(1, 0, 9, 1), "N")
        .appendField(") 第几个捕获组");
      this.setOutput(true, null);
      this.setColour(200);
      this.setInputsInline(true);
      this.setTooltip("圆括号从左往右编号，从 1 开始。0 是整段匹配。");
    },
  };
  P["py_re_groupn"] = function (block) {
    const m = P.valueToCode(block, "M", P.ORDER_MEMBER) || "None";
    const n = block.getFieldValue("N") || "1";
    return [m + ".group(" + n + ")", P.ORDER_FUNCTION_CALL];
  };

  Blockly.Blocks["py_re_findall"] = {
    init() {
      this.appendValueInput("PAT").appendField("re.findall 模式 r");
      this.appendValueInput("TEXT").appendField("文本");
      this.setOutput(true, null);
      this.setColour(290);
      this.setInputsInline(true);
    },
  };
  P["py_re_findall"] = function (block) {
    P.definitions_["import_re"] = "import re";
    const pat = P.valueToCode(block, "PAT", P.ORDER_NONE) || "''";
    const text = P.valueToCode(block, "TEXT", P.ORDER_NONE) || "''";
    return ["re.findall(" + pat + ", " + text + ")", P.ORDER_FUNCTION_CALL];
  };

  window.TOOLBOX = `
<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display:none">
  <category name="输出与输入" colour="160">
    <block type="text_print"></block>
    <block type="py_input"></block>
    <block type="py_comment"></block>
    <block type="text"><field name="TEXT"></field></block>
  </category>
  <category name="变量与运算" colour="330">
    <block type="variables_set"></block>
    <block type="variables_get"></block>
    <block type="math_number"><field name="NUM">0</field></block>
    <block type="py_literal"><field name="KIND">int</field><field name="VAL">0</field></block>
    <block type="py_literal"><field name="KIND">str</field><field name="VAL">文本</field></block>
    <block type="py_literal"><field name="KIND">bool</field><field name="VAL">True</field></block>
    <block type="math_arithmetic"></block>
    <block type="py_call1"></block>
    <block type="py_call2"></block>
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_boolean"></block>
    <block type="logic_negate"></block>
  </category>
  <category name="流程控制" colour="120">
    <block type="controls_if"></block>
    <block type="controls_whileUntil"></block>
    <block type="controls_for"></block>
    <block type="controls_repeat_ext"></block>
    <block type="controls_flow_statements"></block>
    <block type="py_try"></block>
    <block type="py_assert"></block>
    <block type="controls_forEach"></block>
  </category>
  <category name="列表" colour="260">
    <block type="py_list_make"></block>
    <block type="py_literal"><field name="KIND">int</field><field name="VAL">0</field></block>
    <block type="py_literal"><field name="KIND">str</field><field name="VAL">文本</field></block>
    <block type="py_literal"><field name="KIND">bool</field><field name="VAL">True</field></block>
    <block type="py_append"></block>
    <block type="py_index"></block>
    <block type="py_slice"></block>
    <block type="py_len"></block>
    <block type="py_comp"></block>
  </category>
  <category name="元组" colour="260">
    <block type="py_tuple"></block>
    <block type="py_literal"><field name="KIND">int</field><field name="VAL">0</field></block>
    <block type="py_literal"><field name="KIND">str</field><field name="VAL">文本</field></block>
    <block type="py_literal"><field name="KIND">bool</field><field name="VAL">True</field></block>
    <block type="py_index"></block>
  </category>
  <category name="字典集合" colour="20">
    <block type="py_dict_make"></block>
    <block type="py_literal"><field name="KIND">str</field><field name="VAL">文本</field></block>
    <block type="py_literal"><field name="KIND">int</field><field name="VAL">0</field></block>
    <block type="py_literal"><field name="KIND">bool</field><field name="VAL">True</field></block>
    <block type="py_set_make"></block>
    <block type="py_set_add"></block>
    <block type="py_in"></block>
    <block type="py_dict"></block>
    <block type="py_index"></block>
    <block type="py_setitem"></block>
    <block type="py_values"></block>
    <block type="py_items"></block>
    <block type="controls_forEach"></block>
  </category>
  <category name="函数" colour="290">
    <block type="py_def"><field name="KIND">none</field></block>
    <block type="py_def"><field name="KIND">pos</field></block>
    <block type="py_def"><field name="KIND">default</field></block>
    <block type="py_def"><field name="KIND">varargs</field></block>
    <block type="py_def"><field name="KIND">kwargs</field></block>
    <block type="py_lambda"></block>
    <block type="py_items"></block>
    <block type="py_sorted"></block>
    <block type="py_apply"></block>
    <block type="py_callfn"></block>
    <block type="py_callstmt"></block>
    <block type="py_callkw"></block>
    <block type="py_return"></block>
    <block type="procedures_defnoreturn"></block>
    <block type="procedures_defreturn"></block>
  </category>
  <category name="正则" colour="200">
    <block type="re_pattern"></block>
    <block type="re_meta"></block>
    <block type="py_re_match"></block>
    <block type="py_re_search"></block>
    <block type="py_re_findall"></block>
    <block type="py_re_group"></block>
    <block type="py_re_groupn"></block>
    <block type="py_import"><field name="MOD">re</field></block>
    <block type="text"><field name="TEXT"></field></block>
    <block type="text_print"></block>
    <block type="variables_set"></block>
    <block type="variables_get"></block>
  </category>
  <category name="Pandas" colour="65">
    <block type="py_import"><field name="MOD">pandas</field></block>
    <block type="pd_read"></block>
    <block type="pd_col"></block>
    <block type="pd_mean"></block>
    <block type="pd_filter"></block>
    <block type="pd_group"></block>
    <block type="pd_plot"></block>
    <block type="pd_line"></block>
    <block type="text_print"></block>
    <block type="variables_set"></block>
    <block type="variables_get"></block>
    <block type="math_number"><field name="NUM">90</field></block>
    <block type="py_call1"></block>
  </category>
  <category name="文件" colour="20">
    <block type="py_file_write"><field name="NAME">grades.txt</field></block>
    <block type="py_file_append"><field name="NAME">grades.txt</field></block>
    <block type="py_file_read"><field name="NAME">roster.txt</field></block>
    <block type="re_pattern"></block>
    <block type="py_re_findall"></block>
    <block type="text"><field name="TEXT"></field></block>
    <block type="text_print"></block>
    <block type="variables_set"></block>
    <block type="variables_get"></block>
  </category>
  <category name="标准库与数据" colour="200">
    <block type="py_import"></block>
    <block type="py_call1"></block>
    <block type="py_call2"></block>
    <block type="py_json_loads"></block>
  </category>
</xml>`;
})();
