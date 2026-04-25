import { SQL } from "bun";

const pg = new SQL(Bun.env.PG_URI as string);

export async function get_dest(alias_path: string): Promise<string> {
    let res: Array<any>
    try {
        res = await pg`SELECT * from forwards WHERE alias_path = ${alias_path}` as Array<any>
    } catch {
        console.error("Database error getting dest url")
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
        res = await pg`SELECT * from forwards WHERE dest=${dest}` as Array<any>
    } catch {
        // do not crash on database error
        console.error("Database error doing reverse lookup using dest url")
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
        let res = await pg`INSERT INTO forwards (alias_path, dest) VALUES (${alias_path}, ${dest}) ON CONFLICT (alias_path) DO UPDATE SET alias_path=${alias_path}, dest=${dest}`
    } catch {
        console.error("Database error interting/updating row entry")
        return false
    }
    return true
}




