<template>
  <div class="trial-report-page">
    <div class="trial-report-card">
      <p class="eyebrow">Know Hub</p>
      <h1>试用报告</h1>
      <p class="description">
        这里将展示当前账号授权范围内的资料、问答、引用质量、额度消耗、反馈和试用结论。
      </p>
      <div class="placeholder">
        <p>业务报告接口接入后，该页面会按登录身份展示不同范围：</p>
        <ul>
          <li>客户登录：仅查看当前空间 / tenant 的试用报告。</li>
          <li>管理员登录：查看全部授权客户、业务空间、额度、反馈和审计汇总。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trial-report-page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 32px;
  background: #f7f8fa;
}

.trial-report-card {
  max-width: 960px;
  padding: 32px;
  border: 1px solid #e7e7e7;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 10px 30px rgb(0 0 0 / 4%);
}

.eyebrow {
  margin: 0 0 8px;
  color: #00a870;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #1f2329;
  font-size: 28px;
  line-height: 1.3;
}

.description {
  max-width: 720px;
  margin: 16px 0 0;
  color: #4e5969;
  font-size: 15px;
  line-height: 1.8;
}

.placeholder {
  margin-top: 28px;
  padding: 20px;
  border-radius: 12px;
  background: #f2f3f5;
  color: #4e5969;
  line-height: 1.8;
}

.placeholder p {
  margin: 0 0 8px;
}

.placeholder ul {
  margin: 0;
  padding-left: 20px;
}
</style>
