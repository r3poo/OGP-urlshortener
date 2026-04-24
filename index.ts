import { resolve, lookup, register } from "./api.ts"

console.log("Hello via Bun!");


Bun.serve({
    port:80,
    routes: {
        "/api/v1/resolve": {
            POST: async req => {
                console.log('\n\nREQUEST\n')
                return await lookup(req);
            }
        },
        "/api/v1/register": {
            POST: async req => {
                console.log('\n\nREQUEST\n')
                return await register(req)
            }
        },
        "/url/:path": {
            GET: async req => {
                console.log('\n\nREQUEST\n')
                return await resolve(req)
            }
        }
    },
    fetch() {
        return new Response("Not Found", {
            headers: {
                "Content-Type": "text/plain"
            },
            status: 404
        })
    }
})