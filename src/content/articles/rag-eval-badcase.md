---
title: RAG 评估与 Bad Case 自动化治理
description: 用 LLM-as-a-Judge 自动打分、决策树自动归因、Golden Dataset 做 CI 回归，把每天几千条"答非所问"的日志变成可治理的流水线。
category: Agent 架构
publishedAt: 2026-07-23
tags: [RAG, 评估, LLM-as-a-Judge, Golden Dataset, CI]
featured: false
draft: false
---

RAG 上线后最典型的困境：用户反馈"答非所问"，但每天几千条日志人工看不过来，就算看了也说不清是检索没召回、生成答错、还是切分坏了。凭感觉改 prompt、换 embedding，改完不知道好没好，下次又坏在别处。要走出这个循环，得把评估和治理做成自动化 pipeline——机器打分、机器归因、金标集卡门禁。

## LLM-as-a-Judge：三维打分带 rubric

先让一个强模型（judge）给每条线上回答打分。关键是别只打一个模糊的"满意度"，要拆成正交的三维，每维给明确 rubric 和证据，否则分数不可复现：

| 维度 | 含义 | rubric（1-5） |
|---|---|---|
| 准确性 accuracy | 答案是否正确回应了问题 | 5=完全正确且完整；3=部分正确/漏关键点；1=错误或偏题 |
| 引用度 faithfulness | 答案每句是否被召回片段支撑 | 5=全部有据；3=部分句子无据；1=编造/与证据矛盾 |
| 安全性 safety | 是否越权、泄敏、给危险指导 | 5=合规；1=违规 |

引用度是最容易被忽略但最要命的一维。它不看答案"对不对"，只看答案"有没有出处"——把回答拆成若干原子 claim，逐条判断是否被 context 蕴含（entailment）。judge 的 prompt 要强制它先抽 claim、再逐条标注 supported/unsupported，最后按比例算分：

~~~text
faithfulness = 被 context 支撑的 claim 数 / 总 claim 数
~~~

一条答案哪怕结论碰巧对，只要 claim 无出处，就是幻觉，必须扣分。judge 用结构化输出（JSON: {score, evidence_span, reason}），reason 里必须引原文 span，方便后续人工抽检。judge 本身也会错，所以要定期用人工标注反校准 judge，算 judge 和人的一致性（Cohen's kappa），低了就换模型或改 rubric。

## Bad Case 自动归因：一棵决策树

打完分，低分的就是 bad case。光知道"这条差"没用，得自动定位是哪一环坏了。归因的核心信号只有两个：**召回片段里有没有标准证据**、**答案和召回片段一不一致**。据此走决策树：

~~~text
Bad case
   │
   ▼
召回片段里含标准答案的证据？
   ├── 否 ──► 检索问题域
   │          │
   │          ├─ 证据在库但没被召回 ──► 检索/embedding 问题
   │          │     └─ 证据被切碎、跨了 chunk 边界？──► 切分问题
   │          └─ 证据根本不在库 ──────────► 知识缺口（补数据）
   │
   └── 是 ──► 生成问题域（召回了但没用好）
              ├─ 答案与证据矛盾 ─────────► 幻觉 / faithfulness 低
              └─ 答案偏题、没答到点 ─────► answer relevance / prompt 问题
~~~

三类问题各有自动判据：

- **检索问题**：拿这条 query 的标准证据 chunk_id，去看实际召回的 Top-K 里在不在。不在→没召回。这一步能批量跑，不需要人。
- **切分问题**：如果标准证据的原文横跨了两个 chunk（比如"排查步骤第 3 步"被切到了下一个 chunk 开头），单个 chunk 语义不完整，向量召回自然打不高分。判据是把证据原文和 chunk 边界做 offset 比对，命中率异常低但证据确实在库的，归到切分。这类 case 会随 chunk_size 变化而集中出现，是调 chunk 策略的信号。
- **生成问题**：召回里有证据，但答案和证据对不上。faithfulness 低就是幻觉，answer relevance 低就是偏题（prompt 没约束好、或上下文太长被模型忽略中间段）。

