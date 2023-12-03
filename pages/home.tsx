import React from "react";
import FullContainer from "./templates/fullContainer";
import PageContainer from "./templates/pageContainer";

function Home() {
    return <FullContainer title="Home">
            <PageContainer>
                <h1>Quick, short links.</h1>
                <a href="/login">Login</a>
            </PageContainer>
        </FullContainer>;
}

export default Home;