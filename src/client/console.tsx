import { type SubmitEvent, useState } from "react";
import './styling.css'


export function Page() {
    const [status, setStatus] = useState('')
    const [short, setShort] = useState('')

    const onClickSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log(e.target)
        const alias_path = (e.currentTarget.getElementsByClassName("alias_path").item(0) as HTMLInputElement).value
        const dest = (e.currentTarget.getElementsByClassName("dest").item(0) as HTMLInputElement).value

        // validate alais_path
        if (!new RegExp(/^[a-zA-Z0-9._~!$&'()*+,;=:@%-]+$/).test(alias_path)) {
            setStatus("Invalid shortened URL path")
            setShort('')
            return
        }

        try {
            await fetch(`/api/v1/register`, {
                method: "POST",
                body: JSON.stringify({"alias_path": alias_path, "dest": dest})
            }).then(
                async res => {
                    // use text body of response as either shortened url or error message
                    const text = await res.text()
                    if (res.status===200) {
                        setStatus(`URL available at: `)
                        setShort(text)
                    } else {
                        setStatus(text)
                        setShort('')
                    }
                }
            )
        } catch {
            setStatus("Error: service unavailable")
            setShort('')
            // chain reset with useEffect?
        }
    }
    
    // env is replaced by bun at build. use "a few" if running dev server (not build files)
    const ttl = typeof process.env.PUBLIC_LINK_TTL==="string" ? process.env.PUBLIC_LINK_TTL : "a few"

    return (
        <main className="panel">
            <h1>Create a shortened URL</h1>
            <p>Shortened URLs expire after {ttl} days.</p>

            <form id="create-form" onSubmit={onClickSubmit}>
                <label>
                    <div className="input-header">Shortened URL</div>
                    <div className="link-flex">
                        <span className="prefix">{window.location.origin}/</span>
                        <input name="alias_path" className="alias_path" type="text" placeholder="custom token" required />
                        <div className="note">only alphanumeric and URL-safe symbols except slash (/)</div>
                    </div>
                </label>
                <label>
                    <div className="input-header">Destination URL</div>
                    <input name="dest" className="dest" type="url" placeholder="https://example.com" required />
                </label>

                <button type="submit">Create / Update Link</button>
            </form>

            <div id="status" aria-live="polite">
                {status}
                <a href={short}>{short}</a>
            </div>
        </main>
    )
}

