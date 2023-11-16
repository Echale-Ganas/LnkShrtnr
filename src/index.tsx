import React from "react";
import HandleFrontend from "./frontend";
import {DbInterface, Shortcut} from "./dbInterface";
import {MongoInterface} from "./mongoInterface";
import {SqliteInterface} from "./sqliteInterface";

require('dotenv').config()

let dbConnection: DbInterface;

if (false) {
    const mongoURI = encodeURI(process.env.MONGO_URI || ""); // Remember to provide a MONGO_URI in the .env file
    const dbName = process.env.DB_NAME || "Database"; // Remember to provide a DB_NAME in the .env file
    dbConnection = new MongoInterface(mongoURI, dbName);
} else {
    dbConnection = new SqliteInterface();
}


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

function isFrontendPage(path): boolean {
    return path === "/" || path === "/admin" || path === "/login";
}

function processRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    return new Promise(async (resolve, reject) => {
        if (shouldDenyServe(url.pathname)) {
            reject(new Response("Sorry! You're trying to access unauthorized pages.", {
                status: 401
            }));
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
                let shortcutObj = new Shortcut(createFormData.get("shortPath").toString(), createFormData.get("longPath").toString());
                if (createFormData.has("title")) shortcutObj["title"] = createFormData.get("title").toString();

                dbConnection.addShortcut(shortcutObj).then(() => {
                    resolve(new Response("success", {
                        status: 200
                    }))
                }).catch(() => {
                    reject(new Response("could not add", {
                        status: 500
                    }))
                }
                );
            } else if (url.pathname === "/login") {
                let createFormData: FormData = await req.formData();
                if (createFormData.has("username") && createFormData.has("password") &&
                    createFormData.get("username") === process.env.USERNAME && createFormData.get("password") === process.env.PASSWORD) {
                    resolve(new Response("verified", {
                        headers: {}
                    }))
                }
            }
        } else {
            if (isFrontendPage(url.pathname)) {
                return HandleFrontend(req, resolve, reject);
            } else {
                let shortcut = url.pathname.slice(1).trim().toLowerCase();
                dbConnection.findShortcut(shortcut).then((result) => {
                    let title = result.title || url.pathname.slice(1);
                    resolve(new Response(`<html><head><title>${title}</title></head>
                        <script type="text/javascript">window.location.replace("${result.longPath}")</script>
                    </html>`, {
                        headers: {
                            "Content-Type": "text/html",
                        },
                    }));
                    dbConnection.updateHits(shortcut);

                    return;
                }).catch((error) => {
                    reject(new Response("Sorry, unable to find that link!"))
                })
            }
        }
    }).finally(() => {
        if (!isExcludedFromAnalytics(url.pathname)) {
            let analyticObject = {
                "path": url.pathname,
                "timestamp": Date.now()
            };
            if (url.searchParams && Object.keys(url.searchParams).length) analyticObject["params"] = url.searchParams;
            dbConnection.logAnalytics(analyticObject);
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