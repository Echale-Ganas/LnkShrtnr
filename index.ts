import {MongoClient, ServerApiVersion} from "mongodb";

require('dotenv').config()

const mongoURI = encodeURI(<string> process.env.MONGO_URI); // Remember to provide a MONGO_URI in the .env file
const dbName = process.env.DB_NAME; // Remember to provide a DB_NAME in the .env file

const client = new MongoClient(mongoURI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const connection = await client.connect();
const db = await connection.db(dbName);
const shortcuts = db.collection("Shortcuts");
const analytics = db.collection("Analytics");

/**
 * Often times, bots and scrapers (and sometimes ourselves!) will ping some of the
 * following path schemas. We don't care about these and will not include them in
 * analytics if they fall into any of the categories.
 * @param path The URL that is being queried.
 * @returns if the path should be excluded from analytics or not.
 */
function isExcludedFromAnalytics(path): boolean {
    return path === "/favicon.ico"
        || /.*(css).*/.test(path)
        || path === "/.env"
        || /.*(git).*/.test(path)
        || /.*(owa).*/.test(path)
        || /.*(well-known).*/.test(path)
        || path === "/remote/fgt_lang"
        || path === "/robots.txt"
        || path === "/wp-login.php";
}

function shouldDenyServe(path): boolean {
    return /.*(css).*/.test(path)
        || path === "/.env"
        || /.*(git).*/.test(path)
        || /.*(owa).*/.test(path)
        || /.*(well-known).*/.test(path)
        || path === "/remote/fgt_lang"
        || path === "/robots.txt"
        || path === "/wp-login.php";
}

function processRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    return new Promise(async (resolve, reject) => {
        if (shouldDenyServe(url.pathname)) {
            reject(new Response("Sorry! You're trying to access unauthorized pages."));
        }
        if (req.method.toLowerCase() === "post") {
            if (url.pathname === "/create") {
                let createFormData: FormData = await req.formData();
                if (!createFormData.has("shortPath") || !createFormData.has("longPath")) {
                    reject(new Response("Cannot process this request due to missing information", {
                        status: 400
                    }));
                    return;
                }
                let shortcutObj = {
                    shortPath: createFormData.get("shortPath"),
                    longPath: createFormData.get("longPath")
                };
                if (createFormData.has("title")) shortcutObj["title"] = createFormData.get("title");

                shortcuts.insertOne(shortcutObj).then(
                    resolve(new Response("success", {
                        status: 200
                    }))
                ).catch(() => {
                    reject(new Response("could not add", {
                        status: 500
                    }))
                }
                );
            }
        } else {
            if (url.pathname === "/") {
                let response = await fetch("localhost:3000/");
                resolve(new Response(await response.text(), {
                    headers: {
                        "Content-Type": "text/html",
                    }
                }));
            } else if (url.pathname === "/admin") {

            } else {
                let shortcut = url.pathname.slice(1).trim().toLowerCase();
                const query = {shortPath: shortcut};
                const result = await shortcuts.findOne(query);
                if (result && result.longPath) {

                    let title = result.title || url.pathname.slice(1);
                    resolve(new Response(`<html><head><title>${title}</title></head>
                            <script type="text/javascript">window.location.replace("${result.longPath}")</script>
                        </html>`, {
                        headers: {
                            "Content-Type": "text/html",
                        },
                    }));
                    let updateQuery;
                    if (result.hits) updateQuery = { $inc: { hits: 1 } };
                    else updateQuery = { $set: { hits: 1 } };

                    await shortcuts.updateOne(
                        {shortPath: shortcut},
                        updateQuery
                    );

                    return;
                }
                reject(new Response("Sorry, unable to find that link!"))
            }
        }
    }).finally(() => {
        if (!isExcludedFromAnalytics(url.pathname)) {
            let analyticObject = {
                "path": url.pathname,
                "timestamp": Date.now()
            };
            if (url.searchParams && Object.keys(url.searchParams).length) analyticObject["params"] = url.searchParams;
            analytics.insertOne(analyticObject);
        }
    })
}


const server = Bun.serve({
    port: 3030,
    fetch: processRequest,
    error(error) {
        console.log(error)
        return new Response(`<pre>Oops, we encountered an error. Sorry!</pre>`, {
            headers: {
                "Content-Type": "text/html",
            },
        });
    },
});

console.log(`Serving on ${server.port}`);