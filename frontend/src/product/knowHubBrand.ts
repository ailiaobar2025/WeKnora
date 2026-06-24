/**
 * Know Hub 产品模式品牌配置
 *
 * 集中管理产品模式下的品牌元素，包括产品名称、Logo、文案和空状态说明。
 * 非产品模式继续使用 WeKnora 原生品牌配置。
 */

import { isKnowHubProductMode } from './knowHub'

export interface BrandConfig {
  productName: string
  companyName: string
  title: string
  description: string
  keywords: string
  welcomeTitle: string
  welcomeDesc: string
  emptyStateTitle: string
  emptyStateDesc: string
  faviconPath: string
  logoPath: string
}

const WEKNORA_BRAND: BrandConfig = {
  productName: 'WeKnora',
  companyName: 'WeKnora',
  title: 'WeKnora',
  description: 'WeKnora是一款基于大语言模型的文档理解与语义检索框架，专为结构复杂、内容异构的文档场景而打造。',
  keywords: '知识问答、微信对话开放平台、对话开放平台、对话平台、人工智能定制、人机对话、智能问答、人机交互、自然语言处理、自然语言理解、NLP、人工智能产品、人工智能开源、人工智能算法、语音助手',
  welcomeTitle: '欢迎使用 WeKnora',
  welcomeDesc: '知识库是一切的起点：上传文档、网页或 FAQ，WeKnora 会自动解析并建立索引。点击这里进入知识库。',
  emptyStateTitle: '开始使用 WeKnora',
  emptyStateDesc: '上传您的第一个知识库，开始智能问答之旅',
  faviconPath: '/favicon.ico',
  logoPath: '/favicon.ico',
}

const KNOW_HUB_BRAND: BrandConfig = {
  productName: 'AI聊吧',
  companyName: 'AI聊吧',
  title: 'AI聊吧',
  description: 'AI聊吧是面向团队和企业的知识资产化与场景助手平台，帮助组织将资料转化为可行动的知识。',
  keywords: 'AI聊吧、知识管理、企业助手、销售助手、制度问答、知识资产化、智能问答、企业AI、知识库、团队协作',
  welcomeTitle: '欢迎使用 AI聊吧',
  welcomeDesc: '知识库是一切的起点：上传文档、网页或 FAQ，AI聊吧 会自动解析并建立索引。点击这里进入知识库。',
  emptyStateTitle: '开始使用 AI聊吧',
  emptyStateDesc: '上传您的第一个知识库，让团队知识触手可及',
  faviconPath: '/icon128.png',
  logoPath: '/icon128.png',
}

export function getBrandConfig(): BrandConfig {
  return isKnowHubProductMode() ? KNOW_HUB_BRAND : WEKNORA_BRAND
}

export function getProductName(): string {
  return getBrandConfig().productName
}

export function getCompanyName(): string {
  return getBrandConfig().companyName
}

/**
 * 获取页面标题配置，用于动态设置 HTML head
 */
export function getPageTitle(): string {
  return getBrandConfig().title
}

export function getPageDescription(): string {
  return getBrandConfig().description
}

export function getPageKeywords(): string {
  return getBrandConfig().keywords
}

/**
 * 获取欢迎页和空状态文案
 */
export function getWelcomeTitle(): string {
  return getBrandConfig().welcomeTitle
}

export function getWelcomeDesc(): string {
  return getBrandConfig().welcomeDesc
}

export function getEmptyStateTitle(): string {
  return getBrandConfig().emptyStateTitle
}

export function getEmptyStateDesc(): string {
  return getBrandConfig().emptyStateDesc
}

/**
 * 获取品牌资源路径
 */
export function getFaviconPath(): string {
  return getBrandConfig().faviconPath
}

export function getLogoPath(): string {
  return getBrandConfig().logoPath
}
