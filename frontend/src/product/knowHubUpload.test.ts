import assert from 'node:assert/strict'
import test from 'node:test'

import {
  filterKnowHubUploadFileTypes,
  isKnowHubUploadFileTypeAllowed,
  KNOW_HUB_PPT_UNSUPPORTED_MESSAGE,
} from './knowHubUpload.ts'

test('Know Hub product mode excludes PPT and PPTX uploads', () => {
  assert.equal(isKnowHubUploadFileTypeAllowed('deck.ppt'), false)
  assert.equal(isKnowHubUploadFileTypeAllowed('.PPTX'), false)
  assert.equal(isKnowHubUploadFileTypeAllowed('report.pdf'), true)
  assert.deepEqual(
    filterKnowHubUploadFileTypes(['pdf', 'ppt', 'docx', 'pptx']),
    ['pdf', 'docx'],
  )
})

test('Know Hub PPT rejection message matches the backend contract', () => {
  assert.equal(
    KNOW_HUB_PPT_UNSUPPORTED_MESSAGE,
    '当前版本暂不支持 PPT/PPTX，请转换为 PDF、Word、Excel/CSV、Markdown 或 Txt 后上传',
  )
})
