import { get_host, resolve, lookup, register } from "./server/api/v1/api"
import { NewSession } from "./server/auth"
import index from './client/index.html'
import type { BunRequest } from "bun"

const nonce = "/" + crypto.randomUUID() 
console.log(`\n\nGENERATED STATIC NONCE: ${nonce}\n`)

const consolePath = Bun.env.CONSOLE || "/admin" as string
type af = (x:BunRequest) => Promise<Response>

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
            })}} as Record<string, af>,
        "/api/v1/resolve": {
            POST: async req => {
                console.log('\n\nREQUEST TO /api/v1/resolve\n')
                return await lookup(req);
            }
        },
        "/api/v1/register": {
            POST: async req => {
                console.log('\n\nREQUEST TO /api/v1/register\n')
                return await register(req)
            }
        },
        "/url/:path": {
            GET: async req => {
                console.log('\n\nREQUEST TO /url/*\n')
                return await resolve(req)
            }
        }
    },
    fetch() {
        return new Response(`URL Shortener available at ${consolePath}`, {
            headers: {
                "Content-Type": "text/plain"
            },
            status: 404
        })
    }
})

console.log(`Server started on port ${Bun.env.PORT}`);