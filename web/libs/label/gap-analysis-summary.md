# Gap Analysis: Label Component vs Aviation Component

## Summary Statistics

| Status | Count | Percentage |
|--------|-------|------------|
| **COVERED** | 61 | 50% |
| **DIFFERENT** | 14 | 11% |
| **GAP** | 19 | 16% |
| **NOT_IN_AVIATION** | 11 | 9% |

**Total Labels Analyzed:** 105

---

## Status Definitions

- **COVERED**: Label exists in aviation i18n with same or equivalent translation
- **DIFFERENT**: Label exists but with different wording (minor variation)
- **GAP**: Label missing from aviation - needs to be added
- **NOT_IN_AVIATION**: Navigation/app-level labels outside aviation scope

---

## GAP Items (Missing from Aviation - 19 items)

These labels need to be added to aviation i18n:

| Label Component | Chinese Label | English | Type |
|-----------------|---------------|---------|------|
| DocumentAnalysis.js | Excel文件为空或格式不正确 | Excel file is empty or incorrect format | Error Message |
| DocumentAnalysis.js | Excel文件解析失败请检查文件格式 | Excel file parsing failed | Error Message |
| DocumentAnalysis.js | 请先上传Excel文件 | Please upload Excel file first | Warning |
| DocumentAnalysis.js | 请上传Excel文件开始标注 | Upload Excel file to start | Placeholder |
| DocumentAnalysis.js | 支持.xlsx格式文件 | Supports .xlsx format files | Hint |
| BasicInfoModule.js | 未知单位 | Unknown Unit | Default Value |
| BasicInfoModule.js | 事件详细描述... | Detailed event description... | Placeholder |
| BasicInfoModule.js | 选择机型 | Select Aircraft Type | Placeholder |
| BasicInfoModule.js | 起飞 | Takeoff | Placeholder |
| BasicInfoModule.js | 落地 | Landing | Placeholder |
| BasicInfoModule.js | 备降 | Alternate Landing | Placeholder |
| ResultPerformanceList.js | 选择事件类型 | Select Event Type | Placeholder |
| ResultPerformanceList.js | 选择飞行阶段 | Select Flight Phase | Placeholder |
| ResultPerformanceList.js | 输入设想训练方案 | Enter proposed training plan | Placeholder |
| ResultPerformanceList.js | 输入所需达到的目标 | Enter required goal | Placeholder |
| LabelingList.js | 未命名 | Unnamed | Default Value |
| LabelingList.js | 请选择关联的结果绩效 | Select associated result performance | Placeholder |

---

## DIFFERENT Items (Minor Wording Variations - 14 items)

These labels exist but have different wording:

| Label Component | Label Chinese | Aviation Chinese | Notes |
|-----------------|---------------|------------------|-------|
| DocumentAnalysis.js | 标注已保存到内存 | 保存成功 | Aviation is more generic |
| DocumentAnalysis.js | 上一条 | 上一事件 | Aviation specifies "event" |
| DocumentAnalysis.js | 下一条 | 下一事件 | Aviation specifies "event" |
| DocumentAnalysis.js | 保存标注 | 保存 | Aviation is more generic |
| ResultPerformanceList.js | 结果绩效模块 | 结果绩效 | Aviation omits "模块" |
| ResultPerformanceList.js | 添加结果 | + 添加 | Aviation uses "+" prefix |
| ResultPerformanceList.js | 暂无结果绩效请点击右上角添加 | 暂无结果，点击添加创建 | Different phrasing |
| ResultPerformanceList.js | 自动汇总区域 | 自动汇总 | Aviation omits "区域" |
| LabelingList.js | 标签标注模块 | 标签标注 | Aviation omits "模块" |
| LabelingList.js | 暂无标注请点击右上角添加 | 暂无标注，点击添加创建 | Different phrasing |
| ThreatModule.js | 可补充该威胁的描述 | 可补充描述 | Aviation is more generic |
| ErrorModule.js | 可补充该差错的描述 | 可补充描述 | Aviation is more generic |
| UASModule.js | 根据相关性当前不需要填写UAS识别 | 根据相关性判断，无需填写UAS | Slightly different |
| TrainingTopicModule.js | 自动带入 | 自动填充 | Different term |

---

## Aviation-Only Labels (In aviation but not in label component)

