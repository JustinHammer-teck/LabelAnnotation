I'll help you understand this requirement by analyzing all the uploaded files. Let me start by reading through them systematically.Now let me read the Excel files to understand the data structure:Now let me read the PowerPoint file for the detailed layout guide:Now I have a complete picture of the requirements. Let me create a comprehensive business analysis document for you.

---

# 📋 Business Requirements Analysis: Aviation Safety Event Annotation System

## 1. Executive Summary

This is a **data annotation/labeling web application** for aviation safety events. The system allows analysts to:
1. Upload aviation safety incident data from Excel files
2. View incident details in a structured interface
3. Annotate each incident by selecting options from predefined dropdown menus
4. Export the annotated data back to Excel

---

## 2. Key Terminology Translations

| Chinese | English | Purpose |
|---------|---------|---------|
| 航空安全事件 | Aviation Safety Event/Incident | The subject being annotated |
| 标签汇总 | Label Summary | Master list of all annotation options |
| 威胁 (Threat) | Threat | Risk category in TEM model |
| 差错 (Error) | Error | Human error category |
| UAS | Undesired Aircraft State | Abnormal aircraft condition |
| 胜任力 | Competency | Pilot competency assessment |
| 训练主题 | Training Topic | Recommended training themes |
| CRM | Crew Resource Management | Team coordination training |

---

## 3. System Architecture Overview

The system has **4 main data areas** based on the layout image (color-coded):

### A. **AUTO-FILLED AREA** (Read from Excel upload)
These fields are populated automatically when user uploads an incident Excel file:

| Field | Chinese | Source |
|-------|---------|--------|
| Event Number | 事件编号 | From upload |
| Event Description | 事件描述 | From upload |
| Date | 日期 | From upload |
| Time | 时间 | From upload |
| Location | 地点 | From upload |
| Airport | 机场 | From upload |
| Flight Phase | 飞行阶段 | From upload |

### B. **USER SELECTION AREA** (Orange boxes in the layout)
Users click dropdowns or popup windows to select from predefined options:

| Section | Fields | Selection Type |
|---------|--------|----------------|
| **Basic Info** | Aircraft Type (机型) | Single select |
| | Event Label (事件标签) | Multi-select |
| | Flight Phase (飞行阶段) | Single select |
| **Threat Identification** | Threat Type (威胁类型) - 3 levels | Hierarchical single select |
| | Threat Management (威胁管理) | Single select |
| | Threat Outcome (威胁影响) | Single select |
| **Error Identification** | Error Relevancy (差错相关性) | Single select |
| | Error Type (差错类型) - 3 levels | Hierarchical single select |
| | Error Management (差错管理) | Single select |
| | Error Outcome (差错影响) | Single select |
| **UAS Identification** | UAS Relevancy (UAS相关性) | Single select |
| | UAS Type - 3 levels | Hierarchical single select |
| | UAS Management (UAS管理) | Single select |
| **Competency** | Competency Type - 2 levels | Hierarchical multi-select |
| **Training Evaluation** | Likelihood (可能性) | Single select |
| | Severity (严重程度) | Single select |
| | Training Benefit (训练效果) | Single select |
| **CRM Training** | Training Topics | Multi-select |

### C. **MANUAL TEXT INPUT AREA** (Marked as "填写" / User to Fill)
Free-text fields where users type descriptions:
- Description fields for each section
- Training Plan Ideas (训练方案设想)
- Goals to Achieve (所需要达到的目标)
- Notes/Comments (备注)

### D. **AUTO-CALCULATED AREA** (Green boxes with red highlight - Rule-Based)
These fields are **automatically populated based on user selections** in the orange boxes:

| Auto-Fill Field | Rule Source |
|-----------------|-------------|
| Training Topic - Threat Related (威胁相关) | Based on Threat Type selection → mapped to "模拟机训练主题" column |
| Training Topic - Error Related (差错相关) | Based on Error Type selection → mapped to "模拟机训练主题" column |
| Training Topic - UAS Related (UAS相关) | Based on UAS Type selection → mapped to "模拟机训练主题" column |

