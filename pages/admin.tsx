import React from "react";
import Navigation from "./templates/navigation";
import FullContainer from "./templates/fullContainer";

function Admin({rawShortcuts}) {
    const shortcuts = rawShortcuts.map((link) =>
        <div className="shortcut">
            <h1>/{link.shortPath} => <a href={link.longPath}>{link.longPath.length > 40 ? link.longPath.substring(0, 40) : link.longPath}</a></h1>
            <p>Hits: {link.hits}</p>
        </div>
    );

    return <FullContainer title="Admin">
        <Navigation currentPage="admin"/>
        <div id="shortcutContainer">
            {shortcuts}
        </div>
    </FullContainer>;
}

export default Admin;