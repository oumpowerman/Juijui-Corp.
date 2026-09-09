# Project Developer Guide & Architecture Standards

## Master Data Tab Architecture (Single Source of Truth)

Whenever adding a new Master Data tab, follow these 3 simple steps:

1. **Add the Type Key**: Add the new tab string literal in `hooks/useMasterDataView.ts` (`export type MasterTab = ...`).
2. **Register in `MASTER_META`**: In `components/admin/master/MasterTabNavigation.tsx`, add the metadata entry in `MASTER_META`:
   ```typescript
   MY_NEW_TAB: {
       label: 'My New Tab',
       icon: MyIcon,
       desc: 'คำอธิบายสำหรับแท็บนี้',
       group: 'WORKFLOW' | 'CONTENT' | 'RESOURCES' | 'SYSTEM'
   }
   ```
   *Note: Both the side navigation bar (`MasterTabNavigation.tsx`) and the modal configuration dialog (`MasterDataTabConfigModal.tsx`) automatically derive their groups and tab lists directly from `MASTER_META` via `getMasterTabGroups()`.*
3. **Render View Component**: Add the conditional view render block in `components/MasterDataManager.tsx` (`activeTab === 'MY_NEW_TAB' ? <MyNewTabView /> : ...`).

---

## Mentor Tips Architecture

All module mentor tips are centralized in `config/mentorTips.ts`.

- To add or modify default messages, update `DEFAULT_MENTOR_TIPS` in `config/mentorTips.ts`.
- In any module/page view, render `<MentorTip moduleId="MODULE_ID" />`.
- Mentor tips can be globally toggled or individually toggled and edited by Admins in the **Master Data > System Config > Mentor Tips** panel.
