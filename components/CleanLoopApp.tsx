"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import {
  Bell,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  History,
  Home,
  MessageSquareHeart,
  MessagesSquare,
  Minus,
  PackageSearch,
  PenLine,
  Pencil,
  Plus,
  RefreshCcw,
  Send,
  Settings2,
  Star,
  ThumbsUp,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BrandEntryLoader } from "@/components/binu/brand-entry-loader";
import { BinuPickCard } from "@/components/binu/binu-pick-card";
import { EmptyState as BinuEmptyState } from "@/components/binu/empty-state";
import { RoutineCard } from "@/components/binu/routine-card";
import { ServiceCard } from "@/components/binu/service-card";
import { cn } from "@/lib/utils";
import {
  completeCategoryById,
  createCategoryFromPreset,
  createCommunityComment,
  createCommunityPost,
  deleteCategory,
  getCategoryPresets,
  getCommunityComments,
  getCommunityPost,
  getCommunityPosts,
  getCompletionLogs,
  getHome,
  getMe,
  getMeSummary,
  getNotifications,
  getSavedSelections,
  getSelection,
  getSelections,
  markCommunityHelpful,
  readAllNotifications,
  readNotification,
  recordExternalView,
  resetDemoDataToSeed,
  saveCommunityPost,
  saveSelection,
  unmarkCommunityHelpful,
  unsaveCommunityPost,
  unsaveSelection,
  updateCategoryCycle,
  updateMe,
  type ApiCommunityComment,
  type ApiHome,
  type ApiMeSummary,
  type ApiNotification,
  type ApiUser,
} from "@/lib/cleanloop-api";
import {
  iconForLabel,
  mapCategory,
  mapCategoryPreset,
  mapCommunityDetail,
  mapCommunitySummary,
  mapCompletionLog,
  mapSelection,
  type Category,
  type CategoryPreset,
  type CommunityPost,
  type CompletionLog,
  type Selection,
} from "@/lib/cleanloop-mappers";

type View = "home" | "selection" | "community" | "community-detail" | "my";
type CommunityTab = "tips" | "qa";
type LoadState = "loading" | "ready" | "error";
type SelectionTypeFilter = "all" | "product" | "service";
type SheetKind =
  | "notifications"
  | "history"
  | "saved-selections"
  | "saved-community"
  | "cycle-manager"
  | "selection-detail"
  | "community-composer"
  | "profile";

type Sheet = { kind: SheetKind; title: string; sub?: string };
type CycleDraft = Record<string, { enabled: boolean; cycleDays: number }>;
type Toast = { title: string; desc?: string };

const ALLOWED_CYCLE_DAYS = [3, 7, 14, 21, 28] as const;
const PAGE_LIMIT = 20;
const BRAND_TAGLINE = "비우는 루틴, 누리는 하루.";
const BRAND_ICON_SRC = "/binu/app-icon-main.png";
const iconPath = (name: string) => `/cleanloop/icons/category-${name}.png`;

const navigationItems = [
  { key: "home", label: "홈", icon: Home },
  { key: "selection", label: "비누 픽", icon: PackageSearch },
  { key: "community", label: "커뮤니티", icon: MessagesSquare },
  { key: "my", label: "마이", icon: UserRound },
] as const;

function errorMessageOf(error: unknown) {
  return error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.";
}

function fmtDate(input: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(input));
}

function fmtRelativeDate(input: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(input));
}

function statusKey(category: Category) {
  if (category.status.daysUntilNext < 0) return "late";
  return category.status.code;
}

function statusPriority(category: Category) {
  const order = { due: 0, soon: 1, good: 2 } as const;
  return category.status.daysUntilNext < 0 ? -1 : order[category.status.code];
}

function normalizeCycleDays(cycleDays: number) {
  return ALLOWED_CYCLE_DAYS.reduce((closest, value) =>
    Math.abs(value - cycleDays) < Math.abs(closest - cycleDays) ? value : closest,
  );
}

function stepCycleDays(current: number, direction: -1 | 1) {
  const index = ALLOWED_CYCLE_DAYS.findIndex((value) => value === normalizeCycleDays(current));
  return ALLOWED_CYCLE_DAYS[Math.max(0, Math.min(ALLOWED_CYCLE_DAYS.length - 1, index + direction))];
}

function findCategoryForPreset(preset: CategoryPreset, categories: Category[]) {
  return categories.find((category) => category.name === preset.name);
}

function createCycleDraft(categories: Category[], presets: CategoryPreset[]): CycleDraft {
  return Object.fromEntries(
    presets.map((preset) => {
      const category = findCategoryForPreset(preset, categories);
      return [
        preset.id,
        { enabled: Boolean(category), cycleDays: normalizeCycleDays(category?.cycleDays ?? preset.defaultCycle) },
      ];
    }),
  );
}

