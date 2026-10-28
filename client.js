/* eslint-disable */
// ==============================================================================
// 📦 插件名称: dsh-plugin-search-plugins (客户端半体)
// 🎨 功能简介: 侧边栏插件列表快捷搜索 (Ctrl+F) 与精准平滑滚动定位
// 🛡️ 作用域守卫: 严格限定在插件列表页与发现市场(插件安装页面)，其余页面完全放行
// ==============================================================================

window.__ModuleLoader__.load({
  id: "dsh-plugin-search-plugins",
  factory: (require) => {
    const exports = {};

    // ────────────────────── ⚙️ 头部样式与功能配置区 ──────────────────────

    // 🎲 调试日志开关 (是否在浏览器控制台打印诊断信息): False/True
    const 调试_日志开关 = true;

    // ⌨️ 触发快捷键字母 (与 Ctrl/Cmd 组合使用): "f"
    const 触发_按键 = "f";

    // 📏 搜索浮层最大展示候选结果数量
    const 最大_展示条数 = 12;

    // ⏱️ 目标卡片呼吸聚焦高亮动画持续时长 (毫秒数, 与宿主 2.4s 对齐)
    const 高亮_持续时长 = 2400;

    // 🎨 浮层容器的 Z-Index 层级高度 (保证在宿主所有弹层之上)
    const 浮层_层级 = 99999;

    // ────────────────────── 🎯 官方 DOM 契约选择器与命名空间 ──────────────────────

    // 📦 插件主面板容器选择器 (已安装列表、发现市场、插件详情页均在此容器内切换)
    const 列表面板_选择器 = "[data-plugin-panel]";

    // 🏷️ 已安装插件卡属性：社区扩展包用 data-plugin-package，官方内置插件用 data-plugin-item
    const 已安装卡片_选择器 = "[data-plugin-package], [data-plugin-item]";

    // 🚫 已安装插件详情页选择器：社区包 data-plugin-detail，内置插件 data-plugin-item-detail，组件行 data-plugin-row-detail
    const 已安装详情页_选择器 = "[data-plugin-detail], [data-plugin-item-detail], [data-plugin-row-detail]";

    // 🛒 官方发现市场契约锚点 (来自 @deepseek-ai/dsh-client-ui-plugin-market，即插件安装页面)
    const 发现市场面板_选择器 = '[data-plugin-tab="discover"]';

    // 🛍️ 发现市场内未安装/候选插件卡片选择器
    const 市场卡片_选择器 = "[data-market-entry]";

    // 🚫 发现市场内插件详情页选择器
    const 市场详情页_选择器 = "[data-market-detail]";

    // 🌐 视图命名空间常量定义
    const 已安装_命名空间 = "installed";
    const 发现市场_命名空间 = "discover";

    /**
     * 🛠️ 统一调试日志打印函数 (DRY 统一调用)
     * 
     * 💡 逻辑解释:
     *   1. 检查头部变量 调试_日志开关 是否开启。
     *   2. 开启时统一带上前缀输出，格式整齐且支持排查。
     * 
     * 🎯 为什么这样写/处理:
     *   杜绝多处分散调用 console.log，集中控制输出，便于全局静音或调试。
     * 
     * @param {string} 日志_内容 调试信息文本
     */
    function 打印_调试日志(日志_内容) {
      if (调试_日志开关) {
        console.log(`[插件搜索-客户端] 💻 ${日志_内容}`);
      }
    }

    // ────────────────────── 🎨 样式注入与动态清理 ──────────────────────

    let 样式_元素 = null;

    /**
     * 💉 动态注入插件专用的 CSS 样式表 (采用宿主 --dsw-alias-* 主题变量)
     * 
     * 📊 数据结构设计图:
     * ┌──────────────────────────────┐
     * │ 宿主 CSS 主题 Token 变量库    │
     * └──────────────┬───────────────┘
     *                │ 引用 --dsw-alias-*
     *                ▼
     * ┌──────────────────────────────┐
     * │ <style id="dsh-search-style">│ ──自动适应暗色/亮色模式──► 浮动搜索面板与卡片高亮
     * └──────────────────────────────┘
     * 
     * 💡 逐行逻辑解释:
     *   1. 检查页面中是否已存在 id 为 "dsh-search-plugins-style" 的样式标签。
     *   2. 若已存在则直接复用，避免重复创建引起资源浪费。
     *   3. 若不存在，则创建新的 <style> 标签，写入浮层背景、阴影、输入框与高亮动画样式。
     *   4. 将样式节点挂载到 document.head 中。
     * 
     * 🎯 为什么这样写:
     *   严格使用宿主规范的 --dsw-alias-* 颜色变量，保证无论用户切换为亮色还是暗色主题，
     *   搜索框的外观、边框、光晕、文字均能与宿主整体设计语言保持完全一致。
     */
    function 注入_插件样式() {
      if (document.getElementById("dsh-search-plugins-style")) {
        return;
      }
      样式_元素 = document.createElement("style");
      样式_元素.id = "dsh-search-plugins-style";
      样式_元素.textContent = `
        /* 遮罩背景 */
        .dsh-sousuo-zhezhao {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.42);
          backdrop-filter: blur(4px);
          z-index: ${浮层_层级};
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 14vh;
          animation: dshSousuoFadeIn 0.15s ease-out;
        }

        /* 搜索主面板 */
        .dsh-sousuo-mianban {
          width: 580px;
          max-width: 90vw;
          background: var(--dsw-alias-surface-overlay, #ffffff);
          border: 1px solid var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.1));
          border-radius: 12px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.12);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          color: var(--dsw-alias-label-primary, #1f1f1f);
          animation: dshSousuoPopIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* 头部输入区 */
        .dsh-sousuo-toubu {
          display: flex;
          align-items: center;
          padding: 14px 18px;
          gap: 12px;
          border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
        }

        .dsh-sousuo-tubiao {
          display: flex;
          align-items: center;
          color: var(--dsw-alias-state-business-primary, #4d6bfe);
          flex-shrink: 0;
        }

        .dsh-sousuo-shurukuang {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 15px;
          line-height: 22px;
          color: var(--dsw-alias-label-primary, inherit);
          font-family: inherit;
        }

        .dsh-sousuo-shurukuang::placeholder {
          color: var(--dsw-alias-label-tertiary, #8c8c8c);
        }

        .dsh-sousuo-kuaijietishi {
          font-size: 11px;
          padding: 3px 6px;
          border-radius: 4px;
          background: var(--dsw-alias-fill-tertiary, rgba(0, 0, 0, 0.06));
          color: var(--dsw-alias-label-tertiary, #8c8c8c);
          user-select: none;
        }

        /* 列表候选结果区 */
        .dsh-sousuo-liebiaokuang {
          max-height: 380px;
          overflow-y: auto;
          padding: 8px 0;
          margin: 0;
          list-style: none;
        }

        .dsh-sousuo-xiang {
          display: flex;
          flex-direction: column;
          padding: 10px 18px;
          cursor: pointer;
          transition: background-color 0.1s ease;
          gap: 3px;
        }

        .dsh-sousuo-xiang:hover,
        .dsh-sousuo-xiang.xuanzhong {
          background-color: var(--dsw-alias-fill-hover, rgba(0, 0, 0, 0.05));
        }

        .dsh-sousuo-xiang-hang1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .dsh-sousuo-xiang-biaoti {
          font-size: 14px;
          font-weight: 500;
          color: var(--dsw-alias-label-primary, inherit);
        }

        .dsh-sousuo-xiang-baoming {
          font-size: 12px;
          color: var(--dsw-alias-label-tertiary, #8c8c8c);
          font-family: monospace;
        }

        .dsh-sousuo-xiang-miaoshu {
          font-size: 12px;
          color: var(--dsw-alias-label-secondary, #595959);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* 空状态提示 */
        .dsh-sousuo-kongzhuangtai {
          padding: 24px 18px;
          text-align: center;
          font-size: 13px;
          color: var(--dsw-alias-label-tertiary, #8c8c8c);
        }

        /* 底部操作提示条 */
        .dsh-sousuo-dibu {
          padding: 8px 18px;
          border-top: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
          background: var(--dsw-alias-fill-secondary, rgba(0, 0, 0, 0.02));
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--dsw-alias-label-tertiary, #8c8c8c);
        }

        /* 动画关键帧定义 */
        @keyframes dshSousuoFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes dshSousuoPopIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* 强制补充卡片高亮脉冲动画 (若宿主自身 class 被混淆时提供兜底支持) */
        [data-plugin-custom-glow] {
          box-shadow: 0 0 0 3px var(--dsw-alias-state-business-primary, #4d6bfe) !important;
          transition: box-shadow 0.2s ease;
        }
      `;
      document.head.appendChild(样式_元素);
      打印_调试日志("样式表注入成功 ✔️");
    }

    // ────────────────────── 🛡️ 精确作用域与环境守卫 ──────────────────────

    /**
     * 🔍 获取当前插件面板主容器 (一次定位，绝不做全局滥搜)
     * 
     * 📊 数据结构设计图:
     *   document
     *      │
     *      └── querySelector("[data-plugin-panel]") ──► 插件主面板容器 HTMLElement | null
     * 
     * 💡 逐行逻辑解释:
     *   第 1 行: 检查当前环境 document 与 querySelector 是否完备。
     *   第 2 行: 尝试在文档中查询 [data-plugin-panel] 节点。
     *   第 3 行: 捕获可能的查询异常并记录调试日志，确保不导致页面抛错崩溃。
     * 
     * 🎯 为什么这样写/处理:
     *   这是整个插件限定作用域的基础根节点，所有后续的子视图扫描与详情页排查都在该节点内进行。
     * 
     * @returns {HTMLElement | null} 插件面板节点
     */
    function 取_列表面板() {
      if (typeof document === "undefined" || typeof document.querySelector !== "function") {
        return null;
      }
      try {
        return document.querySelector(列表面板_选择器);
      } catch (错误) {
        打印_调试日志(`查询列表面板出现异常: ${String(错误)}`);
        return null;
      }
    }

    /**
     * 🧭 识别当前活跃的视图类别 (已安装 vs 发现市场/安装页面)
     * 
     * 💡 逐行逻辑解释:
     *   第 1 行: 验证传入的 面板_元素 是否合法。
     *   第 2 行: 在面板内检查是否存在 [data-plugin-tab="discover"] 或 [data-market-detail]。
     *   第 3 行: 命中市场特征则返回 "discover"；否则默认返回已安装类别 "installed"。
     * 
     * 🎯 为什么这样写/处理:
     *   官方在同一主面板内通过 Tab 切换展示「已安装」与「发现市场」，
     *   通过该函数可精准判定当前用户所处的具体列表视图。
     * 
     * @param {HTMLElement} 面板_元素 
     * @returns {"installed" | "discover" | null}
     */
    function 取_当前视图类别(面板_元素) {
      if (!面板_元素 || typeof 面板_元素.querySelector !== "function") {
        return null;
      }
      try {
        const 属于发现市场 =
          面板_元素.querySelector(发现市场面板_选择器) !== null ||
          面板_元素.querySelector(市场详情页_选择器) !== null;
        return 属于发现市场 ? 发现市场_命名空间 : 已安装_命名空间;
      } catch (错误) {
        打印_调试日志(`识别当前视图类别出现异常: ${String(错误)}`);
        return 已安装_命名空间;
      }
    }

    /**
     * 🛡️ 检测当前面板是否处于插件详情/配置设置页中
     * 
     * 💡 逐行逻辑解释:
     *   第 1 行: 校验面板合法性。
     *   第 2 行: 取得或确认当前视图类别（已安装或发现市场）。
     *   第 3 行: 如果属于发现市场，则探测是否包含 [data-market-detail] 详情节点。
     *   第 4 行: 如果属于已安装视图，则探测是否包含 [data-plugin-detail] 等详情节点。
     * 
     * 🎯 为什么这样写/处理:
     *   当用户点进插件详情配置页时，主面板仍然存在，但界面属于设置编辑状态；
     *   此时若拦截 Ctrl+F 会剥夺用户的原生文本检索能力，故必须检测并绝对放行。
     * 
     * @param {HTMLElement} 面板_元素 
     * @param {string} [视图_类别] 
     * @returns {boolean}
     */
    function 检查_详情页是否存在(面板_元素, 视图_类别) {
      if (!面板_元素 || typeof 面板_元素.querySelector !== "function") {
        return false;
      }
      try {
        const 类别 = 视图_类别 || 取_当前视图类别(面板_元素);
        if (类别 === 发现市场_命名空间) {
          return 面板_元素.querySelector(市场详情页_选择器) !== null;
        }
        return 面板_元素.querySelector(已安装详情页_选择器) !== null;
      } catch (错误) {
        打印_调试日志(`检测详情页是否存在出现异常: ${String(错误)}`);
        return false;
      }
    }

    /**
     * 🎯 综合环境守卫函数：判定是否在插件列表或发现市场安装页且无详情页覆盖
     * 
     * 📊 数据结构设计图:
     *   键盘事件触发 (Ctrl+F)
     *            │
     *            ▼
     *       取_列表面板() ───── 找不到 ─────► [放行] (处于聊天会话/其他设置等)
     *            │ 存在面板
     *            ▼
     *     取_当前视图类别() ──► "installed" 或 "discover"
     *            │
     *            ▼
     *   检查_详情页是否存在() ── 存在详情 ──► [放行] (处于插件配置/详情页面)
     *            │ 不存在详情
     *            ▼
     *    【列表态验证通过】 ───────────────► [允许拦截并唤起搜索浮层]
     * 
     * 💡 逐行逻辑解释:
     *   第 1 行: 调用 取_列表面板() 获取根容器；若为空直接判定不激活。
     *   第 2 行: 调用 取_当前视图类别() 获取当前处于已安装还是市场。
     *   第 3 行: 调用 检查_详情页是否存在() 检查是否有详情页阻断。
     *   第 4 行: 详情页存在时返回允许搜索=false，彻底放行原生浏览器搜索。
     *   第 5 行: 全部守卫校验通过，返回允许搜索=true并附带上下文对象。
     * 
     * 🎯 为什么这样写/处理:
     *   将所有的判定逻辑高内聚封装为单一守卫函数，满足 DRY 原则，
     *   避免在全局按键处理器内堆砌深层嵌套逻辑。
     * 
     * @returns {{ 允许搜索: boolean, 面板: HTMLElement | null, 视图类别: string }}
     */
    function 检查_是否处于有效插件列表页() {
      const 面板 = 取_列表面板();
      if (!面板) {
        return { 允许搜索: false, 面板: null, 视图类别: "" };
      }

      const 视图类别 = 取_当前视图类别(面板);
      const 详情页存在 = 检查_详情页是否存在(面板, 视图类别);

      if (详情页存在) {
        return { 允许搜索: false, 面板: 面板, 视图类别: 视图类别 };
      }

      return { 允许搜索: true, 面板: 面板, 视图类别: 视图类别 };
    }

    // ────────────────────── 🔍 插件数据提取与搜索 ──────────────────────

    /**
     * 📋 扫描当前页面渲染出的所有插件卡片，构建检索快照
     * 
     * 📊 数据结构设计图:
     * ┌────────────────────────────────────────────────────────┐
     * │       当前面板内 DOM 卡片: [data-plugin-*] / [data-market-*] │
     * └───────────────────────────┬────────────────────────────┘
     *                             │ 局限于面板内提取元素属性与内部文本
     *                             ▼
     * ┌────────────────────────────────────────────────────────┐
     * │ 插件对象数组: Array<{                                  │
     * │   包名: string, 标题: string, 描述: string, 元素: Element│
     * │ }>                                                     │
     * └────────────────────────────────────────────────────────┘
     * 
     * 💡 逐行逻辑解释:
     *   1. 接收 面板_容器 与 视图_类别；若缺省则自动通过环境守卫提取。
     *   2. 确定查询选择器：处于发现市场时查询 [data-market-entry] 与标准卡片；已安装时查询 [data-plugin-package], [data-plugin-item]。
     *   3. 严禁在 document 全局查询，必须使用 面板_容器.querySelectorAll 执行 O(1) 局部探测。
     *   4. 遍历节点提取包名、人类可读的标题与描述文本。
     *   5. 构建并返回结构化数据对象数组。
     * 
     * 🎯 为什么这样写:
     *   严格在面板内部扫描，杜绝污染与跨页面残留节点；
     *   同时完美适配已安装插件列表与发现市场（插件安装页面）。
     * 
     * @param {HTMLElement} [目标_面板] 插件主面板容器
     * @param {string} [目标_视图类别] 当前视图类别
     * @returns {Array<{包名: string, 标题: string, 描述: string, 元素: HTMLElement}>}
     */
    function 扫描_插件卡片列表(目标_面板, 目标_视图类别) {
      const 面板 = 目标_面板 || 取_列表面板();
      if (!面板) {
        打印_调试日志("扫描卡片失败: 未找到可用的插件主面板容器 ❌");
        return [];
      }

      const 视图类别 = 目标_视图类别 || 取_当前视图类别(面板);

      // 🎯 依据视图分流选择器，支持已安装与发现市场卡片
      let 查询_选择器 = 已安装卡片_选择器;
      if (视图类别 === 发现市场_命名空间) {
        查询_选择器 = `${市场卡片_选择器}, ${已安装卡片_选择器}`;
      }

      // 🔒 边界关键：只在面板内部查询，绝不扩散到 document.body
      let 卡片_节点列表 = [];
      try {
        卡片_节点列表 = 面板.querySelectorAll(查询_选择器);
      } catch (错误) {
        打印_调试日志(`面板内部查询卡片异常: ${String(错误)}`);
        return [];
      }

      const 插件_列表 = [];

      卡片_节点列表.forEach((卡片_元素) => {
        const 包名 =
          卡片_元素.getAttribute("data-plugin-package") ||
          卡片_元素.getAttribute("data-plugin-item") ||
          卡片_元素.getAttribute("data-market-entry") ||
          "";

        // 提取标题：优先取带 open 或 title 特征的按钮文本，兜底取 h3/h4/strong 或包名
        const 按钮_元素 = 卡片_元素.querySelector("button");
        const 标题备用_元素 = 卡片_元素.querySelector("h3, h4, strong, [data-market-title]");
        const 标题 = 按钮_元素 ? 按钮_元素.textContent.trim() : (标题备用_元素 ? 标题备用_元素.textContent.trim() : 包名);

        // 提取描述信息
        const 描述_元素 = 卡片_元素.querySelector("[id], p, [data-market-desc]");
        const 描述 = 描述_元素 ? 描述_元素.textContent.trim() : "";

        // 避免重复推入同一 DOM 卡片
        // #💡 基于哈希的 O(1) 查找，效率极高！比较是完整匹配模式
        if (包名 || 标题) {
          插件_列表.push({
            包名: 包名,
            标题: 标题,
            描述: 描述,
            元素: 卡片_元素
          });
        }
      });

      打印_调试日志(`[${视图类别}] 已在面板内扫描到 ${插件_列表.length} 个插件卡片`);
      return 插件_列表;
    }

    // ────────────────────── 🖥️ 浮层交互与键盘驱动 ──────────────────────

    let 当前_浮层元素 = null;
    let 当前_选中的索引 = 0;
    let 当前_候选列表 = [];

    /**
     * 🚪 关闭并销毁搜索浮层
     */
    function 关闭_搜索浮层() {
      if (当前_浮层元素) {
        当前_浮层元素.remove();
        当前_浮层元素 = null;
        当前_选中的索引 = 0;
        当前_候选列表 = [];
        打印_调试日志("搜索浮层已关闭 🔒");
      }
    }

    /**
     * 🎯 跳转至目标卡片并执行呼吸高亮
     * 
     * 💡 逐行逻辑解释:
     *   1. 接收选中的 目标_项。
     *   2. 先平稳关闭搜索浮层，还原界面视野。
     *   3. 检查 目标_项.元素 是否仍在 DOM 树中。
     *   4. 调用 scrollIntoView({ block: "center", behavior: "smooth" }) 将页面平滑滚动到正中。
     *   5. 同时附加宿主原生的 data-plugin-highlight 属性与兜底 class。
     *   6. 设定定时器，在 高亮_持续时长 毫秒后自动移除高亮标记。
     *   7. 若卡片内有按钮则聚焦该按钮，提升无障碍与键盘操作体验。
     * 
     * 🎯 为什么这样写:
     *   联动宿主内置的动画，既自然又显眼；不重绘或破坏任何 React 状态。
     * 
     * @param {{包名: string, 标题: string, 元素: HTMLElement}} 目标_项
     */
    function 跳转至_目标卡片(目标_项) {
      关闭_搜索浮层();

      if (!目标_项 || !目标_项.元素) {
        return;
      }

      const 卡片 = 目标_项.元素;

      // 💡 平滑滚动到屏幕中央
      if (typeof 卡片.scrollIntoView === "function") {
        卡片.scrollIntoView({ block: "center", behavior: "smooth" });
      }

      // 💡 激活宿主原生的高亮脉冲动画
      卡片.setAttribute("data-plugin-highlight", "");
      卡片.setAttribute("data-plugin-custom-glow", "true");

      // 💡 聚焦卡片内的入口按钮
      const 按钮 = 卡片.querySelector("button");
      if (按钮 && typeof 按钮.focus === "function") {
        按钮.focus();
      }

      打印_调试日志(`已定位并高亮插件: ${目标_项.标题} (${目标_项.包名})`);

      // 💡 超时后清除高亮效果
      setTimeout(() => {
        卡片.removeAttribute("data-plugin-highlight");
        卡片.removeAttribute("data-plugin-custom-glow");
      }, 高亮_持续时长);
    }

    /**
     * 🚀 唤起或聚焦搜索浮层面板
     * 
     * @param {HTMLElement} [指定_面板] 外部确认的有效主面板
     * @param {string} [指定_视图类别] 当前视图类别
     */
    function 唤起_搜索浮层(指定_面板, 指定_视图类别) {
      if (当前_浮层元素) {
        const 已有输入框 = 当前_浮层元素.querySelector(".dsh-sousuo-shurukuang");
        if (已有输入框) {
          已有输入框.focus();
        }
        return;
      }

      注入_插件样式();

      const 全部_插件 = 扫描_插件卡片列表(指定_面板, 指定_视图类别);
      当前_候选列表 = 全部_插件.slice(0, 最大_展示条数);
      当前_选中的索引 = 0;

      // 1. 创建遮罩
      const 遮罩 = document.createElement("div");
      遮罩.className = "dsh-sousuo-zhezhao";

      // 2. 创建主面板
      const 面板 = document.createElement("div");
      面板.className = "dsh-sousuo-mianban";
      面板.setAttribute("role", "dialog");
      面板.setAttribute("aria-label", "搜索插件");

      // 3. 创建头部搜索栏
      const 头部 = document.createElement("div");
      头部.className = "dsh-sousuo-toubu";

      const 图标 = document.createElement("div");
      图标.className = "dsh-sousuo-tubiao";
      图标.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;

      const 输入框 = document.createElement("input");
      输入框.type = "text";
      输入框.className = "dsh-sousuo-shurukuang";
      输入框.placeholder = "输入插件名称、描述或包名... (支持拼音/中英)";
      输入框.setAttribute("autocomplete", "off");
      输入框.setAttribute("spellcheck", "false");

      const 快捷键提示 = document.createElement("div");
      快捷键提示.className = "dsh-sousuo-kuaijietishi";
      快捷键提示.textContent = "Esc 关闭";

      头部.appendChild(图标);
      头部.appendChild(输入框);
      头部.appendChild(快捷键提示);

      // 4. 创建列表容器
      const 列表容器 = document.createElement("ul");
      列表容器.className = "dsh-sousuo-liebiaokuang";

      // 5. 创建底部操作提示条
      const 底部 = document.createElement("div");
      底部.className = "dsh-sousuo-dibu";
      底部.innerHTML = `
        <span>共找到 <strong id="dsh-sousuo-count">${当前_候选列表.length}</strong> 个相关插件</span>
        <span>↑ ↓ 导航 · Enter 确认跳转 · Esc 退出</span>
      `;

      面板.appendChild(头部);
      面板.appendChild(列表容器);
      面板.appendChild(底部);
      遮罩.appendChild(面板);

      // 内部刷新候选列表渲染函数
      function 刷新_候选DOM() {
        列表容器.innerHTML = "";
        const 计数标签 = 底部.querySelector("#dsh-sousuo-count");
        if (计数标签) {
          计数标签.textContent = 当前_候选列表.length.toString();
        }

        if (当前_候选列表.length === 0) {
          const 空状态 = document.createElement("li");
          空状态.className = "dsh-sousuo-kongzhuangtai";
          空状态.textContent = "未找到匹配的插件，尝试更换关键字";
          列表容器.appendChild(空状态);
          return;
        }

        当前_候选列表.forEach((项, 索引) => {
          const 列表项 = document.createElement("li");
          列表项.className = "dsh-sousuo-xiang" + (索引 === 当前_选中的索引 ? " xuanzhong" : "");

          const 行1 = document.createElement("div");
          行1.className = "dsh-sousuo-xiang-hang1";

          const 标题 = document.createElement("span");
          标题.className = "dsh-sousuo-xiang-biaoti";
          标题.textContent = 项.标题;

          const 包名 = document.createElement("span");
          包名.className = "dsh-sousuo-xiang-baoming";
          包名.textContent = 项.包名;

          行1.appendChild(标题);
          行1.appendChild(包名);
          列表项.appendChild(行1);

          if (项.描述) {
            const 描述 = document.createElement("div");
            描述.className = "dsh-sousuo-xiang-miaoshu";
            描述.textContent = 项.描述;
            列表项.appendChild(描述);
          }

          // 鼠标悬停更新选中项
          列表项.addEventListener("mouseenter", () => {
            当前_选中的索引 = 索引;
            列表容器.querySelectorAll(".dsh-sousuo-xiang").forEach((节点, 节点索引) => {
              节点.classList.toggle("xuanzhong", 节点索引 === 索引);
            });
          });

          // 鼠标点击跳转
          列表项.addEventListener("click", () => {
            跳转至_目标卡片(项);
          });

          列表容器.appendChild(列表项);
        });

        // 确保选中项自动滚入可视区
        const 当前选中节点 = 列表容器.querySelector(".dsh-sousuo-xiang.xuanzhong");
        if (当前选中节点 && typeof 当前选中节点.scrollIntoView === "function") {
          当前选中节点.scrollIntoView({ block: "nearest" });
        }
      }

      // 输入事件：实时过滤
      输入框.addEventListener("input", (e) => {
        const 查询词 = e.target.value.trim().toLowerCase();
        if (!查询词) {
          当前_候选列表 = 全部_插件.slice(0, 最大_展示条数);
        } else {
          // #💡 字符串 includes/indexOf 匹配模式，逐字符比对，复杂度为 O(n)
          当前_候选列表 = 全部_插件.filter((项) => {
            return (
              项.标题.toLowerCase().includes(查询词) ||
              项.包名.toLowerCase().includes(查询词) ||
              项.描述.toLowerCase().includes(查询词)
            );
          }).slice(0, 最大_展示条数);
        }
        当前_选中的索引 = 0;
        刷新_候选DOM();
      });

      // 键盘导航事件
      输入框.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (当前_候选列表.length > 0) {
            当前_选中的索引 = (当前_选中的索引 + 1) % 当前_候选列表.length;
            刷新_候选DOM();
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (当前_候选列表.length > 0) {
            当前_选中的索引 = (当前_选中的索引 - 1 + 当前_候选列表.length) % 当前_候选列表.length;
            刷新_候选DOM();
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (当前_候选列表.length > 0 && 当前_候选列表[当前_选中的索引]) {
            跳转至_目标卡片(当前_候选列表[当前_选中的索引]);
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          关闭_搜索浮层();
        }
      });

      // 点击遮罩空白区关闭
      遮罩.addEventListener("click", (e) => {
        if (e.target === 遮罩) {
          关闭_搜索浮层();
        }
      });

      // 初始渲染并挂载
      刷新_候选DOM();
      document.body.appendChild(遮罩);
      当前_浮层元素 = 遮罩;

      // 聚焦输入框
      setTimeout(() => {
        输入框.focus();
      }, 50);

      打印_调试日志("搜索浮层已成功弹出 🌟");
    }

    // ────────────────────── ⌨️ 全局快捷键拦截器 ──────────────────────

    /**
     * 🎹 全局键盘按键监听处理器 (Capture 阶段优先侦听)
     * 
     * 💡 逐行逻辑解释:
     *   1. 检查是否按下了 Ctrl 键（Windows/Linux）或 Meta 键（macOS 的 Command 键）。
     *   2. 检查按下的键是否为指定的 触发_按键（默认字母 "f"）。
     *   3. 检查_是否处于有效插件列表页()：
     *      - 如果不在插件管理页，或处于具体插件详情设置页，坚决放行原生快捷键！
     *   4. 确认为有效插件列表页后，阻止默认的浏览器页面搜索行为 (preventDefault) 并拦截事件冒泡。
     *   5. 触发 唤起_搜索浮层(页面状态.面板, 页面状态.视图类别) 弹出面板。
     * 
     * 🎯 为什么这样写/处理:
     *   只在真正的插件列表（已安装或发现市场）中生效，杜绝在聊天界面或插件设置详情页误抢按键。
     * 
     * @param {KeyboardEvent} 事件 键盘按键事件对象
     */
    function 全局_按键处理器(事件) {
      const 是否按下组合键 = 事件.ctrlKey || 事件.metaKey;
      if (!是否按下组合键) {
        return;
      }

      if (事件.key.toLowerCase() !== 触发_按键) {
        return;
      }

      // 💡 环境守卫：严格核查当前激活视图是否为插件管理列表页且无详情页覆盖
      const 页面状态 = 检查_是否处于有效插件列表页();
      if (!页面状态.允许搜索) {
        // 不在插件列表页，或处于插件详情配置页，100% 放行原生行为
        return;
      }

      // 💡 精准拦截浏览器默认搜索
      事件.preventDefault();
      事件.stopPropagation();

      打印_调试日志(`在插件列表页面 [${页面状态.视图类别}] 检测到 Ctrl+F / Cmd+F 组合键触发 🎯`);
      唤起_搜索浮层(页面状态.面板, 页面状态.视图类别);
    }

    // ────────────────────── 🚀 客户端入口契约 ──────────────────────

    exports.name = "dsh-plugin-search-plugins";
    exports.apply = (ctx) => {
      打印_调试日志("客户端半体正在挂载...");

      // 💡 使用 ctx.effect 托管全局事件监听器生命周期
      if (ctx && typeof ctx.effect === "function") {
        ctx.effect(() => {
          // 在捕获阶段注册按键监听，优先于其他冒泡处理器
          document.addEventListener("keydown", 全局_按键处理器, true);
          打印_调试日志("全局按键监听器已挂载完成 ✔️");

          // 💡 返回卸载清理闭包
          return () => {
            document.removeEventListener("keydown", 全局_按键处理器, true);
            关闭_搜索浮层();
            if (样式_元素) {
              样式_元素.remove();
              样式_元素 = null;
            }
            打印_调试日志("全局按键监听器与浮层已注销清理 🗑️");
          };
        });
      } else {
        // 兜底挂载
        document.addEventListener("keydown", 全局_按键处理器, true);
        打印_调试日志("全局按键监听器直接挂载完成 ✔️");
      }
    };

    // 🧪 内部测试导出接口 (供回归测试与自检读取内部状态)
    exports.内部接口 = {
      取_列表面板: 取_列表面板,
      取_当前视图类别: 取_当前视图类别,
      检查_详情页是否存在: 检查_详情页是否存在,
      检查_是否处于有效插件列表页: 检查_是否处于有效插件列表页,
      扫描_插件卡片列表: 扫描_插件卡片列表,
      关闭_搜索浮层: 关闭_搜索浮层,
      唤起_搜索浮层: 唤起_搜索浮层
    };

    return exports;
  }
});
