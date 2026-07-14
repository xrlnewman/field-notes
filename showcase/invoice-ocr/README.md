# Invoice OCR

发票/银行流水 OCR 识别工具，Electron 桌面应用。

## 实现

基于 [tesseract.js](https://tesseract.projectnaptha.com/) + 中文简体（chi_sim）+ 英文（eng）训练数据。

## 功能

- 批量导入发票/流水图片（JPG/PNG/PDF 截图）
- OCR 识别全文
- 用正则规则提取关键字段：金额、日期、发票号、抬头、税号
- 按规则归类（如：交通、餐饮、办公）
- 导出 Excel 汇总

## 限制

- 识别效果受字体、清晰度和版面影响，**手写字、低清晰度、复杂版面必须人工核对**
- 首次运行需下载 chi_sim 训练数据
- 增值税电子普票通常识别效果好；专票/复杂版面建议人工核对
- 完整发票识别（票面所有字段）建议用商业 API（百度 OCR / 阿里 OCR）

## 用法

1. 添加图片
2. 选 OCR 语言（默认 `chi_sim+eng`）
3. 点"开始识别"，等进度条
4. 看结果表格，必要时调整规则
5. 导出 Excel

## 开发

```bash
npm install
npm start
```

MIT © xrlnewman
