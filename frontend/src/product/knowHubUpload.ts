export const KNOW_HUB_PPT_UNSUPPORTED_MESSAGE =
  '当前版本暂不支持 PPT/PPTX，请转换为 PDF、Word、Excel/CSV、Markdown 或 Txt 后上传'

const KNOW_HUB_BLOCKED_UPLOAD_EXTENSIONS = new Set(['ppt', 'pptx'])

export function isKnowHubUploadFileTypeAllowed(filenameOrExtension: string): boolean {
  const normalized = filenameOrExtension.toLowerCase()
  const extension = normalized.includes('.')
    ? normalized.substring(normalized.lastIndexOf('.') + 1)
    : normalized.replace(/^\./, '')
  return !KNOW_HUB_BLOCKED_UPLOAD_EXTENSIONS.has(extension)
}

export function filterKnowHubUploadFileTypes(fileTypes: Iterable<string>): string[] {
  return [...fileTypes].filter(isKnowHubUploadFileTypeAllowed)
}