---

## 4. Auto-Display Rules (The Green Box Logic)

This is the rule-based mapping system mentioned in your requirements:

**How it works:**
1. When user selects an option in "Threat Type" (Level 3), the system looks up the corresponding row in the `威胁类型&训练主题` sheet
2. It finds the "模拟机训练主题" (Simulator Training Topic) column value for that row
3. It auto-populates the "Training Topic - Threat Related" field

**Example:**
- User selects: `TEW 01 恶劣天气( 寒冷/炎热/雷雨/颠簸/沙尘/火山灰)`
- System auto-fills: `恶劣天气` (Severe Weather)

The same logic applies for Error Types and UAS Types.

---

## 5. Hierarchical Selection Structure

Many dropdowns have **3-level hierarchies**. For example, Error Types:

```
Level 1: EH 飞机操纵 (Aircraft Handling)
├── Level 2: EHM 人工操纵/飞行控制 (Manual Control)
│   ├── Level 3: EHM 01 无 AP
│   ├── Level 3: EHM 02 无 AT
│   └── Level 3: EHM 03 无 AP/AT
├── Level 2: EHG 地面导航 (Ground Navigation)
│   ├── Level 3: EHG 01 试图转向错误的滑行道/跑道
│   └── ...
```

**UI Recommendation:** Use a cascading dropdown or modal popup with tree-view selection.

---

## 6. Complete Options Reference by Sheet

| Sheet Name | English Name | Options For |
|------------|--------------|-------------|
| 基本信息 | Basic Info | Aircraft Type (56 options), Event Labels (28 options), Flight Phases (11 options) |
| 威胁类型&训练主题 | Threat Types & Training Topics | 84 threat type options with training theme mapping |
| 威胁-管理&影响 | Threat Management & Outcome | 4 management options, 3 outcome options |
| 差错类型&训练主题 | Error Types & Training Topics | 50 error type options with training theme mapping |
| 差错-相关性&管理&影响 | Error Relevancy/Management/Outcome | 3 relevancy, 4 management, 2 outcome options |
| UAS&训练主题-UAS | UAS Types & Training Topics | 140 UAS type options |
| UAS-相关性&管理 | UAS Relevancy & Management | 2 relevancy, 5 management options |
| 胜任力 | Competency | 73 competency indicators across 8 categories |
| 训练评估 | Training Evaluation | Likelihood (5), Severity (5), Training Benefit (5) |
| CRM训练主题 | CRM Training Topics | 13 CRM training themes |

---

## 7. Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  1. UPLOAD                                                       │
│     User uploads Excel file (航空安全事件示例.xlsx format)          │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. TASK GENERATION                                              │
│     System creates one annotation task per row                   │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. ANNOTATION                                                   │
│     For each task, user sees:                                    │
│     - Auto-filled incident details (top section)                 │
│     - Dropdown selectors for categorization (orange boxes)       │
│     - Text input fields for descriptions                         │
│     - Auto-calculated training topics (green boxes)              │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. EXPORT                                                       │
│     Export all annotations to Excel file                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Key Questions for Clarification

Before development, you should confirm with stakeholders:

1. **Multi-user support?** - Can multiple annotators work on different incidents simultaneously? NO
2. **Save progress?** - Should partial annotations be saved automatically? YES
3. **Validation rules?** - Are certain fields mandatory before submission? ALL FIELD REQUIRE
4. **Add annotation modules?** - The "+" buttons in the layout - can users add multiple threat/error/UAS entries per incident? WE JUST GONNA IGNORE THIS FOR NOW I WILL UPDATE LATER ON THE Behavior
5. **Conflict resolution?** - What happens if the same incident is annotated differently by two users? We would make a lock on the task. 