import { get_host, resolve, lookup, register } from "./server/api/v1/api"
import { NewSession } from "./server/auth"
import index from './client/index.html'

const nonce = "/" + crypto.randomUUID() 
console.log(`\n\nGENERATED STATIC NONCE: ${nonce}\n`)

Bun.serve({
    port: Bun.env.PORT || 80,
    routes: {
        ...{[nonce]: index} as Record<string, typeof index>,
        "/admin": async req => {
            const token = NewSession()
            return fetch(`${get_host(req)}${nonce}`).then(res => {
                const { headers } = res
                headers.set("Set-Cookie", `session_token=${token}; HttpOnly; SameSite`)
                return res
            })
        },
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
        return new Response("URL Shortener available at /admin", {
            headers: {
                "Content-Type": "text/plain"
            },
            status: 404
        })
    }
})

console.log(`Server started on port ${Bun.env.PORT}`);