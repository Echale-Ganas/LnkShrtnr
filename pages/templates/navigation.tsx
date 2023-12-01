import React from "react";

function Navigation({currentPage}) {
    return <div id="navigation">
        <h1>LnkShrtnr</h1>
        <ul>
            <li><a href="/admin">Admin</a></li>
            <li><a href="/admin">Create New Link</a></li>
            <li><a href="/logout">Logout</a></li>
        </ul>
    </div>;
}

export default Navigation;