这套归因把"答非所问"从一个笼统抱怨，拆成了可以分派给不同人的具体工单：检索问题给检索工程师、切分问题调 pipeline、生成问题改 prompt。

## 离线评估指标

有了归因，就能算聚合指标，量化每一环的健康度：

| 指标 | 衡量什么 | 归属环节 |
|---|---|---|
| Hit Rate@K | Top-K 里命中标准证据的比例 | 检索 |
| MRR | 第一个相关片段排名的倒数均值 | 检索排序 |
| Faithfulness | 答案被 context 支撑的比例 | 生成 |
| Answer Relevance | 答案与问题的相关度 | 生成 |

~~~text
Hit Rate@K = 命中标准证据的 query 数 / 总 query 数
MRR        = mean( 1 / rank_of_first_relevant )
~~~

这四个指标要分意图分层统计。整体 Hit Rate 0.9 可能掩盖"多跳问题只有 0.5"的塌方，分层才看得见结构性问题。

## Golden Dataset：线上回流 + 人工标注

自动化治理的地基是金标集。它不是一次性造的，是持续攒的：

1. **线上 bad case 回流**：judge 打的低分样本，脱敏后进待标注池——这些是真实分布里最疼的点，比人工凭空编的样本值钱得多。
2. **人工标注**：每条标准样本记录 query、期望答案、**必需证据的 chunk_id**、允许/禁止引用范围、是否该拒答。有了 chunk_id，Hit Rate 和归因才能自动算。
3. **分层覆盖**：单跳、多跳、无答案（该拒答）、冲突版本、权限过滤、长文档，按业务意图配比，别全堆简单问题。规模上先攒到 200-500 条能覆盖主要意图，再持续扩。

金标集要版本化、和代码一起进仓库，每次线上发现新型 bad case 就补一条，让它跟着业务演进。

## CI/CD 回归：分数跌破阈值卡发布

最后把金标集接进 CI。任何改 prompt、改切分、换 embedding、调 Top-K 的 PR，都在金标集上重跑一遍，算出上面四个指标，和 baseline 对比：

~~~text
on: pull_request
  1. 起隔离环境，加载本 PR 的 index/prompt/切分配置
  2. 对 golden set 每条 query 跑完整 RAG
  3. 算 Hit Rate@K / MRR / Faithfulness / Answer Relevance（judge 自动打分）
  4. 对比 baseline：
       Faithfulness < 0.85            → 阻断
       任一指标较 baseline 跌 > 3%    → 阻断
       分层指标（多跳等）塌方         → 阻断
  5. 输出 diff 报告：哪些 case 从 pass 变 fail
~~~

关键是**卡门禁**：分数跌破绝对阈值或相对回归超限，直接 fail，PR 合不进去。这把"改完不知道好没好"变成"改坏了当场拦下"。同时保留旧 index/prompt 版本，允许灰度和按需回滚。judge 打分有波动，阈值别卡太死，且同一版 judge 要固定，换 judge 要重跑 baseline，否则分数不可比。

## 边界

judge 不是真值，它有偏好偏差（偏爱长答案、偏爱自己家模型风格），必须用人工标注定期校准，关键发布仍需人复核。归因决策树依赖"标准证据 chunk_id"，没有金标集就无从自动归因，所以金标集是前提不是可选项。CI 每次全量跑金标集有成本，几百条 query × judge 调用，要控规模、加缓存、只在关键路径 PR 上跑。指标好看不等于用户满意，离线金标永远追不上线上真实分布，线上回流这条闭环不能停。

参考资料：[Ragas 评估框架文档](https://docs.ragas.io/)、[Anthropic: Building effective agents](https://www.anthropic.com/research/building-effective-agents)、[OpenAI Evals](https://github.com/openai/evals)。
