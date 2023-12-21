export class Authenticator {

    private loginHash: string;
    private authHash: string;

    constructor(loginHash: string, authHash: string) {
        this.loginHash = loginHash;
        this.authHash = authHash;
    }

    authenticate(toCheck: string): boolean {
        return Bun.password.verifySync(toCheck, this.loginHash);
    }

    isValidCredential(credential: string): boolean {
        return credential === this.authHash;
    }

    isValidCookie(cookie: string): boolean {
        let cookieSplit = cookie.split("; ");
        let cookieMap = {};
        for (let i = 0; i < cookieSplit.length; i++) {
            let kvPair = cookieSplit[i].split("=");
            cookieMap[kvPair[0]] = kvPair[1];
        }
        if (cookieMap["credential"]) {
            return this.isValidCredential(cookieMap["credential"]);
        }
        return false;
    }



}