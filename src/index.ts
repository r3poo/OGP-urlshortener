import { get_host, resolve, lookup, register } from "./server/api/v1/api"
import { NewSession } from "./server/auth"
import type { BunRequest } from "bun"
import index from './client/index.html'
import { existsSync } from "fs";

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

if (Bun.env.NODE_ENV==="production") {
    console.log("RUNNING IN PRODUCTION")
} else {
    console.log("RUNNING IN DEV")
}


Bun.serve({
    port: Bun.env.PORT || 80,
    routes: {
        ...{[nonce]: index} as Record<string, typeof index>,
        ...{[consolePath]: async req => {
            const token = NewSession()
            if (Bun.env.NODE_ENV==="production") {
                const file = Bun.file("./dist/index.html");
                return new Response(file, {
                    headers: {
                       "Set-Cookie": `session_token=${token}; HttpOnly; SameSite`
                    }
                });
            } else {
                return fetch(`${get_host(req)}${nonce}`).then(res => {
                    const { headers } = res
                    headers.delete("Content-Encoding")
                    headers.delete("Content-Length")
                    headers.set("Set-Cookie", `session_token=${token}; HttpOnly; SameSite`)
                    return res
                })
            }
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
                console.log(`\n\nREQUEST TO resolver: ${req.params.path}\n`)
                return await resolve(req)
            }
        }} as linkType
    },
    fetch(req) {
        const url = new URL(req.url);
        const filePath = "./dist/" + url.pathname

        // Fallback to index.html for client-side routing
        if (!existsSync(filePath) || url.pathname==="/") {
            return new Response("Bad Request", {
                headers: {
                    "Content-Type": "text/plain"
                },
                status: 400
            })
        }

        const file = Bun.file(filePath);
        return new Response(file);
    }
})

console.log(`Server started on port ${Bun.env.PORT}`);