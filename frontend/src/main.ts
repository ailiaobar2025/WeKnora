import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/fonts.css";
import TDesign from "tdesign-vue-next";
// 引入组件库的少量全局样式变量
import "tdesign-vue-next/es/style/index.css";
import "@/assets/theme/theme.css";
import "@/assets/dropdown-menu.less";
import "@/components/css/chat-hljs-dark.less";
// vue-virtual-scroller ships its own tiny stylesheet — required for
// RecycleScroller/DynamicScroller to size their viewport correctly.
// Without it the scroller computes 0 height and renders no items.
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import i18n from "./i18n";
import { initTheme } from "@/composables/useTheme";
import { initFont } from "@/composables/useFont";
import { installTDesignIconOfflineGuard } from "@/utils/tdesign-icon-offline";
import { getPageTitle, getPageDescription, getPageKeywords, getFaviconPath } from "@/product/knowHubBrand";
import { installAutofillGuard } from "@/utils/disable-autofill";

// 必须在 Vue 组件挂载之前执行，避免 tdesign-icons 运行时请求 tdesign.gtimg.com
installTDesignIconOfflineGuard();

// 设置产品模式品牌配置
const applyBrandConfig = () => {
  const title = getPageTitle();
  const description = getPageDescription();
  const keywords = getPageKeywords();
  const faviconPath = getFaviconPath();

  document.title = title;

  const metaDescription = document.getElementById('meta-description');
  const metaKeywords = document.getElementById('meta-keywords');

  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
  if (metaKeywords) {
    metaKeywords.setAttribute('content', keywords);
  }

  // 更新 favicon
  let faviconLink = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement;
  if (!faviconLink) {
    faviconLink = document.createElement("link");
    faviconLink.rel = "shortcut icon";
    document.head.appendChild(faviconLink);
  }
  faviconLink.href = faviconPath;

  // 更新 apple-touch-icon
  let appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
  if (!appleTouchIcon) {
    appleTouchIcon = document.createElement("link");
    appleTouchIcon.rel = "apple-touch-icon";
    document.head.appendChild(appleTouchIcon);
  }
  appleTouchIcon.href = faviconPath;
};

initTheme();
initFont();
applyBrandConfig();

const app = createApp(App);

app.use(TDesign);
app.use(createPinia());
app.use(router);
app.use(i18n);

// 等首屏路由（含导航守卫、Lite 自动登录）完成后再挂载，避免先闪默认页再跳转
router.isReady().finally(() => {
  app.mount("#app");
  installAutofillGuard();
});
