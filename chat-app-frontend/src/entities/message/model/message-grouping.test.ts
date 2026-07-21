import {
  groupMessages,
  endsRun,
  startsRun,
  RUN_GAP_MS,
} from "./message-grouping";
import type { Message } from "./message.types";

const BASE = new Date("2026-01-01T09:00:00.000Z").getTime();

function message(
  authorId: string,
  offsetMs = 0,
  id = `${authorId}-${offsetMs}`,
): Message {
  return {
    id,
    author: { id: authorId, name: authorId, image: null },
    content: "hi",
    createdAt: new Date(BASE + offsetMs).toISOString(),
    authorId,
    channelId: "channel-1",
    parentId: "",
  };
}

/** Built in local time, so a day boundary lands where the formatter sees it. */
function messageAt(
  authorId: string,
  local: { day: number; hour: number; minute?: number },
): Message {
  return {
    ...message(authorId, 0, `${authorId}-${local.day}-${local.hour}`),
    createdAt: new Date(
      2026,
      0,
      local.day,
      local.hour,
      local.minute ?? 0,
    ).toISOString(),
  };
}

const positions = (messages: Message[]) =>
  groupMessages(messages).map(({ position }) => position);

const dayStarts = (messages: Message[]) =>
  groupMessages(messages).map(({ startsDay }) => startsDay);

describe("groupMessages", () => {
  it("returns nothing for an empty timeline", () => {
    expect(groupMessages([])).toEqual([]);
  });

  it("marks a lone message as its own run", () => {
    expect(positions([message("jane")])).toEqual(["solo"]);
  });

  it("brackets a run of consecutive messages from one author", () => {
    expect(
      positions([
        message("jane", 0),
        message("jane", 1000),
        message("jane", 2000),
        message("jane", 3000),
      ]),
    ).toEqual(["first", "mid", "mid", "last"]);
  });

  it("breaks the run when the author changes", () => {
    expect(
      positions([
        message("jane", 0),
        message("jane", 1000),
        message("marco", 2000),
        message("jane", 3000),
      ]),
    ).toEqual(["first", "last", "solo", "solo"]);
  });

  it("breaks the run on a long pause by the same author", () => {
    expect(
      positions([
        message("jane", 0),
        message("jane", RUN_GAP_MS + 1),
        message("jane", RUN_GAP_MS + 2),
      ]),
    ).toEqual(["solo", "first", "last"]);
  });

  it("keeps a run together right up to the gap threshold", () => {
    expect(
      positions([message("jane", 0), message("jane", RUN_GAP_MS)]),
    ).toEqual(["first", "last"]);
  });

  it("groups a pair that arrives fractionally out of order", () => {
    expect(positions([message("jane", 1000), message("jane", 0)])).toEqual([
      "first",
      "last",
    ]);
  });

  it("breaks the run rather than grouping on an unparseable date", () => {
    const broken = { ...message("jane", 1000), createdAt: "not-a-date" };

    expect(positions([message("jane", 0), broken])).toEqual(["solo", "solo"]);
  });

  it("preserves order and identity of the messages it tags", () => {
    const timeline = [message("jane", 0), message("marco", 1000)];

    expect(groupMessages(timeline).map(({ message }) => message)).toEqual(
      timeline,
    );
  });
});

describe("day boundaries", () => {
  it("marks the first message of the timeline as opening a day", () => {
    expect(dayStarts([messageAt("jane", { day: 12, hour: 9 })])).toEqual([
      true,
    ]);
  });

  it("marks only the first message of each day", () => {
    expect(
      dayStarts([
        messageAt("jane", { day: 12, hour: 9 }),
        messageAt("jane", { day: 12, hour: 18 }),
        messageAt("marco", { day: 13, hour: 8 }),
        messageAt("marco", { day: 13, hour: 9 }),
      ]),
    ).toEqual([true, false, true, false]);
  });

  it("never opens a day on an unparseable date, which would label nothing", () => {
    const broken = { ...message("jane"), createdAt: "not-a-date" };

    expect(dayStarts([broken])).toEqual([false]);
  });

  it("breaks a run across midnight even within the gap threshold", () => {
    const timeline = [
      messageAt("jane", { day: 12, hour: 23, minute: 59 }),
      messageAt("jane", { day: 13, hour: 0, minute: 1 }),
    ];

    // Two minutes apart and from one author, but a divider will sit between
    // them — so they must not render as one run.
    expect(positions(timeline)).toEqual(["solo", "solo"]);
    expect(dayStarts(timeline)).toEqual([true, true]);
  });
});

describe("run edges", () => {
  it("treats the first and only positions as the top of a run", () => {
    expect(startsRun("first")).toBe(true);
    expect(startsRun("solo")).toBe(true);
    expect(startsRun("mid")).toBe(false);
    expect(startsRun("last")).toBe(false);
  });

  it("treats the last and only positions as the bottom of a run", () => {
    expect(endsRun("last")).toBe(true);
    expect(endsRun("solo")).toBe(true);
    expect(endsRun("mid")).toBe(false);
    expect(endsRun("first")).toBe(false);
  });
});
