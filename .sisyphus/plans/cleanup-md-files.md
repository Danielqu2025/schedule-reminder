# 整理MD文件工作计划

## TL;DR

> **Quick Summary**: 清理ProjectFlow项目中重复和过时的MD文档文件，统一版本信息，更新文档链接
>
> **Deliverables**:
> - 删除8个重复/过时的MD文件
> - 更新PROJECT_OVERVIEW.md版本信息到2.3.0
> - 整理优化相关文档（保留OPTIMIZATION_SUMMARY.md和FINAL_REPORT.md）
> - 更新README.md中的文档链接
> - 验证所有文档链接有效性

> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential
> **Critical Path**: 删除文件 → 更新版本 → 验证链接

---

## Context

### Original Request
分析应用中的MD文件，由于用途和生成时间不同，可能是重复或者是失效的，请整理，删除不必要的md文件，并将md文件更新到与这个应用匹配的状态

### Current State
- **应用状态**: ProjectFlow - 团队项目管理系统，版本2.3.0，生产就绪
- **MD文件总数**: 36个
- **重复/过时文件**: 8个需要删除

---

## Work Objectives

### Core Objective
整理项目中的MD文档文件，删除重复和过时内容，统一版本信息，确保文档与当前应用状态一致。

### Concrete Deliverables
1. 删除重复和过时的MD文件（8个）
2. 更新PROJECT_OVERVIEW.md版本到2.3.0
3. 确认核心文档保留
4. 更新README.md中的文档引用

### Definition of Done
- [ ] 重复/过时文件已删除
- [ ] PROJECT_OVERVIEW.md版本已更新
- [ ] README.md链接已验证
- [ ] 所有文档链接有效

### Must Have
- 保留核心文档：README.md, GETTING_STARTED.md, OPTIMIZATION_SUMMARY.md
- 保留功能文档：docs/DESIGN_SYSTEM.md, docs/ICON_SYSTEM.md, docs/STORAGE_SETUP.md
- 保留技术文档：docs/DEVELOPMENT_GUIDE.md, docs/TESTING_GUIDE.md
- 保留数据库文档：docs/sql/DATABASE_SETUP.sql
- 保留变更日志：docs/CHANGELOG.md

### Must NOT Have (Guardrails)
- **不删除核心功能文档**
- **不删除当前有效的文档**
- **不修改代码文件**

---

## Execution Strategy

### Sequential Tasks

**Task 1: 删除重复和过时的MD文件**
- 删除根目录过时文件：
  - `FINAL_REPORT_E2E.md` - E2E测试报告，已整合到FINAL_REPORT.md
  - `FILE_ORGANIZATION.md` - 文件组织说明，内容已过时

- 删除docs/目录过时文件：
  - `docs/FIX_CORS_EDGE_FUNCTION.md` - CORS修复，已过时
  - `docs/DEPLOY_EDGE_FUNCTION_VIA_EDITOR.md` - Edge Function部署，已过时
  - `docs/FIX_EDGE_FUNCTION_401.md` - Edge Function修复，已过时
  - `docs/INSTALL_SUPABASE_CLI_WINDOWS.md` - 安装指南，已整合
  - `docs/INVITE_DASHBOARD_TROUBLESHOOTING.md` - 邀请面板故障排除，已过时
  - `docs/SUPABASE_EMAIL_DASHBOARD_ONLY.md` - 邮件面板说明，已过时

**Task 2: 更新PROJECT_OVERVIEW.md版本信息**
- 更新当前版本：2.0.0 → 2.3.0
- 更新发布日期：2026-01-31 → 2026-02-03

**Task 3: 验证核心文档完整性**
- 确认README.md正确引用现有文档
- 确认docs/README.md索引正确
- 验证所有文档链接有效

---

## TODOs

- [ ] 1. 删除重复和过时的MD文件

  **What to do**:
  - 删除根目录文件：
    - FINAL_REPORT_E2E.md
    - FILE_ORGANIZATION.md
  - 删除docs/目录文件：
    - FIX_CORS_EDGE_FUNCTION.md
    - DEPLOY_EDGE_FUNCTION_VIA_EDITOR.md
    - FIX_EDGE_FUNCTION_401.md
    - INSTALL_SUPABASE_CLI_WINDOWS.md
    - INVITE_DASHBOARD_TROUBLESHOOTING.md
    - SUPABASE_EMAIL_DASHBOARD_ONLY.md

  **Must NOT do**:
  - 不删除当前有效的文档
  - 不删除代码文件

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: 简单文件删除操作，无复杂逻辑
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (single task)
  - **Blocks**: Task 2
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] 根目录8个重复文件已删除
  - [ ] docs/目录6个过时文件已删除
  - [ ] 列表确认不再包含这些文件

  **Commit**: NO

