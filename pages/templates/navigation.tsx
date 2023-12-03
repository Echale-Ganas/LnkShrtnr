import React from "react";

function Navigation({currentPage}) {
    return <div id="navigation">
        <div id="navBar">
            <h1>LnkShrtnr</h1>
            <ul>
                <li><a href="/admin">Admin</a></li>
                <li><a href="/create">Create New Link</a></li>
                <li><a href="/logout">Logout</a></li>
            </ul>
        </div>
    </div>;
}

export default Navigation;