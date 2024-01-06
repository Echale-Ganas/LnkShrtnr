import {renderToReadableStream} from "react-dom/server";
import Error401 from "../pages/401";
import Error404 from "../pages/404";

export async function unauthorizedPage(): Promise<Response> {
    const stream = await renderToReadableStream(<Error401/>);
    return new Response(stream, {
        status: 401,
        headers: { "Content-Type": "text/html",  },
    });
}

export async function pageNotFound(): Promise<Response> {
    const stream = await renderToReadableStream(<Error404/>);
    return new Response(stream, {
        status: 404,
        headers: { "Content-Type": "text/html",  },
    });
}