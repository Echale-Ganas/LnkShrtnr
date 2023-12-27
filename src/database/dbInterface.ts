export class Shortcut {
    shortPath: string;
    longPath: string;
    title?: string;
    hits?: number;

    constructor(shortPath: string, longPath: string, title?: string, hits?: number) {
        this.shortPath = shortPath;
        this.longPath = longPath;
        this.title = title;
        this.hits = hits;
    }
}

export interface DbInterface {

    findShortcut(shortPath: string): Promise<Shortcut>;
    addShortcut(shortcut: Shortcut): Promise<boolean>;
    getAllShortcuts(): Promise<Shortcut[]>;
    deleteShortcut(shortPath: string): void;
    incrementHits(shortcut: Shortcut): void;
    logAnalytics(analyticsObj: any): void;

}