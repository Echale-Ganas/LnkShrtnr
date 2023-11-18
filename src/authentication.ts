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
        let kvPair = cookie.split("=");
        return this.isValidCredential(kvPair[1]);
    }

}