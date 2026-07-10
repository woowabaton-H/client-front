import type {
  ApiCategory,
  ApiCategoryPreset,
  ApiCommunityPostDetail,
  ApiCommunityPostSummary,
  ApiCompletionLog,
  ApiSelection,
} from "@/lib/cleanloop-api";

export type Category = {
  id: string;
  name: string;
  icon: string;
  cycleDays: number;
  lastDoneAt: string;
  nextDueAt: string;
  note: string;
  status: ApiCategory["status"];
};

export type CategoryPreset = {
  id: string;
  name: string;
  icon: string;
  defaultCycle: number;
  note: string;
};

export type CompletionLog = {
  id: string;
  categoryId: string | null;
  categoryName: string;
  completedAt: string;
  icon: string;
};

export type Selection = {
  id: string;
  type: string;
  typeLabel: string;
  category: string;
  icon: string;
  title: string;
  label: string;
  highlighted: boolean;
  price: string;
  affiliate: string;
  imageUrl: string | null;
  rating: string;
  reviews: string;
  tags: string[];
  reason: string;
  fitFor: string;
  notice: string | null;
  checks: string[];
  saved: boolean;
  providers: ApiSelection["providers"];
};

export type CommunityPost = {
  id: string;
  type: "tips" | "qa";
  title: string;
  tag: string;
  body: string;
  helpfulCount: number;
  replyCount: number;
  savedCount: number;
  popular: boolean;
  saved: boolean;
  helped: boolean;
  createdAt: string;
};

export const mapCategory = (category: ApiCategory): Category => ({
  id: category.id,
  name: category.name,
  icon: category.icon,
  cycleDays: category.cycleDays,
  lastDoneAt: category.lastDoneAt,
  nextDueAt: category.nextDueAt,
  note: category.note,
  status: category.status,
});

export const mapCategoryPreset = (preset: ApiCategoryPreset): CategoryPreset => ({
  id: preset.key,
  name: preset.name,
  icon: preset.icon,
  defaultCycle: preset.cycleDays,
  note: preset.note,
});

function includesLabel(a: string, b: string) {
  const left = a.replaceAll("/", "");
  const right = b.replaceAll("/", "");
  return left.includes(right) || right.includes(left);
}

export function iconForLabel(label: string, presets: CategoryPreset[]) {
  return presets.find((preset) => includesLabel(preset.name, label))?.icon ?? presets[0]?.icon ?? "";
}

export function mapCompletionLog(log: ApiCompletionLog, categories: Category[], presets: CategoryPreset[]): CompletionLog {
  return {
    id: log.id,
    categoryId: log.categoryId,
    categoryName: log.categoryName,
    completedAt: log.completedAt,
    icon:
      categories.find((category) => category.id === log.categoryId || category.name === log.categoryName)?.icon ??
      iconForLabel(log.categoryName, presets),
  };
}

export function mapSelection(selection: ApiSelection, presets: CategoryPreset[]): Selection {
  return {
    id: selection.id,
    type: selection.type,
    typeLabel: selection.typeLabel,
    category: selection.category,
    icon: iconForLabel(selection.category, presets),
    title: selection.title,
    label: selection.label,
    highlighted: selection.isHighlighted,
    price: selection.priceText,
    affiliate: selection.affiliateText,
    imageUrl: selection.imageUrl,
    rating: selection.ratingText,
    reviews: selection.reviewCountText,
    tags: selection.tags,
    reason: selection.reason,
    fitFor: selection.fitFor,
    notice: selection.notice ?? null,
    checks: selection.checks ?? [],
    saved: selection.isSaved,
    providers: selection.providers,
  };
}

export function mapCommunitySummary(post: ApiCommunityPostSummary): CommunityPost {
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    tag: post.tag,
    body: post.bodyPreview,
    helpfulCount: post.helpfulCount,
    replyCount: post.type === "qa" ? post.answersCount : post.commentsCount,
    savedCount: post.savedCount,
    popular: post.isPopular,
    saved: post.isSaved,
    helped: false,
    createdAt: post.createdAt,
  };
}

export function mapCommunityDetail(post: ApiCommunityPostDetail): CommunityPost {
  return {
    id: post.id,
    type: post.type,
    title: post.title,
    tag: post.tag,
    body: post.body,
    helpfulCount: post.helpfulCount,
    replyCount: post.type === "qa" ? post.answersCount : post.commentsCount,
    savedCount: post.savedCount,
    popular: false,
    saved: post.isSaved,
    helped: post.hasMarkedHelpful,
    createdAt: post.createdAt,
  };
}
