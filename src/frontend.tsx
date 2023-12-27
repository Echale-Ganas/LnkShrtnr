import {renderToReadableStream} from "react-dom/server";
import Home from "../pages/home";
import Login from "../pages/login";
import Admin from "../pages/admin";
import CreateLink from "../pages/createLink";
import {DbInterface, Shortcut} from "./database/dbInterface";
import {Authenticator} from "./authentication";
import {checkIfAuthorized, getInternalRedirect} from "./index";

function isLoggedIn(req, auth, resolve): boolean {
    if (req.headers.has("cookie") && auth.isValidCookie(req.headers.get("cookie"))) {
        resolve(new Response(getInternalRedirect("admin"), {
            headers: {
                "Content-Type": "text/html"
            }
        }));
        return true;
    }
    return false;
}

async function HandleFrontend(req: Request, dbConnection: DbInterface, auth: Authenticator, resolve, reject): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/") {
        if (isLoggedIn(req, auth, resolve)) return;
        const stream = await renderToReadableStream(<Home/>);
        resolve(new Response(stream, {
            headers: { "Content-Type": "text/html" },
        }));
    } else if (url.pathname === "/login") {
        if (isLoggedIn(req, auth, resolve)) return;
        const stream = await renderToReadableStream(<Login/>);
        resolve(new Response(stream, {
            headers: { "Content-Type": "text/html" },
        }));
    } else if (url.pathname === "/admin") {
        if (!checkIfAuthorized(req, resolve)) return;
        let shortcuts: Shortcut[] = await dbConnection.getAllShortcuts();
        console.log(shortcuts)
        const stream = await renderToReadableStream(<Admin rawShortcuts={shortcuts}/>);
        resolve(new Response(stream, {
            headers: { "Content-Type": "text/html" },
        }));
    } else if (url.pathname === "/create") {
        if (!checkIfAuthorized(req, resolve)) return;
        const stream = await renderToReadableStream(<CreateLink/>);
        resolve(new Response(stream, {
            headers: { "Content-Type": "text/html" },
        }));
    }
}

export default HandleFrontend;