import HandleFrontend from "./frontend";
import {AnalyticsObject, DbInterface, Shortcut} from "./database/dbInterface";
import {MongoInterface} from "./database/mongoInterface";
import {SqliteInterface} from "./database/sqliteInterface";
import { Authenticator } from "./authentication";
import {pageNotFound, unauthorizedPage} from "./common";

let config: any;

// Look for local config file before presets.
try {
    config = await Bun.file("./config.local.json").json();
} catch {
    config = await Bun.file("./config.json").json();
}

let dbConnection: DbInterface;

if (config["db_connection_type"] === "mongodb") {
    const mongoURI = encodeURI(config["mongo_uri"] || ""); // Remember to provide a MONGO_URI in the config.json file
    const dbName = config["mongo_database"] || "Database"; // Remember to provide a DB_NAME in the config.json file
    dbConnection = new MongoInterface(mongoURI, dbName);
} else {
    dbConnection = new SqliteInterface();
}
dbConnection.runMigrations();
let passwordHashed: string = await Bun.password.hash(config["password"]);
let hashedPassword: string = Bun.hash(config["password"]).toString();
const auth: Authenticator = new Authenticator(passwordHashed, hashedPassword);

/**
 * Often times, bots and scrapers (and sometimes ourselves!) will ping some of the
 * following path schemas. We don't care about these and will not include them in
 * analytics if they fall into any of the categories.
 * @param path The URL that is being queried.
 * @returns if the path should be excluded from analytics or not.
 */
function isExcludedFromAnalytics(path: string): boolean {
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

function shouldDenyServe(path: string): boolean {
    return path === "/.env"
        || /.*(git).*/.test(path)
        || /.*(owa).*/.test(path)
        || /.*(well-known).*/.test(path)
        || path === "/remote/fgt_lang"
        || path === "/robots.txt"
        || path === "/wp-login.php";
}

function isFrontendPage(path: string): boolean {
    return path === "/" || path === "/admin" || path === "/login" || path === "/create";
}

export function getInternalRedirect(path: string): string {
    return `<html><script type="text/javascript">window.location.replace("/${path}")</script></html>`;
}

export function checkIfAuthorized(req: Request, resolve: any): boolean {
    if (!req.headers.has("cookie") || !auth.isValidCookie(req.headers.get("cookie"))) {
        resolve(unauthorizedPage());
        return false;
    }
    return true;
}

function processRequest(req: Request): Promise<Response> {
    const url: URL = new URL(req.url);
    return new Promise<Response>(async (resolve, reject) => {
        if (shouldDenyServe(url.pathname)) {
            resolve(new Response("Sorry! You're trying to access unauthorized pages.", {
                status: 401
            }));
            return;
        }
        if (url.pathname === "/styles.css") {
            resolve(new Response(Bun.file("./assets/styles.css")));
            return;
        }
        if (req.method.toLowerCase() === "post") {
            if (url.pathname === "/create") {
                if (!checkIfAuthorized(req, resolve)) return;
                let createFormData: FormData = await req.formData();
                if (!createFormData || !createFormData.has("shortPath") || !createFormData.has("longPath")) {
                    resolve(new Response(`Cannot process this request due to missing information.<a href="/create">Go back</a>`, {
                        status: 400,
                        headers: {
                            "content-type": "html"
                        }
                    }));
                    return;
                }
                let shortcutObj = new Shortcut(createFormData.get("shortPath").toString(), createFormData.get("longPath").toString());
                if (createFormData.has("title")) shortcutObj["title"] = createFormData.get("title").toString();

                dbConnection.addShortcut(shortcutObj).then(() => {
                    resolve(new Response(getInternalRedirect("admin"), {
                        headers: {
                            "Content-Type": "text/html"
                        }
                    }));
                }).catch(() => {
                    resolve(new Response("could not add", {
                        status: 500
                    }))
                }
                );
            } else if (url.pathname === "/login") {
                let createFormData: FormData = await req.formData();
                if (createFormData.has("username") && createFormData.has("password") &&
                    createFormData.get("username") === config["username"]) {
                    if (auth.authenticate(createFormData.get("password"))) {
                        resolve(new Response(getInternalRedirect("admin"), {
                            headers: {
                                "Content-Type": "text/html",
                                "Set-Cookie": `credential=${Bun.hash(createFormData.get("password"))}`
                            }
                        }));
                        return;
                    }
                }
                resolve(await unauthorizedPage());
            }
        } else {
            if (isFrontendPage(url.pathname)) {
                await HandleFrontend(req, dbConnection, auth, resolve, reject);
                return;
            } else if (url.pathname === "/logout") {
                resolve(new Response(getInternalRedirect(""), {
                    headers: {
                        "Content-Type": "text/html",
                        "Set-Cookie": `credential=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT`
                    }
                }));
                return;
            } else if (url.pathname === "/delete") {
                if (url.searchParams && url.searchParams.size && url.searchParams.has("shortPath")) {
                    await dbConnection.deleteShortcut(url.searchParams.get("shortPath"));
                    resolve(new Response(getInternalRedirect("admin"), {
                        headers: {
                            "Content-Type": "text/html"
                        }
                    }));
                    return;
                }
            } else {
                let shortcut = url.pathname.slice(1).trim().toLowerCase();
                dbConnection.findShortcut(shortcut).then((result) => {
                    if (!result) {
                        throw new Error();
                    }
                    let title = result.title || url.pathname.slice(1);
                    resolve(new Response(`<html><head><title>${title}</title></head>
                        <script type="text/javascript">window.location.replace("${result.longPath}")</script>
                    </html>`, {
                        headers: {
                            "Content-Type": "text/html",
                        },
                    }));
                    dbConnection.incrementHits(result);
                    return;
                }).catch(async (error) => {
                    resolve(await pageNotFound());
                })
            }
        }
    }).finally(() => {
        if (config["collect_detailed_analytics"] && !isExcludedFromAnalytics(url.pathname)) {
            let analyticObj: AnalyticsObject = new AnalyticsObject(
                url.pathname,
                Date.now()
            )
            if (url.searchParams && url.searchParams && url.searchParams.size) analyticObj.params = url.searchParams;
            dbConnection.logAnalytics(analyticObj);
        }
    })
}


const server = Bun.serve({
    port: process.env.PORT || 3030,
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

process.on("exit", () => {
    server.stop();
    dbConnection.closeConnection();
    process.exit();
});

console.log(`Serving on ${server.port}`);