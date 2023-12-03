import React from "react";

function FullContainer({title, children}) {
    return <html>
        <head>
            <title>{title}</title>
            <link rel="stylesheet" type="text/css" href="/styles.css"/>
        </head>
        <body>
            <div id="fullContainer">
                {children}
            </div>
        </body>
        </html>;
}

export default FullContainer;