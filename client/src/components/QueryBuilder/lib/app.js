window.DQLBuilder = (() => {
  function mount(root, options = {}) {
  if (!root) throw new Error('DQLBuilder.mount: root element is required');
  const opts = {
    hideSchemaControls: true,
    persistWorkspace: true,
    ...options,
  };
  const $ = (id) => root.querySelector('#' + id);

  let schema = opts.schema || window.DQL_SCHEMA || {};
  const PARAM_TYPES = ["string", "int", "float", "bool"];
  const FILTER_FUNCS = [
    { value: "eq", label: "eq" },
    { value: "ge", label: "ge" },
    { value: "le", label: "le" },
    { value: "gt", label: "gt" },
    { value: "lt", label: "lt" },
    { value: "has", label: "has" },
    { value: "alloftext", label: "alloftext" },
    { value: "anyoftext", label: "anyoftext" },
    { value: "allofterms", label: "allofterms" },
    { value: "anyofterms", label: "anyofterms" },
    { value: "regexp", label: "regexp" },
    { value: "uid_in", label: "uid_in" },
    { value: "not eq", label: "not eq" },
    { value: "not has", label: "not has" },
  ];

  function isUnaryFilter(func) {
    const f = String(func || "").replace(/^not\s+/i, "").toLowerCase();
    return f === "has";
  }

  const canvasEl = $("canvas");
  const canvasSurfaceEl = $("canvasSurface");
  const canvasEmptyEl = $("canvasEmpty");
  const addEntityBtn = $("addEntityBtn");
  const entityMenuEl = $("entityMenu");
  const entityMenuWrap = $("entityMenuWrap");
  const copyBtn = $("copyBtn");
  const copyVarsBtn = $("copyVarsBtn");
  const clearBtn = $("clearBtn");
  const applyDqlBtn = $("applyDqlBtn");
  const revertDqlBtn = $("revertDqlBtn");
  const dqlDirtyBadge = $("dqlDirtyBadge");
  const dqlEditHint = $("dqlEditHint");
  const consoleOutputEl = $("consoleOutput");
  const consoleFilterEl = $("consoleFilter");
  const consoleLevelEl = $("consoleLevel");
  const consoleClearBtn = $("consoleClearBtn");
  const consoleErrorCountEl = $("consoleErrorCount");
  const consoleWarnCountEl = $("consoleWarnCount");

  /**
   * Each canvas node is one DQL query block.
   * Parameters are $variables only.
   * Filters are separate groups (AND/OR) on the root or on object edges.
   * @typedef {{ id: string, name: string, type: string, value: string, mode: "var"|"default" }} Param
   * @typedef {{
   *   id: string, func: string, predicate: string,
   *   valueMode: "literal"|"param", literal: string, paramName: string
   * }} FilterCond
   * @typedef {{ op: "AND"|"OR", conditions: FilterCond[] }} FilterGroup
   * @typedef {{
   *   id: string, type: string, name: string, x: number, y: number,
   *   selection: Record<string, any>, params: Param[],
   *   rootFilter: FilterGroup, edgeFilters: Record<string, FilterGroup>
   * }} QueryNode
   * @type {QueryNode[]}
   */
  let nodes = [];
  let dragPaletteType = null;
  /** @type {{ id: string, offsetX: number, offsetY: number } | null} */
  let moveState = null;
  /** @type {{ id: string, startX: number, startY: number, startW: number, startH: number } | null} */
  let resizeState = null;
  let selectedNodeId = null;
  let nodeSeq = 0;
  let paramSeq = 0;
  let filterSeq = 0;
  const animatedNodes = new Set();
  /** True when `schema` came from the built-in sample (reload picks up schema.js edits). */
  let schemaIsSample = true;

  /* ---------- Dev workspace persistence (survives Vite live reload) ---------- */

  const WORKSPACE_KEY = "dql-builder:workspace:v1";
  let saveWorkspaceTimer = null;

  function saveWorkspace() {
    if (!opts.persistWorkspace) return;
    try {
      sessionStorage.setItem(
        WORKSPACE_KEY,
        JSON.stringify({
          schemaIsSample,
          schema: schemaIsSample ? null : schema,
          nodes,
          selectedNodeId,
          nodeSeq,
          paramSeq,
          filterSeq,
        })
      );
    } catch {
      /* quota / private mode */
    }
  }

  function scheduleSaveWorkspace() {
    clearTimeout(saveWorkspaceTimer);
    saveWorkspaceTimer = setTimeout(saveWorkspace, 120);
  }

  function clearWorkspace() {
    clearTimeout(saveWorkspaceTimer);
    if (!opts.persistWorkspace) return;
    try {
      sessionStorage.removeItem(WORKSPACE_KEY);
    } catch {
      /* ignore */
    }
  }

  function restoreWorkspace() {
    try {
      const raw = sessionStorage.getItem(WORKSPACE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.nodes)) return false;

      if (data.schemaIsSample) {
        schema = window.DQL_SCHEMA;
        schemaIsSample = true;
      } else if (data.schema && typeof data.schema === "object") {
        schema = data.schema;
        schemaIsSample = false;
      } else {
        return false;
      }

      nodes = data.nodes.map((n) => migrateNode({ ...n }));
      selectedNodeId = data.selectedNodeId || null;
      nodeSeq = Number(data.nodeSeq) || nodes.length;
      paramSeq = Number(data.paramSeq) || 0;
      filterSeq = Number(data.filterSeq) || 0;
      nodes.forEach((n) => {
        animatedNodes.add(n.id);
        (n.rootFilter?.conditions || []).forEach((c) => {
          if (!c.id) c.id = filterUid();
        });
        Object.values(n.edgeFilters || {}).forEach((g) => {
          (g.conditions || []).forEach((c) => {
            if (!c.id) c.id = filterUid();
          });
        });
      });
      resolveOverlaps();
      return true;
    } catch {
      return false;
    }
  }

  /* ---------- Output (Monaco with textarea fallback) ---------- */

  let dqlEditor = null;
  let varsEditor = null;
  let dqlFallback = null;
  let varsFallback = null;
  let queryText = "";
  let varsText = "";
  /** True while the user has unsaved edits in the DQL editor. */
  let dqlDirty = false;
  /** Suppress dirty-flag while we push generated text into the editor. */
  let writingDql = false;

  function getDqlText() {
    if (dqlEditor) return dqlEditor.getValue();
    if (dqlFallback) return dqlFallback.value;
    return queryText;
  }

  function updateDqlChrome() {
    const dirty = dqlDirty;
    if (dqlDirtyBadge) dqlDirtyBadge.hidden = !dirty;
    if (dqlEditHint) dqlEditHint.hidden = !dirty;
    if (applyDqlBtn) applyDqlBtn.hidden = !dirty;
    if (revertDqlBtn) revertDqlBtn.hidden = !dirty;
    $("dqlEditor")?.classList.toggle("is-dirty", dirty);
  }

  function markDqlDirty() {
    if (writingDql) return;
    if (!dqlDirty) {
      dqlDirty = true;
      updateDqlChrome();
    }
    if (copyBtn) copyBtn.disabled = !getDqlText().trim();
  }

  function clearDqlDirty() {
    dqlDirty = false;
    updateDqlChrome();
  }

  function writeDqlEditor(value) {
    writingDql = true;
    try {
      if (dqlEditor) dqlEditor.setValue(value);
      else if (dqlFallback) dqlFallback.value = value;
    } finally {
      writingDql = false;
    }
  }

  function looksLikeDql(text) {
    return /\bquery\s+[A-Za-z_][A-Za-z0-9_]*/i.test(String(text || ""));
  }

  /* ---------- Builder console ---------- */

  /** @type {{ id: number, level: 'error'|'warn'|'info', message: string, source: string, time: number }[]} */
  const consoleEntries = [];
  let consoleSeq = 0;

  function applyConsoleFilters() {
    if (!consoleOutputEl) return;
    const q = (consoleFilterEl?.value || "").trim().toLowerCase();
    const level = consoleLevelEl?.value || "all";
    consoleOutputEl.querySelectorAll(".console-row").forEach((row) => {
      const rowLevel = row.dataset.level;
      const text = row.dataset.text || "";
      const levelOk = level === "all" || rowLevel === level;
      const textOk = !q || text.includes(q);
      row.classList.toggle("is-hidden", !(levelOk && textOk));
    });
  }

  function updateConsoleCounts() {
    const errors = consoleEntries.filter((e) => e.level === "error").length;
    const warns = consoleEntries.filter((e) => e.level === "warn").length;
    const errNum = consoleErrorCountEl?.querySelector(".console-count-num");
    const warnNum = consoleWarnCountEl?.querySelector(".console-count-num");
    if (errNum) errNum.textContent = String(errors);
    if (warnNum) warnNum.textContent = String(warns);
  }

  function renderConsoleEmpty() {
    if (!consoleOutputEl || consoleEntries.length) return;
    consoleOutputEl.innerHTML =
      '<p class="console-empty">Console cleared — parse and build messages will appear here.</p>';
  }

  function clearConsole() {
    consoleEntries.length = 0;
    if (consoleOutputEl) consoleOutputEl.innerHTML = "";
    updateConsoleCounts();
    renderConsoleEmpty();
  }

  /**
   * @param {'error'|'warn'|'info'} level
   * @param {string} message
   * @param {string} [source]
   */
  function consoleLog(level, message, source = "builder") {
    const entry = {
      id: ++consoleSeq,
      level,
      message: String(message || ""),
      source: String(source || "builder"),
      time: Date.now(),
    };
    consoleEntries.push(entry);
    updateConsoleCounts();
    if (!consoleOutputEl) return;

    const empty = consoleOutputEl.querySelector(".console-empty");
    if (empty) empty.remove();

    const row = document.createElement("div");
    row.className = `console-row is-${entry.level}`;
    row.dataset.level = entry.level;
    row.dataset.text = `${entry.message} ${entry.source}`.toLowerCase();
    row.innerHTML = `
      <span class="console-row-icon" aria-hidden="true"></span>
      <span class="console-row-msg"></span>
      <span class="console-row-source"></span>
    `;
    row.querySelector(".console-row-msg").textContent = entry.message;
    row.querySelector(".console-row-source").textContent = entry.source;
    consoleOutputEl.appendChild(row);
    consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;

    applyConsoleFilters();
  }

  function consoleError(message, source) {
    consoleLog("error", message, source);
  }

  function consoleWarn(message, source) {
    consoleLog("warn", message, source);
  }

  function consoleInfo(message, source) {
    consoleLog("info", message, source);
  }

  if (consoleClearBtn) consoleClearBtn.addEventListener("click", clearConsole);
  if (consoleFilterEl) consoleFilterEl.addEventListener("input", applyConsoleFilters);
  if (consoleLevelEl) consoleLevelEl.addEventListener("change", applyConsoleFilters);
  if (consoleOutputEl) renderConsoleEmpty();

  function setOutputs(dql, vars) {
    queryText = dql;
    varsText = vars;
    if (!dqlDirty) writeDqlEditor(dql);
    if (varsEditor) varsEditor.setValue(vars);
    else if (varsFallback) varsFallback.value = vars;
    if (copyBtn) copyBtn.disabled = !(dqlDirty ? getDqlText().trim() : dql);
    if (copyVarsBtn) copyVarsBtn.disabled = !vars;
    try {
      opts.onQueryChange?.({ query: dqlDirty ? getDqlText() : dql, variables: vars });
    } catch (_) {}
  }

  function makeFallbackTextarea(hostId, { readOnly = true } = {}) {
    const host = $(hostId);
    if (!host) return null;
    const ta = document.createElement("textarea");
    ta.readOnly = readOnly;
    ta.spellcheck = false;
    ta.style.cssText =
      "width:100%;height:100%;border:none;outline:none;resize:none;padding:1rem;" +
      "font-family:var(--mono);font-size:0.82rem;line-height:1.55;color:var(--ink);background:transparent;";
    host.appendChild(ta);
    return ta;
  }

  function initEditors() {
    // Canvas-only (Ratel Console) — host editors live outside this mount.
    if (opts.canvasOnly || !$("dqlEditor")) {
      return;
    }
    if (!window.require) {
      dqlFallback = makeFallbackTextarea("dqlEditor", { readOnly: false });
      varsFallback = makeFallbackTextarea("varsEditor", { readOnly: true });
      dqlFallback.addEventListener("input", () => markDqlDirty());
      dqlFallback.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          applyDqlFromEditor({ reason: "shortcut" });
        }
      });
      dqlFallback.addEventListener("blur", () => {
        applyDqlFromEditor({ reason: "blur", soft: true });
      });
      setOutputs(queryText, varsText);
      return;
    }

    window.require.config({
      paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" },
    });

    window.require(["vs/editor/editor.main"], () => {
      monaco.editor.defineTheme("dql-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "3dd68c", fontStyle: "bold" },
          { token: "string", foreground: "fdd663" },
          { token: "number", foreground: "8ab4f8" },
          { token: "comment", foreground: "9aa0a6", fontStyle: "italic" },
        ],
        colors: {
          "editor.background": "#202124",
          "editor.foreground": "#e8eaed",
          "editor.lineHighlightBackground": "#292a2d",
          "editorLineNumber.foreground": "#5f6368",
          "editorGutter.background": "#202124",
          "editorCursor.foreground": "#e8eaed",
          "editor.selectionBackground": "#3c4043",
          "editor.inactiveSelectionBackground": "#303134",
          "editorWidget.background": "#292a2d",
          "editorWidget.border": "#3c4043",
          "input.background": "#1a1b1e",
          "dropdown.background": "#292a2d",
        },
      });

      const common = {
        theme: "dql-dark",
        minimap: { enabled: false },
        automaticLayout: true,
        fontFamily: "IBM Plex Mono, ui-monospace, monospace",
        fontSize: 12.5,
        lineHeight: 20,
        scrollBeyondLastLine: false,
        renderLineHighlight: "line",
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        padding: { top: 12, bottom: 12 },
        wordWrap: "on",
      };

      // GraphQL grammar is the closest built-in match for DQL.
      dqlEditor = monaco.editor.create($("dqlEditor"), {
        ...common,
        readOnly: false,
        value: queryText,
        language: "graphql",
        contextmenu: true,
        ariaLabel: "DQL editor",
      });
      varsEditor = monaco.editor.create($("varsEditor"), {
        ...common,
        readOnly: true,
        value: varsText,
        language: "json",
        lineNumbers: "off",
        contextmenu: false,
        renderLineHighlight: "none",
      });

      dqlEditor.onDidChangeModelContent(() => {
        if (!writingDql) markDqlDirty();
      });

      dqlEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        applyDqlFromEditor({ reason: "shortcut" });
      });

      dqlEditor.onDidBlurEditorWidget(() => {
        // Defer so a click on Apply/Revert is processed first.
        setTimeout(() => {
          if (document.activeElement?.closest?.("#applyDqlBtn, #revertDqlBtn")) return;
          applyDqlFromEditor({ reason: "blur", soft: true });
        }, 0);
      });
    });
  }

  /* ---------- Helpers ---------- */

  function uid() {
    nodeSeq += 1;
    return `node-${nodeSeq}`;
  }

  function paramUid() {
    paramSeq += 1;
    return `param-${paramSeq}`;
  }

  function filterUid() {
    filterSeq += 1;
    return `filter-${filterSeq}`;
  }

  function emptyFilterGroup(op = "AND") {
    return { op: op === "OR" ? "OR" : "AND", conditions: [] };
  }

  function newFilterCondition(predicate = "", typeHint = "string") {
    return {
      id: filterUid(),
      func: "eq",
      predicate,
      valueMode: "literal",
      literal: defaultParamValue(typeHint),
      paramName: "",
    };
  }

  function ensureFilterGroup(group) {
    if (!group || typeof group !== "object") return emptyFilterGroup();
    return {
      op: group.op === "OR" ? "OR" : "AND",
      conditions: Array.isArray(group.conditions) ? group.conditions : [],
    };
  }

  /** Migrate legacy param-bound filters → rootFilter / edgeFilters. */
  function migrateNode(node) {
    if (!node.rootFilter) node.rootFilter = emptyFilterGroup();
    else node.rootFilter = ensureFilterGroup(node.rootFilter);
    if (!node.edgeFilters || typeof node.edgeFilters !== "object") node.edgeFilters = {};

    const legacy = [];
    const kept = [];
    (node.params || []).forEach((p) => {
      if (p && p.func && p.predicate) legacy.push(p);
      else if (p) {
        kept.push({
          id: p.id || paramUid(),
          name: p.name,
          type: PARAM_TYPES.includes(p.type) ? p.type : "string",
          value: p.value ?? "",
          mode: p.mode === "default" ? "default" : "var",
        });
      }
    });

    legacy.forEach((p) => {
      const walk = splitPredicatePath(node.type, p.predicate) || {
        edgeParts: [],
        leaf: p.predicate,
        edgePath: "",
      };
      const unary = isUnaryFilter(p.func);
      const cond = {
        id: filterUid(),
        func: p.func,
        predicate: walk.leaf,
        valueMode: p.mode === "literal" || unary ? "literal" : "param",
        literal: p.mode === "literal" ? String(p.value ?? "") : "",
        paramName: p.mode === "literal" || unary ? "" : p.name,
      };
      if (!walk.edgePath) {
        node.rootFilter.conditions.push(cond);
      } else {
        if (!node.edgeFilters[walk.edgePath]) {
          node.edgeFilters[walk.edgePath] = emptyFilterGroup();
        }
        node.edgeFilters[walk.edgePath].conditions.push(cond);
      }
      if (!unary && p.mode !== "literal") {
        if (!kept.some((k) => k.name === p.name)) {
          kept.push({
            id: p.id || paramUid(),
            name: p.name,
            type: PARAM_TYPES.includes(p.type) ? p.type : "string",
            value: p.value ?? "",
            mode: p.mode === "default" ? "default" : "var",
          });
        }
      }
    });

    node.params = kept;
    if (node.width != null) node.width = Math.max(300, Number(node.width) || 380);
    if (node.height != null) node.height = Math.max(240, Number(node.height) || 520);
    return node;
  }

  function typeAtEdgePath(rootType, edgePath) {
    if (!edgePath) return rootType;
    const walk = splitPredicatePath(rootType, edgePath);
    if (!walk) return rootType;
    let typeName = rootType;
    for (const edge of walk.edgeParts) {
      const field = (schema[typeName]?.fields || []).find((f) => f.name === edge);
      if (!field?.ofType) return typeName;
      typeName = field.ofType;
    }
    const leaf = (schema[typeName]?.fields || []).find((f) => f.name === walk.leaf);
    return leaf?.ofType || typeName;
  }

  function fieldDisplayName(name) {
    const raw = String(name || "");
    const i = raw.lastIndexOf(".");
    return i >= 0 ? raw.slice(i + 1) : raw;
  }

  function scalarOptionsForType(typeName) {
    return scalarPredicates(typeName).map((f) => ({
      value: f.name,
      label: fieldDisplayName(f.name),
    }));
  }

  function defaultName(typeName) {
    const base = `get${typeName}`;
    if (!nodes.some((n) => n.name === base)) return base;
    let i = 2;
    while (nodes.some((n) => n.name === `${base}${i}`)) i += 1;
    return `${base}${i}`;
  }

  function sanitizeName(raw, fallback) {
    let name = String(raw || "")
      .trim()
      .replace(/^\$/, "")
      .replace(/[^A-Za-z0-9_]/g, "_")
      .replace(/^([^A-Za-z_])/, "_$1");
    if (!name) name = fallback;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) name = fallback;
    return name;
  }

  function defaultSelection(typeName) {
    const def = schema[typeName];
    const selection = {};
    def.fields
      .filter((f) => f.kind === "scalar")
      .slice(0, 2)
      .forEach((f) => {
        selection[f.name] = null;
      });
    return selection;
  }

  function scalarPredicates(typeName) {
    return (schema[typeName]?.fields || []).filter(
      (f) => f.kind === "scalar" && f.name !== "uid"
    );
  }

  function defaultParamValue(type) {
    if (type === "int" || type === "float") return "0";
    if (type === "bool") return "false";
    return "";
  }

  /** Resolve a predicate path to its schema field, respecting dotted field names. */
  function resolvePredicateField(typeName, pathStr) {
    const walk = splitPredicatePath(typeName, pathStr);
    if (!walk) return null;
    let currentType = typeName;
    for (const edge of walk.edgeParts) {
      const field = (schema[currentType]?.fields || []).find((f) => f.name === edge);
      if (!field?.ofType) return null;
      currentType = field.ofType;
    }
    return (schema[currentType]?.fields || []).find((f) => f.name === walk.leaf) || null;
  }

  /**
   * Split "posts.published" or a namespaced "User.email" into edge parts + leaf,
   * matching longest field names on the schema at each step.
   */
  function splitPredicatePath(typeName, pathStr) {
    const raw = String(pathStr || "");
    if (!raw) return null;

    const fieldsAt = (t) => schema[t]?.fields || [];
    if (fieldsAt(typeName).some((f) => f.name === raw)) {
      return { edgeParts: [], leaf: raw, edgePath: "" };
    }

    const segments = raw.split(".");
    const edgeParts = [];
    let currentType = typeName;
    let i = 0;

    while (i < segments.length) {
      const fields = fieldsAt(currentType);
      let matched = null;
      let matchedEnd = -1;
      for (let j = segments.length; j > i; j -= 1) {
        const candidate = segments.slice(i, j).join(".");
        const field = fields.find((f) => f.name === candidate);
        if (field) {
          matched = field;
          matchedEnd = j;
          break;
        }
      }

      if (!matched) {
        return {
          edgeParts,
          leaf: segments.slice(i).join("."),
          edgePath: edgeParts.join("."),
        };
      }

      const start = i;
      i = matchedEnd;

      if (i >= segments.length) {
        return { edgeParts, leaf: matched.name, edgePath: edgeParts.join(".") };
      }

      if (matched.kind === "object" && matched.ofType) {
        edgeParts.push(matched.name);
        currentType = matched.ofType;
        continue;
      }

      // Scalar matched but path continues — keep the unmatched remainder as one leaf.
      return {
        edgeParts,
        leaf: segments.slice(start).join("."),
        edgePath: edgeParts.join("."),
      };
    }

    return null;
  }

  function paramTypeForPredicate(typeName, predicate) {
    const field = resolvePredicateField(typeName, predicate);
    return PARAM_TYPES.includes(field?.type) ? field.type : "string";
  }

  /**
   * Filter targets for a block: its own scalar predicates plus, for every
   * expanded object edge, the nested type's scalars as dotted paths
   * ("posts.published"). Nested targets produce an @filter on that edge.
   */
  function filterTargets(typeName, selection, prefix = []) {
    let targets = scalarPredicates(typeName).map((f) => {
      const parts = [...prefix, f.name];
      return {
        value: parts.join("."),
        label: parts.map(fieldDisplayName).join("."),
      };
    });

    if (prefix.length >= 6) return targets;

    (schema[typeName]?.fields || [])
      .filter(
        (f) =>
          f.kind === "object" &&
          f.ofType &&
          schema[f.ofType] &&
          selection &&
          typeof selection[f.name] === "object" &&
          selection[f.name] !== null
      )
      .forEach((f) => {
        targets = targets.concat(
          filterTargets(f.ofType, selection[f.name], [...prefix, f.name])
        );
      });

    return targets;
  }

  function getAtPath(selection, path) {
    let cursor = selection;
    for (const key of path) {
      if (!cursor || typeof cursor !== "object" || !(key in cursor)) return undefined;
      cursor = cursor[key];
    }
    return cursor;
  }

  function setAtPath(selection, path, value) {
    if (path.length === 0) return value;
    const [head, ...rest] = path;
    const next = { ...selection };
    if (rest.length === 0) {
      if (value === undefined) delete next[head];
      else next[head] = value;
      return next;
    }
    const child =
      next[head] && typeof next[head] === "object" ? { ...next[head] } : {};
    next[head] = setAtPath(child, rest, value);
    return next;
  }

  function isSelected(selection, path) {
    return getAtPath(selection, path) !== undefined;
  }

  /** Encode a field-name path for data attributes (names may contain dots). */
  function encodePath(path) {
    return JSON.stringify(path);
  }

  function decodePath(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* legacy dotted paths */
    }
    return String(raw || "").split(".").filter((p) => p.length);
  }

  function pathKey(path) {
    return path.join(".");
  }

  function escapeAttr(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function updateEmptyState() {
    canvasEmptyEl.classList.toggle("hidden", nodes.length > 0);
    if (!nodes.length) {
      canvasEmptyEl.textContent =
        "Edit DQL on the left, or add an entity from + Add entity above.";
    }
  }

  function stopDragPropagation(el) {
    ["pointerdown", "mousedown", "click"].forEach((evt) => {
      el.addEventListener(evt, (e) => e.stopPropagation());
    });
  }

  function getNode(id) {
    return nodes.find((n) => n.id === id);
  }

  function setSelected(id) {
    selectedNodeId = id;
    canvasEl.querySelectorAll(".entity-node").forEach((nodeEl) => {
      nodeEl.classList.toggle("selected", nodeEl.dataset.id === id);
      nodeEl.style.zIndex = nodeEl.dataset.id === id ? "5" : "2";
    });
  }

  /* ---------- Entity menu (canvas header) ---------- */

  const DEFAULT_NODE_W = 420;
  const DEFAULT_NODE_H = 520;
  const NODE_GAP = 28;
  const CANVAS_PAD = 48;
  const CANVAS_MIN_W = 3200;
  const CANVAS_MIN_H = 2400;

  function estimateNodeSize(node) {
    return {
      w: Math.max(300, Number(node.width) || DEFAULT_NODE_W),
      h: Math.max(220, Number(node.height) || DEFAULT_NODE_H),
    };
  }

  function rectsOverlap(a, b, gap = NODE_GAP) {
    return !(
      a.x + a.w + gap <= b.x ||
      b.x + b.w + gap <= a.x ||
      a.y + a.h + gap <= b.y ||
      b.y + b.h + gap <= a.y
    );
  }

  function findFreePosition(width, height, preferred, excludeId) {
    const w = width || DEFAULT_NODE_W;
    const h = height || DEFAULT_NODE_H;
    const others = nodes
      .filter((n) => n.id !== excludeId)
      .map((n) => {
        const s = estimateNodeSize(n);
        return { x: n.x, y: n.y, w: s.w, h: s.h };
      });

    const tryPos = (x, y) => {
      const cand = { x: Math.max(CANVAS_PAD, x), y: Math.max(CANVAS_PAD, y), w, h };
      if (!others.some((o) => rectsOverlap(cand, o))) return cand;
      return null;
    };

    if (preferred) {
      const hit = tryPos(preferred.x, preferred.y);
      if (hit) return hit;
    }

    // Scan a grid across a generous canvas.
    const stepX = Math.floor(w + NODE_GAP);
    const stepY = Math.floor(Math.min(h, 280) + NODE_GAP);
    for (let row = 0; row < 40; row += 1) {
      for (let col = 0; col < 24; col += 1) {
        const hit = tryPos(CANVAS_PAD + col * stepX, CANVAS_PAD + row * stepY);
        if (hit) return hit;
      }
    }
    return {
      x: CANVAS_PAD + nodes.length * 24,
      y: CANVAS_PAD + nodes.length * 24,
      w,
      h,
    };
  }

  /** Push overlapping cards onto free slots (session restore / imports). */
  function resolveOverlaps() {
    nodes.forEach((n) => {
      const s = estimateNodeSize(n);
      const self = { x: n.x, y: n.y, w: s.w, h: s.h };
      const hit = nodes.some((o) => {
        if (o.id === n.id) return false;
        const os = estimateNodeSize(o);
        return rectsOverlap(self, { x: o.x, y: o.y, w: os.w, h: os.h });
      });
      if (!hit) return;
      const pos = findFreePosition(s.w, s.h, null, n.id);
      n.x = pos.x;
      n.y = pos.y;
    });
  }

  function updateCanvasSurface() {
    if (!canvasSurfaceEl) return;
    let maxR = CANVAS_MIN_W;
    let maxB = CANVAS_MIN_H;
    nodes.forEach((n) => {
      const s = estimateNodeSize(n);
      maxR = Math.max(maxR, n.x + s.w + 600);
      maxB = Math.max(maxB, n.y + s.h + 600);
    });
    // Also account for live DOM sizes when available.
    canvasEl.querySelectorAll(".entity-node").forEach((el) => {
      const x = parseFloat(el.style.left) || 0;
      const y = parseFloat(el.style.top) || 0;
      maxR = Math.max(maxR, x + el.offsetWidth + 600);
      maxB = Math.max(maxB, y + el.offsetHeight + 600);
    });
    canvasSurfaceEl.style.width = `${Math.ceil(maxR)}px`;
    canvasSurfaceEl.style.height = `${Math.ceil(maxB)}px`;
  }

  function closeEntityMenu() {
    if (!entityMenuEl || !addEntityBtn) return;
    entityMenuEl.hidden = true;
    addEntityBtn.setAttribute("aria-expanded", "false");
  }

  function toggleEntityMenu() {
    if (!entityMenuEl || !addEntityBtn) return;
    const open = entityMenuEl.hidden;
    entityMenuEl.hidden = !open;
    addEntityBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function renderDock() {
    renderEntityMenu();
  }

  function renderEntityMenu() {
    if (!entityMenuEl) return;
    entityMenuEl.innerHTML = "";
    const list = document.createElement("div");
    list.className = "entity-menu-list";

    Object.entries(schema).forEach(([typeName, def]) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "entity-menu-item";
      item.role = "menuitem";
      item.draggable = true;
      item.dataset.type = typeName;
      item.title = `Add ${typeName} query block — drag onto canvas or click`;
      item.innerHTML = `
        <span class="palette-dot" style="background:${def.color}"></span>
        <span class="entity-menu-name">${typeName}</span>
        <span class="entity-menu-hint">+</span>
      `;
      item.addEventListener("click", () => {
        closeEntityMenu();
        const pos = findFreePosition(DEFAULT_NODE_W, DEFAULT_NODE_H);
        placeEntity(typeName, pos.x, pos.y);
      });
      item.addEventListener("dragstart", (e) => {
        dragPaletteType = typeName;
        item.classList.add("dragging");
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", typeName);
      });
      item.addEventListener("dragend", () => {
        dragPaletteType = null;
        item.classList.remove("dragging");
      });
      list.appendChild(item);
    });

    entityMenuEl.appendChild(list);
  }

  /* ---------- Query block rendering ---------- */

  function renderFilterValueControls(cond, params) {
    const unary = isUnaryFilter(cond.func);
    if (unary) return `<span class="filter-value-blank">—</span>`;

    const mode = cond.valueMode === "param" ? "param" : "literal";
    const modeOpts = optionsHtml(
      [
        { value: "literal", label: "literal" },
        { value: "param", label: "$param" },
      ],
      mode
    );

    if (mode === "param") {
      const paramOpts = (params || []).map((p) => ({
        value: p.name,
        label: `$${p.name}`,
      }));
      return `
        <select class="filter-value-mode" title="Value source">${modeOpts}</select>
        <select class="filter-param" title="Parameter">${optionsHtml(
          paramOpts.length ? paramOpts : [{ value: "", label: "— add a $param" }],
          cond.paramName || ""
        )}</select>
      `;
    }

    return `
      <select class="filter-value-mode" title="Value source">${modeOpts}</select>
      <input type="text" class="filter-literal" value="${escapeAttr(cond.literal || "")}" placeholder="value" spellcheck="false" title="Literal value" />
    `;
  }

  function renderFilterGroupPanel(group, typeName, params, { edgePath = "", compact = false } = {}) {
    const g = ensureFilterGroup(group);
    const preds = scalarOptionsForType(typeName);
    const rows = g.conditions
      .map((cond) => {
        const unary = isUnaryFilter(cond.func);
        return `
          <div class="filter-row" data-filter-id="${cond.id}">
            <select class="filter-func" title="Filter function">${optionsHtml(FILTER_FUNCS, cond.func || "eq")}</select>
            <select class="filter-predicate" title="Predicate">${optionsHtml(
              preds.length ? preds : [{ value: "", label: "—" }],
              cond.predicate || ""
            )}</select>
            ${renderFilterValueControls(cond, params)}
            <button type="button" class="filter-remove" title="Remove filter" aria-label="Remove filter">×</button>
          </div>
        `;
      })
      .join("");

    const cls = compact ? "filter-panel is-edge" : "filter-panel is-root";
    return `
      <div class="${cls}" data-edge-path="${escapeAttr(edgePath)}">
        <div class="filter-panel-head">
          <span class="filter-panel-label">@filter</span>
          <div class="filter-op-toggle" role="group" aria-label="Combine filters with">
            <button type="button" class="filter-op-btn${g.op !== "OR" ? " active" : ""}" data-op="AND">AND</button>
            <button type="button" class="filter-op-btn${g.op === "OR" ? " active" : ""}" data-op="OR">OR</button>
          </div>
          <button type="button" class="btn-mini add-filter">+ Add</button>
        </div>
        ${rows || '<p class="filter-empty">No conditions</p>'}
      </div>
    `;
  }

  function renderFieldTree(typeName, selection, path, depth, aliases, node) {
    const def = schema[typeName];
    if (!def) return "";

    return def.fields
      .map((field) => {
        const fieldPath = [...path, field.name];
        const key = pathKey(fieldPath);
        const checked = isSelected(selection, fieldPath);
        const isObject = field.kind === "object";
        const objectClass = isObject ? " is-object" : "";

        let edgeFilterHtml = "";
        let nestedHtml = "";
        if (isObject && checked && field.ofType && schema[field.ofType] && depth < 8) {
          const edgeGroup = node.edgeFilters?.[key] || emptyFilterGroup();
          edgeFilterHtml = renderFilterGroupPanel(edgeGroup, field.ofType, node.params, {
            edgePath: key,
            compact: true,
          });
          nestedHtml = `
            <ul class="nested-fields" data-depth="${depth + 1}">
              ${renderFieldTree(field.ofType, selection, fieldPath, depth + 1, aliases, node)}
            </ul>
          `;
        }

        const aliasValue = aliases[key] || "";
        const aliasHtml = checked
          ? `<input
              type="text"
              class="alias-input"
              data-alias-path="${escapeAttr(encodePath(fieldPath))}"
              value="${escapeAttr(aliasValue)}"
              placeholder="alias"
              spellcheck="false"
              title="Alias — result key for this predicate"
            />`
          : `<span class="field-type" title="${escapeAttr(field.type)}">${field.type}</span>`;

        const label = fieldDisplayName(field.name);
        return `
          <li>
            <div class="field-row${objectClass}" style="padding-left:${0.35 + depth * 0.4}rem">
              <label class="field-check">
                <input
                  type="checkbox"
                  data-path="${escapeAttr(encodePath(fieldPath))}"
                  data-kind="${field.kind}"
                  data-oftype="${field.ofType || ""}"
                  ${checked ? "checked" : ""}
                />
                <span class="field-name" title="${escapeAttr(field.name)}">${escapeAttr(label)}</span>
              </label>
              ${aliasHtml}
            </div>
            ${edgeFilterHtml}
            ${nestedHtml}
          </li>
        `;
      })
      .join("");
  }

  function optionsHtml(items, selected) {
    const list = items.slice();
    if (selected != null && selected !== "" && !list.some((item) => item.value === selected)) {
      list.push({ value: selected, label: selected });
    }
    return list
      .map(
        (item) =>
          `<option value="${item.value}" ${item.value === selected ? "selected" : ""}>${item.label}</option>`
      )
      .join("");
  }

  function renderParamsSection(node) {
    const rows = (node.params || [])
      .map((param) => {
        const typeOpts = PARAM_TYPES.map((t) => ({ value: t, label: t }));
        return `
          <div class="param-card" data-param-id="${param.id}">
            <div class="param-main">
              <input type="text" class="param-name" value="${escapeAttr(param.name)}" placeholder="name" spellcheck="false" title="Parameter name" />
              <select class="param-type" title="Parameter type">${optionsHtml(typeOpts, param.type)}</select>
              <input type="text" class="param-value" value="${escapeAttr(param.value)}" placeholder="sample" spellcheck="false" title="Sample value for Variables JSON" />
              <select class="param-mode" title="$variable, or $variable with a default in the signature">
                ${optionsHtml(
                  [
                    { value: "var", label: "$var" },
                    { value: "default", label: "$ = def" },
                  ],
                  param.mode || "var"
                )}
              </select>
              <button type="button" class="param-remove" title="Remove parameter" aria-label="Remove parameter">×</button>
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="block-section params-section">
        <div class="block-section-head">
          <span class="block-section-title">Parameters</span>
          <button type="button" class="btn-mini add-param">+ Add</button>
        </div>
        ${rows || '<p class="param-empty">$variables for filters to reference</p>'}
      </div>
    `;
  }

  function renderRootFiltersSection(node) {
    return `
      <div class="block-section filters-section">
        <div class="block-section-head no-margin">
          <span class="block-section-title">Root filters</span>
        </div>
        ${renderFilterGroupPanel(node.rootFilter, node.type, node.params, { edgePath: "" })}
      </div>
    `;
  }

  function renderDirectivesSection(node) {
    const toggle = (key) => `
      <button
        type="button"
        class="directive-toggle${node.directives?.[key] ? " active" : ""}"
        data-directive="${key}"
        title="Toggle @${key} on this query block"
      >@${key}</button>
    `;
    return `
      <div class="block-section directives-section">
        <div class="block-section-head no-margin">
          <span class="block-section-title">Directives</span>
          <div class="directive-toggles">
            ${toggle("cascade")}
            ${toggle("normalize")}
          </div>
        </div>
      </div>
    `;
  }

  function renderNodes() {
    // Full re-render replaces the DOM — keep field-list scroll so toggling
    // a property near the bottom doesn't jump back to the top.
    const fieldScroll = new Map();
    canvasEl.querySelectorAll(".entity-node").forEach((el) => {
      const id = el.dataset.id;
      const body = el.querySelector(".entity-node-body");
      if (id && body) {
        fieldScroll.set(id, { top: body.scrollTop, left: body.scrollLeft });
      }
    });

    canvasEl.querySelectorAll(".entity-node").forEach((el) => el.remove());

    nodes.forEach((node) => {
      const def = schema[node.type];
      const el = document.createElement("article");
      el.className = `entity-node${selectedNodeId === node.id ? " selected" : ""}`;
      el.dataset.id = node.id;
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
      el.style.zIndex = selectedNodeId === node.id ? "5" : "2";
      const size = estimateNodeSize(node);
      el.style.width = `${size.w}px`;
      el.style.height = `${size.h}px`;
      if (!node.width) node.width = size.w;
      if (!node.height) node.height = size.h;

      // Pop-in only on first appearance, not on every re-render.
      if (animatedNodes.has(node.id)) el.style.animation = "none";
      else animatedNodes.add(node.id);

      el.innerHTML = `
        <header class="entity-node-header" data-drag-handle>
          <span class="dot" style="background:${def.color}"></span>
          <div class="entity-node-meta">
            <span class="entity-type-label">${node.type}</span>
            <input
              type="text"
              class="query-name-input"
              value="${escapeAttr(node.name)}"
              spellcheck="false"
              aria-label="Query name"
              title="Operation name (query <name>)"
            />
            <input
              type="text"
              class="result-name-input"
              value="${escapeAttr(node.resultName || "")}"
              placeholder="${escapeAttr(innerBlockName(sanitizeName(node.name, `get${node.type}`)))}"
              spellcheck="false"
              aria-label="Result key"
              title="Result key — the inner block name (defaults to the operation name without 'get')"
            />
          </div>
          <button type="button" class="entity-node-remove" title="Remove" aria-label="Remove ${node.type}">×</button>
        </header>
        <div class="entity-node-body">
          ${renderDirectivesSection(node)}
          ${renderParamsSection(node)}
          ${renderRootFiltersSection(node)}
          <ul class="entity-fields">${renderFieldTree(node.type, node.selection, [], 0, node.aliases || {}, node)}</ul>
        </div>
        <div class="entity-resize" data-resize-handle title="Drag to resize"></div>
      `;

      const header = el.querySelector(".entity-node-header");
      const nameInput = el.querySelector(".query-name-input");

      header.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".entity-node-remove, .query-name-input, .result-name-input")) return;
        e.preventDefault();
        setSelected(node.id);
        const rect = el.getBoundingClientRect();
        moveState = {
          id: node.id,
          offsetX: e.clientX - rect.left,
          offsetY: e.clientY - rect.top,
        };
        el.classList.add("dragging");
        document.body.classList.add("is-dragging-node");
      });

      const resizeHandle = el.querySelector("[data-resize-handle]");
      if (resizeHandle) {
        resizeHandle.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelected(node.id);
          resizeState = {
            id: node.id,
            startX: e.clientX,
            startY: e.clientY,
            startW: el.offsetWidth,
            startH: el.offsetHeight,
          };
          el.classList.add("resizing");
          document.body.classList.add("is-resizing-node");
          resizeHandle.setPointerCapture?.(e.pointerId);
        });
      }

      stopDragPropagation(nameInput);
      nameInput.addEventListener("input", () => {
        node.name = nameInput.value;
        refreshQuery();
      });
      nameInput.addEventListener("change", () => {
        node.name = sanitizeName(nameInput.value, defaultName(node.type));
        nameInput.value = node.name;
        refreshQuery();
      });
      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          nameInput.blur();
        }
        e.stopPropagation();
      });

      const resultInput = el.querySelector(".result-name-input");
      stopDragPropagation(resultInput);
      resultInput.addEventListener("input", () => {
        node.resultName = resultInput.value;
        refreshQuery();
      });
      resultInput.addEventListener("change", () => {
        node.resultName = resultInput.value.trim()
          ? sanitizeName(resultInput.value, "")
          : "";
        resultInput.value = node.resultName;
        refreshQuery();
      });
      resultInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          resultInput.blur();
        }
        e.stopPropagation();
      });

      el.querySelectorAll(".alias-input").forEach((input) => {
        stopDragPropagation(input);
        const syncAliasSize = () => {
          const len = Math.max(5, Math.min(28, (input.value || "alias").length + 1));
          input.size = len;
        };
        syncAliasSize();
        input.addEventListener("input", () => {
          const key = pathKey(decodePath(input.dataset.aliasPath));
          const value = input.value.trim();
          if (value) node.aliases[key] = value;
          else delete node.aliases[key];
          syncAliasSize();
          refreshQuery();
        });
        input.addEventListener("change", () => {
          const key = pathKey(decodePath(input.dataset.aliasPath));
          if (node.aliases[key]) {
            // Aliases may be dotted (Author.Name), so keep dots.
            node.aliases[key] = node.aliases[key].replace(/[^A-Za-z0-9_.]/g, "_");
            input.value = node.aliases[key];
            syncAliasSize();
            refreshQuery();
          }
        });
        input.addEventListener("keydown", (e) => e.stopPropagation());
      });

      el.querySelector(".entity-node-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        nodes = nodes.filter((n) => n.id !== node.id);
        if (selectedNodeId === node.id) selectedNodeId = null;
        renderNodes();
        refreshQuery();
      });

      el.querySelectorAll(".directive-toggle").forEach((btn) => {
        stopDragPropagation(btn);
        btn.addEventListener("click", () => {
          const key = btn.dataset.directive;
          node.directives[key] = !node.directives[key];
          btn.classList.toggle("active", node.directives[key]);
          refreshQuery();
        });
      });

      el.querySelector(".add-param").addEventListener("click", (e) => {
        e.stopPropagation();
        let name = `param${node.params.length + 1}`;
        let i = 2;
        while (node.params.some((p) => p.name === name)) {
          name = `param${i}`;
          i += 1;
        }
        node.params.push({
          id: paramUid(),
          name,
          type: "string",
          value: "",
          mode: "var",
        });
        renderNodes();
        refreshQuery();
      });

      el.querySelectorAll(".param-card").forEach((card) => {
        const param = node.params.find((p) => p.id === card.dataset.paramId);
        if (!param) return;

        const nameEl = card.querySelector(".param-name");
        const typeEl = card.querySelector(".param-type");
        const valueEl = card.querySelector(".param-value");
        const modeEl = card.querySelector(".param-mode");
        const removeBtn = card.querySelector(".param-remove");

        [nameEl, typeEl, valueEl, modeEl, removeBtn].forEach(stopDragPropagation);

        modeEl.addEventListener("change", () => {
          param.mode = modeEl.value === "default" ? "default" : "var";
          refreshQuery();
        });
        nameEl.addEventListener("input", () => {
          const prev = param.name;
          param.name = nameEl.value.replace(/^\$/, "");
          // Keep filter references in sync while typing.
          const renameIn = (group) => {
            (group?.conditions || []).forEach((c) => {
              if (c.valueMode === "param" && c.paramName === prev) c.paramName = param.name;
            });
          };
          renameIn(node.rootFilter);
          Object.values(node.edgeFilters || {}).forEach(renameIn);
          refreshQuery();
        });
        nameEl.addEventListener("change", () => {
          const prev = param.name;
          param.name = sanitizeName(param.name, "param");
          nameEl.value = param.name;
          const renameIn = (group) => {
            (group?.conditions || []).forEach((c) => {
              if (c.valueMode === "param" && c.paramName === prev) c.paramName = param.name;
            });
          };
          renameIn(node.rootFilter);
          Object.values(node.edgeFilters || {}).forEach(renameIn);
          renderNodes();
          refreshQuery();
        });
        typeEl.addEventListener("change", () => {
          param.type = typeEl.value;
          if (!param.value) param.value = defaultParamValue(param.type);
          refreshQuery();
        });
        valueEl.addEventListener("input", () => {
          param.value = valueEl.value;
          refreshQuery();
        });
        removeBtn.addEventListener("click", () => {
          const removed = param.name;
          node.params = node.params.filter((p) => p.id !== param.id);
          const clearRef = (group) => {
            (group?.conditions || []).forEach((c) => {
              if (c.valueMode === "param" && c.paramName === removed) {
                c.paramName = "";
              }
            });
          };
          clearRef(node.rootFilter);
          Object.values(node.edgeFilters || {}).forEach(clearRef);
          renderNodes();
          refreshQuery();
        });
      });

      const getFilterGroup = (edgePath) => {
        if (!edgePath) {
          if (!node.rootFilter) node.rootFilter = emptyFilterGroup();
          return node.rootFilter;
        }
        if (!node.edgeFilters) node.edgeFilters = {};
        if (!node.edgeFilters[edgePath]) node.edgeFilters[edgePath] = emptyFilterGroup();
        return node.edgeFilters[edgePath];
      };

      el.querySelectorAll(".filter-panel").forEach((panel) => {
        const edgePath = panel.dataset.edgePath || "";
        const group = getFilterGroup(edgePath);
        const typeName = typeAtEdgePath(node.type, edgePath);

        panel.querySelectorAll(".filter-op-btn").forEach((btn) => {
          stopDragPropagation(btn);
          btn.addEventListener("click", () => {
            group.op = btn.dataset.op === "OR" ? "OR" : "AND";
            renderNodes();
            refreshQuery();
          });
        });

        panel.querySelector(".add-filter")?.addEventListener("click", (e) => {
          e.stopPropagation();
          const preds = scalarPredicates(typeName);
          const used = new Set(group.conditions.map((c) => c.predicate));
          const next = preds.find((p) => !used.has(p.name)) || preds[0];
          const predName = next?.name || "";
          const type = paramTypeForPredicate(typeName, predName);
          group.conditions.push(newFilterCondition(predName, type));
          renderNodes();
          refreshQuery();
        });

        panel.querySelectorAll(".filter-row").forEach((row) => {
          const cond = group.conditions.find((c) => c.id === row.dataset.filterId);
          if (!cond) return;

          const funcEl = row.querySelector(".filter-func");
          const predEl = row.querySelector(".filter-predicate");
          const modeEl = row.querySelector(".filter-value-mode");
          const literalEl = row.querySelector(".filter-literal");
          const paramEl = row.querySelector(".filter-param");
          const removeBtn = row.querySelector(".filter-remove");

          [funcEl, predEl, modeEl, literalEl, paramEl, removeBtn]
            .filter(Boolean)
            .forEach(stopDragPropagation);

          funcEl?.addEventListener("change", () => {
            cond.func = funcEl.value;
            if (isUnaryFilter(cond.func)) {
              cond.valueMode = "literal";
              cond.literal = "";
              cond.paramName = "";
            }
            renderNodes();
            refreshQuery();
          });
          predEl?.addEventListener("change", () => {
            cond.predicate = predEl.value;
            const type = paramTypeForPredicate(typeName, cond.predicate);
            if (cond.valueMode === "literal" && !isUnaryFilter(cond.func)) {
              cond.literal = defaultParamValue(type);
            }
            refreshQuery();
          });
          modeEl?.addEventListener("change", () => {
            cond.valueMode = modeEl.value === "param" ? "param" : "literal";
            if (cond.valueMode === "param") {
              if (!cond.paramName && node.params[0]) cond.paramName = node.params[0].name;
              if (!cond.paramName) {
                // Auto-create a param from the predicate leaf.
                const seed = sanitizeName(
                  (cond.predicate || "param").replace(/\./g, "_"),
                  "param"
                );
                let name = seed;
                let i = 2;
                while (node.params.some((p) => p.name === name)) {
                  name = `${seed}${i}`;
                  i += 1;
                }
                const type = paramTypeForPredicate(typeName, cond.predicate);
                node.params.push({
                  id: paramUid(),
                  name,
                  type,
                  value: defaultParamValue(type),
                  mode: "var",
                });
                cond.paramName = name;
              }
            }
            renderNodes();
            refreshQuery();
          });
          literalEl?.addEventListener("input", () => {
            cond.literal = literalEl.value;
            refreshQuery();
          });
          paramEl?.addEventListener("change", () => {
            cond.paramName = paramEl.value;
            refreshQuery();
          });
          removeBtn?.addEventListener("click", () => {
            group.conditions = group.conditions.filter((c) => c.id !== cond.id);
            if (edgePath && !group.conditions.length) {
              delete node.edgeFilters[edgePath];
            }
            renderNodes();
            refreshQuery();
          });
        });
      });

      el.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        input.addEventListener("change", () => {
          const path = decodePath(input.dataset.path);
          const kind = input.dataset.kind;
          const current = getNode(node.id);
          if (!current) return;

          if (input.checked) {
            if (kind === "object") {
              current.selection = setAtPath(current.selection, path, {});
            } else {
              current.selection = setAtPath(current.selection, path, null);
            }
          } else {
            current.selection = setAtPath(current.selection, path, undefined);
            const pathStr = pathKey(path);
            Object.keys(current.aliases || {}).forEach((key) => {
              if (key === pathStr || key.startsWith(`${pathStr}.`)) {
                delete current.aliases[key];
              }
            });
            // Drop edge filters on this edge and anything nested under it.
            Object.keys(current.edgeFilters || {}).forEach((key) => {
              if (key === pathStr || key.startsWith(`${pathStr}.`)) {
                delete current.edgeFilters[key];
              }
            });
          }
          renderNodes();
          refreshQuery();
        });
      });

      el.addEventListener("mousedown", (e) => {
        if (e.target.closest("input, label, button, select")) return;
        setSelected(node.id);
      });

      canvasEl.appendChild(el);

      const savedScroll = fieldScroll.get(node.id);
      if (savedScroll) {
        const body = el.querySelector(".entity-node-body");
        if (body) {
          body.scrollTop = savedScroll.top;
          body.scrollLeft = savedScroll.left;
        }
      }
    });

    updateEmptyState();
    updateCanvasSurface();
  }

  function placeEntity(typeName, x, y) {
    if (!schema[typeName]) return;

    const pos =
      x != null && y != null
        ? findFreePosition(DEFAULT_NODE_W, DEFAULT_NODE_H, { x, y })
        : findFreePosition(DEFAULT_NODE_W, DEFAULT_NODE_H);

    nodes.push({
      id: uid(),
      type: typeName,
      name: defaultName(typeName),
      x: pos.x,
      y: pos.y,
      width: DEFAULT_NODE_W,
      height: DEFAULT_NODE_H,
      selection: defaultSelection(typeName),
      params: [],
      rootFilter: emptyFilterGroup(),
      edgeFilters: {},
      directives: { cascade: false, normalize: false },
      aliases: {},
      resultName: "",
    });
    selectedNodeId = nodes[nodes.length - 1].id;
    renderNodes();
    refreshQuery();
  }

  /* ---------- DQL generation ---------- */

  function indent(level) {
    return "  ".repeat(level);
  }

  function hasAnySelection(selection) {
    return selection && typeof selection === "object" && Object.keys(selection).length > 0;
  }

  function renderSelection(typeName, selection, depth, node, pathPrefix, aliases) {
    const def = schema[typeName];
    if (!def || !hasAnySelection(selection)) return "";

    const lines = [];
    def.fields.forEach((field) => {
      if (!(field.name in selection)) return;

      const fieldPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name;
      const alias = aliases[fieldPath] ? `${aliases[fieldPath]}: ` : "";

      if (field.kind === "scalar") {
        lines.push(`${indent(depth)}${alias}${field.name}`);
        return;
      }

      const nestedType = field.ofType;
      const filterStr = formatFilterDirective(
        node.edgeFilters?.[fieldPath],
        nestedType || typeName
      );

      const nestedSel = selection[field.name];

      // Depth cap only — allow the same type to reappear on a nested edge
      // (e.g. User → posts → author → User) so long as the selection is finite.
      if (!nestedType || !schema[nestedType] || depth >= 14) {
        lines.push(`${indent(depth)}${alias}${field.name}${filterStr} {`);
        lines.push(`${indent(depth)}}`);
        return;
      }

      const nestedBody = renderSelection(
        nestedType,
        nestedSel && typeof nestedSel === "object" ? nestedSel : {},
        depth + 1,
        node,
        fieldPath,
        aliases
      );
      lines.push(`${indent(depth)}${alias}${field.name}${filterStr} {`);
      if (nestedBody) lines.push(nestedBody);
      lines.push(`${indent(depth)}}`);
    });

    return lines.join("\n");
  }

  function uniqueBlockNames(roots) {
    const seen = new Map();
    return roots.map((node) => {
      const fallback = `get${node.type}`;
      let name = sanitizeName(node.name, fallback);
      if (seen.has(name)) {
        const count = seen.get(name) + 1;
        seen.set(name, count);
        name = `${name}_${count}`;
      } else {
        seen.set(name, 1);
      }
      return name;
    });
  }

  function collectParams(roots) {
    const map = new Map();
    roots.forEach((node) => {
      (node.params || []).forEach((param) => {
        if (param.mode === "literal") return;
        const name = sanitizeName(param.name, "");
        if (!name || map.has(name)) return;
        map.set(name, { ...param, name });
      });
    });
    return [...map.values()];
  }

  /** Format a param's value as a DQL literal ("Alice", 42, true). */
  function formatDqlLiteral(param) {
    if (param.type === "int") {
      const n = parseInt(param.value, 10);
      return String(Number.isFinite(n) ? n : 0);
    }
    if (param.type === "float") {
      const n = parseFloat(param.value);
      return String(Number.isFinite(n) ? n : 0);
    }
    if (param.type === "bool") {
      return String(String(param.value).toLowerCase() === "true");
    }
    return JSON.stringify(String(param.value ?? ""));
  }

  function formatParamValue(param) {
    if (param.type === "int") {
      const n = parseInt(param.value, 10);
      return Number.isFinite(n) ? n : 0;
    }
    if (param.type === "float") {
      const n = parseFloat(param.value);
      return Number.isFinite(n) ? n : 0;
    }
    if (param.type === "bool") {
      return String(param.value).toLowerCase() === "true";
    }
    return String(param.value ?? "");
  }

  function formatFilterCondition(cond, typeName) {
    if (!cond?.func || !cond?.predicate) return null;
    if (isUnaryFilter(cond.func)) return `${cond.func}(${cond.predicate})`;

    if (cond.valueMode === "param") {
      const name = sanitizeName(cond.paramName, "");
      if (!name) return null;
      return `${cond.func}(${cond.predicate}, $${name})`;
    }

    const type = paramTypeForPredicate(typeName, cond.predicate);
    const valuePart = formatDqlLiteral({ type, value: cond.literal });
    return `${cond.func}(${cond.predicate}, ${valuePart})`;
  }

  function formatFilterDirective(group, typeName) {
    const g = ensureFilterGroup(group);
    const parts = g.conditions
      .map((c) => formatFilterCondition(c, typeName))
      .filter(Boolean);
    if (!parts.length) return "";
    return ` @filter(${parts.join(` ${g.op} `)})`;
  }

  /**
   * Result key inside the operation: "query getUser { User(...) }".
   * Strip a leading "get" when the remainder is a valid identifier,
   * otherwise reuse the operation name.
   */
  function innerBlockName(opName) {
    if (/^get./.test(opName)) {
      const rest = opName.slice(3);
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(rest)) return rest;
    }
    return opName;
  }

  function blockParams(node) {
    const seen = new Set();
    const result = [];
    (node.params || []).forEach((param) => {
      const name = sanitizeName(param.name, "");
      if (!name || seen.has(name)) return;
      seen.add(name);
      result.push({ ...param, name });
    });
    return result;
  }

  function refreshQuery() {
    try {
      const roots = nodes.filter((n) => hasAnySelection(n.selection));
      if (!roots.length) {
        setOutputs(
          nodes.length ? "# Pick at least one predicate on a query block." : "",
          ""
        );
        return;
      }

      const names = uniqueBlockNames(roots);
      const allParams = collectParams(roots);

      // One named operation per canvas block, each with its own signature.
      const operations = roots.map((node, i) => {
        const filter = formatFilterDirective(node.rootFilter, node.type);
        const directives =
          (node.directives?.cascade ? " @cascade" : "") +
          (node.directives?.normalize ? " @normalize" : "");
        const body = renderSelection(
          node.type,
          node.selection,
          2,
          node,
          "",
          node.aliases || {}
        );

        const params = blockParams(node);
        const signature = params.length
          ? `(${params
              .map(
                (p) =>
                  `$${p.name}: ${p.type}${p.mode === "default" ? ` = ${formatDqlLiteral(p)}` : ""}`
              )
              .join(", ")})`
          : "";
        const inner = sanitizeName(node.resultName, "") || innerBlockName(names[i]);

        return (
          `query ${names[i]}${signature} {\n` +
          `${indent(1)}${inner}(func: type("${node.type}"))${filter}${directives} {\n` +
          `${body}\n${indent(1)}}\n}`
        );
      });

      // Single block → flat vars object; multiple → grouped per operation,
      // since each operation is executed separately with its own variables.
      let vars = "";
      if (allParams.length) {
        const varsFor = (node) => {
          const obj = {};
          blockParams(node).forEach((p) => {
            obj[`$${p.name}`] = formatParamValue(p);
          });
          return obj;
        };

        if (roots.length === 1) {
          vars = JSON.stringify(varsFor(roots[0]), null, 2);
        } else {
          const grouped = {};
          roots.forEach((node, i) => {
            if (blockParams(node).length) grouped[names[i]] = varsFor(node);
          });
          vars = JSON.stringify(grouped, null, 2);
        }
      }

      setOutputs(operations.join("\n\n"), vars);
    } catch (err) {
      consoleError(err.message || String(err), "query-build");
      setOutputs(`# Query build failed:\n# ${err.message || err}`, "");
    } finally {
      scheduleSaveWorkspace();
    }
  }

  /* ---------- Copy ---------- */

  async function copyText(text, button) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const prev = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = prev;
      }, 1200);
    } catch {
      /* clipboard unavailable */
    }
  }

  /* ---------- Canvas drag & drop ---------- */

  window.addEventListener("pointermove", (e) => {
    if (resizeState) {
      const node = getNode(resizeState.id);
      const el = canvasEl.querySelector(`.entity-node[data-id="${resizeState.id}"]`);
      if (!node || !el) return;
      const nextW = Math.max(300, resizeState.startW + (e.clientX - resizeState.startX));
      const nextH = Math.max(240, resizeState.startH + (e.clientY - resizeState.startY));
      node.width = nextW;
      node.height = nextH;
      el.style.width = `${nextW}px`;
      el.style.height = `${nextH}px`;
      updateCanvasSurface();
      return;
    }

    if (!moveState) return;
    const node = getNode(moveState.id);
    const el = canvasEl.querySelector(`.entity-node[data-id="${moveState.id}"]`);
    if (!node || !el) return;

    const canvasRect = canvasEl.getBoundingClientRect();
    node.x = Math.max(
      0,
      e.clientX - canvasRect.left - moveState.offsetX + canvasEl.scrollLeft
    );
    node.y = Math.max(
      0,
      e.clientY - canvasRect.top - moveState.offsetY + canvasEl.scrollTop
    );
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    updateCanvasSurface();
  });

  window.addEventListener("pointerup", () => {
    if (resizeState) {
      const el = canvasEl.querySelector(`.entity-node[data-id="${resizeState.id}"]`);
      if (el) el.classList.remove("resizing");
      document.body.classList.remove("is-resizing-node");
      resizeState = null;
      scheduleSaveWorkspace();
      return;
    }
    if (!moveState) return;
    const el = canvasEl.querySelector(`.entity-node[data-id="${moveState.id}"]`);
    if (el) el.classList.remove("dragging");
    document.body.classList.remove("is-dragging-node");
    moveState = null;
    scheduleSaveWorkspace();
  });

  canvasEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    canvasEl.classList.add("drag-over");
  });

  canvasEl.addEventListener("dragleave", (e) => {
    if (!canvasEl.contains(e.relatedTarget)) {
      canvasEl.classList.remove("drag-over");
    }
  });

  canvasEl.addEventListener("drop", (e) => {
    e.preventDefault();
    canvasEl.classList.remove("drag-over");
    closeEntityMenu();
    const typeName = dragPaletteType || e.dataTransfer.getData("text/plain");
    if (!typeName || !schema[typeName]) return;

    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasEl.scrollLeft - DEFAULT_NODE_W / 2;
    const y = e.clientY - rect.top + canvasEl.scrollTop - 24;
    placeEntity(typeName, x, y);
  });

  if (addEntityBtn) {
    addEntityBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleEntityMenu();
    });
  }
  document.addEventListener("click", (e) => {
    if (!entityMenuWrap?.contains(e.target)) closeEntityMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeEntityMenu();
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      nodes = [];
      selectedNodeId = null;
      clearDqlDirty();
      clearWorkspace();
      renderNodes();
      refreshQuery();
    });
  }

  if (copyBtn) copyBtn.addEventListener("click", () => copyText(getDqlText(), copyBtn));
  if (copyVarsBtn) copyVarsBtn.addEventListener("click", () => copyText(varsText, copyVarsBtn));

  /* ---------- DQL editor → canvas ---------- */

  /**
   * Parse DQL text into canvas nodes. Extends the live schema when the query
   * references types/fields that are not loaded yet.
   */
  function importQueryText(raw, { source = "import" } = {}) {
    if (!window.DQLQueryParser) {
      throw new Error("Query parser is not loaded");
    }
    const operations = window.DQLQueryParser.parse(raw);
    const { schema: nextSchema, warnings } = window.DQLQueryParser.ensureSchema(
      schema,
      operations
    );
    const drafts = window.DQLQueryParser.toNodes(operations, nextSchema);

    schema = nextSchema;
    schemaIsSample = false;
    nodes = [];
    selectedNodeId = null;
    animatedNodes.clear();

    drafts.forEach((draft, i) => {
      const withIds = (group) => {
        const g = ensureFilterGroup(group);
        return {
          op: g.op,
          conditions: g.conditions.map((c) => ({
            id: filterUid(),
            func: c.func || "eq",
            predicate: c.predicate || "",
            valueMode: c.valueMode === "param" ? "param" : "literal",
            literal: c.literal ?? "",
            paramName: c.paramName || "",
          })),
        };
      };
      const edgeFilters = {};
      Object.entries(draft.edgeFilters || {}).forEach(([key, group]) => {
        edgeFilters[key] = withIds(group);
      });

      const pos = findFreePosition(DEFAULT_NODE_W, DEFAULT_NODE_H);
      nodes.push({
        id: uid(),
        type: draft.type,
        name: draft.name,
        x: pos.x,
        y: pos.y,
        width: DEFAULT_NODE_W,
        height: DEFAULT_NODE_H,
        selection: draft.selection,
        params: (draft.params || []).map((p) => ({
          id: paramUid(),
          name: p.name,
          type: PARAM_TYPES.includes(p.type) ? p.type : "string",
          value: p.value ?? "",
          mode: p.mode === "default" ? "default" : "var",
        })),
        rootFilter: withIds(draft.rootFilter),
        edgeFilters,
        directives: {
          cascade: !!draft.directives?.cascade,
          normalize: !!draft.directives?.normalize,
        },
        aliases: { ...(draft.aliases || {}) },
        resultName: draft.resultName || "",
      });
    });

    if (nodes.length) selectedNodeId = nodes[0].id;
    resolveOverlaps();

    // Clear dirty before refresh so generated DQL can write back into the editor.
    clearDqlDirty();
    renderDock();
    renderNodes();
    refreshQuery();

    consoleInfo(
      `Applied ${nodes.length} query block${nodes.length === 1 ? "" : "s"}`,
      source
    );
    (warnings || []).forEach((w) => consoleWarn(w, source));
    return `Loaded ${nodes.length} query block${nodes.length === 1 ? "" : "s"}`;
  }

  /**
   * Commit the DQL editor buffer to the canvas.
   * @param {{ reason?: string, soft?: boolean }} [opts]
   *   soft — used on blur: skip if not dirty / not a complete-looking query,
   *   and don't log errors for empty buffers.
   */
  function applyDqlFromEditor({ reason = "apply", soft = false } = {}) {
    if (soft && !dqlDirty) return false;

    const text = getDqlText().trim();
    if (!text) {
      if (soft) return false;
      nodes = [];
      selectedNodeId = null;
      clearDqlDirty();
      renderNodes();
      refreshQuery();
      consoleInfo("Cleared canvas from empty DQL editor", "editor");
      return true;
    }

    if (!looksLikeDql(text)) {
      if (soft) return false;
      consoleError(
        "Expected one or more `query Name { … }` operations before applying",
        "editor"
      );
      return false;
    }

    // No-op if the buffer still matches the last generated output.
    if (text === queryText.trim()) {
      clearDqlDirty();
      return true;
    }

    try {
      importQueryText(text, { source: "editor" });
      return true;
    } catch (err) {
      // Soft blur: stay dirty quietly while the user is still typing.
      if (!soft) consoleError(err.message || String(err), "editor");
      if (!dqlDirty) {
        dqlDirty = true;
        updateDqlChrome();
      }
      return false;
    }
  }

  function revertDqlEditor() {
    clearDqlDirty();
    writeDqlEditor(queryText);
    if (copyBtn) copyBtn.disabled = !queryText;
    consoleInfo("Reverted DQL editor to last canvas output", "editor");
  }

  if (applyDqlBtn) applyDqlBtn.addEventListener("click", () => applyDqlFromEditor({ reason: "button" }));
  if (revertDqlBtn) revertDqlBtn.addEventListener("click", () => revertDqlEditor());

  // Ctrl/Cmd+V on the canvas loads a pasted query directly.
  canvasEl.addEventListener("paste", (e) => {
    const text = e.clipboardData?.getData("text/plain") || "";
    if (!looksLikeDql(text)) return;
    if (e.target.closest("input, textarea, select, .monaco-editor")) return;
    e.preventDefault();
    try {
      const msg = importQueryText(text, { source: "paste" });
      canvasEmptyEl.textContent = msg;
      setTimeout(() => updateEmptyState(), 1600);
    } catch (err) {
      // Drop the text into the DQL editor so the user can fix it.
      clearDqlDirty();
      writeDqlEditor(text);
      markDqlDirty();
      consoleError(err.message || String(err), "paste");
    }
  });

  /* ---------- Schema API (Ratel supplies schema; no Load-schema modal) ---------- */

  function setSchema(next, { isSample = false, clearCanvas = true } = {}) {
    schema = next || {};
    schemaIsSample = isSample;
    if (clearCanvas) {
      nodes = [];
      selectedNodeId = null;
      animatedNodes.clear();
      clearDqlDirty();
    }
    renderDock();
    renderNodes();
    refreshQuery();
  }

  function applyLoadedSchema(next, sourceLabel) {
    const count = Object.keys(next || {}).length;
    if (!count) {
      consoleError('Schema parsed, but it contains no usable object types.', 'schema');
      return;
    }
    setSchema(next, { isSample: false });
    consoleInfo('Loaded ' + count + ' entit' + (count === 1 ? 'y' : 'ies') + ' from ' + sourceLabel, 'schema');
  }

  const loadSchemaBtn = $('loadSchemaBtn');
  if (loadSchemaBtn) loadSchemaBtn.hidden = true;

  /* ---------- Init ---------- */

  const restored = opts.persistWorkspace ? restoreWorkspace() : false;
  if (opts.schema && (!restored || schemaIsSample)) {
    schema = opts.schema;
    schemaIsSample = false;
  }
  renderDock();
  if (restored) {
    renderNodes();
    consoleInfo('Restored canvas from previous session', 'workspace');
  } else {
    updateEmptyState();
  }
  initEditors();
  refreshQuery();

  function destroy() {
    try {
      dqlEditor?.dispose?.();
      varsEditor?.dispose?.();
    } catch (_) {}
    dqlEditor = null;
    varsEditor = null;
    clearTimeout(saveWorkspaceTimer);
  }

  function clearCanvas() {
    nodes = [];
    selectedNodeId = null;
    clearDqlDirty();
    clearWorkspace();
    renderNodes();
    refreshQuery();
  }

  function importExternalQuery(text) {
    const raw = String(text || "").trim();
    if (!raw) {
      clearCanvas();
      return true;
    }
    try {
      importQueryText(raw, { source: "ratel-editor" });
      return true;
    } catch (err) {
      consoleError(err.message || String(err), "editor");
      return false;
    }
  }

  return {
    setSchema,
    applyLoadedSchema,
    getQuery: () => (dqlDirty ? getDqlText() : queryText),
    getVars: () => varsText,
    refresh: refreshQuery,
    clearCanvas,
    importQuery: importExternalQuery,
    destroy,
  };
  }

  return { mount };
})();
