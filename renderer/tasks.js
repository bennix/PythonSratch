(function () {
  window.TASKS = [
    {
      id: "w1-hello",
      week: 1,
      title: "新年问候",
      brief: "理解 IPO：积木是输入与处理，print 是输出。AI 只负责起草，你要能解释。",
      goal: "打印一行 Happy New Year 2026！，并放一条注释，写出你用来生成这句问候的提示词。",
      hint: "先拖「注释」，再拖「打印」。注释里要出现「提示词」三个字。",
      stdin: "",
      tests: [{ stdin: "", expect: /Happy New Year 2026/ }],
      accept(code, runs) {
        return runs[0].ok && /提示词/.test(code) && /Happy New Year 2026/.test(runs[0].stdout);
      },
    },
    {
      id: "w2-bmi",
      week: 2,
      title: "BMI 计算器",
      brief: "变量、float、除法。BMI = 体重(kg) / 身高(m)²。",
      goal: "依次 input 体重和身高，打印 BMI，保留两位小数。测试输入 70 和 1.75，结果应为 22.86。",
      hint: "用 float 包住 input。round(值, 2) 在「变量与运算」里。",
      tests: [{ stdin: "70\n1.75\n", expect: /22\.86/ }],
      accept(code, runs) {
        return runs[0].ok && /input\(/.test(code) && /22\.86/.test(runs[0].stdout);
      },
    },
    {
      errors: true,
      errors: true,
      id: "w4-debug",
      week: 4,
      title: "捕获错误",
      brief: "语法错误、运行时错误、逻辑错误不是一回事。这里练习运行时错误。",
      goal: "用 try 把 int('abc') 包起来。出错时打印：捕获到错误",
      hint: "「尝试」里 int('abc')，「出错时」里打印那句话。",
      tests: [{ stdin: "", expect: /捕获到错误/ }],
      accept(code, runs) {
        return runs[0].ok && /try:/.test(code) && /except/.test(code) && /捕获到错误/.test(runs[0].stdout);
      },
    },
    {
      errors: true,
      id: "w4-finally",
      week: 4,
      title: "finally 总会执行",
      brief: "finally 不负责抓错误。无论 try 成功还是 except 接住了错误，它都会执行，适合做收尾。",
      goal: "try 里执行 int('abc')，出错时打印：捕获到错误。finally 里打印：finally已执行。两句都要出现。",
      hint: "三格分别是尝试、出错时、最后。范例用的是另一句收尾。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /finally:/.test(code) && /捕获到错误/.test(runs[0].stdout) && /finally已执行/.test(runs[0].stdout);
      },
    },
    {
      errors: true,
      id: "w4-assert",
      week: 4,
      title: "断言 assert",
      brief: "assert 用来声明一个必须成立的条件。条件为假时程序立刻中断，并带上你写的说明。",
      goal: "断言 80 >= 0，说明写「分数不能为负」。条件成立，接着打印：断言通过。",
      hint: "比较积木放在 assert 后面。范例断言的是另一个数，打印的也是另一句。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /assert /.test(code) && /断言通过/.test(runs[0].stdout);
      },
    },
    {
      errors: true,
      id: "w4-finally",
      week: 4,
      title: "finally 总会执行",
      brief: "finally 里的代码无论 try 成功还是 except 接住错误，都会执行。适合放关闭文件、打印收尾这类动作。",
      goal: "try 里执行 int('abc')，except 打印：捕获到错误，finally 打印：finally已执行。两句都要出现。",
      hint: "同一块 try 积木有三个槽：尝试、出错时、无论成败。范例的两句打印文字不同。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /finally:/.test(code) && /捕获到错误/.test(runs[0].stdout) && /finally已执行/.test(runs[0].stdout);
      },
    },
    {
      errors: true,
      id: "w4-assert",
      week: 4,
      title: "断言 assert",
      brief: "assert 用来声明一个必须成立的条件。条件为假时立刻抛出 AssertionError，并带上你写的说明。",
      goal: "令 n = 80，断言 n >= 0，说明写「分数不能为负」。断言通过后打印：断言通过。",
      hint: "比较积木放在 assert 左边，说明用字符串。范例用的是另一个数字和另一句输出。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /assert /.test(code) && /断言通过/.test(runs[0].stdout);
      },
    },
    {
      topic: "loop",
      id: "w5-sum",
      week: 5,
      title: "从 1 加到 n",
      brief: "循环是重复的处理。先想清楚累加变量的初值。",
      goal: "读取整数 n，打印 1+2+...+n。测试 n=5 时应打印 15。",
      hint: "while 或 for 都可以。记得把 input 转成 int。",
      tests: [
        { stdin: "5\n", expect: /15/ },
        { stdin: "1\n", expect: /^1\s*$/ },
      ],
      accept(code, runs) {
        return runs.every((r) => r.ok) && /15/.test(runs[0].stdout) && /^1\s*$/.test(runs[1].stdout.trim()) && (/while |for /.test(code));
      },
    },
    {
      topic: "loop",
      id: "w5-while",
      week: 5,
      title: "while 循环",
      brief: "while 在条件还成立时重复。循环体里要让条件迟早变成假，否则会一直转下去。",
      goal: "n 从 1 开始，当 n <= 3 时打印 n，然后把 n 加 1。输出依次是 1、2、3。",
      hint: "条件用比较积木。循环里面先打印，再给 n 加 1。范例只数到 2。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /while /.test(code) && /^1\n2\n3\s*$/.test(runs[0].stdout);
      },
    },
    {
      topic: "loop",
      id: "w5-break",
      week: 5,
      title: "break 提前结束",
      brief: "break 立刻结束整个循环，后面的轮次不再执行。",
      goal: "for 从 1 数到 5。遇到 3 就 break。3 之前的数要打印，输出只有 1 和 2。",
      hint: "先判断 i 是否等于 3，等于就放「中断循环」。打印放在判断后面。范例在 2 就停。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        const out = runs[0].stdout;
        return runs[0].ok && /break/.test(code) && /^1\n2\s*$/.test(out);
      },
    },
    {
      topic: "loop",
      id: "w5-continue",
      week: 5,
      title: "continue 跳过本轮",
      brief: "continue 只跳过这一轮剩下的语句，循环还会进入下一轮。",
      goal: "for 从 1 数到 4。遇到 2 就 continue。输出是 1、3、4，不能有 2。",
      hint: "等于 2 时放「继续下一轮」，打印放在它后面。范例跳过的是 1。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /continue/.test(code) && /^1\n3\n4\s*$/.test(runs[0].stdout);
      },
    },
    {
      id: "w6-scores",
      week: 6,
      title: "成绩列表",
      brief: "列表把多门课放在同一个变量里。",
      goal: "读取三行整数成绩，放进列表，打印平均分（可以是小数）。测试 80、90、100 时应为 90。",
      hint: "空列表 + 三次 append，再打印总和除以 len。",
      tests: [{ stdin: "80\n90\n100\n", expect: /90/ }],
      accept(code, runs) {
        return runs[0].ok && /append\(/.test(code) && /90/.test(runs[0].stdout);
      },
    },
    {
      topic: "tuple",
      id: "w6-tuple",
      week: 6,
      title: "元组取元素",
      brief: "元组用圆括号包住，建好后不能改其中某一项。取元素仍用下标，从 0 开始。",
      goal: "建立元组 (8, 3)，打印第 1 个元素 8。",
      hint: "用「元组」积木，再按下标 0 取值。范例元组是 (1, 9)。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /\([^)]+,/.test(code) && /^8\s*$/.test(runs[0].stdout.trim());
      },
    },
    {
      topic: "nest",
      id: "w6-nest",
      week: 6,
      title: "嵌套列表",
      brief: "列表的元素可以仍是列表。先取行 a[行]，再取列 a[行][列]。",
      goal: "建立 [[10, 20], [30, 40]]，打印第 2 行第 1 列，也就是 30。",
      hint: "下标从 0 计，第 2 行是 1，第 1 列是 0。连续取两次。范例表的数字不同。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /\[\s*\[/.test(code) && /30/.test(runs[0].stdout);
      },
    },
    {
      topic: "comp",
      id: "w6-comp",
      week: 6,
      title: "列表生成式",
      brief: "列表生成式把循环收成一行：[表达式 for 变量 in 序列]。",
      goal: "对 1、2、3 每个数乘 2，用生成式得到并打印 [2, 4, 6]。",
      hint: "左边放 n * 2，变量名 n，右边放列表 1、2、3。范例做的是加 1。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /for \w+ in /.test(code) && /\[2,\s*4,\s*6\]/.test(runs[0].stdout);
      },
    },
    {
      topic: "set",
      id: "w7-set",
      week: 7,
      title: "集合去重",
      brief: "集合里同一个元素只会留下一个。把数字拖进空位，下面会自动再长出一格。",
      goal: "用集合积木放入 10、20、20、30，打印元素个数 3。",
      hint: "连续拖进四个数，空位会跟着增加。外面套 len。范例是 {1, 1, 2}，个数是 2。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /\{[^}]+\}/.test(code) && /^3\s*$/.test(runs[0].stdout.trim());
      },
    },
    {
      topic: "set",
      id: "w7-in",
      week: 7,
      title: "元素是否在集合里",
      brief: "in 用来问一个元素在不在集合里，结果是 True 或 False。",
      goal: "集合里有 8 和 9。打印 8 in 这个集合，结果是 True。",
      hint: "用「元素 in 在里面」。范例问的是 4 在不在 {1, 2} 里。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && / in /.test(code) && /True/.test(runs[0].stdout);
      },
    },
    {
      topic: "set",
      id: "w7-add",
      week: 7,
      title: "往集合里添加",
      brief: "集合建好之后，还可以用 add 再放进一个元素。已经有的元素不会重复放。",
      goal: "先建立只含 10 的集合，再 add 20，打印长度 2。",
      hint: "格子先放 10，下面接「加入集合」。范例是往 {1} 里再加 1，长度仍是 1。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /\.add\(/.test(code) && /^2\s*$/.test(runs[0].stdout.trim());
      },
    },
    {
      topic: "dict",
      id: "w7-dict",
      week: 7,
      title: "成绩字典",
      brief: "字典用姓名找分数，比平行列表更不容易对错位。",
      goal: "建立字典：Ada=88，Bob=91。读取一个姓名并打印对应分数。测试输入 Ada 应打印 88。",
      hint: "空字典，两次「令 [键] = 值」，再按输入的姓名取值。",
      tests: [
        { stdin: "Ada\n", expect: /88/ },
        { stdin: "Bob\n", expect: /91/ },
      ],
      accept(code, runs) {
        return runs.every((r) => r.ok) && /\{\}/.test(code) && /88/.test(runs[0].stdout) && /91/.test(runs[1].stdout);
      },
    },
    {
      topic: "dict",
      id: "w7-build",
      week: 7,
      title: "一次建成字典",
      brief: "字典积木可以同时放入多对键和值，不用先建空字典再逐条写入。",
      goal: "用字典积木放入 Mia=60、Joe=80，打印 Joe 的分数 80。",
      hint: "键和值拖进同一块字典积木，格子不够会自动再长。范例查的是另一对人。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /\{[^}]*:/.test(code) && /^80\s*$/.test(runs[0].stdout.trim());
      },
    },
    {
      topic: "dict",
      id: "w7-keys",
      week: 7,
      title: "遍历字典的键",
      brief: "for 直接遍历字典时，每次拿到的是键，顺序和放入顺序一致。",
      goal: "字典先放 Ada 再放 Bob。用遍历打印键，两行分别是 Ada 和 Bob。",
      hint: "「遍历」的列表接这个字典，循环里打印当前项。范例用的是另外两个名字。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /for \w+ in /.test(code) && /^Ada\s+Bob\s*$/.test(runs[0].stdout.trim());
      },
    },
    {
      topic: "dict",
      id: "w7-vals",
      week: 7,
      title: "把字典的值加起来",
      brief: ".values() 只拿出分数，不带姓名，可以交给 sum。",
      goal: "字典 Ada=10、Bob=30。打印所有值的和 40。",
      hint: "sum 套在 .values() 外面。范例是另一组很小的数。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /\.values\(\)/.test(code) && /^40\s*$/.test(runs[0].stdout.trim());
      },
    },
    {
      topic: "dict",
      id: "w7-change",
      week: 7,
      title: "改掉字典里的一项",
      brief: "对已经存在的键再赋值，会覆盖旧值，键不会变成两个。",
      goal: "先让 Ada=88，再改成 100，打印现在的分数 100。",
      hint: "同一个键写两次「令 [键] = 值」。范例改的是另一个人。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /100/.test(code) && /^100\s*$/.test(runs[0].stdout.trim());
      },
    },
    {
      id: "w8-loan",
      week: 8,
      title: "等额本息月供",
      brief: "math 让公式可读。月供 = P·r·(1+r)^n / ((1+r)^n - 1)，r 是月利率。",
      goal: "P=10000，年利率 0.05，期数 12。打印月供，保留两位小数，应为 856.07。",
      hint: "先导入 math 或直接用乘方。round(月供, 2)。",
      tests: [{ stdin: "", expect: /856\.07/ }],
      accept(code, runs) {
        return runs[0].ok && /856\.07/.test(runs[0].stdout) && (/\*\*/.test(code) || /pow\(/.test(code));
      },
    },
    {
      regex: true,
      id: "w8-email",
      week: 8,
      title: "从文本取邮箱",
      brief: "re.findall 适合固定模式。邮箱模式可以用 \\w+@\\w+\\.\\w+。",
      goal: "对文本 contact me at ada@fudan.edu 提取邮箱并打印。",
      hint: "模式写成字符串积木。打印 findall 的结果即可。",
      tests: [{ stdin: "", expect: /ada@fudan\.edu/ }],
      accept(code, runs) {
        return runs[0].ok && /re\.findall/.test(code) && /ada@fudan\.edu/.test(runs[0].stdout);
      },
    },
    {
      regex: true,
      id: "w8-meta",
      week: 8,
      title: "正则元字符",
      brief: "\\d 是一位数字，+ 表示重复至少一次，所以 \\d+ 是一串数字。右侧有完整元字符表。",
      goal: "用 re.findall 和 \\d+，从「语文90 数学85」取出全部分数并打印。输出里要有 90 和 85。",
      hint: "模式可以选元字符「\\d+」，或在字符串里自己写 \\d+。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /re\.findall/.test(code) && /\\d/.test(code) && /90/.test(runs[0].stdout) && /85/.test(runs[0].stdout);
      },
    },
    {
      regex: true,
      id: "w8-match",
      week: 8,
      title: "re.match 从开头匹配",
      brief: "match 只看字符串开头。开头对不上就得到 None，不会往后找。",
      goal: "用 re.match 从「2026级新生」开头取出数字，打印 2026。",
      hint: "match 的结果再接 .group()。范例匹配的是另一段文本。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /re\.match/.test(code) && /2026/.test(runs[0].stdout);
      },
    },
    {
      regex: true,
      id: "w8-search",
      week: 8,
      title: "re.search 找第一处",
      brief: "search 从任意位置找第一处。适合号码不在开头的句子。",
      goal: "用 re.search 从「电话 13800138000 备用」取出这 11 位号码并打印。",
      hint: "\\d{11} 表示正好 11 位数字。结果同样用 .group()。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /re\.search/.test(code) && /13800138000/.test(runs[0].stdout);
      },
    },
    {
      regex: true,
      id: "w8-group",
      week: 8,
      title: "捕获组",
      brief: "圆括号是捕获组。从左边数，第 1 对括号是 group(1)，第 2 对是 group(2)。group(0) 仍是整段匹配。",
      goal: "用 re.search 和两个捕获组，从「mail ada@fudan.edu」取出用户名 ada 和域名 fudan.edu，各打印一行。",
      hint: "模式写成 (\\w+)@([\\w.]+)。结果分别接 .group(1) 和 .group(2)。范例拆的是另一段文字。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        const out = runs[0].stdout;
        return runs[0].ok && /group\(\s*1\s*\)/.test(code) && /group\(\s*2\s*\)/.test(code) && /ada/.test(out) && /fudan\.edu/.test(out);
      },
    },
    {
      id: "w9-salary",
      week: 9,
      title: "薪资函数",
      brief: "函数把「税前、税率」收成一个名字，调用处只关心结果。",
      goal: "定义函数，实发 = 税前 × (1 - 税率)。调用后打印实发。税前 10000、税率 0.1 时应为 9000。",
      hint: "用「定义函数」，点函数名改成你自己的名字。函数体里放 return。主程序用「调用」积木。",
      tests: [{ stdin: "", expect: /9000/ }],
      accept(code, runs) {
        return runs[0].ok && /def /.test(code) && /return /.test(code) && /9000/.test(runs[0].stdout);
      },
    },
    {
      id: "w9-none",
      week: 9,
      title: "无参数函数",
      brief: "没有输入也要起名字。定义后必须调用，函数体才会执行。",
      goal: "定义一个没有参数的函数，调用后打印：上课了",
      hint: "定义类型选「无参数」。用「执行调用」，不要往括号里塞值。范例打印的是另一句。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /def \w+\(\s*\)/.test(code) && /上课了/.test(runs[0].stdout);
      },
    },
    {
      id: "w9-default",
      week: 9,
      title: "默认值参数",
      brief: "参数写成 rate=0.1 之后，调用时可以不传税率，用默认值。",
      goal: "实发 = 税前 × (1 - 税率)，税率默认 0.1。只传入税前 10000，打印 9000。",
      hint: "定义类型选「默认值参数」，参数写成 gross, rate=0.1。调用时只接一个数。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /def \w+\([^)]*=/.test(code) && /9000/.test(runs[0].stdout);
      },
    },
    {
      id: "w9-varargs",
      week: 9,
      title: "可变参数 *args",
      brief: "*args 把多出来的位置参数收成一个元组，个数不用事先写死。",
      goal: "定义求和函数，参数是 *args。调用时传入 10、20、30，打印 60。",
      hint: "定义类型选「*args」。函数体里 return sum(args)。范例加的是 1、2、3。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /def \w+\(\s*\*(?!\*)/.test(code) && /60/.test(runs[0].stdout);
      },
    },
    {
      id: "w9-kwargs",
      week: 9,
      title: "关键字收集 **kwargs",
      brief: "**kwargs 按名字收额外参数，得到一个字典。",
      goal: "定义函数，用 **info 收下关键字，打印 info 里的 city。调用时写 city='Shanghai'，输出 Shanghai。",
      hint: "定义类型选「**kwargs」。函数体里 print(info['city'])。用「关键字调用」。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /def \w+\(\s*\*\*/.test(code) && /Shanghai/.test(runs[0].stdout);
      },
    },
    {
      id: "w9-lambda",
      week: 9,
      title: "lambda 给字典排序",
      brief: "sorted 的 key 可以是 lambda。条目 item 的第 1 项是键，第 2 项是值，按值排序就取 item[1]。",
      goal: "字典 Bob=80、Ada=95、Cara=70。用 lambda 按分数从低到高排序并打印。顺序应是 Cara、Bob、Ada。",
      hint: "先建成字典，再 sorted(字典.items(), key=lambda item: item[1])。范例用的是另一组姓名。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        const out = runs[0].stdout;
        return runs[0].ok && /lambda /.test(code) && /sorted\(/.test(code) && out.indexOf("Cara") !== -1 && out.indexOf("Cara") < out.indexOf("Bob") && out.indexOf("Bob") < out.indexOf("Ada");
      },
    },
    {
      topic: "dict",
      id: "w9-rank",
      week: 9,
      title: "成绩从高到低",
      brief: "同一份成绩字典，把排序方向改成从高到低，先看到高分的姓名。",
      goal: "字典 Ada=95、Bob=80、Cara=70。按分数从高到低打印姓名，三行依次是 Ada、Bob、Cara。",
      hint: "sorted 选「从高到低」，key 仍然是 lambda item: item[1]。循环打印每条的第 1 项。范例是另一组姓名。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        const out = runs[0].stdout;
        return runs[0].ok && /lambda /.test(code) && /reverse=True/.test(code) && out.indexOf("Ada") !== -1 && out.indexOf("Ada") < out.indexOf("Bob") && out.indexOf("Bob") < out.indexOf("Cara");
      },
    },
    {
      id: "w10-modules",
      week: 10,
      title: "拆成两个函数",
      brief: "自顶向下：一个函数只做一件事。",
      goal: "函数 total(a,b,c) 返回三数之和；函数 average(a,b,c) 调用 total 再除以 3。打印 average(80,90,100)，结果 90。",
      hint: "工作区里应出现两段 def。",
      tests: [{ stdin: "", expect: /^90(?:\.0)?\s*$/ }],
      accept(code, runs) {
        const defs = code.match(/^def /gm) || [];
        return runs[0].ok && defs.length >= 2 && /90/.test(runs[0].stdout);
      },
    },
    {
      id: "w11-json",
      week: 11,
      title: "问卷 JSON",
      brief: "接口和文件经常给你一串 JSON，先 loads 成字典再取字段。",
      goal: "解析 {\"name\":\"Lin\",\"score\":95}，打印姓名和分数，中间一个空格：Lin 95",
      hint: "json.loads 在「标准库与数据」。字符串里的引号用单引号包住整段 JSON。",
      tests: [{ stdin: "", expect: /Lin 95/ }],
      accept(code, runs) {
        return runs[0].ok && /json\.loads/.test(code) && /Lin 95/.test(runs[0].stdout);
      },
    },
    {
      topic: "file",
      id: "w11-write",
      week: 11,
      title: "把一行成绩写入文件",
      brief: "写入会先清空文件，再放进新的一行。写完再读出来，才能确认真的落在磁盘上。",
      goal: "把 Ada 88 写入 grades.txt，再读取这个文件并打印，应看到 Ada 88。",
      hint: "「写入一行到」选 grades.txt。范例写的是另一份文件、另一行字。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /open\([^)]*'w'/.test(code) && /data\/grades\.txt/.test(code) && /Ada 88/.test(runs[0].stdout);
      },
    },
    {
      topic: "file",
      id: "w11-append",
      week: 11,
      title: "往文件末尾追加",
      brief: "追加不会清掉原来的内容，新行接在最后。",
      goal: "grades.txt 先写入 Ada 88，再追加 Bob 91，然后读出全文。两行依次是 Ada 88、Bob 91。",
      hint: "第一句用写入，第二句用追加，文件名都选 grades.txt。范例追加的是别的名字。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        const out = runs[0].stdout;
        return runs[0].ok && /open\([^)]*'a'/.test(code) && out.indexOf("Ada 88") !== -1 && out.indexOf("Ada 88") < out.indexOf("Bob 91");
      },
    },
    {
      topic: "file",
      id: "w11-read",
      week: 11,
      title: "读取已有文件",
      brief: "文件可以事先放在 data 目录里，程序只负责读。",
      goal: "读取 roster.txt 并打印，内容里有 Lin 95。",
      hint: "「读取文件」选 roster.txt，外面接打印。范例读的是 demo_roster.txt。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /data\/roster\.txt/.test(code) && /Lin 95/.test(runs[0].stdout);
      },
    },
    {
      regex: true,
      topic: "file",
      id: "w11-scan",
      week: 11,
      title: "从文件里找出邮箱",
      brief: "先把整个文件读成一段文字，再用正则把邮箱从成绩和说明里挑出来。",
      goal: "读取 messages.txt，用 re.findall 找出邮箱并打印，结果里要有 ada@fudan.edu。",
      hint: "模式可以写成 r'\\w+@\\w+\\.\\w+'。范例读 demo_messages.txt，里面是另一个邮箱。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /re\.findall/.test(code) && /data\/messages\.txt/.test(code) && /ada@fudan\.edu/.test(runs[0].stdout);
      },
    },
    {
      regex: true,
      topic: "file",
      id: "w11-log",
      week: 11,
      title: "机房日志里谁访问最多",
      brief: "机房日志每一行是一个 IP 和一个网址。先用正则分别摘出来，再看哪一项出现得最多。",
      goal: "读取 lab.log。同一地址可能是 http，也可能是 https，都要算进去。打印访问最多的地址，再打印访问最多的 IP。应是 lab.fudan.edu.cn/python 和 10.0.0.8。",
      hint: "先自己定义函数 top(items)：字典计数，再找出次数最大的一项并返回。网址用 r'https?://(\\S+)'，调用 top。不要靠一块现成积木。范例读 demo_lab.log。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        const out = runs[0].stdout;
        return runs[0].ok && /def \w+/.test(code) && /re\.findall/.test(code) && /data\/lab\.log/.test(code) && /https\?/.test(code) && /lab\.fudan\.edu\.cn\/python/.test(out) && /10\.0\.0\.8/.test(out) && out.indexOf("python") < out.indexOf("10.0.0.8");
      },
    },
    {
      id: "w12-clean",
      week: 12,
      title: "清洗三行成绩",
      brief: "先用列表体会「丢掉空行再平均」。后面三题改用内置 Pandas 做同样的事。",
      goal: "输入三行：90、空行、80。忽略空行，打印平均分 85。",
      hint: "读入后如果去掉空白后不是空串，再 append 成整数。",
      tests: [{ stdin: "90\n\n80\n", expect: /85/ }],
      accept(code, runs) {
        return runs[0].ok && /85/.test(runs[0].stdout) && /for |while /.test(code);
      },
    },
    {
      id: "w12-mean",
      week: 12,
      title: "Pandas 读表求平均",
      brief: "read_csv 得到表格，列名用来取一列，mean 求平均。",
      goal: "读取 data/scores.csv 的 score 列，打印平均分 82.5。",
      hint: "左侧 Pandas 分类。范例读的是 demo_scores.csv，请改成 scores.csv。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /scores\.csv/.test(code) && /82\.5/.test(runs[0].stdout);
      },
    },
    {
      id: "w12-filter",
      week: 12,
      title: "Pandas 按条件筛选",
      brief: "筛选是留下满足条件的行，再对结果计数。",
      goal: "在 data/scores.csv 里留下 score ≥ 90 的行，打印行数 2。",
      hint: "筛选积木后面套 len。范例用的是另一张表和另一个阈值。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /scores\.csv/.test(code) && />=\s*90/.test(code) && /^2\s*$/.test(runs[0].stdout.trim());
      },
    },
    {
      id: "w12-group",
      week: 12,
      title: "Pandas 分组平均",
      brief: "groupby 按某一列把行分成几组，再对另一列求平均。",
      goal: "按 class 分组，打印各组 score 平均。A 组是 75，B 组是 90。",
      hint: "分组积木的两个列名分别是 class 和 score。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /groupby\(/.test(code) && /scores\.csv/.test(code) && /75/.test(runs[0].stdout) && /90/.test(runs[0].stdout);
      },
    },
    {
      id: "w12-plot",
      week: 12,
      title: "Pandas 分组柱状图",
      brief: "分组平均可以画成柱状图。学习台内置了 matplotlib，图会显示在运行结果里。",
      goal: "对 data/scores.csv 按 class 求 score 平均，画柱状图并保存。输出里要有图。",
      hint: "先做出分组平均，再接「柱状图」积木。范例画的是演示表。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /scores\.csv/.test(code) && /plot\.bar/.test(code) && !!runs[0].image;
      },
    },
    {
      id: "w12-line",
      week: 12,
      title: "Pandas 成绩折线图",
      brief: "按时间顺序看成绩，用折线比柱状图更合适。横轴是周次，纵轴是分数。",
      goal: "读取 data/weeks.csv 的 score 列，画折线图并保存。输出里要有图。",
      hint: "读取积木选 weeks.csv，取 score 列，再接「折线图」。范例用的是 demo_weeks.csv。",
      tests: [{ stdin: "" }],
      accept(code, runs) {
        return runs[0].ok && /weeks\.csv/.test(code) && !/demo_weeks/.test(code) && /plot\.line/.test(code) && !!runs[0].image;
      },
    },
    {
      id: "w15-project",
      week: 15,
      title: "迷你成绩册",
      brief: "把函数、字典、分支放在一个程序里。这是综合项目的最小切片。",
      goal: "函数 grade(score)：≥90 返回 A，否则返回 B。字典 Lin=95。打印 Lin 的等级 A。",
      hint: "先定义函数，再查字典，再调用 grade。",
      tests: [{ stdin: "", expect: /^A\s*$/ }],
      accept(code, runs) {
        return runs[0].ok && /def /.test(code) && /^A\s*$/.test(runs[0].stdout.trim());
      },
    },
  ];
})();
