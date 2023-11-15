import {renderToReadableStream} from "react-dom/server";
import Home from "../pages/home";

function HandleFrontend(req: Request, resolve, reject): Promise<Response> {
    const url = new URL(req.url);
    return new Promise(async () => {
        if (url.pathname === "/") {
            const stream = await renderToReadableStream(<Home/>);
            resolve(new Response(stream, {
                headers: { "Content-Type": "text/html" },
            }));
            console.log("resolved")
        }
    });
}

export default HandleFrontend;