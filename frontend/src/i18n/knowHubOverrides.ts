/**
 * 产品模式 i18n 品牌文案覆盖
 *
 * 在产品模式下把 WeKnora 原生文案覆盖为「AI聊吧」品牌文案。
 * 集中维护，避免在组件里硬编码品牌名；非产品模式继续使用 WeKnora 原生文案。
 */

import { isKnowHubProductMode } from '@/product/knowHub'

type NestedMessages = Record<string, any>

/**
 * 递归合并对象，深度覆盖
 */
function deepMerge(target: NestedMessages, source: NestedMessages): NestedMessages {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {}
      }
      deepMerge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
  return target
}

/**
 * 产品模式品牌文案覆盖
 */
const PRODUCT_OVERRIDES: Record<string, NestedMessages> = {
  'zh-CN': {
    common: {
      welcome: '欢迎使用 AI聊吧',
    },
    initialization: {
      welcome: '欢迎使用 AI聊吧',
    },
    login: {
      firstTime: '首次使用 AI聊吧？',
    },
    tenant: {
      firstTime: '首次使用 AI聊吧？',
    },
    knowledge: {
      empty: {
        title: '开始使用 AI聊吧',
        desc: '上传您的第一个知识库，让团队知识触手可及',
      },
    },
    menu: {
      welcome: '欢迎使用 AI聊吧',
    },
    createChat: {
      title: 'Hi，我是 AI聊吧，让你的知识触手可及',
    },
    guide: {
      steps: {
        welcome: {
          title: '欢迎使用 AI聊吧',
        },
        knowledge: {
          desc: '知识库是一切的起点：上传文档、网页或 FAQ，AI聊吧 会自动解析并建立索引。点击这里进入知识库。',
        },
      },
    },
    system: {
      versionDescription: '当前应用服务的版本号',
      frontendVersionDescription: '当前 UI 界面的构建版本号',
    },
  },
  'en-US': {
    common: {
      welcome: 'Welcome to AI聊吧',
    },
    initialization: {
      welcome: 'Welcome to AI聊吧',
    },
    login: {
      firstTime: 'First time using AI聊吧?',
    },
    tenant: {
      firstTime: 'First time using AI聊吧?',
    },
    knowledge: {
      empty: {
        title: 'Get Started with AI聊吧',
        desc: 'Upload your first knowledge base to make team knowledge accessible',
      },
    },
    menu: {
      welcome: 'Welcome to AI聊吧',
    },
    createChat: {
      title: 'Hi, I am AI聊吧, making knowledge accessible',
    },
    guide: {
      steps: {
        welcome: {
          title: 'Welcome to AI聊吧',
        },
        knowledge: {
          desc: 'A knowledge base is the starting point: upload documents, web pages, or FAQs, and AI聊吧 will parse and index them automatically. Click here to enter the knowledge base.',
        },
      },
    },
    system: {
      versionDescription: 'Current application service version',
      frontendVersionDescription: 'Current UI interface build version',
    },
  },
  // 韩语和俄语暂不提供产品模式覆盖，使用 WeKnora 原生文案
}

/**
 * 应用产品模式品牌文案覆盖
 */
export function applyKnowHubOverrides(messages: Record<string, NestedMessages>): Record<string, NestedMessages> {
  if (!isKnowHubProductMode()) {
    return messages
  }

  const result = { ...messages }

  for (const locale in PRODUCT_OVERRIDES) {
    if (result[locale]) {
      result[locale] = deepMerge({ ...result[locale] }, PRODUCT_OVERRIDES[locale])
    }
  }

  return result
}
