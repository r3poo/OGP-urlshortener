import { type SubmitEvent, useState } from "react";
import './styling.css'

export function Page() {
    const [status, setStatus] = useState('Ready')
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
            }).then(res => {
                // return if response is ok, successful
                if (res.status===200) {
                    setStatus(`URL available at: `)
                    setShort(window.location.origin + "/url/" + alias_path)
                } else {
                    return res.text()
                }
            }).then(text => {
                // change status if text is returned (code not 200)
                if (text!=null) {
                    setStatus(text)
                    setShort('')
                }
            })
        } catch {
            setStatus("Error: service unavailable")
            setShort('')
            // chain reset with useEffect?
        }
    }

    return (
        <main className="panel">
            <h1>Create a shortened URL</h1>
            <p>Set your short path and destination URL.</p>

            <form id="create-form" onSubmit={onClickSubmit}>
                <label>
                    Shortened URL
                    <div className="link-line">
                        <span className="prefix">{window.location.origin}/</span>
                        <input name="alias_path" className="alias_path" type="text" placeholder="my-link" required />
                        <div className="note">Allowed path chars: letters, numbers, and URL-safe symbols except slash (/).</div>
                    </div>
                </label>
                <label>
                    Destination URL
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

