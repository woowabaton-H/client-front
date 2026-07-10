import { NextResponse } from "next/server";

const today = "2026-07-10";

const categories = [
  {
    id: "laundry",
    category: "세탁/침구",
    name: "세탁/침구",
    icon: "laundry",
    cycleDays: 14,
    lastDoneAt: "2026-06-23T12:00:00+09:00",
    note: "수건 냄새와 침구 먼지를 같이 챙겨요.",
  },
  {
    id: "bath",
    category: "욕실",
    name: "욕실",
    icon: "bath",
    cycleDays: 14,
    lastDoneAt: "2026-06-26T09:00:00+09:00",
    note: "물때와 습기만 잡아도 관리가 쉬워져요.",
  },
  {
    id: "kitchen",
    category: "주방",
    name: "주방",
    icon: "kitchen",
    cycleDays: 7,
    lastDoneAt: "2026-07-03T20:00:00+09:00",
    note: "배수구와 조리대 표면을 기준으로 잡아요.",
  },
];

export function GET() {
  return NextResponse.json({
    data: {
      today,
      message: "오늘은 여기만 챙겨도 충분해요",
      monthlyCompletionCount: 5,
      availableCategories: ["세탁/침구", "욕실", "주방", "쓰레기/수거", "바닥/먼지", "계절/가전", "반려동물", "소모품"],
      categories,
      unreadNotificationCount: 1,
    },
    meta: {
      requestId: "req_cleanloop_proto",
    },
  });
}
