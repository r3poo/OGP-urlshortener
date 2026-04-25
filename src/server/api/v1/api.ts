import type { BunRequest } from "bun";
import { get_dest, get_alias, set_alias_path } from "../../db";
import { ValidateSession } from "../../auth";

export type ReqBody = {
    alias_path: string,
    dest: string    
}

function validateAliasPath(inp: string): boolean {
    return new RegExp(/^[a-zA-Z0-9._~!$&'()*+,;=:@%-]+$/).test(inp)
}

export function get_host(req: BunRequest): string {
    // use override url if provided
    if (Bun.env.HOST) {
        return Bun.env.HOST
    }
    // test for proxy headers else grab url from req
    const f_host = req.headers.get("X-Forwarded-Host")
    const f_proto = req.headers.get("X-Forwarded-Proto")
    let host
    if (f_host!=null && (f_proto==="https" || f_proto==="http")) {
        // with proxy
        host = strip_slash(f_proto + "://" + f_host)
    } else {
        // no proxy, remove path
        const url = new URL(req.url)
        host = strip_slash(url.protocol + "//" + url.host)
    }
    return host
}

function strip_slash(inp: string): string {
    return inp.replace(/^\//, "").replace(/\/$/, "")
}



export async function resolve(req: BunRequest): Promise<Response> {
    // get path, remove leading and trailing '/'
    const alias_path = strip_slash(req.params.path as string)
    if (!validateAliasPath(alias_path)) {
        // filter invalid queries
        return new Response("Invalid shortened path", {
            headers: {
                "Content-Type": "text/plain"
            },
            status: 400
        })
    }

    const dest = await get_dest(alias_path)
    if (dest==="") {
        // db has no entry for alias
        return new Response("Alias does not exist", {
            headers: {
                "Content-Type": "text/plain"
            },
            status: 404
        })
    } else {
        // send redirect response, assumes dest url is valid
        return new Response(null, {
            headers: {
                Location: dest
            },
            status: 302
        })
    }
}


export async function lookup(req: BunRequest): Promise<Response> {
    // auth
    const token = req.cookies.get('session_token')
    if (!token || !ValidateSession(token)) {
        return new Response("Unauthorized", {
            status: 401
        })
    }

    const body = await req.json() as ReqBody
    const aliases = await get_alias(get_host(req), body.dest)
    if (aliases.length==0) {
        // dest has no alias or db failed (db failure logs error)
        return new Response("No associated alias", {
            headers: {
                "Content-Type": "text/plain"
            },
            status: 404
        })
    } else {
        // found alias(es) for given dest
        return new Response(aliases.toString(), {
            headers: {
                "Content-Type": "text/plain"
            }
        })
    }
}

export async function register(req: BunRequest): Promise<Response> {
    // auth
    const token = req.cookies.get('session_token')
    if (!token || !ValidateSession(token)) {
        return new Response("Unauthorized", {
            status: 401
        })
    }
    
    const body = await req.json() as ReqBody
    if ("dest" in body && "alias_path" in body) {
        const alias_path = strip_slash(body.alias_path)

        if (!validateAliasPath(alias_path)) {
            // invalid alias
            return new Response("Bad Request", {
                headers: {
                    "Content-Type": "text/plain"
                },
                status: 400
            })
        }
        
        // insert protocol if missing, assume http
        // matches for alpha...://
        const dest: string = new RegExp(/^\W+:\/\/.+/) ? body.dest : 'http://' + body.dest
        
        // update db
        const success = await set_alias_path(alias_path, dest)
        if (success) {
            // no errors with db
            return new Response(`OK`, {
                headers: {
                    "Content-Type": "text/plain"
                },
                status: 200
            })
        } else {
            // db error (error also logged)
            return new Response("Internal Server Error", {
                headers: {
                    "Content-Type": "text/plain"
                },
                status: 500
            })
        }
    } else {
        // missing either dest or alias property in query
        return new Response("Bad Request", {
            headers: {
                "Content-Type": "text/plain"
            },
            status: 400
        })
    }
}