import {DbInterface, Shortcut} from "./dbInterface";
import {Database, Statement} from "bun:sqlite";

export class SqliteInterface implements DbInterface {

    private db: Database;
    private addQuery: Statement;
    private findQuery: Statement;
    private updateHitsQuery: Statement;
    private getAllQuery: Statement;
    private deleteQuery: Statement;

    constructor() {

        this.db = new Database("storage.sqlite");
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

        this.addQuery = this.db.query(`INSERT INTO Shortcuts (shortPath, longPath, title, hits) VALUES ($shortPath, $longPath, $title, $hits);`);
        this.findQuery = this.db.query(`SELECT * FROM Shortcuts WHERE shortPath = $shortPath;`);
        this.updateHitsQuery = this.db.query(`UPDATE Shortcuts SET hits = hits + 1 WHERE shortPath = $shortPath;`);
        this.getAllQuery = this.db.query(`SELECT * FROM Shortcuts;`);
        this.deleteQuery = this.db.query(`DELETE FROM Shortcuts WHERE shortPath = $shortPath`);
    }

    addShortcut(shortcut: Shortcut): Promise<boolean> {
        return new Promise((resolve, reject) => {
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
            let result = this.findQuery.get({ $shortPath: shortPath });
            resolve(new Shortcut(result.shortPath, result.longPath, result.title, result.hits));
        });
    }

    logAnalytics(analyticsObj: any): void {
    }

    incrementHits(shortPath: string): void {
        this.updateHitsQuery.run({
            $shortPath: shortPath
        });
    }

    getAllShortcuts(): Promise<Shortcut[]> {
        return new Promise((resolve) => {
            let queryResult = this.getAllQuery.all();
            let shortcuts = [];
            queryResult.forEach((e) => {
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