// FP17: the shell's own texts in every enabled language (the check compares the keys). Errors are shown by reason.
export const messages = {
  "zh-CN": {
    shell: { services: "服务", search: "搜索服务与菜单", favorites: "收藏", recent: "最近访问", palette: "命令面板",
      logout: "退出登录", loggedOut: "你已退出登录", loginAgain: "重新登录", home: "首页", noServices: "没有可用的服务",
      retryTitle: "暂时无法确认，请稍后重试", retry: "重试", reload: "系统已更新，刷新页面以使用新版本",
      reloadNow: "刷新", theme: "外观", light: "亮色", dark: "暗色", system: "跟随系统", density: "密度",
      comfortable: "标准", compact: "紧凑", language: "语言", stale: "权限信息可能不是最新的", close: "关闭",
      unsaved: "有未保存的内容，确定关闭吗？" },
    // the service selector's groups (FP10): the page modules' domains
    domains: { favorites: "收藏", work: "协同", master: "主数据", supply: "采购与库存", trade: "销售" },
    error: { notFound: "找不到，或者你没有权限查看", denied: "你没有权限做这件事", invalid: "有字段需要修改",
      retry: "暂时无法确认，请稍后重试", unconfirmed: "处理中，结果未确认", ask: "查询结果", inProgress: "处理中",
      upgrade: "这个功能需要后端升级", defect: "操作未完成（{reason}）", refused: "操作未完成（{reason}）",
      unknown: "操作未完成（{reason}）", masked: "无权查看", partial: "数据可能不完整，截至 {at}" },
  },
  "en-US": {
    shell: { services: "Services", search: "Search services and menus", favorites: "Favorites", recent: "Recent",
      palette: "Command palette", logout: "Log out", loggedOut: "You have logged out", loginAgain: "Log in again",
      home: "Home", noServices: "No services available", retryTitle: "Cannot confirm right now, try again", retry: "Retry",
      reload: "A new version is available: reload the page to use it", reloadNow: "Reload", theme: "Appearance",
      light: "Light", dark: "Dark", system: "System", density: "Density", comfortable: "Comfortable", compact: "Compact",
      language: "Language", stale: "Your permissions may be out of date", close: "Close",
      unsaved: "There are unsaved changes. Close anyway?" },
    domains: { favorites: "Favorites", work: "Work", master: "Master data", supply: "Supply", trade: "Sales" },
    error: { notFound: "Not found, or not yours to see", denied: "You may not do this", invalid: "Some fields need changes",
      retry: "Cannot confirm right now, try again", unconfirmed: "Processing, the result is not confirmed",
      ask: "Ask for the result", inProgress: "Processing", upgrade: "This needs a newer backend",
      defect: "Not done ({reason})", refused: "Not done ({reason})", unknown: "Not done ({reason})",
      masked: "Not yours to see", partial: "The data may be incomplete, as of {at}" },
  },
};
