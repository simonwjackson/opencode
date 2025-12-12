import { describe, expect, test } from "bun:test"
import path from "node:path"
import { Session } from "../../src/session"
import { Bus } from "../../src/bus"
import { Log } from "../../src/util/log"
import { Instance } from "../../src/project/instance"

const projectRoot = path.join(__dirname, "../..")
Log.init({ print: false })

describe("session.resumed event", () => {
  test("should emit session.resumed event when session is resumed", async () => {
    await Instance.provide({
      directory: projectRoot,
      fn: async () => {
        const session = await Session.create({})

        let eventReceived = false
        let receivedInfo: Session.Info | undefined

        const unsub = Bus.subscribe(Session.Event.Resumed, (event) => {
          eventReceived = true
          receivedInfo = event.properties.info as Session.Info
        })

        await Session.resume(session.id)

        await new Promise((resolve) => setTimeout(resolve, 100))

        unsub()

        expect(eventReceived).toBe(true)
        expect(receivedInfo).toBeDefined()
        expect(receivedInfo?.id).toBe(session.id)

        await Session.remove(session.id)
      },
    })
  })
})

describe("pending context storage", () => {
  test("should store and consume pending context", async () => {
    const sessionID = "test-session-123"
    const context = "Test context for session"

    Session.setPendingContext(sessionID, context)

    const consumed = Session.consumePendingContext(sessionID)
    expect(consumed).toBe(context)

    // Should be undefined after consumption
    const consumedAgain = Session.consumePendingContext(sessionID)
    expect(consumedAgain).toBeUndefined()
  })

  test("should concatenate multiple pending contexts", async () => {
    const sessionID = "test-session-456"
    const context1 = "First context"
    const context2 = "Second context"

    Session.setPendingContext(sessionID, context1)
    Session.setPendingContext(sessionID, context2)

    const consumed = Session.consumePendingContext(sessionID)
    expect(consumed).toBe(`${context1}\n\n${context2}`)
  })

  test("should return undefined for non-existent session", async () => {
    const consumed = Session.consumePendingContext("non-existent-session")
    expect(consumed).toBeUndefined()
  })
})
