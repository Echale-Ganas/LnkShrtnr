import HandleFrontend from "./frontend";
import {DbInterface, Shortcut} from "./database/dbInterface";
import {MongoInterface} from "./database/mongoInterface";
import {SqliteInterface} from "./database/sqliteInterface";
import { Authenticator } from "./authentication";

require('dotenv').config()

const config = await Bun.file("./config.json").json();

let dbConnection: DbInterface;

if (config["db_connection_type"] === "mongodb") {
    const mongoURI = encodeURI(config["mongo_uri"] || ""); // Remember to provide a MONGO_URI in the .env file
    const dbName = config["mongo_database"] || "Database"; // Remember to provide a DB_NAME in the .env file
    dbConnection = new MongoInterface(mongoURI, dbName);
} else {
    dbConnection = new SqliteInterface();
}
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

function processRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    console.log(req);
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
                if (!req.headers.has("cookie") || !auth.isValidCookie(req.headers.get("cookie"))) {
                    resolve(new Response("Sorry! You're trying to access unauthorized pages.", {
                        status: 401
                    }));
                    return;
                }
                let createFormData: FormData = await req.formData();
                if (createFormData == undefined || createFormData == null || !createFormData.has("shortPath") || !createFormData.has("longPath")) {
                    resolve(new Response("Cannot process this request due to missing information", {
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
                        resolve(new Response(`<html>
                                <script type="text/javascript">window.location.replace("/admin")</script>
                            </html>`, {
                            headers: {
                                "Content-Type": "text/html",
                                "Set-Cookie": `credential=${Bun.hash(createFormData.get("password"))}`
                            }
                        }));
                        return;
                    }
                }
                resolve(new Response("wrong credentials", {
                    status: 401
                }));
            }
        } else {
            if (isFrontendPage(url.pathname)) {
                return HandleFrontend(req, resolve, reject);
            } else if (url.pathname === "/logout") {
                resolve(new Response(`<html>
                        <script type="text/javascript">window.location.replace("/")</script>
                    </html>`, {
                    headers: {
                        "Content-Type": "text/html",
                        "Set-Cookie": ``
                    }
                }));
                return;

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
                    dbConnection.incrementHits(shortcut);

                    return;
                }).catch((error) => {
                    resolve(new Response("Sorry, unable to find that link!"))
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