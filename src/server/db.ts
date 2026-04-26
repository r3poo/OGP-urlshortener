import { SQL, sql } from "bun";

const pg = new SQL(Bun.env.PG_URI as string);
const DB_NAME = Bun.env.DB_NAME
// clear prepared statements
await pg`DEALLOCATE ALL`


// clear database of entries older than configured days
async function cleanURLs() {
    console.log("cleaning database")
    try {
        await pg`DELETE FROM ${sql(DB_NAME)} WHERE created_at < NOW() - INTERVAL '${sql(Bun.env.PUBLIC_LINK_TTL)} days'`
    } catch (error) {
        if (error instanceof Error) {
            console.error(error.message)
        } else {
            console.error("Failed to clear database of old urls")
        }
    }
}

// get liveness
async function db_live() {
    console.log(`DB Liveness Check - ${new Date().toUTCString()}`)
    let res: Array<any>
    try {
        res = await pg`SELECT 1` as Array<any>
        console.log("DB Liveness Check - PASS")
    } catch (error) {
        // do not crash on database error
        if (error instanceof Error) {
            console.error(error.message)
        } else {
            console.error("Database ping failes")
        }
    }
}


// run cleaning routine every minute
const cleanURLsSchedule = setInterval(cleanURLs, 60000)
await cleanURLs()

// run check for 
const livenessSchedule = setInterval(db_live, 60000)
await db_live()



export async function get_dest(alias_path: string): Promise<string> {
    let res: Array<any>
    try {
        res = await pg`SELECT * from ${sql(DB_NAME)} WHERE alias_path = ${alias_path}` as Array<any>
    } catch (error) {
        // do not crash on database error
        if (error instanceof Error) {
            console.error(error.message)
        } else {
            console.error("Database error getting dest url")
        }
        return ''
    }
    if (res.length==0) {
        // no such alias
        return ''
    } else {
        return res[0].dest
    }
}

export async function get_alias(host: string, dest: string): Promise<Array<string>> {
    let res
    try{
        res = await pg`SELECT * from ${sql(DB_NAME)} WHERE dest=${dest}` as Array<any>
    } catch (error) {
        // do not crash on database error
        if (error instanceof Error) {
            console.error(error.message)
        } else {
            console.error("Database error doing reverse lookup using dest url")
        }
        return []
    }

    if (res.length==0) {
        // no rows matching query
        return []
    } else {
        const aliases = res.map(row => host + "/" + row.alias_path)
        return aliases
    }
}

export async function set_alias_path(alias_path: string, dest: string): Promise<boolean> {
    try{
        await pg`INSERT INTO ${sql(DB_NAME)} (alias_path, dest) VALUES (${alias_path}, ${dest}) ON CONFLICT (alias_path) DO UPDATE SET alias_path=${alias_path}, dest=${dest}`
    } catch (error) {
        // do not crash on database error
        if (error instanceof Error) {
            console.error(error.message)
        } else {
            console.error("Database error interting/updating row entry")
        }
        return false
    }
    return true
}




