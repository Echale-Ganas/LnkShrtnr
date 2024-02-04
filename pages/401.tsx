import React from "react";
import FullContainer from "./templates/fullContainer";
import PageContainer from "./templates/pageContainer";

function Error401() {
    return <FullContainer>
        <PageContainer>
            <p>Sorry! You're trying to access unauthorized pages. <a href="/login">Login here.</a></p>
        </PageContainer>
    </FullContainer>;
}

export default Error401;