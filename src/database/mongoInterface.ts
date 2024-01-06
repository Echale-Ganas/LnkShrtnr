// @ts-ignore
import { Collection, MongoClient, ServerApiVersion } from "mongodb";
import { DbInterface, Shortcut } from "./dbInterface";

export class MongoInterface implements DbInterface {
    private shortcuts: Collection<Document>;
    private analytics: Collection<Document>;
    private client: MongoClient;

    constructor(mongoURI: string, dbName: string) {
        this.client = new MongoClient(mongoURI, {
            serverApi: {
              version: ServerApiVersion.v1,
              strict: true,
              deprecationErrors: true,
            },
        });
        this.client.connect().then((connection: any) => {
            const db = connection.db(dbName);
            this.shortcuts = db.collection("Shortcuts");
            this.analytics = db.collection("Analytics");
            this.shortcuts.createIndex( { "shortPath": 1 }, { unique: true } )
        });
    }

    runMigrations() {
        return;
    }

    closeConnection() {
        this.client.close();
    }

    addShortcut(shortcut: Shortcut): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let shortcutObj: any = {
                shortPath: shortcut.shortPath,
                longPath: shortcut.longPath,
            };
            if (shortcut.title) shortcutObj["title"] = shortcut.title;
            this.shortcuts.insertOne(shortcutObj).then(() => {
                resolve(true);
            }).catch(() => {
                reject(false);
            });
        });
    }

    findShortcut(shortPath: string): Promise<Shortcut> {
        return new Promise((resolve, reject) => {
            let query = { shortPath: shortPath };
            this.shortcuts.findOne(query).then((result: any) => {
                if (result != null) {
                    let found = new Shortcut(shortPath, result.longPath);
                    if (result.title) found.title = result.title;
                    if (result.hits) found.hits = result.hits;
                    resolve(found);
                } else {
                    reject(undefined);
                }
            }).catch(() => {
                reject(undefined);
            });
        });
    }

    logAnalytics(analyticsObj: any): void {
        this.analytics.insertOne(analyticsObj);
    }

    incrementHits(shortcut: Shortcut): void {
        let updateQuery;
        if (shortcut.hits) updateQuery = {$inc: {hits: 1}};
        else updateQuery = {$set: {hits: 1}};
        this.shortcuts.updateOne(
            {shortPath: shortcut},
            updateQuery
        );
    }

    async getAllShortcuts(): Promise<Shortcut[]> {
        let allShortcuts: Shortcut[] = [];
        let query = await this.shortcuts.find({}).sort({}).toArray();
        query.forEach((e: any) => {
            let shortcut = new Shortcut(e.shortPath, e.longPath);
            if (e.hits) shortcut.hits = e.hits;
            if (e.title) shortcut.title = e.title;
            allShortcuts.push(shortcut);
        });
        return Promise.resolve(allShortcuts);
    }

    deleteShortcut(shortPath: string): void {
        this.shortcuts.deleteOne({shortPath: shortPath});
    }
}
