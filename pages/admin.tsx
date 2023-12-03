import React from "react";
import Navigation from "./templates/navigation";
import FullContainer from "./templates/fullContainer";

function Admin({rawShortcuts}) {
    let shortcuts;
    if (!rawShortcuts || !rawShortcuts.length) {
        shortcuts = <h1>No shortcuts yet. <a style={{color: "var(--platinum)"}} href="/create">Create one now.</a></h1>;
    } else {
        shortcuts = rawShortcuts.map((link) =>
            <div className="shortcut">
                <p style={{display: "inline"}}>Shortcut</p>
                <a className="button" href={`/delete?shortPath=${link.shortPath}`} style={{float: "right"}}>Delete</a>
                <h2>/{link.shortPath} => <a href={link.longPath}>{link.longPath.length > 40 ? link.longPath.substring(0, 40) : link.longPath}</a></h2>
                <p>Hits: {link.hits}</p>
            </div>
        );
    }


    return <FullContainer title="Admin">
        <Navigation currentPage="admin"/>
        <div id="shortcutContainer">
            {shortcuts}
        </div>
    </FullContainer>;
}

export default Admin;