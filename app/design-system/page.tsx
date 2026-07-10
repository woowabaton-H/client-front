import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import {
  Bell,
  Bookmark,
  CalendarCheck2,
  ChevronRight,
  Droplets,
  Heart,
  Home,
  Info,
  Leaf,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import {
  BinuPickCard,
  EmptyState,
  RoutineCard,
  ServiceCard,
  StatusBadge,
} from "@/components/binu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const colors = [
  {
    name: "binu-sky",
    value: "#A7D4F3",
    role: "주요 CTA, 진행 상태, 긍정적 강조",
    className: "bg-binu-sky",
  },
  {
    name: "binu-sky-soft",
    value: "#E7F1FB",
    role: "선택된 탭, 정보 카드, 부드러운 배경",
    className: "bg-binu-sky-soft",
  },
  {
    name: "binu-cream",
    value: "#FFF7F0",
    role: "추천 용품, 휴식감, 완료 후 안정감",
    className: "bg-binu-cream",
  },
  {
    name: "binu-mist",
    value: "#DEE7EF",
    role: "구분선, 비활성 배경, 차분한 표면",
    className: "bg-binu-mist",
  },
  {
    name: "binu-navy",
    value: "#2E4B66",
    role: "로고, 제목, 핵심 아이콘, 주요 버튼",
    className: "bg-binu-navy",
  },
];

const keywords = ["Cleaning", "Care", "Light", "Routine", "Trust", "Relax"];

const serviceFlow = [
  {
    title: "비우는 루틴",
    body: "청소 주기 관리, 알림 & 체크",
    icon: CalendarCheck2,
  },
  {
    title: "알맞은 정보",
    body: "공간별 청소 팁, 용품 추천",
    icon: ShoppingBag,
  },
  {
    title: "필요할 땐 연결",
    body: "검증된 청소, 서비스 연결",
    icon: ShieldCheck,
  },
  {
    title: "누리는 하루",
    body: "더 가벼워진 집, 여유로운 일상",
    icon: Heart,
  },
];

const copyRules = [
  {
    situation: "루틴 알림",
    good: "이번 주에 욕실을 한 번 챙겨볼까요?",
    avoid: "욕실 청소가 늦었어요.",
  },
  {
    situation: "완료 후",
    good: "다음 욕실 루틴을 2주 뒤로 잡아둘게요.",
    avoid: "완료했습니다.",
  },
  {
    situation: "서비스 연결",
    good: "이번 주가 바쁘다면 맡기는 선택지도 있어요.",
    avoid: "청소 대행을 예약하세요.",
  },
];

