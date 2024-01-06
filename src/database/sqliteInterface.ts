import {AnalyticsObject, DbInterface, Shortcut} from "./dbInterface";
import {Database, Statement} from "bun:sqlite";

export class SqliteInterface implements DbInterface {

    private db: Database;
    private addQuery: Statement;
    private findQuery: Statement;
    private updateHitsQuery: Statement;
    private getAllQuery: Statement;
    private deleteQuery: Statement;
    private logQueryNoParams: Statement;
    private logQueryWParams: Statement;

    constructor() {
        this.db = new Database("storage.sqlite");
    }

    runMigrations() {
        /**
         * Setting WAL for performance. This will only really matter if you're
         * logging analytics (and hits/sec are significant).
         */
        this.db.exec("PRAGMA journal_mode = WAL;");

        this.db.run(`CREATE TABLE IF NOT EXISTS Shortcuts (
            shortPath VARCHAR(255) NOT NULL,
            longPath TEXT NOT NULL,
            title TEXT,
            hits INT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (shortPath)
        )`);

        this.db.run(`CREATE TABLE IF NOT EXISTS Analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path VARCHAR(255) NOT NULL,
            params TEXT OPTIONAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        this.createQueries();
    }

    private createQueries() {
        this.addQuery = this.db.query(`INSERT INTO Shortcuts (shortPath, longPath, title, hits) VALUES ($shortPath, $longPath, $title, $hits);`);
        this.findQuery = this.db.query(`SELECT * FROM Shortcuts WHERE shortPath = $shortPath;`);
        this.updateHitsQuery = this.db.query(`UPDATE Shortcuts SET hits = hits + 1 WHERE shortPath = $shortPath;`);
        this.getAllQuery = this.db.query(`SELECT * FROM Shortcuts ORDER BY createdAt DESC;`);
        this.deleteQuery = this.db.query(`DELETE FROM Shortcuts WHERE shortPath = $shortPath;`);
        this.logQueryNoParams = this.db.query(`INSERT INTO Analytics (path, timestamp) VALUES ($path, $timestamp);`);
        this.logQueryWParams = this.db.query(`INSERT INTO Analytics (path, timestamp, params) VALUES ($path, $timestamp, $params);`);
    }

    closeConnection() {
        this.db.close();
    }

    addShortcut(shortcut: Shortcut): Promise<boolean> {
        return new Promise((resolve) => {
            this.addQuery.run({
                $shortPath: shortcut.shortPath,
                $longPath: shortcut.longPath,
                $title: shortcut.title,
                $hits: shortcut.hits || 0
            });
            resolve(true);
        });
    }

    findShortcut(shortPath: string): Promise<Shortcut> {
        return new Promise((resolve, reject) => {
            let result: any = this.findQuery.get({ $shortPath: shortPath });
            if (!result) reject();
            resolve(new Shortcut(result.shortPath, result.longPath, result.title, result.hits));
        });
    }

    logAnalytics(analyticsObj: AnalyticsObject): void {
        if (analyticsObj.params) {
            this.logQueryWParams.get({
                $path: analyticsObj.path,
                $timestamp: analyticsObj.timestamp,
                $params: analyticsObj.params.toString()
            });
        } else {
            this.logQueryNoParams.run({
                $path: analyticsObj.path,
                $timestamp: analyticsObj.timestamp
            });
        }
    }

    incrementHits(shortcut: Shortcut): void {
        this.updateHitsQuery.run({
            $shortPath: shortcut.shortPath
        });
    }

    getAllShortcuts(): Promise<Shortcut[]> {
        return new Promise((resolve) => {
            let queryResult = this.getAllQuery.all();
            let shortcuts: Shortcut[] = [];
            queryResult.forEach((e: any) => {
                shortcuts.push(new Shortcut(e.shortPath, e.longPath, e.title, e.hits));
            })
            resolve(shortcuts);
        });
    }

    deleteShortcut(shortPath: string): void {
        this.deleteQuery.run({
            $shortPath: shortPath
        })
    }

}