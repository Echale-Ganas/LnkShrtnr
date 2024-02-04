// @ts-ignore
import { Collection, MongoClient, ServerApiVersion } from "mongodb";
import { DbInterface, Shortcut } from "./dbInterface";

export class MongoInterface implements DbInterface {
  private shortcuts: Collection<Document>;
  private analytics: Collection<Document>;

  constructor(mongoURI: string, dbName: string) {
    const client = new MongoClient(mongoURI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    client.connect().then((connection) => {
      const db = connection.db(dbName);
      this.shortcuts = db.collection("Shortcuts");
      this.analytics = db.collection("Analytics");
    });
  }

  addShortcut(shortcut: Shortcut): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let shortcutObj = {
        shortPath: shortcut.shortPath,
        longPath: shortcut.longPath,
      };
      if (shortcut.title) shortcutObj["title"] = shortcut.title;
      this.shortcuts
        .insertOne(shortcutObj)
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          reject(false);
        });
    });
  }

  findShortcut(shortPath: string): Promise<Shortcut> {
    return new Promise((resolve, reject) => {
      let query = { shortPath: shortPath };
      let result = this.shortcuts.findOne(query);
      if (result != null) {
        let found = new Shortcut(shortPath, result.longPath);
        if (result.title) found.title = result.title;
        if (result.hits) found.hits = result.hits;
        resolve(found);
      } else {
        reject(undefined);
      }
    });
  }

  logAnalytics(analyticsObj: any): void {
    this.analytics.insertOne(analyticsObj);
  }

  incrementHits(shortPath: string): void {
    let query = { shortPath: shortPath };
    let result = this.shortcuts.findOne(query);
    if (result == null) {
      return;
    }

    console.log(result);
    let updateQuery = { $inc: { hits: 1 } };

    this.shortcuts.updateOne(query, updateQuery);

    // TODO: fix query and test that it works
    // let updateQuery;
    // if (result.hits) updateQuery = {$inc: {hits: 1}};
    // else updateQuery = {$set: {hits: 1}};
    // await shortcuts.updateOne(
    //     {shortPath: shortcut},
    //     updateQuery
    // );
  }

  async getAllShortcuts(): Promise<Shortcut[]> {
    // TODO: make the query for all shortcuts and return result
    let cur = this.shortcuts.find({});

    let sc: Dict<Shortcut> = {};

    for await (const a of cur as unknown as Shortcut[]) {
      sc[a.shortPath] = new Shortcut(a.shortPath, a.longPath, a.title, 0);
    }

    let anal_cur = this.analytics.find({});

    let final_analcuts: Shortcut[] = [];

    for await (const a of anal_cur) {
      let path: String = a.path;
      if (path == undefined) {
        continue;
      }

      let s = sc[path.slice(1)];
      if (s == undefined) {
        continue;
      }

      if (a.hits) {
        s!.hits = a.hits;
      } else {
        s.hits! += 1;
      }
    }

    Object.entries(sc).map((v, _) => {
      return v[1];
    });

    return Promise.resolve(
      Object.entries(sc).map((v, _) => {
        return v[1];
      }) as Shortcut[]
    );
    // like find shortcuts
    //create new objects
    //let found equals
    // resolve all shortcuts
  }

  deleteShortcut(shortPath: string): void {
    // TODO(@hailey): Delete the shortcut that matches the provided shortPath.
  }
}
