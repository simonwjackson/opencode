import { createStore } from "solid-js/store"
import { createSimpleContext } from "./helper"
import type { PromptInfo } from "../component/prompt/history"
import { Session } from "@/session"
import { Plugin } from "@/plugin"

export type HomeRoute = {
  type: "home"
  initialPrompt?: PromptInfo
}

export type SessionRoute = {
  type: "session"
  sessionID: string
  /** True if this is a newly created session (triggers "startup" instead of "resume") */
  isNew?: boolean
}

export type Route = HomeRoute | SessionRoute

export const { use: useRoute, provider: RouteProvider } = createSimpleContext({
  name: "Route",
  init: () => {
    const [store, setStore] = createStore<Route>(
      process.env["OPENCODE_ROUTE"]
        ? JSON.parse(process.env["OPENCODE_ROUTE"])
        : {
            type: "home",
          },
    )

    return {
      get data() {
        return store
      },
      async navigate(route: Route) {
        console.log("navigate", route)
        if (route.type === "session" && !route.isNew) {
          // Fire session.start hook with "resume" trigger for existing sessions only
          // New sessions are handled in prompt/index.tsx after creation
          try {
            const context = await Plugin.triggerSessionStart(route.sessionID, "resume")
            if (context) Session.setPendingContext(route.sessionID, context)
          } catch {
            // Ignore errors - context may not be initialized yet
          }
        }
        setStore(route)
      },
    }
  },
})

export type RouteContext = ReturnType<typeof useRoute>

export function useRouteData<T extends Route["type"]>(type: T) {
  const route = useRoute()
  return route.data as Extract<Route, { type: typeof type }>
}