- [ ] 2. 更新PROJECT_OVERVIEW.md版本到2.3.0

  **What to do**:
  - 更新版本信息：2.0.0 → 2.3.0
  - 更新发布日期：2026-01-31 → 2026-02-03

  **Must NOT do**:
  - 不修改其他内容
  - 不删除文件

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单文本替换操作
  - **Skills**: []
    - 无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (depends on Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] 当前版本显示为2.3.0
  - [ ] 发布日期为2026-02-03

  **Commit**: NO

- [ ] 3. 验证README.md文档链接

  **What to do**:
  - 检查README.md中引用的所有文档是否存在
  - 更新或删除已失效的链接
  - 验证docs/README.md索引正确

  **Must NOT do**:
  - 不删除有效的文档

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单验证操作
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (depends on Task 2)
  - **Blocked By**: Task 2

  **Acceptance Criteria**:
  - [ ] 所有引用的文档文件存在
  - [ ] 所有链接有效

  **Commit**: YES | groups with N
  - Message: `docs: 清理MD文档，统一版本信息到2.3.0`
  - Files: `README.md, PROJECT_OVERVIEW.md`

---

## Final MD File Structure

### 保留的根目录文档
```
schedule-reminder/
├── README.md                    # 主文档（已更新）
├── GETTING_STARTED.md            # 快速开始指南
├── DEPLOYMENT_GUIDE.md           # 完整部署指南
├── OPTIMIZATION_SUMMARY.md     # 优化总结
├── OPTIMIZATION_REPORT.md          # 详细优化报告
├── TESTING_GUIDE.md              # 测试指南
├── FINAL_REPORT.md               # 完成报告
├── SETUP_CHECKLIST.md            # 配置检查清单
├── ENV_TEMPLATE.md               # 环境变量模板
└── PROJECT_OVERVIEW.md           # 项目概览（待更新）
```

### 保留的docs/目录文档
```
docs/
├── README.md                        # 文档索引
├── CHANGELOG.md                     # 更新日志
├── DESIGN_SYSTEM.md                 # 设计系统
├── ICON_SYSTEM.md                   # 图标规范
├── STORAGE_SETUP.md                 # 存储配置
├── DEVELOPMENT_GUIDE.md             # 开发指南
├── TESTING_GUIDE.md                 # 测试指南
├── sql/
│   └── DATABASE_SETUP.sql            # 数据库设置
└── legacy/                          # 旧版文档（保留）
    ├── BUGFIX_STATISTICS.md
    ├── BUGFIX_TEAM_ERROR.md
    ├── CLEANUP_SUMMARY.md
    ├── DIAGNOSE_TEAM_ISSUE.md
    ├── FIX_RLS_README.md
    ├── FIX_TEAM_ERROR.md
    ├── FIX_STATISTICS.md
    ├── README_ERROR_FIX.md
    ├── SETUP_CHECKLIST.md
    └── TROUBLESHOOTING.md
```

### 删除的文件
```
已删除（8个）：
├── FINAL_REPORT_E2E.md
├── FILE_ORGANIZATION.md
├── docs/FIX_CORS_EDGE_FUNCTION.md
├── docs/DEPLOY_EDGE_FUNCTION_VIA_EDITOR.md
├── docs/FIX_EDGE_FUNCTION_401.md
├── docs/INSTALL_SUPABASE_CLI_WINDOWS.md
├── docs/INVITE_DASHBOARD_TROUBLESHOOTING.md
└── docs/SUPABASE_EMAIL_DASHBOARD_ONLY.md
```

---

## Success Criteria

### Final Checklist
- [ ] 重复/过时文件已删除（8个）
- [ ] PROJECT_OVERVIEW.md版本已更新到2.3.0
- [ ] README.md文档链接已验证
- [ ] 所有有效文档保留

### Documentation Links
- README.md 正确引用现有文档
- docs/README.md 索引正确
- 版本信息统一为2.3.0
