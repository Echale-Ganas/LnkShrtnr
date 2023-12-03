import {renderToReadableStream} from "react-dom/server";
import Home from "../pages/home";
import Login from "../pages/login";
import Admin from "../pages/admin";
import CreateLink from "../pages/createLink";
import {DbInterface, Shortcut} from "./database/dbInterface";
import {Authenticator} from "./authentication";

function HandleFrontend(req: Request, dbConnection: DbInterface, auth: Authenticator, resolve, reject): Promise<Response> {
    const url = new URL(req.url);
    return new Promise(async () => {
        if (url.pathname === "/") {
            const stream = await renderToReadableStream(<Home/>);
            resolve(new Response(stream, {
                headers: { "Content-Type": "text/html" },
            }));
        } else if (url.pathname === "/login") {
            const stream = await renderToReadableStream(<Login/>);
            resolve(new Response(stream, {
                headers: { "Content-Type": "text/html" },
            }));
        } else if (url.pathname === "/admin") {
            let shortcuts: Shortcut[] = await dbConnection.getAllShortcuts();
            const stream = await renderToReadableStream(<Admin rawShortcuts={shortcuts}/>);
            resolve(new Response(stream, {
                headers: { "Content-Type": "text/html" },
            }));
        } else if (url.pathname === "/create") {
            const stream = await renderToReadableStream(<CreateLink/>);
            resolve(new Response(stream, {
                headers: { "Content-Type": "text/html" },
            }));
        }
    });
}

export default HandleFrontend;