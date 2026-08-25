---
name: compressed-pdf
description: >-
  Compress PDF files to a target size (default 4.2MB) by recompressing embedded
  images with PyMuPDF, preserving the original. Use when the user asks to
  compress a PDF, reduce PDF size, shrink PDF under N MB, or mentions
  compressed-pdf.
---

# compressed-pdf

将 PDF 压到指定体积上限以内；默认 **不覆盖原文件**。

## 何时执行

用户提到压缩 PDF、缩小 PDF、压到 N MB 以内，或显式说 `compressed-pdf` 时，**先读本 Skill，再跑脚本**，不要手写临时脚本。

## 依赖

```bash
pip install pymupdf
```

若未安装，先安装再压缩。

## 一键压缩

在仓库或任意目录执行（路径用引号，支持中文文件名）：

```bash
python ~/.cursor/skills/compressed-pdf/scripts/compress-pdf.py "<input.pdf>" [--max-mb 4.2] [--out "<output.pdf>"] [--overwrite]
```

Windows 示例：

```bash
python "%USERPROFILE%\.cursor\skills\compressed-pdf\scripts\compress-pdf.py" "C:\path\to\file.pdf" --max-mb 4.2
```

| 参数 | 默认 | 说明 |
|------|------|------|
| `input` | （必填） | 源 PDF 路径 |
| `--max-mb` | `4.2` | 目标上限（MB） |
| `--out` | `<stem>_compressed.pdf` | 输出路径（同目录） |
| `--overwrite` | off | 覆盖原文件（谨慎） |

## Agent 流程

1. 确认输入路径存在，记录原始体积
2. 运行 `compress-pdf.py`（按用户指定的 `--max-mb`；未指定则 4.2）
3. 若脚本 exit ≠ 0 或仍超限：按 stderr 提示告知用户（可能已是纯矢量/已高度压缩）
4. 用中文简要回复：原体积 / 新体积 / 输出路径；**不要**默认覆盖原文件

## 策略（脚本内置）

1. 优先对页面内嵌图像做 JPEG 重编码；质量从高到低尝试（95→…→35），必要时缩小最长边
2. `garbage=4` + `deflate` + `clean` 保存
3. 在 ≤ `--max-mb` 的前提下选**最高**可用质量
4. 源文件已 ≤ 目标：复制/写出到输出路径并提示无需压缩

## 禁止

- 未征得同意就 `--overwrite` 覆盖原件
- 跳过脚本、用无关工具随意栅格化整页（除非脚本失败且用户要求兜底）
- 提交或泄露用户 PDF 中的隐私内容到 git / 远端