These labels exist in aviation i18n but not in the label component:

| i18n Key | Chinese | English |
|----------|---------|---------|
| aviation.status.draft | 草稿 | Draft |
| aviation.status.submitted | 已提交 | Submitted |
| aviation.status.approved | 已审核 | Approved |
| aviation.status.rejected | 已拒绝 | Rejected |
| aviation.common.cancel | 取消 | Cancel |
| aviation.common.delete | 删除 | Delete |
| aviation.common.edit | 编辑 | Edit |
| aviation.common.close | 关闭 | Close |
| aviation.common.confirm | 确认 | Confirm |
| aviation.common.loading | 加载中... | Loading... |
| aviation.common.error | 错误 | Error |
| aviation.common.success | 成功 | Success |
| aviation.common.warning | 警告 | Warning |
| aviation.toolbar.save_status.idle | 就绪 | Ready |
| aviation.toolbar.save_status.saving | 保存中... | Saving... |
| aviation.toolbar.save_status.saved | 已保存 | Saved |
| aviation.toolbar.save_status.error | 保存失败 | Save failed |
| aviation.confirm.delete_title | 确认删除 | Confirm Delete |
| aviation.confirm.delete_message | 确定要删除此项吗？此操作无法撤销。 | Delete confirmation |
| aviation.confirm.submit_title | 提交审核 | Submit for Review |
| aviation.confirm.submit_message | 确定要提交此标注进行审核吗？ | Submit confirmation |
| aviation.training_topics.no_topics | 暂无训练主题 | No training topics |
| aviation.training_topics.count | {{count}} 个主题 | {{count}} topics |

---

## Hardcoded Chinese in Aviation (Not in i18n)

These Chinese labels are hardcoded in aviation components and should be moved to i18n:

| File | Chinese Labels |
|------|----------------|
| `hooks/use-impact-options.hook.ts` | 无关紧要, 导致差错, 导致UAS T, 导致UAS E |
| `data/coping-abilities.ts` | 知识, 程序, 知识应用 1/2, 程序应用 1/2 |
| `components/annotation/recognition-section/RecognitionSection.tsx` | 管理的, 未管理, 无效管理, 未观察到 |
| `components/annotation/competency-summary/CompetencySummary.tsx` | 威胁相关胜任力, 差错相关胜任力, UAS相关胜任力, 情境意识, 决策能力, 沟通能力, 工作负荷管理, 机组协作, 压力管理, 自动化管理 |
| `components/annotation/labeling-item-card/LabelingItemCard.tsx` | 来源于威胁, 来源于差错 |
| `hooks/use-uas-applicable.hook.ts` | UAS需要威胁影响为"导致UAS T"或差错影响为"导致UAS E" |

---

## Recommendations

### Priority 1: Add Missing GAP Labels to Aviation i18n

Add these keys to `web/libs/aviation/src/i18n/locales/zh.json`:

```json
{
  "aviation": {
    "upload": {
      "empty_file": "Excel文件为空或格式不正确",
      "parse_error": "Excel文件解析失败，请检查文件格式",
      "no_file": "请先上传Excel文件",
      "start_hint": "请上传Excel文件开始标注",
      "format_hint": "支持.xlsx格式文件"
    },
    "defaults": {
      "unknown_unit": "未知单位",
      "unnamed": "未命名"
    },
    "placeholders": {
      "event_description": "事件详细描述...",
      "select_aircraft": "选择机型",
      "takeoff": "起飞",
      "landing": "落地",
      "alternate": "备降",
      "select_event_type": "选择事件类型",
      "select_flight_phase": "选择飞行阶段",
      "enter_training_plan": "输入设想训练方案",
      "enter_goal": "输入所需达到的目标",
      "select_result": "请选择关联的结果绩效"
    }
  }
}
```

### Priority 2: Move Hardcoded Chinese to i18n

Refactor hardcoded Chinese labels in hooks and components to use i18n keys.

### Priority 3: Standardize Wording

Decide on consistent wording for DIFFERENT items (e.g., "上一条" vs "上一事件").

---

## Files Generated

1. `component-labels.csv` - All label component labels (122 rows)
2. `label-aviation-gap-analysis.csv` - Detailed mapping with status (105 rows)
3. `gap-analysis-summary.md` - This summary report
