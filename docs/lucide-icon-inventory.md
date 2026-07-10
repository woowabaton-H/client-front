# Lucide Icon Inventory

This document lists the current places where the client app needs real icons. It is a planning document only; no UI icon replacement has been applied yet.

## Baseline

- Package: add `lucide-react` to `client-front` before implementation. `client-front-design-system` already has it installed.
- Styling: import named icons directly from `lucide-react`, render them inline, and let them inherit `currentColor`.
- Accessibility: use `aria-hidden="true"` for decorative icons. Keep `aria-label` on icon-only buttons.
- Current temporary glyphs to replace: `✓`, `⌁`, `⌂`, `□`, `≡`, `○`, `×`, `‹`, `›`, and visual-only `★` where appropriate.

## Required UI Icons

| Area | Current location | Current placeholder | Lucide icon | Notes |
| --- | --- | --- | --- | --- |
| App brand mark | `components/CleanLoopApp.tsx:920` | `✓` | `CircleCheckBig` or `Sparkles` | Optional if a custom brand mark is planned. Otherwise use `CircleCheckBig` to preserve the completion/check meaning. |
| Header notification button | `components/CleanLoopApp.tsx:926` | `⌁` | `Bell` | Use `BellDot` or keep the existing red `.alert-dot` when there are unread notifications. |
| Bottom tab: Home | `components/CleanLoopApp.tsx:1063` | `⌂` | `Home` | Main dashboard destination. |
| Bottom tab: Selection | `components/CleanLoopApp.tsx:1064` | `□` | `ShoppingBag` or `PackageSearch` | Use `ShoppingBag` if this feels like commerce, `PackageSearch` if it feels like curated discovery. |
| Bottom tab: Community | `components/CleanLoopApp.tsx:1065` | `≡` | `MessagesSquare` | Better matches posts, Q&A, and shared tips than a menu/list symbol. |
| Bottom tab: My | `components/CleanLoopApp.tsx:1066` | `○` | `UserRound` | Profile/account destination. |
| Sheet close button | `components/CleanLoopApp.tsx:1113` | `×` | `X` | Keep the existing Korean `aria-label="닫기"`. |
| Toast success icon | `components/CleanLoopApp.tsx:1146` | `✓` | `CheckCircle2` | Decorative status icon, `aria-hidden="true"`. |
| Community back button | `components/CleanLoopApp.tsx:1489` | `‹` | `ChevronLeft` | Inline icon before `커뮤니티`. |
| Menu row trailing arrows | `components/CleanLoopApp.tsx:1602-1607` | `›` | `ChevronRight` | Replace all row `<em>` glyphs. |

## Action And State Icons

| Area | Current location | Lucide icon | Notes |
| --- | --- | --- | --- |
| Complete task buttons | `components/CleanLoopApp.tsx:863`, `components/CleanLoopApp.tsx:1311` | `Check` or `CircleCheckBig` | Use only if buttons need icon+text. |
| Help button | `components/CleanLoopApp.tsx:1314` | `CircleHelp` | Pairs with `도움 볼래요`. |
| Save selection buttons | `components/CleanLoopApp.tsx:826`, `components/CleanLoopApp.tsx:1396` | `Bookmark`, `BookmarkCheck` | Use `BookmarkCheck` for saved state if space allows. |
| External purchase/reservation buttons | `components/CleanLoopApp.tsx:829`, `components/CleanLoopApp.tsx:1397` | `ExternalLink` or `CalendarCheck` | Use `ExternalLink` for product purchase links and `CalendarCheck` for service reservation. |
| Rating marker | `components/CleanLoopApp.tsx:816`, `components/CleanLoopApp.tsx:1391` | `Star` | Optional. The current text star can stay if it reads better in dense metadata. |
| Community write button | `components/CleanLoopApp.tsx:1439` | `PenLine` | Can be used for both `질문하기` and `팁 쓰기`. |
| Helpful reaction | `components/CleanLoopApp.tsx:1500` | `ThumbsUp` | Active state should inherit the button active color. |
| Community save reaction | `components/CleanLoopApp.tsx:1503` | `Bookmark` or `BookmarkCheck` | Match selection save behavior. |
| Reply submit button | `components/CleanLoopApp.tsx:1524-1525` | `Send` | Useful if the submit button becomes icon+text or icon-only. |
| Cycle day decrement/increment | `components/CleanLoopApp.tsx:1657`, `components/CleanLoopApp.tsx:1671` | `Minus`, `Plus` | Replace `-` and `+` only if the controls become icon buttons. |
| Cycle edit/save actions | `components/CleanLoopApp.tsx:1103-1109` | `PencilLine`, `Save`, `X` | Optional; current text-only actions are acceptable. |

## My Page Menu Icons

If the menu rows get leading icons, use these mappings:

| Menu item | Current location | Lucide icon |
| --- | --- | --- |
| 완료 히스토리 | `components/CleanLoopApp.tsx:1602` | `History` |
| 저장한 셀렉션 | `components/CleanLoopApp.tsx:1603` | `BookmarkCheck` |
| 저장한 커뮤니티 | `components/CleanLoopApp.tsx:1604` | `MessageSquareHeart` |
| 내 커뮤니티 글 | `components/CleanLoopApp.tsx:1605` | `PenLine` |
| 주기 관리 | `components/CleanLoopApp.tsx:1606` | `CalendarClock` or `Settings` |
| 알림 설정 | `components/CleanLoopApp.tsx:1607` | `Bell` |

## Category Icon Migration Candidates

The app currently renders category images through `IconTile` and `/cleanloop/icons/category-*.png`. These are not the same as temporary UI glyphs, so migrate them only if the product direction is to make all category marks Lucide-based.

| Category key | Current source | Lucide candidate |
| --- | --- | --- |
| `laundry` | `public/cleanloop/icons/category-laundry.png` | `WashingMachine` or `Shirt` |
| `bath` | `public/cleanloop/icons/category-bath.png` | `Bath` or `ShowerHead` |
| `kitchen` | `public/cleanloop/icons/category-kitchen.png` | `CookingPot` or `Utensils` |
| `trash` | `public/cleanloop/icons/category-trash.png` | `Trash2` |
| `floor` | `public/cleanloop/icons/category-floor.png` | `BrushCleaning`, `SprayCan`, or `Sparkles` |
| `season` | `public/cleanloop/icons/category-season.png` | `Fan` or `Leaf` |
| `pet` | `public/cleanloop/icons/category-pet.png` | `PawPrint` |
| `supplies` | `public/cleanloop/icons/category-supplies.png` | `Package` or `PackageSearch` |

## Implementation Order

1. Add `lucide-react` to `client-front`.
2. Replace header, sheet, toast, and bottom tab placeholders first.
3. Replace menu chevrons and optional action icons.
4. Decide separately whether category PNGs should remain illustrated assets or become Lucide icons.
