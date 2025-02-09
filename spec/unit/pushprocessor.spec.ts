import * as utils from "../test-utils/test-utils";
import { IActionsObject, PushProcessor } from "../../src/pushprocessor";
import { ConditionKind, EventType, IContent, MatrixClient, MatrixEvent } from "../../src";

describe("NotificationService", function () {
    const testUserId = "@ali:matrix.org";
    const testDisplayName = "Alice M";
    const testRoomId = "!fl1bb13:localhost";

    let testEvent: MatrixEvent;

    let pushProcessor: PushProcessor;

    const msc3914RoomCallRule = {
        rule_id: ".org.matrix.msc3914.rule.room.call",
        default: true,
        enabled: true,
        conditions: [
            {
                kind: "event_match",
                key: "type",
                pattern: "org.matrix.msc3401.call",
            },
            {
                kind: "call_started",
            },
        ],
        actions: ["notify", { set_tweak: "sound", value: "default" }],
    };

    // These would be better if individual rules were configured in the tests themselves.
    const matrixClient = {
        getRoom: function () {
            return {
                currentState: {
                    getMember: function () {
                        return {
                            name: testDisplayName,
                        };
                    },
                    getJoinedMemberCount: function () {
                        return 0;
                    },
                    members: {},
                },
            };
        },
        credentials: {
            userId: testUserId,
        },
        pushRules: {
            device: {},
            global: {
                content: [
                    {
                        actions: [
                            "notify",
                            {
                                set_tweak: "sound",
                                value: "default",
                            },
                            {
                                set_tweak: "highlight",
                            },
                        ],
                        enabled: true,
                        pattern: "ali",
                        rule_id: ".m.rule.contains_user_name",
                    },
                    {
                        actions: [
                            "notify",
                            {
                                set_tweak: "sound",
                                value: "default",
                            },
                            {
                                set_tweak: "highlight",
                            },
                        ],
                        enabled: true,
                        pattern: "coffee",
                        rule_id: "coffee",
                    },
                    {
                        actions: [
                            "notify",
                            {
                                set_tweak: "sound",
                                value: "default",
                            },
                            {
                                set_tweak: "highlight",
                            },
                        ],
                        enabled: true,
                        pattern: "foo*bar",
                        rule_id: "foobar",
                    },
                    {
                        actions: [
                            "notify",
                            {
                                set_tweak: "sound",
                                value: "default",
                            },
                            {
                                set_tweak: "highlight",
                            },
                        ],
                        enabled: true,
                        pattern: "p[io]ng",
                        rule_id: "pingpong",
                    },
                    {
                        actions: [
                            "notify",
                            {
                                set_tweak: "sound",
                                value: "default",
                            },
                            {
                                set_tweak: "highlight",
                            },
                        ],
                        enabled: true,
                        pattern: "I ate [0-9] pies",
                        rule_id: "pies",
                    },
                    {
                        actions: [
                            "notify",
                            {
                                set_tweak: "sound",
                                value: "default",
                            },
                            {
                                set_tweak: "highlight",
                            },
                        ],
                        enabled: true,
                        pattern: "b[!ai]ke",
                        rule_id: "bakebike",
                    },
                ],
                override: [
                    {
                        actions: [
                            "notify",
                            {
                                set_tweak: "sound",
                                value: "default",
                            },
                            {
                                set_tweak: "highlight",
                            },
                        ],
                        conditions: [
                            {
                                kind: "contains_display_name",
                            },
                        ],
                        enabled: true,
                        rule_id: ".m.rule.contains_display_name",
                    },
                    {
                        actions: [
                            "notify",
                            {
                                set_tweak: "sound",
                                value: "default",
                            },
                        ],
                        conditions: [
                            {
                                is: "2",
                                kind: "room_member_count",
                            },
                        ],
                        enabled: true,
                        rule_id: ".m.rule.room_one_to_one",
                    },
                ],
                room: [],
                sender: [],
                underride: [
                    msc3914RoomCallRule,
                    {
                        actions: ["dont-notify"],
                        conditions: [
                            {
                                key: "content.msgtype",
                                kind: "event_match",
                                pattern: "m.notice",
                            },
                        ],
                        enabled: true,
                        rule_id: ".m.rule.suppress_notices",
                    },
                    {
                        actions: [
                            "notify",
                            {
                                set_tweak: "highlight",
                                value: false,
                            },
                        ],
                        conditions: [],
                        enabled: true,
                        rule_id: ".m.rule.fallback",
                    },
                ],
            },
        },
    } as unknown as MatrixClient;

    beforeEach(function () {
        testEvent = utils.mkEvent({
            type: "m.room.message",
            room: testRoomId,
            user: "@alfred:localhost",
            event: true,
            content: {
                body: "",
                msgtype: "m.text",
            },
        });
        matrixClient.pushRules = PushProcessor.rewriteDefaultRules(matrixClient.pushRules!);
        pushProcessor = new PushProcessor(matrixClient);
    });

    // User IDs

    it("should bing on a user ID.", function () {
        testEvent.event.content!.body = "Hello @ali:matrix.org, how are you?";
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    it("should bing on a partial user ID with an @.", function () {
        testEvent.event.content!.body = "Hello @ali, how are you?";
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    it("should bing on a partial user ID without @.", function () {
        testEvent.event.content!.body = "Hello ali, how are you?";
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    it("should bing on a case-insensitive user ID.", function () {
        testEvent.event.content!.body = "Hello @AlI:matrix.org, how are you?";
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    // Display names

    it("should bing on a display name.", function () {
        testEvent.event.content!.body = "Hello Alice M, how are you?";
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    it("should bing on a case-insensitive display name.", function () {
        testEvent.event.content!.body = "Hello ALICE M, how are you?";
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    // Bing words

    it("should bing on a bing word.", function () {
        testEvent.event.content!.body = "I really like coffee";
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    it("should bing on case-insensitive bing words.", function () {
        testEvent.event.content!.body = "Coffee is great";
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    it("should bing on wildcard (.*) bing words.", function () {
        testEvent.event.content!.body = "It was foomahbar I think.";
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    // TODO: This is not spec compliant behaviour.
    //
    // See https://spec.matrix.org/v1.5/client-server-api/#conditions-1 which
    // describes pattern should glob:
    //
    // 1. * matches 0 or more characters;
    // 2. ? matches exactly one character
    it("should bing on character group ([abc]) bing words.", function () {
        testEvent.event.content!.body = "Ping!";
        let actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
        testEvent.event.content!.body = "Pong!";
        actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    // TODO: This is not spec compliant behaviour. (See above.)
    it("should bing on character range ([a-z]) bing words.", function () {
        testEvent.event.content!.body = "I ate 6 pies";
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
    });

    // TODO: This is not spec compliant behaviour. (See above.)
    it("should bing on character negation ([!a]) bing words.", function () {
        testEvent.event.content!.body = "boke";
        let actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(true);
        testEvent.event.content!.body = "bake";
        actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(false);
    });

    it("should not bing on room server ACL changes", function () {
        testEvent = utils.mkEvent({
            type: EventType.RoomServerAcl,
            room: testRoomId,
            user: "@alfred:localhost",
            skey: "",
            event: true,
            content: {},
        });

        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toBeFalsy();
        expect(actions.tweaks.sound).toBeFalsy();
        expect(actions.notify).toBeFalsy();
    });

    // invalid

    it("should gracefully handle bad input.", function () {
        // The following body is an object (not a string) and thus is invalid
        // for matching against.
        testEvent.event.content!.body = { foo: "bar" };
        const actions = pushProcessor.actionsForEvent(testEvent);
        expect(actions.tweaks.highlight).toEqual(false);
    });

    it("a rule with no conditions matches every event.", function () {
        expect(
            pushProcessor.ruleMatchesEvent(
                {
                    rule_id: "rule1",
                    actions: [],
                    conditions: [],
                    default: false,
                    enabled: true,
                },
                testEvent,
            ),
        ).toBe(true);
        expect(
            pushProcessor.ruleMatchesEvent(
                {
                    rule_id: "rule1",
                    actions: [],
                    default: false,
                    enabled: true,
                },
                testEvent,
            ),
        ).toBe(true);
    });

    describe("group call started push rule", () => {
        beforeEach(() => {
            matrixClient.pushRules!.global!.underride!.find((r) => r.rule_id === ".m.rule.fallback")!.enabled = false;
        });

        const getActionsForEvent = (prevContent: IContent, content: IContent): IActionsObject => {
            testEvent = utils.mkEvent({
                type: "org.matrix.msc3401.call",
                room: testRoomId,
                user: "@alice:foo",
                skey: "state_key",
                event: true,
                content: content,
                prev_content: prevContent,
            });

            return pushProcessor.actionsForEvent(testEvent);
        };

        const assertDoesNotify = (actions: IActionsObject): void => {
            expect(actions?.notify).toBeTruthy();
            expect(actions?.tweaks?.sound).toBeTruthy();
            expect(actions?.tweaks?.highlight).toBeFalsy();
        };

        const assertDoesNotNotify = (actions: IActionsObject): void => {
            expect(actions?.notify).toBeFalsy();
            expect(actions?.tweaks?.sound).toBeFalsy();
            expect(actions?.tweaks?.highlight).toBeFalsy();
        };

        it.each(["m.ring", "m.prompt"])(
            "should notify when new group call event appears with %s intent",
            (intent: string) => {
                assertDoesNotify(
                    getActionsForEvent(
                        {},
                        {
                            "m.intent": intent,
                            "m.type": "m.voice",
                            "m.name": "Call",
                        },
                    ),
                );
            },
        );

        it("should notify when a call is un-terminated", () => {
            assertDoesNotify(
                getActionsForEvent(
                    {
                        "m.intent": "m.ring",
                        "m.type": "m.voice",
                        "m.name": "Call",
                        "m.terminated": "All users left",
                    },
                    {
                        "m.intent": "m.ring",
                        "m.type": "m.voice",
                        "m.name": "Call",
                    },
                ),
            );
        });

        it("should not notify when call is terminated", () => {
            assertDoesNotNotify(
                getActionsForEvent(
                    {
                        "m.intent": "m.ring",
                        "m.type": "m.voice",
                        "m.name": "Call",
                    },
                    {
                        "m.intent": "m.ring",
                        "m.type": "m.voice",
                        "m.name": "Call",
                        "m.terminated": "All users left",
                    },
                ),
            );
        });

        it("should ignore with m.room intent", () => {
            assertDoesNotNotify(
                getActionsForEvent(
                    {},
                    {
                        "m.intent": "m.room",
                        "m.type": "m.voice",
                        "m.name": "Call",
                    },
                ),
            );
        });

        describe("ignoring non-relevant state changes", () => {
            it("should ignore intent changes", () => {
                assertDoesNotNotify(
                    getActionsForEvent(
                        {
                            "m.intent": "m.ring",
                            "m.type": "m.voice",
                            "m.name": "Call",
                        },
                        {
                            "m.intent": "m.ring",
                            "m.type": "m.video",
                            "m.name": "Call",
                        },
                    ),
                );
            });

            it("should ignore name changes", () => {
                assertDoesNotNotify(
                    getActionsForEvent(
                        {
                            "m.intent": "m.ring",
                            "m.type": "m.voice",
                            "m.name": "Call",
                        },
                        {
                            "m.intent": "m.ring",
                            "m.type": "m.voice",
                            "m.name": "New call",
                        },
                    ),
                );
            });
        });
    });

    it.each([
        // The properly escaped key works.
        { key: "content.m\\.test.foo", pattern: "bar", expected: true },
        // An unescaped version does not match.
        { key: "content.m.test.foo", pattern: "bar", expected: false },
        // Over escaping does not match.
        { key: "content.m\\.test\\.foo", pattern: "bar", expected: false },
        // Escaping backslashes should match.
        { key: "content.m\\\\example", pattern: "baz", expected: true },
        // An unnecessary escape sequence leaves the backslash and still matches.
        { key: "content.m\\example", pattern: "baz", expected: true },
    ])("test against escaped dotted paths '$key'", ({ key, pattern, expected }) => {
        testEvent = utils.mkEvent({
            type: "m.room.message",
            room: testRoomId,
            user: "@alfred:localhost",
            event: true,
            content: {
                // A dot in the field name.
                "m.test": { foo: "bar" },
                // A backslash in a field name.
                "m\\example": "baz",
            },
        });

        expect(
            pushProcessor.ruleMatchesEvent(
                {
                    rule_id: "rule1",
                    actions: [],
                    conditions: [
                        {
                            kind: ConditionKind.EventMatch,
                            key: key,
                            pattern: pattern,
                        },
                    ],
                    default: false,
                    enabled: true,
                },
                testEvent,
            ),
        ).toBe(expected);
    });

    describe("getPushRuleById()", () => {
        it("returns null when rule id is not in rule set", () => {
            expect(pushProcessor.getPushRuleById("non-existant-rule")).toBeNull();
        });

        it("returns push rule when it is found in rule set", () => {
            expect(pushProcessor.getPushRuleById(".org.matrix.msc3914.rule.room.call")).toEqual(msc3914RoomCallRule);
        });
    });

    describe("getPushRuleAndKindById()", () => {
        it("returns null when rule id is not in rule set", () => {
            expect(pushProcessor.getPushRuleAndKindById("non-existant-rule")).toBeNull();
        });

        it("returns push rule when it is found in rule set", () => {
            expect(pushProcessor.getPushRuleAndKindById(".org.matrix.msc3914.rule.room.call")).toEqual({
                kind: "underride",
                rule: msc3914RoomCallRule,
            });
        });
    });
});

describe("Test PushProcessor.partsForDottedKey", function () {
    it.each([
        // A field with no dots.
        ["m", ["m"]],
        // Simple dotted fields.
        ["m.foo", ["m", "foo"]],
        ["m.foo.bar", ["m", "foo", "bar"]],
        // Backslash is used as an escape character.
        ["m\\.foo", ["m.foo"]],
        ["m\\\\.foo", ["m\\", "foo"]],
        ["m\\\\\\.foo", ["m\\.foo"]],
        ["m\\\\\\\\.foo", ["m\\\\", "foo"]],
        ["m\\foo", ["m\\foo"]],
        ["m\\\\foo", ["m\\foo"]],
        ["m\\\\\\foo", ["m\\\\foo"]],
        ["m\\\\\\\\foo", ["m\\\\foo"]],
        // Ensure that escapes at the end don't cause issues.
        ["m.foo\\", ["m", "foo\\"]],
        ["m.foo\\\\", ["m", "foo\\"]],
        ["m.foo\\.", ["m", "foo."]],
        ["m.foo\\\\.", ["m", "foo\\", ""]],
        ["m.foo\\\\\\.", ["m", "foo\\."]],
        // Empty parts (corresponding to properties which are an empty string) are allowed.
        [".m", ["", "m"]],
        ["..m", ["", "", "m"]],
        ["m.", ["m", ""]],
        ["m..", ["m", "", ""]],
        ["m..foo", ["m", "", "foo"]],
    ])("partsFotDottedKey for %s", (path: string, expected: string[]) => {
        expect(PushProcessor.partsForDottedKey(path)).toStrictEqual(expected);
    });
});
