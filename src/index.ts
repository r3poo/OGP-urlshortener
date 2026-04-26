import { get_host, resolve, lookup, register } from "./server/api/v1/api"
import { NewSession } from "./server/auth"
import index from './client/index.html'
import type { BunRequest } from "bun"

// load path for frontend
const nonce = "/" + crypto.randomUUID() 
console.log(`\n\nGENERATED STATIC NONCE: ${nonce}\n`)

// load path for console
const consolePath = Bun.env.CONSOLE || "/admin" as string
type consoleType = Record<string, (x:BunRequest) => Promise<Response>>

// load path for links
export const linkExtension = Bun.env.SHORTENED || ""
const linkPath = (Bun.env.SHORTENED || "") + "/:path"
type linkType = Record<string, {GET:(x:BunRequest) => Promise<Response>}>


Bun.serve({
    port: Bun.env.PORT || 80,
    routes: {
        ...{[nonce]: index} as Record<string, typeof index>,
        ...{[consolePath]: async req => {
            const token = NewSession()
            return fetch(`${get_host(req)}${nonce}`).then(res => {
                const { headers } = res
                headers.delete("Content-Encoding")
                headers.delete("Content-Length")
                headers.set("Set-Cookie", `session_token=${token}; HttpOnly; SameSite`)
                return res
            })
        }} as consoleType,
        "/api/v1/lookup": {
            POST: async req => {
                console.log('\n\nREQUEST TO /api/v1/lookup\n')
                return await lookup(req);
            }
        },
        "/api/v1/register": {
            POST: async req => {
                console.log('\n\nREQUEST TO /api/v1/register\n')
                return await register(req)
            }
        },
        ...{[linkPath]: {
            GET: async req => {
                console.log('\n\nREQUEST TO /url/*\n')
                return await resolve(req)
            }
        }} as linkType
    },
    fetch() {
        return new Response("Bad Request", {
            headers: {
                "Content-Type": "text/plain"
            },
            status: 400
        })
    }
})

console.log(`Server started on port ${Bun.env.PORT}`);