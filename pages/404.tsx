import React from "react";
import FullContainer from "./templates/fullContainer";
import PageContainer from "./templates/pageContainer";

function Error404() {
    return <FullContainer>
        <PageContainer>
            <p>The page you were looking for was not found.</p>
        </PageContainer>
    </FullContainer>;
}

export default Error404;