const phoneItems = [
  { label: "욕실", icon: Droplets },
  { label: "주방", icon: Sparkles },
  { label: "가전", icon: Leaf },
  { label: "저장", icon: Heart },
];

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-[#DDEAF3] text-foreground">
      <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-background shadow-[0_24px_90px_rgba(46,75,102,0.22)]">
        <section className="relative overflow-hidden border-b border-binu-line bg-[linear-gradient(155deg,#F7FBFE_0%,#FFFFFF_48%,#FFF7F0_100%)]">
          <div className="absolute left-[-140px] top-[-120px] size-72 rounded-full bg-binu-sky-soft/80 blur-3xl" />
          <div className="relative z-10 px-5 pb-8 pt-7">
            <Badge
              variant="outline"
              className="mb-5 w-fit rounded-full border-binu-sky bg-white px-3 py-1 text-[11px] font-extrabold text-binu-navy"
            >
              Mobile Design System
            </Badge>
            <h1 className="text-[34px] font-black leading-[1.14] tracking-normal text-binu-ink">
              비우는 루틴,
              <br />
              누리는 하루.
            </h1>
            <p className="mt-4 text-[15px] font-medium leading-7 text-binu-text">
              집안일의 부담을 덜고 자기 시간을 되찾게 하는 홈케어 플랫폼. 이
              페이지는 비누의 철학, 톤앤매너, 토큰, 컴포넌트를 실제 Next 모바일
              구현에 바로 가져다 쓸 수 있게 정리한 기준입니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-binu-line bg-white px-3 py-1.5 text-xs font-bold text-binu-navy"
                >
                  {keyword}
                </span>
              ))}
            </div>
            <figure className="mt-7 overflow-hidden rounded-[22px] border border-white bg-white shadow-[0_20px_60px_rgba(46,75,102,0.16)]">
              <Image
                src="/binu/brand-board.png"
                alt="비누 브랜드 콘셉트 보드"
                width={1149}
                height={1369}
                priority
                className="h-auto w-full"
              />
            </figure>
          </div>
        </section>

        <section className="px-5 py-7">
          <Tabs defaultValue="foundation" className="gap-7">
            <TabsList className="sticky top-0 z-20 -mx-5 flex w-[calc(100%+2.5rem)] max-w-none justify-start gap-2 overflow-x-auto rounded-none border-x-0 border-b border-t border-binu-line bg-white/95 px-5 py-2 shadow-sm backdrop-blur group-data-horizontal/tabs:h-auto">
              <TabsTrigger value="foundation" className="h-9 shrink-0 px-4">
                Foundations
              </TabsTrigger>
              <TabsTrigger value="components" className="h-9 shrink-0 px-4">
                Components
              </TabsTrigger>
              <TabsTrigger value="patterns" className="h-9 shrink-0 px-4">
                Patterns
              </TabsTrigger>
              <TabsTrigger value="voice" className="h-9 shrink-0 px-4">
                Voice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="foundation" className="space-y-8">
              <SectionIntro
                eyebrow="Foundation"
                title="밝고 차분한 집의 공기"
                body="비누의 표면은 깨끗하지만 차갑지 않아야 합니다. 화이트와 미스트 블루를 기준으로 두고, 크림 컬러로 생활의 온도를 보완합니다."
              />

              <div className="grid grid-cols-2 gap-3">
                {colors.map((color) => (
                  <div
                    key={color.name}
                    className="overflow-hidden rounded-lg border border-binu-line bg-white"
                  >
                    <div className={`h-20 ${color.className}`} />
                    <div className="space-y-2 p-4">
                      <div>
                        <p className="text-sm font-extrabold text-binu-ink">
                          {color.name}
                        </p>
                        <p className="font-mono text-xs font-bold text-binu-muted">
                          {color.value}
                        </p>
                      </div>
                      <p className="text-xs leading-5 text-binu-text">
                        {color.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-5">
                <div className="rounded-lg border border-binu-line bg-white p-6">
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-binu-muted">
                    Typography
                  </p>
                  <div className="mt-6 space-y-6">
                    <TypeSample
                      label="Display / 34px / 900"
                      className="text-[34px] font-black leading-tight text-binu-ink"
                    >
                      가벼운 집, 여유로운 나.
                    </TypeSample>
                    <TypeSample
                      label="Title / 24px / 800"
                      className="text-2xl font-extrabold leading-snug text-binu-ink"
                    >
                      오늘 챙기면 좋은 루틴
                    </TypeSample>
                    <TypeSample
                      label="Body / 16px / 500"
                      className="text-base font-medium leading-8 text-binu-text"
                    >
                      사용자가 기억해야 했던 집안일의 주기를 비우고, 정돈된
                      생활과 자기 시간을 자연스럽게 누리게 합니다.
                    </TypeSample>
                    <TypeSample
                      label="Caption / 12px / 700"
                      className="text-xs font-bold leading-5 text-binu-muted"
                    >
                      알림은 압박보다 기억 보조에 가깝게 설계합니다.
                    </TypeSample>
                  </div>
                </div>

                <div className="rounded-lg border border-binu-line bg-binu-sky-soft p-6">
                  <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-binu-muted">
                    Surface
                  </p>
                  <div className="mt-6 grid gap-3">
                    <SurfaceRule
                      title="Base"
                      body="페이지 배경은 #F7FBFE 또는 white를 사용합니다."
                    />
                    <SurfaceRule
                      title="Card"
                      body="카드는 흰색 표면, 8px radius, 얕은 그림자를 기본으로 합니다."
                    />
                    <SurfaceRule
                      title="Accent"
                      body="추천 용품과 휴식 맥락에는 #FFF7F0를 제한적으로 씁니다."
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-8">
              <SectionIntro
                eyebrow="Components"
                title="shadcn primitives 위에 얹는 비누의 언어"
                body="버튼, 카드, 배지, 입력창은 shadcn을 기반으로 하되 비누의 브랜드 토큰과 카피 원칙을 반영합니다."
              />

              <div className="grid gap-5">
                <div className="space-y-4 rounded-lg border border-binu-line bg-white p-6">
                  <h2 className="text-xl font-extrabold text-binu-ink">
                    Buttons
                  </h2>
                  <p className="text-sm leading-6 text-binu-text">
                    주요 행동은 navy, 보조 행동은 soft blue, 추천/휴식 맥락은
                    cream을 사용합니다.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="binu">완료했어요</Button>
                    <Button variant="binu-soft">루틴 확인하기</Button>
                    <Button variant="cream">비누 픽 보기</Button>
                    <Button variant="quiet">주기 조정</Button>
                    <Button variant="outline">저장하기</Button>
                    <Button variant="ghost">나중에</Button>
                    <Button variant="binu" disabled>
                      대기 중
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="quiet" size="icon" aria-label="알림">
                          <Bell className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>루틴 알림</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border border-binu-line bg-white p-6">
                  <h2 className="text-xl font-extrabold text-binu-ink">
                    Badges
                  </h2>
                  <p className="text-sm leading-6 text-binu-text">
                    상태는 사용자를 재촉하지 않고, 지금 어떤 선택지가 있는지
                    알려주는 역할을 합니다.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="due">오늘 챙기면 좋아요</StatusBadge>
                    <StatusBadge tone="soon">곧 챙길 시점이에요</StatusBadge>
                    <StatusBadge tone="good">아직 여유 있어요</StatusBadge>
                    <StatusBadge tone="done">오늘은 비웠어요</StatusBadge>
                    <StatusBadge tone="service">필요할 땐 연결</StatusBadge>
                    <StatusBadge tone="note">비누 노트</StatusBadge>
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                <RoutineCard
                  title="욕실 청소가 필요해요"
                  description="물때와 습기만 잡아도 관리가 쉬워져요."
                  schedule="마지막 완료 14일 전"
                  progress={82}
                  status="due"
                  statusLabel="오늘 챙기면 좋아요"
                />
                <BinuPickCard
                  title="욕실 스퀴지 세트"
                  description="샤워 후 벽면과 거울 물기를 빠르게 밀어내는 기본 도구"
                  price="8,900원대"
                  rating="4.6"
                  source="추천 용품"
                  tags={["물때", "물기 제거", "욕실"]}
                />
                <ServiceCard
                  title="욕실 청소 전문가"
                  description="바쁜 주에는 제공 범위와 후기를 비교한 뒤 맡기는 선택지도 함께 보여줍니다."
                  price="49,000원대"
                  region="서울/경기 일부 가능"
                  review="꼼꼼하고 시간 약속이 좋았어요."
                />
              </div>

              <div className="grid gap-5">
                <div className="rounded-lg border border-binu-line bg-white p-6">
                  <h2 className="text-xl font-extrabold text-binu-ink">
                    Inputs
                  </h2>
                  <div className="mt-5 grid gap-3">
                    <Input placeholder="예: 빨래 냄새가 계속 남아요" />
                    <Textarea placeholder="상황, 사용한 세제, 소재를 적어주면 더 정확한 답변을 받을 수 있어요." />
                    <Button variant="binu" className="w-fit">
                      질문 남기기
                      <MessageCircleQuestion className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border border-binu-line bg-white p-6">
                  <h2 className="text-xl font-extrabold text-binu-ink">
                    Empty State
                  </h2>
                  <EmptyState
                    className="mt-5"
                    title="아직 저장한 비누 노트가 없어요"
                    description="도움이 된 글이나 선택지를 저장하면 막히는 순간 여기서 다시 볼 수 있어요."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="space-y-8">
              <SectionIntro
                eyebrow="Patterns"
                title="루틴에서 정보, 필요할 땐 연결까지"
                body="비누의 화면은 사용자가 집안일을 떠올리는 순간부터 저장과 회고까지 이어지는 흐름을 유지해야 합니다."
              />

              <div className="grid gap-3">
                {serviceFlow.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="relative rounded-lg border border-binu-line bg-white p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="grid size-11 place-items-center rounded-lg bg-binu-sky-soft text-binu-navy">
                          <Icon className="size-5" />
                        </div>
                        <span className="font-mono text-xs font-bold text-binu-muted">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-binu-ink">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-binu-text">
                        {item.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-5">
                <PhoneMockup />
                <div className="space-y-5 rounded-lg border border-binu-line bg-white p-6">
                  <h2 className="text-xl font-extrabold text-binu-ink">
                    화면 구성 원칙
                  </h2>
                  <PatternRule
                    icon={Home}
                    title="홈은 오늘 또는 이번 주 루틴을 먼저 보여준다"
                    body="세부 작업 목록보다 큰 홈케어 리듬을 먼저 잡고, 완료 또는 주기 조정을 바로 실행하게 합니다."
                  />
                  <PatternRule
                    icon={Search}
                    title="막히는 순간에는 정보와 선택지를 연결한다"
                    body="커뮤니티 글, Q&A, 비누 픽은 서로 끊기지 않고 관련 선택지로 이어져야 합니다."
                  />
                  <PatternRule
                    icon={Bookmark}
                    title="도움이 된 정보는 비누 노트로 돌아온다"
                    body="저장과 기록은 사용자가 다시 시작할 기준을 만드는 핵심 루프입니다."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="space-y-8">
              <SectionIntro
                eyebrow="Voice"
                title="재촉보다 기억 보조"
                body="비누의 말투는 산뜻하고, 깨끗하고, 부드럽고, 정돈되어야 합니다. 사용자를 평가하지 않고 다음 행동을 쉽게 고르게 합니다."
              />

              <div className="grid gap-4">
                {copyRules.map((rule) => (
                  <div
                    key={rule.situation}
                    className="rounded-lg border border-binu-line bg-white p-5"
                  >
                    <p className="text-sm font-extrabold text-binu-navy">
                      {rule.situation}
                    </p>
                    <Separator className="my-4 bg-binu-line" />
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold text-[#2D7B50]">
                          권장
                        </span>
                        <p className="mt-1 text-sm font-semibold leading-6 text-binu-ink">
                          {rule.good}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#B45B4E]">
                          피하기
                        </span>
                        <p className="mt-1 text-sm leading-6 text-binu-muted">
                          {rule.avoid}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Alert className="border-binu-sky bg-binu-sky-soft text-binu-navy">
                <Info className="size-4" />
                <AlertTitle className="font-extrabold">
                  안전 정보는 더 명확하게
                </AlertTitle>
                <AlertDescription className="text-binu-text">
                  세제, 소재, 환기, 혼합 금지처럼 실제 손상이나 위험이 있는
                  내용은 일반 팁보다 분리해서 보여줍니다.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-binu-muted">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[26px] font-black leading-tight text-binu-ink">
        {title}
      </h2>
      <p className="mt-3 text-[15px] font-medium leading-7 text-binu-text">
        {body}
      </p>
    </div>
  );
}

function TypeSample({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs font-bold text-binu-muted">
        {label}
      </p>
      <p className={className}>{children}</p>
    </div>
  );
}

function SurfaceRule({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white bg-white/75 p-4">
      <h3 className="text-sm font-extrabold text-binu-ink">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-binu-text">{body}</p>
    </div>
  );
}

function PatternRule({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-binu-line bg-binu-sky-soft/40 p-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-binu-navy ring-1 ring-binu-line">
        <Icon className="size-5" />
      </div>
      <div>
        <h3 className="text-sm font-extrabold text-binu-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-binu-text">{body}</p>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="w-full rounded-[28px] border border-binu-line bg-white p-3 shadow-[0_20px_60px_rgba(46,75,102,0.14)]">
      <div className="overflow-hidden rounded-[20px] border border-binu-line bg-background">
        <div className="flex items-center justify-between border-b border-binu-line bg-white px-5 py-4">
          <div>
            <p className="text-xs font-bold text-binu-muted">비누</p>
            <p className="text-lg font-black text-binu-ink">오늘의 루틴</p>
          </div>
          <Button variant="quiet" size="icon" aria-label="마이">
            <Home className="size-4" />
          </Button>
        </div>
        <div className="space-y-4 p-4">
          <div className="rounded-lg border border-binu-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatusBadge tone="due">D-0</StatusBadge>
                <h3 className="mt-3 text-lg font-black text-binu-ink">
                  욕실 청소가 필요해요
                </h3>
                <p className="mt-1 text-sm leading-6 text-binu-text">
                  물때와 습기를 오늘 가볍게 비워볼까요?
                </p>
              </div>
              <Droplets className="size-8 text-binu-sky" />
            </div>
            <Button variant="binu" className="mt-4 w-full">
              루틴 확인하기
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {phoneItems.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="grid gap-1 rounded-lg border border-binu-line bg-white p-3 text-center"
              >
                <Icon className="mx-auto size-4 text-binu-navy" />
                <span className="text-[11px] font-bold text-binu-muted">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-binu-cream p-4">
            <p className="text-xs font-bold text-binu-muted">추천 용품</p>
            <p className="mt-1 text-sm font-extrabold text-binu-ink">
              욕실 물기 제거 도구
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
