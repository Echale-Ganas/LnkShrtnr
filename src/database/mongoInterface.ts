import {MongoClient, ServerApiVersion} from "mongodb";
import {DbInterface, Shortcut} from "./dbInterface";

export class MongoInterface implements DbInterface {

    private shortcuts;
    private analytics;

    constructor(mongoURI: string, dbName: string) {

        const client = new MongoClient(mongoURI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        const connection = client.connect().then(() => {
            const db = connection.db(dbName).then(() => {
                this.shortcuts = db.collection("Shortcuts");
                this.analytics = db.collection("Analytics");
            });
        });
    }

    addShortcut(shortcut: Shortcut): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let shortcutObj = {
                shortPath: shortcut.shortPath,
                longPath: shortcut.longPath
            }
            if (shortcut.title) shortcutObj["title"] = shortcut.title;
            this.shortcuts.insertOne(shortcutObj).then(() => {
                resolve(true)
            }).catch(() => {
                reject(false);
            });
        });
    }

    findShortcut(shortPath: string): Promise<Shortcut> {
        return new Promise((resolve, reject) => {
            let query = {shortPath: shortPath};
            let result = this.shortcuts.findOne(query);
            if (result && result.longPath) {
                let found = new Shortcut(shortPath, result.longPath);
                if (result.title) found.title = result.title;
                if (result.hits) found.hits = result.hits;
                resolve(found);
            } else {
                reject(undefined);
            }
        })
    }

    logAnalytics(analyticsObj: any): void {
        this.analytics.insertOne(analyticsObj);
    }

    incrementHits(shortPath: string): void {
        // let updateQuery;
        // if (result.hits) updateQuery = {$inc: {hits: 1}};
        // else updateQuery = {$set: {hits: 1}};
        // await shortcuts.updateOne(
        //     {shortPath: shortcut},
        //     updateQuery
        // );
    }

    getAllShortcuts(): Promise<Shortcut[]> {
        return Promise.resolve([]);
    }

    deleteShortcut(shortPath: string): void {
    }

}