function IconTile({ icon, size = 48 }: { icon: string; size?: number }) {
  if (!icon) {
    return <span className="category-icon" style={{ width: size, height: size }} aria-hidden="true" />;
  }
  return (
    <span className="category-icon" style={{ width: size, height: size }} aria-hidden="true">
      <Image src={iconPath(icon)} alt="" width={size} height={size} />
    </span>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return <BinuEmptyState title={title} description={desc} actionLabel={null} />;
}

function DataState({ state, error, empty, children }: {
  state: LoadState;
  error?: string;
  empty?: boolean;
  children: React.ReactNode;
}) {
  if (state === "loading") return <EmptyState title="불러오는 중입니다" desc="서버 데이터를 확인하고 있어요." />;
  if (state === "error") return <EmptyState title="데이터를 불러오지 못했어요" desc={error ?? "잠시 후 다시 시도해주세요."} />;
  if (empty) return <EmptyState title="표시할 데이터가 없습니다" desc="서버에 데이터가 추가되면 이곳에 표시됩니다." />;
  return children;
}

export function CleanLoopApp() {
  const [view, setView] = useState<View>("home");
  const [appState, setAppState] = useState<LoadState>("loading");
  const [entryIntroReady, setEntryIntroReady] = useState(false);
  const [entryIntroHold] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("intro") === "hold",
  );
  const [appError, setAppError] = useState("");
  const [home, setHome] = useState<ApiHome | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [summary, setSummary] = useState<ApiMeSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [presets, setPresets] = useState<CategoryPreset[]>([]);

  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [notificationState, setNotificationState] = useState<LoadState>("ready");
  const [notificationError, setNotificationError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [logs, setLogs] = useState<CompletionLog[]>([]);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyState, setHistoryState] = useState<LoadState>("loading");
  const [historyError, setHistoryError] = useState("");

  const [selections, setSelections] = useState<Selection[]>([]);
  const [savedSelections, setSavedSelections] = useState<Selection[]>([]);
  const [selectionDetail, setSelectionDetail] = useState<Selection | null>(null);
  const [selectionState, setSelectionState] = useState<LoadState>("loading");
  const [selectionError, setSelectionError] = useState("");
  const [selectionCursor, setSelectionCursor] = useState<string | null>(null);
  const [selectionFilter, setSelectionFilter] = useState("all");
  const [selectionType, setSelectionType] = useState<SelectionTypeFilter>("all");

  const [communityPosts, setCommunityPosts] = useState<Record<CommunityTab, CommunityPost[]>>({ tips: [], qa: [] });
  const [savedCommunity, setSavedCommunity] = useState<CommunityPost[]>([]);
  const [communityTags, setCommunityTags] = useState<string[]>([]);
  const [communityTab, setCommunityTab] = useState<CommunityTab>("tips");
  const [communityTag, setCommunityTag] = useState("all");
  const [communityCursor, setCommunityCursor] = useState<Record<CommunityTab, string | null>>({ tips: null, qa: null });
  const [communityState, setCommunityState] = useState<LoadState>("loading");
  const [communityError, setCommunityError] = useState("");
  const [activePost, setActivePost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<ApiCommunityComment[]>([]);
  const [commentCursor, setCommentCursor] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<LoadState>("ready");

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [mutationBusy, setMutationBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [cycleDraft, setCycleDraft] = useState<CycleDraft>({});
  const [cycleEditing, setCycleEditing] = useState(false);

  const showToast = (title: string, desc?: string) => {
    setToast({ title, desc });
    window.setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setEntryIntroReady(true), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      setAppState("loading");
      try {
        const [homeData, presetData, userData, summaryData, logPage, selectionPage, savedData, tipsPage, qaPage] =
          await Promise.all([
            getHome(),
            getCategoryPresets(),
            getMe(),
            getMeSummary(),
            getCompletionLogs({ limit: PAGE_LIMIT }),
            getSelections({ limit: PAGE_LIMIT }),
            getSavedSelections(),
            getCommunityPosts({ type: "tips", limit: PAGE_LIMIT }),
            getCommunityPosts({ type: "qa", limit: PAGE_LIMIT }),
          ]);
        if (cancelled) return;

        const mappedPresets = presetData.map(mapCategoryPreset);
        const mappedCategories = homeData.categories.map(mapCategory);
        const mappedSelections = selectionPage.items.map((item) => mapSelection(item, mappedPresets));
        const mappedTips = tipsPage.items.map(mapCommunitySummary);
        const mappedQa = qaPage.items.map(mapCommunitySummary);

        setHome(homeData);
        setUser(userData);
        setSummary(summaryData);
        setCategories(mappedCategories);
        setPresets(mappedPresets);
        setUnreadCount(homeData.unreadNotificationCount);
        setLogs(logPage.items.map((item) => mapCompletionLog(item, mappedCategories, mappedPresets)));
        setHistoryCursor(logPage.nextCursor);
        setSelections(mappedSelections);
        setSavedSelections(savedData.map((item) => mapSelection(item, mappedPresets)));
        setSelectionCursor(selectionPage.nextCursor);
        setCommunityPosts({ tips: mappedTips, qa: mappedQa });
        setCommunityCursor({ tips: tipsPage.nextCursor, qa: qaPage.nextCursor });
        setCommunityTags(Array.from(new Set([...mappedTips, ...mappedQa].map((post) => post.tag))).filter(Boolean));
        setHistoryState("ready");
        setSelectionState("ready");
        setCommunityState("ready");
        setAppState("ready");
      } catch (error) {
        if (cancelled) return;
        const message = errorMessageOf(error);
        setAppError(message);
        setHistoryError(message);
        setSelectionError(message);
        setCommunityError(message);
        setHistoryState("error");
        setSelectionState("error");
        setCommunityState("error");
        setAppState("error");
      }
    }
    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => statusPriority(a) - statusPriority(b)),
    [categories],
  );

  const refreshCore = async () => {
    const [homeData, summaryData, savedData] = await Promise.all([getHome(), getMeSummary(), getSavedSelections()]);
    const mappedCategories = homeData.categories.map(mapCategory);
    setHome(homeData);
    setCategories(mappedCategories);
    setUnreadCount(homeData.unreadNotificationCount);
    setSummary(summaryData);
    setSavedSelections(savedData.map((item) => mapSelection(item, presets)));
  };

  const loadHistory = async (append: boolean) => {
    if (append && !historyCursor) return;
    setHistoryState("loading");
    try {
      const page = await getCompletionLogs({ limit: PAGE_LIMIT, cursor: append ? historyCursor ?? undefined : undefined });
      const mapped = page.items.map((item) => mapCompletionLog(item, categories, presets));
      setLogs((current) => (append ? [...current, ...mapped] : mapped));
      setHistoryCursor(page.nextCursor);
      setHistoryState("ready");
    } catch (error) {
      setHistoryError(errorMessageOf(error));
      setHistoryState("error");
    }
  };

  const loadSelections = async (filter = selectionFilter, type = selectionType, append = false) => {
    if (append && !selectionCursor) return;
    setSelectionState("loading");
    try {
      const page = await getSelections({
        category: filter === "all" ? undefined : filter,
        type: type === "all" ? undefined : type,
        cursor: append ? selectionCursor ?? undefined : undefined,
        limit: PAGE_LIMIT,
      });
      const mapped = page.items.map((item) => mapSelection(item, presets));
      setSelections((current) => (append ? [...current, ...mapped] : mapped));
      setSelectionCursor(page.nextCursor);
      setSelectionState("ready");
    } catch (error) {
      setSelectionError(errorMessageOf(error));
      setSelectionState("error");
    }
  };

  const loadCommunity = async (tab = communityTab, tag = communityTag, append = false) => {
    if (append && !communityCursor[tab]) return;
    setCommunityState("loading");
    try {
      const page = await getCommunityPosts({
        type: tab,
        tag: tag === "all" ? undefined : tag,
        cursor: append ? communityCursor[tab] ?? undefined : undefined,
        limit: PAGE_LIMIT,
      });
      const mapped = page.items.map(mapCommunitySummary);
      setCommunityPosts((current) => ({ ...current, [tab]: append ? [...current[tab], ...mapped] : mapped }));
      setCommunityCursor((current) => ({ ...current, [tab]: page.nextCursor }));
      setCommunityState("ready");
    } catch (error) {
      setCommunityError(errorMessageOf(error));
      setCommunityState("error");
    }
  };

  const completeCategory = async (categoryId: string) => {
    setPendingId(categoryId);
    try {
      const result = await completeCategoryById(categoryId);
      await Promise.all([refreshCore(), loadHistory(false)]);
      showToast(result.toastMessage, `${result.log.categoryName} 완료 기록을 서버에 저장했습니다.`);
    } catch (error) {
      showToast("완료 기록에 실패했어요", errorMessageOf(error));
    } finally {
      setPendingId(null);
    }
  };

  const openNotifications = async () => {
    setSheet({ kind: "notifications", title: "알림", sub: "서버에서 받은 최신 알림입니다." });
    setNotificationState("loading");
    try {
      const result = await getNotifications();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setNotificationState("ready");
    } catch (error) {
      setNotificationError(errorMessageOf(error));
      setNotificationState("error");
    }
  };

  const markNotificationRead = async (notification: ApiNotification) => {
    if (!notification.isRead) {
      try {
        await readNotification(notification.id);
        setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        showToast("알림 읽음 처리에 실패했어요", errorMessageOf(error));
        return;
      }
    }
    if (notification.categoryId) setView("home");
  };

  const markAllNotificationsRead = async () => {
    try {
      await readAllNotifications();
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      showToast("모두 읽음 처리에 실패했어요", errorMessageOf(error));
    }
  };

  const closeSheet = () => {
    if (sheet?.kind === "notifications" && unreadCount > 0) void markAllNotificationsRead();
    setSheet(null);
    setCycleEditing(false);
  };

  const openSelectionDetail = async (item: Selection) => {
    setSelectionDetail(null);
    setSheet({ kind: "selection-detail", title: item.title, sub: `${item.category} · 상세 정보` });
    setDetailState("loading");
    try {
      const detail = mapSelection(await getSelection(item.id), presets);
      setSelectionDetail(detail);
      setDetailState("ready");
    } catch (error) {
      setSelectionError(errorMessageOf(error));
      setDetailState("error");
    }
  };

  const syncSelectionSavedState = (id: string, saved: boolean) => {
    const update = (item: Selection) => item.id === id ? { ...item, saved } : item;
    setSelections((items) => items.map(update));
    setSelectionDetail((item) => item ? update(item) : item);
  };

  const toggleSelectionSave = async (item: Selection) => {
    setPendingId(item.id);
    try {
      if (item.saved) await unsaveSelection(item.id);
      else await saveSelection(item.id);
      syncSelectionSavedState(item.id, !item.saved);
      const [savedData, summaryData] = await Promise.all([getSavedSelections(), getMeSummary()]);
      setSavedSelections(savedData.map((saved) => mapSelection(saved, presets)));
      setSummary(summaryData);
      showToast(item.saved ? "담아둔 목록에서 뺐어요" : "서버에 담아뒀어요", item.title);
    } catch (error) {
      showToast("저장 상태를 바꾸지 못했어요", errorMessageOf(error));
    } finally {
      setPendingId(null);
    }
  };

  const openExternalSelection = async (item: Selection, providerId?: string) => {
    try {
      const result = await recordExternalView(item.id, providerId);
      if (result.externalUrl) window.open(result.externalUrl, "_blank", "noopener,noreferrer");
      else showToast("외부 보기 기록을 남겼어요", result.notice);
    } catch (error) {
      showToast("외부 정보를 열지 못했어요", errorMessageOf(error));
    }
  };

  const openCommunityPost = async (postId: string) => {
    setView("community-detail");
    setActivePost(null);
    setComments([]);
    setDetailState("loading");
    try {
      const [detail, commentPage] = await Promise.all([
        getCommunityPost(postId),
        getCommunityComments(postId, { limit: PAGE_LIMIT }),
      ]);
      setActivePost(mapCommunityDetail(detail));
      setComments(commentPage.items);
      setCommentCursor(commentPage.nextCursor);
      setDetailState("ready");
    } catch (error) {
      setCommunityError(errorMessageOf(error));
      setDetailState("error");
    }
  };

  const loadMoreComments = async () => {
    if (!activePost || !commentCursor) return;
    try {
      const page = await getCommunityComments(activePost.id, { cursor: commentCursor, limit: PAGE_LIMIT });
      setComments((items) => [...items, ...page.items]);
      setCommentCursor(page.nextCursor);
    } catch (error) {
      showToast("댓글을 더 불러오지 못했어요", errorMessageOf(error));
    }
  };

  const addReply = async (body: string) => {
    if (!activePost || !body.trim()) return;
    setMutationBusy(true);
    try {
      const comment = await createCommunityComment(activePost.id, body.trim());
      setComments((items) => [comment, ...items]);
      setActivePost((post) => post ? { ...post, replyCount: post.replyCount + 1 } : post);
      await loadCommunity(activePost.type, communityTag, false);
      showToast(activePost.type === "qa" ? "답변을 남겼어요" : "댓글을 남겼어요");
    } catch (error) {
      showToast("댓글을 저장하지 못했어요", errorMessageOf(error));
    } finally {
      setMutationBusy(false);
    }
  };

  const toggleHelpful = async () => {
    if (!activePost) return;
    setMutationBusy(true);
    try {
      const result = activePost.helped
        ? await unmarkCommunityHelpful(activePost.id)
        : await markCommunityHelpful(activePost.id);
      setActivePost((post) => post ? { ...post, helped: result.hasMarkedHelpful, helpfulCount: result.helpfulCount } : post);
      await loadCommunity(activePost.type, communityTag, false);
    } catch (error) {
      showToast("도움됨 상태를 바꾸지 못했어요", errorMessageOf(error));
    } finally {
      setMutationBusy(false);
    }
  };

  const toggleCommunitySave = async () => {
    if (!activePost) return;
    setMutationBusy(true);
    try {
      if (activePost.saved) await unsaveCommunityPost(activePost.id);
      else await saveCommunityPost(activePost.id);
      setActivePost((post) => post ? {
        ...post,
        saved: !post.saved,
        savedCount: Math.max(0, post.savedCount + (post.saved ? -1 : 1)),
      } : post);
      await loadCommunity(activePost.type, communityTag, false);
    } catch (error) {
      showToast("커뮤니티 저장 상태를 바꾸지 못했어요", errorMessageOf(error));
    } finally {
      setMutationBusy(false);
    }
  };

  const submitCommunityPost = async (input: { title: string; tag: string; body: string }) => {
    setMutationBusy(true);
    try {
      const created = await createCommunityPost({ type: communityTab, ...input });
      if (created.tag && !communityTags.includes(created.tag)) setCommunityTags((tags) => [...tags, created.tag]);
      setSheet(null);
      setCommunityTag("all");
      await loadCommunity(communityTab, "all", false);
      await openCommunityPost(created.id);
      showToast(communityTab === "qa" ? "질문을 서버에 등록했어요" : "팁을 서버에 등록했어요");
    } catch (error) {
      showToast("글을 등록하지 못했어요", errorMessageOf(error));
    } finally {
      setMutationBusy(false);
    }
  };

  const openSavedCommunity = async () => {
    setSheet({ kind: "saved-community", title: "저장한 커뮤니티", sub: "서버 저장 상태를 기준으로 표시합니다." });
    setCommunityState("loading");
    try {
      const [tips, qa] = await Promise.all([
        getCommunityPosts({ type: "tips", limit: 100 }),
        getCommunityPosts({ type: "qa", limit: 100 }),
      ]);
      setSavedCommunity([...tips.items, ...qa.items].map(mapCommunitySummary).filter((post) => post.saved));
      setCommunityState("ready");
    } catch (error) {
      setCommunityError(errorMessageOf(error));
      setCommunityState("error");
    }
  };

  const saveProfile = async (name: string, avatarText: string) => {
    setMutationBusy(true);
    try {
      const updated = await updateMe({ name: name.trim(), avatarText: avatarText.trim() });
      const summaryData = await getMeSummary();
      setUser(updated);
      setSummary(summaryData);
      setSheet(null);
      showToast("프로필을 수정했어요", "홈과 마이 화면에 바로 반영했습니다.");
    } catch (error) {
      showToast("프로필을 수정하지 못했어요", errorMessageOf(error));
    } finally {
      setMutationBusy(false);
    }
  };

  const openCycleManager = () => {
    setCycleDraft(createCycleDraft(categories, presets));
    setCycleEditing(false);
    setSheet({
      kind: "cycle-manager",
      title: "관리할 카테고리",
      sub: "기존 주기를 수정하거나 서버 프리셋으로 새 주기를 추가할 수 있어요.",
    });
  };

  const saveCycles = async () => {
    setMutationBusy(true);
    try {
      for (const preset of presets) {
        const category = findCategoryForPreset(preset, categories);
        const draft = cycleDraft[preset.id];
        if (!draft) continue;
        if (category && !draft.enabled) {
          await deleteCategory(category.id);
          continue;
        }
        if (!category && draft.enabled) await createCategoryFromPreset(preset.id);
        if (category && draft.enabled && category.cycleDays !== draft.cycleDays) {
          await updateCategoryCycle(category.id, draft.cycleDays);
        }
      }
      await refreshCore();
      setCycleEditing(false);
      showToast("주기 관리를 저장했어요", "서버 데이터가 홈에 반영됐습니다.");
    } catch (error) {
      showToast("주기 저장에 실패했어요", errorMessageOf(error));
    } finally {
      setMutationBusy(false);
    }
  };

  const handleDemoDataReset = async () => {
    if (resetBusy) return;
    const confirmed = window.confirm(
      "시연 데이터를 시드 상태로 복구할까요? 현재 프로필, 완료 기록, 저장 상태, 커뮤니티 반응이 모두 초기화됩니다.",
    );
    if (!confirmed) return;

    setResetBusy(true);
    setSheet(null);
    setCycleEditing(false);
    try {
      const result = await resetDemoDataToSeed();
      const [homeData, presetData, userData, summaryData, logPage, selectionPage, savedData, tipsPage, qaPage] =
        await Promise.all([
          getHome(),
          getCategoryPresets(),
          getMe(),
          getMeSummary(),
          getCompletionLogs({ limit: PAGE_LIMIT }),
          getSelections({ limit: PAGE_LIMIT }),
          getSavedSelections(),
          getCommunityPosts({ type: "tips", limit: PAGE_LIMIT }),
          getCommunityPosts({ type: "qa", limit: PAGE_LIMIT }),
        ]);

      const mappedPresets = presetData.map(mapCategoryPreset);
      const mappedCategories = homeData.categories.map(mapCategory);
      const mappedSelections = selectionPage.items.map((item) => mapSelection(item, mappedPresets));
      const mappedTips = tipsPage.items.map(mapCommunitySummary);
      const mappedQa = qaPage.items.map(mapCommunitySummary);

      setHome(homeData);
      setUser(userData);
      setSummary(summaryData);
      setCategories(mappedCategories);
      setPresets(mappedPresets);
      setUnreadCount(homeData.unreadNotificationCount);
      setLogs(logPage.items.map((item) => mapCompletionLog(item, mappedCategories, mappedPresets)));
      setHistoryCursor(logPage.nextCursor);
      setSelections(mappedSelections);
      setSavedSelections(savedData.map((item) => mapSelection(item, mappedPresets)));
      setSelectionCursor(selectionPage.nextCursor);
      setSelectionFilter("all");
      setSelectionType("all");
      setCommunityPosts({ tips: mappedTips, qa: mappedQa });
      setCommunityCursor({ tips: tipsPage.nextCursor, qa: qaPage.nextCursor });
      setCommunityTags(Array.from(new Set([...mappedTips, ...mappedQa].map((post) => post.tag))).filter(Boolean));
      setCommunityTab("tips");
      setCommunityTag("all");
      setSavedCommunity([]);
      setActivePost(null);
      setComments([]);
      setCommentCursor(null);
      setSelectionDetail(null);
      setHistoryState("ready");
      setSelectionState("ready");
      setCommunityState("ready");
      setAppState("ready");
      setAppError("");
      showToast(
        "시드 데이터로 복구했어요",
        `주기 ${result.tableCounts.cleaning_categories ?? 0}개 · 기록 ${result.tableCounts.completion_logs ?? 0}건`,
      );
    } catch (error) {
      showToast("시드 복구에 실패했어요", errorMessageOf(error));
    } finally {
      setResetBusy(false);
    }
  };

  const changeSelectionFilter = (filter: string) => {
    setSelectionFilter(filter);
    void loadSelections(filter, selectionType, false);
  };

  const changeSelectionType = (type: SelectionTypeFilter) => {
    setSelectionType(type);
    void loadSelections(selectionFilter, type, false);
  };

  const changeCommunityTab = (tab: CommunityTab) => {
    setCommunityTab(tab);
    setCommunityTag("all");
    void loadCommunity(tab, "all", false);
  };

  const changeCommunityTag = (tag: string) => {
    setCommunityTag(tag);
    void loadCommunity(communityTab, tag, false);
  };

  const openHelp = (categoryName: string) => {
    const matchingTag = communityTags.find((tag) => categoryName.includes(tag) || tag.includes(categoryName)) ?? "all";
    setCommunityTab("tips");
    setCommunityTag(matchingTag);
    setView("community");
    void loadCommunity("tips", matchingTag, false);
  };

  const showBrandEntry = entryIntroHold || appState === "loading" || !entryIntroReady;

  return (
    <div className="flex min-h-dvh justify-center bg-[#DDEAF3] md:items-center md:py-5">
      <div className="relative min-h-dvh w-full max-w-[430px] overflow-hidden bg-background shadow-[0_24px_90px_rgba(46,75,102,0.22)] md:h-[min(900px,calc(100dvh-2.5rem))] md:min-h-[700px] md:rounded-[26px] md:border md:border-white/80" role="application" aria-label="비누">
        <header className="absolute inset-x-0 top-0 z-40 flex h-[74px] items-center justify-between border-b border-binu-line bg-background/90 px-5 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              className="size-10 shrink-0 rounded-[10px] shadow-[0_7px_18px_rgba(46,75,102,0.13)]"
              src={BRAND_ICON_SRC}
              alt=""
              width={40}
              height={40}
              priority
            />
            <div>
              <div className="text-lg font-black leading-tight tracking-[-0.03em] text-binu-navy">비누</div>
              <div className="mt-0.5 text-[10px] font-bold text-binu-muted">{BRAND_TAGLINE}</div>
            </div>
          </div>
          <Button className="relative" variant="quiet" size="icon-lg" type="button" aria-label="알림" onClick={() => void openNotifications()}>
            {unreadCount > 0 ? <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-[#D96A67]" /> : null}
            <Bell size={21} aria-hidden="true" />
          </Button>
        </header>

        <main className="absolute inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] top-[74px] overflow-hidden">
          {appState === "error" ? (
            <section className="view"><DataState state="error" error={appError}><span /></DataState></section>
          ) : null}
          {appState !== "error" && view === "home" ? (
            <HomeView
              state={appState}
              home={home}
              categories={sortedCategories}
              pendingId={pendingId}
              onComplete={completeCategory}
              onManageCycle={openCycleManager}
              onHelp={openHelp}
            />
          ) : null}
          {appState !== "error" && view === "selection" ? (
            <SelectionView
              state={selectionState}
              error={selectionError}
              items={selections}
              presets={presets}
              filter={selectionFilter}
              type={selectionType}
              nextCursor={selectionCursor}
              pendingId={pendingId}
              onFilter={changeSelectionFilter}
              onType={changeSelectionType}
              onToggleSave={(item) => void toggleSelectionSave(item)}
              onDetail={(item) => void openSelectionDetail(item)}
              onMore={() => void loadSelections(selectionFilter, selectionType, true)}
            />
          ) : null}
          {appState !== "error" && view === "community" ? (
            <CommunityView
              state={communityState}
              error={communityError}
              posts={communityPosts[communityTab]}
              tab={communityTab}
              tags={communityTags}
              tag={communityTag}
              nextCursor={communityCursor[communityTab]}
              onTab={changeCommunityTab}
              onTag={changeCommunityTag}
              onOpen={(id) => void openCommunityPost(id)}
              onMore={() => void loadCommunity(communityTab, communityTag, true)}
              presets={presets}
            />
          ) : null}
          {appState !== "error" && view === "community-detail" ? (
            <CommunityDetail
              state={detailState}
              error={communityError}
              post={activePost}
              comments={comments}
              presets={presets}
              busy={mutationBusy}
              hasMoreComments={Boolean(commentCursor)}
              onBack={() => setView("community")}
              onHelpful={() => void toggleHelpful()}
              onSave={() => void toggleCommunitySave()}
              onReply={(body) => void addReply(body)}
              onMoreComments={() => void loadMoreComments()}
              onOpenSelection={(tag) => {
                setView("selection");
                const category = presets.find((preset) => preset.name.includes(tag) || tag.includes(preset.name))?.name ?? "all";
                changeSelectionFilter(category);
              }}
            />
          ) : null}
          {appState !== "error" && view === "my" ? (
            <MyView
              state={appState}
              summary={summary}
              savedCommunityCount={[...communityPosts.tips, ...communityPosts.qa].filter((post) => post.saved).length}
              onProfile={() => setSheet({ kind: "profile", title: "프로필 수정", sub: "서버 프로필을 수정합니다." })}
              onManageCycle={openCycleManager}
              onHistory={() => setSheet({ kind: "history", title: "완료 히스토리", sub: "최신 완료부터 불러옵니다." })}
              onSaved={() => setSheet({ kind: "saved-selections", title: "저장한 셀렉션", sub: "서버에 저장한 항목입니다." })}
              onSavedCommunity={() => void openSavedCommunity()}
              resetBusy={resetBusy}
              onResetDemoData={() => void handleDemoDataReset()}
            />
          ) : null}
        </main>

        <nav className="absolute inset-x-0 bottom-0 z-50 grid h-[calc(72px+env(safe-area-inset-bottom,0px))] grid-cols-4 border-t border-binu-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom,0px)] pt-1.5 backdrop-blur-xl" aria-label="하단 네비게이션">
          {navigationItems.map(({ key, label, icon: Icon }) => {
            const active = view === key || (view === "community-detail" && key === "community");
            return (
              <button
                key={key}
                className={cn(
                  "relative grid place-items-center content-center gap-1 rounded-lg text-[10px] font-bold text-binu-muted transition hover:bg-binu-sky-soft/60 hover:text-binu-navy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-binu-sky/50",
                  active && "font-black text-binu-navy before:absolute before:top-0 before:h-[3px] before:w-6 before:rounded-full before:bg-binu-sky",
                )}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setView(key)}
              >
                <span className="grid place-items-center" aria-hidden="true"><Icon size={21} /></span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {appState !== "error" && view === "community" ? (
          <Button
            className="absolute bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-5 z-60 size-12 rounded-full shadow-[0_18px_44px_rgba(46,75,102,0.26)]"
            variant="binu"
            size="icon-lg"
            type="button"
            aria-label={communityTab === "qa" ? "질문 작성" : "팁 작성"}
            onClick={() => setSheet({
              kind: "community-composer",
              title: communityTab === "qa" ? "궁금한 청소 문제를 남겨요" : "내 청소 팁을 공유해요",
              sub: "작성한 내용은 서버 커뮤니티에 바로 등록됩니다.",
            })}
          >
            <PenLine size={22} aria-hidden="true" />
          </Button>
        ) : null}

        {sheet ? (
          <div className="absolute inset-0 z-80 flex items-end bg-binu-ink/35 backdrop-blur-[4px] animate-in fade-in duration-200 md:rounded-[26px]" role="dialog" aria-modal="true" aria-labelledby="sheetTitle" onClick={closeSheet}>
            <section className="max-h-[86%] w-full overflow-hidden rounded-t-[18px] border border-b-white/80 bg-background shadow-[0_-20px_70px_rgba(23,32,42,0.18)] animate-in slide-in-from-bottom-4 duration-300" onClick={(event) => event.stopPropagation()}>
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-binu-mist" />
              <header className="flex items-start justify-between gap-3 border-b border-binu-line bg-white/90 px-5 pb-3 pt-2">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-binu-muted">{sheet.kind === "notifications" ? "알림" : "마이 비누"}</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-binu-ink" id="sheetTitle">{sheet.title}</h2>
                  {sheet.sub ? <p className="mt-1 max-w-[250px] text-[10px] font-medium leading-5 text-binu-muted">{sheet.sub}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {sheet.kind === "notifications" && unreadCount > 0 ? (
                    <Button variant="binu" size="sm" type="button" onClick={() => void markAllNotificationsRead()}>모두 읽음</Button>
                  ) : null}
                  {sheet.kind === "cycle-manager" ? (
                    cycleEditing ? (
                      <Button variant="binu" size="sm" type="button" disabled={mutationBusy} onClick={() => void saveCycles()}>
                        {mutationBusy ? "저장 중" : "저장"}
                      </Button>
                    ) : (
                      <Button variant="binu" size="sm" type="button" onClick={() => setCycleEditing(true)}>주기 수정하기</Button>
                    )
                  ) : null}
                  <Button variant="quiet" size="icon-lg" type="button" aria-label="닫기" onClick={closeSheet}><X size={20} aria-hidden="true" /></Button>
                </div>
              </header>
              <div className="max-h-[calc(86dvh-92px)] overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4">
                {sheet.kind === "notifications" ? (
                  <NotificationList state={notificationState} error={notificationError} items={notifications} presets={presets} onRead={(item) => void markNotificationRead(item)} />
                ) : null}
                {sheet.kind === "history" ? (
                  <HistoryList state={historyState} error={historyError} logs={logs} hasMore={Boolean(historyCursor)} onMore={() => void loadHistory(true)} />
                ) : null}
                {sheet.kind === "saved-selections" ? (
                  <SavedSelectionList items={savedSelections} pendingId={pendingId} onToggle={(item) => void toggleSelectionSave(item)} onDetail={(item) => void openSelectionDetail(item)} />
                ) : null}
                {sheet.kind === "saved-community" ? (
                  <SavedCommunityList state={communityState} error={communityError} items={savedCommunity} presets={presets} onOpen={(id) => { setSheet(null); void openCommunityPost(id); }} />
                ) : null}
                {sheet.kind === "cycle-manager" ? (
                  <CycleManager categories={categories} presets={presets} draft={cycleDraft} editing={cycleEditing} busy={mutationBusy} onToggle={(id) => setCycleDraft((current) => ({ ...current, [id]: { ...current[id], enabled: !current[id]?.enabled } }))} onCycle={(id, days) => setCycleDraft((current) => ({ ...current, [id]: { ...current[id], cycleDays: days } }))} />
                ) : null}
                {sheet.kind === "selection-detail" ? (
                  <SelectionDetail state={detailState} error={selectionError} item={selectionDetail} pending={pendingId === selectionDetail?.id} onToggle={(item) => void toggleSelectionSave(item)} onExternal={(item, providerId) => void openExternalSelection(item, providerId)} />
                ) : null}
                {sheet.kind === "community-composer" ? (
                  <CommunityComposer tab={communityTab} tags={communityTags} presets={presets} busy={mutationBusy} onSubmit={(input) => void submitCommunityPost(input)} />
                ) : null}
                {sheet.kind === "profile" && user ? (
                  <ProfileForm user={user} busy={mutationBusy} onSubmit={(name, avatarText) => void saveProfile(name, avatarText)} />
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {toast ? (
          <div className="absolute bottom-[calc(82px+env(safe-area-inset-bottom,0px))] left-1/2 z-100 grid w-[calc(100%-2.5rem)] max-w-[360px] -translate-x-1/2 grid-cols-[auto_1fr] items-center gap-3 rounded-lg border border-white/20 bg-binu-navy/95 px-4 py-3 text-white shadow-[0_18px_50px_rgba(23,32,42,0.22)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2" role="status" aria-live="polite">
            <CheckCircle2 size={20} aria-hidden="true" />
            <div><strong className="block text-xs font-extrabold">{toast.title}</strong>{toast.desc ? <small className="mt-1 block text-[10px] text-white/70">{toast.desc}</small> : null}</div>
          </div>
        ) : null}

        {showBrandEntry ? (
          <BrandEntryLoader />
        ) : null}
      </div>
    </div>
  );
}

function HomeView({ state, home, categories, pendingId, onComplete, onManageCycle, onHelp }: {
  state: LoadState;
  home: ApiHome | null;
  categories: Category[];
  pendingId: string | null;
  onComplete: (id: string) => void;
  onManageCycle: () => void;
  onHelp: (name: string) => void;
}) {
  return (
    <section className="h-full overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <DataState state={state} empty={!home}>
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-binu-muted">Routine</span><h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-binu-ink">오늘의 홈케어</h2></div>
            <Button variant="quiet" size="sm" type="button" onClick={onManageCycle}><Settings2 size={15} aria-hidden="true" />주기 관리</Button>
          </div>
          <div className="grid gap-4">
            {categories.length ? categories.map((category) => <CategoryCard key={category.id} category={category} busy={pendingId === category.id} onComplete={onComplete} onHelp={onHelp} />) : <EmptyState title="켜둔 주기가 없습니다" desc="주기 관리에서 서버 프리셋을 추가해보세요." />}
          </div>
        </section>
      </DataState>
    </section>
  );
}

function CategoryCard({ category, busy, onComplete, onHelp }: { category: Category; busy: boolean; onComplete: (id: string) => void; onHelp: (name: string) => void }) {
  const key = statusKey(category);
  const status = key === "good" ? "good" : key === "soon" ? "soon" : "due";
  return <RoutineCard className="shadow-[0_18px_50px_rgba(46,75,102,0.08)]" title={category.name} description={category.note} cycleLabel={`주기 ${category.cycleDays}일`} status={status} statusLabel={category.status.label} actionLabel="했어요" secondaryLabel="도움 보기" iconSrc={iconPath(category.icon)} busy={busy} onAction={() => onComplete(category.id)} onSecondaryAction={() => onHelp(category.name)} />;
}

function SelectionView({ state, error, items, presets, filter, type, nextCursor, pendingId, onFilter, onType, onToggleSave, onDetail, onMore }: {
  state: LoadState; error: string; items: Selection[]; presets: CategoryPreset[]; filter: string; type: SelectionTypeFilter; nextCursor: string | null; pendingId: string | null;
  onFilter: (value: string) => void; onType: (value: SelectionTypeFilter) => void; onToggleSave: (item: Selection) => void; onDetail: (item: Selection) => void; onMore: () => void;
}) {
  return <section className="h-full overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <h1 className="sr-only">비누 픽</h1>
    <div className="relative h-[166px] overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-[0_18px_50px_rgba(46,75,102,0.12)]">
      <Image
        src="/binu/binu-pick-banner.png"
        alt="비누 픽의 정체성을 담은 홈케어 선택지 배너"
        fill
        priority
        sizes="390px"
        className="object-cover"
      />
    </div>
    <div className="mt-4 grid grid-cols-3 rounded-lg border border-binu-line bg-white p-1" role="tablist" aria-label="셀렉션 유형">
      {(["all", "product", "service"] as const).map((value) => <Button className="w-full" variant={type === value ? "binu-soft" : "ghost"} role="tab" aria-selected={type === value} key={value} type="button" onClick={() => onType(value)}>{value === "all" ? "전체" : value === "product" ? "용품" : "서비스"}</Button>)}
    </div>
    <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Button className="shrink-0 rounded-full" variant={filter === "all" ? "binu" : "quiet"} size="sm" type="button" onClick={() => onFilter("all")}>전체</Button>
      {presets.map((preset) => <Button className="shrink-0 rounded-full" variant={filter === preset.name ? "binu" : "quiet"} size="sm" key={preset.id} type="button" onClick={() => onFilter(preset.name)}>{preset.name}</Button>)}
    </div>
    <DataState state={state} error={error} empty={!items.length}>
      <div className="mt-4 grid gap-4">{items.map((item) => <SelectionCard key={item.id} item={item} pending={pendingId === item.id} onToggleSave={onToggleSave} onDetail={onDetail} />)}</div>
      {nextCursor ? <Button className="mt-4 w-full" variant="quiet" type="button" onClick={onMore}>더 불러오기</Button> : null}
    </DataState>
  </section>;
}

function SelectionCard({ item, pending, onToggleSave, onDetail }: { item: Selection; pending: boolean; onToggleSave: (item: Selection) => void; onDetail: (item: Selection) => void }) {
  if (item.type === "service" || item.type === "subscription") {
    return <ServiceCard title={item.title} description={item.reason} price={item.price} region={item.fitFor} review={item.reviews} rating={item.rating} source={item.affiliate} imageSrc={item.imageUrl} tags={item.tags} saved={item.saved} onSave={pending ? undefined : () => onToggleSave(item)} onOpen={() => onDetail(item)} />;
  }
  return <BinuPickCard className={cn(item.highlighted && "border-binu-sky")} title={item.title} description={item.reason} price={item.price} rating={`${item.rating} · ${item.reviews}`} source={`${item.category} · ${item.typeLabel}`} imageSrc={item.imageUrl ?? undefined} tags={item.tags} saved={item.saved} saveLabel={pending ? "처리 중" : "비누 노트"} openLabel="자세히 보기" onSave={pending ? undefined : () => onToggleSave(item)} onOpen={() => onDetail(item)} />;
}

function CommunityView({ state, error, posts, tab, tags, tag, nextCursor, onTab, onTag, onOpen, onMore, presets }: {
  state: LoadState; error: string; posts: CommunityPost[]; tab: CommunityTab; tags: string[]; tag: string; nextCursor: string | null; presets: CategoryPreset[];
  onTab: (tab: CommunityTab) => void; onTag: (tag: string) => void; onOpen: (id: string) => void; onMore: () => void;
}) {
  return <section className="h-full overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <div className="mb-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-binu-muted">Community</p><h1 className="mt-2 text-[27px] font-black leading-[1.25] tracking-[-0.04em] text-binu-ink">막히는 청소 문제는<br />함께 해결해요</h1><p className="mt-3 text-sm font-medium leading-7 text-binu-text">글과 반응, 댓글까지 서버에 차곡차곡 저장됩니다.</p></div>
    <div className="grid grid-cols-2 rounded-lg border border-binu-line bg-white p-1" role="tablist" aria-label="커뮤니티 분류"><Button className="w-full" variant={tab === "tips" ? "binu-soft" : "ghost"} role="tab" aria-selected={tab === "tips"} type="button" onClick={() => onTab("tips")}>꿀팁 공유</Button><Button className="w-full" variant={tab === "qa" ? "binu-soft" : "ghost"} role="tab" aria-selected={tab === "qa"} type="button" onClick={() => onTab("qa")}>Q&amp;A</Button></div>
    <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><Button className="shrink-0 rounded-full" variant={tag === "all" ? "binu" : "quiet"} size="sm" type="button" onClick={() => onTag("all")}>전체</Button>{tags.map((value) => <Button className="shrink-0 rounded-full" variant={tag === value ? "binu" : "quiet"} size="sm" key={value} type="button" onClick={() => onTag(value)}>#{value}</Button>)}</div>
    <DataState state={state} error={error} empty={!posts.length}>
      <div className="mt-4 grid gap-3">{posts.map((post) => <button className="w-full rounded-lg border border-binu-line bg-white p-4 text-left shadow-[0_14px_38px_rgba(46,75,102,0.06)] transition hover:border-binu-sky hover:shadow-[0_18px_42px_rgba(46,75,102,0.10)]" key={post.id} type="button" onClick={() => onOpen(post.id)}><div className="grid grid-cols-[64px_1fr] gap-3">{post.imageUrl ? <div className="relative h-16 overflow-hidden rounded-lg bg-binu-cream"><Image src={post.imageUrl} alt="" fill sizes="64px" className="object-cover" /></div> : <IconTile icon={iconForLabel(post.tag, presets)} size={64} />}<div className="min-w-0"><span className="inline-flex rounded-full border border-binu-line bg-binu-sky-soft px-2 py-1 text-[10px] font-extrabold text-binu-navy">{post.type === "qa" ? "Q&A" : "꿀팁"}</span><h3 className="mt-2 text-[15px] font-extrabold leading-6 text-binu-ink">{post.title}</h3><p className="mt-1 text-[10px] font-bold leading-5 text-binu-muted">#{post.tag} · {fmtRelativeDate(post.createdAt)} · 도움 {post.helpfulCount} · {post.type === "qa" ? "답변" : "댓글"} {post.replyCount}</p></div></div><p className="mt-4 text-xs font-medium leading-6 text-binu-text">{post.body}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-binu-navy">읽어보기 <ChevronRight size={15} aria-hidden="true" /></span></button>)}</div>
      {nextCursor ? <Button className="mt-4 w-full" variant="quiet" type="button" onClick={onMore}>더 불러오기</Button> : null}
    </DataState>
  </section>;
}

function CommunityDetail({ state, error, post, comments, presets, busy, hasMoreComments, onBack, onHelpful, onSave, onReply, onMoreComments, onOpenSelection }: {
  state: LoadState; error: string; post: CommunityPost | null; comments: ApiCommunityComment[]; presets: CategoryPreset[]; busy: boolean; hasMoreComments: boolean;
  onBack: () => void; onHelpful: () => void; onSave: () => void; onReply: (body: string) => void; onMoreComments: () => void; onOpenSelection: (tag: string) => void;
}) {
  return <section className="h-full overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><Button variant="ghost" size="sm" type="button" onClick={onBack}><ChevronLeft size={18} aria-hidden="true" />커뮤니티</Button><DataState state={state} error={error} empty={!post}>{post ? <Card className="mt-2 border-binu-line bg-white shadow-[0_18px_50px_rgba(46,75,102,0.08)]"><CardHeader><div className="grid grid-cols-[48px_1fr] gap-3"><IconTile icon={iconForLabel(post.tag, presets)} /><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-binu-muted">커뮤니티 · #{post.tag}</p><h1 className="mt-2 text-xl font-black leading-7 tracking-[-0.03em] text-binu-ink">{post.title}</h1><p className="mt-2 text-[10px] font-bold leading-5 text-binu-muted">{fmtRelativeDate(post.createdAt)} · 도움 {post.helpfulCount} · 저장 {post.savedCount} · {post.type === "qa" ? "답변" : "댓글"} {post.replyCount}</p></div></div></CardHeader><CardContent><Separator className="mb-4 bg-binu-line" />{post.imageUrl ? <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-binu-cream"><Image src={post.imageUrl} alt="" fill sizes="360px" className="object-cover" /></div> : null}<div className="flex gap-2"><Button variant={post.helped ? "binu-soft" : "quiet"} size="sm" type="button" disabled={busy} onClick={onHelpful}><ThumbsUp size={16} aria-hidden="true" />도움 {post.helpfulCount}</Button><Button variant={post.saved ? "binu-soft" : "quiet"} size="sm" type="button" disabled={busy} onClick={onSave}>{post.saved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}{post.saved ? "저장됨" : "저장"} {post.savedCount}</Button></div><InfoBlock title="내용">{post.body}</InfoBlock><Card size="sm" className="mt-3 border-binu-line bg-background shadow-none"><CardHeader><CardTitle className="text-xs font-extrabold text-binu-navy">{post.type === "qa" ? "답변" : "댓글"}</CardTitle></CardHeader><CardContent><form className="grid grid-cols-[1fr_auto] gap-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const body = String(form.get("reply") ?? "").trim(); if (body) { onReply(body); event.currentTarget.reset(); } }}><Input className="h-9 bg-white" name="reply" placeholder={post.type === "qa" ? "답변을 남겨주세요" : "댓글을 남겨주세요"} /><Button variant="binu" type="submit" disabled={busy} aria-label={post.type === "qa" ? "답변 등록" : "댓글 등록"}><Send size={16} aria-hidden="true" />{busy ? "저장 중" : "등록"}</Button></form><div className="mt-3 grid gap-2">{comments.length ? comments.map((comment) => <p className="rounded-lg border border-binu-line bg-white px-3 py-2 text-xs leading-6 text-binu-text" key={comment.id}><strong>{comment.authorName}{comment.authorIsMe ? " · 나" : ""}</strong><br />{comment.body}<br /><small className="text-binu-muted">{fmtRelativeDate(comment.createdAt)}</small></p>) : <p className="text-xs text-binu-muted">아직 등록된 {post.type === "qa" ? "답변" : "댓글"}이 없습니다.</p>}</div>{hasMoreComments ? <Button className="mt-3 w-full" variant="quiet" type="button" onClick={onMoreComments}>댓글 더 불러오기</Button> : null}</CardContent></Card><Card size="sm" className="mt-3 border-binu-line bg-background shadow-none"><CardHeader><CardTitle className="text-xs font-extrabold text-binu-navy">관련 비누 픽</CardTitle></CardHeader><CardContent><button className="grid w-full grid-cols-[34px_1fr_auto_auto] items-center gap-2 rounded-lg border border-binu-line bg-white p-2 text-left" type="button" onClick={() => onOpenSelection(post.tag)}><IconTile icon={iconForLabel(post.tag, presets)} size={34} /><span className="truncate text-[11px] font-bold text-binu-ink">#{post.tag} 관련 비누 픽 보기</span><strong className="text-[10px] font-extrabold text-binu-navy">이동</strong><ChevronRight className="size-4 text-binu-muted" aria-hidden="true" /></button></CardContent></Card></CardContent></Card> : null}</DataState></section>;
}

function MyView({ state, summary, savedCommunityCount, onProfile, onManageCycle, onHistory, onSaved, onSavedCommunity, resetBusy, onResetDemoData }: {
  state: LoadState; summary: ApiMeSummary | null; savedCommunityCount: number; onProfile: () => void; onManageCycle: () => void; onHistory: () => void; onSaved: () => void; onSavedCommunity: () => void; resetBusy: boolean; onResetDemoData: () => void;
}) {
  return <section className="h-full overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><DataState state={state} empty={!summary}>{summary ? <>
    <Card className="border-binu-line bg-[linear-gradient(145deg,#E7F1FB_0%,#FFFFFF_72%)] shadow-[0_18px_50px_rgba(46,75,102,0.08)]"><CardContent className="grid grid-cols-[60px_1fr_auto] items-center gap-4"><div className="grid size-15 place-items-center rounded-full border-4 border-white bg-binu-sky text-lg font-black text-binu-navy shadow-sm">{summary.profile.avatarText}</div><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-binu-muted">My Binu</p><h1 className="mt-2 text-xl font-black tracking-[-0.03em] text-binu-ink">{summary.profile.name}님의 비누 기록</h1><p className="mt-2 text-xs font-medium leading-6 text-binu-text">서버에 남은 작은 기록까지 차곡차곡 모아둘게요.</p></div><Button variant="quiet" size="icon-lg" type="button" aria-label="프로필 수정" onClick={onProfile}><Pencil size={18} aria-hidden="true" /></Button></CardContent></Card>
    <div className="mt-3 grid grid-cols-2 gap-2"><InfoTile value={summary.stats.monthlyCompletionCount} label="이번 달 완료" /><InfoTile value={summary.stats.categoryCount} label="사용 중인 주기" /><InfoTile value={summary.stats.savedSelectionCount} label="담은 비누 픽" /><InfoTile value={savedCommunityCount} label="저장한 글" /></div>
    <section className="mt-9"><div className="mb-4 flex items-end justify-between gap-3"><h2 className="text-xl font-black tracking-[-0.03em] text-binu-ink">최근 12주</h2><span className="text-xs font-bold text-binu-muted">서버 주간 완료 기록</span></div><Card className="border-binu-line bg-white shadow-none"><CardContent className="grid grid-cols-12 gap-1.5">{summary.weeklyFootprints.map((footprint, index) => <span title={`${footprint.weekStartDate}: ${footprint.completionCount}회`} className={cn("aspect-square rounded-[4px] bg-binu-mist", footprint.level === 1 && "bg-[#D8ECF9]", footprint.level === 2 && "bg-binu-sky", footprint.level === 3 && "bg-binu-navy", index === summary.weeklyFootprints.length - 1 && "outline-2 outline-offset-2 outline-binu-navy")} key={footprint.weekStartDate} />)}</CardContent></Card></section>
    <section className="mt-9"><div className="mb-4"><h2 className="text-xl font-black tracking-[-0.03em] text-binu-ink">비누 노트와 설정</h2></div><Card className="gap-0 border-binu-line bg-white py-0 shadow-none"><MenuRow icon={History} label="비누 기록" detail={`이번 달 ${summary.stats.monthlyCompletionCount}개`} onClick={onHistory} /><MenuRow icon={BookmarkCheck} label="저장한 비누 픽" detail={`${summary.stats.savedSelectionCount}개 담김`} onClick={onSaved} /><MenuRow icon={MessageSquareHeart} label="저장한 커뮤니티" detail="서버에서 조회" onClick={onSavedCommunity} /><MenuRow icon={CalendarClock} label="주기 관리" detail={`${summary.stats.categoryCount}개 사용 중`} onClick={onManageCycle} /></Card></section>
    <div className="mt-5 flex justify-end pr-1"><button className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-extrabold uppercase text-binu-muted/45 transition hover:bg-white hover:text-[#B94A48] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-binu-sky/50 disabled:opacity-40" type="button" aria-label="시드 데이터 복구" disabled={resetBusy} onClick={onResetDemoData}><RefreshCcw className={cn("size-3", resetBusy && "animate-spin")} aria-hidden="true" />{resetBusy ? "복구 중" : "seed reset"}</button></div>
  </> : null}</DataState></section>;
}

function MenuRow({ icon: Icon, label, detail, onClick }: { icon: typeof History; label: string; detail: string; onClick?: () => void }) {
  return <button className="grid min-h-14 w-full grid-cols-[34px_1fr_auto_auto] items-center gap-3 border-b border-binu-line px-3 py-2 text-left transition last:border-b-0 hover:bg-binu-sky-soft/50" type="button" onClick={onClick}><span className="grid size-[34px] place-items-center rounded-lg bg-binu-sky-soft text-binu-navy" aria-hidden="true"><Icon size={18} /></span><span className="text-xs font-extrabold text-binu-ink">{label}</span><strong className="text-[10px] font-bold text-binu-muted">{detail}</strong><ChevronRight className="size-4 text-binu-muted" aria-hidden="true" /></button>;
}

function NotificationList({ state, error, items, presets, onRead }: { state: LoadState; error: string; items: ApiNotification[]; presets: CategoryPreset[]; onRead: (item: ApiNotification) => void }) {
  return <DataState state={state} error={error} empty={!items.length}><div className="grid gap-3">{items.map((item) => <button className="grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border border-binu-line bg-white p-3 text-left transition hover:border-binu-sky hover:bg-binu-sky-soft/40" key={item.id} type="button" onClick={() => onRead(item)}><IconTile icon={iconForLabel(item.categoryName ?? "", presets)} size={40} /><div className="min-w-0"><strong className="block text-xs font-extrabold text-binu-ink">{item.title}{item.isRead ? "" : " · 새 알림"}</strong><span className="mt-1 block text-[10px] font-medium leading-5 text-binu-text">{item.body}</span></div><small className="text-[9px] font-bold text-binu-muted">{fmtRelativeDate(item.createdAt)}</small></button>)}</div></DataState>;
}

function HistoryList({ state, error, logs, hasMore, onMore }: { state: LoadState; error: string; logs: CompletionLog[]; hasMore: boolean; onMore: () => void }) {
  return <DataState state={state} error={error} empty={!logs.length}><div className="grid gap-3">{logs.map((log) => <Card className="border-binu-line bg-white shadow-none" key={log.id}><CardContent className="grid grid-cols-[42px_1fr] items-center gap-3"><IconTile icon={log.icon} size={42} /><div className="min-w-0"><strong className="block text-xs font-extrabold text-binu-ink">{log.categoryName}</strong><span className="mt-1 block text-[10px] font-bold text-binu-muted">{fmtDate(log.completedAt)}</span></div></CardContent></Card>)}{hasMore ? <Button variant="quiet" type="button" onClick={onMore}>이전 기록 더 불러오기</Button> : null}</div></DataState>;
}

function SavedSelectionList({ items, pendingId, onToggle, onDetail }: { items: Selection[]; pendingId: string | null; onToggle: (item: Selection) => void; onDetail: (item: Selection) => void }) {
  return items.length ? <div className="grid gap-4">{items.map((item) => <SelectionCard key={item.id} item={item} pending={pendingId === item.id} onToggleSave={onToggle} onDetail={onDetail} />)}</div> : <EmptyState title="담은 비누 픽이 없습니다" desc="비누 픽에서 담기를 누르면 서버에 저장됩니다." />;
}

function SavedCommunityList({ state, error, items, presets, onOpen }: { state: LoadState; error: string; items: CommunityPost[]; presets: CategoryPreset[]; onOpen: (id: string) => void }) {
  return <DataState state={state} error={error} empty={!items.length}><div className="grid gap-3">{items.map((post) => <button className="grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border border-binu-line bg-white p-3 text-left transition hover:border-binu-sky hover:bg-binu-sky-soft/40" key={post.id} type="button" onClick={() => onOpen(post.id)}>{post.imageUrl ? <span className="relative h-10 overflow-hidden rounded-lg bg-binu-cream"><Image src={post.imageUrl} alt="" fill sizes="40px" className="object-cover" /></span> : <IconTile icon={iconForLabel(post.tag, presets)} size={40} />}<div className="min-w-0"><strong className="block truncate text-xs font-extrabold text-binu-ink">{post.title}</strong><span className="mt-1 block text-[10px] font-bold text-binu-muted">#{post.tag} · 도움 {post.helpfulCount} · 저장 {post.savedCount}</span></div><ChevronRight className="size-4 text-binu-muted" aria-hidden="true" /></button>)}</div></DataState>;
}

function CycleManager({ categories, presets, draft, editing, busy, onToggle, onCycle }: { categories: Category[]; presets: CategoryPreset[]; draft: CycleDraft; editing: boolean; busy: boolean; onToggle: (id: string) => void; onCycle: (id: string, days: number) => void }) {
  return <div className="grid gap-3">{presets.map((preset) => { const active = findCategoryForPreset(preset, categories); const item = draft[preset.id]; const enabled = editing ? Boolean(item?.enabled) : Boolean(active); const days = editing ? item?.cycleDays ?? preset.defaultCycle : active?.cycleDays ?? preset.defaultCycle; const canChange = editing && enabled && !busy; const stateText = active ? enabled ? "서버에 저장됨" : "저장하면 꺼짐" : enabled ? "저장하면 서버에 추가됨" : "아직 추가되지 않음"; return <Card className={cn("border-binu-line bg-white shadow-none", enabled && "border-binu-sky bg-[linear-gradient(135deg,#FFFFFF,#E7F1FB)]", editing && !enabled && "bg-white/70")} key={preset.id}><CardContent className="grid grid-cols-[42px_1fr_auto] items-start gap-3"><IconTile icon={preset.icon} size={42} /><div className="min-w-0"><strong className="block text-sm font-extrabold text-binu-ink">{preset.name}</strong><span className="mt-1 block text-[10px] font-medium leading-5 text-binu-muted">{stateText} · {days}일 주기 · {preset.note}</span>{editing && enabled ? <div className="mt-3 grid grid-cols-[28px_1fr_28px] items-center gap-1.5"><Button variant="quiet" size="icon-sm" type="button" aria-label={`${preset.name} 주기 줄이기`} disabled={!canChange || days === ALLOWED_CYCLE_DAYS[0]} onClick={() => onCycle(preset.id, stepCycleDays(days, -1))}><Minus size={15} aria-hidden="true" /></Button><div className="grid grid-cols-5 gap-1" role="group" aria-label={`${preset.name} 주기 선택`}>{ALLOWED_CYCLE_DAYS.map((value) => <Button key={value} className="px-0" variant={value === days ? "binu" : "quiet"} size="icon-sm" type="button" disabled={!canChange} onClick={() => onCycle(preset.id, value)}>{value}</Button>)}</div><Button variant="quiet" size="icon-sm" type="button" aria-label={`${preset.name} 주기 늘리기`} disabled={!canChange || days === ALLOWED_CYCLE_DAYS[ALLOWED_CYCLE_DAYS.length - 1]} onClick={() => onCycle(preset.id, stepCycleDays(days, 1))}><Plus size={15} aria-hidden="true" /></Button></div> : null}</div><button className={cn("relative h-[22px] w-[38px] rounded-full bg-binu-mist transition disabled:opacity-70", enabled && "bg-binu-navy")} type="button" role="switch" aria-checked={enabled} aria-label={`${preset.name} ${enabled ? "끄기" : "켜기"}`} disabled={!editing || busy} onClick={() => onToggle(preset.id)}><span className={cn("absolute left-[3px] top-[3px] size-4 rounded-full bg-white shadow-sm transition", enabled && "translate-x-4")} /></button></CardContent></Card>; })}</div>;
}

function SelectionDetail({ state, error, item, pending, onToggle, onExternal }: { state: LoadState; error: string; item: Selection | null; pending: boolean; onToggle: (item: Selection) => void; onExternal: (item: Selection, providerId?: string) => void }) {
  return <DataState state={state} error={error} empty={!item}>{item ? <div className="grid gap-3">{item.imageUrl ? <div className="relative aspect-video overflow-hidden rounded-lg bg-binu-cream"><Image src={item.imageUrl} alt="" fill sizes="360px" className="object-cover" /></div> : null}<Card className="border-binu-line bg-white shadow-none"><CardContent className="grid grid-cols-[48px_1fr] items-center gap-3"><IconTile icon={item.icon} /><div className="min-w-0"><strong className="block text-sm font-extrabold text-binu-ink">{item.title}</strong><span className="mt-1 block text-xs font-bold text-binu-navy">{item.price}</span></div></CardContent></Card><div className="grid grid-cols-3 gap-2"><DetailMetric label="가격" value={item.price} /><DetailMetric label="후기" value={`${item.rating} · ${item.reviews}`} icon={<Star className="size-3 fill-[#F2C35E] text-[#F2C35E]" aria-hidden="true" />} /><DetailMetric label="연결 정보" value={item.affiliate} /></div><InfoBlock title="추천 이유">{item.reason}</InfoBlock><InfoBlock title="맞는 상황">{item.fitFor}</InfoBlock><Card size="sm" className="border-binu-line bg-background shadow-none"><CardHeader><CardTitle className="text-xs font-extrabold text-binu-navy">확인할 점</CardTitle></CardHeader><CardContent>{item.checks.length ? <ul className="list-disc space-y-1 pl-4 text-xs leading-6 text-binu-text">{item.checks.map((check) => <li key={check}>{check}</li>)}</ul> : <p className="text-xs text-binu-muted">서버에 등록된 확인 항목이 없습니다.</p>}</CardContent></Card>{item.notice ? <InfoBlock title="외부 보기 고지">{item.notice}</InfoBlock> : null}{item.providers.length ? <Card size="sm" className="border-binu-line bg-background shadow-none"><CardHeader><CardTitle className="text-xs font-extrabold text-binu-navy">제공처</CardTitle></CardHeader><CardContent className="grid gap-2">{item.providers.map((provider) => <button className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-binu-line bg-white p-3 text-left" key={provider.id} type="button" onClick={() => onExternal(item, provider.id)}><span className="min-w-0"><strong className="block text-xs text-binu-ink">{provider.name}</strong><small className="text-[10px] text-binu-muted">{provider.note}</small></span><strong className="text-[10px] text-binu-navy">{provider.priceText}</strong><ExternalLink size={16} aria-hidden="true" /></button>)}</CardContent></Card> : null}<div className="grid grid-cols-2 gap-2"><Button variant={item.saved ? "binu-soft" : "quiet"} type="button" disabled={pending} onClick={() => onToggle(item)}>{item.saved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}{item.saved ? "담김" : "담기"}</Button><Button variant="binu" type="button" onClick={() => onExternal(item)}><ExternalLink size={16} aria-hidden="true" />외부 보기</Button></div></div> : null}</DataState>;
}

function CommunityComposer({ tab, tags, presets, busy, onSubmit }: { tab: CommunityTab; tags: string[]; presets: CategoryPreset[]; busy: boolean; onSubmit: (input: { title: string; tag: string; body: string }) => void }) {
  const options = Array.from(new Set([...tags, ...presets.map((preset) => preset.name)]));
  return <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const title = String(form.get("title") ?? "").trim(); const tag = String(form.get("tag") ?? "").trim(); const body = String(form.get("body") ?? "").trim(); if (title && tag && body) onSubmit({ title, tag, body }); }}><label className="grid gap-2 text-xs font-extrabold text-binu-ink"><span>태그</span><select className="h-10 w-full rounded-lg border border-binu-mist bg-white px-3 text-sm text-binu-ink outline-none focus:border-binu-sky focus:ring-3 focus:ring-binu-sky/40" name="tag" required defaultValue=""><option value="" disabled>태그 선택</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label><label className="grid gap-2 text-xs font-extrabold text-binu-ink"><span>{tab === "qa" ? "질문 제목" : "팁 제목"}</span><Input name="title" required maxLength={160} /></label><label className="grid gap-2 text-xs font-extrabold text-binu-ink"><span>내용</span><Textarea name="body" required maxLength={2000} /></label><Button variant="binu" type="submit" disabled={busy}>{busy ? "등록 중" : "서버에 등록하기"}</Button></form>;
}

function ProfileForm({ user, busy, onSubmit }: { user: ApiUser; busy: boolean; onSubmit: (name: string, avatarText: string) => void }) {
  return <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSubmit(String(form.get("name") ?? ""), String(form.get("avatarText") ?? "")); }}><label className="grid gap-2 text-xs font-extrabold text-binu-ink"><span>이름</span><Input name="name" required minLength={1} maxLength={40} defaultValue={user.name} /></label><label className="grid gap-2 text-xs font-extrabold text-binu-ink"><span>아바타 글자</span><Input name="avatarText" required minLength={1} maxLength={4} defaultValue={user.avatarText} /></label><Button variant="binu" type="submit" disabled={busy}>{busy ? "저장 중" : "프로필 저장"}</Button></form>;
}

function InfoTile({ value, label }: { value: string | number; label: string }) {
  return <Card className="min-h-20 border-binu-line bg-white shadow-none"><CardContent className="flex h-full flex-col justify-between"><strong className="block truncate text-lg font-black text-binu-navy">{value}</strong><span className="mt-2 block text-[10px] font-bold leading-4 text-binu-muted">{label}</span></CardContent></Card>;
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card size="sm" className="mt-3 border-binu-line bg-background shadow-none"><CardHeader><CardTitle className="text-xs font-extrabold text-binu-navy">{title}</CardTitle></CardHeader><CardContent><p className="text-xs leading-6 text-binu-text">{children}</p></CardContent></Card>;
}

function DetailMetric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <Card size="sm" className="border-binu-line bg-white shadow-none"><CardContent className="min-w-0"><span className="block text-[9px] font-bold text-binu-muted">{label}</span><strong className="mt-1 flex items-center gap-1 truncate text-[10px] font-extrabold text-binu-navy">{icon}{value}</strong></CardContent></Card>;
}
